import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm';
import {
  normaliseContentPaging,
  toContentItemDto,
  type ContentListQuery,
  type ContentListResult,
  type ContentReadRepository,
} from '@healthspan/core';
import { contentItems } from '../schema.js';
import type { HealthspanDb } from '../client.js';

/**
 * Local SQLite implementation of {@link ContentReadRepository}.
 *
 * `better-sqlite3` is synchronous, so every method resolves immediately. The async
 * signature is not decoration: it is the contract D1 requires, and callers must await
 * regardless of which adapter is bound. Keeping the local adapter async-shaped is what
 * lets the same service code run against either runtime.
 */
export function createLocalContentReadRepository(db: HealthspanDb): ContentReadRepository {
  return {
    list(query: ContentListQuery): Promise<ContentListResult> {
      const { page, pageSize, offset } = normaliseContentPaging(query);

      const filters: SQL[] = [];
      if (query.type) filters.push(eq(contentItems.type, query.type));
      if (query.q?.trim()) {
        const term = `%${query.q.trim().toLowerCase()}%`;
        filters.push(
          sql`(lower(${contentItems.title}) like ${term} or lower(coalesce(${contentItems.summary}, '')) like ${term})`,
        );
      }
      const where = filters.length ? and(...filters) : undefined;

      const order =
        query.sort === 'title'
          ? asc(contentItems.title)
          : query.sort === 'published'
            ? desc(contentItems.sourcePublishedAt)
            : desc(contentItems.updatedAt);

      const base = db.select().from(contentItems);
      const rows = where
        ? base.where(where).orderBy(order).limit(pageSize).offset(offset).all()
        : base.orderBy(order).limit(pageSize).offset(offset).all();

      const countBase = db.select({ count: sql<number>`count(*)` }).from(contentItems);
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
