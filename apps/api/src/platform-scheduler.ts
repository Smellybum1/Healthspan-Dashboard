import { enqueueJob, JOB_PRIORITY, stableDedupeKey } from './jobs.js';
import {
  getXComplianceStatus,
  isXComplianceOverdue,
  type XComplianceStatus,
} from './x-sync-service.js';
import type { HealthspanDb } from '@healthspan/db';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Startup + daily X compliance reconciliation when X is enabled.
 * Optional YouTube scheduled refresh when HEALTHSPAN_YOUTUBE_SCHEDULED_SYNC=true.
 * X content sync remains disabled by default per brief §21.1.
 */
export function createPlatformScheduler(opts: {
  db: HealthspanDb;
  enabled?: boolean;
  intervalMs?: number;
}) {
  const enabled =
    opts.enabled ??
    (process.env.HEALTHSPAN_SCHEDULER_ENABLED === 'true' ||
      process.env.NODE_ENV === 'production');
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastDailyKey: string | null = null;

  function xEnabled() {
    return process.env.HEALTHSPAN_X_ENABLED === 'true';
  }

  function enqueueCompliance(reason: string) {
    if (!xEnabled()) {
      return { enqueued: false, reason: 'x_disabled' as const };
    }
    const day = new Date().toISOString().slice(0, 10);
    const { created } = enqueueJob(opts.db, {
      kind: 'run_x_batch_compliance',
      payload: { trigger: reason, platform: 'x' },
      dedupeKey: stableDedupeKey('x-compliance', { day, reason: reason === 'startup' ? 'startup' : 'daily' }),
      priority: JOB_PRIORITY.COMPLIANCE,
    });
    return { enqueued: created, reason };
  }

  function tick(now = Date.now()) {
    if (!enabled) return { enqueued: false, reason: null as string | null, status: getXComplianceStatus(opts.db) };
    const day = new Date(now).toISOString().slice(0, 10);
    const status = getXComplianceStatus(opts.db);
    const overdue = isXComplianceOverdue(status, now);

    if (process.env.HEALTHSPAN_YOUTUBE_SCHEDULED_SYNC === 'true' && lastDailyKey !== day) {
      enqueueJob(opts.db, {
        kind: 'sync_youtube_channel',
        payload: { trigger: 'scheduled_refresh', baseline: false },
        dedupeKey: stableDedupeKey('sync_youtube_scheduled', { day }),
        priority: JOB_PRIORITY.PLATFORM_SYNC,
      });
    }

    if (!xEnabled()) {
      if (lastDailyKey !== day) lastDailyKey = day;
      return { enqueued: false, reason: 'x_disabled' as string | null, status };
    }

    if (overdue || status.lastReconciledAt == null) {
      const result = enqueueCompliance(status.lastReconciledAt == null ? 'startup' : 'overdue');
      if (lastDailyKey !== day) lastDailyKey = day;
      return { ...result, status: getXComplianceStatus(opts.db) };
    }

    if (lastDailyKey !== day) {
      lastDailyKey = day;
      const result = enqueueCompliance('daily');
      return { ...result, status: getXComplianceStatus(opts.db) };
    }

    return { enqueued: false, reason: null as string | null, status };
  }

  async function onStartupCatchup() {
    if (!enabled) return;
    tick(Date.now());
    if (!timer) {
      timer = setInterval(() => tick(Date.now()), opts.intervalMs ?? 60_000);
    }
  }

  return {
    tick,
    onStartupCatchup,
    getStatus(): { enabled: boolean; xEnabled: boolean; compliance: XComplianceStatus } {
      return {
        enabled,
        xEnabled: xEnabled(),
        compliance: getXComplianceStatus(opts.db),
      };
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    },
    maxAgeMs: Number(process.env.HEALTHSPAN_X_COMPLIANCE_MAX_AGE_HOURS ?? 24) * 60 * 60 * 1000 || DAY_MS,
  };
}
