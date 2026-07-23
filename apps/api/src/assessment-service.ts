import { desc, eq } from 'drizzle-orm';
import {
  contentItems,
  contentIntelligenceState,
  intelligenceAnalyses,
  type HealthspanDb,
} from '@healthspan/db';

export function listAssessments(
  db: HealthspanDb,
  query: {
    page?: number;
    pageSize?: number;
    evidenceMaturity?: string;
    evidenceAvailability?: string;
    studyDesign?: string;
    organism?: string;
    retractionOrCorrection?: string;
    q?: string;
  },
) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  const offset = (page - 1) * pageSize;

  const states = db.select().from(contentIntelligenceState).all();
  const rows = [];
  for (const state of states) {
    if (!state.currentAnalysisId) continue;
    const analysis = db
      .select()
      .from(intelligenceAnalyses)
      .where(eq(intelligenceAnalyses.id, state.currentAnalysisId))
      .all()[0];
    if (!analysis || analysis.supersededAt) continue;
    const item = db.select().from(contentItems).where(eq(contentItems.id, state.contentItemId)).all()[0];
    if (!item) continue;

    const hallmarks = safeJsonArray(analysis.hallmarksJson);
    const gaps = safeJsonArray(analysis.translationGapsJson);
    const signals = safeJsonArray(analysis.methodologicalSignalsJson);
    const whatWouldChange = safeJsonArray(analysis.whatWouldChangeJson);
    const retraction =
      signals.some(
        (s) =>
          typeof s === 'object' &&
          s !== null &&
          'code' in s &&
          String((s as { code?: string }).code) === 'retraction_or_correction',
      ) || Boolean(analysis.status === 'retracted');

    if (query.evidenceMaturity && analysis.evidenceMaturity !== query.evidenceMaturity) continue;
    if (query.evidenceAvailability && analysis.evidenceAvailability !== query.evidenceAvailability) {
      continue;
    }
    if (query.studyDesign && analysis.studyDesign !== query.studyDesign) continue;
    if (query.organism && analysis.organismLevel !== query.organism) continue;
    if (query.retractionOrCorrection === 'true' && !retraction) continue;
    if (query.retractionOrCorrection === 'false' && retraction) continue;
    if (query.q) {
      const q = query.q.toLowerCase();
      if (!item.title.toLowerCase().includes(q) && !(item.summary ?? '').toLowerCase().includes(q)) {
        continue;
      }
    }

    rows.push({
      analysisId: analysis.id,
      contentItemId: item.id,
      title: item.title,
      contentType: item.type,
      evidenceMaturity: analysis.evidenceMaturity,
      evidenceAvailability: analysis.evidenceAvailability,
      studyDesign: analysis.studyDesign,
      organismLevel: analysis.organismLevel,
      classificationConfidence: analysis.classificationConfidence,
      assessmentCompleteness: analysis.assessmentCompleteness,
      resultsPresent: analysis.resultsPresent,
      stale: Boolean(state.stale),
      retractionOrCorrection: retraction,
      translationGaps: gaps,
      methodologicalSignals: signals,
      whatWouldChange,
      potentialHallmarks: hallmarks,
      rulesetVersion: analysis.rulesetVersion,
      createdAt: new Date(analysis.createdAt).toISOString(),
    });
  }

  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const total = rows.length;
  return {
    items: rows.slice(offset, offset + pageSize),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function getAssessment(db: HealthspanDb, analysisId: string) {
  const analysis = db
    .select()
    .from(intelligenceAnalyses)
    .where(eq(intelligenceAnalyses.id, analysisId))
    .all()[0];
  if (!analysis) return null;
  const item = db.select().from(contentItems).where(eq(contentItems.id, analysis.contentItemId)).all()[0];
  const history = db
    .select()
    .from(intelligenceAnalyses)
    .where(eq(intelligenceAnalyses.contentItemId, analysis.contentItemId))
    .orderBy(desc(intelligenceAnalyses.createdAt))
    .all()
    .map((row) => ({
      analysisId: row.id,
      rulesetVersion: row.rulesetVersion,
      supersededAt: row.supersededAt ? new Date(row.supersededAt).toISOString() : null,
      createdAt: new Date(row.createdAt).toISOString(),
      evidenceMaturity: row.evidenceMaturity,
    }));
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
    item: item ? { id: item.id, title: item.title, type: item.type } : null,
    history,
  };
}

function safeJsonArray(raw: string | null | undefined): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
