import { closeDatabase, openDatabase } from '@healthspan/db';
import { listBackups } from '../apps/api/src/backup-service.js';

process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR ??= '1';
const { sqlite, paths } = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
const items = listBackups(paths.dataDir);
console.log(JSON.stringify({ command: 'backup:list', count: items.length, items }, null, 2));
closeDatabase(sqlite);
