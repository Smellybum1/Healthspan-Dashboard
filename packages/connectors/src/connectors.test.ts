import { describe, expect, it } from 'vitest';
import { createPubmedConnector } from './pubmed.js';
import { createClinicalTrialsConnector } from './clinicaltrials.js';
import { createCrossrefConnector } from './crossref.js';
import { createTgaConnector } from './tga.js';
import { createRxNormConnector } from './rxnorm.js';
import { createPubChemConnector } from './pubchem.js';
import { createGsrsConnector } from './gsrs.js';
import { createArtgConnector } from './artg.js';
import { createOpenFdaLabelConnector } from './openfda.js';
import { createDrugsAtFdaConnector } from './drugs-at-fda.js';
import type { FetchTransport } from './types.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

function fixtureTransport(
  map: Record<string, { body: string; contentType: string }>,
): FetchTransport {
  return async (input) => {
    const url = String(input);
    const key = Object.keys(map).find((k) => url.includes(k));
    if (!key) {
      return new Response(`No fixture for ${url}`, { status: 404 });
    }
    const hit = map[key]!;
    return new Response(hit.body, {
      status: 200,
      headers: { 'content-type': hit.contentType },
    });
  };
}

function readFixture(name: string) {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf8');
}

describe('connectors with fixtures', () => {
  it('parses PubMed fixture window', async () => {
    const search = fs.readFileSync(path.join(fixturesDir, 'pubmed-esearch.json'), 'utf8');
    const fetchXml = fs.readFileSync(path.join(fixturesDir, 'pubmed-efetch.xml'), 'utf8');
    const transport = fixtureTransport({
      esearch: { body: search, contentType: 'application/json' },
      efetch: { body: fetchXml, contentType: 'application/xml' },
    });
    const connector = createPubmedConnector({ transport });
    const result = await connector.fetchWindow({ cursor: {}, lookbackDays: 30, recordCap: 5 });
    expect(result.ok).toBe(true);
    expect(result.pages.length).toBeGreaterThan(0);
    expect(result.pages[0]?.externalId).toMatch(/^\d+$/);
  });

  it('parses ClinicalTrials.gov fixture window', async () => {
    const body = fs.readFileSync(path.join(fixturesDir, 'clinicaltrials-studies.json'), 'utf8');
    const transport = fixtureTransport({
      'clinicaltrials.gov': { body, contentType: 'application/json' },
    });
    const connector = createClinicalTrialsConnector({ transport });
    const result = await connector.fetchWindow({ cursor: {}, lookbackDays: 30, recordCap: 5 });
    expect(result.ok).toBe(true);
    expect(result.pages.length).toBeGreaterThan(0);
    expect(result.pages[0]?.externalId.startsWith('NCT')).toBe(true);
  });

  it('parses Crossref DOI enrichment fixture', async () => {
    const body = fs.readFileSync(path.join(fixturesDir, 'crossref-work.json'), 'utf8');
    const transport = fixtureTransport({
      'api.crossref.org': { body, contentType: 'application/json' },
    });
    const connector = createCrossrefConnector({
      transport,
      dois: ['10.1234/example.doi'],
    });
    const result = await connector.fetchWindow({ cursor: {}, lookbackDays: 30, recordCap: 5 });
    expect(result.ok).toBe(true);
    expect(result.pages.length).toBe(1);
  });

  it('parses TGA RSS fixture feeds', async () => {
    const rss = fs.readFileSync(path.join(fixturesDir, 'tga-feed.xml'), 'utf8');
    const transport = fixtureTransport({
      'tga.gov.au': { body: rss, contentType: 'application/rss+xml' },
    });
    const connector = createTgaConnector({ transport });
    const result = await connector.fetchWindow({ cursor: {}, lookbackDays: 30, recordCap: 10 });
    expect(result.ok).toBe(true);
    expect(result.pages.length).toBeGreaterThan(0);
  });

  it('RxNorm exact-first lookup never infers approval', async () => {
    const transport = fixtureTransport({
      'rxcui.json': { body: readFixture('rxnorm-rxcui.json'), contentType: 'application/json' },
      properties: { body: readFixture('rxnorm-properties.json'), contentType: 'application/json' },
    });
    const result = await createRxNormConnector({ transport, minIntervalMs: 0 }).lookup({
      query: 'metformin',
      mode: 'exact_name',
    });
    expect(result.ok).toBe(true);
    expect(result.matchKind).toBe('exact');
    expect(result.approvalNeverInferred).toBe(true);
    expect(result.pages[0]?.normalized.rxcui).toBe('6809');
    expect(result.pages[0]?.normalized.approvalInferred).toBe(false);
  });

  it('PubChem enriches CID without treating presence as approval', async () => {
    const transport = fixtureTransport({
      '/cids/JSON': { body: readFixture('pubchem-cids.json'), contentType: 'application/json' },
      '/property/': {
        body: readFixture('pubchem-properties.json'),
        contentType: 'application/json',
      },
    });
    const result = await createPubChemConnector({ transport, minIntervalMs: 0 }).lookup({
      query: 'metformin',
    });
    expect(result.matchKind).toBe('exact');
    expect(result.pages[0]?.normalized.cid).toBe(4091);
    expect(result.pages[0]?.normalized.approvalInferred).toBe(false);
  });

  it('GSRS name search stays ambiguous when multiple substances return', async () => {
    const transport = fixtureTransport({
      '/search': {
        body: readFixture('gsrs-search-ambiguous.json'),
        contentType: 'application/json',
      },
    });
    const result = await createGsrsConnector({ transport, minIntervalMs: 0 }).lookup({
      query: 'metformin',
    });
    expect(result.matchKind).toBe('ambiguous');
    expect(result.pages).toHaveLength(2);
  });

  it('ARTG exact / none / ambiguous / parser-break semantics', async () => {
    const exact = await createArtgConnector({
      minIntervalMs: 0,
      transport: fixtureTransport({
        artg: { body: readFixture('artg-search-exact.html'), contentType: 'text/html' },
      }),
    }).lookup({ query: 'metformin' });
    expect(exact.matchKind).toBe('exact');
    expect(exact.pages[0]?.normalized.artgId).toBe('180628');
    expect(exact.pages[0]?.normalized.licenceStandingNormalized).toBe('included_or_authorised');

    const none = await createArtgConnector({
      minIntervalMs: 0,
      transport: fixtureTransport({
        artg: { body: readFixture('artg-search-none.html'), contentType: 'text/html' },
      }),
    }).lookup({ query: 'zzznomatch' });
    expect(none.matchKind).toBe('no_exact_match_found');
    expect(none.warnings?.[0]).toMatch(/not unapproved/i);

    const ambiguous = await createArtgConnector({
      minIntervalMs: 0,
      transport: fixtureTransport({
        artg: { body: readFixture('artg-search-ambiguous.html'), contentType: 'text/html' },
      }),
    }).lookup({ query: 'metformin' });
    expect(ambiguous.matchKind).toBe('ambiguous');

    const broken = await createArtgConnector({
      minIntervalMs: 0,
      transport: fixtureTransport({
        artg: { body: readFixture('artg-parser-break.html'), contentType: 'text/html' },
      }),
    }).lookup({ query: 'metformin' });
    expect(broken.matchKind).toBe('parser_contract_failure');
    expect(broken.ok).toBe(false);
  });

  it('openFDA is healthy when key-disabled and omits dosage ingestion when enabled', async () => {
    const disabled = await createOpenFdaLabelConnector({ apiKey: null }).lookup({
      query: 'metformin',
    });
    expect(disabled.matchKind).toBe('disabled');
    expect(disabled.ok).toBe(true);

    const enabled = await createOpenFdaLabelConnector({
      apiKey: 'test-key',
      minIntervalMs: 0,
      transport: fixtureTransport({
        'api.fda.gov': { body: readFixture('openfda-label.json'), contentType: 'application/json' },
      }),
    }).lookup({ query: 'metformin' });
    expect(enabled.matchKind).toBe('exact');
    expect(enabled.pages[0]?.normalized.dosageAndAdministrationIngested).toBe(false);
    expect(enabled.pages[0]?.normalized.approvalInferred).toBe(false);
    expect(JSON.stringify(enabled.pages[0]?.payload)).not.toMatch(/dosage_and_administration/i);
  });

  it('Drugs@FDA reports not_checked until catalog loaded, then exact hits', async () => {
    const empty = await createDrugsAtFdaConnector({ products: [] }).lookup({ query: 'metformin' });
    expect(empty.matchKind).toBe('not_checked');

    const products = JSON.parse(readFixture('drugs-at-fda-products.json')) as Array<{
      applicationNumber: string;
      productNumber?: string;
      brandName: string;
      activeIngredient: string;
      form?: string;
      strength?: string;
      marketingStatus?: string;
    }>;
    const hit = await createDrugsAtFdaConnector({ products }).lookup({ query: 'metformin' });
    expect(hit.matchKind).toBe('exact');
    expect(hit.pages[0]?.normalized.applicationNumber).toBe('NDA020357');
  });

  it('Purple Book CSV parse never infers interchangeability or peptide identity', async () => {
    const { createPurpleBookConnector, parsePurpleBookCsv } = await import('./purple-book.js');
    const rows = parsePurpleBookCsv(readFixture('purple-book.csv'));
    expect(rows[0]?.blaNumber).toBe('BLA125118');
    const result = await createPurpleBookConnector({ rows }).lookup({ query: 'metformin' });
    expect(result.matchKind).toBe('exact');
    expect(result.pages[0]?.normalized.interchangeableInferred).toBe(false);
    expect(result.pages[0]?.normalized.peptideIdentityInferred).toBe(false);
  });

  it('AEMS potential signals are never marked causal', async () => {
    const { createFdaAemsConnector } = await import('./fda-aems.js');
    const result = await createFdaAemsConnector({
      minIntervalMs: 0,
      transport: fixtureTransport({
        'fda.gov': { body: readFixture('fda-aems-quarter.html'), contentType: 'text/html' },
      }),
    }).lookup({ query: 'metformin' });
    expect(result.matchKind).toBe('exact');
    expect(result.pages[0]?.normalized.provenCausality).toBe(false);
    expect(result.pages[0]?.normalized.incidenceEstablished).toBe(false);
  });

  it('Drugs@FDA ZIP rejects traversal and projects Products.txt', async () => {
    const { buildSimpleZip, projectDrugsAtFdaZip, assertSafeZipEntryPath } =
      await import('./index.js');
    expect(() => assertSafeZipEntryPath('../evil.txt')).toThrow(/traversal/i);
    const zip = buildSimpleZip({
      'Products.txt':
        'ApplNo\tProductNo\tForm\tStrength\tDrugName\tActiveIngredient\tMarketingStatus\n020357\t001\tTABLET\t500MG\tGLUCOPHAGE\tMETFORMIN HYDROCHLORIDE\tPrescription\n',
    });
    const projected = projectDrugsAtFdaZip(zip);
    expect(projected.products[0]?.brandName).toBe('GLUCOPHAGE');
    expect(projected.products[0]?.applicationNumber).toBe('020357');
  });

  it('openFDA event aggregates stay disabled without key and omit patient narratives', async () => {
    const { createOpenFdaEventAggregateConnector } = await import('./openfda-events.js');
    const disabled = await createOpenFdaEventAggregateConnector({ apiKey: null }).lookup({
      query: 'metformin',
    });
    expect(disabled.matchKind).toBe('disabled');

    const enabled = await createOpenFdaEventAggregateConnector({
      enableWithoutKey: true,
      apiKey: 'test',
      minIntervalMs: 0,
      transport: fixtureTransport({
        'api.fda.gov': {
          body: JSON.stringify({
            results: [
              { term: 'Nausea', count: 12 },
              { term: 'Diarrhoea', count: 5 },
            ],
          }),
          contentType: 'application/json',
        },
      }),
    }).lookup({ query: 'metformin' });
    expect(enabled.matchKind).toBe('exact');
    expect(enabled.pages[0]?.normalized.patientLevelStored).toBe(false);
    expect(enabled.pages[0]?.normalized.causalityInferred).toBe(false);
    expect(String(enabled.pages[0]?.normalized.caveat)).toMatch(/not incidence/i);
  });
});
