import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase, closeDatabase, databaseDoctor } from './client.js';
import { FileRawSnapshotStore } from './raw-store.js';
import { DEFAULT_SOURCES, seedOperationalSources } from './seed-sources.js';
import { sources } from './schema.js';
import {
  claimRecurrenceSnapshots,
  creatorClaimEvidenceLinks,
  creatorRoles,
  monitoredCreatorSources,
  platformContentCurrent,
  platformPolicyVersions,
} from './creator-schema.js';


describe('sqlite database', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-db-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // Windows may briefly lock WAL companions after close.
    }
  });

  it('migrates, seeds sources, and survives reopen', () => {
    const dbPath = path.join(dir, 'healthspan-dashboard.sqlite3');
    const first = openDatabase({ dbPath, migrateOnOpen: true });
    seedOperationalSources(first.db);
    const count = first.db.select().from(sources).all().length;
    expect(count).toBe(DEFAULT_SOURCES.length);
    const doctor = databaseDoctor(first.sqlite);
    expect(doctor.ok).toBe(true);
    expect(doctor.journalMode.toLowerCase()).toBe('wal');
    closeDatabase(first.sqlite);

    const second = openDatabase({ dbPath, migrateOnOpen: true });
    expect(second.db.select().from(sources).all().length).toBe(DEFAULT_SOURCES.length);
    closeDatabase(second.sqlite);
  });

  it('applies M5 creator schema depth migration tables', () => {
    const dbPath = path.join(dir, 'healthspan-dashboard.sqlite3');
    const { db, sqlite } = openDatabase({ dbPath, migrateOnOpen: true });
    expect(db.select().from(creatorRoles).all()).toEqual([]);
    expect(db.select().from(monitoredCreatorSources).all()).toEqual([]);
    expect(db.select().from(platformPolicyVersions).all()).toEqual([]);
    expect(db.select().from(platformContentCurrent).all()).toEqual([]);
    expect(db.select().from(creatorClaimEvidenceLinks).all()).toEqual([]);
    expect(db.select().from(claimRecurrenceSnapshots).all()).toEqual([]);
    const cols = sqlite
      .prepare(`PRAGMA table_info(creator_claims)`)
      .all() as Array<{ name: string }>;
    const names = new Set(cols.map((c) => c.name));
    expect(names.has('claim_fingerprint')).toBe(true);
    expect(names.has('lifecycle_state')).toBe(true);
    expect(names.has('review_status')).toBe(true);
    closeDatabase(sqlite);
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
