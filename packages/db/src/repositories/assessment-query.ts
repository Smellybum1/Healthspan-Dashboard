import { and, desc, eq, isNull, sql, type SQL } from 'drizzle-orm';
import type { AssessmentFilters, AssessmentRow } from '@healthspan/core';
import { contentItems } from '../schema.js';
import { contentIntelligenceState, intelligenceAnalyses } from '../intelligence-schema.js';

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
