import { eq, inArray } from 'drizzle-orm';
import type { RegulatoryReadRepository } from '@healthspan/core';
import type { HealthspanDb } from '../client.js';
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
} from './regulatory-query.js';

/**
 * Local SQLite implementation of {@link RegulatoryReadRepository}.
 *
 * Predicates and ordering come from `./regulatory-query.js`, shared with the D1 adapter.
 * Merging and pagination are not here — they belong to the shared service, because two of
 * these lists combine several tables and must be ordered as one before paging.
 */
export function createLocalRegulatoryReadRepository(db: HealthspanDb): RegulatoryReadRepository {
  const rows = <T>(v: T) => Promise.resolve(v);

  return {
    listProducts(filters) {
      const where = productWhere(filters);
      const base = db.select().from(regulatedProducts);
      return rows((where ? base.where(where) : base).orderBy(productOrder).all() as never);
    },

    listIngredientsForProducts(productIds) {
      if (productIds.length === 0) return Promise.resolve([]);
      return rows(
        db
          .select()
          .from(regulatedProductIngredients)
          .where(inArray(regulatedProductIngredients.productId, productIds))
          .all() as never,
      );
    },

    listAssertions(filters) {
      const where = assertionWhere(filters);
      const base = db.select().from(regulatoryAssertions);
      return rows((where ? base.where(where) : base).orderBy(assertionOrder).all() as never);
    },

    listStatusHistory(filters) {
      const base = db.select().from(regulatoryStatusHistory);
      const q = filters.productId
        ? base.where(eq(regulatoryStatusHistory.productId, filters.productId))
        : base;
      return rows(q.orderBy(statusHistoryOrder).all() as never);
    },

    listDossierChangeEvents(filters) {
      const base = db.select().from(dossierChangeEvents);
      const q = filters.entityId
        ? base.where(eq(dossierChangeEvents.entityId, filters.entityId))
        : base;
      return rows(q.orderBy(dossierEventOrder).all() as never);
    },

    listSafetyItems(filters) {
      const where = safetyItemWhere(filters);
      const base = db.select().from(safetyItems);
      return rows((where ? base.where(where) : base).orderBy(safetyItemOrder).all() as never);
    },

    listRegulatoryNotices(cap) {
      return rows(
        db
          .select(noticeSelection)
          .from(contentItems)
          .innerJoin(regulatoryEvents, eq(regulatoryEvents.contentItemId, contentItems.id))
          .orderBy(noticeOrder)
          .limit(cap)
          .all() as never,
      );
    },

    listSignals(filters) {
      const base = db.select().from(regulatorSignalRecords);
      const q = filters.entityId
        ? base.where(eq(regulatorSignalRecords.entityId, filters.entityId))
        : base;
      return rows(q.orderBy(signalOrder).all() as never);
    },

    listReportingSnapshots(filters) {
      const base = db.select().from(adverseEventReportingSnapshots);
      const q = filters.entityId
        ? base.where(eq(adverseEventReportingSnapshots.entityId, filters.entityId))
        : base;
      return rows(q.orderBy(snapshotOrder).all() as never);
    },

    listTermsForSnapshots(snapshotIds) {
      if (snapshotIds.length === 0) return Promise.resolve([]);
      return rows(
        db
          .select()
          .from(adverseEventTermCounts)
          .where(inArray(adverseEventTermCounts.snapshotId, snapshotIds))
          .all() as never,
      );
    },

    workspaceCounts() {
      const count = (q: { all(): Array<{ c: number }> }) => Number(q.all()[0]?.c ?? 0);
      return Promise.resolve({
        productCount: count(db.select({ c: countExpr }).from(regulatedProducts)),
        assertionCount: count(db.select({ c: countExpr }).from(regulatoryAssertions)),
        signalCount: count(db.select({ c: countExpr }).from(regulatorSignalRecords)),
        labelCount: count(db.select({ c: countExpr }).from(productLabelRecords)),
        reportingPatternCount: count(
          db.select({ c: countExpr }).from(adverseEventReportingSnapshots),
        ),
        safetyLinkCount: count(db.select({ c: countExpr }).from(interventionSafetyLinks)),
      });
    },
  };
}
