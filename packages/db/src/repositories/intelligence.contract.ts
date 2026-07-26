import { describe, expect, it } from 'vitest';
import type { IntelligenceReadRepository } from '@healthspan/core';
import {
  getIntelligenceRun,
  getLiveClaim,
  intelligenceStatus,
  listIntelligenceRuns,
  listLiveClaims,
  liveRadarPoints,
} from '@healthspan/runtime';

/**
 * Adapter-agnostic contract for the intelligence half of
 * {@link IntelligenceReadRepository}. Both adapters run it.
 */
export type IntelligenceContractHarness = {
  name: string;
  create(): Promise<IntelligenceReadRepository>;
};

export function runIntelligenceContract(harness: IntelligenceContractHarness) {
  describe(`IntelligenceReadRepository contract — ${harness.name}`, () => {
    it('counts assessed, stale, and open review tasks', async () => {
      const repo = await harness.create();
      const status = await intelligenceStatus(repo);
      // Four states carry a current analysis; one does not.
      expect(status.assessedCount).toBe(4);
      expect(status.staleCount).toBe(1);
      // One open task, one resolved.
      expect(status.openReviewTaskCount).toBe(1);
      expect(status.rulesetVersion).toBe('m3.deterministic.1');
    });

    it('reports the most recent runs, newest first', async () => {
      const repo = await harness.create();
      const status = await intelligenceStatus(repo);
      expect(status.recentRuns.map((r) => r.id)).toEqual(['run-new', 'run-old']);
      expect(status.recentRuns[0]).toMatchObject({ status: 'succeeded', completedCount: 4 });
    });

    it('lists and fetches runs', async () => {
      const repo = await harness.create();
      expect((await listIntelligenceRuns(repo)).map((r) => r.id)).toEqual(['run-new', 'run-old']);
      expect(await getIntelligenceRun(repo, 'run-old')).toMatchObject({ status: 'failed' });
      expect(await getIntelligenceRun(repo, 'nope')).toBeNull();
    });

    it('lists claims newest first with their spans attached', async () => {
      const repo = await harness.create();
      const { items, total } = await listLiveClaims(repo, {});
      expect(items.map((c) => c.id)).toEqual(['claim-1', 'claim-2', 'claim-orphan']);
      expect(total).toBe(3);
      expect(items[0]?.spans.map((s) => s.id)).toEqual(['span-1a', 'span-1b']);
      // Every claim on the page gets its own spans, not just the first. The single
      // batched span query is only correct if it covers the whole page — asserting the
      // first claim alone would pass against a query that fetched one claim's spans.
      expect(items[1]?.spans.map((s) => s.id)).toEqual(['span-2a']);
      // A claim with no spans gets an empty list, not a missing key.
      expect(items[2]?.spans).toEqual([]);
    });

    it.each([
      ['claimKind', { claimKind: 'safety' }, ['claim-2']],
      ['assertionRole', { assertionRole: 'regulatory_statement' }, ['claim-2']],
      ['reviewStatus', { reviewStatus: 'accepted' }, ['claim-2']],
    ] as const)('pushes the %s filter into the query', async (_n, query, expected) => {
      const repo = await harness.create();
      const { items } = await listLiveClaims(repo, query);
      expect(items.map((c) => c.id)).toEqual(expected);
    });

    it('searches claim text case-insensitively and counts the filtered set', async () => {
      const repo = await harness.create();
      const result = await listLiveClaims(repo, { q: 'METFORMIN', pageSize: 1 });
      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(1);
      expect(result.totalPages).toBe(2);
    });

    it('clamps paging to the shared bounds', async () => {
      const repo = await harness.create();
      expect((await listLiveClaims(repo, { pageSize: 1_000 })).pageSize).toBe(100);
      expect((await listLiveClaims(repo, { pageSize: 0 })).pageSize).toBe(1);
      expect((await listLiveClaims(repo, { page: 99 })).items).toEqual([]);
    });

    it('returns a claim detail with spans, relationships, and its item', async () => {
      const repo = await harness.create();
      const detail = await getLiveClaim(repo, 'claim-1');
      expect(detail?.item).toEqual({
        id: 'item-paper',
        title: 'Metformin randomised trial',
        type: 'paper',
      });
      expect(detail?.spans.map((s) => s.id)).toEqual(['span-1a', 'span-1b']);
      // Relationships from either side, and only this claim's.
      expect(detail?.relationships.map((r) => r.id).sort()).toEqual(['rel-left', 'rel-right']);
    });

    it('reports a null item when the claim outlived its content item', async () => {
      const repo = await harness.create();
      const detail = await getLiveClaim(repo, 'claim-orphan');
      expect(detail).not.toBeNull();
      expect(detail?.item).toBeNull();
    });

    it('returns null for an unknown claim rather than throwing', async () => {
      const repo = await harness.create();
      expect(await getLiveClaim(repo, 'nope')).toBeNull();
    });

    it('plots radar points from current analyses only', async () => {
      const repo = await harness.create();
      const points = await liveRadarPoints(repo, 40);
      // item-unassessed has no current analysis.
      expect(points.map((p) => p.itemId).sort()).toEqual([
        'item-paper',
        'item-reg',
        'item-retracted',
        'item-trial',
      ]);
    });

    it('maps evidence maturity to an x position, falling back for an unknown one', async () => {
      const repo = await harness.create();
      const points = await liveRadarPoints(repo, 40);
      expect(points.find((p) => p.itemId === 'item-paper')?.evidenceX).toBe(0.8);
      expect(points.find((p) => p.itemId === 'item-trial')?.evidenceX).toBe(0.2);
    });

    it('flags a safety concern by item type and by retraction', async () => {
      const repo = await harness.create();
      const points = await liveRadarPoints(repo, 40);
      expect(points.find((p) => p.itemId === 'item-reg')?.safetyConcern).toBe(true);
      expect(points.find((p) => p.itemId === 'item-retracted')?.safetyConcern).toBe(true);
      expect(points.find((p) => p.itemId === 'item-paper')?.safetyConcern).toBe(false);
    });

    it('carries staleness and result presence onto the point', async () => {
      const repo = await harness.create();
      const points = await liveRadarPoints(repo, 40);
      expect(points.find((p) => p.itemId === 'item-retracted')?.stale).toBe(true);
      expect(points.find((p) => p.itemId === 'item-paper')).toMatchObject({
        stale: false,
        bubbleSize: 0.7,
      });
      expect(points.find((p) => p.itemId === 'item-trial')?.bubbleSize).toBe(0.4);
    });

    it('honours the radar limit', async () => {
      const repo = await harness.create();
      expect(await liveRadarPoints(repo, 2)).toHaveLength(2);
    });
  });
}
