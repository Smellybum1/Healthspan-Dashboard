import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase, closeDatabase, databaseDoctor } from './client.js';
import { FileRawSnapshotStore } from './raw-store.js';
import { seedOperationalSources } from './seed-sources.js';
import { sources } from './schema.js';

describe('sqlite database', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-db-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('migrates, seeds sources, and survives reopen', () => {
    const dbPath = path.join(dir, 'healthspan-dashboard.sqlite3');
    const first = openDatabase({ dbPath, migrateOnOpen: true });
    seedOperationalSources(first.db);
    const count = first.db.select().from(sources).all().length;
    expect(count).toBe(4);
    const doctor = databaseDoctor(first.sqlite);
    expect(doctor.ok).toBe(true);
    expect(doctor.journalMode.toLowerCase()).toBe('wal');
    closeDatabase(first.sqlite);

    const second = openDatabase({ dbPath, migrateOnOpen: true });
    expect(second.db.select().from(sources).all().length).toBe(4);
    closeDatabase(second.sqlite);
  });

  it('stores and reuses gzipped raw snapshots', () => {
    const store = new FileRawSnapshotStore(path.join(dir, 'raw'));
    const bytes = Buffer.from('{"ok":true,"n":1}', 'utf8');
    const a = store.put(bytes, 'json');
    const b = store.put(bytes, 'json');
    expect(a.reused).toBe(false);
    expect(b.reused).toBe(true);
    expect(store.get(a.storageKey).toString('utf8')).toBe(bytes.toString('utf8'));
  });

  it('rejects path traversal in raw store', () => {
    const store = new FileRawSnapshotStore(path.join(dir, 'raw'));
    expect(() => store.get('../secret')).toThrow(/Invalid storage key/);
  });
});
