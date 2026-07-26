import {
  normaliseAssessmentPaging,
  safeJsonArray,
  toAssessmentDto,
  type AssessmentDetail,
  type AssessmentListQuery,
  type AssessmentListResult,
  type ClaimAssessmentRepository,
} from '@healthspan/core';

export type { AssessmentDetail, AssessmentListQuery, AssessmentListResult };

/**
 * Claim assessments.
 *
 * The column-expressible filters are pushed into the adapter's single query; the
 * retraction filter, the sort, and the paging are applied here so both runtimes agree on
 * them. Splitting it that way is forced by the data: retraction is derived from parsing a
 * JSON column, so it cannot be a predicate without a schema change.
 */
export async function listAssessments(
  repo: ClaimAssessmentRepository,
  query: AssessmentListQuery,
): Promise<AssessmentListResult> {
  const { page, pageSize, offset } = normaliseAssessmentPaging(query);

  const rows = await repo.listCurrent({
    evidenceMaturity: query.evidenceMaturity,
    evidenceAvailability: query.evidenceAvailability,
    studyDesign: query.studyDesign,
    organism: query.organism,
    q: query.q,
  });

  let items = rows.map(toAssessmentDto);
  if (query.retractionOrCorrection === 'true') {
    items = items.filter((i) => i.retractionOrCorrection);
  } else if (query.retractionOrCorrection === 'false') {
    items = items.filter((i) => !i.retractionOrCorrection);
  }

  // Sorted here rather than in SQL because the retraction filter above can remove rows,
  // and the total must count what survives every filter.
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const total = items.length;
  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAssessment(
  repo: ClaimAssessmentRepository,
  analysisId: string,
): Promise<AssessmentDetail | null> {
  const analysis = await repo.getAnalysis(analysisId);
  if (!analysis) return null;

  const [item, history] = await Promise.all([
    repo.getItem(analysis.contentItemId),
    repo.listAnalysisHistory(analysis.contentItemId),
  ]);

  return {
    analysis: {
      id: analysis.id,
      contentItemId: analysis.contentItemId,
      evidenceMaturity: analysis.evidenceMaturity,
      evidenceAvailability: analysis.evidenceAvailability,
      studyDesign: analysis.studyDesign,
      organismLevel: analysis.organismLevel,
      classificationConfidence: analysis.classificationConfidence,
      assessmentCompleteness: analysis.assessmentCompleteness,
      resultsPresent: analysis.resultsPresent,
      translationGaps: safeJsonArray(analysis.translationGapsJson),
      methodologicalSignals: safeJsonArray(analysis.methodologicalSignalsJson),
      whatWouldChange: safeJsonArray(analysis.whatWouldChangeJson),
      potentialHallmarks: safeJsonArray(analysis.hallmarksJson),
      rulesetVersion: analysis.rulesetVersion,
      createdAt: new Date(analysis.createdAt).toISOString(),
      supersededAt: analysis.supersededAt ? new Date(analysis.supersededAt).toISOString() : null,
    },
    item,
    history,
  };
}
