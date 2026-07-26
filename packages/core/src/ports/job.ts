/**
 * Bounded background jobs.
 *
 * See `./index.ts` for the rules that govern this directory.
 *
 * This port exists to fix two defects, not merely to move code. Both were recorded in
 * `SITES_COMPATIBILITY_AUDIT.md` §5 and both are corrected here for **both** runtimes, on
 * the owner's ruling — a queue that can run the same job twice is not something to carry
 * forward deliberately.
 *
 * 1. **The claim was not atomic.** `claimNextJob` selected the next queued row and then
 *    updated it by id. Two workers selecting concurrently both saw the same row and both
 *    ran it; the code was only safe because exactly one in-process worker existed. The
 *    claim is now a *conditional* update — `WHERE id = ? AND status = 'queued'` — and the
 *    number of rows it changed decides the winner. A loser retries the next candidate.
 *    That is why {@link JobRepository.tryClaim} returns a count rather than a row.
 *
 * 2. **The lease was renewed once.** `renewLease` ran before the handler, against a 60s
 *    lease, so any job exceeding 60 seconds could be reclaimed while it was still
 *    executing. Renewal is now a heartbeat for the duration of the handler; see
 *    `startJobWorker` in `apps/api`, which owns the timer because a persistent timer is
 *    local-only.
 */

export type JobRow = {
  id: string;
  kind: string;
  status: string;
  priority: number;
  payloadJson: string;
  dedupeKey: string;
  availableAt: number;
  claimedAt: number | null;
  leaseExpiresAt: number | null;
  attemptCount: number;
  maxAttempts: number;
  lastError: string | null;
  parentJobId: string | null;
  relatedRunId: string | null;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
};

export type JobTerminalStatus = 'succeeded' | 'partial' | 'failed' | 'cancelled';

/** How long a claim holds a job before another worker may reclaim it. */
export const JOB_LEASE_MS = 60_000;

/**
 * How many queued candidates a claim attempt will try before giving up for this tick.
 *
 * Bounded on purpose: losing a race means another worker took the job, and the right
 * response is to move on rather than scan the whole queue.
 */
export const JOB_CLAIM_CANDIDATES = 5;

/** Renew at a third of the lease, so two consecutive misses still leave headroom. */
export const JOB_HEARTBEAT_MS = Math.floor(JOB_LEASE_MS / 3);

export const JOB_LIST_LIMIT_MAX = 200;
export const JOB_LIST_LIMIT_DEFAULT = 50;

export function normaliseJobListLimit(limit: number | undefined): number {
  return Math.min(JOB_LIST_LIMIT_MAX, Math.max(1, limit ?? JOB_LIST_LIMIT_DEFAULT));
}

export interface JobRepository {
  getJob(jobId: string): Promise<JobRow | null>;
  listJobs(limit: number): Promise<JobRow[]>;
  /** Return expired leases to the queue. Safe to run concurrently — it is idempotent. */
  recoverExpiredLeases(now: number): Promise<void>;
  /** Queued and available, in claim order. Bounded by {@link JOB_CLAIM_CANDIDATES}. */
  listClaimCandidates(now: number, limit: number): Promise<JobRow[]>;
  /**
   * Attempt to claim one job, conditional on it still being queued.
   *
   * Returns the number of rows changed: `1` means this caller won the race, `0` means
   * another already claimed it. The count is the whole point — a claim that reads and
   * then writes cannot be safe, however the read is ordered.
   */
  tryClaim(jobId: string, claim: { now: number; leaseExpiresAt: number }): Promise<number>;
  renewLease(jobId: string, leaseExpiresAt: number): Promise<void>;
  completeJob(
    jobId: string,
    result: {
      status: JobTerminalStatus;
      lastError: string | null;
      relatedRunId: string | null;
      completedAt: number;
    },
  ): Promise<void>;
  requeue(jobId: string, retry: { lastError: string; availableAt: number }): Promise<void>;
}
