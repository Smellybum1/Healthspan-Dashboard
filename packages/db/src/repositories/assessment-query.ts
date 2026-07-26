import { and, desc, eq, isNull, or, sql, type SQL } from 'drizzle-orm';
import type { AssessmentFilters, AssessmentRow, LiveClaimFilters } from '@healthspan/core';
import { contentItems, papers } from '../schema.js';
import {
  claimRelationships,
  claimSourceSpans,
  contentIntelligenceState,
  intelligenceAnalyses,
  intelligenceRuns,
  liveClaims,
} from '../intelligence-schema.js';

/**
 * The single joined query behind {@link ClaimAssessmentRepository.listCurrent}, shared by
 * both adapters.
 *
 * This replaces a per-item loop: the pre-port implementation selected every row of
 * `content_intelligence_state`, then issued one query for the analysis and one for the
 * content item per state. The join below expresses the same three conditions the loop
 * enforced — a state must have a `currentAnalysisId`, the analysis must not be
 * superseded, and the content item must exist — as inner joins and a predicate.
 *
 * `packages/db/src/repositories/assessment-parity.test.ts` runs the retired loop and this
 * query side by side over a fixture built to exercise every filter, and asserts identical
 * output. That test is the evidence that this is a change of shape and not of behaviour.
 */

export const assessmentOrder = desc(intelligenceAnalyses.createdAt);

export const assessmentSelection = {
  analysisId: intelligenceAnalyses.id,
  contentItemId: contentItems.id,
  title: contentItems.title,
  contentType: contentItems.type,
  summary: contentItems.summary,
  evidenceMaturity: intelligenceAnalyses.evidenceMaturity,
  evidenceAvailability: intelligenceAnalyses.evidenceAvailability,
  studyDesign: intelligenceAnalyses.studyDesign,
  organismLevel: intelligenceAnalyses.organismLevel,
  classificationConfidence: intelligenceAnalyses.classificationConfidence,
  assessmentCompleteness: intelligenceAnalyses.assessmentCompleteness,
  resultsPresent: intelligenceAnalyses.resultsPresent,
  status: intelligenceAnalyses.status,
  stale: contentIntelligenceState.stale,
  translationGapsJson: intelligenceAnalyses.translationGapsJson,
  methodologicalSignalsJson: intelligenceAnalyses.methodologicalSignalsJson,
  whatWouldChangeJson: intelligenceAnalyses.whatWouldChangeJson,
  hallmarksJson: intelligenceAnalyses.hallmarksJson,
  rulesetVersion: intelligenceAnalyses.rulesetVersion,
  createdAt: intelligenceAnalyses.createdAt,
};

/**
 * Column predicates for the filters that can be expressed as ones.
 *
 * `q` matches title or summary, case-insensitively, the same way the content adapter
 * does. Note that SQLite's `lower()` folds ASCII only while the retired loop used
 * JavaScript's Unicode-aware `toLowerCase()`; for non-ASCII titles the two can differ.
 * That divergence is accepted deliberately — it makes assessment search behave exactly
 * like content search, rather than having two search semantics in one product — and the
 * parity test covers the ASCII cases the fixtures contain.
 */
export function assessmentWhere(filters: AssessmentFilters): SQL | undefined {
  const predicates: SQL[] = [
    // The loop's `if (!analysis || analysis.supersededAt) continue`.
    isNull(intelligenceAnalyses.supersededAt),
  ];
  if (filters.evidenceMaturity) {
    predicates.push(eq(intelligenceAnalyses.evidenceMaturity, filters.evidenceMaturity));
  }
  if (filters.evidenceAvailability) {
    predicates.push(eq(intelligenceAnalyses.evidenceAvailability, filters.evidenceAvailability));
  }
  if (filters.studyDesign) {
    predicates.push(eq(intelligenceAnalyses.studyDesign, filters.studyDesign));
  }
  if (filters.organism) {
    predicates.push(eq(intelligenceAnalyses.organismLevel, filters.organism));
  }
  if (filters.q) {
    const term = `%${filters.q.toLowerCase()}%`;
    predicates.push(
      sql`(lower(${contentItems.title}) like ${term} or lower(coalesce(${contentItems.summary}, '')) like ${term})`,
    );
  }
  return and(...predicates);
}

/** Normalises the driver's row shape — SQLite booleans arrive as 0/1 through D1. */
export function toAssessmentRow(row: Record<string, unknown>): AssessmentRow {
  return {
    analysisId: String(row.analysisId),
    contentItemId: String(row.contentItemId),
    title: String(row.title),
    contentType: String(row.contentType),
    summary: (row.summary as string | null) ?? null,
    evidenceMaturity: String(row.evidenceMaturity),
    evidenceAvailability: String(row.evidenceAvailability),
    studyDesign: (row.studyDesign as string | null) ?? null,
    organismLevel: (row.organismLevel as string | null) ?? null,
    classificationConfidence: String(row.classificationConfidence),
    assessmentCompleteness: String(row.assessmentCompleteness),
    resultsPresent: Boolean(row.resultsPresent),
    status: String(row.status),
    stale: Boolean(row.stale),
    translationGapsJson: (row.translationGapsJson as string | null) ?? null,
    methodologicalSignalsJson: (row.methodologicalSignalsJson as string | null) ?? null,
    whatWouldChangeJson: (row.whatWouldChangeJson as string | null) ?? null,
    hallmarksJson: (row.hallmarksJson as string | null) ?? null,
    rulesetVersion: String(row.rulesetVersion),
    createdAt: Number(row.createdAt),
  };
}

export { contentIntelligenceState, contentItems, intelligenceAnalyses };

/* ------------------------------------------------------------------------- *
 * Intelligence read models — shared query semantics
 * ------------------------------------------------------------------------- */

export function liveClaimWhere(filters: LiveClaimFilters): SQL | undefined {
  const predicates: SQL[] = [];
  if (filters.claimKind) predicates.push(eq(liveClaims.claimKind, filters.claimKind));
  if (filters.assertionRole) predicates.push(eq(liveClaims.assertionRole, filters.assertionRole));
  if (filters.reviewStatus) predicates.push(eq(liveClaims.reviewStatus, filters.reviewStatus));
  if (filters.q) {
    predicates.push(sql`lower(${liveClaims.claimText}) like ${`%${filters.q.toLowerCase()}%`}`);
  }
  return predicates.length ? and(...predicates) : undefined;
}

export const liveClaimOrder = desc(liveClaims.createdAt);
export const runOrder = desc(intelligenceRuns.startedAt);

/** A claim's relationships, from either side, as one predicate. */
export function claimRelationshipWhere(claimId: string): SQL {
  return or(
    eq(claimRelationships.leftClaimId, claimId),
    eq(claimRelationships.rightClaimId, claimId),
  )!;
}

/**
 * Radar rows: current analyses joined to their content item and, for papers, the paper.
 *
 * A left join to `papers` because only papers have one; the retired loop looked it up
 * conditionally and tolerated its absence.
 */
export const radarSelection = {
  contentItemId: contentItems.id,
  title: contentItems.title,
  itemType: contentItems.type,
  evidenceMaturity: intelligenceAnalyses.evidenceMaturity,
  researchActivity: intelligenceAnalyses.researchActivity,
  resultsPresent: intelligenceAnalyses.resultsPresent,
  stale: contentIntelligenceState.stale,
  isCorrectionOrRetraction: papers.isCorrectionOrRetraction,
};

/**
 * Deterministic radar order.
 *
 * The retired loop consumed intelligence states in whatever order the driver returned
 * them and stopped at the limit, so which points survived a truncation was unspecified.
 * Newest analysis first is a real ordering and matches how the rest of the product reads.
 */
export const radarOrder = desc(intelligenceAnalyses.createdAt);

export { claimRelationships, claimSourceSpans, intelligenceRuns, liveClaims, papers };
