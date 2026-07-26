import { and, desc, eq, or } from 'drizzle-orm';
import type { ReviewDecisionDto, ReviewTaskDto } from '@healthspan/core';
import { liveReviewTasks, reviewDecisions } from '../intelligence-schema.js';
import { creatorClaimFindings, creatorClaims, creatorIdentityTasks } from '../creator-schema.js';

/**
 * Query semantics and row mapping shared by the local SQLite and Sites D1 review
 * adapters.
 *
 * Both adapters order and project identically because they do it through this file.
 * What differs is execution alone — synchronous `.all()` against `better-sqlite3`,
 * awaited against the D1 driver.
 *
 * Driver-independent: `../intelligence-schema.js` imports only `drizzle-orm/sqlite-core`,
 * so this module is safe to reach from the edge bundle.
 */

export const reviewTaskOrder = desc(liveReviewTasks.createdAt);
export const reviewDecisionOrder = desc(reviewDecisions.createdAt);

type TaskRow = typeof liveReviewTasks.$inferSelect;
type DecisionRow = typeof reviewDecisions.$inferSelect;

export function toReviewTaskDto(row: TaskRow): ReviewTaskDto {
  return {
    id: row.id,
    contentItemId: row.contentItemId,
    claimId: row.claimId,
    analysisId: row.analysisId,
    sourceRecordVersionId: row.sourceRecordVersionId,
    expectedAnalysisId: row.expectedAnalysisId,
    title: row.title,
    reason: row.reason,
    status: row.status,
    confidence: row.confidence,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    resolutionJson: row.resolutionJson,
  };
}

export function toReviewDecisionDto(row: DecisionRow): ReviewDecisionDto {
  return {
    id: row.id,
    taskId: row.taskId,
    contentItemId: row.contentItemId,
    claimId: row.claimId,
    analysisId: row.analysisId,
    sourceRecordVersionId: row.sourceRecordVersionId,
    action: row.action,
    decisionText: row.decisionText,
    editedClaimText: row.editedClaimText,
    actor: row.actor,
    createdAt: row.createdAt,
    notes: row.notes,
  };
}

/**
 * Candidate creator findings joined to their claim.
 *
 * The retired implementation loaded every finding, filtered in memory, then re-selected
 * the whole `creator_claims` table once per surviving finding to attach the claim. The
 * join below does both in one statement.
 *
 * A **left** join: `creator_claim_findings.claim_id` is nullable, and a finding with no
 * claim still produced a task (titled by its finding type). An inner join would drop it.
 */
export const creatorFindingSelection = {
  id: creatorClaimFindings.id,
  claimId: creatorClaimFindings.claimId,
  findingType: creatorClaimFindings.findingType,
  findingState: creatorClaimFindings.findingState,
  explanation: creatorClaimFindings.explanation,
  reviewRequired: creatorClaimFindings.reviewRequired,
  publishedToProfile: creatorClaimFindings.publishedToProfile,
  createdAt: creatorClaimFindings.createdAt,
  claimText: creatorClaims.claimText,
  claimCreatorId: creatorClaims.creatorId,
  claimConfidence: creatorClaims.confidence,
};

/** Candidates requiring review. The adverse-type test is a prefix match and stays in the service. */
export const candidateFindingWhere = and(
  eq(creatorClaimFindings.findingState, 'candidate'),
  eq(creatorClaimFindings.reviewRequired, true),
);

export const identityTaskOrder = desc(creatorIdentityTasks.priority);

/** Open or pending — the retired filter, as a predicate. */
export const identityTaskWhere = or(
  eq(creatorIdentityTasks.reviewStatus, 'pending'),
  eq(creatorIdentityTasks.currentState, 'open'),
);

export { creatorClaimFindings, creatorClaims, creatorIdentityTasks };
