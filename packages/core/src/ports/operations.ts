/**
 * Operations readiness.
 *
 * See `./index.ts` for the rules that govern this directory.
 *
 * Almost all of the operations surface is local by nature: PRAGMA integrity checks,
 * `VACUUM`, the filesystem storage walk, backup listing, diagnostic bundles. None of that
 * has a hosted equivalent, and none of it is ported.
 *
 * What *is* shared is the one real read — recent operational events — and the shape of
 * the panel itself, so a hosted operations view reports each missing capability as
 * `not_applicable` with a reason rather than omitting the section or showing a reassuring
 * blank. §8 of the brief: a disabled feature is reported, never hidden behind an empty
 * success.
 */

export type OperationalEventRow = {
  id: string;
  kind: string;
  severity: string;
  message: string;
  detailsJson: string;
  createdAt: number;
};

/** Severities the operations panel surfaces. Everything else is routine. */
export const OPERATIONS_ERROR_SEVERITIES = ['error', 'warn'] as const;
export const OPERATIONS_RECENT_LIMIT = 20;

/**
 * A panel section a runtime cannot provide.
 *
 * `reason` is required: a section marked unavailable without one is indistinguishable
 * from a bug.
 */
export type UnavailableSection = {
  status: 'not_applicable';
  reason: string;
};

export type DatabaseSection =
  | {
      status: 'healthy' | 'degraded';
      integrity: unknown;
      foreignKeys: unknown;
      journalMode: unknown;
    }
  | UnavailableSection;

export type OperationsSections = {
  /** PRAGMA-backed locally; `not_applicable` hosted — D1 exposes no integrity check. */
  database: DatabaseSection;
  storage: unknown[] | UnavailableSection;
  backups: unknown[] | UnavailableSection;
  scheduler: unknown | UnavailableSection;
  worker: unknown | UnavailableSection;
  jobs: unknown[];
  runtimeVersion: string | null;
};

export interface OperationsReadRepository {
  listRecentEvents(severities: readonly string[], limit: number): Promise<OperationalEventRow[]>;
}
