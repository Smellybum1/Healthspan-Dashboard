import { describe, expect, it } from 'vitest';
import type { CreatorReadRepository } from '@healthspan/core';
import {
  creatorWatchItems,
  getCreatorDetail,
  listCreatorClaims,
  listCreators,
  listRecurrenceSnapshots,
} from '@healthspan/runtime';

/**
 * Adapter-agnostic contract for {@link CreatorReadRepository}.
 *
 * Both adapters run this suite; neither has its own. It drives the shared services rather
 * than the port methods directly wherever a service exists, because the detail document is
 * assembled above the port and an adapter can only be judged by what comes out the far
 * end.
 *
 * Parity with the pre-port implementation is a separate concern, covered by
 * `creator-parity.test.ts`.
 */
export type CreatorContractHarness = {
  name: string;
  create(): Promise<CreatorReadRepository>;
};

export function runCreatorContract(harness: CreatorContractHarness) {
  describe(`CreatorReadRepository contract — ${harness.name}`, () => {
    it('lists only active creators', async () => {
      const repo = await harness.create();
      const { items, total } = await listCreators(repo);
      expect(items.map((c) => c.id)).toEqual(['creator-a', 'creator-b']);
      expect(total).toBe(2);
    });

    it('searches by preferred name, case-insensitively', async () => {
      const repo = await harness.create();
      expect((await listCreators(repo, { q: 'BRUNO' })).items.map((c) => c.id)).toEqual([
        'creator-b',
      ]);
      // A merged creator stays excluded even when the name matches.
      expect((await listCreators(repo, { q: 'cara' })).items).toEqual([]);
    });

    it('pages and reports totals against the filtered set', async () => {
      const repo = await harness.create();
      const first = await listCreators(repo, { pageSize: 1, page: 1 });
      const second = await listCreators(repo, { pageSize: 1, page: 2 });
      expect(first.items).toHaveLength(1);
      expect(second.items).toHaveLength(1);
      expect(first.items[0]?.id).not.toBe(second.items[0]?.id);
      expect(first.total).toBe(2);
      expect(first.totalPages).toBe(2);
    });

    it('clamps paging to the shared bounds', async () => {
      const repo = await harness.create();
      expect((await listCreators(repo, { pageSize: 1_000 })).pageSize).toBe(100);
      expect((await listCreators(repo, { pageSize: 0 })).pageSize).toBe(1);
      expect((await listCreators(repo, { page: -4 })).page).toBe(1);
    });

    it('lists only active claims, newest first', async () => {
      const repo = await harness.create();
      const claims = await listCreatorClaims(repo);
      expect(claims.map((c) => c.id)).toEqual(['claim-b1', 'claim-a1', 'claim-a2']);
    });

    it('applies the limit to matching claims, not to a pre-filter set', async () => {
      // The limit is a query bound, so a creator filter plus a limit of 1 returns that
      // creator's newest claim rather than possibly nothing.
      const repo = await harness.create();
      const claims = await listCreatorClaims(repo, { creatorId: 'creator-a', limit: 1 });
      expect(claims.map((c) => c.id)).toEqual(['claim-a1']);
    });

    it('parses the alignment JSON into the DTO', async () => {
      const repo = await harness.create();
      const claim = (await listCreatorClaims(repo, { creatorId: 'creator-b' }))[0];
      expect(claim?.alignment).toEqual({ dimension: 'directional' });
      expect(claim?.createdAt).toBe(new Date(Date.UTC(2026, 0, 1) + 4_000).toISOString());
    });

    it('returns null for an unknown creator rather than throwing', async () => {
      const repo = await harness.create();
      expect(await getCreatorDetail(repo, 'nope')).toBeNull();
    });

    it('assembles a creator detail from every source', async () => {
      const repo = await harness.create();
      const detail = await getCreatorDetail(repo, 'creator-a');
      expect(detail).toMatchObject({ id: 'creator-a', preferredName: 'Ada Longevity' });
      expect(detail?.accounts.map((a) => a.id).sort()).toEqual(['account-a-x', 'account-a-yt']);
      expect(detail?.claims.map((c) => c.id)).toEqual(['claim-a1', 'claim-a2']);
      expect(detail?.disclosures.map((d) => d.id)).toEqual(['disclosure-a']);
      expect(detail?.roles.map((r) => r.role)).toEqual(['researcher']);
    });

    it('omits deleted documents', async () => {
      const repo = await harness.create();
      const detail = await getCreatorDetail(repo, 'creator-a');
      expect(detail?.documents.map((d) => d.id)).toEqual(['doc-a']);
    });

    it('lists only current YouTube videos, newest first', async () => {
      const repo = await harness.create();
      const detail = await getCreatorDetail(repo, 'creator-a');
      // post-1 is not YouTube; video-old is not current.
      expect(detail?.youtubeVideos.map((v) => v.id)).toEqual(['video-1', 'video-2', 'video-3']);
    });

    it('joins current platform metadata onto each video', async () => {
      const repo = await harness.create();
      const detail = await getCreatorDetail(repo, 'creator-a');
      const [fresh, expired, missing] = detail!.youtubeVideos;
      expect(fresh).toMatchObject({
        thumbnailUrl: 'https://example.invalid/video-1.jpg',
        captionAvailable: true,
        paidPlacementDeclared: true,
        displayEligible: true,
      });
      // Expired metadata makes a video ineligible for display even though the row says so.
      expect(expired?.displayEligible).toBe(false);
      // A video with no current row survives the left join with null metadata.
      expect(missing).toMatchObject({
        id: 'video-3',
        thumbnailUrl: null,
        captionAvailable: false,
        displayEligible: false,
      });
    });

    it('marks every video as metadata-only and never as claim evidence', async () => {
      // ADR-0010. Platform metadata is operational context, never evidence.
      const repo = await harness.create();
      const detail = await getCreatorDetail(repo, 'creator-a');
      expect(detail?.youtubeVideos.every((v) => v.metadataOnly && v.claimEvidence === false)).toBe(
        true,
      );
    });

    it('states the scores it refuses to compute', async () => {
      const repo = await harness.create();
      const detail = await getCreatorDetail(repo, 'creator-a');
      expect(detail?.prohibitedScores).toContain('influence_score');
      expect(detail?.prohibitedScores).toContain('popularity_score');
      expect(detail?.recurrence.every((r) => r.notPopularity)).toBe(true);
    });

    it('groups recurrence over accepted active claims and counts distinct sources', async () => {
      const repo = await harness.create();
      const detail = await getCreatorDetail(repo, 'creator-a');
      // theme-2's only claim is inactive, so it forms no group.
      expect(detail?.recurrence.map((r) => r.recurrenceKey)).toEqual(['theme-1']);
      expect(detail?.recurrence[0]).toMatchObject({
        reviewedClaimCount: 2,
        // Two claims on two different monitored accounts. Repetition by one source is
        // not recurrence, which is why this counts sources rather than claims.
        distinctMonitoredSourceCount: 2,
        notPopularity: true,
      });
    });

    it('lists recurrence snapshots newest first', async () => {
      const repo = await harness.create();
      const snapshots = await listRecurrenceSnapshots(repo);
      expect(snapshots.map((s) => s.id)).toEqual(['snapshot-1', 'snapshot-0']);
      expect(snapshots[0]).toMatchObject({
        firstObservedScope: 'monitored_sources',
        notPopularity: true,
      });
    });

    it('builds watch items from the newest claims', async () => {
      const repo = await harness.create();
      const items = await creatorWatchItems(repo, 2);
      expect(items.map((i) => i.id)).toEqual(['claim-b1', 'claim-a1']);
      expect(items[0]).toMatchObject({
        type: 'claim',
        meta: 'Creator claim (not a person score)',
        href: '/creator-claims/claim-b1',
      });
    });
  });
}
