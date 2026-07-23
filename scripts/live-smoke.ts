import {
  FileRawSnapshotStore,
  closeDatabase,
  openDatabase,
  seedOperationalSources,
} from '@healthspan/db';
import { runIngestion } from '../apps/api/src/ingest.js';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-live-smoke-'));
process.env.HEALTHSPAN_DATA_DIR = dir;

const { db, sqlite, paths } = openDatabase({ migrateOnOpen: true });
seedOperationalSources(db);
const rawStore = new FileRawSnapshotStore(paths.rawDir);
const result = await runIngestion({
  db,
  rawStore,
  sourceId: 'all',
  trigger: 'test',
  recordCap: Number(process.env.HEALTHSPAN_LIVE_SMOKE_RECORD_CAP ?? 5),
  isBaseline: true,
});
console.log(JSON.stringify({ dir, result }, null, 2));
closeDatabase(sqlite);
