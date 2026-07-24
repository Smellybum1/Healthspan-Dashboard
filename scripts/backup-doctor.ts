import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { APP_VERSION, SCHEMA_VERSION, extractZip, openBackupArchive } from '@healthspan/operations';
import { closeDatabase, openDatabase, seedOperationalSources } from '@healthspan/db';
import { createBackup, verifyBackup } from '../apps/api/src/backup-service.js';

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'healthspan-backup-doctor-'));
process.env.HEALTHSPAN_DATA_DIR = temp;
process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR = '1';

const { db, sqlite, paths } = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
seedOperationalSources(db);

const passphrase = 'doctor-passphrase-check-32chars!!';
const recovery = await createBackup({
  db,
  sqlite,
  dataDir: paths.dataDir,
  dbPath: paths.dbPath,
  tier: 'recovery_checkpoint',
  allowUnencrypted: true,
});
const portable = await createBackup({
  db,
  sqlite,
  dataDir: paths.dataDir,
  dbPath: paths.dbPath,
  tier: 'portable_core',
  passphrase,
});

const checks: Array<{ id: string; ok: boolean; detail?: string }> = [];
checks.push({ id: 'recovery_exists', ok: fs.existsSync(recovery.archivePath) });
checks.push({ id: 'portable_exists', ok: fs.existsSync(portable.archivePath) });
checks.push({
  id: 'recovery_verify',
  ok: verifyBackup({ archivePath: recovery.archivePath }).ok,
});
checks.push({
  id: 'portable_verify',
  ok: verifyBackup({ archivePath: portable.archivePath, passphrase }).ok,
});
checks.push({
  id: 'wrong_passphrase',
  ok: (() => {
    try {
      verifyBackup({ archivePath: portable.archivePath, passphrase: 'wrong' });
      return false;
    } catch {
      return true;
    }
  })(),
});

const zip = openBackupArchive(fs.readFileSync(portable.archivePath), passphrase);
const files = extractZip(zip);
checks.push({
  id: 'contains_sqlite_snapshot',
  ok: Boolean(files['database/healthspan-dashboard.sqlite3']?.length),
});
checks.push({
  id: 'manifest_versions',
  ok:
    portable.manifest.appVersion === APP_VERSION &&
    portable.manifest.schemaVersion === SCHEMA_VERSION,
});
checks.push({
  id: 'not_json_envelope',
  ok:
    !portable.archiveName.endsWith('.json') && portable.archiveName.endsWith('.healthspan-backup'),
});

const ok = checks.every((c) => c.ok);
console.log(
  JSON.stringify(
    {
      suite: 'backup:doctor',
      appVersion: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
      checks,
      ok,
    },
    null,
    2,
  ),
);
closeDatabase(sqlite);
fs.rmSync(temp, { recursive: true, force: true });
process.exit(ok ? 0 : 1);
