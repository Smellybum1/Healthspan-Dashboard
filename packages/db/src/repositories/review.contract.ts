import { describe, expect, it } from 'vitest';
import type { ReviewRepository } from '@healthspan/core';
import { listReviewTasks, resolveReviewTask } from '@healthspan/runtime';

/**
 * Adapter-agnostic contract for {@link ReviewRepository}.
 *
 * Like the content contract, every adapter runs *this* suite rather than a parallel one.
 * Unlike the content contract, this domain has a write path, so the suite also exercises
 * the service above the port — `resolveReviewTask` — because the behaviour worth
 * protecting is the decision outcome, not the individual row writes. An adapter that
 * stores a decision but fails to close the task passes a row-level assertion and fails
 * this one.
 */

export type ReviewContractFixture = {
  tasks: Array<{
    id: string;
    contentItemId: string | null;
    claimId: string | null;
    analysisId: string | null;
    expectedAnalysisId: string | null;
    title: string;
    reason: string;
    status: string;
    confidence: string;
    createdAt: number;
  }>;
  claims: Array<{
    id: string;
    analysisId: string;
    contentItemId: string;
    claimText: string;
    reviewStatus: string;
    active: boolean;
  }>;
  intelligence: Array<{
    contentItemId: string;
    currentAnalysisId: string | null;
    stale: boolean;
  }>;
};

export type ReviewContractHarness = {
  name: string;
  create(fixture: ReviewContractFixture): Promise<ReviewRepository>;
  /**
   * Read a claim back from the adapter's own backing store.
   *
   * The port has no claim reader — nothing in the review flow needs one — but a decision
   * that failed to update the claim would otherwise pass every assertion above. This
   * keeps the port narrow without leaving the claim write unverified.
   */
  readClaim(
    id: string,
  ): Promise<{ reviewStatus: string; active: boolean; claimText: string } | null>;
};

const BASE = Date.UTC(2026, 0, 1);
const ANALYSIS = 'analysis-1';

export function reviewContractFixture(): ReviewContractFixture {
  return {
    tasks: [
      {
        id: 'task-open',
        contentItemId: 'item-1',
        claimId: 'claim-1',
        analysisId: ANALYSIS,
        expectedAnalysisId: ANALYSIS,
        title: 'Open task',
        reason: 'low confidence',
        status: 'open',
        confidence: 'low',
        createdAt: BASE + 3_000,
      },
      {
        id: 'task-resolved',
        contentItemId: 'item-2',
        claimId: null,
        analysisId: null,
        expectedAnalysisId: null,
        title: 'Already resolved',
        reason: 'checked',
        status: 'resolved',
        confidence: 'high',
        createdAt: BASE + 2_000,
      },
      {
        id: 'task-stale-item',
        contentItemId: 'item-stale',
        claimId: 'claim-2',
        analysisId: ANALYSIS,
        expectedAnalysisId: ANALYSIS,
        title: 'Stale intelligence',
        reason: 'low confidence',
        status: 'open',
        confidence: 'low',
        createdAt: BASE + 1_000,
      },
    ],
    claims: [
      {
        id: 'claim-1',
        analysisId: ANALYSIS,
        contentItemId: 'item-1',
        claimText: 'Original claim',
        reviewStatus: 'needs_review',
        active: true,
      },
      {
        id: 'claim-2',
        analysisId: ANALYSIS,
        contentItemId: 'item-stale',
        claimText: 'Second claim',
        reviewStatus: 'needs_review',
        active: true,
      },
    ],
    intelligence: [
      { contentItemId: 'item-1', currentAnalysisId: ANALYSIS, stale: false },
      { contentItemId: 'item-stale', currentAnalysisId: ANALYSIS, stale: true },
    ],
  };
}

export function runReviewContract(harness: ReviewContractHarness) {
  const create = () => harness.create(reviewContractFixture());

  describe(`ReviewRepository contract — ${harness.name}`, () => {
    it('lists tasks newest first', async () => {
      const repo = await create();
      const tasks = await repo.listTasks({});
      expect(tasks.map((t) => t.id)).toEqual(['task-open', 'task-resolved', 'task-stale-item']);
    });

    it('clamps the limit to the shared bounds', async () => {
      const repo = await create();
      expect(await repo.listTasks({ limit: 0 })).toHaveLength(1);
      expect(await repo.listTasks({ limit: 1_000 })).toHaveLength(3);
      expect(await repo.listDecisions({ limit: 0 })).toHaveLength(0);
    });

    it('maps a task to the shared DTO, preserving nulls', async () => {
      const repo = await create();
      const task = await repo.getTask('task-resolved');
      expect(task).toMatchObject({
        id: 'task-resolved',
        claimId: null,
        analysisId: null,
        status: 'resolved',
        resolvedAt: null,
      });
    });

    it('returns null for an unknown task rather than throwing', async () => {
      const repo = await create();
      expect(await repo.getTask('nope')).toBeNull();
    });

    it('reads intelligence state, including its absence', async () => {
      const repo = await create();
      expect(await repo.getIntelligenceState('item-1')).toEqual({
        stale: false,
        currentAnalysisId: ANALYSIS,
      });
      expect(await repo.getIntelligenceState('item-stale')).toMatchObject({ stale: true });
      expect(await repo.getIntelligenceState('item-unknown')).toBeNull();
    });

    it('filters by status among the newest tasks, not in the query', async () => {
      // Pre-existing behaviour, preserved deliberately during the port — see
      // `listReviewTasks` in @healthspan/runtime. A limit of 1 takes the newest task
      // first and only then filters, so asking for resolved tasks finds none.
      const repo = await create();
      expect((await listReviewTasks(repo, { status: 'open' })).map((t) => t.id)).toEqual([
        'task-open',
        'task-stale-item',
      ]);
      expect(await listReviewTasks(repo, { status: 'resolved', limit: 1 })).toEqual([]);
    });

    it('resolves an open task, appending a decision and closing the task', async () => {
      const repo = await create();
      const result = await resolveReviewTask(repo, {
        taskId: 'task-open',
        action: 'accept',
        expectedAnalysisId: ANALYSIS,
      });
      expect(result.ok).toBe(true);

      const task = await repo.getTask('task-open');
      expect(task?.status).toBe('resolved');
      expect(task?.resolvedAt).toBeTypeOf('number');

      const decisions = await repo.listDecisions({});
      expect(decisions).toHaveLength(1);
      expect(decisions[0]).toMatchObject({
        taskId: 'task-open',
        action: 'accept',
        claimId: 'claim-1',
        actor: 'local_admin',
        editedClaimText: null,
      });
    });

    it('refuses to resolve the same task twice', async () => {
      const repo = await create();
      await resolveReviewTask(repo, { taskId: 'task-open', action: 'accept' });
      const second = await resolveReviewTask(repo, { taskId: 'task-open', action: 'reject' });
      expect(second).toMatchObject({ ok: false, status: 409 });
      // The rejected second attempt must not have appended anything.
      expect(await repo.listDecisions({})).toHaveLength(1);
    });

    it('refuses an unknown task with 404', async () => {
      const repo = await create();
      expect(await resolveReviewTask(repo, { taskId: 'nope', action: 'accept' })).toMatchObject({
        ok: false,
        status: 404,
      });
    });

    it('refuses to resolve against stale intelligence', async () => {
      const repo = await create();
      const result = await resolveReviewTask(repo, {
        taskId: 'task-stale-item',
        action: 'accept',
      });
      expect(result).toMatchObject({ ok: false, status: 409 });
      expect(await repo.listDecisions({})).toHaveLength(0);
    });

    it('refuses when the expected analysis no longer matches', async () => {
      const repo = await create();
      const result = await resolveReviewTask(repo, {
        taskId: 'task-open',
        action: 'accept',
        expectedAnalysisId: 'analysis-superseded',
      });
      expect(result).toMatchObject({ ok: false, status: 409 });
    });

    it('requires edited text for an edit, and writes it through to the claim', async () => {
      const repo = await create();
      expect(
        await resolveReviewTask(repo, {
          taskId: 'task-open',
          action: 'edit',
          editedClaimText: '  ',
        }),
      ).toMatchObject({ ok: false, status: 400 });

      const ok = await resolveReviewTask(repo, {
        taskId: 'task-open',
        action: 'edit',
        editedClaimText: '  Corrected claim  ',
      });
      expect(ok.ok).toBe(true);
      const decision = (await repo.listDecisions({}))[0];
      expect(decision?.editedClaimText).toBe('Corrected claim');
      // Trimmed on the way to the claim as well, and the claim reactivated.
      expect(await harness.readClaim('claim-1')).toMatchObject({
        reviewStatus: 'edited',
        claimText: 'Corrected claim',
        active: true,
      });
    });

    it.each([
      ['accept', 'accepted', true],
      ['reject', 'rejected', false],
      ['dismiss', 'dismissed', false],
      ['uncertain', 'uncertain', true],
    ] as const)('maps %s to claim status %s', async (action, reviewStatus, active) => {
      const repo = await create();
      const result = await resolveReviewTask(repo, { taskId: 'task-open', action });
      expect(result.ok).toBe(true);
      expect(await harness.readClaim('claim-1')).toMatchObject({ reviewStatus, active });
    });

    it('records the actor the caller supplies', async () => {
      // No hosted write path is exposed yet; this asserts the hosted principal would be
      // recorded rather than silently defaulting to the local admin.
      const repo = await create();
      await resolveReviewTask(repo, {
        taskId: 'task-open',
        action: 'accept',
        actor: 'hosted-owner',
      });
      expect((await repo.listDecisions({}))[0]?.actor).toBe('hosted-owner');
    });

    it('lists decisions newest first', async () => {
      const repo = await create();
      await resolveReviewTask(repo, { taskId: 'task-open', action: 'accept' });
      await resolveReviewTask(repo, { taskId: 'task-stale-item', action: 'dismiss' });
      const decisions = await repo.listDecisions({});
      // The stale task cannot resolve, so only one decision exists to order.
      expect(decisions).toHaveLength(1);
      expect(decisions[0]?.taskId).toBe('task-open');
    });
  });
}
