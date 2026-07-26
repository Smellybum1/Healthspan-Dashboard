import { desc, eq, inArray, sql } from 'drizzle-orm';
import type {
  AssessmentDetailRow,
  AssessmentFilters,
  AssessmentHistoryEntry,
  AssessmentRow,
  IntelligenceReadRepository,
} from '@healthspan/core';
import { contentItems, papers } from '../../schema.js';
import {
  claimRelationships,
  claimSourceSpans,
  contentIntelligenceState,
  intelligenceAnalyses,
  intelligenceRuns,
  liveClaims,
  liveReviewTasks,
} from '../../intelligence-schema.js';
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
} from '../../repositories/assessment-query.js';
import type { SitesD1Database } from './client.js';

/**
 * Sites/D1 implementation of {@link ClaimAssessmentRepository}.
 *
 * The same joins and predicates as the local adapter, from the same
 * `repositories/assessment-query.js`; only execution differs.
 *
 * `listCurrent` being a single statement matters more here than anywhere else so far.
 * The implementation this replaced issued one query per intelligence state plus one per
 * content item, which on D1 is a network round trip each — a list of 500 assessments
 * would have been 1,001 of them, before any filtering. The join makes it one.
 *
 * The result set is still whole-table for the filters that reach SQL: the shared service
 * has to count every row that survives the retraction filter to report `total`, and
 * retraction is derived from a JSON column rather than stored as one. Bounding that
 * needs the flag denormalised into a column, which is schema work — see the porting
 * ledger.
 */
export function createSitesClaimAssessmentRepository(
  db: SitesD1Database,
): IntelligenceReadRepository {
  return {
    async listCurrent(filters: AssessmentFilters): Promise<AssessmentRow[]> {
      const rows = await db
        .select(assessmentSelection)
        .from(contentIntelligenceState)
        .innerJoin(
          intelligenceAnalyses,
          eq(intelligenceAnalyses.id, contentIntelligenceState.currentAnalysisId),
        )
        .innerJoin(contentItems, eq(contentItems.id, contentIntelligenceState.contentItemId))
        .where(assessmentWhere(filters))
        .orderBy(assessmentOrder);
      return rows.map((r) => toAssessmentRow(r as Record<string, unknown>));
    },

    async getAnalysis(analysisId: string): Promise<AssessmentDetailRow | null> {
      const rows = await db
        .select()
        .from(intelligenceAnalyses)
        .where(eq(intelligenceAnalyses.id, analysisId));
      const row = rows[0];
      if (!row) return null;
      return {
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
      };
    },

    async getItem(contentItemId: string) {
      const rows = await db.select().from(contentItems).where(eq(contentItems.id, contentItemId));
      const row = rows[0];
      return row ? { id: row.id, title: row.title, type: row.type } : null;
    },

    async listAnalysisHistory(contentItemId: string): Promise<AssessmentHistoryEntry[]> {
      const rows = await db
        .select()
        .from(intelligenceAnalyses)
        .where(eq(intelligenceAnalyses.contentItemId, contentItemId))
        .orderBy(desc(intelligenceAnalyses.createdAt));
      return rows.map((row) => ({
        analysisId: row.id,
        rulesetVersion: row.rulesetVersion,
        supersededAt: row.supersededAt ? new Date(row.supersededAt).toISOString() : null,
        createdAt: new Date(row.createdAt).toISOString(),
        evidenceMaturity: row.evidenceMaturity,
      }));
    },

    async intelligenceCounts() {
      const [assessed, stale, openReviews] = await Promise.all([
        db
          .select({ n: sql<number>`count(*)` })
          .from(contentIntelligenceState)
          .where(sql`${contentIntelligenceState.currentAnalysisId} is not null`),
        db
          .select({ n: sql<number>`count(*)` })
          .from(contentIntelligenceState)
          .where(eq(contentIntelligenceState.stale, true)),
        db
          .select({ n: sql<number>`count(*)` })
          .from(liveReviewTasks)
          .where(eq(liveReviewTasks.status, 'open')),
      ]);
      return {
        assessedCount: Number(assessed[0]?.n ?? 0),
        staleCount: Number(stale[0]?.n ?? 0),
        openReviewTaskCount: Number(openReviews[0]?.n ?? 0),
      };
    },

    async listRuns(limit: number) {
      return (await db.select().from(intelligenceRuns).orderBy(runOrder).limit(limit)) as never;
    },

    async getRun(id: string) {
      const rows = await db.select().from(intelligenceRuns).where(eq(intelligenceRuns.id, id));
      return (rows[0] ?? null) as never;
    },

    async listLiveClaims(filters, { limit, offset }) {
      const where = liveClaimWhere(filters);
      const base = db.select().from(liveClaims);
      const countBase = db.select({ n: sql<number>`count(*)` }).from(liveClaims);
      const [rows, countRows] = await Promise.all([
        (where ? base.where(where).orderBy(liveClaimOrder) : base.orderBy(liveClaimOrder))
          .limit(limit)
          .offset(offset),
        where ? countBase.where(where) : countBase,
      ]);
      return { rows: rows as never, total: Number(countRows[0]?.n ?? 0) };
    },

    async listSpansForClaims(claimIds: string[]) {
      if (claimIds.length === 0) return [];
      const rows = await db
        .select()
        .from(claimSourceSpans)
        .where(inArray(claimSourceSpans.claimId, claimIds));
      return rows.map((s) => ({
        id: s.id,
        claimId: s.claimId,
        fieldPath: s.fieldPath,
        excerpt: s.excerpt,
        spanHash: s.spanHash,
        primarySupport: s.primarySupport,
        createdAt: s.createdAt,
      }));
    },

    async getLiveClaim(id: string) {
      const rows = await db.select().from(liveClaims).where(eq(liveClaims.id, id));
      return (rows[0] ?? null) as never;
    },

    async listClaimRelationships(claimId: string) {
      return (await db
        .select()
        .from(claimRelationships)
        .where(claimRelationshipWhere(claimId))) as never;
    },

    async listRadarRows(limit: number) {
      return (await db
        .select(radarSelection)
        .from(contentIntelligenceState)
        .innerJoin(
          intelligenceAnalyses,
          eq(intelligenceAnalyses.id, contentIntelligenceState.currentAnalysisId),
        )
        .innerJoin(contentItems, eq(contentItems.id, contentIntelligenceState.contentItemId))
        .leftJoin(papers, eq(papers.contentItemId, contentItems.id))
        .orderBy(radarOrder)
        .limit(limit)) as never;
    },
  };
}
