import { eq, inArray } from 'drizzle-orm';
import type { RegulatoryReadRepository } from '@healthspan/core';
import {
  adverseEventReportingSnapshots,
  adverseEventTermCounts,
  assertionOrder,
  assertionWhere,
  contentItems,
  countExpr,
  dossierChangeEvents,
  dossierEventOrder,
  interventionSafetyLinks,
  noticeOrder,
  noticeSelection,
  productLabelRecords,
  productOrder,
  productWhere,
  regulatedProductIngredients,
  regulatedProducts,
  regulatorSignalRecords,
  regulatoryAssertions,
  regulatoryEvents,
  regulatoryStatusHistory,
  safetyItemOrder,
  safetyItemWhere,
  safetyItems,
  signalOrder,
  snapshotOrder,
  statusHistoryOrder,
} from '../../repositories/regulatory-query.js';
import type { SitesD1Database } from './client.js';

/**
 * Sites/D1 implementation of {@link RegulatoryReadRepository}.
 *
 * Same predicates and ordering as the local adapter, from the same
 * `repositories/regulatory-query.js`; only execution differs.
 *
 * The two batched reads matter most here. `listIngredientsForProducts` and
 * `listTermsForSnapshots` each replace a query per row on the page — fifty round trips
 * for a default page, on a runtime where each one crosses the network.
 *
 * `workspaceCounts` issues its six counts concurrently. Sequentially that would be six
 * round trips for a summary panel.
 */
export function createSitesRegulatoryReadRepository(db: SitesD1Database): RegulatoryReadRepository {
  return {
    async listProducts(filters) {
      const where = productWhere(filters);
      const base = db.select().from(regulatedProducts);
      return (await (where ? base.where(where) : base).orderBy(productOrder)) as never;
    },

    async listIngredientsForProducts(productIds) {
      if (productIds.length === 0) return [];
      return (await db
        .select()
        .from(regulatedProductIngredients)
        .where(inArray(regulatedProductIngredients.productId, productIds))) as never;
    },

    async listAssertions(filters) {
      const where = assertionWhere(filters);
      const base = db.select().from(regulatoryAssertions);
      return (await (where ? base.where(where) : base).orderBy(assertionOrder)) as never;
    },

    async listStatusHistory(filters) {
      const base = db.select().from(regulatoryStatusHistory);
      const q = filters.productId
        ? base.where(eq(regulatoryStatusHistory.productId, filters.productId))
        : base;
      return (await q.orderBy(statusHistoryOrder)) as never;
    },

    async listDossierChangeEvents(filters) {
      const base = db.select().from(dossierChangeEvents);
      const q = filters.entityId
        ? base.where(eq(dossierChangeEvents.entityId, filters.entityId))
        : base;
      return (await q.orderBy(dossierEventOrder)) as never;
    },

    async listSafetyItems(filters) {
      const where = safetyItemWhere(filters);
      const base = db.select().from(safetyItems);
      return (await (where ? base.where(where) : base).orderBy(safetyItemOrder)) as never;
    },

    async listRegulatoryNotices(cap) {
      return (await db
        .select(noticeSelection)
        .from(contentItems)
        .innerJoin(regulatoryEvents, eq(regulatoryEvents.contentItemId, contentItems.id))
        .orderBy(noticeOrder)
        .limit(cap)) as never;
    },

    async listSignals(filters) {
      const base = db.select().from(regulatorSignalRecords);
      const q = filters.entityId
        ? base.where(eq(regulatorSignalRecords.entityId, filters.entityId))
        : base;
      return (await q.orderBy(signalOrder)) as never;
    },

    async listReportingSnapshots(filters) {
      const base = db.select().from(adverseEventReportingSnapshots);
      const q = filters.entityId
        ? base.where(eq(adverseEventReportingSnapshots.entityId, filters.entityId))
        : base;
      return (await q.orderBy(snapshotOrder)) as never;
    },

    async listTermsForSnapshots(snapshotIds) {
      if (snapshotIds.length === 0) return [];
      return (await db
        .select()
        .from(adverseEventTermCounts)
        .where(inArray(adverseEventTermCounts.snapshotId, snapshotIds))) as never;
    },

    async workspaceCounts() {
      const [products, assertions, signals, labels, patterns, links] = await Promise.all([
        db.select({ c: countExpr }).from(regulatedProducts),
        db.select({ c: countExpr }).from(regulatoryAssertions),
        db.select({ c: countExpr }).from(regulatorSignalRecords),
        db.select({ c: countExpr }).from(productLabelRecords),
        db.select({ c: countExpr }).from(adverseEventReportingSnapshots),
        db.select({ c: countExpr }).from(interventionSafetyLinks),
      ]);
      return {
        productCount: Number(products[0]?.c ?? 0),
        assertionCount: Number(assertions[0]?.c ?? 0),
        signalCount: Number(signals[0]?.c ?? 0),
        labelCount: Number(labels[0]?.c ?? 0),
        reportingPatternCount: Number(patterns[0]?.c ?? 0),
        safetyLinkCount: Number(links[0]?.c ?? 0),
      };
    },
  };
}
