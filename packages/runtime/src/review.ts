import {
  claimStatusForAction,
  isAdverseCreatorFinding,
  normaliseReviewLimit,
  toCreatorReviewTaskDto,
  type ClaimReviewUpdate,
  type CreatorFindingRow,
  type CreatorReviewTaskDto,
  type IdentityTaskDto,
  type ReviewAction,
  type ReviewDecisionDto,
  type ReviewRepository,
  type ReviewTaskDto,
} from '@healthspan/core';

export type {
  CreatorReviewTaskDto,
  IdentityTaskDto,
  ReviewAction,
  ReviewDecisionDto,
  ReviewTaskDto,
};

/**
 * Review tasks and decisions — the first domain with a write path.
 *
 * Every rule that decides whether a review decision is valid lives here rather than in
 * an adapter: which actions require edited text, what makes a task unresolvable, how an
 * action maps to a claim state. The adapters only read and write rows. That is what lets
 * the local and hosted runtimes reach the same verdict on the same task.
 */

/**
 * List review tasks, optionally filtered by status.
 *
 * **The filter is applied after the limit, not in SQL.** That is the pre-existing local
 * behaviour, preserved deliberately: `{ status: 'open', limit: 100 }` returns the open
 * tasks *among the newest 100*, which can be fewer than 100 open tasks — and with enough
 * resolved tasks, zero. Pushing the predicate into the query would be more useful, but a
 * migration that also changes behaviour is a migration nobody can review, so the change
 * is left to a separate decision. The oddity is centralised here rather than duplicated
 * into two adapters, so fixing it later is a one-line change in one place.
 */
export async function listReviewTasks(
  repo: ReviewRepository,
  opts: { status?: string; limit?: number } = {},
): Promise<ReviewTaskDto[]> {
  const tasks = await repo.listTasks({ limit: normaliseReviewLimit(opts.limit) });
  return opts.status ? tasks.filter((task) => task.status === opts.status) : tasks;
}

export function listReviewDecisions(
  repo: ReviewRepository,
  limit?: number,
): Promise<ReviewDecisionDto[]> {
  return repo.listDecisions({ limit: normaliseReviewLimit(limit) });
}

export type ResolveReviewTaskInput = {
  taskId: string;
  action: ReviewAction;
  notes?: string;
  editedClaimText?: string;
  expectedAnalysisId?: string | null;
  /**
   * Who is recorded on the decision. The local runtime has a single admin; the hosted
   * runtime would pass its owner principal. No hosted write path is exposed yet, so the
   * hosted value is not wired — the parameter exists so that when it is, the actor is
   * not silently recorded as a local admin.
   */
  actor?: string;
};

export type ResolveReviewTaskResult =
  | { ok: true; decisionId: string; taskId: string; action: ReviewAction }
  | { ok: false; status: 400 | 404 | 409; error: string };

export async function resolveReviewTask(
  repo: ReviewRepository,
  opts: ResolveReviewTaskInput,
): Promise<ResolveReviewTaskResult> {
  const task = await repo.getTask(opts.taskId);
  if (!task) {
    return { ok: false, status: 404, error: 'Review task not found' };
  }
  if (task.status !== 'open') {
    return { ok: false, status: 409, error: 'Review task is no longer open' };
  }

  const expected = opts.expectedAnalysisId ?? task.expectedAnalysisId ?? task.analysisId ?? null;
  if (expected && task.analysisId && expected !== task.analysisId) {
    return { ok: false, status: 409, error: 'Source analysis changed; refresh and retry' };
  }

  if (task.contentItemId) {
    const state = await repo.getIntelligenceState(task.contentItemId);
    if (state?.stale) {
      return {
        ok: false,
        status: 409,
        error: 'Intelligence is stale for this item; reassess before resolving',
      };
    }
    if (expected && state?.currentAnalysisId && expected !== state.currentAnalysisId) {
      return {
        ok: false,
        status: 409,
        error: 'Current analysis no longer matches this review task',
      };
    }
  }

  if (opts.action === 'edit' && !opts.editedClaimText?.trim()) {
    return { ok: false, status: 400, error: 'editedClaimText is required for edit' };
  }

  // `crypto.randomUUID` rather than `node:crypto`'s: the Web Crypto global exists in
  // both Node and the edge runtime, and importing the Node module here would put this
  // service outside the hosted graph.
  const decisionId = crypto.randomUUID();
  const now = Date.now();

  await repo.appendDecision({
    id: decisionId,
    taskId: task.id,
    contentItemId: task.contentItemId,
    claimId: task.claimId,
    analysisId: task.analysisId,
    sourceRecordVersionId: task.sourceRecordVersionId,
    action: opts.action,
    decisionText: opts.action,
    editedClaimText: opts.editedClaimText?.trim() || null,
    actor: opts.actor ?? 'local_admin',
    createdAt: now,
    notes: opts.notes ?? null,
  });

  if (task.claimId) {
    const claimUpdate: ClaimReviewUpdate = { reviewStatus: claimStatusForAction(opts.action) };
    if (opts.action === 'reject' || opts.action === 'dismiss') {
      claimUpdate.active = false;
    }
    if (opts.action === 'edit' && opts.editedClaimText) {
      claimUpdate.claimText = opts.editedClaimText.trim();
      claimUpdate.active = true;
    }
    await repo.updateClaimReviewState(task.claimId, claimUpdate);
  }

  await repo.markTaskResolved(task.id, {
    resolvedAt: now,
    resolutionJson: JSON.stringify({
      decisionId,
      action: opts.action,
      notes: opts.notes ?? null,
    }),
  });

  if (task.contentItemId) {
    await repo.recordReviewTouch(task.contentItemId, now);
  }

  return { ok: true, decisionId, taskId: task.id, action: opts.action };
}

/**
 * Creator-alignment findings awaiting human review before a profile may publish.
 *
 * The adverse-type test stays here rather than in the query: it is a prefix match over a
 * list of type names, and pushing it into SQL would mean encoding that list into every
 * adapter's WHERE clause — two places for one rule to drift.
 *
 * The retired implementation applied its limit *before* this filter, so a page could come
 * back short. The limit now bounds the candidate rows the query returns and the filter
 * narrows within them, which is the same ordering of operations; `creator-review-parity`
 * cases in `review.contract.ts` pin it.
 */
export async function listCreatorReviewTasks(
  repo: ReviewRepository,
  opts: { limit?: number } = {},
): Promise<CreatorReviewTaskDto[]> {
  const rows = await repo.listCandidateCreatorFindings(normaliseReviewLimit(opts.limit));
  return rows.filter((f) => isAdverseCreatorFinding(f.findingType)).map(toCreatorReviewTaskDto);
}

/**
 * Findings a creator profile may show for one claim.
 *
 * Two different rules, which is why this cannot be a query: an adverse finding must have
 * been accepted *and* published, while a non-adverse one only has to not be rejected.
 */
export async function listPublishedCreatorFindings(
  repo: ReviewRepository,
  claimId: string,
): Promise<CreatorFindingRow[]> {
  const rows = await repo.listClaimFindings(claimId);
  return rows.filter((f) => {
    if (!isAdverseCreatorFinding(f.findingType)) return f.findingState !== 'rejected';
    return f.findingState === 'accepted' && Boolean(f.publishedToProfile);
  });
}

export async function listIdentityTasks(
  repo: ReviewRepository,
  limit = 50,
): Promise<IdentityTaskDto[]> {
  const rows = await repo.listIdentityTasks(normaliseReviewLimit(limit));
  return rows.map((t) => ({
    id: t.id,
    accountId: t.accountId,
    reason: t.reason,
    proposedCreatorId: t.proposedCreatorId,
    priority: t.priority,
    reviewStatus: t.reviewStatus,
    createdAt: new Date(t.createdAt).toISOString(),
  }));
}
