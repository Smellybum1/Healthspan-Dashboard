/**
 * Scheduler boundary for Milestone 3.
 * Local MVP uses Australia/Brisbane 06:00 daily + startup catch-up.
 * Hosted scheduling belongs to Milestone 7.
 */
export type SchedulerTrigger = 'manual' | 'scheduled' | 'startup_catchup' | 'cli' | 'test';

export interface IngestionScheduler {
  /** Catch-up / schedule arm on API boot. */
  onStartupCatchup(): Promise<void>;
  /** Future: register periodic jobs. */
  schedule?(cronExpression: string): void;
}

export function createNoopScheduler(): IngestionScheduler {
  return {
    async onStartupCatchup() {
      // Disabled in tests / when HEALTHSPAN_SCHEDULER_ENABLED is not true.
    },
  };
}
