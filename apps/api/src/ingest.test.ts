import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FileRawSnapshotStore,
  closeDatabase,
  contentItems,
  openDatabase,
  seedOperationalSources,
} from '@healthspan/db';
import { runIngestion } from './ingest.js';
import type { FetchTransport } from '@healthspan/connectors';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../packages/connectors/fixtures',
);

function fixtureTransport(): FetchTransport {
  const map: Record<string, { body: string; type: string }> = {
    esearch: {
      body: fs.readFileSync(path.join(fixturesDir, 'pubmed-esearch.json'), 'utf8'),
      type: 'application/json',
    },
    efetch: {
      body: fs.readFileSync(path.join(fixturesDir, 'pubmed-efetch.xml'), 'utf8'),
      type: 'application/xml',
    },
    'clinicaltrials.gov': {
      body: fs.readFileSync(path.join(fixturesDir, 'clinicaltrials-studies.json'), 'utf8'),
      type: 'application/json',
    },
    'api.crossref.org': {
      body: fs.readFileSync(path.join(fixturesDir, 'crossref-work.json'), 'utf8'),
      type: 'application/json',
    },
    'tga.gov.au': {
      body: fs.readFileSync(path.join(fixturesDir, 'tga-feed.xml'), 'utf8'),
      type: 'application/rss+xml',
    },
  };
  return async (input) => {
    const url = String(input);
    const key = Object.keys(map).find((k) => url.includes(k));
    if (!key) return new Response('missing', { status: 404 });
    const hit = map[key]!;
    return new Response(hit.body, { status: 200, headers: { 'content-type': hit.type } });
  };
}

describe('ingestion with fixtures', () => {
  it('ingests pubmed into sqlite without network', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-ingest-'));
    const { db, sqlite, paths } = openDatabase({
      env: { HEALTHSPAN_DATA_DIR: dir },
      migrateOnOpen: true,
    });
    seedOperationalSources(db);
    const rawStore = new FileRawSnapshotStore(paths.rawDir);
    const result = await runIngestion({
      db,
      rawStore,
      sourceId: 'pubmed',
      trigger: 'test',
      recordCap: 5,
      transport: fixtureTransport(),
      isBaseline: true,
    });
    expect(result).toBeTruthy();
    const items = db.select().from(contentItems).all();
    expect(items.some((i) => i.type === 'paper')).toBe(true);
    expect(items.every((i) => i.dataOrigin === 'live')).toBe(true);
    closeDatabase(sqlite);
  }, 20_000);
});
