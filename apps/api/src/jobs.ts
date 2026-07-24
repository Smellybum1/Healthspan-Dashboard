import { createHash, randomUUID } from 'node:crypto';
import { and, asc, eq, lte, sql } from 'drizzle-orm';
import { backgroundJobs, type HealthspanDb } from '@healthspan/db';
import { type M5JobKind } from './job-priorities.js';

export type JobKind = M5JobKind;
export { JOB_PRIORITY } from './job-priorities.js';

export type EnqueueJobInput = {
  kind: JobKind;
  payload: Record<string, unknown>;
  dedupeKey: string;
  priority?: number;
  availableAt?: number;
  maxAttempts?: number;
  parentJobId?: string;
};

const LEASE_MS = 60_000;

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

  const job = db.select().from(backgroundJobs).where(eq(backgroundJobs.id, id)).all()[0]!;
  return { job, created: true as const };
}

export function claimNextJob(db: HealthspanDb) {
  const now = Date.now();
  // recover stale leases
  db.update(backgroundJobs)
    .set({ status: 'queued', claimedAt: null, leaseExpiresAt: null })
    .where(and(eq(backgroundJobs.status, 'running'), lte(backgroundJobs.leaseExpiresAt, now)))
    .run();

  const next = db
    .select()
    .from(backgroundJobs)
    .where(and(eq(backgroundJobs.status, 'queued'), lte(backgroundJobs.availableAt, now)))
    .orderBy(asc(backgroundJobs.priority), asc(backgroundJobs.createdAt))
    .limit(1)
    .all()[0];
  if (!next) return null;

  db.update(backgroundJobs)
    .set({
      status: 'running',
      claimedAt: now,
      startedAt: next.startedAt ?? now,
      leaseExpiresAt: now + LEASE_MS,
      attemptCount: next.attemptCount + 1,
    })
    .where(eq(backgroundJobs.id, next.id))
    .run();

  return db.select().from(backgroundJobs).where(eq(backgroundJobs.id, next.id)).all()[0]!;
}

export function completeJob(
  db: HealthspanDb,
  jobId: string,
  status: 'succeeded' | 'partial' | 'failed' | 'cancelled',
  lastError?: string,
  relatedRunId?: string,
) {
  db.update(backgroundJobs)
    .set({
      status,
      lastError: lastError ?? null,
      relatedRunId: relatedRunId ?? null,
      completedAt: Date.now(),
      leaseExpiresAt: null,
      claimedAt: null,
    })
    .where(eq(backgroundJobs.id, jobId))
    .run();
}

export function renewLease(db: HealthspanDb, jobId: string) {
  db.update(backgroundJobs)
    .set({ leaseExpiresAt: Date.now() + LEASE_MS })
    .where(eq(backgroundJobs.id, jobId))
    .run();
}

export function getJob(db: HealthspanDb, jobId: string) {
  return db.select().from(backgroundJobs).where(eq(backgroundJobs.id, jobId)).all()[0] ?? null;
}

export function listJobs(db: HealthspanDb, limit = 50) {
  return db
    .select()
    .from(backgroundJobs)
    .orderBy(sql`${backgroundJobs.createdAt} desc`)
    .limit(limit)
    .all();
}

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

export function startJobWorker(opts: {
  db: HealthspanDb;
  handler: JobHandler;
  intervalMs?: number;
  enabled?: boolean;
}) {
  if (opts.enabled === false) {
    return { stop() {} };
  }
  let stopped = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  async function tick() {
    if (stopped) return;
    const job = claimNextJob(opts.db);
    if (!job) return;
    try {
      renewLease(opts.db, job.id);
      const payload = JSON.parse(job.payloadJson) as Record<string, unknown>;
      const result = await opts.handler({ id: job.id, kind: job.kind, payload });
      completeJob(opts.db, job.id, result.status, result.error, result.relatedRunId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'job failed';
      const row = getJob(opts.db, job.id);
      if (row && row.attemptCount >= row.maxAttempts) {
        completeJob(opts.db, job.id, 'failed', message);
      } else {
        opts.db
          .update(backgroundJobs)
          .set({
            status: 'queued',
            lastError: message,
            claimedAt: null,
            leaseExpiresAt: null,
            availableAt: Date.now() + 5_000,
          })
          .where(eq(backgroundJobs.id, job.id))
          .run();
      }
    }
  }

  timer = setInterval(() => {
    void tick();
  }, opts.intervalMs ?? 750);
  void tick();

  return {
    stop() {
      stopped = true;
      if (timer) clearInterval(timer);
    },
  };
}
