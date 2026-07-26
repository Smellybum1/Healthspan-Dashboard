import { describe, expect, it } from 'vitest';
import type { RegulatoryReadRepository } from '@healthspan/core';
import {
  listRegulatoryAssertions,
  listRegulatoryHistory,
  listRegulatoryProducts,
  listReportingPatterns,
  listSafetyItems,
  listSafetySignals,
  regulatoryWorkspaceSummary,
} from '@healthspan/runtime';

/** Adapter-agnostic contract for {@link RegulatoryReadRepository}. Both adapters run it. */
export type RegulatoryContractHarness = {
  name: string;
  create(): Promise<RegulatoryReadRepository>;
};

export function runRegulatoryContract(harness: RegulatoryContractHarness) {
  describe(`RegulatoryReadRepository contract — ${harness.name}`, () => {
    it('lists products newest-updated first', async () => {
      const repo = await harness.create();
      const { items, total } = await listRegulatoryProducts(repo, {});
      expect(items.map((p) => p.id)).toEqual(['prod-au', 'prod-us', 'prod-au-2']);
      expect(total).toBe(3);
    });

    it('filters products by jurisdiction and authority, case-insensitively', async () => {
      const repo = await harness.create();
      expect((await listRegulatoryProducts(repo, { jurisdiction: 'au' })).total).toBe(2);
      expect((await listRegulatoryProducts(repo, { authority: 'fda' })).total).toBe(1);
      expect((await listRegulatoryProducts(repo, { jurisdiction: 'ZZ' })).total).toBe(0);
    });

    it('attaches each product its own ingredients, in one batched read', async () => {
      // The batched query is only correct if it groups. Asserting the first product alone
      // would pass against a query that fetched one product's ingredients.
      const repo = await harness.create();
      const { items } = await listRegulatoryProducts(repo, {});
      const byId = new Map(items.map((p) => [p.id, p]));
      expect(byId.get('prod-au')?.ingredients).toHaveLength(2);
      expect(byId.get('prod-us')?.ingredients).toHaveLength(1);
      // A product with no ingredients gets an empty list, not a missing key.
      expect(byId.get('prod-au-2')?.ingredients).toEqual([]);
    });

    it('carries the miss-is-not-unapproved flag on every product', async () => {
      const repo = await harness.create();
      const { items } = await listRegulatoryProducts(repo, {});
      expect(items.every((p) => p.missDoesNotMeanUnapproved === true)).toBe(true);
    });

    it('paginates with the shared bounds', async () => {
      const repo = await harness.create();
      const page = await listRegulatoryProducts(repo, { limit: '1', offset: '1' });
      expect(page.items.map((p) => p.id)).toEqual(['prod-us']);
      expect(page).toMatchObject({ limit: 1, offset: 1, total: 3 });
      // Clamped: over the max, under the min, and a non-numeric offset.
      expect((await listRegulatoryProducts(repo, { limit: '9999' })).limit).toBe(200);
      expect((await listRegulatoryProducts(repo, { limit: '0' })).limit).toBe(50);
      expect((await listRegulatoryProducts(repo, { offset: 'abc' })).offset).toBe(0);
    });

    it('lists assertions with parsed scope and both authorisation caveats', async () => {
      const repo = await harness.create();
      const { items } = await listRegulatoryAssertions(repo, {});
      expect(items.map((a) => a.id)).toEqual(['assert-1', 'assert-2']);
      expect(items[0]?.scope).toEqual({ indication: 'type 2 diabetes' });
      expect(items[0]?.trialPresenceDoesNotAuthorize).toBe(true);
      expect(items[0]?.labelPresenceDoesNotApprove).toBe(true);
    });

    it('filters assertions by entity and jurisdiction', async () => {
      const repo = await harness.create();
      expect((await listRegulatoryAssertions(repo, { entityId: 'ent-rapamycin' })).total).toBe(1);
      expect((await listRegulatoryAssertions(repo, { jurisdiction: 'au' })).total).toBe(1);
    });

    it('merges history, assertions, and dossier events into one timeline', async () => {
      const repo = await harness.create();
      const { items, total } = await listRegulatoryHistory(repo, {});
      expect(total).toBe(4);
      // Newest first, across all three sources.
      expect(items.map((i) => i.kind)).toEqual([
        'dossier_change',
        'assertion',
        'status_history',
        'assertion',
      ]);
    });

    it('scopes the timeline by entity across the sources that carry one', async () => {
      const repo = await harness.create();
      const { items } = await listRegulatoryHistory(repo, { entityId: 'ent-metformin' });
      // Status history has no entity, so it stays; the other two are filtered.
      expect(items.map((i) => i.id).sort()).toEqual(['assert-1', 'dossier-evt-1', 'hist-1']);
    });

    it('folds TGA notices into the safety list', async () => {
      const repo = await harness.create();
      const { items, total } = await listSafetyItems(repo, {});
      expect(total).toBe(3);
      const notice = items.find((i) => i.source === 'regulatory_events');
      expect(notice).toMatchObject({
        id: 'notice-1',
        kind: 'tga_rss_notice',
        jurisdiction: 'AU',
        authority: 'TGA',
        officialUrl: 'https://example.invalid/official',
        severityCaveat: expect.stringContaining('not a dosing or treatment recommendation'),
      });
    });

    it('filters the merged safety list by jurisdiction', async () => {
      const repo = await harness.create();
      // The curated AU item plus the AU notice; the US item is excluded.
      const au = await listSafetyItems(repo, { jurisdiction: 'au' });
      expect(au.items.map((i) => i.id).sort()).toEqual(['notice-1', 'safety-au']);
      // A US filter keeps the curated US item and drops the AU notice.
      const us = await listSafetyItems(repo, { jurisdiction: 'us' });
      expect(us.items.map((i) => i.id)).toEqual(['safety-us']);
    });

    it('lists signals with the causality caveat and the ranking prohibition', async () => {
      const repo = await harness.create();
      const result = await listSafetySignals(repo, {});
      expect(result.items.map((s) => s.id)).toEqual(['signal-1', 'signal-2']);
      expect(result.rankingProhibited).toBe(true);
      expect(result.items[0]?.provenCausality).toBe(false);
      expect(result.items[0]?.caveat).toContain('not proven causality');
      expect((await listSafetySignals(repo, { entityId: 'ent-rapamycin' })).total).toBe(1);
    });

    it('attaches each snapshot its own term counts, in one batched read', async () => {
      const repo = await harness.create();
      const { items } = await listReportingPatterns(repo, {});
      const byId = new Map(items.map((s) => [s.id, s]));
      expect(byId.get('snap-a')?.terms).toHaveLength(2);
      // A snapshot with no terms gets an empty list.
      expect(byId.get('snap-b')?.terms).toEqual([]);
    });

    it('carries every spontaneous-report caveat on each pattern', async () => {
      const repo = await harness.create();
      const { items } = await listReportingPatterns(repo, {});
      expect(items[0]).toMatchObject({
        zeroIsNotSafe: true,
        notIncidence: true,
        notCausality: true,
      });
      expect(String(items[0]?.caveat)).toContain('not incidence');
    });

    it('summarises the workspace as counts, with its caveats', async () => {
      const repo = await harness.create();
      const summary = await regulatoryWorkspaceSummary(repo);
      expect(summary).toMatchObject({
        productCount: 3,
        assertionCount: 2,
        signalCount: 2,
        labelCount: 1,
        reportingPatternCount: 2,
        safetyLinkCount: 1,
      });
      expect(summary.caveats).toContain('Trial ≠ authorization');
      expect(summary.caveats).toContain('AEMS/report count ≠ causality or incidence');
    });
  });
}
