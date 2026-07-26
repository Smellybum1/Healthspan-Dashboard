/**
 * Content read models — the first domain ported to the shared async contract.
 *
 * See `./index.ts` for the rules that govern this directory.
 */

export type ContentListSort = 'updated' | 'title' | 'published';

export type ContentListQuery = {
  type?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: ContentListSort;
};

export type ContentItemDto = {
  id: string;
  type: string;
  title: string;
  summary: string;
  tags: string[];
  publishedAt: string | null;
  updatedAt: string;
  officialUrl?: string;
  dataOrigin: 'live';
};

export type ContentListResult = {
  page: number;
  pageSize: number;
  total: number;
  items: ContentItemDto[];
};

export interface ContentReadRepository {
  list(query: ContentListQuery): Promise<ContentListResult>;
}

/** Paging bounds, applied identically by every adapter. */
export const CONTENT_PAGE_SIZE_MAX = 100;
export const CONTENT_PAGE_SIZE_DEFAULT = 25;

export function normaliseContentPaging(query: ContentListQuery): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(
    CONTENT_PAGE_SIZE_MAX,
    Math.max(1, query.pageSize ?? CONTENT_PAGE_SIZE_DEFAULT),
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}

/**
 * Row shape both adapters project into before mapping. Keeping the mapper here is what
 * stops the local and Sites services from drifting into two different DTOs.
 */
export type ContentItemRow = {
  id: string;
  type: string;
  title: string;
  summary: string | null;
  sourcePublishedAt: number | null;
  updatedAt: number;
  canonicalUrl: string | null;
};

export function toContentItemDto(row: ContentItemRow): ContentItemDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    summary: row.summary ?? '',
    tags: [],
    publishedAt: row.sourcePublishedAt ? new Date(row.sourcePublishedAt).toISOString() : null,
    updatedAt: new Date(row.updatedAt).toISOString(),
    officialUrl: row.canonicalUrl ?? undefined,
    dataOrigin: 'live',
  };
}
