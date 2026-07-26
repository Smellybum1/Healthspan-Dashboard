import {
  normaliseContentPaging,
  toContentItemDto,
  type ContentItemRow,
  type ContentListQuery,
  type ContentListResult,
  type ContentReadRepository,
} from '@healthspan/core';
import { contentItems } from '../../schema.js';
import {
  contentCountProjection,
  contentListOrder,
  contentListWhere,
} from '../../repositories/content-query.js';
import type { SitesD1Database } from './client.js';

/**
 * Sites/D1 implementation of {@link ContentReadRepository}.
 *
 * Structurally the same query as the local adapter, because it *is* the same query:
 * the predicate, the ordering, and the count projection all come from
 * `repositories/content-query.js`. Only execution differs. D1 is async-only, so the two
 * statements are awaited rather than returned synchronously.
 *
 * The row and the count are issued as two awaits rather than one `batch`. D1's batch is
 * a transaction, and a read pair needs no transaction; two statements also keep the
 * failure mode legible, which matters more here than one saved round trip on a
 * synthetic-data preview.
 *
 * This adapter binds `repositories/content.contract.ts` — the same suite the local
 * adapter runs, not a parallel one. Parity asserted by two separately-authored test
 * files is two opinions, not parity.
 */
export function createSitesContentReadRepository(db: SitesD1Database): ContentReadRepository {
  return {
    async list(query: ContentListQuery): Promise<ContentListResult> {
      const { page, pageSize, offset } = normaliseContentPaging(query);
      const where = contentListWhere(query);
      const order = contentListOrder(query.sort);

      const base = db.select().from(contentItems);
      const rows = await (where
        ? base.where(where).orderBy(order).limit(pageSize).offset(offset)
        : base.orderBy(order).limit(pageSize).offset(offset));

      const countBase = db.select(contentCountProjection).from(contentItems);
      const countRows = await (where ? countBase.where(where) : countBase);

      return {
        page,
        pageSize,
        total: Number(countRows[0]?.count ?? 0),
        items: (rows as ContentItemRow[]).map(toContentItemDto),
      };
    },
  };
}
