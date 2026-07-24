import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { closeDatabase, openDatabase, seedOperationalSources } from '@healthspan/db';
import { createBackup, restorePreflight } from '../apps/api/src/backup-service.js';

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const ownedTemp = !process.env.HEALTHSPAN_DATA_DIR;
const temp = ownedTemp
  ? fs.mkdtempSync(path.join(os.tmpdir(), 'healthspan-backup-'))
  : process.env.HEALTHSPAN_DATA_DIR!;
process.env.HEALTHSPAN_DATA_DIR = temp;
process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR = '1';

const tier = (arg('--tier', 'recovery_checkpoint') ?? 'recovery_checkpoint') as
  'recovery_checkpoint' | 'portable_core' | 'portable_full';
const passphrase = arg('--passphrase');
const allowUnencrypted = process.argv.includes('--allow-unencrypted');

const { db, sqlite, paths } = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
seedOperationalSources(db);
const result = await createBackup({
  db,
  sqlite,
  dataDir: paths.dataDir,
  dbPath: paths.dbPath,
  tier,
  passphrase,
  allowUnencrypted: allowUnencrypted || tier === 'recovery_checkpoint',
});
const preflight = restorePreflight({ archivePath: result.archivePath, passphrase });
console.log(
  JSON.stringify(
    {
      command: 'backup:create',
      ok: preflight.ok,
      id: result.id,
      archiveName: result.archiveName,
      byteLength: result.byteLength,
      sha256: result.sha256,
      tier,
      preflight,
      temporary: ownedTemp,
    },
    null,
    2,
  ),
);
closeDatabase(sqlite);
if (ownedTemp) fs.rmSync(temp, { recursive: true, force: true });
process.exit(preflight.ok ? 0 : 1);
