/**
 * Version and retention constants shared by both runtimes.
 *
 * These lived in `@healthspan/operations`, whose root imports `node:crypto` and the
 * filesystem backup format and is therefore unreachable from the hosted graph. They are
 * plain values with no dependencies, so they move here rather than being duplicated —
 * two copies of a schema version is exactly the kind of drift that goes unnoticed until
 * a migration disagrees with a response.
 *
 * `@healthspan/operations` re-exports them, so local import sites are unchanged.
 */

export const APP_VERSION = '0.6.0';
export const SCHEMA_VERSION = 12;

export const DEFAULT_RETENTION_RULES = {
  operational_events_days: 90,
  diagnostic_bundles_days: 30,
  alert_state_events_days: 180,
  raw_snapshot_policy: 'content_addressed_keep_referenced',
} as const;
