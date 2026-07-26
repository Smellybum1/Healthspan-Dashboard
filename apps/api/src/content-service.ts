import type { ContentListQuery, ContentListResult, ContentReadRepository } from '@healthspan/core';

export type { ContentListQuery, ContentListResult };

/**
 * Hosted-reachable content reads.
 *
 * This service takes the {@link ContentReadRepository} port rather than a
 * `HealthspanDb` handle, so the same code path serves the local SQLite runtime and the
 * hosted D1 runtime with exactly one adapter bound at a time. The query lives in the
 * adapter; the DTO mapping lives in `@healthspan/core` so the two adapters cannot drift
 * into different shapes.
 *
 * Ledger row: `content-service.ts` → `ContentReadRepository` → conversion `done`.
 */
export function listContentItems(
  repo: ContentReadRepository,
  query: ContentListQuery,
): Promise<ContentListResult> {
  return repo.list(query);
}
