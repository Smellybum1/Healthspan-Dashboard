import {
  RADAR_MATURITY_X,
  normaliseAssessmentPaging,
  normaliseRunLimit,
  type ClaimSpanRow,
  type IntelligenceReadRepository,
  type IntelligenceRunRow,
  type LiveClaimFilters,
} from '@healthspan/core';

/**
 * Intelligence read models.
 *
 * The analysis *run* is not here and will not be: it writes, calls out to the
 * intelligence package, and is a local-only ledger row. What lives here is everything the
 * hosted runtime reads — status counts, run history, live claims, and the radar.
 */

export function intelligenceStatus(repo: IntelligenceReadRepository) {
  return Promise.all([repo.intelligenceCounts(), repo.listRuns(5)]).then(([counts, runs]) => ({
    dataMode: 'live' as const,
    rulesetVersion: 'm3.deterministic.1',
    assessedCount: counts.assessedCount,
    staleCount: counts.staleCount,
    openReviewTaskCount: counts.openReviewTaskCount,
    recentRuns: runs.map(toRunSummary),
  }));
}

function toRunSummary(r: IntelligenceRunRow) {
  return {
    id: r.id,
    status: r.status,
    trigger: r.trigger,
    completedCount: r.completedCount,
    startedAt: new Date(r.startedAt).toISOString(),
    completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : null,
    summary: r.summary,
  };
}

export function listIntelligenceRuns(repo: IntelligenceReadRepository, limit?: number) {
  return repo.listRuns(normaliseRunLimit(limit));
}

export function getIntelligenceRun(repo: IntelligenceReadRepository, id: string) {
  return repo.getRun(id);
}

/**
 * Live claims with their supporting spans.
 *
 * The spans for a whole page come back in one statement and are grouped here. The retired
 * implementation issued one query per claim on the page — up to a hundred round trips on
 * D1 for a single page of results.
 */
export async function listLiveClaims(
  repo: IntelligenceReadRepository,
  query: LiveClaimFilters & { page?: number; pageSize?: number },
) {
  const { page, pageSize, offset } = normaliseAssessmentPaging(query);
  const filters: LiveClaimFilters = {
    claimKind: query.claimKind,
    assertionRole: query.assertionRole,
    reviewStatus: query.reviewStatus,
    q: query.q,
  };
  const { rows, total } = await repo.listLiveClaims(filters, { limit: pageSize, offset });
  const spans = await repo.listSpansForClaims(rows.map((r) => r.id));
  const byClaim = new Map<string, ClaimSpanRow[]>();
  for (const s of spans) {
    const list = byClaim.get(s.claimId) ?? [];
    list.push(s);
    byClaim.set(s.claimId, list);
  }

  return {
    items: rows.map((claim) => ({
      id: claim.id,
      analysisId: claim.analysisId,
      contentItemId: claim.contentItemId,
      claimKind: claim.claimKind,
      assertionRole: claim.assertionRole,
      claimText: claim.claimText,
      direction: claim.direction,
      outcomeFamily: claim.outcomeFamily,
      extractionMethod: claim.extractionMethod,
      classificationConfidence: claim.classificationConfidence,
      reviewStatus: claim.reviewStatus,
      active: claim.active,
      createdAt: new Date(claim.createdAt).toISOString(),
      spans: (byClaim.get(claim.id) ?? []).map((s) => ({
        id: s.id,
        fieldPath: s.fieldPath,
        excerpt: s.excerpt,
        primarySupport: s.primarySupport,
      })),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getLiveClaim(repo: IntelligenceReadRepository, id: string) {
  const claim = await repo.getLiveClaim(id);
  if (!claim) return null;
  const [spans, relationships, item] = await Promise.all([
    repo.listSpansForClaims([id]),
    repo.listClaimRelationships(id),
    repo.getItem(claim.contentItemId),
  ]);
  return {
    claim: { ...claim, createdAt: new Date(claim.createdAt).toISOString() },
    item,
    spans,
    relationships,
  };
}

/**
 * Radar points.
 *
 * The shape mapping and the maturity-to-x-position table live here so both runtimes plot
 * a claim in the same place.
 */
export async function liveRadarPoints(repo: IntelligenceReadRepository, limit = 40) {
  const rows = await repo.listRadarRows(Math.max(1, limit));
  return rows.map((row) => ({
    id: `radar-${row.contentItemId}`,
    label: row.title.slice(0, 48),
    itemId: row.contentItemId,
    itemType: row.itemType,
    evidenceMaturity: row.evidenceMaturity,
    evidenceX: RADAR_MATURITY_X[row.evidenceMaturity] ?? 0.2,
    attentionY: row.researchActivity,
    bubbleSize: row.resultsPresent ? 0.7 : 0.4,
    safetyConcern: row.itemType === 'regulatory_event' || Boolean(row.isCorrectionOrRetraction),
    formulaVersion: 'research_activity.v1',
    researchActivityRaw: row.researchActivity,
    stale: Boolean(row.stale),
    shape:
      row.itemType === 'paper'
        ? 'paper'
        : row.itemType === 'trial'
          ? 'trial'
          : row.itemType === 'regulatory_event'
            ? 'regulatory_event'
            : 'paper',
  }));
}
