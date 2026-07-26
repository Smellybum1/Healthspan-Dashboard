import { desc } from 'drizzle-orm';
import type { ReviewDecisionDto, ReviewTaskDto } from '@healthspan/core';
import { liveReviewTasks, reviewDecisions } from '../intelligence-schema.js';

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
