import { eq } from 'drizzle-orm';
import {
  dossierSnapshots,
  interventionEntities,
  interventionIdentifiers,
  peptideProfiles,
  regulatoryAssertions,
  type HealthspanDb,
} from '@healthspan/db';
import { bootstrapInterventionCatalog } from './dossier-service.js';

export type ComparisonDimension = {
  id: string;
  label: string;
  cells: Array<{
    entityId: string;
    value: string;
    comparable: boolean;
    note?: string;
    detailHref?: string;
  }>;
};

/**
 * Side-by-side comparison of 2–4 interventions.
 * No winner, rank, recommendation, stacking, or spontaneous-report safety ranking.
 */
export function compareInterventions(db: HealthspanDb, entityIds: string[]) {
  bootstrapInterventionCatalog(db);
  const unique = [...new Set(entityIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length < 2 || unique.length > 4) {
    return {
      ok: false as const,
      status: 400 as const,
      error: 'Compare requires 2–4 distinct entity ids',
    };
  }

  const entities = unique.map((id) => {
    const entity = db.select().from(interventionEntities).where(eq(interventionEntities.id, id)).all()[0];
    if (!entity || entity.lifecycleState !== 'active') return null;
    const peptide = db.select().from(peptideProfiles).where(eq(peptideProfiles.entityId, id)).all()[0];
    const identifiers = db
      .select()
      .from(interventionIdentifiers)
      .where(eq(interventionIdentifiers.entityId, id))
      .all();
    const assertions = db
      .select()
      .from(regulatoryAssertions)
      .all()
      .filter((a) => a.entityId === id && a.currentState === 'current');
    const snapshot = entity.currentDossierSnapshotId
      ? db.select().from(dossierSnapshots).where(eq(dossierSnapshots.id, entity.currentDossierSnapshotId)).all()[0]
      : null;
    const summary = snapshot ? (JSON.parse(snapshot.summaryJson) as Record<string, unknown>) : {};
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
      peptide,
      identifierCount: identifiers.length,
      assertionCount: assertions.length,
      linkedAnalysisCount: Number(summary.linkedAnalysisCount ?? analyses.length),
      linkedClaimCount: Number(summary.linkedClaimCount ?? 0),
      maturityCounts,
      dossierHref: `/interventions/${entity.id}`,
    };
  });

  if (entities.some((e) => e == null)) {
    return { ok: false as const, status: 404 as const, error: 'One or more entities were not found' };
  }
  const rows = entities as NonNullable<(typeof entities)[number]>[];

  const types = new Set(rows.map((r) => r.entityType));
  const typeComparable = types.size === 1;

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
        comparable: rows.every((x) => Boolean(x.peptide)) || rows.every((x) => !x.peptide),
        note: rows.some((x) => x.peptide) && rows.some((x) => !x.peptide)
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
    rules: {
      noWinner: true,
      noRecommendation: true,
      noRank: true,
      noStacking: true,
      noSpontaneousReportSafetyRanking: true,
    },
    caveat:
      'Comparison is informational and side-by-side only. Cells link to source-backed dossiers; incomparable dimensions are flagged explicitly.',
  };
}
