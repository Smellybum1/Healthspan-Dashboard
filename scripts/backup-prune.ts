import { closeDatabase, openDatabase } from '@healthspan/db';
import { pruneBackups } from '../apps/api/src/backup-service.js';

process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR ??= '1';
const keepIdx = process.argv.indexOf('--keep');
const keep = Number(keepIdx >= 0 ? process.argv[keepIdx + 1] : 14);
const { sqlite, paths } = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
const result = pruneBackups(paths.dataDir, keep);
console.log(JSON.stringify({ command: 'backup:prune', ...result }, null, 2));
closeDatabase(sqlite);
