import { desc, eq } from 'drizzle-orm';
import type {
  AssessmentDetailRow,
  AssessmentFilters,
  AssessmentHistoryEntry,
  AssessmentRow,
  ClaimAssessmentRepository,
} from '@healthspan/core';
import { contentItems } from '../schema.js';
import { contentIntelligenceState, intelligenceAnalyses } from '../intelligence-schema.js';
import type { HealthspanDb } from '../client.js';
import {
  assessmentOrder,
  assessmentSelection,
  assessmentWhere,
  toAssessmentRow,
} from './assessment-query.js';

/**
 * Local SQLite implementation of {@link ClaimAssessmentRepository}.
 *
 * The joins, selection, and predicates come from `./assessment-query.js`, shared with the
 * D1 adapter; only execution differs. `listCurrent` is one statement — see that file for
 * why the per-item loop it replaced could not be ported as-is.
 */
export function createLocalClaimAssessmentRepository(db: HealthspanDb): ClaimAssessmentRepository {
  return {
    listCurrent(filters: AssessmentFilters): Promise<AssessmentRow[]> {
      const rows = db
        .select(assessmentSelection)
        .from(contentIntelligenceState)
        .innerJoin(
          intelligenceAnalyses,
          eq(intelligenceAnalyses.id, contentIntelligenceState.currentAnalysisId),
        )
        .innerJoin(contentItems, eq(contentItems.id, contentIntelligenceState.contentItemId))
        .where(assessmentWhere(filters))
        .orderBy(assessmentOrder)
        .all();
      return Promise.resolve(rows.map((r) => toAssessmentRow(r as Record<string, unknown>)));
    },

    getAnalysis(analysisId: string): Promise<AssessmentDetailRow | null> {
      const row = db
        .select()
        .from(intelligenceAnalyses)
        .where(eq(intelligenceAnalyses.id, analysisId))
        .all()[0];
      if (!row) return Promise.resolve(null);
      return Promise.resolve({
        id: row.id,
        contentItemId: row.contentItemId,
        evidenceMaturity: row.evidenceMaturity,
        evidenceAvailability: row.evidenceAvailability,
        studyDesign: row.studyDesign,
        organismLevel: row.organismLevel,
        classificationConfidence: row.classificationConfidence,
        assessmentCompleteness: row.assessmentCompleteness,
        resultsPresent: Boolean(row.resultsPresent),
        translationGapsJson: row.translationGapsJson,
        methodologicalSignalsJson: row.methodologicalSignalsJson,
        whatWouldChangeJson: row.whatWouldChangeJson,
        hallmarksJson: row.hallmarksJson,
        rulesetVersion: row.rulesetVersion,
        createdAt: row.createdAt,
        supersededAt: row.supersededAt,
      });
    },

    getItem(contentItemId: string) {
      const row = db.select().from(contentItems).where(eq(contentItems.id, contentItemId)).all()[0];
      return Promise.resolve(row ? { id: row.id, title: row.title, type: row.type } : null);
    },

    listAnalysisHistory(contentItemId: string): Promise<AssessmentHistoryEntry[]> {
      const rows = db
        .select()
        .from(intelligenceAnalyses)
        .where(eq(intelligenceAnalyses.contentItemId, contentItemId))
        .orderBy(desc(intelligenceAnalyses.createdAt))
        .all();
      return Promise.resolve(
        rows.map((row) => ({
          analysisId: row.id,
          rulesetVersion: row.rulesetVersion,
          supersededAt: row.supersededAt ? new Date(row.supersededAt).toISOString() : null,
          createdAt: new Date(row.createdAt).toISOString(),
          evidenceMaturity: row.evidenceMaturity,
        })),
      );
    },
  };
}
