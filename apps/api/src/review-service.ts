import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import {
  contentIntelligenceState,
  liveClaims,
  liveReviewTasks,
  reviewDecisions,
  type HealthspanDb,
} from '@healthspan/db';

export const REVIEW_ACTIONS = [
  'accept',
  'edit',
  'reject',
  'uncertain',
  'dismiss',
] as const;

export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

export function listReviewTasks(db: HealthspanDb, opts?: { status?: string; limit?: number }) {
  const limit = Math.min(200, Math.max(1, opts?.limit ?? 100));
  const rows = db.select().from(liveReviewTasks).orderBy(desc(liveReviewTasks.createdAt)).limit(limit).all();
  return rows.filter((row) => (opts?.status ? row.status === opts.status : true));
}

export function listReviewDecisions(db: HealthspanDb, limit = 100) {
  return db
    .select()
    .from(reviewDecisions)
    .orderBy(desc(reviewDecisions.createdAt))
    .limit(Math.min(200, Math.max(1, limit)))
    .all();
}

export function resolveReviewTask(
  db: HealthspanDb,
  opts: {
    taskId: string;
    action: ReviewAction;
    notes?: string;
    editedClaimText?: string;
    expectedAnalysisId?: string | null;
  },
) {
  const task = db.select().from(liveReviewTasks).where(eq(liveReviewTasks.id, opts.taskId)).all()[0];
  if (!task) {
    return { ok: false as const, status: 404 as const, error: 'Review task not found' };
  }
  if (task.status !== 'open') {
    return { ok: false as const, status: 409 as const, error: 'Review task is no longer open' };
  }

  const expected =
    opts.expectedAnalysisId ?? task.expectedAnalysisId ?? task.analysisId ?? null;
  if (expected && task.analysisId && expected !== task.analysisId) {
    return {
      ok: false as const,
      status: 409 as const,
      error: 'Source analysis changed; refresh and retry',
    };
  }

  if (task.contentItemId) {
    const state = db
      .select()
      .from(contentIntelligenceState)
      .where(eq(contentIntelligenceState.contentItemId, task.contentItemId))
      .all()[0];
    if (state?.stale) {
      return {
        ok: false as const,
        status: 409 as const,
        error: 'Intelligence is stale for this item; reassess before resolving',
      };
    }
    if (expected && state?.currentAnalysisId && expected !== state.currentAnalysisId) {
      return {
        ok: false as const,
        status: 409 as const,
        error: 'Current analysis no longer matches this review task',
      };
    }
  }

  if (opts.action === 'edit' && !opts.editedClaimText?.trim()) {
    return { ok: false as const, status: 400 as const, error: 'editedClaimText is required for edit' };
  }

  const decisionId = randomUUID();
  const now = Date.now();
  db.insert(reviewDecisions)
    .values({
      id: decisionId,
      taskId: task.id,
      contentItemId: task.contentItemId,
      claimId: task.claimId,
      analysisId: task.analysisId,
      sourceRecordVersionId: task.sourceRecordVersionId,
      action: opts.action,
      decisionText: opts.action,
      editedClaimText: opts.editedClaimText?.trim() || null,
      actor: 'local_admin',
      createdAt: now,
      notes: opts.notes ?? null,
    })
    .run();

  const claimStatus =
    opts.action === 'accept'
      ? 'accepted'
      : opts.action === 'edit'
        ? 'edited'
        : opts.action === 'reject'
          ? 'rejected'
          : opts.action === 'uncertain'
            ? 'uncertain'
            : 'dismissed';

  if (task.claimId) {
    const claimUpdate: {
      reviewStatus: string;
      active?: boolean;
      claimText?: string;
    } = { reviewStatus: claimStatus };
    if (opts.action === 'reject' || opts.action === 'dismiss') {
      claimUpdate.active = false;
    }
    if (opts.action === 'edit' && opts.editedClaimText) {
      claimUpdate.claimText = opts.editedClaimText.trim();
      claimUpdate.active = true;
    }
    db.update(liveClaims).set(claimUpdate).where(eq(liveClaims.id, task.claimId)).run();
  }

  db.update(liveReviewTasks)
    .set({
      status: 'resolved',
      resolvedAt: now,
      resolutionJson: JSON.stringify({
        decisionId,
        action: opts.action,
        notes: opts.notes ?? null,
      }),
    })
    .where(eq(liveReviewTasks.id, task.id))
    .run();

  if (task.contentItemId) {
    db.update(contentIntelligenceState)
      .set({ lastReviewAt: now, updatedAt: now })
      .where(eq(contentIntelligenceState.contentItemId, task.contentItemId))
      .run();
  }

  return {
    ok: true as const,
    decisionId,
    taskId: task.id,
    action: opts.action,
  };
}

export function markOpenReviewsStaleForContent(db: HealthspanDb, contentItemId: string, reason: string) {
  const open = db
    .select()
    .from(liveReviewTasks)
    .where(eq(liveReviewTasks.contentItemId, contentItemId))
    .all()
    .filter((t) => t.status === 'open');
  for (const task of open) {
    db.update(liveReviewTasks)
      .set({
        status: 'stale',
        resolutionJson: JSON.stringify({ reason, markedAt: Date.now() }),
      })
      .where(eq(liveReviewTasks.id, task.id))
      .run();
  }
  return open.length;
}
