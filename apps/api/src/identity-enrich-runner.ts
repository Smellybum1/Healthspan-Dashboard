import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createArtgConnector,
  createDrugsAtFdaConnector,
  createFdaAemsConnector,
  createGsrsConnector,
  createOpenFdaLabelConnector,
  createPubChemConnector,
  createPurpleBookConnector,
  createRxNormConnector,
  type FetchTransport,
  type IdentityLookupResult,
} from '@healthspan/connectors';
import type { HealthspanDb } from '@healthspan/db';
import { interventionEntities } from '@healthspan/db';
import { eq } from 'drizzle-orm';
import {
  applyIdentityLookupToEntity,
  coverageFromLookup,
  defaultRegulatoryCoverage,
  type CoverageCell,
} from './identity-enrichment.js';
import { buildDossierSnapshot } from './dossier-service.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../packages/connectors/fixtures',
);

function readFixture(name: string) {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf8');
}

function fixtureTransport(map: Record<string, { body: string; contentType: string }>): FetchTransport {
  return async (input) => {
    const url = String(input);
    const key = Object.keys(map).find((k) => url.includes(k));
    if (!key) return new Response(`No fixture for ${url}`, { status: 404 });
    const hit = map[key]!;
    return new Response(hit.body, {
      status: 200,
      headers: { 'content-type': hit.contentType },
    });
  };
}

function mergeCoverage(cells: CoverageCell[]): CoverageCell[] {
  const base = defaultRegulatoryCoverage();
  const byId = new Map(base.map((c) => [c.sourceId, c]));
  for (const cell of cells) byId.set(cell.sourceId, cell);
  return [...byId.values()];
}

/**
 * Run identity/regulatory enrichment for one entity.
 * Default uses packaged fixtures (deterministic, no network).
 * Pass useNetwork=true only for intentional live smoke with reviewed names.
 */
export async function enrichEntityIdentity(
  db: HealthspanDb,
  entityId: string,
  opts?: { useNetwork?: boolean; query?: string },
) {
  const entity = db.select().from(interventionEntities).where(eq(interventionEntities.id, entityId)).all()[0];
  if (!entity) return null;
  const query = (opts?.query ?? entity.preferredName).trim();
  const useNetwork = opts?.useNetwork === true;

  const results: IdentityLookupResult[] = [];
  const applied: Array<ReturnType<typeof applyIdentityLookupToEntity> & { sourceId: string }> = [];

  if (!useNetwork) {
    const rxTransport = fixtureTransport({
      'rxcui.json': { body: readFixture('rxnorm-rxcui.json'), contentType: 'application/json' },
      properties: { body: readFixture('rxnorm-properties.json'), contentType: 'application/json' },
    });
    const pcTransport = fixtureTransport({
      '/cids/JSON': { body: readFixture('pubchem-cids.json'), contentType: 'application/json' },
      '/property/': { body: readFixture('pubchem-properties.json'), contentType: 'application/json' },
    });
    const gsTransport = fixtureTransport({
      substances: { body: readFixture('gsrs-substance.json'), contentType: 'application/json' },
    });
    const artgTransport = fixtureTransport({
      artg: { body: readFixture('artg-search-exact.html'), contentType: 'text/html' },
    });
    const aemsTransport = fixtureTransport({
      'fda.gov': { body: readFixture('fda-aems-quarter.html'), contentType: 'text/html' },
    });

    results.push(
      await createRxNormConnector({ transport: rxTransport, minIntervalMs: 0 }).lookup({
        query,
        mode: 'exact_name',
      }),
      await createPubChemConnector({ transport: pcTransport, minIntervalMs: 0 }).lookup({ query }),
      await createGsrsConnector({ transport: gsTransport, minIntervalMs: 0 }).lookup({
        query: '9100L32L2N',
        mode: 'unii',
      }),
      await createArtgConnector({ transport: artgTransport, minIntervalMs: 0 }).lookup({ query }),
      await createDrugsAtFdaConnector({
        products: JSON.parse(readFixture('drugs-at-fda-products.json')),
      }).lookup({ query }),
      await createPurpleBookConnector({ csvText: readFixture('purple-book.csv') }).lookup({ query }),
      await createFdaAemsConnector({ transport: aemsTransport, minIntervalMs: 0 }).lookup({ query }),
      await createOpenFdaLabelConnector({ apiKey: null }).lookup({ query }),
    );
  } else {
    results.push(
      await createRxNormConnector({ minIntervalMs: 1000 }).lookup({ query, mode: 'exact_name' }),
      await createPubChemConnector({ minIntervalMs: 1000 }).lookup({ query }),
      await createGsrsConnector({ minIntervalMs: 1000 }).lookup({ query }),
      await createArtgConnector({ minIntervalMs: 2000 }).lookup({ query }),
      await createDrugsAtFdaConnector({ products: [] }).lookup({ query }),
      await createPurpleBookConnector({ rows: [] }).lookup({ query }),
      await createFdaAemsConnector({ minIntervalMs: 2000 }).lookup({ query }),
      await createOpenFdaLabelConnector().lookup({ query }),
    );
  }

  for (const result of results) {
    const stats = applyIdentityLookupToEntity(db, entityId, result);
    applied.push({ sourceId: result.connectorId, ...stats });
  }

  const potentialSignals = results
    .filter((r) => r.connectorId === 'fda-aems')
    .flatMap((r) =>
      r.pages.map((p) => ({
        quarter: p.normalized.quarter,
        productOrClass: p.normalized.productOrClass,
        signalText: p.normalized.signalText,
        provenCausality: false,
        incidenceEstablished: false,
      })),
    );

  const coverage = mergeCoverage(results.map(coverageFromLookup));
  const dossier = buildDossierSnapshot(db, entityId, { coverage, potentialSignals });
  return {
    entityId,
    query,
    useNetwork,
    results: results.map((r) => ({
      connectorId: r.connectorId,
      matchKind: r.matchKind,
      ok: r.ok,
      pageCount: r.pages.length,
      approvalNeverInferred: r.approvalNeverInferred,
      warnings: r.warnings ?? [],
    })),
    applied,
    coverage,
    dossier,
  };
}
