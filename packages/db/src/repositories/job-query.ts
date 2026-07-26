import { and, asc, desc, eq, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { backgroundJobs } from '../schema.js';

/**
 * Query semantics shared by the local SQLite and Sites D1 job adapters.
 *
 * The claim predicate is the important one. `AND status = 'queued'` is what makes the
 * update conditional, and therefore what makes the claim atomic: two callers issuing it
 * for the same row cannot both change it.
 */

export const jobClaimOrder = [asc(backgroundJobs.priority), asc(backgroundJobs.createdAt)];
export const jobListOrder = desc(backgroundJobs.createdAt);

export function claimableWhere(now: number): SQL | undefined {
  return and(eq(backgroundJobs.status, 'queued'), lte(backgroundJobs.availableAt, now));
}

export function expiredLeaseWhere(now: number): SQL | undefined {
  return and(eq(backgroundJobs.status, 'running'), lte(backgroundJobs.leaseExpiresAt, now));
}

/** Conditional on the job still being queued — see the note at the top of this file. */
export function claimWhere(jobId: string): SQL | undefined {
  return and(eq(backgroundJobs.id, jobId), eq(backgroundJobs.status, 'queued'));
}

export { backgroundJobs };
