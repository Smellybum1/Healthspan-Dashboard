import path from 'node:path';
import { closeDatabase, openDatabase } from '@healthspan/db';
import { restoreBackup } from '../apps/api/src/backup-service.js';

function arg(name: string) {
  const i = process.argv.indexOf(name);
  if (i < 0 || !process.argv[i + 1]) throw new Error(`${name} required`);
  return process.argv[i + 1]!;
}

process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR ??= '1';
process.env.HEALTHSPAN_RESTORE_FORCE ??= '1';
const input = arg('--input');
const passphraseIdx = process.argv.indexOf('--passphrase');
const passphrase = passphraseIdx >= 0 ? process.argv[passphraseIdx + 1] : undefined;
const live = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
const archivePath = path.isAbsolute(input)
  ? input
  : path.join(live.paths.dataDir, 'backups', input);
try {
  const result = await restoreBackup({
    db: live.db,
    liveSqlite: live.sqlite,
    dataDir: live.paths.dataDir,
    dbPath: live.paths.dbPath,
    archivePath,
    passphrase,
    exclusiveLockHeld: true,
  });
  console.log(JSON.stringify({ command: 'backup:restore', ok: true, ...result }, null, 2));
  process.exit(0);
} catch (err) {
  console.error(
    JSON.stringify(
      {
        command: 'backup:restore',
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      null,
      2,
    ),
  );
  try {
    closeDatabase(live.sqlite);
  } catch {
    /* already closed */
  }
  process.exit(1);
}
