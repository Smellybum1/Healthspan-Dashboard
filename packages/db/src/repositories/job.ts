import { eq, sql } from 'drizzle-orm';
import type { JobRepository, JobRow, JobTerminalStatus } from '@healthspan/core';
import type { HealthspanDb } from '../client.js';
import {
  backgroundJobs,
  claimWhere,
  claimableWhere,
  expiredLeaseWhere,
  jobClaimOrder,
  jobListOrder,
} from './job-query.js';

/**
 * Local SQLite implementation of {@link JobRepository}.
 *
 * `tryClaim` reports `better-sqlite3`'s `changes` count. That number is the claim's
 * correctness: the conditional update either matched a still-queued row or it did not,
 * and no read can substitute for that.
 */
export function createLocalJobRepository(db: HealthspanDb): JobRepository {
  return {
    getJob(jobId) {
      const row = db.select().from(backgroundJobs).where(eq(backgroundJobs.id, jobId)).all()[0];
      return Promise.resolve((row ?? null) as JobRow | null);
    },

    listJobs(limit) {
      return Promise.resolve(
        db.select().from(backgroundJobs).orderBy(jobListOrder).limit(limit).all() as JobRow[],
      );
    },

    recoverExpiredLeases(now) {
      db.update(backgroundJobs)
        .set({ status: 'queued', claimedAt: null, leaseExpiresAt: null })
        .where(expiredLeaseWhere(now))
        .run();
      return Promise.resolve();
    },

    listClaimCandidates(now, limit) {
      return Promise.resolve(
        db
          .select()
          .from(backgroundJobs)
          .where(claimableWhere(now))
          .orderBy(...jobClaimOrder)
          .limit(limit)
          .all() as JobRow[],
      );
    },

    tryClaim(jobId, { now, leaseExpiresAt }) {
      const result = db
        .update(backgroundJobs)
        .set({
          status: 'running',
          claimedAt: now,
          startedAt: sql`coalesce(${backgroundJobs.startedAt}, ${now})`,
          leaseExpiresAt,
          attemptCount: sql`${backgroundJobs.attemptCount} + 1`,
        })
        .where(claimWhere(jobId))
        .run();
      return Promise.resolve(Number(result.changes ?? 0));
    },

    renewLease(jobId, leaseExpiresAt) {
      db.update(backgroundJobs).set({ leaseExpiresAt }).where(eq(backgroundJobs.id, jobId)).run();
      return Promise.resolve();
    },

    completeJob(jobId, result: { status: JobTerminalStatus } & Record<string, unknown>) {
      db.update(backgroundJobs)
        .set({
          status: result.status,
          lastError: result.lastError as string | null,
          relatedRunId: result.relatedRunId as string | null,
          completedAt: result.completedAt as number,
          leaseExpiresAt: null,
          claimedAt: null,
        })
        .where(eq(backgroundJobs.id, jobId))
        .run();
      return Promise.resolve();
    },

    requeue(jobId, retry) {
      db.update(backgroundJobs)
        .set({
          status: 'queued',
          lastError: retry.lastError,
          claimedAt: null,
          leaseExpiresAt: null,
          availableAt: retry.availableAt,
        })
        .where(eq(backgroundJobs.id, jobId))
        .run();
      return Promise.resolve();
    },
  };
}
