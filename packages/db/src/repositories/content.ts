import {
  normaliseContentPaging,
  toContentItemDto,
  type ContentListQuery,
  type ContentListResult,
  type ContentReadRepository,
} from '@healthspan/core';
import { contentItems } from '../schema.js';
import type { HealthspanDb } from '../client.js';
import { contentCountProjection, contentListOrder, contentListWhere } from './content-query.js';

/**
 * Local SQLite implementation of {@link ContentReadRepository}.
 *
 * `better-sqlite3` is synchronous, so every method resolves immediately. The async
 * signature is not decoration: it is the contract D1 requires, and callers must await
 * regardless of which adapter is bound. Keeping the local adapter async-shaped is what
 * lets the same service code run against either runtime.
 *
 * The predicate and the ordering come from `./content-query.js`, shared with the D1
 * adapter. What differs here is only execution: `.all()` returns rows synchronously.
 */
export function createLocalContentReadRepository(db: HealthspanDb): ContentReadRepository {
  return {
    list(query: ContentListQuery): Promise<ContentListResult> {
      const { page, pageSize, offset } = normaliseContentPaging(query);
      const where = contentListWhere(query);
      const order = contentListOrder(query.sort);

      const base = db.select().from(contentItems);
      const rows = where
        ? base.where(where).orderBy(order).limit(pageSize).offset(offset).all()
        : base.orderBy(order).limit(pageSize).offset(offset).all();

      const countBase = db.select(contentCountProjection).from(contentItems);
      const countRow = (where ? countBase.where(where).all() : countBase.all())[0];

      return Promise.resolve({
        page,
        pageSize,
        total: Number(countRow?.count ?? 0),
        items: rows.map(toContentItemDto),
      });
    },
  };
}
