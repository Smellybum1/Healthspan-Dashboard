import { createHash, randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { backgroundJobs, type HealthspanDb } from '@healthspan/db';
import { JOB_HEARTBEAT_MS, type JobRepository } from '@healthspan/core';
import { claimNextJob, completeJob, failOrRequeueJob, renewJobLease } from '@healthspan/runtime';
import { type M5JobKind } from './job-priorities.js';

export type JobKind = M5JobKind;

export type EnqueueJobInput = {
  kind: JobKind;
  payload: Record<string, unknown>;
  dedupeKey: string;
  priority?: number;
  availableAt?: number;
  maxAttempts?: number;
  parentJobId?: string;
};

/**
 * Enqueue a job. **Local-only, and synchronous by necessity.**
 *
 * Not on the shared port: it is a write with no hosted caller, and its call sites sit
 * inside a synchronous ingestion path, so an async version would cascade through three
 * local-only modules for no reachable benefit. When a hosted request-triggered tick needs
 * to enqueue, this moves.
 */
export function enqueueJob(db: HealthspanDb, input: EnqueueJobInput) {
  const existing = db
    .select()
    .from(backgroundJobs)
    .where(eq(backgroundJobs.dedupeKey, input.dedupeKey))
    .all()[0];
  if (existing && (existing.status === 'queued' || existing.status === 'running')) {
    return { job: existing, created: false as const };
  }

  const now = Date.now();
  const id = randomUUID();
  db.insert(backgroundJobs)
    .values({
      id,
      kind: input.kind,
      status: 'queued',
      priority: input.priority ?? 100,
      payloadJson: JSON.stringify(input.payload),
      dedupeKey: input.dedupeKey,
      availableAt: input.availableAt ?? now,
      attemptCount: 0,
      maxAttempts: input.maxAttempts ?? 3,
      parentJobId: input.parentJobId,
      createdAt: now,
    })
    .run();

  return {
    job: db.select().from(backgroundJobs).where(eq(backgroundJobs.id, id)).all()[0]!,
    created: true as const,
  };
}
export { JOB_PRIORITY } from './job-priorities.js';

/**
 * Stable dedupe key.
 *
 * Stays local: it hashes with `node:crypto`, and its callers are the local enqueue sites.
 * A Web Crypto equivalent would be asynchronous and would change every existing key, so
 * moving it would cost a behaviour change for no hosted benefit — no hosted write path
 * enqueues anything.
 */
export function stableDedupeKey(kind: string, payload: Record<string, unknown>) {
  return createHash('sha256').update(JSON.stringify({ kind, payload })).digest('hex').slice(0, 48);
}

export type JobHandler = (job: {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
}) => Promise<{
  status: 'succeeded' | 'partial' | 'failed';
  relatedRunId?: string;
  error?: string;
}>;

/**
 * The local job worker.
 *
 * Local-only by nature: it owns a persistent `setInterval`, which the hosted runtime has
 * no equivalent for. The queue *semantics* — claiming, completing, retrying — live in
 * `@healthspan/runtime` and are shared; this file is the timer around them.
 *
 * The lease is now renewed on a heartbeat for as long as the handler runs. Previously it
 * was renewed exactly once, before the handler started, against a sixty-second lease — so
 * any job taking longer than a minute could be reclaimed and run a second time while the
 * first was still executing. The heartbeat is cleared in a `finally`, so a handler that
 * throws stops extending its own lease.
 */
export function startJobWorker(opts: {
  repo: JobRepository;
  handler: JobHandler;
  intervalMs?: number;
  enabled?: boolean;
}) {
  if (opts.enabled === false) {
    return { stop() {} };
  }
  let stopped = false;

  async function tick() {
    if (stopped) return;
    const job = await claimNextJob(opts.repo);
    if (!job) return;

    const heartbeat = setInterval(() => {
      void renewJobLease(opts.repo, job.id);
    }, JOB_HEARTBEAT_MS);

    try {
      const payload = JSON.parse(job.payloadJson) as Record<string, unknown>;
      const result = await opts.handler({ id: job.id, kind: job.kind, payload });
      await completeJob(opts.repo, job.id, result.status, result.error, result.relatedRunId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'job failed';
      await failOrRequeueJob(opts.repo, job.id, message);
    } finally {
      clearInterval(heartbeat);
    }
  }

  const timer = setInterval(() => {
    void tick();
  }, opts.intervalMs ?? 750);
  void tick();

  return {
    stop() {
      stopped = true;
      clearInterval(timer);
    },
  };
}
