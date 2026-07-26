import { eq } from 'drizzle-orm';
import {
  normaliseReviewLimit,
  type ClaimReviewUpdate,
  type ReviewDecisionDto,
  type ReviewDecisionInsert,
  type ReviewIntelligenceState,
  type ReviewRepository,
  type ReviewTaskDto,
} from '@healthspan/core';
import {
  contentIntelligenceState,
  liveClaims,
  liveReviewTasks,
  reviewDecisions,
} from '../intelligence-schema.js';
import type { HealthspanDb } from '../client.js';
import {
  reviewDecisionOrder,
  reviewTaskOrder,
  toReviewDecisionDto,
  toReviewTaskDto,
} from './review-query.js';

/**
 * Local SQLite implementation of {@link ReviewRepository}.
 *
 * `better-sqlite3` is synchronous, so every method resolves immediately. Ordering and
 * row mapping come from `./review-query.js`, shared with the D1 adapter; only execution
 * differs.
 *
 * The write methods are separate statements rather than one transaction. That matches
 * the pre-existing local behaviour — the compatibility audit records zero application
 * `db.transaction()` calls — and it is what D1 can offer without a batch. Preserving it
 * keeps the two runtimes' failure modes the same rather than making the local one
 * stricter than the hosted one can be.
 */
export function createLocalReviewRepository(db: HealthspanDb): ReviewRepository {
  return {
    listTasks({ limit }): Promise<ReviewTaskDto[]> {
      const rows = db
        .select()
        .from(liveReviewTasks)
        .orderBy(reviewTaskOrder)
        .limit(normaliseReviewLimit(limit))
        .all();
      return Promise.resolve(rows.map(toReviewTaskDto));
    },

    listDecisions({ limit }): Promise<ReviewDecisionDto[]> {
      const rows = db
        .select()
        .from(reviewDecisions)
        .orderBy(reviewDecisionOrder)
        .limit(normaliseReviewLimit(limit))
        .all();
      return Promise.resolve(rows.map(toReviewDecisionDto));
    },

    getTask(taskId: string): Promise<ReviewTaskDto | null> {
      const row = db.select().from(liveReviewTasks).where(eq(liveReviewTasks.id, taskId)).all()[0];
      return Promise.resolve(row ? toReviewTaskDto(row) : null);
    },

    getIntelligenceState(contentItemId: string): Promise<ReviewIntelligenceState | null> {
      const row = db
        .select()
        .from(contentIntelligenceState)
        .where(eq(contentIntelligenceState.contentItemId, contentItemId))
        .all()[0];
      return Promise.resolve(
        row ? { stale: Boolean(row.stale), currentAnalysisId: row.currentAnalysisId } : null,
      );
    },

    appendDecision(decision: ReviewDecisionInsert): Promise<void> {
      db.insert(reviewDecisions).values(decision).run();
      return Promise.resolve();
    },

    updateClaimReviewState(claimId: string, update: ClaimReviewUpdate): Promise<void> {
      db.update(liveClaims).set(update).where(eq(liveClaims.id, claimId)).run();
      return Promise.resolve();
    },

    markTaskResolved(
      taskId: string,
      resolution: { resolvedAt: number; resolutionJson: string },
    ): Promise<void> {
      db.update(liveReviewTasks)
        .set({
          status: 'resolved',
          resolvedAt: resolution.resolvedAt,
          resolutionJson: resolution.resolutionJson,
        })
        .where(eq(liveReviewTasks.id, taskId))
        .run();
      return Promise.resolve();
    },

    recordReviewTouch(contentItemId: string, at: number): Promise<void> {
      db.update(contentIntelligenceState)
        .set({ lastReviewAt: at, updatedAt: at })
        .where(eq(contentIntelligenceState.contentItemId, contentItemId))
        .run();
      return Promise.resolve();
    },
  };
}
