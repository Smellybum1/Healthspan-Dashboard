import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase } from '../client.js';
import { backgroundJobs } from '../schema.js';

/**
 * Seeds a migrated database with background jobs. **Test support only.**
 *
 * Four jobs covering what the claim has to get right: two claimable at different
 * priorities, one whose lease has expired while `running` (it must be recovered), and one
 * scheduled for the future (it must not be claimed).
 */
const BASE = Date.UTC(2026, 0, 1);

export type SeededJobDatabase = {
  db: ReturnType<typeof openDatabase>['db'];
  sqlite: ReturnType<typeof openDatabase>['sqlite'];
  dir: string;
};

export function seedJobFixture(): SeededJobDatabase {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-jobs-'));
  const live = openDatabase({
    dbPath: path.join(dir, 'healthspan-dashboard.sqlite3'),
    migrateOnOpen: true,
  });
  const now = Date.now();

  const jobs = [
    {
      id: 'job-urgent',
      priority: 10,
      status: 'queued',
      availableAt: now - 1_000,
      leaseExpiresAt: null as number | null,
      maxAttempts: 2,
      createdAt: BASE + 1_000,
    },
    {
      id: 'job-normal',
      priority: 100,
      status: 'queued',
      availableAt: now - 1_000,
      leaseExpiresAt: null,
      maxAttempts: 3,
      createdAt: BASE + 2_000,
    },
    {
      // Running with a lease that expired: must be recovered and claimable again.
      id: 'job-stuck',
      priority: 100,
      status: 'running',
      availableAt: now - 1_000,
      leaseExpiresAt: now - 60_000,
      maxAttempts: 3,
      createdAt: BASE + 3_000,
    },
    {
      // Scheduled for the future: must not be claimed.
      id: 'job-later',
      priority: 1,
      status: 'queued',
      availableAt: now + 600_000,
      leaseExpiresAt: null,
      maxAttempts: 3,
      createdAt: BASE + 4_000,
    },
  ];

  for (const j of jobs) {
    live.db
      .insert(backgroundJobs)
      .values({
        id: j.id,
        kind: 'intelligence',
        status: j.status,
        priority: j.priority,
        payloadJson: JSON.stringify({ trigger: 'test' }),
        dedupeKey: `dedupe-${j.id}`,
        availableAt: j.availableAt,
        leaseExpiresAt: j.leaseExpiresAt,
        attemptCount: 0,
        maxAttempts: j.maxAttempts,
        createdAt: j.createdAt,
      })
      .run();
  }

  return { db: live.db, sqlite: live.sqlite, dir };
}
