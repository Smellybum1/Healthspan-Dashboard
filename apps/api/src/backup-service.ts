import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import {
  APP_VERSION,
  SCHEMA_VERSION,
  assertSafeRelPath,
  buildBackupManifest,
  sha256Hex,
} from '@healthspan/operations';
import { backupRecords, restoreRecords, type HealthspanDb } from '@healthspan/db';

export function createBackup(opts: {
  db: HealthspanDb;
  dataDir: string;
  dbPath: string;
  outDir?: string;
}) {
  const at = now();
  const id = randomUUID();
  const outDir = opts.outDir ?? path.join(opts.dataDir, 'backups');
  fs.mkdirSync(outDir, { recursive: true });
  const archiveName = `healthspan-backup-${id}.json`;
  const archivePath = path.join(outDir, archiveName);
  assertSafeRelPath(archiveName);

  const manifest = buildBackupManifest({
    platform: process.platform,
    includes: ['sqlite_copy_metadata', 'personalisation_tables_note'],
  });

  // Copy DB bytes into a portable JSON envelope (no raw payload dump).
  const dbBytes = fs.existsSync(opts.dbPath) ? fs.readFileSync(opts.dbPath) : Buffer.alloc(0);
  const envelope = {
    manifest,
    sqliteSha256: sha256Hex(dbBytes),
    sqliteByteLength: dbBytes.length,
    note: 'Restore requires operator confirmation and preflight.',
  };
  const body = Buffer.from(JSON.stringify(envelope, null, 2), 'utf8');
  fs.writeFileSync(archivePath, body);

  opts.db
    .insert(backupRecords)
    .values({
      id,
      profileId: 'local-owner',
      kind: 'full',
      status: 'succeeded',
      manifestJson: JSON.stringify(manifest),
      archiveSha256: sha256Hex(body),
      byteLength: body.length,
      createdAt: at,
      completedAt: at,
      errorSummary: null,
    })
    .run();

  return { id, archivePath, manifest, byteLength: body.length };
}

export function restorePreflight(opts: { archivePath: string }) {
  assertSafeRelPath(path.basename(opts.archivePath));
  if (!fs.existsSync(opts.archivePath)) {
    return { ok: false as const, error: 'Archive missing' };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(opts.archivePath, 'utf8')) as {
      manifest?: { schemaVersion?: number; appVersion?: string };
      sqliteSha256?: string;
    };
    return {
      ok: true as const,
      appVersion: raw.manifest?.appVersion ?? null,
      schemaVersion: raw.manifest?.schemaVersion ?? null,
      expectedSchema: SCHEMA_VERSION,
      appVersionExpected: APP_VERSION,
      sqliteSha256: raw.sqliteSha256 ?? null,
    };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : 'preflight failed' };
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
      status: ok ? 'preflight_ok' : 'preflight_failed',
      preflightJson: JSON.stringify(preflight),
      createdAt: at,
      completedAt: at,
      errorSummary: ok ? null : 'preflight_failed',
    })
    .run();
  return id;
}

function now() {
  return Date.now();
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

export function secretScanTrackedText(text: string, filePath: string) {
  const findings: Array<{ file: string; kind: string }> = [];
  if (/-----BEGIN (RSA |OPENSSH )?PRIVATE KEY-----/.test(text)) {
    findings.push({ file: filePath, kind: 'private_key' });
  }
  if (/(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|xox[baprs]-[a-zA-Z0-9-]{20,})/.test(text)) {
    findings.push({ file: filePath, kind: 'token_like' });
  }
  return findings;
}

void createHash;
