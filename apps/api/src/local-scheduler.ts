import { eq } from 'drizzle-orm';
import { schedulerState, type HealthspanDb } from '@healthspan/db';
import type { IngestionScheduler } from './scheduler.js';
import { enqueueJob, stableDedupeKey, JOB_PRIORITY } from './jobs.js';
import { fdaBulkSourceSchedules } from './source-schedule.js';

/** Next 06:00 Australia/Brisbane as UTC ms. */
export function nextBrisbaneSixAm(fromMs = Date.now()): number {
  // Brisbane is UTC+10 year-round (no DST).
  const offsetMs = 10 * 60 * 60 * 1000;
  const local = new Date(fromMs + offsetMs);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  let candidate = Date.UTC(y, m, d, 6, 0, 0) - offsetMs;
  if (candidate <= fromMs) {
    candidate += 24 * 60 * 60 * 1000;
  }
  return candidate;
}

export function createLocalScheduler(opts: {
  db: HealthspanDb;
  enabled?: boolean;
  staleThresholdMs?: number;
}): IngestionScheduler & {
  ensureState(): void;
  tick(now?: number): { enqueued: boolean; reason: string | null };
  getStatus(): Record<string, unknown>;
  stop(): void;
} {
  const enabled =
    opts.enabled ??
    (process.env.HEALTHSPAN_SCHEDULER_ENABLED === 'true' ||
      process.env.NODE_ENV === 'production');
  const staleThreshold = opts.staleThresholdMs ?? 24 * 60 * 60 * 1000;
  let timer: ReturnType<typeof setInterval> | null = null;

  function ensureState() {
    const row = opts.db.select().from(schedulerState).where(eq(schedulerState.id, 'local')).all()[0];
    if (!row) {
      const now = Date.now();
      opts.db
        .insert(schedulerState)
        .values({
          id: 'local',
          timezone: 'Australia/Brisbane',
          cronExpression: '0 6 * * *',
          enabled: true,
          nextRunAt: nextBrisbaneSixAm(now),
          updatedAt: now,
        })
        .run();
    }
  }

  function getStatus() {
    ensureState();
    const row = opts.db.select().from(schedulerState).where(eq(schedulerState.id, 'local')).all()[0]!;
    return {
      timezone: row.timezone,
      schedule: row.cronExpression,
      enabled: row.enabled && enabled,
      lastEnqueuedAt: row.lastEnqueuedAt ? new Date(row.lastEnqueuedAt).toISOString() : null,
      lastCompletedAt: row.lastCompletedAt ? new Date(row.lastCompletedAt).toISOString() : null,
      nextRunAt: row.nextRunAt ? new Date(row.nextRunAt).toISOString() : null,
      lastCatchupReason: row.lastCatchupReason,
      fdaBulkSchedules: fdaBulkSourceSchedules(),
    };
  }

  function tick(now = Date.now()) {
    if (!enabled) return { enqueued: false, reason: null };
    ensureState();
    const row = opts.db.select().from(schedulerState).where(eq(schedulerState.id, 'local')).all()[0]!;
    if (!row.enabled) return { enqueued: false, reason: null };

    let reason: string | null = null;
    const due = row.nextRunAt != null && row.nextRunAt <= now;
    const stale =
      row.lastCompletedAt == null || now - row.lastCompletedAt >= staleThreshold;

    if (due) reason = 'scheduled_0600_brisbane';
    else if (stale && (row.lastEnqueuedAt == null || now - row.lastEnqueuedAt >= staleThreshold)) {
      reason = 'startup_or_stale_catchup';
    }

    if (!reason) return { enqueued: false, reason: null };

    const payload = { sourceId: 'all', trigger: 'scheduled', recordCap: 50 };
    const { created } = enqueueJob(opts.db, {
      kind: 'ingestion',
      payload,
      dedupeKey: stableDedupeKey('ingestion-scheduled-day', {
        day: new Date(now).toISOString().slice(0, 10),
      }),
      priority: JOB_PRIORITY.SCHEDULED_INGESTION,
    });

    opts.db
      .update(schedulerState)
      .set({
        lastEnqueuedAt: now,
        nextRunAt: nextBrisbaneSixAm(now),
        lastCatchupReason: reason,
        updatedAt: now,
      })
      .where(eq(schedulerState.id, 'local'))
      .run();

    return { enqueued: created, reason };
  }

  async function onStartupCatchup() {
    if (!enabled) return;
    ensureState();
    tick(Date.now());
    if (!timer) {
      timer = setInterval(() => tick(Date.now()), 60_000);
    }
  }

  return {
    ensureState,
    tick,
    getStatus,
    onStartupCatchup,
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
}
