import {
  CONTENT_PAGE_SIZE_DEFAULT,
  type ContentListQuery,
  type ContentListResult,
  type ContentListSort,
  type ContentReadRepository,
} from '@healthspan/core';

export type { ContentListQuery, ContentListResult };

const SORTS: ContentListSort[] = ['updated', 'title', 'published'];

/**
 * Coerce untrusted query-string values into a {@link ContentListQuery}.
 *
 * This lives beside the service rather than in either app because both runtimes receive
 * the same strings from the same URL shape, and two independent coercions would be two
 * chances to disagree about what `?page=abc` means. Out-of-range and unparseable values
 * fall back to the defaults; the repository ports then clamp them to the shared bounds.
 */
export function parseContentListQuery(params: {
  type?: string | undefined;
  q?: string | undefined;
  page?: string | undefined;
  pageSize?: string | undefined;
  sort?: string | undefined;
}): ContentListQuery {
  const page = Number(params.page ?? 1);
  const pageSize = Number(params.pageSize ?? CONTENT_PAGE_SIZE_DEFAULT);
  const sort = SORTS.find((s) => s === params.sort);
  return {
    type: params.type?.trim() || undefined,
    q: params.q?.trim() || undefined,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : CONTENT_PAGE_SIZE_DEFAULT,
    sort: sort ?? 'updated',
  };
}

/**
 * Hosted-reachable content reads.
 *
 * This service takes the {@link ContentReadRepository} port rather than a `HealthspanDb`
 * handle, so the same code path serves the local SQLite runtime and the hosted D1
 * runtime with exactly one adapter bound at a time. The query lives in the adapter; the
 * DTO mapping lives in `@healthspan/core` so the two adapters cannot drift into
 * different shapes.
 *
 * Ledger row: `packages/runtime/src/content.ts` → `ContentReadRepository` → `done`.
 */
export function listContentItems(
  repo: ContentReadRepository,
  query: ContentListQuery,
): Promise<ContentListResult> {
  return repo.list(query);
}
