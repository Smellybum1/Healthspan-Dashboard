/**
 * Scheduler boundary for Milestone 2.
 * Local MVP uses manual / CLI / API-triggered runs.
 * Hosted scheduling belongs to Milestone 7.
 */
export type SchedulerTrigger = 'manual' | 'scheduled' | 'startup_catchup' | 'cli' | 'test';

export interface IngestionScheduler {
  /** Optional catch-up on API boot. Default implementation is a no-op. */
  onStartupCatchup(): Promise<void>;
  /** Future: register periodic jobs. */
  schedule?(cronExpression: string): void;
}

export function createNoopScheduler(): IngestionScheduler {
  return {
    async onStartupCatchup() {
      // Intentionally empty in M2 — first sync is explicit via Settings / CLI / API.
    },
  };
}
