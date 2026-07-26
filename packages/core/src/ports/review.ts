/**
 * Review tasks and decisions.
 *
 * See `./index.ts` for the rules that govern this directory.
 *
 * This is the first domain with a write path. The port stays narrow and data-shaped —
 * the decision rules (which actions are valid, what makes a task unresolvable, how an
 * action maps to a claim state) live in `@healthspan/runtime`, not in an adapter, so
 * both runtimes apply the same rules and only the storage differs.
 */

export const REVIEW_ACTIONS = ['accept', 'edit', 'reject', 'uncertain', 'dismiss'] as const;

export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

export type ReviewTaskDto = {
  id: string;
  contentItemId: string | null;
  claimId: string | null;
  analysisId: string | null;
  sourceRecordVersionId: string | null;
  expectedAnalysisId: string | null;
  title: string;
  reason: string;
  status: string;
  confidence: string;
  createdAt: number;
  resolvedAt: number | null;
  resolutionJson: string | null;
};

export type ReviewDecisionDto = {
  id: string;
  taskId: string | null;
  contentItemId: string | null;
  claimId: string | null;
  analysisId: string | null;
  sourceRecordVersionId: string | null;
  action: string;
  decisionText: string | null;
  editedClaimText: string | null;
  actor: string;
  createdAt: number;
  notes: string | null;
};

/** The staleness guard a review decision consults before it is allowed to land. */
export type ReviewIntelligenceState = {
  stale: boolean;
  currentAnalysisId: string | null;
};

/** A decision row, already validated by the service. Adapters append it verbatim. */
export type ReviewDecisionInsert = ReviewDecisionDto;

export type ClaimReviewUpdate = {
  reviewStatus: string;
  active?: boolean;
  claimText?: string;
};

export interface ReviewRepository {
  /**
   * The newest `limit` tasks, unfiltered.
   *
   * Status filtering is deliberately *not* a repository concern — see
   * `listReviewTasks` in `@healthspan/runtime` for why, and for the pre-existing
   * behaviour that shape preserves. Keeping it out of the adapters means neither one
   * can implement the filter differently.
   */
  listTasks(query: { limit?: number }): Promise<ReviewTaskDto[]>;
  listDecisions(query: { limit?: number }): Promise<ReviewDecisionDto[]>;
  getTask(taskId: string): Promise<ReviewTaskDto | null>;
  /**
   * Intelligence state for a content item, or `null` when none is recorded.
   *
   * On a review port rather than an intelligence one because the staleness guard is part
   * of what makes a review decision valid, not a fact the caller supplies.
   */
  getIntelligenceState(contentItemId: string): Promise<ReviewIntelligenceState | null>;
  appendDecision(decision: ReviewDecisionInsert): Promise<void>;
  updateClaimReviewState(claimId: string, update: ClaimReviewUpdate): Promise<void>;
  markTaskResolved(
    taskId: string,
    resolution: { resolvedAt: number; resolutionJson: string },
  ): Promise<void>;
  recordReviewTouch(contentItemId: string, at: number): Promise<void>;
}

/** Shared bounds, applied identically by every adapter. */
export const REVIEW_LIMIT_MAX = 200;
export const REVIEW_LIMIT_DEFAULT = 100;

export function normaliseReviewLimit(limit: number | undefined): number {
  return Math.min(REVIEW_LIMIT_MAX, Math.max(1, limit ?? REVIEW_LIMIT_DEFAULT));
}

/** Maps a review action to the claim review status it produces. */
export function claimStatusForAction(action: ReviewAction): string {
  switch (action) {
    case 'accept':
      return 'accepted';
    case 'edit':
      return 'edited';
    case 'reject':
      return 'rejected';
    case 'uncertain':
      return 'uncertain';
    case 'dismiss':
      return 'dismissed';
  }
}
