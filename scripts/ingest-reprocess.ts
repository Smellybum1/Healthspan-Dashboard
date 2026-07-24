/**
 * Offline raw-snapshot reprocess for M2 residual / M6 entry gate.
 * Default mode uses a temporary database and never touches the user's normal data dir.
 *
 * Flow:
 * 1) Seed immutable raw snapshots via fixture transport (no live network).
 * 2) Reprocess from stored snapshots with current parsers (no network, no remote checkpoint advance).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FileRawSnapshotStore,
  closeDatabase,
  openDatabase,
  seedOperationalSources,
} from '@healthspan/db';
import { runIngestion } from '../apps/api/src/ingest.js';
import { reprocessFromStoredSnapshots } from '../apps/api/src/reprocess-service.js';
import type { ConnectorId } from '@healthspan/connectors';

const args = process.argv.slice(2);
const sourceIdx = args.indexOf('--source');
const sourceArg = (sourceIdx >= 0 ? args[sourceIdx + 1] : 'pubmed') ?? 'pubmed';
const allowed = new Set(['pubmed', 'clinicaltrials-gov', 'crossref', 'tga', 'all']);
if (!allowed.has(sourceArg)) {
  console.error(
    `Unsupported --source ${sourceArg}. Use pubmed|clinicaltrials-gov|crossref|tga|all`,
  );
  process.exit(2);
}

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../packages/connectors/fixtures',
);

function readFixture(name: string): Buffer {
  return fs.readFileSync(path.join(fixturesDir, name));
}

function offlineTransport() {
  return async (input: RequestInfo | URL) => {
    const url = String(input).toLowerCase();
    if (url.includes('esearch')) {
      return new Response(readFixture('pubmed-esearch.json'), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('efetch') || url.includes('pubmed')) {
      return new Response(readFixture('pubmed-efetch.xml'), {
        status: 200,
        headers: { 'content-type': 'application/xml' },
      });
    }
    if (url.includes('clinicaltrials')) {
      return new Response(readFixture('clinicaltrials-studies.json'), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('crossref')) {
      return new Response(readFixture('crossref-work.json'), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('tga') || url.includes('rss')) {
      return new Response(readFixture('tga-feed.xml'), {
        status: 200,
        headers: { 'content-type': 'application/xml' },
      });
    }
    return new Response(JSON.stringify({ offline: true, records: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
}

const useTemp = process.env.HEALTHSPAN_REPROCESS_TEMP !== '0';
const tempRoot = useTemp ? fs.mkdtempSync(path.join(os.tmpdir(), 'healthspan-reprocess-')) : null;

if (tempRoot) {
  process.env.HEALTHSPAN_DATA_DIR = tempRoot;
  process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR = '1';
}

const { db, sqlite, paths } = openDatabase({
  allowRelativeOverride: true,
  migrateOnOpen: true,
});
seedOperationalSources(db);
const rawStore = new FileRawSnapshotStore(paths.rawDir);

const sources =
  sourceArg === 'all'
    ? (['pubmed', 'clinicaltrials-gov', 'crossref', 'tga'] as const)
    : ([sourceArg] as const);

const results = [];
for (const sourceId of sources) {
  // Phase 1: seed immutable raw snapshots into the temp DB (fixture transport only).
  const seed = await runIngestion({
    db,
    rawStore,
    sourceId,
    trigger: 'test',
    recordCap: 25,
    transport: offlineTransport(),
    isBaseline: true,
    crossrefDois: sourceId === 'crossref' ? ['10.1000/healthspan.fixture'] : undefined,
  });

  // Phase 2: reprocess from stored snapshots — no network, no remote checkpoint advance.
  const reprocess = await reprocessFromStoredSnapshots({
    db,
    rawStore,
    sourceId: sourceId as ConnectorId,
    recordCap: 25,
  });

  results.push({
    sourceId,
    seedStatus: seed.status,
    status: reprocess.status,
    inserted: reprocess.inserted,
    changed: reprocess.changed,
    unchanged: reprocess.unchanged,
    partial: reprocess.partial,
    failed: reprocess.failed,
    snapshotsRead: reprocess.snapshotsRead,
    offline: true,
    network: false,
    advancedRemoteCheckpoint: false,
    temporaryDatabase: Boolean(tempRoot),
    runId: reprocess.runId,
  });
}

const ok = results.every((r) => r.status === 'succeeded' || r.status === 'partial');
console.log(
  JSON.stringify(
    {
      command: 'ingest:reprocess',
      mode: 'offline_stored_snapshot_temp_db',
      temporaryDatabase: Boolean(tempRoot),
      dataDir: tempRoot ?? paths.dataDir,
      results,
      ok,
    },
    null,
    2,
  ),
);

closeDatabase(sqlite);
if (tempRoot) {
  try {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  } catch {
    /* best-effort */
  }
}
process.exit(ok ? 0 : 1);
