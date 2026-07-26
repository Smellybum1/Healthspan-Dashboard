import { eq, sql } from 'drizzle-orm';
import type {
  EntityResolutionTaskRow,
  InterventionReadRepository,
  TrialPortfolioRow,
} from '@healthspan/core';
import type { HealthspanDb } from '../client.js';
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
} from './intervention-query.js';

/**
 * Local SQLite implementation of {@link InterventionReadRepository}.
 *
 * Predicates, selections, and the trial join come from `./intervention-query.js`, shared
 * with the D1 adapter; only execution differs. Nothing here bootstraps the intervention
 * catalog — the local routes do that before the shared service runs.
 */
export function createLocalInterventionReadRepository(
  db: HealthspanDb,
): InterventionReadRepository {
  return {
    listEntities({ typeFilter, q, limit, offset }) {
      const where = interventionWhere(typeFilter, q);
      const rows = db
        .select(interventionSummarySelection)
        .from(interventionEntities)
        .where(where)
        .limit(limit)
        .offset(offset)
        .all();
      const countRow = db
        .select({ n: sql<number>`count(*)` })
        .from(interventionEntities)
        .where(where)
        .all()[0];
      return Promise.resolve({ rows, total: Number(countRow?.n ?? 0) });
    },

    listEntityResolutionTasks(limit: number): Promise<EntityResolutionTaskRow[]> {
      const rows = db
        .select()
        .from(entityResolutionTasks)
        .orderBy(entityResolutionTaskOrder)
        .limit(limit)
        .all();
      return Promise.resolve(
        rows.map((t) => ({
          id: t.id,
          mentionId: t.mentionId,
          proposedEntityId: t.proposedEntityId,
          title: t.title,
          reason: t.reason,
          priority: t.priority,
          status: t.status,
          stale: t.stale,
          createdAt: t.createdAt,
        })),
      );
    },

    listTrialPortfolio(entityId: string): Promise<TrialPortfolioRow[]> {
      const rows = db
        .select(trialPortfolioSelection)
        .from(trialInterventionEntityLinks)
        .leftJoin(trials, eq(trials.contentItemId, trialInterventionEntityLinks.trialId))
        .where(trialPortfolioWhere(entityId))
        .all();
      return Promise.resolve(rows as TrialPortfolioRow[]);
    },
  };
}
