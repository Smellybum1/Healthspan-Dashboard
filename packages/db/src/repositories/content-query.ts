import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm';
import type { ContentListQuery, ContentListSort } from '@healthspan/core';
import { contentItems } from '../schema.js';

/**
 * Query semantics shared by the local SQLite and Sites D1 adapters.
 *
 * The contract suite asserts that both adapters agree on filtering, case-insensitive
 * search, and sort order. This file is what makes that agreement structural rather than
 * coincidental: the predicate and the ordering are built once, from the same Drizzle
 * table definition, and each adapter differs only in how it executes them — synchronously
 * through `better-sqlite3`, or awaited through the D1 driver.
 *
 * Nothing here is driver-specific. `SQL` objects are dialect-level values, and
 * `../schema.js` imports only `drizzle-orm/sqlite-core`, so this module is safe to reach
 * from the edge bundle.
 */

export function contentListWhere(query: ContentListQuery): SQL | undefined {
  const filters: SQL[] = [];
  if (query.type) filters.push(eq(contentItems.type, query.type));
  if (query.q?.trim()) {
    const term = `%${query.q.trim().toLowerCase()}%`;
    filters.push(
      sql`(lower(${contentItems.title}) like ${term} or lower(coalesce(${contentItems.summary}, '')) like ${term})`,
    );
  }
  return filters.length ? and(...filters) : undefined;
}

export function contentListOrder(sort: ContentListSort | undefined): SQL {
  if (sort === 'title') return asc(contentItems.title);
  if (sort === 'published') return desc(contentItems.sourcePublishedAt);
  return desc(contentItems.updatedAt);
}

/** The count projection, kept here so a filtered count can never be built two ways. */
export const contentCountProjection = { count: sql<number>`count(*)` };
