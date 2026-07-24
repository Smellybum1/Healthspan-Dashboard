import path from 'node:path';
import { closeDatabase, openDatabase } from '@healthspan/db';
import { verifyBackup } from '../apps/api/src/backup-service.js';

function arg(name: string) {
  const i = process.argv.indexOf(name);
  if (i < 0 || !process.argv[i + 1]) throw new Error(`${name} required`);
  return process.argv[i + 1]!;
}

process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR ??= '1';
const input = arg('--input');
const passphraseIdx = process.argv.indexOf('--passphrase');
const passphrase = passphraseIdx >= 0 ? process.argv[passphraseIdx + 1] : undefined;
const { sqlite, paths } = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
const archivePath = path.isAbsolute(input) ? input : path.join(paths.dataDir, 'backups', input);
const verified = verifyBackup({ archivePath, passphrase });
console.log(JSON.stringify({ command: 'backup:verify', ...verified }, null, 2));
closeDatabase(sqlite);
process.exit(verified.ok ? 0 : 1);
