import {
  JOB_CLAIM_CANDIDATES,
  JOB_LEASE_MS,
  normaliseJobListLimit,
  type JobRepository,
  type JobRow,
  type JobTerminalStatus,
} from '@healthspan/core';

/**
 * Job claiming, leasing and completion.
 *
 * Enqueue is **not** here. It is a write with no hosted caller — hosted mutations are all
 * refused — and its local call sites sit inside a synchronous ingestion path, so porting
 * it would make three local-only modules async for no reachable benefit. What is shared
 * is the part that had to be corrected: the claim.
 */

export type { JobRow, JobTerminalStatus };

/**
 * Claim the next available job, atomically.
 *
 * Expired leases are recovered first, then each candidate is claimed with a conditional
 * update. Losing the race is normal, not an error: another worker took that job, so this
 * one tries the next candidate. Two workers can never both hold the same job, which the
 * retired select-then-update could not guarantee — it was safe only because exactly one
 * worker existed.
 */
export async function claimNextJob(repo: JobRepository): Promise<JobRow | null> {
  const now = Date.now();
  await repo.recoverExpiredLeases(now);

  const candidates = await repo.listClaimCandidates(now, JOB_CLAIM_CANDIDATES);
  for (const candidate of candidates) {
    const claimed = await repo.tryClaim(candidate.id, {
      now,
      leaseExpiresAt: now + JOB_LEASE_MS,
    });
    if (claimed === 1) return repo.getJob(candidate.id);
  }
  return null;
}

export function renewJobLease(repo: JobRepository, jobId: string): Promise<void> {
  return repo.renewLease(jobId, Date.now() + JOB_LEASE_MS);
}

export function completeJob(
  repo: JobRepository,
  jobId: string,
  status: JobTerminalStatus,
  lastError?: string,
  relatedRunId?: string,
): Promise<void> {
  return repo.completeJob(jobId, {
    status,
    lastError: lastError ?? null,
    relatedRunId: relatedRunId ?? null,
    completedAt: Date.now(),
  });
}

/**
 * Hand a failed job back to the queue, or fail it for good once attempts are exhausted.
 *
 * The attempt count was already incremented by the claim, so a job that has reached
 * `maxAttempts` has genuinely been tried that many times.
 */
export async function failOrRequeueJob(
  repo: JobRepository,
  jobId: string,
  lastError: string,
  retryDelayMs = 5_000,
): Promise<'failed' | 'requeued'> {
  const row = await repo.getJob(jobId);
  if (row && row.attemptCount >= row.maxAttempts) {
    await completeJob(repo, jobId, 'failed', lastError);
    return 'failed';
  }
  await repo.requeue(jobId, { lastError, availableAt: Date.now() + retryDelayMs });
  return 'requeued';
}

export function getJob(repo: JobRepository, jobId: string): Promise<JobRow | null> {
  return repo.getJob(jobId);
}

export function listJobs(repo: JobRepository, limit?: number): Promise<JobRow[]> {
  return repo.listJobs(normaliseJobListLimit(limit));
}
