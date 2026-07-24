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
  buildZip,
  extractZip,
  openBackupArchive,
  sealBackupArchive,
  sha256Hex,
} from '@healthspan/operations';
import {
  backupRecords,
  restoreRecords,
  databaseDoctor,
  openDatabase,
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

  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'healthspan-backup-stage-'));
  const snapshotPath = path.join(staging, 'healthspan-dashboard.sqlite3');
  try {
    // SQLite Online Backup API via better-sqlite3
    await opts.sqlite.backup(snapshotPath);
    sanitizeBackupSqlite(snapshotPath);

    const dbBytes = fs.readFileSync(snapshotPath);
    const files: Record<string, Buffer> = {
      'manifest.json': Buffer.from('{}'), // placeholder filled below
      'database/healthspan-dashboard.sqlite3': dbBytes,
      'checksums.json': Buffer.from('{}'),
    };

    if (tier === 'portable_full' && opts.includeRaw) {
      const rawDir = path.join(opts.dataDir, 'raw');
      if (fs.existsSync(rawDir)) {
        const walk = (dir: string, rel: string) => {
          for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, ent.name);
            const r = path.join(rel, ent.name).replace(/\\/g, '/');
            if (ent.isDirectory()) walk(full, r);
            else {
              assertSafeRelPath(`raw/${r}`);
              files[`raw/${r}`] = fs.readFileSync(full);
            }
          }
        };
        walk(rawDir, '');
      }
    }

    const fileMeta = Object.entries(files)
      .filter(([p]) => p !== 'manifest.json' && p !== 'checksums.json')
      .map(([p, buf]) => ({ path: p, sha256: sha256Hex(buf), byteLength: buf.length }));

    const checksums = {
      files: Object.fromEntries(fileMeta.map((f) => [f.path, f.sha256])),
    };
    files['checksums.json'] = Buffer.from(JSON.stringify(checksums, null, 2), 'utf8');

    const manifest = BackupManifestV1Schema.parse({
      formatVersion: 1,
      tier,
      appVersion: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
      createdAt: new Date(at).toISOString(),
      platform: process.platform,
      encrypted: Boolean(opts.passphrase) || tier !== 'recovery_checkpoint',
      files: [
        ...fileMeta,
        {
          path: 'checksums.json',
          sha256: sha256Hex(files['checksums.json']!),
          byteLength: files['checksums.json']!.length,
        },
      ],
      exclusions: [
        'request_integrity_sessions',
        'csrf_tokens',
        'absolute_paths',
        'x_current_text',
        'secrets',
      ],
      notes: [
        'Consistent SQLite snapshot via Online Backup API.',
        'Sanitized temporary copy — live DB untouched.',
      ],
    });
    // For recovery checkpoints, encryption is optional; portable defaults encrypted.
    if (tier !== 'recovery_checkpoint' && !opts.passphrase && !opts.allowUnencrypted) {
      throw new Error('portable backups require --passphrase or --allow-unencrypted');
    }
    if (tier === 'recovery_checkpoint') {
      manifest.encrypted = false;
    }
    files['manifest.json'] = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');

    const zip = buildZip(files);
    const sealed = sealBackupArchive(zip, {
      passphrase: tier === 'recovery_checkpoint' ? undefined : opts.passphrase,
      allowUnencrypted: tier === 'recovery_checkpoint' || opts.allowUnencrypted,
    });

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
        manifestJson: JSON.stringify(manifest),
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
      manifest,
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
  const zip = openBackupArchive(blob, opts.passphrase);
  const files = extractZip(zip);
  const manifest = BackupManifestV1Schema.parse(
    JSON.parse(files['manifest.json']!.toString('utf8')),
  );
  const checksums = JSON.parse(files['checksums.json']!.toString('utf8')) as {
    files: Record<string, string>;
  };
  const mismatches: string[] = [];
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

export async function restoreBackup(opts: {
  db: HealthspanDb;
  liveSqlite: SqliteHandle;
  dataDir: string;
  dbPath: string;
  archivePath: string;
  passphrase?: string;
  exclusiveLockHeld?: boolean;
}) {
  if (!opts.exclusiveLockHeld && process.env.HEALTHSPAN_RESTORE_FORCE !== '1') {
    throw new Error(
      'Restore requires exclusive lock (stop API/worker) or HEALTHSPAN_RESTORE_FORCE=1',
    );
  }

  const preflight = restorePreflight({
    archivePath: opts.archivePath,
    passphrase: opts.passphrase,
  });
  if (!preflight.ok) {
    recordRestoreAttempt(opts.db, null, preflight, false);
    throw new Error('preflight_failed');
  }

  // Mandatory pre-restore recovery checkpoint
  const checkpoint = await createBackup({
    db: opts.db,
    sqlite: opts.liveSqlite,
    dataDir: opts.dataDir,
    dbPath: opts.dbPath,
    tier: 'recovery_checkpoint',
    allowUnencrypted: true,
  });

  const blob = fs.readFileSync(opts.archivePath);
  const zip = openBackupArchive(blob, opts.passphrase);
  const files = extractZip(zip);
  const dbBytes = files['database/healthspan-dashboard.sqlite3'];
  if (!dbBytes) throw new Error('Database missing in archive');

  const stagingDb = path.join(os.tmpdir(), `healthspan-restore-${randomUUID()}.sqlite3`);
  fs.writeFileSync(stagingDb, dbBytes);
  const probe = openDatabase({ dbPath: stagingDb, migrateOnOpen: false });
  const doctor = databaseDoctor(probe.sqlite);
  probe.sqlite.close();
  if (!doctor.ok) {
    fs.rmSync(stagingDb, { force: true });
    throw new Error('Restored snapshot failed integrity checks');
  }

  const backupLive = `${opts.dbPath}.pre-restore-${Date.now()}`;
  opts.liveSqlite.close();
  try {
    fs.renameSync(opts.dbPath, backupLive);
    fs.copyFileSync(stagingDb, opts.dbPath);
    const verify = openDatabase({ dbPath: opts.dbPath, migrateOnOpen: false });
    const after = databaseDoctor(verify.sqlite);
    verify.sqlite.close();
    if (!after.ok) {
      fs.copyFileSync(backupLive, opts.dbPath);
      throw new Error('Post-restore verification failed; rolled back');
    }
  } catch (err) {
    if (fs.existsSync(backupLive) && !fs.existsSync(opts.dbPath)) {
      fs.renameSync(backupLive, opts.dbPath);
    }
    throw err;
  } finally {
    fs.rmSync(stagingDb, { force: true });
  }

  const restored = openDatabase({ dbPath: opts.dbPath, migrateOnOpen: false });
  try {
    const restoreId = recordRestoreAttempt(
      restored.db,
      checkpoint.id,
      { preflight, checkpoint: checkpoint.archiveName },
      true,
    );
    return { restoreId, checkpoint: checkpoint.archiveName, preflight };
  } finally {
    restored.sqlite.close();
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
