import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm';
import { contentItems, type HealthspanDb } from '@healthspan/db';

export type ContentListQuery = {
  type?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: 'updated' | 'title' | 'published';
};

export function listContentItems(db: HealthspanDb, query: ContentListQuery) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  const offset = (page - 1) * pageSize;

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

  const rows = where
    ? db.select().from(contentItems).where(where).orderBy(order).limit(pageSize).offset(offset).all()
    : db.select().from(contentItems).orderBy(order).limit(pageSize).offset(offset).all();

  const countRow = where
    ? db
        .select({ count: sql<number>`count(*)` })
        .from(contentItems)
        .where(where)
        .all()[0]
    : db.select({ count: sql<number>`count(*)` }).from(contentItems).all()[0];

  return {
    page,
    pageSize,
    total: Number(countRow?.count ?? 0),
    items: rows.map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      summary: i.summary ?? '',
      tags: [] as string[],
      publishedAt: i.sourcePublishedAt ? new Date(i.sourcePublishedAt).toISOString() : null,
      updatedAt: new Date(i.updatedAt).toISOString(),
      officialUrl: i.canonicalUrl ?? undefined,
      dataOrigin: 'live' as const,
    })),
  };
}
