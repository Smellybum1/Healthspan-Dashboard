import {
  normaliseInterventionPaging,
  parseInterventionTypeFilter,
  toTrialPortfolio,
  type InterventionListResult,
  type InterventionReadRepository,
  type TrialPortfolio,
} from '@healthspan/core';

export type { InterventionListResult, TrialPortfolio };

/**
 * Intervention and trial read models.
 *
 * No function here bootstraps the intervention catalog. The retired reads began with
 * `bootstrapInterventionCatalog`, a seeding write, on every call — the same problem the
 * creator reads had. The local routes call it before the shared service; a hosted read
 * may not write, and hosted data is synthetic-fixture-only.
 */
export async function listInterventionEntities(
  repo: InterventionReadRepository,
  opts: { entityType?: string; page?: number; pageSize?: number; q?: string } = {},
): Promise<InterventionListResult> {
  const { page, pageSize, offset } = normaliseInterventionPaging(opts);
  const { rows, total } = await repo.listEntities({
    typeFilter: parseInterventionTypeFilter(opts.entityType),
    q: opts.q,
    limit: pageSize,
    offset,
  });
  return {
    items: rows,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function listEntityResolutionTasks(repo: InterventionReadRepository, limit = 100) {
  return repo.listEntityResolutionTasks(Math.min(500, Math.max(1, limit)));
}

export async function trialPortfolioForEntity(
  repo: InterventionReadRepository,
  entityId: string,
): Promise<TrialPortfolio> {
  return toTrialPortfolio(await repo.listTrialPortfolio(entityId));
}
