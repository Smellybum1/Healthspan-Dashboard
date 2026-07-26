import { describe, expect, it } from 'vitest';
import type { InterventionReadRepository } from '@healthspan/core';
import {
  assembleDossier,
  compareInterventions,
  getDossierContext,
  getStoredDossier,
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

    it('serves a stored dossier without building one', async () => {
      // Ledger 00a712: the hosted read never calls buildDossierSnapshot.
      const repo = await harness.create();
      const dossier = await getStoredDossier(repo, 'ent-metformin');
      expect(dossier).toMatchObject({
        snapshotId: 'snap-metformin',
        snapshotOrigin: 'stored',
        reused: true,
      });
      expect(dossier?.summary).toEqual({ linkedAnalysisCount: 2, linkedClaimCount: 5 });
      expect(dossier?.entity).toMatchObject({ id: 'ent-metformin', preferredName: 'Metformin' });
    });

    it('reports an unbuilt dossier as unbuilt, not as an empty one', async () => {
      // rapamycin has no snapshot. An empty summary with no origin would read as a built
      // dossier that happens to be empty, which is a different statement.
      const repo = await harness.create();
      const dossier = await getStoredDossier(repo, 'ent-rapamycin');
      expect(dossier).toMatchObject({ snapshotId: null, snapshotOrigin: 'none', reused: false });
      expect(dossier?.summary).toEqual({});
      expect(dossier?.evidenceMap).toEqual({});
    });

    it('carries aliases, identifiers, the open-task count and the trial portfolio', async () => {
      const repo = await harness.create();
      const dossier = await getStoredDossier(repo, 'ent-metformin');
      expect(dossier?.aliases.map((a) => a.aliasText)).toEqual(['Glucophage']);
      expect(dossier?.identifiers.map((i) => i.scheme).sort()).toEqual(['rxnorm', 'unii']);
      // One open task proposes this entity; the resolved one does not count.
      expect(dossier?.openResolutionTasks).toBe(1);
      expect(dossier?.trialPortfolio.count).toBe(3);
    });

    it('returns null for an unknown entity rather than throwing', async () => {
      const repo = await harness.create();
      expect(await getStoredDossier(repo, 'nope')).toBeNull();
    });

    it('assembles the same document from a rebuilt snapshot as from a stored one', async () => {
      // The local runtime rebuilds and passes the fresh content in; the hosted runtime
      // reads the stored one. Only snapshotOrigin and reused may differ.
      const repo = await harness.create();
      const context = await getDossierContext(repo, 'ent-metformin');
      expect(context).not.toBeNull();
      const rebuilt = assembleDossier(context!, {
        snapshotId: 'snap-metformin',
        origin: 'rebuilt',
        summary: context!.storedSnapshot!.summary,
        evidenceMap: context!.storedSnapshot!.evidenceMap,
        regulatoryMatrix: context!.storedSnapshot!.regulatoryMatrix,
        safety: context!.storedSnapshot!.safety,
      });
      const stored = await getStoredDossier(repo, 'ent-metformin');
      expect({ ...rebuilt, snapshotOrigin: null, reused: null }).toEqual({
        ...stored,
        snapshotOrigin: null,
        reused: null,
      });
      expect(rebuilt.reused).toBe(false);
      expect(stored?.reused).toBe(true);
    });

    it('refuses a comparison outside two to four entities', async () => {
      const repo = await harness.create();
      expect(await compareInterventions(repo, ['ent-metformin'])).toMatchObject({
        ok: false,
        status: 400,
      });
      // Duplicates collapse before the count, so this is one entity, not two.
      expect(await compareInterventions(repo, ['ent-metformin', 'ent-metformin'])).toMatchObject({
        ok: false,
        status: 400,
      });
      const five = ['a', 'b', 'c', 'd', 'e'];
      expect(await compareInterventions(repo, five)).toMatchObject({ ok: false, status: 400 });
    });

    it('404s when an entity is unknown or not active', async () => {
      const repo = await harness.create();
      expect(await compareInterventions(repo, ['ent-metformin', 'nope'])).toMatchObject({
        ok: false,
        status: 404,
      });
      // A merged entity is not comparable either.
      expect(await compareInterventions(repo, ['ent-metformin', 'ent-merged'])).toMatchObject({
        ok: false,
        status: 404,
      });
    });

    it('compares in the order the caller asked for', async () => {
      const repo = await harness.create();
      const result = await compareInterventions(repo, ['ent-rapamycin', 'ent-metformin']);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.entities.map((e) => e.id)).toEqual(['ent-rapamycin', 'ent-metformin']);
    });

    it('counts identifiers and current assertions per entity', async () => {
      // Batched by id, so each entity must get its own counts — not the first one's.
      const repo = await harness.create();
      const result = await compareInterventions(repo, ['ent-metformin', 'ent-rapamycin']);
      if (!result.ok) throw new Error('expected a comparison');
      const cells = result.dimensions.find((d) => d.id === 'regulatory_matrix')!.cells;
      // Metformin has two identifiers and one *current* assertion; the superseded one is excluded.
      expect(cells[0]?.value).toBe('1 current scoped assertion(s) · 2 identifier(s)');
      expect(cells[1]?.value).toBe('0 current scoped assertion(s) · 1 identifier(s)');
    });

    it('reads the stored dossier snapshot rather than rebuilding one', async () => {
      // This is why comparison is not blocked behind the dossier row: it reads the
      // snapshot that exists and writes nothing.
      const repo = await harness.create();
      const result = await compareInterventions(repo, ['ent-metformin', 'ent-rapamycin']);
      if (!result.ok) throw new Error('expected a comparison');
      const evidence = result.dimensions.find((d) => d.id === 'evidence_maturity')!.cells;
      expect(evidence[0]?.value).toBe('controlled_clinical_trial:1, human_observational:1');
      expect(evidence[1]?.value).toBe('No linked analyses yet');
      const linked = result.dimensions.find((d) => d.id === 'linked_evidence')!.cells;
      expect(linked[0]?.value).toBe('2 analyses · 5 claims');
    });

    it('flags differing entity types as not directly comparable', async () => {
      const repo = await harness.create();
      const same = await compareInterventions(repo, ['ent-metformin', 'ent-rapamycin']);
      if (!same.ok) throw new Error('expected a comparison');
      expect(same.dimensions[0]?.cells.every((c) => c.comparable)).toBe(true);

      const mixed = await compareInterventions(repo, ['ent-metformin', 'ent-bpc157']);
      if (!mixed.ok) throw new Error('expected a comparison');
      expect(mixed.dimensions[0]?.cells.every((c) => c.comparable)).toBe(false);
      expect(mixed.dimensions[0]?.cells[0]?.note).toContain('Entity types differ');
    });

    it('marks peptide identity incomparable when only some are peptides', async () => {
      const repo = await harness.create();
      const mixed = await compareInterventions(repo, ['ent-metformin', 'ent-bpc157']);
      if (!mixed.ok) throw new Error('expected a comparison');
      const peptide = mixed.dimensions.find((d) => d.id === 'peptide_identity')!;
      expect(peptide.cells.every((c) => c.comparable === false)).toBe(true);
      expect(peptide.cells[0]?.note).toContain('not comparable on sequence identity');
      expect(peptide.cells[1]?.value).toContain('research_peptide');

      const neither = await compareInterventions(repo, ['ent-metformin', 'ent-rapamycin']);
      if (!neither.ok) throw new Error('expected a comparison');
      const none = neither.dimensions.find((d) => d.id === 'peptide_identity')!;
      expect(none.cells.every((c) => c.comparable)).toBe(true);
    });

    it('never ranks, and says so', async () => {
      // ADR-0009 and the M4 invariants, asserted in the response rather than assumed.
      const repo = await harness.create();
      const result = await compareInterventions(repo, ['ent-metformin', 'ent-rapamycin']);
      if (!result.ok) throw new Error('expected a comparison');
      expect(result.rules).toEqual({
        noWinner: true,
        noRecommendation: true,
        noRank: true,
        noStacking: true,
        noSpontaneousReportSafetyRanking: true,
      });
      const reports = result.dimensions.find((d) => d.id === 'spontaneous_reports')!;
      expect(reports.cells.every((c) => c.comparable === false)).toBe(true);
      expect(reports.cells[0]?.note).toContain('never used as a safety ranking');
      expect(result.caveat).toContain('side-by-side only');
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
