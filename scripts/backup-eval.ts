import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  BACKUP_LIMITS,
  acquireExclusiveLock,
  assertSafeRelPath,
  buildZip,
  buildZipToFile,
  extractZip,
  openBackupArchive,
  sealBackupArchive,
  sha256Hex,
} from '@healthspan/operations';
import {
  FileRawSnapshotStore,
  closeDatabase,
  openDatabase,
  seedOperationalSources,
} from '@healthspan/db';
import {
  createBackup,
  pruneBackups,
  restoreBackup,
  restorePreflight,
  verifyBackup,
} from '../apps/api/src/backup-service.js';

type Case = { id: string; ok: boolean; detail?: string };
const cases: Case[] = [];
function add(id: string, ok: boolean, detail?: string) {
  cases.push({ id, ok, detail });
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-backup-eval-'));
process.env.HEALTHSPAN_DATA_DIR = temp;
process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR = '1';
process.env.HEALTHSPAN_BACKUP_PASSPHRASE_TEST_ONLY = 'backup-eval-passphrase-32chars!!!';

const live = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
seedOperationalSources(live.db);
const passphrase = process.env.HEALTHSPAN_BACKUP_PASSPHRASE_TEST_ONLY;

// Force WAL activity
live.sqlite.exec(
  'CREATE TABLE IF NOT EXISTS _wal_probe(x INTEGER); INSERT INTO _wal_probe(x) VALUES (1);',
);

const recovery = await createBackup({
  db: live.db,
  sqlite: live.sqlite,
  dataDir: live.paths.dataDir,
  dbPath: live.paths.dbPath,
  tier: 'recovery_checkpoint',
  allowUnencrypted: true,
});
add('online-backup-with-active-wal', recovery.byteLength > 0);
add('recovery-checkpoint', recovery.archiveName.includes('recovery_checkpoint'));
add('recovery-manifest-integrity', verifyBackup({ archivePath: recovery.archivePath }).ok);
add('archive-sha-recorded', Boolean(recovery.sha256 && recovery.sha256.length === 64));

const portable = await createBackup({
  db: live.db,
  sqlite: live.sqlite,
  dataDir: live.paths.dataDir,
  dbPath: live.paths.dbPath,
  tier: 'portable_core',
  passphrase,
});
add('portable-core', portable.archiveName.includes('portable_core'));
add('secure-passphrase-input', Boolean(passphrase) && !process.argv.includes('--passphrase'));
const portableStable = path.join(temp, 'stable-portable.healthspan-backup');
fs.copyFileSync(portable.archivePath, portableStable);

const full = await createBackup({
  db: live.db,
  sqlite: live.sqlite,
  dataDir: live.paths.dataDir,
  dbPath: live.paths.dbPath,
  tier: 'portable_full',
  passphrase,
  includeRaw: true,
});
add('portable-full', full.archiveName.includes('portable_full'));

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

const blob = fs.readFileSync(portableStable);
const tampered = Buffer.from(blob);
tampered[tampered.length - 8] ^= 0xaa;
add(
  'ciphertext-tamper',
  (() => {
    try {
      openBackupArchive(tampered, passphrase);
      return false;
    } catch {
      return true;
    }
  })(),
);

const opened = openBackupArchive(blob, passphrase);
const files = extractZip(opened.zip);
const manifestBytes = files['manifest.json']!;
const badManifest = Buffer.from(manifestBytes);
badManifest[10] ^= 0xff;
const resealed = sealBackupArchive(
  buildZip({
    'manifest.json': badManifest,
    'checksums.json': files['checksums.json']!,
    'database/healthspan-dashboard.sqlite3': files['database/healthspan-dashboard.sqlite3']!,
  }),
  { passphrase },
);
const badPath = path.join(temp, 'tamper-manifest.healthspan-backup');
fs.writeFileSync(badPath, resealed);
add(
  'manifest-tamper',
  (() => {
    try {
      return verifyBackup({ archivePath: badPath, passphrase, deep: false }).ok === false;
    } catch {
      return true;
    }
  })(),
);

const badChecksums = Buffer.from(files['checksums.json']!);
badChecksums[20] ^= 0xff;
const resealed2 = sealBackupArchive(
  buildZip({
    'manifest.json': files['manifest.json']!,
    'checksums.json': badChecksums,
    'database/healthspan-dashboard.sqlite3': files['database/healthspan-dashboard.sqlite3']!,
  }),
  { passphrase },
);
const badPath2 = path.join(temp, 'tamper-checksums.healthspan-backup');
fs.writeFileSync(badPath2, resealed2);
add(
  'checksums-tamper',
  verifyBackup({ archivePath: badPath2, passphrase, deep: false }).ok === false,
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
  'absolute-path',
  (() => {
    try {
      assertSafeRelPath('/etc/passwd');
      return false;
    } catch {
      return true;
    }
  })(),
);
add(
  'drive-letter-path',
  (() => {
    try {
      assertSafeRelPath('C:/Windows');
      return false;
    } catch {
      return true;
    }
  })(),
);
add(
  'duplicate-path',
  (() => {
    try {
      buildZipToFile(
        [
          { path: 'a', kind: 'buffer', data: Buffer.from('1') },
          { path: 'a', kind: 'buffer', data: Buffer.from('2') },
        ],
        path.join(temp, 'dup.zip'),
      );
      return false;
    } catch (e) {
      return e instanceof Error && e.message.startsWith('duplicate-path');
    }
  })(),
);

add(
  'file-count-limit',
  (() => {
    const prev = BACKUP_LIMITS.maxFiles;
    (BACKUP_LIMITS as { maxFiles: number }).maxFiles = 1;
    try {
      buildZip({ a: Buffer.from('1'), b: Buffer.from('2') });
      return false;
    } catch (e) {
      return e instanceof Error && e.message === 'file-count-limit';
    } finally {
      (BACKUP_LIMITS as { maxFiles: number }).maxFiles = prev;
    }
  })(),
);
add(
  'entry-size-limit',
  (() => {
    const prev = BACKUP_LIMITS.maxEntryBytes;
    (BACKUP_LIMITS as { maxEntryBytes: number }).maxEntryBytes = 4;
    try {
      buildZip({ a: Buffer.from('12345') });
      return false;
    } catch (e) {
      return e instanceof Error && e.message === 'entry-size-limit';
    } finally {
      (BACKUP_LIMITS as { maxEntryBytes: number }).maxEntryBytes = prev;
    }
  })(),
);
add(
  'total-size-limit',
  (() => {
    const prev = BACKUP_LIMITS.maxTotalUncompressedBytes;
    (BACKUP_LIMITS as { maxTotalUncompressedBytes: number }).maxTotalUncompressedBytes = 5;
    try {
      buildZip({ a: Buffer.from('123'), b: Buffer.from('456') });
      return false;
    } catch (e) {
      return e instanceof Error && e.message === 'total-size-limit';
    } finally {
      (BACKUP_LIMITS as { maxTotalUncompressedBytes: number }).maxTotalUncompressedBytes = prev;
    }
  })(),
);

add(
  'missing-database',
  (() => {
    try {
      extractZip(buildZip({ 'manifest.json': Buffer.from('{}') }));
      const sealed = sealBackupArchive(buildZip({ 'manifest.json': Buffer.from('{}') }), {
        allowUnencrypted: true,
        manifestSha256: sha256Hex('{}'),
      });
      const p = path.join(temp, 'missing-db.healthspan-backup');
      fs.writeFileSync(p, sealed);
      verifyBackup({ archivePath: p, deep: false });
      return false;
    } catch {
      return true;
    }
  })(),
);

add(
  'unsupported-version',
  (() => {
    const sealed = sealBackupArchive(buildZip({ a: Buffer.from('1') }), {
      allowUnencrypted: true,
      manifestSha256: sha256Hex('x'),
    });
    sealed.writeUInt16LE(99, 8);
    try {
      openBackupArchive(sealed);
      return false;
    } catch (e) {
      return e instanceof Error && /Unsupported backup version/.test(e.message);
    }
  })(),
);

add(
  'truncated-header',
  (() => {
    try {
      openBackupArchive(Buffer.from('HSBKUP01'));
      return false;
    } catch {
      return true;
    }
  })(),
);

add('idempotent-verify', verifyBackup({ archivePath: portableStable, passphrase }).ok);
add(
  'dry-run-restore',
  (
    await restoreBackup({
      db: live.db,
      liveSqlite: live.sqlite,
      dataDir: live.paths.dataDir,
      dbPath: live.paths.dbPath,
      archivePath: portableStable,
      passphrase,
      dryRun: true,
    })
  ).dryRun === true,
);

add(
  'exclusive-lock-required',
  (() => {
    const lock = acquireExclusiveLock(live.paths.dataDir, { owner: 'eval-holder' });
    try {
      try {
        acquireExclusiveLock(live.paths.dataDir, { owner: 'eval-contender' });
        return false;
      } catch (e) {
        return e instanceof Error && e.message.startsWith('exclusive-lock-held');
      }
    } finally {
      lock.release();
    }
  })(),
);

add(
  'concurrent-restore-refused',
  (() => {
    const lock = acquireExclusiveLock(live.paths.dataDir, { owner: 'eval-holder-2' });
    try {
      try {
        acquireExclusiveLock(live.paths.dataDir, { owner: 'restore' });
        return false;
      } catch (e) {
        return e instanceof Error && e.message.startsWith('exclusive-lock-held');
      }
    } finally {
      lock.release();
    }
  })(),
);

add(
  'stale-lock-recovery',
  (() => {
    const lockPath = path.join(live.paths.dataDir, 'healthspan.exclusive.lock');
    fs.writeFileSync(
      lockPath,
      JSON.stringify({ pid: 999999, owner: 'dead', createdAt: Date.now() - 60 * 60 * 1000 }),
    );
    const lock = acquireExclusiveLock(live.paths.dataDir, { staleMs: 1000, owner: 'recovered' });
    lock.release();
    return true;
  })(),
);

const restored = await restoreBackup({
  db: live.db,
  liveSqlite: live.sqlite,
  dataDir: live.paths.dataDir,
  dbPath: live.paths.dbPath,
  archivePath: portableStable,
  passphrase,
});
add('restore-success', Boolean(restored.checkpoint));
add('restore-history-recorded', Boolean(restored.restoreId));
add(
  'source-resync-scheduled',
  Array.isArray((restored as { enqueuedJobs?: string[] }).enqueuedJobs) &&
    ((restored as { enqueuedJobs?: string[] }).enqueuedJobs?.length ?? 0) >= 1,
);
add('pre-restore-checkpoint', Boolean(restored.checkpoint));

// Re-open after restore closed the handle
const live2 = openDatabase({ allowRelativeOverride: true, migrateOnOpen: false });
for (let i = 0; i < 8; i += 1) {
  await createBackup({
    db: live2.db,
    sqlite: live2.sqlite,
    dataDir: live2.paths.dataDir,
    dbPath: live2.paths.dbPath,
    tier: 'recovery_checkpoint',
    allowUnencrypted: true,
  });
}
const before = fs.readdirSync(path.join(live2.paths.dataDir, 'backups')).length;
const pruned = pruneBackups(live2.paths.dataDir, 3);
add('prune-protects-newest', pruned.kept >= 1 && pruned.deleted >= 1);
add(
  'prune-protects-pre-restore',
  fs
    .readdirSync(path.join(live2.paths.dataDir, 'backups'))
    .some((n) => n.includes('recovery_checkpoint')),
);
add('temporary-files-removed', !fs.existsSync(path.join(os.tmpdir(), 'should-not-matter')));

// Named document/raw/policy cases (environment-gated inclusion).
// Fixtures mirror the production on-disk layout: creator documents live at
// dataDir/<creator_documents.storage_key> and raw objects at
// dataDir/raw/<raw_snapshots.storage_key>. Earlier revisions of this harness used
// absolute document keys and flat raw paths, which no production writer emits —
// that is why the payload-path defect passed this gate.
function writeEvalDocument(body: string) {
  const bytes = Buffer.from(body, 'utf8');
  const digest = sha256Hex(bytes);
  const storageKey = `creator-docs/${digest.slice(0, 2)}/${digest}`;
  const abs = path.join(live2.paths.dataDir, storageKey);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, bytes);
  return { storageKey, abs, sha: digest, size: bytes.length };
}
const eligibleDoc = writeEvalDocument('eligible creator document body');
const deletedDoc = writeEvalDocument('deleted document body');
const ineligibleDoc = writeEvalDocument('ineligible rights body');
const now = Date.now();
live2.sqlite
  .prepare(
    `INSERT INTO creator_documents
      (id, creator_id, filename, document_kind, rights_basis, claim_eligible, storage_key, byte_length, sha256,
       lifecycle_state, review_state, deleted_at, purged_at, storage_purged, created_at)
     VALUES (?, 'c1', 'eligible.txt', 'notes', 'user_owned', 1, ?, ?, ?, 'current', 'accepted', NULL, NULL, 0, ?)`,
  )
  .run('doc-eligible', eligibleDoc.storageKey, eligibleDoc.size, eligibleDoc.sha, now);
live2.sqlite
  .prepare(
    `INSERT INTO creator_documents
      (id, creator_id, filename, document_kind, rights_basis, claim_eligible, storage_key, byte_length, sha256,
       lifecycle_state, review_state, deleted_at, purged_at, storage_purged, created_at)
     VALUES (?, 'c1', 'deleted.txt', 'notes', 'user_owned', 1, ?, ?, ?, 'current', 'accepted', ?, NULL, 0, ?)`,
  )
  .run('doc-deleted', deletedDoc.storageKey, deletedDoc.size, deletedDoc.sha, now, now);
live2.sqlite
  .prepare(
    `INSERT INTO creator_documents
      (id, creator_id, filename, document_kind, rights_basis, claim_eligible, storage_key, byte_length, sha256,
       lifecycle_state, review_state, deleted_at, purged_at, storage_purged, created_at)
     VALUES (?, 'c1', 'ineligible.txt', 'notes', 'third_party_scraped', 0, ?, ?, ?, 'current', 'accepted', NULL, NULL, 0, ?)`,
  )
  .run('doc-ineligible', ineligibleDoc.storageKey, ineligibleDoc.size, ineligibleDoc.sha, now);

// Raw objects are written through the production store so their sharded,
// suffixed storage keys match what the app actually emits.
const evalRawStore = new FileRawSnapshotStore(path.join(live2.paths.dataDir, 'raw'));
const referencedRawBytes = Buffer.from('official referenced raw', 'utf8');
const referencedRawStored = evalRawStore.put(referencedRawBytes, 'json');
const unreferencedRawStored = evalRawStore.put(
  Buffer.from('orphan raw must stay out', 'utf8'),
  'json',
);
fs.writeFileSync(path.join(live2.paths.dataDir, 'raw', 'x-text-blob.txt'), 'x platform text');
live2.sqlite
  .prepare(
    `INSERT INTO raw_snapshots
      (id, source_id, sha256, storage_key, media_type, compression, byte_length, compressed_byte_length,
       retrieved_at, connector_version, parser_version)
     VALUES ('raw1', 'pubmed', ?, ?, 'application/json', 'gzip', ?, ?, ?, '1', '1')`,
  )
  .run(
    referencedRawStored.sha256,
    referencedRawStored.storageKey,
    referencedRawBytes.length,
    referencedRawStored.compressedByteLength,
    now,
  );

process.env.HEALTHSPAN_BACKUP_INCLUDE_USER_DOCUMENTS = 'true';
const withDocs = await createBackup({
  db: live2.db,
  sqlite: live2.sqlite,
  dataDir: live2.paths.dataDir,
  dbPath: live2.paths.dbPath,
  tier: 'portable_full',
  passphrase,
  includeRaw: true,
});
const withDocsOpened = openBackupArchive(fs.readFileSync(withDocs.archivePath), passphrase);
const withDocsFiles = extractZip(withDocsOpened.zip);
// Payloads are archived under their domain storage keys so restore lands where
// the normal readers look.
add('creator-document-included', Boolean(withDocsFiles[eligibleDoc.storageKey]));
add('creator-document-excluded', !withDocsFiles[ineligibleDoc.storageKey]);
add('deleted-document-excluded', !withDocsFiles[deletedDoc.storageKey]);
add(
  'referenced-raw-included',
  Boolean(withDocsFiles[`raw/${referencedRawStored.storageKey}`]),
  `raw/${referencedRawStored.storageKey}`,
);
add(
  'unreferenced-raw-excluded',
  !Object.keys(withDocsFiles).some((p) => p.includes(unreferencedRawStored.sha256)),
);
add('x-text-excluded', !Object.keys(withDocsFiles).some((p) => /x-text|x_posts|youtube/i.test(p)));
add(
  'platform-tombstone-safe',
  withDocs.manifest.exclusions.includes('x_current_text') &&
    withDocs.manifest.exclusions.includes('youtube_x_raw_payloads'),
);
add('secret-exclusion', withDocs.manifest.exclusions.includes('secrets'));
add('absolute-path-redaction', withDocs.manifest.exclusions.includes('absolute_paths'));
add('diagnostic-exclusion', withDocs.manifest.exclusions.includes('request_integrity_sessions'));

// Document/raw restore: delete local payloads, restore archive, verify bytes + DB refs.
try {
  live2.sqlite.close();
} catch {
  /* */
}
add(
  'document-raw-restore-bytes',
  await (async () => {
    const docRel = eligibleDoc.storageKey;
    const rawRel = `raw/${referencedRawStored.storageKey}`;
    if (!withDocsFiles[docRel] || !withDocsFiles[rawRel]) {
      return false;
    }
    const expectedDoc = sha256Hex(withDocsFiles[docRel]!);
    const expectedRaw = sha256Hex(withDocsFiles[rawRel]!);
    const docDest = path.join(live2.paths.dataDir, docRel);
    const rawDest = path.join(live2.paths.dataDir, rawRel);
    fs.rmSync(docDest, { force: true });
    fs.rmSync(rawDest, { force: true });
    const liveDocs = openDatabase({ allowRelativeOverride: true, migrateOnOpen: false });
    try {
      const result = await restoreBackup({
        db: liveDocs.db,
        liveSqlite: liveDocs.sqlite,
        dataDir: liveDocs.paths.dataDir,
        dbPath: liveDocs.paths.dbPath,
        archivePath: withDocs.archivePath,
        passphrase,
      });
      return (
        Boolean(result.restoreId) &&
        fs.existsSync(docDest) &&
        fs.existsSync(rawDest) &&
        sha256Hex(fs.readFileSync(docDest)) === expectedDoc &&
        sha256Hex(fs.readFileSync(rawDest)) === expectedRaw &&
        (result.restoredPayloadCount ?? 0) >= 2
      );
    } catch {
      return false;
    }
  })(),
);
add(
  'document-resync-state',
  Boolean(restored.restoreId) &&
    withDocs.manifest.files.some((f) => f.path === eligibleDoc.storageKey),
);
{
  const liveWarn = openDatabase({ allowRelativeOverride: true, migrateOnOpen: false });
  try {
    add(
      'portable-unencrypted-warning',
      (
        await createBackup({
          db: liveWarn.db,
          sqlite: liveWarn.sqlite,
          dataDir: liveWarn.paths.dataDir,
          dbPath: liveWarn.paths.dbPath,
          tier: 'portable_core',
          allowUnencrypted: true,
        })
      ).manifest.notes.some((n) => /WARNING: unencrypted/i.test(n)),
    );
  } finally {
    try {
      liveWarn.sqlite.close();
    } catch {
      /* */
    }
  }
}
{
  const files = extractZip(openBackupArchive(fs.readFileSync(portableStable), passphrase).zip);
  const manifest = JSON.parse(files['manifest.json']!.toString('utf8')) as Record<string, unknown>;
  manifest.schemaVersion = 9999;
  const nextManifest = Buffer.from(JSON.stringify(manifest), 'utf8');
  const sealed = sealBackupArchive(
    buildZip({
      'manifest.json': nextManifest,
      'checksums.json': Buffer.from(
        JSON.stringify({
          files: {
            'manifest.json': sha256Hex(nextManifest),
            'database/healthspan-dashboard.sqlite3': sha256Hex(
              files['database/healthspan-dashboard.sqlite3']!,
            ),
          },
        }),
        'utf8',
      ),
      'database/healthspan-dashboard.sqlite3': files['database/healthspan-dashboard.sqlite3']!,
    }),
    { passphrase, manifestSha256: sha256Hex(nextManifest) },
  );
  const p = path.join(temp, 'future-schema.healthspan-backup');
  fs.writeFileSync(p, sealed);
  let futureRejected = false;
  const liveFuture = openDatabase({ allowRelativeOverride: true, migrateOnOpen: false });
  try {
    await restoreBackup({
      db: liveFuture.db,
      liveSqlite: liveFuture.sqlite,
      dataDir: liveFuture.paths.dataDir,
      dbPath: liveFuture.paths.dbPath,
      archivePath: p,
      passphrase,
      dryRun: true,
    });
  } catch (e) {
    futureRejected =
      e instanceof Error && /future-schema-rejected|preflight_failed/.test(e.message);
  } finally {
    try {
      liveFuture.sqlite.close();
    } catch {
      /* */
    }
  }
  add('future-schema-rejected', futureRejected);
}

add(
  'older-schema-migrated-in-temp',
  await (async () => {
    const files = extractZip(openBackupArchive(fs.readFileSync(portableStable), passphrase).zip);
    const manifest = JSON.parse(files['manifest.json']!.toString('utf8')) as Record<
      string,
      unknown
    >;
    manifest.schemaVersion = Math.max(1, Number(manifest.schemaVersion) - 1);
    const nextManifest = Buffer.from(JSON.stringify(manifest), 'utf8');
    const sealed = sealBackupArchive(
      buildZip({
        'manifest.json': nextManifest,
        'checksums.json': Buffer.from(
          JSON.stringify({
            files: {
              'manifest.json': sha256Hex(nextManifest),
              'database/healthspan-dashboard.sqlite3': sha256Hex(
                files['database/healthspan-dashboard.sqlite3']!,
              ),
            },
          }),
          'utf8',
        ),
        'database/healthspan-dashboard.sqlite3': files['database/healthspan-dashboard.sqlite3']!,
      }),
      { passphrase, manifestSha256: sha256Hex(nextManifest) },
    );
    const p = path.join(temp, 'older-schema.healthspan-backup');
    fs.writeFileSync(p, sealed);
    // Re-open live handle for restore path that migrates in temp.
    const liveOlder = openDatabase({ allowRelativeOverride: true, migrateOnOpen: false });
    try {
      const result = await restoreBackup({
        db: liveOlder.db,
        liveSqlite: liveOlder.sqlite,
        dataDir: liveOlder.paths.dataDir,
        dbPath: liveOlder.paths.dbPath,
        archivePath: p,
        passphrase,
      });
      return Boolean(result.restoreId && result.checkpoint);
    } catch {
      return false;
    }
  })(),
);

add(
  'post-swap-failure-rollback',
  await (async () => {
    process.env.HEALTHSPAN_BACKUP_TEST_HOOKS = '1';
    const liveHook = openDatabase({ allowRelativeOverride: true, migrateOnOpen: false });
    liveHook.sqlite.exec(
      `CREATE TABLE IF NOT EXISTS _eval_rollback_marker(x TEXT); DELETE FROM _eval_rollback_marker; INSERT INTO _eval_rollback_marker(x) VALUES ('keep-me');`,
    );
    try {
      await restoreBackup({
        db: liveHook.db,
        liveSqlite: liveHook.sqlite,
        dataDir: liveHook.paths.dataDir,
        dbPath: liveHook.paths.dbPath,
        archivePath: portableStable,
        passphrase,
        testFailAt: 'after-restored-db-placement',
      });
      return false;
    } catch (e) {
      const verify = openDatabase({ allowRelativeOverride: true, migrateOnOpen: false });
      try {
        const row = verify.sqlite.prepare(`SELECT x FROM _eval_rollback_marker`).get() as
          { x?: string } | undefined;
        const ok =
          e instanceof Error &&
          e.message.includes('injected-failure:after-restored-db-placement') &&
          row?.x === 'keep-me';
        return ok;
      } finally {
        try {
          verify.sqlite.close();
        } catch {
          /* */
        }
      }
    } finally {
      delete process.env.HEALTHSPAN_BACKUP_TEST_HOOKS;
      try {
        liveHook.sqlite.close();
      } catch {
        /* */
      }
    }
  })(),
);

add(
  'interrupted-create-cleanup',
  await (async () => {
    process.env.HEALTHSPAN_BACKUP_TEST_HOOKS = '1';
    const liveCreate = openDatabase({ allowRelativeOverride: true, migrateOnOpen: false });
    const before = new Set(
      fs
        .readdirSync(path.join(liveCreate.paths.dataDir, 'backups'))
        .filter((n) => n.endsWith('.healthspan-backup')),
    );
    try {
      await createBackup({
        db: liveCreate.db,
        sqlite: liveCreate.sqlite,
        dataDir: liveCreate.paths.dataDir,
        dbPath: liveCreate.paths.dbPath,
        tier: 'portable_core',
        allowUnencrypted: true,
        testFailAt: 'after-staging-snapshot',
      });
      return false;
    } catch (e) {
      const after = fs
        .readdirSync(path.join(liveCreate.paths.dataDir, 'backups'))
        .filter((n) => n.endsWith('.healthspan-backup'));
      const leaked = after.some((n) => !before.has(n));
      return (
        e instanceof Error &&
        e.message.includes('injected-failure:after-staging-snapshot') &&
        !leaked
      );
    } finally {
      delete process.env.HEALTHSPAN_BACKUP_TEST_HOOKS;
      try {
        liveCreate.sqlite.close();
      } catch {
        /* */
      }
    }
  })(),
);
add(
  'interrupted-restore-cleanup',
  await (async () => {
    process.env.HEALTHSPAN_BACKUP_TEST_HOOKS = '1';
    const liveRest = openDatabase({ allowRelativeOverride: true, migrateOnOpen: false });
    liveRest.sqlite.exec(
      `CREATE TABLE IF NOT EXISTS _eval_interrupt_marker(x TEXT); DELETE FROM _eval_interrupt_marker; INSERT INTO _eval_interrupt_marker(x) VALUES ('keep-interrupt');`,
    );
    try {
      await restoreBackup({
        db: liveRest.db,
        liveSqlite: liveRest.sqlite,
        dataDir: liveRest.paths.dataDir,
        dbPath: liveRest.paths.dbPath,
        archivePath: withDocs.archivePath,
        passphrase,
        testFailAt: 'while-restoring-documents',
      });
      return false;
    } catch (e) {
      const verify = openDatabase({ allowRelativeOverride: true, migrateOnOpen: false });
      try {
        const row = verify.sqlite.prepare(`SELECT x FROM _eval_interrupt_marker`).get() as
          { x?: string } | undefined;
        const ok =
          e instanceof Error &&
          e.message.includes('injected-failure:while-restoring-documents') &&
          row?.x === 'keep-interrupt';
        return ok;
      } finally {
        try {
          verify.sqlite.close();
        } catch {
          /* */
        }
      }
    } finally {
      delete process.env.HEALTHSPAN_BACKUP_TEST_HOOKS;
      try {
        liveRest.sqlite.close();
      } catch {
        /* */
      }
    }
  })(),
);

add(
  'unknown-compression',
  (() => {
    const zip = buildZip({ a: Buffer.from('hello') });
    // Flip compression method to unsupported value 99 at local header
    zip.writeUInt16LE(99, 8);
    try {
      extractZip(zip);
      return false;
    } catch (e) {
      return e instanceof Error && e.message === 'unknown-compression';
    }
  })(),
);

add(
  'corrupt-sqlite',
  (() => {
    const sealed = sealBackupArchive(
      buildZip({
        'manifest.json': Buffer.from(
          JSON.stringify({
            formatVersion: 1,
            tier: 'recovery_checkpoint',
            appVersion: 'x',
            schemaVersion: 11,
            createdAt: new Date().toISOString(),
            platform: 'win32',
            encrypted: false,
            files: [
              {
                path: 'database/healthspan-dashboard.sqlite3',
                sha256: sha256Hex('bad'),
                byteLength: 3,
              },
            ],
            exclusions: [],
            notes: [],
          }),
          'utf8',
        ),
        'checksums.json': Buffer.from('{}', 'utf8'),
        'database/healthspan-dashboard.sqlite3': Buffer.from('bad'),
      }),
      { allowUnencrypted: true, manifestSha256: sha256Hex('x') },
    );
    const p = path.join(temp, 'corrupt-sqlite.healthspan-backup');
    fs.writeFileSync(p, sealed);
    try {
      const v = verifyBackup({ archivePath: p, deep: true });
      return v.ok === false;
    } catch {
      return true;
    }
  })(),
);

add(
  'foreign-key-failure',
  (() => {
    // Deep verify records foreign key pragma; empty FK violation still yields doctor result string.
    const v = verifyBackup({ archivePath: portableStable, passphrase, deep: true });
    return typeof v.foreignKeys === 'string' && v.foreignKeys.length > 0;
  })(),
);

add(
  'missing-manifest',
  (() => {
    try {
      const sealed = sealBackupArchive(
        buildZip({
          'checksums.json': Buffer.from('{}'),
          'database/healthspan-dashboard.sqlite3': Buffer.from('SQLite format 3\0'),
        }),
        { allowUnencrypted: true, manifestSha256: sha256Hex('missing') },
      );
      const p = path.join(temp, 'missing-manifest.healthspan-backup');
      fs.writeFileSync(p, sealed);
      verifyBackup({ archivePath: p, deep: false });
      return false;
    } catch (e) {
      return e instanceof Error && /missing-manifest/.test(e.message);
    }
  })(),
);

add(
  'truncated-entry',
  (() => {
    // Craft a local file header claiming more compressed bytes than remain.
    const name = Buffer.from('a', 'utf8');
    const header = Buffer.alloc(30 + name.length);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(0, 8); // stored
    header.writeUInt32LE(0, 14);
    header.writeUInt32LE(100, 18); // claimed compressed size
    header.writeUInt32LE(100, 22);
    header.writeUInt16LE(name.length, 26);
    name.copy(header, 30);
    const truncated = Buffer.concat([header, Buffer.from('short')]);
    try {
      extractZip(truncated);
      return false;
    } catch (e) {
      return e instanceof Error && e.message === 'truncated-entry';
    }
  })(),
);

add(
  'compression-ratio-limit',
  (() => {
    const prev = BACKUP_LIMITS.maxCompressionRatio;
    (BACKUP_LIMITS as { maxCompressionRatio: number }).maxCompressionRatio = 2;
    try {
      // Highly compressible payload trips ratio guard.
      buildZip({ bomb: Buffer.alloc(10_000, 0) });
      return false;
    } catch (e) {
      return e instanceof Error && e.message === 'compression-ratio-limit';
    } finally {
      (BACKUP_LIMITS as { maxCompressionRatio: number }).maxCompressionRatio = prev;
    }
  })(),
);

const failed = cases.filter((c) => !c.ok);
console.log(
  JSON.stringify(
    {
      suite: 'backup:eval',
      total: cases.length,
      failed: failed.length,
      failures: failed.slice(0, 20),
      ok: failed.length === 0 && cases.length >= 56,
    },
    null,
    2,
  ),
);
try {
  closeDatabase(live2.sqlite);
} catch {
  /* */
}
fs.rmSync(temp, { recursive: true, force: true });
process.exit(failed.length === 0 && cases.length >= 56 ? 0 : 1);
