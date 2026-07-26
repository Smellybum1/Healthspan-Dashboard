import { eq } from 'drizzle-orm';
import {
  normaliseReviewLimit,
  type ClaimReviewUpdate,
  type ReviewDecisionDto,
  type ReviewDecisionInsert,
  type CreatorFindingRow,
  type IdentityTaskRow,
  type ReviewIntelligenceState,
  type ReviewRepository,
  type ReviewTaskDto,
} from '@healthspan/core';
import {
  contentIntelligenceState,
  liveClaims,
  liveReviewTasks,
  reviewDecisions,
} from '../../intelligence-schema.js';
import {
  reviewDecisionOrder,
  reviewTaskOrder,
  candidateFindingWhere,
  creatorClaimFindings,
  creatorClaims,
  creatorFindingSelection,
  creatorIdentityTasks,
  identityTaskOrder,
  identityTaskWhere,
  toReviewDecisionDto,
  toReviewTaskDto,
} from '../../repositories/review-query.js';
import type { SitesD1Database } from './client.js';

/**
 * Sites/D1 implementation of {@link ReviewRepository}.
 *
 * Structurally the same queries as the local adapter, because the ordering and the row
 * mapping come from the same `repositories/review-query.js`. Only execution differs: D1
 * is async-only, so every statement is awaited.
 *
 * Writes are separate statements rather than a `batch`, matching the local adapter and
 * the pre-existing local behaviour — the compatibility audit records zero application
 * transactions. This is a real property of the write path, not an oversight: a resolve
 * that fails partway leaves the same state in both runtimes. Making it atomic is a
 * change to the domain's guarantees and belongs to a decision, not to a port.
 */
export function createSitesReviewRepository(db: SitesD1Database): ReviewRepository {
  return {
    async listTasks({ limit }): Promise<ReviewTaskDto[]> {
      const rows = await db
        .select()
        .from(liveReviewTasks)
        .orderBy(reviewTaskOrder)
        .limit(normaliseReviewLimit(limit));
      return rows.map(toReviewTaskDto);
    },

    async listDecisions({ limit }): Promise<ReviewDecisionDto[]> {
      const rows = await db
        .select()
        .from(reviewDecisions)
        .orderBy(reviewDecisionOrder)
        .limit(normaliseReviewLimit(limit));
      return rows.map(toReviewDecisionDto);
    },

    async getTask(taskId: string): Promise<ReviewTaskDto | null> {
      const rows = await db.select().from(liveReviewTasks).where(eq(liveReviewTasks.id, taskId));
      const row = rows[0];
      return row ? toReviewTaskDto(row) : null;
    },

    async getIntelligenceState(contentItemId: string): Promise<ReviewIntelligenceState | null> {
      const rows = await db
        .select()
        .from(contentIntelligenceState)
        .where(eq(contentIntelligenceState.contentItemId, contentItemId));
      const row = rows[0];
      return row ? { stale: Boolean(row.stale), currentAnalysisId: row.currentAnalysisId } : null;
    },

    async appendDecision(decision: ReviewDecisionInsert): Promise<void> {
      await db.insert(reviewDecisions).values(decision);
    },

    async updateClaimReviewState(claimId: string, update: ClaimReviewUpdate): Promise<void> {
      await db.update(liveClaims).set(update).where(eq(liveClaims.id, claimId));
    },

    async markTaskResolved(
      taskId: string,
      resolution: { resolvedAt: number; resolutionJson: string },
    ): Promise<void> {
      await db
        .update(liveReviewTasks)
        .set({
          status: 'resolved',
          resolvedAt: resolution.resolvedAt,
          resolutionJson: resolution.resolutionJson,
        })
        .where(eq(liveReviewTasks.id, taskId));
    },

    async recordReviewTouch(contentItemId: string, at: number): Promise<void> {
      await db
        .update(contentIntelligenceState)
        .set({ lastReviewAt: at, updatedAt: at })
        .where(eq(contentIntelligenceState.contentItemId, contentItemId));
    },

    async listCandidateCreatorFindings(limit: number): Promise<CreatorFindingRow[]> {
      const rows = await db
        .select(creatorFindingSelection)
        .from(creatorClaimFindings)
        .leftJoin(creatorClaims, eq(creatorClaims.id, creatorClaimFindings.claimId))
        .where(candidateFindingWhere)
        .limit(limit);
      return rows as CreatorFindingRow[];
    },

    async listClaimFindings(claimId: string): Promise<CreatorFindingRow[]> {
      const rows = await db
        .select(creatorFindingSelection)
        .from(creatorClaimFindings)
        .leftJoin(creatorClaims, eq(creatorClaims.id, creatorClaimFindings.claimId))
        .where(eq(creatorClaimFindings.claimId, claimId));
      return rows as CreatorFindingRow[];
    },

    async listIdentityTasks(limit: number): Promise<IdentityTaskRow[]> {
      const rows = await db
        .select()
        .from(creatorIdentityTasks)
        .where(identityTaskWhere)
        .orderBy(identityTaskOrder)
        .limit(limit);
      return rows.map((t) => ({
        id: t.id,
        accountId: t.accountId,
        reason: t.reason,
        proposedCreatorId: t.proposedCreatorId,
        priority: t.priority,
        reviewStatus: t.reviewStatus,
        createdAt: t.createdAt,
      }));
    },
  };
}
