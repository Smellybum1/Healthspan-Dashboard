import { describe, expect, it } from 'vitest';
import { JOB_LEASE_MS, type JobRepository } from '@healthspan/core';
import { claimNextJob, completeJob, failOrRequeueJob, listJobs } from '@healthspan/runtime';

/**
 * Adapter-agnostic contract for {@link JobRepository}.
 *
 * The claim cases are the reason this port exists. Both defects from
 * `SITES_COMPATIBILITY_AUDIT.md` §5 are asserted here directly: a second claimer cannot
 * take a running job, and a claim that loses the race moves on rather than double-running.
 */
export type JobContractHarness = {
  name: string;
  create(): Promise<JobRepository>;
};

export function runJobContract(harness: JobContractHarness) {
  describe(`JobRepository contract — ${harness.name}`, () => {
    it('claims the highest-priority available job first', async () => {
      const repo = await harness.create();
      const job = await claimNextJob(repo);
      // job-urgent has priority 10; job-normal has 100.
      expect(job?.id).toBe('job-urgent');
      expect(job?.status).toBe('running');
    });

    it('increments the attempt count and sets a lease on claim', async () => {
      const repo = await harness.create();
      const job = await claimNextJob(repo);
      expect(job?.attemptCount).toBe(1);
      expect(job?.claimedAt).toBeTypeOf('number');
      expect(job!.leaseExpiresAt!).toBeGreaterThan(Date.now());
      expect(job!.leaseExpiresAt!).toBeLessThanOrEqual(Date.now() + JOB_LEASE_MS);
    });

    it('preserves the original start time across re-claims', async () => {
      const repo = await harness.create();
      const first = await claimNextJob(repo);
      await failOrRequeueJob(repo, first!.id, 'boom', 0);
      const second = await claimNextJob(repo);
      expect(second?.id).toBe(first?.id);
      expect(second?.startedAt).toBe(first?.startedAt);
      expect(second?.attemptCount).toBe(2);
    });

    it('never lets two claimers hold the same job', async () => {
      // The defect this port exists to fix. The retired select-then-update let both
      // callers see the same queued row and both proceed.
      const repo = await harness.create();
      // Three are claimable: the two queued, plus job-stuck once its expired lease is
      // recovered. Each claim must return a different one.
      const claimed = [
        await claimNextJob(repo),
        await claimNextJob(repo),
        await claimNextJob(repo),
      ].map((j) => j?.id);
      expect(claimed).toEqual(['job-urgent', 'job-normal', 'job-stuck']);
      expect(new Set(claimed).size).toBe(3);
      // job-later is scheduled ahead, so nothing remains.
      expect(await claimNextJob(repo)).toBeNull();
    });

    it('refuses a conditional claim on a job someone else already took', async () => {
      const repo = await harness.create();
      const now = Date.now();
      const won = await repo.tryClaim('job-urgent', { now, leaseExpiresAt: now + JOB_LEASE_MS });
      const lost = await repo.tryClaim('job-urgent', { now, leaseExpiresAt: now + JOB_LEASE_MS });
      expect(won).toBe(1);
      // Zero rows changed: the row is no longer queued, so the second caller lost.
      expect(lost).toBe(0);
    });

    it('does not claim a job scheduled for the future', async () => {
      const repo = await harness.create();
      // Drain everything claimable — the two queued plus the recovered job-stuck.
      await claimNextJob(repo);
      await claimNextJob(repo);
      await claimNextJob(repo);
      // job-later has availableAt in the future, so it is still not claimable.
      expect(await claimNextJob(repo)).toBeNull();
      const all = await listJobs(repo);
      expect(all.find((j) => j.id === 'job-later')?.status).toBe('queued');
    });

    it('recovers an expired lease and lets the job be claimed again', async () => {
      const repo = await harness.create();
      // job-stuck is 'running' with a lease that expired in the past.
      const claimed: string[] = [];
      for (let i = 0; i < 3; i += 1) {
        const job = await claimNextJob(repo);
        if (job) claimed.push(job.id);
      }
      expect(claimed).toContain('job-stuck');
    });

    it('renews a lease without disturbing anything else', async () => {
      const repo = await harness.create();
      const job = await claimNextJob(repo);
      const extended = Date.now() + JOB_LEASE_MS * 2;
      await repo.renewLease(job!.id, extended);
      const after = await repo.getJob(job!.id);
      expect(after?.leaseExpiresAt).toBe(extended);
      expect(after?.status).toBe('running');
      expect(after?.attemptCount).toBe(job?.attemptCount);
    });

    it('completes a job and clears its lease', async () => {
      const repo = await harness.create();
      const job = await claimNextJob(repo);
      await completeJob(repo, job!.id, 'succeeded', undefined, 'run-1');
      const after = await repo.getJob(job!.id);
      expect(after).toMatchObject({
        status: 'succeeded',
        relatedRunId: 'run-1',
        leaseExpiresAt: null,
        claimedAt: null,
      });
      expect(after?.completedAt).toBeTypeOf('number');
    });

    it('requeues a failure while attempts remain', async () => {
      const repo = await harness.create();
      const job = await claimNextJob(repo);
      const outcome = await failOrRequeueJob(repo, job!.id, 'transient', 0);
      expect(outcome).toBe('requeued');
      const after = await repo.getJob(job!.id);
      expect(after).toMatchObject({ status: 'queued', lastError: 'transient', claimedAt: null });
    });

    it('fails a job for good once attempts are exhausted', async () => {
      const repo = await harness.create();
      // maxAttempts is 2 on job-urgent.
      const first = await claimNextJob(repo);
      await failOrRequeueJob(repo, first!.id, 'one', 0);
      const second = await claimNextJob(repo);
      expect(second?.id).toBe(first?.id);
      const outcome = await failOrRequeueJob(repo, second!.id, 'two', 0);
      expect(outcome).toBe('failed');
      expect((await repo.getJob(first!.id))?.status).toBe('failed');
    });

    it('lists jobs newest first, bounded by the shared limit', async () => {
      const repo = await harness.create();
      const jobs = await listJobs(repo);
      expect(jobs.map((j) => j.id)).toEqual(['job-later', 'job-stuck', 'job-normal', 'job-urgent']);
      expect(await listJobs(repo, 1)).toHaveLength(1);
      expect((await listJobs(repo, 0)).length).toBeGreaterThan(0);
      expect(await listJobs(repo, 9_999)).toHaveLength(4);
    });

    it('returns null for an unknown job rather than throwing', async () => {
      const repo = await harness.create();
      expect(await repo.getJob('nope')).toBeNull();
    });
  });
}
