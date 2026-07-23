import {
  FileRawSnapshotStore,
  closeDatabase,
  openDatabase,
  seedOperationalSources,
} from '@healthspan/db';
import { runIngestion } from '../apps/api/src/ingest.js';

const args = process.argv.slice(2);
const sourceIdx = args.indexOf('--source');
const sourceId = (sourceIdx >= 0 ? args[sourceIdx + 1] : 'all') as
  | 'all'
  | 'pubmed'
  | 'clinicaltrials-gov'
  | 'crossref'
  | 'tga';

const { db, sqlite, paths } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});
seedOperationalSources(db);
const rawStore = new FileRawSnapshotStore(paths.rawDir);
const result = await runIngestion({
  db,
  rawStore,
  sourceId,
  trigger: 'cli',
  recordCap: Number(process.env.HEALTHSPAN_FIRST_RUN_RECORD_CAP ?? 50),
});
console.log(JSON.stringify(result, null, 2));
closeDatabase(sqlite);
