import { createHash } from 'node:crypto';
import { createHttpClient } from './http.js';
import {
  identityResult,
  type IdentityConnector,
  type IdentityLookupQuery,
} from './identity-types.js';
import type {
  ConnectorFetchResult,
  ConnectorPage,
  FetchTransport,
  SourceConnector,
} from './types.js';

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

type GsrsSubstance = {
  uuid?: string;
  unii?: string;
  substanceClass?: string;
  names?: Array<{ name?: string; preferred?: boolean }>;
  structure?: { formula?: string; molWeight?: number };
  protein?: { subunits?: Array<{ sequence?: string }> };
  nucleicAcid?: unknown;
};

type GsrsSearchResponse = {
  content?: GsrsSubstance[];
  total?: number;
};

/**
 * GSRS / UNII identity — exact UNII trusted; name-only is candidate until unique.
 * Never invents sequence or modifications not supplied by the source.
 */
export function createGsrsConnector(
  opts: { transport?: FetchTransport; minIntervalMs?: number } = {},
): IdentityConnector & SourceConnector {
  const client = createHttpClient({
    transport: opts.transport,
    userAgent: 'HealthspanDashboard/0.2 (gsrs; local@invalid)',
    minIntervalMs: opts.minIntervalMs ?? 1000,
  });

  async function lookup(args: IdentityLookupQuery) {
    const fetchedAt = new Date().toISOString();
    const q = args.query.trim();
    if (!q) {
      return identityResult({
        connectorId: 'gsrs',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: 'identity_unresolved',
        pages: [],
        rawBodies: [],
      });
    }

    try {
      const rawBodies: ConnectorFetchResult['rawBodies'] = [];
      let substances: GsrsSubstance[] = [];

      if (args.mode === 'unii' || /^[A-Z0-9]{10}$/i.test(q)) {
        const url = `https://gsrs.ncats.nih.gov/ginas/app/api/v1/substances(${encodeURIComponent(q.toUpperCase())})`;
        const res = await client.request(url);
        const json = (await res.json()) as GsrsSubstance;
        rawBodies.push({
          bytes: Buffer.from(JSON.stringify(json), 'utf8'),
          mediaType: 'application/json',
          ext: 'json',
        });
        if (json.unii || json.uuid) substances = [json];
      } else {
        const url = `https://gsrs.ncats.nih.gov/ginas/app/api/v1/substances/search?q=${encodeURIComponent(
          `root_names_name:"${q}"`,
        )}&top=10`;
        const res = await client.request(url);
        const json = (await res.json()) as GsrsSearchResponse;
        rawBodies.push({
          bytes: Buffer.from(JSON.stringify(json), 'utf8'),
          mediaType: 'application/json',
          ext: 'json',
        });
        substances = json.content ?? [];
      }

      if (substances.length === 0) {
        return identityResult({
          connectorId: 'gsrs',
          fetchedAt,
          ok: true,
          query: args,
          matchKind: 'no_exact_match_found',
          pages: [],
          rawBodies,
        });
      }

      const pages: ConnectorPage[] = substances
        .slice(0, Math.min(args.recordCap ?? 10, 10))
        .map((s) => {
          const preferred =
            s.names?.find((n) => n.preferred)?.name ?? s.names?.[0]?.name ?? s.unii ?? 'unknown';
          const sequence = s.protein?.subunits?.[0]?.sequence ?? null;
          const normalized = {
            type: 'identity',
            scheme: 'unii',
            source: 'gsrs',
            unii: s.unii ?? null,
            uuid: s.uuid ?? null,
            preferredName: preferred,
            substanceClass: s.substanceClass ?? null,
            molecularFormula: s.structure?.formula ?? null,
            molecularWeight: s.structure?.molWeight != null ? String(s.structure.molWeight) : null,
            sequenceProvided: Boolean(sequence),
            sequence: sequence,
            approvalInferred: false,
            note: 'GSRS/UNII presence is substance identity only — not approval. Sequence stored only when source-supplied.',
          };
          return {
            externalId: s.unii ?? s.uuid ?? preferred,
            canonicalUrl: s.unii
              ? `https://gsrs.ncats.nih.gov/ginas/app/ui/substances/${s.unii}`
              : undefined,
            payload: s,
            normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
          };
        });

      const exactUnii = args.mode === 'unii' || /^[A-Z0-9]{10}$/i.test(q);
      const matchKind = exactUnii ? 'exact' : pages.length === 1 ? 'exact' : 'ambiguous';

      return identityResult({
        connectorId: 'gsrs',
        fetchedAt,
        ok: true,
        query: args,
        matchKind,
        pages,
        rawBodies,
        warnings: !exactUnii
          ? [
              'Name-only GSRS hits are candidates until uniqueness and type compatibility are reviewed.',
            ]
          : undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'GSRS lookup failed';
      const contractFailure = /unexpected|schema|parse|HTTP 5/i.test(message);
      return identityResult({
        connectorId: 'gsrs',
        fetchedAt,
        ok: false,
        query: args,
        matchKind: contractFailure ? 'parser_contract_failure' : 'source_unavailable',
        pages: [],
        rawBodies: [],
        errorMessage: message,
      });
    }
  }

  return {
    id: 'gsrs',
    name: 'GSRS / UNII',
    enabled: true,
    lookup,
    async fetchWindow({ cursor, recordCap }): Promise<ConnectorFetchResult> {
      const query = String(cursor.query ?? cursor.unii ?? '');
      const mode = (cursor.mode as IdentityLookupQuery['mode']) ?? 'exact_name';
      const result = await lookup({ query, mode, recordCap });
      return {
        connectorId: 'gsrs',
        fetchedAt: result.fetchedAt,
        ok: result.ok,
        pages: result.pages,
        rawBodies: result.rawBodies,
        errorMessage: result.errorMessage,
        warnings: result.warnings,
        nextCursor: { query, mode },
      };
    },
  };
}
