import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  assertSafeRelPath,
  buildZip,
  extractZip,
  openBackupArchive,
  originAllowed,
  sealBackupArchive,
  sha256Hex,
  createIntegritySession,
  validateCsrf,
  fetchMetadataAllowed,
} from '@healthspan/operations';
import { openDatabase, seedOperationalSources, operationalEvents } from '@healthspan/db';
import {
  createBackup,
  listBackups,
  pruneBackups,
  restoreBackup,
  verifyBackup,
} from './backup-service.js';

describe('backup archive crypto and zip', () => {
  it('rejects path traversal', () => {
    expect(() => assertSafeRelPath('../etc/passwd')).toThrow();
    expect(() => assertSafeRelPath('C:/Windows')).toThrow();
  });

  it('round-trips zip contents', () => {
    const zip = buildZip({
      'manifest.json': Buffer.from('{"a":1}'),
      'database/db.sqlite3': Buffer.from('sqlite'),
    });
    const files = extractZip(zip);
    expect(files['manifest.json']?.toString()).toBe('{"a":1}');
    expect(files['database/db.sqlite3']?.toString()).toBe('sqlite');
  });

  it('encrypts and rejects wrong passphrase / tamper', () => {
    const zip = buildZip({ 'a.txt': Buffer.from('hello') });
    const sealed = sealBackupArchive(zip, { passphrase: 'correct-horse-battery-staple' });
    expect(openBackupArchive(sealed, 'correct-horse-battery-staple').zip.length).toBeGreaterThan(0);
    expect(() => openBackupArchive(sealed, 'wrong')).toThrow(/Decryption failed|Passphrase/);
    const tampered = Buffer.from(sealed);
    tampered[tampered.length - 5] = tampered[tampered.length - 5]! ^ 0xff;
    expect(() => openBackupArchive(tampered, 'correct-horse-battery-staple')).toThrow();
  });
});

describe('request integrity helpers', () => {
  it('denies Origin null and missing unless allowed', () => {
    expect(originAllowed('null', '127.0.0.1:8787')).toBe(false);
    expect(originAllowed(undefined, '127.0.0.1:8787')).toBe(false);
    expect(originAllowed(undefined, '127.0.0.1:8787', { allowMissingOrigin: true })).toBe(true);
    expect(originAllowed('http://127.0.0.1:5173', '127.0.0.1:8787')).toBe(true);
    expect(originAllowed('https://evil.example', '127.0.0.1:8787')).toBe(false);
  });

  it('validates csrf against session', () => {
    const s = createIntegritySession();
    expect(validateCsrf(s, s.csrfToken)).toBe(true);
    expect(validateCsrf(s, 'nope')).toBe(false);
    expect(validateCsrf(null, s.csrfToken)).toBe(false);
  });

  it('blocks cross-site fetch metadata', () => {
    expect(fetchMetadataAllowed({ secFetchSite: 'cross-site' })).toBe(false);
    expect(fetchMetadataAllowed({ secFetchSite: 'same-origin' })).toBe(true);
    expect(fetchMetadataAllowed({})).toBe(true);
  });
});

describe('online backup restore lifecycle', () => {
  it('creates restorable .healthspan-backup via Online Backup API', async () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-backup-test-'));
    process.env.HEALTHSPAN_DATA_DIR = temp;
    process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR = '1';
    process.env.HEALTHSPAN_RESTORE_FORCE = '1';
    const live = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
    seedOperationalSources(live.db);
    live.db
      .insert(operationalEvents)
      .values({
        id: 'evt1',
        kind: 'test',
        severity: 'info',
        message: 'path C:\\Users\\secret\\db',
        detailsJson: '{"token":"sk-abc"}',
        createdAt: Date.now(),
      })
      .run();

    const passphrase = 'test-passphrase-for-backup-corpus';
    const created = await createBackup({
      db: live.db,
      sqlite: live.sqlite,
      dataDir: live.paths.dataDir,
      dbPath: live.paths.dbPath,
      tier: 'portable_core',
      passphrase,
    });
    expect(created.archiveName.endsWith('.healthspan-backup')).toBe(true);
    expect(verifyBackup({ archivePath: created.archivePath, passphrase }).ok).toBe(true);

    const listed = listBackups(live.paths.dataDir);
    expect(listed.length).toBeGreaterThanOrEqual(1);

    const restored = await restoreBackup({
      db: live.db,
      liveSqlite: live.sqlite,
      dataDir: live.paths.dataDir,
      dbPath: live.paths.dbPath,
      archivePath: created.archivePath,
      passphrase,
    });
    expect(restored.checkpoint).toContain('recovery_checkpoint');

    const pruned = pruneBackups(live.paths.dataDir, 1);
    expect(pruned.kept).toBeGreaterThanOrEqual(1);
    expect(sha256Hex('x')).toHaveLength(64);

    fs.rmSync(temp, { recursive: true, force: true });
  }, 60_000);
});
