import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import {
  BackupManifestV1Schema,
  buildZip,
  extractZip,
  openBackupArchive,
  sealBackupArchive,
  sha256Hex,
} from '@healthspan/operations';
import {
  FileRawSnapshotStore,
  creatorDocuments,
  openDatabase,
  rawSnapshots,
  seedOperationalSources,
} from '@healthspan/db';
import { createBackup, restoreBackup, toDomainRelKey, verifyBackup } from './backup-service.js';

const PASSPHRASE = 'hotfix-passphrase-for-payload-tests';

type Fixture = ReturnType<typeof openDatabase> & {
  temp: string;
  rawKey: string;
  rawSha: string;
  rawBytes: Buffer;
  docKey: string;
  docSha: string;
  docBytes: Buffer;
  docId: string;
};

let temps: string[] = [];

function sha(bytes: Buffer) {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Build a data dir that mirrors the production on-disk layout. */
function makeFixture(): Fixture {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-payload-hotfix-'));
  temps.push(temp);
  process.env.HEALTHSPAN_DATA_DIR = temp;
  process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR = '1';
  process.env.HEALTHSPAN_BACKUP_INCLUDE_USER_DOCUMENTS = 'true';

  const live = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
  seedOperationalSources(live.db);

  // Raw snapshot written exactly as the production store writes it.
  const rawBytes = Buffer.from(JSON.stringify({ demo: 'raw-payload', n: 1 }), 'utf8');
  const store = new FileRawSnapshotStore(path.join(live.paths.dataDir, 'raw'));
  const stored = store.put(rawBytes, 'json');
  live.db
    .insert(rawSnapshots)
    .values({
      id: randomUUID(),
      sourceId: 'pubmed',
      sha256: stored.sha256,
      storageKey: stored.storageKey,
      mediaType: 'application/json',
      compression: 'gzip',
      byteLength: rawBytes.length,
      compressedByteLength: stored.compressedByteLength,
      retrievedAt: Date.now(),
      connectorVersion: 'test-1',
      parserVersion: 'test-1',
    })
    .run();

  // Creator document written exactly as creator-service writes it.
  const docBytes = Buffer.from('demo creator document body', 'utf8');
  const docSha = sha(docBytes);
  const docKey = `creator-docs/${docSha.slice(0, 2)}/${docSha}`;
  const docAbs = path.join(live.paths.dataDir, docKey);
  fs.mkdirSync(path.dirname(docAbs), { recursive: true });
  fs.writeFileSync(docAbs, docBytes);
  const docId = randomUUID();
  live.db
    .insert(creatorDocuments)
    .values({
      id: docId,
      creatorId: 'creator-demo',
      filename: 'notes.txt',
      documentKind: 'notes',
      rightsBasis: 'user_owned',
      storageKey: docKey,
      byteLength: docBytes.length,
      sha256: docSha,
      lifecycleState: 'current',
      createdAt: Date.now(),
    })
    .run();

  return Object.assign(live, {
    temp,
    rawKey: stored.storageKey,
    rawSha: stored.sha256,
    rawBytes,
    docKey,
    docSha,
    docBytes,
    docId,
  });
}

async function backupFull(fx: Fixture) {
  return createBackup({
    db: fx.db,
    sqlite: fx.sqlite,
    dataDir: fx.paths.dataDir,
    dbPath: fx.paths.dbPath,
    tier: 'portable_full',
    passphrase: PASSPHRASE,
  });
}

function manifestOf(archivePath: string) {
  const opened = openBackupArchive(fs.readFileSync(archivePath), PASSPHRASE);
  const files = extractZip(opened.zip, { enforceLimits: true });
  return {
    files,
    manifest: BackupManifestV1Schema.parse(JSON.parse(files['manifest.json']!.toString('utf8'))),
  };
}

/** Rewrite archive payload paths to emulate a pre-hotfix (legacy) archive. */
function rewriteArchivePaths(
  archivePath: string,
  outPath: string,
  remap: (rel: string) => string | null,
) {
  const { files, manifest } = manifestOf(archivePath);
  const next: Record<string, Buffer> = {};
  for (const [rel, bytes] of Object.entries(files)) {
    if (rel === 'manifest.json' || rel === 'checksums.json') continue;
    const mapped = remap(rel);
    next[mapped ?? rel] = bytes;
  }
  manifest.files = Object.entries(next).map(([p, b]) => ({
    path: p,
    sha256: sha256Hex(b),
    byteLength: b.length,
  }));
  const manifestFinal = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  const manifestSha = sha256Hex(manifestFinal);
  const checksums = Buffer.from(
    JSON.stringify(
      {
        files: {
          ...Object.fromEntries(manifest.files.map((f) => [f.path, f.sha256])),
          'manifest.json': manifestSha,
        },
      },
      null,
      2,
    ),
    'utf8',
  );
  const zip = buildZip({
    'manifest.json': manifestFinal,
    'checksums.json': checksums,
    ...next,
  });
  const sealed = sealBackupArchive(zip, { passphrase: PASSPHRASE, manifestSha256: manifestSha });
  fs.writeFileSync(outPath, sealed);
  return outPath;
}

beforeEach(() => {
  temps = [];
});

afterEach(() => {
  for (const t of temps) fs.rmSync(t, { recursive: true, force: true });
  delete process.env.HEALTHSPAN_BACKUP_TEST_HOOKS;
});

describe('M6 hotfix — raw snapshot archival uses raw_snapshots.storage_key', () => {
  it('1. portable_full contains the real referenced raw snapshot', async () => {
    const fx = makeFixture();
    const created = await backupFull(fx);
    const { manifest } = manifestOf(created.archivePath);
    const paths = manifest.files.map((f) => f.path);

    expect(paths).toContain(`raw/${fx.rawKey}`);
    // The pre-hotfix reconstruction must not reappear.
    expect(paths).not.toContain(`raw/sha256/${fx.rawSha}`);
    expect(paths.filter((p) => p.startsWith('raw/')).length).toBe(1);

    // Regression guard: the pre-hotfix collector resolved dataDir/raw/sha256/<sha>,
    // which can never exist because the store shards the key and appends .<ext>.gz.
    // Its existsSync check therefore skipped every object silently.
    expect(fs.existsSync(path.join(fx.paths.dataDir, 'raw', 'sha256', fx.rawSha))).toBe(false);
    expect(fs.existsSync(path.join(fx.paths.dataDir, 'raw', fx.rawKey))).toBe(true);
    fx.sqlite.close();
  }, 60_000);

  it('2. unreferenced raw objects remain excluded', async () => {
    const fx = makeFixture();
    // An orphan object on disk with no raw_snapshots row.
    const orphan = path.join(fx.paths.dataDir, 'raw', 'sha256', 'ff', `${'f'.repeat(64)}.json.gz`);
    fs.mkdirSync(path.dirname(orphan), { recursive: true });
    fs.writeFileSync(orphan, Buffer.from('orphan'));

    const created = await backupFull(fx);
    const { manifest } = manifestOf(created.archivePath);
    const paths = manifest.files.map((f) => f.path);

    expect(paths).toContain(`raw/${fx.rawKey}`);
    expect(paths.some((p) => p.includes('f'.repeat(64)))).toBe(false);
    fx.sqlite.close();
  }, 60_000);

  it('3. a missing referenced raw object fails instead of silently succeeding', async () => {
    const fx = makeFixture();
    fs.rmSync(path.join(fx.paths.dataDir, 'raw', fx.rawKey), { force: true });

    await expect(backupFull(fx)).rejects.toThrow(/missing-referenced-raw-objects/);
    fx.sqlite.close();
  }, 60_000);

  it('4+5. raw restore lands at the storage-key path and is readable via FileRawSnapshotStore', async () => {
    const fx = makeFixture();
    const created = await backupFull(fx);
    const rawAbs = path.join(fx.paths.dataDir, 'raw', fx.rawKey);

    // Remove the on-disk object so the restore has to put it back.
    fs.rmSync(rawAbs, { force: true });
    expect(fs.existsSync(rawAbs)).toBe(false);

    await restoreBackup({
      db: fx.db,
      liveSqlite: fx.sqlite,
      dataDir: fx.paths.dataDir,
      dbPath: fx.paths.dbPath,
      archivePath: created.archivePath,
      passphrase: PASSPHRASE,
    });

    expect(fs.existsSync(rawAbs)).toBe(true);
    const store = new FileRawSnapshotStore(path.join(fx.paths.dataDir, 'raw'));
    expect(store.exists(fx.rawKey)).toBe(true);
    expect(store.get(fx.rawKey).equals(fx.rawBytes)).toBe(true);
  }, 90_000);
});

describe('M6 hotfix — creator documents restore to their storage key', () => {
  it('6+7. document restore lands at the storage-key path and is readable normally', async () => {
    const fx = makeFixture();
    const created = await backupFull(fx);
    const docAbs = path.join(fx.paths.dataDir, fx.docKey);

    fs.rmSync(docAbs, { force: true });
    expect(fs.existsSync(docAbs)).toBe(false);

    await restoreBackup({
      db: fx.db,
      liveSqlite: fx.sqlite,
      dataDir: fx.paths.dataDir,
      dbPath: fx.paths.dbPath,
      archivePath: created.archivePath,
      passphrase: PASSPHRASE,
    });

    // The normal reader resolves dataDir/<creator_documents.storage_key>.
    expect(fs.existsSync(docAbs)).toBe(true);
    expect(fs.readFileSync(docAbs).equals(fx.docBytes)).toBe(true);
    expect(sha(fs.readFileSync(docAbs))).toBe(fx.docSha);
    // The pre-hotfix destination must not be used.
    expect(fs.existsSync(path.join(fx.paths.dataDir, 'documents'))).toBe(false);
  }, 90_000);

  it('10. archive manifest maps every payload to its domain storage key', async () => {
    const fx = makeFixture();
    const created = await backupFull(fx);
    const { manifest } = manifestOf(created.archivePath);

    const payloads = manifest.files
      .map((f) => f.path)
      .filter((p) => p !== 'database/healthspan-dashboard.sqlite3');

    expect(payloads.sort()).toEqual([fx.docKey, `raw/${fx.rawKey}`].sort());
    fx.sqlite.close();
  }, 60_000);

  it('11. unsafe storage keys are rejected', () => {
    expect(() => toDomainRelKey('../escape/key')).toThrow(/Unsafe path/);
    expect(() => toDomainRelKey('/absolute/key')).toThrow(/Unsafe path/);
    expect(() => toDomainRelKey('C:/windows/key')).toThrow(/Unsafe path/);
    expect(() => toDomainRelKey('creator-docs/aa/')).toThrow(/Unsafe path/);
    expect(toDomainRelKey('creator-docs\\aa\\bb')).toBe('creator-docs/aa/bb');
  });
});

describe('M6 hotfix — failure injection and rollback operate on real payloads', () => {
  it('8+9. raw failure injection rolls prior bytes back to the true destination', async () => {
    process.env.HEALTHSPAN_BACKUP_TEST_HOOKS = '1';
    const fx = makeFixture();
    const created = await backupFull(fx);
    const rawAbs = path.join(fx.paths.dataDir, 'raw', fx.rawKey);

    // Replace the live object with different bytes; rollback must restore these.
    const sentinel = Buffer.from('pre-restore-sentinel-bytes');
    fs.writeFileSync(rawAbs, sentinel);

    await expect(
      restoreBackup({
        db: fx.db,
        liveSqlite: fx.sqlite,
        dataDir: fx.paths.dataDir,
        dbPath: fx.paths.dbPath,
        archivePath: created.archivePath,
        passphrase: PASSPHRASE,
        testFailAt: 'while-restoring-raw',
      }),
    ).rejects.toThrow(/injected-failure:while-restoring-raw/);

    // The hook fired on a real raw entry, and rollback put the sentinel back.
    expect(fs.readFileSync(rawAbs).equals(sentinel)).toBe(true);
  }, 90_000);

  it('8. document failure injection fires on a real document entry', async () => {
    process.env.HEALTHSPAN_BACKUP_TEST_HOOKS = '1';
    const fx = makeFixture();
    const created = await backupFull(fx);

    await expect(
      restoreBackup({
        db: fx.db,
        liveSqlite: fx.sqlite,
        dataDir: fx.paths.dataDir,
        dbPath: fx.paths.dbPath,
        archivePath: created.archivePath,
        passphrase: PASSPHRASE,
        testFailAt: 'while-restoring-documents',
      }),
    ).rejects.toThrow(/injected-failure:while-restoring-documents/);
  }, 90_000);
});

describe('M6 hotfix — legacy archive compatibility', () => {
  it('12a. legacy payload paths are mapped to their storage keys', async () => {
    const fx = makeFixture();
    const created = await backupFull(fx);
    const legacyPath = path.join(fx.paths.dataDir, 'legacy.healthspan-backup');
    rewriteArchivePaths(created.archivePath, legacyPath, (rel) => {
      if (rel === `raw/${fx.rawKey}`) return `raw/sha256/${fx.rawSha}`;
      if (rel === fx.docKey) return `documents/${fx.docId}/notes.txt`;
      return rel;
    });
    expect(verifyBackup({ archivePath: legacyPath, passphrase: PASSPHRASE }).ok).toBe(true);

    const rawAbs = path.join(fx.paths.dataDir, 'raw', fx.rawKey);
    const docAbs = path.join(fx.paths.dataDir, fx.docKey);
    fs.rmSync(rawAbs, { force: true });
    fs.rmSync(docAbs, { force: true });

    await restoreBackup({
      db: fx.db,
      liveSqlite: fx.sqlite,
      dataDir: fx.paths.dataDir,
      dbPath: fx.paths.dbPath,
      archivePath: legacyPath,
      passphrase: PASSPHRASE,
    });

    // Legacy entries land at the authoritative destinations, not where they sat.
    expect(fs.existsSync(rawAbs)).toBe(true);
    expect(fs.existsSync(docAbs)).toBe(true);
    expect(fs.existsSync(path.join(fx.paths.dataDir, 'documents'))).toBe(false);
    expect(fs.existsSync(path.join(fx.paths.dataDir, 'raw', 'sha256', fx.rawSha))).toBe(false);
  }, 90_000);

  it('12b. an unmappable legacy payload is rejected clearly, not restored to the wrong place', async () => {
    const fx = makeFixture();
    const created = await backupFull(fx);
    const legacyPath = path.join(fx.paths.dataDir, 'legacy-unmapped.healthspan-backup');
    const strayDocId = '00000000-0000-4000-8000-000000000000';
    rewriteArchivePaths(created.archivePath, legacyPath, (rel) => {
      if (rel === fx.docKey) return `documents/${strayDocId}/notes.txt`;
      return rel;
    });

    await expect(
      restoreBackup({
        db: fx.db,
        liveSqlite: fx.sqlite,
        dataDir: fx.paths.dataDir,
        dbPath: fx.paths.dbPath,
        archivePath: legacyPath,
        passphrase: PASSPHRASE,
      }),
    ).rejects.toThrow(/unsupported-archive:unmapped-legacy-document/);

    expect(fs.existsSync(path.join(fx.paths.dataDir, 'documents'))).toBe(false);
  }, 90_000);
});
