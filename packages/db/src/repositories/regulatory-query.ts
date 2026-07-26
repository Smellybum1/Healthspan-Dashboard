import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { contentItems } from '../schema.js';
import { regulatoryEvents } from '../schema.js';
import {
  adverseEventReportingSnapshots,
  dossierChangeEvents,
  adverseEventTermCounts,
  interventionSafetyLinks,
  productLabelRecords,
  regulatedProductIngredients,
  regulatedProducts,
  regulatorSignalRecords,
  regulatoryAssertions,
  regulatoryStatusHistory,
  safetyItems,
} from '../intervention-schema.js';

/**
 * Query semantics shared by the local SQLite and Sites D1 regulatory adapters.
 *
 * The retired reads compared jurisdiction and authority with `toLowerCase()` on both
 * sides. SQLite's `lower()` folds ASCII only, which is the same divergence accepted for
 * content and assessment search — jurisdiction and authority codes are ASCII, and the
 * parity test covers the fixture's values.
 */

export function lowerEq(column: SQL | unknown, value: string): SQL {
  return sql`lower(${column}) = ${value.toLowerCase()}`;
}

export function productWhere(filters: {
  jurisdiction?: string;
  authority?: string;
}): SQL | undefined {
  const predicates: SQL[] = [];
  if (filters.jurisdiction)
    predicates.push(lowerEq(regulatedProducts.jurisdiction, filters.jurisdiction));
  if (filters.authority) predicates.push(lowerEq(regulatedProducts.authority, filters.authority));
  return predicates.length ? and(...predicates) : undefined;
}

export function assertionWhere(filters: {
  jurisdiction?: string;
  entityId?: string;
}): SQL | undefined {
  const predicates: SQL[] = [];
  if (filters.jurisdiction) {
    predicates.push(lowerEq(regulatoryAssertions.jurisdiction, filters.jurisdiction));
  }
  if (filters.entityId) predicates.push(eq(regulatoryAssertions.entityId, filters.entityId));
  return predicates.length ? and(...predicates) : undefined;
}

export function safetyItemWhere(filters: { jurisdiction?: string }): SQL | undefined {
  return filters.jurisdiction ? lowerEq(safetyItems.jurisdiction, filters.jurisdiction) : undefined;
}

export const productOrder = desc(regulatedProducts.updatedAt);
export const assertionOrder = desc(regulatoryAssertions.createdAt);
export const statusHistoryOrder = desc(regulatoryStatusHistory.createdAt);
export const dossierEventOrder = desc(dossierChangeEvents.createdAt);
export const safetyItemOrder = desc(safetyItems.updatedAt);
export const signalOrder = desc(regulatorSignalRecords.createdAt);
export const snapshotOrder = desc(adverseEventReportingSnapshots.createdAt);
export const noticeOrder = desc(contentItems.updatedAt);

/** The TGA notice projection folded into the safety list. */
export const noticeSelection = {
  id: contentItems.id,
  title: contentItems.title,
  summary: contentItems.summary,
  canonicalUrl: contentItems.canonicalUrl,
  sourcePublishedAt: contentItems.sourcePublishedAt,
  createdAt: contentItems.createdAt,
  updatedAt: contentItems.updatedAt,
  jurisdiction: regulatoryEvents.jurisdiction,
  authority: regulatoryEvents.authority,
  category: regulatoryEvents.category,
  officialUrl: regulatoryEvents.officialUrl,
  publishedAt: regulatoryEvents.publishedAt,
};

export const countExpr = sql<number>`count(*)`;

export {
  adverseEventReportingSnapshots,
  adverseEventTermCounts,
  contentItems,
  dossierChangeEvents,
  interventionSafetyLinks,
  productLabelRecords,
  regulatedProductIngredients,
  regulatedProducts,
  regulatorSignalRecords,
  regulatoryAssertions,
  regulatoryEvents,
  regulatoryStatusHistory,
  safetyItems,
};
