import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { closeDatabase, openDatabase, seedOperationalSources } from '@healthspan/db';
import { createBackup, restorePreflight } from '../apps/api/src/backup-service.js';

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'healthspan-backup-'));
process.env.HEALTHSPAN_DATA_DIR = temp;
process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR = '1';

const { db, sqlite, paths } = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
seedOperationalSources(db);
const result = createBackup({ db, dataDir: paths.dataDir, dbPath: paths.dbPath });
const preflight = restorePreflight({ archivePath: result.archivePath });
console.log(
  JSON.stringify(
    {
      command: 'backup:create',
      ok: result.byteLength > 0 && preflight.ok,
      byteLength: result.byteLength,
      preflight,
      temporary: true,
    },
    null,
    2,
  ),
);
closeDatabase(sqlite);
fs.rmSync(temp, { recursive: true, force: true });
process.exit(result.byteLength > 0 && preflight.ok ? 0 : 1);
