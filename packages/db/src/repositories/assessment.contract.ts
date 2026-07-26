import { describe, expect, it } from 'vitest';
import type { ClaimAssessmentRepository } from '@healthspan/core';
import { getAssessment, listAssessments } from '@healthspan/runtime';

/**
 * Adapter-agnostic contract for {@link ClaimAssessmentRepository}.
 *
 * Both adapters run this suite; neither has its own. It exercises the shared service
 * above the port, because the split between what the adapter filters and what the
 * service filters is the thing most likely to go wrong here — an adapter that quietly
 * dropped a predicate would still return plausible rows.
 *
 * Parity with the *pre-port* implementation is a separate concern, covered by
 * `assessment-parity.test.ts`.
 */
export type AssessmentContractHarness = {
  name: string;
  create(): Promise<ClaimAssessmentRepository>;
};

export function runAssessmentContract(harness: AssessmentContractHarness) {
  describe(`ClaimAssessmentRepository contract — ${harness.name}`, () => {
    it('returns only current, non-superseded analyses with an existing item', async () => {
      const repo = await harness.create();
      const { items, total } = await listAssessments(repo, {});
      expect(total).toBe(4);
      expect(items.map((i) => i.contentItemId).sort()).toEqual([
        'item-mouse',
        'item-rct',
        'item-retracted-signal',
        'item-retracted-status',
      ]);
    });

    it('orders by analysis creation, newest first', async () => {
      const repo = await harness.create();
      const { items } = await listAssessments(repo, {});
      expect(items.map((i) => i.analysisId)).toEqual([
        'analysis-rct',
        'analysis-mouse',
        'analysis-signal',
        'analysis-status',
      ]);
    });

    it.each([
      ['evidenceMaturity', { evidenceMaturity: 'preclinical' }, ['analysis-mouse']],
      ['evidenceAvailability', { evidenceAvailability: 'abstract_only' }, ['analysis-mouse']],
      ['studyDesign', { studyDesign: 'rct' }, ['analysis-rct', 'analysis-status']],
      ['organism', { organism: 'mouse' }, ['analysis-mouse']],
    ] as const)('pushes the %s filter into the query', async (_name, query, expected) => {
      const repo = await harness.create();
      const { items } = await listAssessments(repo, query);
      expect(items.map((i) => i.analysisId)).toEqual(expected);
    });

    it('searches title and summary case-insensitively', async () => {
      const repo = await harness.create();
      expect(
        (await listAssessments(repo, { q: 'METFORMIN' })).items.map((i) => i.analysisId),
      ).toEqual(['analysis-rct']);
      // Matches a summary rather than a title.
      expect(
        (await listAssessments(repo, { q: 'correction notice' })).items.map((i) => i.analysisId),
      ).toEqual(['analysis-signal']);
      // A null summary must not break the search.
      expect((await listAssessments(repo, { q: 'rapamycin' })).items).toHaveLength(1);
    });

    it('derives retraction from a signal code and from the analysis status', async () => {
      const repo = await harness.create();
      const { items } = await listAssessments(repo, { retractionOrCorrection: 'true' });
      expect(items.map((i) => i.analysisId).sort()).toEqual(['analysis-signal', 'analysis-status']);
      const excluded = await listAssessments(repo, { retractionOrCorrection: 'false' });
      expect(excluded.items.map((i) => i.analysisId).sort()).toEqual([
        'analysis-mouse',
        'analysis-rct',
      ]);
    });

    it('counts what survives every filter, including the retraction one', async () => {
      const repo = await harness.create();
      const result = await listAssessments(repo, {
        retractionOrCorrection: 'true',
        pageSize: 1,
      });
      // Two match; the page holds one; the total reports both.
      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(1);
      expect(result.totalPages).toBe(2);
    });

    it('reports staleness from the intelligence state', async () => {
      const repo = await harness.create();
      const { items } = await listAssessments(repo, { organism: 'mouse' });
      expect(items[0]?.stale).toBe(true);
      const fresh = await listAssessments(repo, { studyDesign: 'rct' });
      expect(fresh.items.every((i) => i.stale === false)).toBe(true);
    });

    it('degrades a malformed JSON column to an empty list', async () => {
      const repo = await harness.create();
      const { items } = await listAssessments(repo, { organism: 'mouse' });
      expect(items[0]?.potentialHallmarks).toEqual([]);
      expect(items[0]?.methodologicalSignals).toEqual([]);
    });

    it('clamps paging to the shared bounds', async () => {
      const repo = await harness.create();
      expect((await listAssessments(repo, { pageSize: 1_000 })).pageSize).toBe(100);
      expect((await listAssessments(repo, { pageSize: 0 })).pageSize).toBe(1);
      expect((await listAssessments(repo, { page: -5 })).page).toBe(1);
      expect((await listAssessments(repo, { page: 99 })).items).toEqual([]);
    });

    it('returns a detail with its item and full analysis history', async () => {
      const repo = await harness.create();
      const detail = await getAssessment(repo, 'analysis-rct');
      expect(detail?.analysis).toMatchObject({
        id: 'analysis-rct',
        contentItemId: 'item-rct',
        evidenceMaturity: 'clinical',
        supersededAt: null,
      });
      expect(detail?.item).toEqual({
        id: 'item-rct',
        title: 'Metformin randomised trial',
        type: 'paper',
      });
      // History includes the superseded analysis, newest first.
      expect(detail?.history.map((h) => h.analysisId)).toEqual([
        'analysis-rct',
        'analysis-rct-old',
      ]);
      expect(detail?.history[1]?.supersededAt).not.toBeNull();
    });

    it('returns a superseded analysis by id, with its supersession timestamp', async () => {
      // The list excludes it; asking for it directly must still work.
      const repo = await harness.create();
      const detail = await getAssessment(repo, 'analysis-superseded');
      expect(detail?.analysis.supersededAt).toBeTypeOf('string');
    });

    it('returns null for an unknown analysis rather than throwing', async () => {
      const repo = await harness.create();
      expect(await getAssessment(repo, 'nope')).toBeNull();
    });

    it('reports a null item when the analysis outlived its content item', async () => {
      const repo = await harness.create();
      const detail = await getAssessment(repo, 'analysis-orphan');
      expect(detail).not.toBeNull();
      expect(detail?.item).toBeNull();
    });
  });
}
