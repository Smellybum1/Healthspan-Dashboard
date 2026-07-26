import { describe, expect, it } from 'vitest';
import type { InterventionReadRepository } from '@healthspan/core';
import {
  listEntityResolutionTasks,
  listInterventionEntities,
  trialPortfolioForEntity,
} from '@healthspan/runtime';

/** Adapter-agnostic contract for {@link InterventionReadRepository}. Both adapters run it. */
export type InterventionContractHarness = {
  name: string;
  create(): Promise<InterventionReadRepository>;
};

export function runInterventionContract(harness: InterventionContractHarness) {
  describe(`InterventionReadRepository contract — ${harness.name}`, () => {
    it('lists only active entities', async () => {
      const repo = await harness.create();
      const { items, total } = await listInterventionEntities(repo);
      expect(items.map((e) => e.id).sort()).toEqual([
        'ent-bpc157',
        'ent-metformin',
        'ent-rapamycin',
      ]);
      expect(total).toBe(3);
    });

    it('treats "intervention" as not-a-peptide rather than a column value', async () => {
      // The one place the type filter is genuinely not a simple equality.
      const repo = await harness.create();
      const interventions = await listInterventionEntities(repo, { entityType: 'intervention' });
      expect(interventions.items.map((e) => e.id).sort()).toEqual([
        'ent-metformin',
        'ent-rapamycin',
      ]);
      const peptides = await listInterventionEntities(repo, { entityType: 'peptide' });
      expect(peptides.items.map((e) => e.id)).toEqual(['ent-bpc157']);
    });

    it('treats "all" and an absent filter as no filter', async () => {
      const repo = await harness.create();
      expect((await listInterventionEntities(repo, { entityType: 'all' })).total).toBe(3);
      expect((await listInterventionEntities(repo, {})).total).toBe(3);
    });

    it('matches any other filter value exactly', async () => {
      const repo = await harness.create();
      const exact = await listInterventionEntities(repo, { entityType: 'small_molecule' });
      expect(exact.items.map((e) => e.id).sort()).toEqual(['ent-metformin', 'ent-rapamycin']);
      expect((await listInterventionEntities(repo, { entityType: 'nonexistent' })).total).toBe(0);
    });

    it('searches preferred name case-insensitively, still excluding merged entities', async () => {
      const repo = await harness.create();
      expect(
        (await listInterventionEntities(repo, { q: 'METFORMIN' })).items.map((e) => e.id),
      ).toEqual(['ent-metformin']);
      expect((await listInterventionEntities(repo, { q: 'zzzz' })).items).toEqual([]);
    });

    it('pages and counts the filtered set', async () => {
      const repo = await harness.create();
      const first = await listInterventionEntities(repo, { pageSize: 2, page: 1 });
      const second = await listInterventionEntities(repo, { pageSize: 2, page: 2 });
      expect(first.items).toHaveLength(2);
      expect(second.items).toHaveLength(1);
      expect(first.total).toBe(3);
      expect(first.totalPages).toBe(2);
    });

    it('clamps paging to the shared bounds', async () => {
      const repo = await harness.create();
      expect((await listInterventionEntities(repo, { pageSize: 1_000 })).pageSize).toBe(100);
      expect((await listInterventionEntities(repo, { pageSize: 0 })).pageSize).toBe(1);
      expect((await listInterventionEntities(repo, { page: -3 })).page).toBe(1);
      expect((await listInterventionEntities(repo, { page: 99 })).items).toEqual([]);
    });

    it('lists entity resolution tasks newest first, resolved ones included', async () => {
      // The retired query did not filter by status, and neither does this.
      const repo = await harness.create();
      const tasks = await listEntityResolutionTasks(repo);
      expect(tasks.map((t) => t.id)).toEqual(['task-new', 'task-old']);
      expect(tasks[0]).toMatchObject({
        title: 'Task task-new',
        reason: 'ambiguous mention',
        status: 'open',
        proposedEntityId: 'ent-metformin',
      });
    });

    it('bounds the resolution task query', async () => {
      const repo = await harness.create();
      expect(await listEntityResolutionTasks(repo, 1)).toHaveLength(1);
      expect(await listEntityResolutionTasks(repo, 0)).toHaveLength(1);
    });

    it('builds a trial portfolio from current links only', async () => {
      const repo = await harness.create();
      const portfolio = await trialPortfolioForEntity(repo, 'ent-metformin');
      // link-old is superseded.
      expect(portfolio.count).toBe(3);
      expect(portfolio.items.map((i) => i.sourceTerm).sort()).toEqual([
        'Metformin',
        'metformin hydrochloride',
        'orphan term',
      ]);
    });

    it('joins the trial onto each link, and keeps a link whose trial is absent', async () => {
      const repo = await harness.create();
      const { items } = await trialPortfolioForEntity(repo, 'ent-metformin');
      const joined = items.find((i) => i.sourceTerm === 'metformin hydrochloride');
      expect(joined).toMatchObject({ nctId: 'NCT00000001', overallStatus: 'Recruiting' });
      // An inner join would drop this one entirely.
      const orphan = items.find((i) => i.sourceTerm === 'orphan term');
      expect(orphan).toMatchObject({ trialId: 'trial-gone', nctId: null, overallStatus: null });
    });

    it('carries the registration-is-not-authorisation caveat on every response', async () => {
      // M4 invariant, ADR-0009: the caveat travels with the data, not with the UI.
      const repo = await harness.create();
      const portfolio = await trialPortfolioForEntity(repo, 'ent-metformin');
      expect(portfolio.caveat).toContain('Registry presence ≠ approval or efficacy');
      expect(portfolio.items.every((i) => i.note.includes('not regulatory authorisation'))).toBe(
        true,
      );
    });

    it('returns an empty portfolio for an entity with no links', async () => {
      const repo = await harness.create();
      const portfolio = await trialPortfolioForEntity(repo, 'ent-rapamycin');
      expect(portfolio).toMatchObject({ count: 0, items: [] });
      // The caveat is still present on an empty portfolio.
      expect(portfolio.caveat.length).toBeGreaterThan(0);
    });
  });
}
