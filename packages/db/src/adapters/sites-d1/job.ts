import { eq, sql } from 'drizzle-orm';
import type { JobRepository, JobRow, JobTerminalStatus } from '@healthspan/core';
import {
  backgroundJobs,
  claimWhere,
  claimableWhere,
  expiredLeaseWhere,
  jobClaimOrder,
  jobListOrder,
} from '../../repositories/job-query.js';
import type { SitesD1Database } from './client.js';

/**
 * Sites/D1 implementation of {@link JobRepository}.
 *
 * Same predicates as the local adapter, from the same `repositories/job-query.js`. The
 * claim is the reason this port exists: `tryClaim` issues the conditional update and
 * reports `meta.changes`, so two isolates racing for the same job cannot both win.
 *
 * That matters more here than locally. The retired implementation was safe only because
 * exactly one in-process worker existed — an assumption a request-triggered hosted tick
 * cannot make, since two requests can arrive at once.
 */
export function createSitesJobRepository(db: SitesD1Database): JobRepository {
  return {
    async getJob(jobId) {
      const rows = await db.select().from(backgroundJobs).where(eq(backgroundJobs.id, jobId));
      return (rows[0] ?? null) as JobRow | null;
    },

    async listJobs(limit) {
      return (await db
        .select()
        .from(backgroundJobs)
        .orderBy(jobListOrder)
        .limit(limit)) as JobRow[];
    },

    async recoverExpiredLeases(now) {
      await db
        .update(backgroundJobs)
        .set({ status: 'queued', claimedAt: null, leaseExpiresAt: null })
        .where(expiredLeaseWhere(now));
    },

    async listClaimCandidates(now, limit) {
      return (await db
        .select()
        .from(backgroundJobs)
        .where(claimableWhere(now))
        .orderBy(...jobClaimOrder)
        .limit(limit)) as JobRow[];
    },

    async tryClaim(jobId, { now, leaseExpiresAt }) {
      const result = await db
        .update(backgroundJobs)
        .set({
          status: 'running',
          claimedAt: now,
          startedAt: sql`coalesce(${backgroundJobs.startedAt}, ${now})`,
          leaseExpiresAt,
          attemptCount: sql`${backgroundJobs.attemptCount} + 1`,
        })
        .where(claimWhere(jobId));
      const meta = (result as { meta?: { changes?: number } }).meta;
      return Number(meta?.changes ?? 0);
    },

    async renewLease(jobId, leaseExpiresAt) {
      await db.update(backgroundJobs).set({ leaseExpiresAt }).where(eq(backgroundJobs.id, jobId));
    },

    async completeJob(jobId, result: { status: JobTerminalStatus } & Record<string, unknown>) {
      await db
        .update(backgroundJobs)
        .set({
          status: result.status,
          lastError: result.lastError as string | null,
          relatedRunId: result.relatedRunId as string | null,
          completedAt: result.completedAt as number,
          leaseExpiresAt: null,
          claimedAt: null,
        })
        .where(eq(backgroundJobs.id, jobId));
    },

    async requeue(jobId, retry) {
      await db
        .update(backgroundJobs)
        .set({
          status: 'queued',
          lastError: retry.lastError,
          claimedAt: null,
          leaseExpiresAt: null,
          availableAt: retry.availableAt,
        })
        .where(eq(backgroundJobs.id, jobId));
    },
  };
}
