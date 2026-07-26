import { eq, sql } from 'drizzle-orm';
import type {
  EntityResolutionTaskRow,
  InterventionReadRepository,
  TrialPortfolioRow,
} from '@healthspan/core';
import {
  entityResolutionTaskOrder,
  entityResolutionTasks,
  interventionEntities,
  interventionSummarySelection,
  interventionWhere,
  trialInterventionEntityLinks,
  trialPortfolioSelection,
  trialPortfolioWhere,
  trials,
} from '../../repositories/intervention-query.js';
import type { SitesD1Database } from './client.js';

/**
 * Sites/D1 implementation of {@link InterventionReadRepository}.
 *
 * Same predicates and joins as the local adapter, from the same
 * `repositories/intervention-query.js`; only execution differs.
 *
 * The trial join is a **left** one. The retired implementation looked each trial up by id
 * and tolerated a miss, producing an entry with null trial fields; an inner join would
 * drop links whose trial row is absent, which is precisely the case where the portfolio
 * should still show that a link exists.
 */
export function createSitesInterventionReadRepository(
  db: SitesD1Database,
): InterventionReadRepository {
  return {
    async listEntities({ typeFilter, q, limit, offset }) {
      const where = interventionWhere(typeFilter, q);
      const [rows, countRows] = await Promise.all([
        db
          .select(interventionSummarySelection)
          .from(interventionEntities)
          .where(where)
          .limit(limit)
          .offset(offset),
        db
          .select({ n: sql<number>`count(*)` })
          .from(interventionEntities)
          .where(where),
      ]);
      return { rows, total: Number(countRows[0]?.n ?? 0) };
    },

    async listEntityResolutionTasks(limit: number): Promise<EntityResolutionTaskRow[]> {
      const rows = await db
        .select()
        .from(entityResolutionTasks)
        .orderBy(entityResolutionTaskOrder)
        .limit(limit);
      return rows.map((t) => ({
        id: t.id,
        mentionId: t.mentionId,
        proposedEntityId: t.proposedEntityId,
        title: t.title,
        reason: t.reason,
        priority: t.priority,
        status: t.status,
        stale: t.stale,
        createdAt: t.createdAt,
      }));
    },

    async listTrialPortfolio(entityId: string): Promise<TrialPortfolioRow[]> {
      const rows = await db
        .select(trialPortfolioSelection)
        .from(trialInterventionEntityLinks)
        .leftJoin(trials, eq(trials.contentItemId, trialInterventionEntityLinks.trialId))
        .where(trialPortfolioWhere(entityId));
      return rows as TrialPortfolioRow[];
    },
  };
}
