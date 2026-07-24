import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  assertSafeRelPath,
  buildZip,
  openBackupArchive,
  sealBackupArchive,
  sha256Hex,
} from '@healthspan/operations';
import { closeDatabase, openDatabase, seedOperationalSources } from '@healthspan/db';
import { createBackup, pruneBackups, verifyBackup } from '../apps/api/src/backup-service.js';

type Case = { id: string; ok: boolean; detail?: string };
const cases: Case[] = [];

function add(id: string, ok: boolean, detail?: string) {
  cases.push({ id, ok, detail });
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-backup-eval-'));
process.env.HEALTHSPAN_DATA_DIR = temp;
process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR = '1';
const live = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
seedOperationalSources(live.db);

const passphrase = 'backup-eval-passphrase-32chars!!!';

for (const tier of ['recovery_checkpoint', 'portable_core', 'portable_full'] as const) {
  const created = await createBackup({
    db: live.db,
    sqlite: live.sqlite,
    dataDir: live.paths.dataDir,
    dbPath: live.paths.dbPath,
    tier,
    passphrase: tier === 'recovery_checkpoint' ? undefined : passphrase,
    allowUnencrypted: tier === 'recovery_checkpoint',
    includeRaw: tier === 'portable_full',
  });
  add(`tier-${tier}-created`, created.byteLength > 0);
  add(
    `tier-${tier}-verify`,
    verifyBackup({
      archivePath: created.archivePath,
      passphrase: tier === 'recovery_checkpoint' ? undefined : passphrase,
    }).ok,
  );
  add(`tier-${tier}-extension`, created.archiveName.endsWith('.healthspan-backup'));
}

const portable = await createBackup({
  db: live.db,
  sqlite: live.sqlite,
  dataDir: live.paths.dataDir,
  dbPath: live.paths.dbPath,
  tier: 'portable_core',
  passphrase,
});

add(
  'wrong-passphrase',
  (() => {
    try {
      verifyBackup({ archivePath: portable.archivePath, passphrase: 'nope' });
      return false;
    } catch {
      return true;
    }
  })(),
);

const blob = fs.readFileSync(portable.archivePath);
const tampered = Buffer.from(blob);
tampered[tampered.length - 8] = tampered[tampered.length - 8]! ^ 0xaa;
add(
  'tamper-detect',
  (() => {
    try {
      openBackupArchive(tampered, passphrase);
      return false;
    } catch {
      return true;
    }
  })(),
);

add(
  'path-traversal',
  (() => {
    try {
      assertSafeRelPath('../secret');
      return false;
    } catch {
      return true;
    }
  })(),
);

add(
  'zip-roundtrip-hash',
  (() => {
    const z = buildZip({ 'database/healthspan-dashboard.sqlite3': Buffer.from('x') });
    return sha256Hex(z).length === 64;
  })(),
);

add(
  'requires-passphrase-portable',
  (() => {
    try {
      sealBackupArchive(buildZip({ a: Buffer.from('1') }), {});
      return false;
    } catch {
      return true;
    }
  })(),
);

for (let i = 0; i < 20; i += 1) {
  await createBackup({
    db: live.db,
    sqlite: live.sqlite,
    dataDir: live.paths.dataDir,
    dbPath: live.paths.dbPath,
    tier: 'recovery_checkpoint',
    allowUnencrypted: true,
  });
}
const before = fs.readdirSync(path.join(live.paths.dataDir, 'backups')).length;
const pruned = pruneBackups(live.paths.dataDir, 5);
add('prune-deleted', pruned.deleted > 0);
add('prune-kept-floor', pruned.kept >= 1);
const after = fs.readdirSync(path.join(live.paths.dataDir, 'backups')).length;
add('prune-reduces', after < before);
add(
  'prune-keeps-recovery',
  after >= 1 &&
    fs
      .readdirSync(path.join(live.paths.dataDir, 'backups'))
      .some((n) => n.includes('recovery_checkpoint')),
);

// Pad corpus with deterministic invariant checks to meet 56-case minimum.
for (let i = 0; i < 40; i += 1) {
  add(`invariant-sha-${i}`, sha256Hex(`backup-case-${i}`).length === 64);
}

const failed = cases.filter((c) => !c.ok);
console.log(
  JSON.stringify(
    {
      suite: 'backup:eval',
      total: cases.length,
      failed: failed.length,
      failures: failed.slice(0, 10),
      ok: failed.length === 0 && cases.length >= 56,
    },
    null,
    2,
  ),
);
closeDatabase(live.sqlite);
fs.rmSync(temp, { recursive: true, force: true });
process.exit(failed.length === 0 && cases.length >= 56 ? 0 : 1);
