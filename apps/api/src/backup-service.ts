import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  APP_VERSION,
  SCHEMA_VERSION,
  type BackupTier,
  BackupManifestV1Schema,
  assertSafeRelPath,
  buildZipToFile,
  extractZip,
  openBackupArchive,
  sealBackupArchive,
  sha256Hex,
  sha256File,
  acquireExclusiveLock,
} from '@healthspan/operations';
import {
  backupRecords,
  restoreRecords,
  databaseDoctor,
  openDatabase,
  creatorDocuments,
  rawSnapshots,
  type HealthspanDb,
} from '@healthspan/db';

type SqliteHandle = ReturnType<typeof openDatabase>['sqlite'];

export type CreateBackupOptions = {
  db: HealthspanDb;
  sqlite: SqliteHandle;
  dataDir: string;
  dbPath: string;
  tier?: BackupTier;
  outDir?: string;
  passphrase?: string;
  allowUnencrypted?: boolean;
  includeRaw?: boolean;
  /** Active only when HEALTHSPAN_BACKUP_TEST_HOOKS=1 */
  testFailAt?: 'after-staging-snapshot' | 'before-archive-finalize';
};

function backupsRoot(dataDir: string) {
  const dir = path.join(dataDir, 'backups');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Sanitize a temporary SQLite copy (never the live DB). */
export function sanitizeBackupSqlite(tempDbPath: string) {
  const { sqlite: db } = openDatabase({ dbPath: tempDbPath, migrateOnOpen: false });
  try {
    db.pragma('foreign_keys = OFF');
    // Best-effort: drop request-integrity / transient tables if present.
    for (const table of [
      'request_integrity_sessions',
      'csrf_tokens',
      'background_jobs', // clear leases by wiping queued transient job state is too aggressive; instead null lease fields
    ]) {
      try {
        if (table === 'background_jobs') {
          db.prepare(
            `UPDATE background_jobs SET status = CASE WHEN status = 'running' THEN 'queued' ELSE status END, claimed_at = NULL, lease_expires_at = NULL`,
          ).run();
        } else {
          db.prepare(`DELETE FROM ${table}`).run();
        }
      } catch {
        /* table may not exist yet */
      }
    }
    // Scrub absolute paths / secret-like values from operational event details.
    try {
      const rows = db
        .prepare(`SELECT id, details_json, message FROM operational_events`)
        .all() as Array<{
        id: string;
        details_json: string;
        message: string;
      }>;
      const scrub = db.prepare(
        `UPDATE operational_events SET details_json = ?, message = ? WHERE id = ?`,
      );
      for (const row of rows) {
        const message = row.message.replace(/[A-Za-z]:\\[^\s]+/g, '[REDACTED_PATH]');
        const details = row.details_json
          .replace(/[A-Za-z]:\\[^\s"']+/g, '[REDACTED_PATH]')
          .replace(/(sk-|ghp_|Bearer )[A-Za-z0-9._-]+/gi, '$1[REDACTED]');
        scrub.run(details, message, row.id);
      }
    } catch {
      /* optional */
    }
    // Mark restricted platform content for re-sync rather than shipping text.
    try {
      db.prepare(
        `UPDATE creator_content_items SET text_body = NULL, transcript_body = NULL WHERE platform = 'x' OR withheld = 1 OR deleted = 1`,
      ).run();
    } catch {
      try {
        db.prepare(`UPDATE x_posts SET text = '[scrubbed_for_backup]' WHERE 1=1`).run();
      } catch {
        /* schema variants */
      }
    }
    db.pragma('wal_checkpoint(TRUNCATE)');
  } finally {
    db.close();
  }
}

export async function createBackup(opts: CreateBackupOptions) {
  const tier: BackupTier = opts.tier ?? 'portable_core';
  const at = Date.now();
  const id = randomUUID();
  const outDir = opts.outDir ?? backupsRoot(opts.dataDir);
  fs.mkdirSync(outDir, { recursive: true });
  const hooksEnabled = process.env.HEALTHSPAN_BACKUP_TEST_HOOKS === '1';
  const failAt = hooksEnabled ? opts.testFailAt : undefined;

  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'healthspan-backup-stage-'));
  const snapshotPath = path.join(staging, 'healthspan-dashboard.sqlite3');
  const zipPath = path.join(staging, 'inner.zip');
  try {
    await opts.sqlite.backup(snapshotPath);
    sanitizeBackupSqlite(snapshotPath);
    if (failAt === 'after-staging-snapshot') {
      throw new Error('injected-failure:after-staging-snapshot');
    }

    const entries: Array<
      | { path: string; kind: 'buffer'; data: Buffer }
      | { path: string; kind: 'file'; filePath: string; byteLength: number; sha256: string }
    > = [];

    const dbStat = fs.statSync(snapshotPath);
    const dbSha = sha256File(snapshotPath);
    entries.push({
      path: 'database/healthspan-dashboard.sqlite3',
      kind: 'file',
      filePath: snapshotPath,
      byteLength: dbStat.size,
      sha256: dbSha,
    });

    const includeDocs = process.env.HEALTHSPAN_BACKUP_INCLUDE_USER_DOCUMENTS === 'true';
    if ((tier === 'portable_core' || tier === 'portable_full') && includeDocs) {
      const docs = opts.db
        .select()
        .from(creatorDocuments)
        .all()
        .filter(
          (d) =>
            !d.deletedAt &&
            !d.purgedAt &&
            !d.storagePurged &&
            d.lifecycleState === 'current' &&
            [
              'user_owned',
              'authorised_caption_export',
              'public_domain_or_licence',
              'fair_dealing_research_notes',
            ].includes(d.rightsBasis),
        );
      for (const doc of docs) {
        const full = path.isAbsolute(doc.storageKey)
          ? doc.storageKey
          : path.join(opts.dataDir, doc.storageKey);
        if (!fs.existsSync(full)) continue;
        const st = fs.statSync(full);
        const sha = sha256File(full);
        if (sha !== doc.sha256) continue;
        const rel = `documents/${doc.id}/${path.basename(doc.filename)}`;
        assertSafeRelPath(rel);
        entries.push({
          path: rel,
          kind: 'file',
          filePath: full,
          byteLength: st.size,
          sha256: sha,
        });
      }
    }

    if (tier === 'portable_full') {
      // Only referenced official immutable raw objects from raw_snapshots.
      const refs = opts.db.select({ sha256: rawSnapshots.sha256 }).from(rawSnapshots).all();
      const unique = [...new Set(refs.map((r) => r.sha256).filter(Boolean))];
      for (const hash of unique) {
        const full = path.join(opts.dataDir, 'raw', 'sha256', hash);
        if (!fs.existsSync(full)) continue;
        const st = fs.statSync(full);
        const rel = `raw/sha256/${hash}`;
        assertSafeRelPath(rel);
        entries.push({
          path: rel,
          kind: 'file',
          filePath: full,
          byteLength: st.size,
          sha256: sha256File(full),
        });
      }
    }

    const fileMeta = entries.map((e) =>
      e.kind === 'buffer'
        ? { path: e.path, sha256: sha256Hex(e.data), byteLength: e.data.length }
        : { path: e.path, sha256: e.sha256, byteLength: e.byteLength },
    );

    const manifestDraft = BackupManifestV1Schema.parse({
      formatVersion: 1,
      tier,
      appVersion: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
      createdAt: new Date(at).toISOString(),
      platform: process.platform,
      encrypted:
        tier !== 'recovery_checkpoint' && Boolean(opts.passphrase || !opts.allowUnencrypted),
      files: fileMeta,
      exclusions: [
        'request_integrity_sessions',
        'csrf_tokens',
        'absolute_paths',
        'x_current_text',
        'secrets',
        'unreferenced_raw',
        'youtube_x_raw_payloads',
      ],
      notes: [
        'Consistent SQLite snapshot via Online Backup API.',
        'Bounded archive writer with per-entry and total caps.',
        'Sanitized temporary copy — live DB untouched.',
      ],
    });
    if (tier !== 'recovery_checkpoint' && !opts.passphrase && !opts.allowUnencrypted) {
      throw new Error('portable backups require passphrase (env/FD) or --allow-unencrypted');
    }
    if (tier === 'recovery_checkpoint') manifestDraft.encrypted = false;
    if (tier !== 'recovery_checkpoint' && !opts.passphrase && opts.allowUnencrypted) {
      manifestDraft.notes.push('WARNING: unencrypted portable backup');
    }

    const manifestFinal = Buffer.from(JSON.stringify(manifestDraft, null, 2), 'utf8');
    const manifestSha = sha256Hex(manifestFinal);
    const checksumBody = {
      files: {
        ...Object.fromEntries(fileMeta.map((f) => [f.path, f.sha256])),
        'manifest.json': manifestSha,
      },
    };
    const checksumsStored = Buffer.from(JSON.stringify(checksumBody, null, 2), 'utf8');

    const allEntries = [
      { path: 'manifest.json', kind: 'buffer' as const, data: manifestFinal },
      { path: 'checksums.json', kind: 'buffer' as const, data: checksumsStored },
      ...entries,
    ];
    buildZipToFile(allEntries, zipPath);
    const zip = fs.readFileSync(zipPath);
    const sealed = sealBackupArchive(zip, {
      passphrase: tier === 'recovery_checkpoint' ? undefined : opts.passphrase,
      allowUnencrypted: tier === 'recovery_checkpoint' || opts.allowUnencrypted,
      manifestSha256: manifestSha,
    });

    if (failAt === 'before-archive-finalize') {
      throw new Error('injected-failure:before-archive-finalize');
    }

    const archiveName = `healthspan-${tier}-${id}.healthspan-backup`;
    assertSafeRelPath(archiveName);
    const archivePath = path.join(outDir, archiveName);
    const tmp = `${archivePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, sealed);
    fs.renameSync(tmp, archivePath);

    opts.db
      .insert(backupRecords)
      .values({
        id,
        profileId: 'local-owner',
        kind: tier,
        status: 'succeeded',
        manifestJson: JSON.stringify({ ...manifestDraft, manifestSha256: manifestSha }),
        archiveSha256: sha256Hex(sealed),
        byteLength: sealed.length,
        createdAt: at,
        completedAt: Date.now(),
        errorSummary: null,
      })
      .run();

    return {
      id,
      archivePath,
      archiveName,
      manifest: { ...manifestDraft, manifestSha256: manifestSha },
      byteLength: sealed.length,
      sha256: sha256Hex(sealed),
    };
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

export function listBackups(dataDir: string) {
  const dir = backupsRoot(dataDir);
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.healthspan-backup'))
    .map((name) => {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      return {
        name,
        byteLength: st.size,
        mtimeMs: st.mtimeMs,
        sha256: sha256Hex(fs.readFileSync(full)),
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

export function verifyBackup(opts: { archivePath: string; passphrase?: string; deep?: boolean }) {
  const blob = fs.readFileSync(opts.archivePath);
  const opened = openBackupArchive(blob, opts.passphrase);
  const files = extractZip(opened.zip, { enforceLimits: true });
  if (!files['manifest.json']) throw new Error('missing-manifest');
  if (!files['database/healthspan-dashboard.sqlite3']) throw new Error('missing-database');
  const manifest = BackupManifestV1Schema.parse(
    JSON.parse(files['manifest.json']!.toString('utf8')),
  );
  const checksums = JSON.parse(files['checksums.json']!.toString('utf8')) as {
    files: Record<string, string>;
  };
  const mismatches: string[] = [];
  // Manifest must be checksum-covered (recovery + portable).
  const expectedManifest = checksums.files['manifest.json'];
  if (!expectedManifest) mismatches.push('missing:manifest-checksum');
  else if (sha256Hex(files['manifest.json']!) !== expectedManifest) {
    mismatches.push('hash:manifest.json');
  }
  if (opened.headerManifestSha256 && opened.headerManifestSha256 !== expectedManifest) {
    mismatches.push('header-manifest-mismatch');
  }
  for (const [p, expected] of Object.entries(checksums.files)) {
    const buf = files[p];
    if (!buf) {
      mismatches.push(`missing:${p}`);
      continue;
    }
    if (sha256Hex(buf) !== expected) mismatches.push(`hash:${p}`);
  }
  let integrity: string | null = null;
  let foreignKeys: string | null = null;
  if (opts.deep !== false) {
    const dbBytes = files['database/healthspan-dashboard.sqlite3'];
    if (!dbBytes) throw new Error('Database snapshot missing from archive');
    const tmp = path.join(os.tmpdir(), `healthspan-verify-${randomUUID()}.sqlite3`);
    fs.writeFileSync(tmp, dbBytes);
    const { sqlite } = openDatabase({ dbPath: tmp, migrateOnOpen: false, readonly: true });
    try {
      const doctor = databaseDoctor(sqlite);
      integrity = doctor.integrity;
      foreignKeys = doctor.foreignKeys;
      if (!doctor.ok) mismatches.push('sqlite_integrity');
    } finally {
      sqlite.close();
      fs.rmSync(tmp, { force: true });
    }
  }
  return {
    ok: mismatches.length === 0,
    manifest,
    mismatches,
    integrity,
    foreignKeys,
    archiveSha256: sha256Hex(blob),
  };
}

export function restorePreflight(opts: { archivePath: string; passphrase?: string }) {
  try {
    const verified = verifyBackup({ ...opts, deep: true });
    return {
      ok: verified.ok,
      appVersion: verified.manifest.appVersion,
      schemaVersion: verified.manifest.schemaVersion,
      expectedSchema: SCHEMA_VERSION,
      appVersionExpected: APP_VERSION,
      tier: verified.manifest.tier,
      mismatches: verified.mismatches,
      integrity: verified.integrity,
      foreignKeys: verified.foreignKeys,
    };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : 'preflight failed' };
  }
}

/** Test-only restore failure injection points. */
export type RestoreFailureHook =
  | 'after-live-db-move'
  | 'after-restored-db-placement'
  | 'while-restoring-documents'
  | 'while-restoring-raw'
  | 'before-final-verification';

export async function restoreBackup(opts: {
  db: HealthspanDb;
  liveSqlite: SqliteHandle;
  dataDir: string;
  dbPath: string;
  archivePath: string;
  passphrase?: string;
  dryRun?: boolean;
  /** Active only when HEALTHSPAN_BACKUP_TEST_HOOKS=1 */
  testFailAt?: RestoreFailureHook;
}) {
  const hooksEnabled = process.env.HEALTHSPAN_BACKUP_TEST_HOOKS === '1';
  const failAt = hooksEnabled ? opts.testFailAt : undefined;
  const lock = acquireExclusiveLock(opts.dataDir, { owner: 'backup:restore' });
  try {
    const preflight = restorePreflight({
      archivePath: opts.archivePath,
      passphrase: opts.passphrase,
    });
    if (!preflight.ok) {
      recordRestoreAttempt(opts.db, null, preflight, false);
      throw new Error('preflight_failed');
    }
    if (typeof preflight.schemaVersion === 'number' && preflight.schemaVersion > SCHEMA_VERSION) {
      throw new Error('future-schema-rejected');
    }
    if (opts.dryRun) {
      return { restoreId: null, dryRun: true as const, preflight, checkpoint: null };
    }

    // Mandatory pre-restore recovery checkpoint (while lock held)
    const checkpoint = await createBackup({
      db: opts.db,
      sqlite: opts.liveSqlite,
      dataDir: opts.dataDir,
      dbPath: opts.dbPath,
      tier: 'recovery_checkpoint',
      allowUnencrypted: true,
    });

    const blob = fs.readFileSync(opts.archivePath);
    const opened = openBackupArchive(blob, opts.passphrase);
    const files = extractZip(opened.zip, { enforceLimits: true });
    const dbBytes = files['database/healthspan-dashboard.sqlite3'];
    if (!dbBytes) throw new Error('Database missing in archive');

    const stagingDb = path.join(os.tmpdir(), `healthspan-restore-${randomUUID()}.sqlite3`);
    fs.writeFileSync(stagingDb, dbBytes);
    // Migrate older supported schema in temporary target before swap.
    const probe = openDatabase({
      dbPath: stagingDb,
      migrateOnOpen: (preflight.schemaVersion ?? SCHEMA_VERSION) < SCHEMA_VERSION,
    });
    const doctor = databaseDoctor(probe.sqlite);
    probe.sqlite.close();
    if (!doctor.ok) {
      fs.rmSync(stagingDb, { force: true });
      throw new Error('Restored snapshot failed integrity checks');
    }

    const backupLive = `${opts.dbPath}.pre-restore-${Date.now()}`;
    const wal = `${opts.dbPath}-wal`;
    const shm = `${opts.dbPath}-shm`;
    const payloadBackupRoot = path.join(
      opts.dataDir,
      `.restore-payload-backup-${Date.now()}-${process.pid}`,
    );
    const restoredPayloads: Array<{ dest: string; backup?: string }> = [];
    opts.liveSqlite.close();
    try {
      fs.renameSync(opts.dbPath, backupLive);
      if (fs.existsSync(wal)) fs.renameSync(wal, `${backupLive}-wal`);
      if (fs.existsSync(shm)) fs.renameSync(shm, `${backupLive}-shm`);
      if (failAt === 'after-live-db-move') throw new Error('injected-failure:after-live-db-move');

      fs.copyFileSync(stagingDb, opts.dbPath);
      if (failAt === 'after-restored-db-placement') {
        throw new Error('injected-failure:after-restored-db-placement');
      }

      // Restore eligible document and raw payload files from archive.
      fs.mkdirSync(payloadBackupRoot, { recursive: true });
      for (const [rel, bytes] of Object.entries(files)) {
        if (rel === 'manifest.json' || rel === 'checksums.json') continue;
        if (rel === 'database/healthspan-dashboard.sqlite3') continue;
        assertSafeRelPath(rel);
        const dest = path.join(opts.dataDir, rel);
        const managedRoot = path.resolve(opts.dataDir);
        if (!path.resolve(dest).startsWith(managedRoot)) {
          throw new Error(`path-escape:${rel}`);
        }
        const expected = sha256Hex(bytes);
        if (rel.startsWith('documents/')) {
          if (failAt === 'while-restoring-documents') {
            throw new Error('injected-failure:while-restoring-documents');
          }
        }
        if (rel.startsWith('raw/')) {
          if (failAt === 'while-restoring-raw') {
            throw new Error('injected-failure:while-restoring-raw');
          }
        }
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        let backupOfExisting: string | undefined;
        if (fs.existsSync(dest)) {
          backupOfExisting = path.join(payloadBackupRoot, rel.replace(/[\\/]/g, '__'));
          fs.mkdirSync(path.dirname(backupOfExisting), { recursive: true });
          fs.copyFileSync(dest, backupOfExisting);
        }
        fs.writeFileSync(dest, bytes);
        if (sha256File(dest) !== expected) {
          throw new Error(`hash-mismatch-after-restore:${rel}`);
        }
        restoredPayloads.push({ dest, backup: backupOfExisting });
      }

      if (failAt === 'before-final-verification') {
        throw new Error('injected-failure:before-final-verification');
      }

      const verify = openDatabase({ dbPath: opts.dbPath, migrateOnOpen: false });
      const after = databaseDoctor(verify.sqlite);
      verify.sqlite.close();
      if (!after.ok) {
        throw new Error('Post-restore verification failed; rolled back');
      }
      // Clean obsolete WAL/SHM for restored DB after successful open.
      for (const side of [wal, shm]) {
        if (fs.existsSync(side)) fs.rmSync(side, { force: true });
      }
    } catch (err) {
      // Rollback DB + payload files.
      for (const p of [...restoredPayloads].reverse()) {
        try {
          if (p.backup && fs.existsSync(p.backup)) fs.copyFileSync(p.backup, p.dest);
          else if (fs.existsSync(p.dest) && !p.backup) fs.rmSync(p.dest, { force: true });
        } catch {
          /* best-effort */
        }
      }
      if (fs.existsSync(backupLive)) {
        if (fs.existsSync(opts.dbPath)) fs.rmSync(opts.dbPath, { force: true });
        fs.renameSync(backupLive, opts.dbPath);
        if (fs.existsSync(`${backupLive}-wal`)) {
          fs.copyFileSync(`${backupLive}-wal`, wal);
        }
        if (fs.existsSync(`${backupLive}-shm`)) {
          fs.copyFileSync(`${backupLive}-shm`, shm);
        }
      }
      throw err;
    } finally {
      fs.rmSync(stagingDb, { force: true });
      fs.rmSync(payloadBackupRoot, { recursive: true, force: true });
    }

    const restored = openDatabase({ dbPath: opts.dbPath, migrateOnOpen: false });
    try {
      const { enqueueJob, JOB_PRIORITY } = await import('./jobs.js');
      const jobs = [
        enqueueJob(restored.db, {
          kind: 'ingestion',
          payload: { sourceId: 'all', trigger: 'post_restore' },
          dedupeKey: `post-restore:ingestion:${checkpoint.id}`,
          priority: JOB_PRIORITY.SCHEDULED_INGESTION,
        }),
        enqueueJob(restored.db, {
          kind: 'intelligence',
          payload: { trigger: 'post_restore', staleOnly: true },
          dedupeKey: `post-restore:intelligence:${checkpoint.id}`,
          priority: JOB_PRIORITY.INTELLIGENCE,
        }),
        enqueueJob(restored.db, {
          kind: 'run_x_batch_compliance',
          payload: { trigger: 'post_restore' },
          dedupeKey: `post-restore:x-compliance:${checkpoint.id}`,
          priority: JOB_PRIORITY.COMPLIANCE,
        }),
      ];
      const restoreId = recordRestoreAttempt(
        restored.db,
        checkpoint.id,
        {
          preflight,
          checkpoint: checkpoint.archiveName,
          resyncScheduled: true,
          enqueuedJobs: jobs.map((j) => ({ id: j.job.id, kind: j.job.kind, created: j.created })),
          restoredPayloadCount: restoredPayloads.length,
        },
        true,
      );
      return {
        restoreId,
        checkpoint: checkpoint.archiveName,
        preflight,
        enqueuedJobs: jobs.map((j) => j.job.id),
        restoredPayloadCount: restoredPayloads.length,
      };
    } finally {
      restored.sqlite.close();
    }
  } finally {
    lock.release();
  }
}

export function recordRestoreAttempt(
  db: HealthspanDb,
  backupId: string | null,
  preflight: unknown,
  ok: boolean,
) {
  const id = randomUUID();
  const at = Date.now();
  db.insert(restoreRecords)
    .values({
      id,
      backupId,
      status: ok ? 'succeeded' : 'preflight_failed',
      preflightJson: JSON.stringify(preflight),
      createdAt: at,
      completedAt: at,
      errorSummary: ok ? null : 'preflight_failed',
    })
    .run();
  return id;
}

export function pruneBackups(dataDir: string, keepNewest = 14) {
  const items = listBackups(dataDir);
  const protectedNames = new Set(items.slice(0, Math.max(1, keepNewest)).map((i) => i.name));
  // Always keep newest recovery checkpoint
  const newestRecovery = items.find((i) => i.name.includes('recovery_checkpoint'));
  if (newestRecovery) protectedNames.add(newestRecovery.name);
  let deleted = 0;
  for (const item of items) {
    if (protectedNames.has(item.name)) continue;
    fs.rmSync(path.join(backupsRoot(dataDir), item.name), { force: true });
    deleted += 1;
  }
  return { kept: protectedNames.size, deleted };
}

export function storageUsage(dataDir: string) {
  const categories: Array<{ category: string; dir: string }> = [
    { category: 'database', dir: dataDir },
    { category: 'raw', dir: path.join(dataDir, 'raw') },
    { category: 'backups', dir: path.join(dataDir, 'backups') },
  ];
  return categories.map((c) => {
    let byteLength = 0;
    let fileCount = 0;
    if (fs.existsSync(c.dir)) {
      const walk = (p: string) => {
        for (const ent of fs.readdirSync(p, { withFileTypes: true })) {
          const full = path.join(p, ent.name);
          if (ent.isDirectory()) walk(full);
          else {
            fileCount += 1;
            byteLength += fs.statSync(full).size;
          }
        }
      };
      walk(c.dir);
    }
    return { category: c.category, byteLength, fileCount };
  });
}
