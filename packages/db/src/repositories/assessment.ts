import { desc, eq, inArray, sql } from 'drizzle-orm';
import type {
  AssessmentDetailRow,
  AssessmentFilters,
  AssessmentHistoryEntry,
  AssessmentRow,
  IntelligenceReadRepository,
} from '@healthspan/core';
import { contentItems, papers } from '../schema.js';
import {
  claimRelationships,
  claimSourceSpans,
  contentIntelligenceState,
  intelligenceAnalyses,
  intelligenceRuns,
  liveClaims,
  liveReviewTasks,
} from '../intelligence-schema.js';
import type { HealthspanDb } from '../client.js';
import {
  assessmentOrder,
  assessmentSelection,
  assessmentWhere,
  claimRelationshipWhere,
  liveClaimOrder,
  liveClaimWhere,
  radarOrder,
  radarSelection,
  runOrder,
  toAssessmentRow,
} from './assessment-query.js';

/**
 * Local SQLite implementation of {@link ClaimAssessmentRepository}.
 *
 * The joins, selection, and predicates come from `./assessment-query.js`, shared with the
 * D1 adapter; only execution differs. `listCurrent` is one statement — see that file for
 * why the per-item loop it replaced could not be ported as-is.
 */
export function createLocalClaimAssessmentRepository(db: HealthspanDb): IntelligenceReadRepository {
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

    async intelligenceCounts() {
      const [assessed, stale, openReviews] = [
        db
          .select({ n: sql<number>`count(*)` })
          .from(contentIntelligenceState)
          .where(sql`${contentIntelligenceState.currentAnalysisId} is not null`)
          .all()[0]?.n,
        db
          .select({ n: sql<number>`count(*)` })
          .from(contentIntelligenceState)
          .where(eq(contentIntelligenceState.stale, true))
          .all()[0]?.n,
        db
          .select({ n: sql<number>`count(*)` })
          .from(liveReviewTasks)
          .where(eq(liveReviewTasks.status, 'open'))
          .all()[0]?.n,
      ];
      return {
        assessedCount: Number(assessed ?? 0),
        staleCount: Number(stale ?? 0),
        openReviewTaskCount: Number(openReviews ?? 0),
      };
    },

    listRuns(limit: number) {
      return Promise.resolve(
        db.select().from(intelligenceRuns).orderBy(runOrder).limit(limit).all() as never,
      );
    },

    getRun(id: string) {
      const row = db.select().from(intelligenceRuns).where(eq(intelligenceRuns.id, id)).all()[0];
      return Promise.resolve((row ?? null) as never);
    },

    listLiveClaims(filters, { limit, offset }) {
      const where = liveClaimWhere(filters);
      const base = db.select().from(liveClaims);
      const rows = (
        where ? base.where(where).orderBy(liveClaimOrder) : base.orderBy(liveClaimOrder)
      )
        .limit(limit)
        .offset(offset)
        .all();
      const countBase = db.select({ n: sql<number>`count(*)` }).from(liveClaims);
      const countRow = (where ? countBase.where(where).all() : countBase.all())[0];
      return Promise.resolve({ rows: rows as never, total: Number(countRow?.n ?? 0) });
    },

    listSpansForClaims(claimIds: string[]) {
      if (claimIds.length === 0) return Promise.resolve([]);
      const rows = db
        .select()
        .from(claimSourceSpans)
        .where(inArray(claimSourceSpans.claimId, claimIds))
        .all();
      return Promise.resolve(
        rows.map((s) => ({
          id: s.id,
          claimId: s.claimId,
          fieldPath: s.fieldPath,
          excerpt: s.excerpt,
          spanHash: s.spanHash,
          primarySupport: s.primarySupport,
          createdAt: s.createdAt,
        })),
      );
    },

    getLiveClaim(id: string) {
      const row = db.select().from(liveClaims).where(eq(liveClaims.id, id)).all()[0];
      return Promise.resolve((row ?? null) as never);
    },

    listClaimRelationships(claimId: string) {
      return Promise.resolve(
        db.select().from(claimRelationships).where(claimRelationshipWhere(claimId)).all() as never,
      );
    },

    listRadarRows(limit: number) {
      const rows = db
        .select(radarSelection)
        .from(contentIntelligenceState)
        .innerJoin(
          intelligenceAnalyses,
          eq(intelligenceAnalyses.id, contentIntelligenceState.currentAnalysisId),
        )
        .innerJoin(contentItems, eq(contentItems.id, contentIntelligenceState.contentItemId))
        .leftJoin(papers, eq(papers.contentItemId, contentItems.id))
        .orderBy(radarOrder)
        .limit(limit)
        .all();
      return Promise.resolve(rows as never);
    },
  };
}
