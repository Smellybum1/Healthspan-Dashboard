import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase } from '../client.js';
import { operationalEvents } from '../personalization-schema.js';

/**
 * Seeds operational events. **Test support only.**
 *
 * Includes an `info` event that must be filtered out, and a message carrying a bearer
 * token and an email so the panel's redaction has something real to remove.
 */
const BASE = Date.UTC(2026, 0, 1);

export type SeededOperationsDatabase = {
  db: ReturnType<typeof openDatabase>['db'];
  sqlite: ReturnType<typeof openDatabase>['sqlite'];
  dir: string;
};

export function seedOperationsFixture(): SeededOperationsDatabase {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-ops-'));
  const live = openDatabase({
    dbPath: path.join(dir, 'healthspan-dashboard.sqlite3'),
    migrateOnOpen: true,
  });

  for (const e of [
    { id: 'evt-info', severity: 'info', message: 'routine', createdAt: BASE + 1_000 },
    { id: 'evt-warn', severity: 'warn', message: 'disk nearly full', createdAt: BASE + 2_000 },
    {
      id: 'evt-error',
      severity: 'error',
      message: 'auth failed for owner@example.invalid with Bearer abc123token',
      createdAt: BASE + 3_000,
    },
  ]) {
    live.db
      .insert(operationalEvents)
      .values({
        id: e.id,
        kind: 'test',
        severity: e.severity,
        message: e.message,
        detailsJson: JSON.stringify({ contact: 'owner@example.invalid' }),
        createdAt: e.createdAt,
      })
      .run();
  }

  return { db: live.db, sqlite: live.sqlite, dir };
}
