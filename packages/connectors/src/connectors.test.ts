import { describe, expect, it } from 'vitest';
import { createPubmedConnector } from './pubmed.js';
import { createClinicalTrialsConnector } from './clinicaltrials.js';
import { createCrossrefConnector } from './crossref.js';
import { createTgaConnector } from './tga.js';
import type { FetchTransport } from './types.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

function fixtureTransport(map: Record<string, { body: string; contentType: string }>): FetchTransport {
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
});
