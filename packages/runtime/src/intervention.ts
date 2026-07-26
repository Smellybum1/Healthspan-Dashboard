import {
  COMPARISON_CAVEAT,
  COMPARISON_MAX_ENTITIES,
  COMPARISON_MIN_ENTITIES,
  COMPARISON_RULES,
  normaliseInterventionPaging,
  parseInterventionTypeFilter,
  toTrialPortfolio,
  type ComparisonDimension,
  type ComparisonEntityRow,
  type EntityIdRow,
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

/**
 * Side-by-side comparison of 2–4 interventions.
 *
 * No winner, rank, recommendation, stacking, or spontaneous-report safety ranking — the
 * rules are asserted in the response, not just observed in the code.
 *
 * Every read is batched by id, so a four-entity comparison costs five statements rather
 * than the twenty the retired per-entity loop issued.
 */
export async function compareInterventions(repo: InterventionReadRepository, entityIds: string[]) {
  const unique = [...new Set(entityIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length < COMPARISON_MIN_ENTITIES || unique.length > COMPARISON_MAX_ENTITIES) {
    return {
      ok: false as const,
      status: 400 as const,
      error: 'Compare requires 2–4 distinct entity ids',
    };
  }

  const found = await repo.listEntitiesByIds(unique);
  const byId = new Map(found.map((e) => [e.id, e]));
  // Preserve the caller's order, and treat a missing or inactive entity as absent.
  const ordered = unique.map((id) => {
    const e = byId.get(id);
    return e && e.lifecycleState === 'active' ? e : null;
  });
  if (ordered.some((e) => e === null)) {
    return {
      ok: false as const,
      status: 404 as const,
      error: 'One or more entities were not found',
    };
  }
  const active = ordered as ComparisonEntityRow[];
  const ids = active.map((e) => e.id);

  const [peptides, identifiers, assertions, snapshots] = await Promise.all([
    repo.listPeptideProfiles(ids),
    repo.listIdentifiersForEntities(ids),
    repo.listCurrentAssertionsForEntities(ids),
    repo.listDossierSnapshots(
      active.map((e) => e.currentDossierSnapshotId).filter((s): s is string => Boolean(s)),
    ),
  ]);

  const peptideByEntity = new Map(peptides.map((p) => [p.entityId, p]));
  const snapshotById = new Map(snapshots.map((s) => [s.id, s]));
  const countBy = (rows: EntityIdRow[]) => {
    const out = new Map<string, number>();
    for (const r of rows) if (r.entityId) out.set(r.entityId, (out.get(r.entityId) ?? 0) + 1);
    return out;
  };
  const identifierCounts = countBy(identifiers);
  const assertionCounts = countBy(assertions);

  const rows = active.map((entity) => {
    const snapshot = entity.currentDossierSnapshotId
      ? snapshotById.get(entity.currentDossierSnapshotId)
      : undefined;
    const summary = snapshot
      ? (JSON.parse(snapshot.summaryJson) as Record<string, unknown>)
      : ({} as Record<string, unknown>);
    const evidenceMap = snapshot
      ? (JSON.parse(snapshot.evidenceMapJson) as { analyses?: Array<Record<string, unknown>> })
      : { analyses: [] };
    const analyses = evidenceMap.analyses ?? [];
    const maturityCounts: Record<string, number> = {};
    for (const a of analyses) {
      const key = String(a.evidenceMaturity ?? 'unknown');
      maturityCounts[key] = (maturityCounts[key] ?? 0) + 1;
    }
    return {
      id: entity.id,
      preferredName: entity.preferredName,
      entityType: entity.entityType,
      identityConfidence: entity.identityConfidence,
      peptide: peptideByEntity.get(entity.id) ?? null,
      identifierCount: identifierCounts.get(entity.id) ?? 0,
      assertionCount: assertionCounts.get(entity.id) ?? 0,
      linkedAnalysisCount: Number(summary.linkedAnalysisCount ?? analyses.length),
      linkedClaimCount: Number(summary.linkedClaimCount ?? 0),
      maturityCounts,
      dossierHref: `/interventions/${entity.id}`,
    };
  });

  const typeComparable = new Set(rows.map((r) => r.entityType)).size === 1;
  const allPeptide = rows.every((x) => Boolean(x.peptide));
  const nonePeptide = rows.every((x) => !x.peptide);

  const dimensions: ComparisonDimension[] = [
    {
      id: 'identity_type',
      label: 'Identity / type',
      cells: rows.map((r) => ({
        entityId: r.id,
        value: `${r.preferredName} · ${r.entityType} · confidence ${r.identityConfidence}`,
        comparable: typeComparable,
        note: typeComparable
          ? undefined
          : 'Entity types differ — treat as not directly comparable without variant/class caveats.',
        detailHref: r.dossierHref,
      })),
    },
    {
      id: 'evidence_maturity',
      label: 'Evidence maturity distribution',
      cells: rows.map((r) => ({
        entityId: r.id,
        value:
          Object.keys(r.maturityCounts).length === 0
            ? 'No linked analyses yet'
            : Object.entries(r.maturityCounts)
                .map(([k, v]) => `${k}:${v}`)
                .join(', '),
        comparable: true,
        detailHref: r.dossierHref,
      })),
    },
    {
      id: 'linked_evidence',
      label: 'Linked analyses / claims',
      cells: rows.map((r) => ({
        entityId: r.id,
        value: `${r.linkedAnalysisCount} analyses · ${r.linkedClaimCount} claims`,
        comparable: true,
        detailHref: r.dossierHref,
      })),
    },
    {
      id: 'peptide_identity',
      label: 'Peptide identity state',
      cells: rows.map((r) => ({
        entityId: r.id,
        value: r.peptide
          ? `${r.peptide.classification} · ${r.peptide.sequenceState} · ${r.peptide.warningState}`
          : 'Not a peptide profile',
        comparable: allPeptide || nonePeptide,
        note:
          !allPeptide && !nonePeptide
            ? 'Peptide vs non-peptide — not comparable on sequence identity.'
            : r.peptide
              ? 'Sequence is never invented from a marketing name.'
              : undefined,
      })),
    },
    {
      id: 'regulatory_matrix',
      label: 'Regulatory assertions (scoped)',
      cells: rows.map((r) => ({
        entityId: r.id,
        value: `${r.assertionCount} current scoped assertion(s) · ${r.identifierCount} identifier(s)`,
        comparable: true,
        note: 'Register inclusion is not longevity evidence and is not a universal “approved” badge.',
        detailHref: r.dossierHref,
      })),
    },
    {
      id: 'spontaneous_reports',
      label: 'Spontaneous-report patterns',
      cells: rows.map((r) => ({
        entityId: r.id,
        value: 'Not compared',
        comparable: false,
        note: 'Spontaneous report counts are never used as a safety ranking across interventions.',
      })),
    },
  ];

  return {
    ok: true as const,
    entityCount: rows.length,
    entities: rows.map((r) => ({
      id: r.id,
      preferredName: r.preferredName,
      entityType: r.entityType,
      dossierHref: r.dossierHref,
    })),
    dimensions,
    rules: { ...COMPARISON_RULES },
    caveat: COMPARISON_CAVEAT,
  };
}
