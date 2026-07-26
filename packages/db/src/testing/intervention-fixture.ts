import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase } from '../client.js';
import { contentItems, trials } from '../schema.js';
import { eq } from 'drizzle-orm';
import {
  dossierSnapshots,
  entityResolutionTasks,
  interventionAliases,
  interventionEntities,
  interventionIdentifiers,
  peptideProfiles,
  regulatoryAssertions,
  trialInterventionEntityLinks,
} from '../intervention-schema.js';

/**
 * Seeds a migrated database with intervention fixtures. **Test support only.**
 *
 * Built to hit the branches the retired reads had: a merged entity that must not be
 * listed, both peptide and non-peptide types (the `intervention` filter means *not*
 * peptide, not a column value), a superseded trial link that must be excluded, and a link
 * pointing at a trial row that does not exist — the retired per-link lookup returned
 * `undefined` and still produced an entry with nulls, so the join must be a left one.
 */
const BASE = Date.UTC(2026, 0, 1);

export type SeededInterventionDatabase = {
  db: ReturnType<typeof openDatabase>['db'];
  sqlite: ReturnType<typeof openDatabase>['sqlite'];
  dir: string;
};

export function seedInterventionFixture(): SeededInterventionDatabase {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-intervention-'));
  const live = openDatabase({
    dbPath: path.join(dir, 'healthspan-dashboard.sqlite3'),
    migrateOnOpen: true,
  });
  const db = live.db;

  const entities = [
    { id: 'ent-metformin', name: 'Metformin', type: 'small_molecule', state: 'active' },
    { id: 'ent-rapamycin', name: 'Rapamycin', type: 'small_molecule', state: 'active' },
    { id: 'ent-bpc157', name: 'BPC-157', type: 'peptide', state: 'active' },
    // Merged away: must never be listed.
    { id: 'ent-merged', name: 'Metformin duplicate', type: 'small_molecule', state: 'merged' },
  ];
  for (const e of entities) {
    db.insert(interventionEntities)
      .values({
        id: e.id,
        preferredName: e.name,
        normalizedPreferredName: e.name.toLowerCase(),
        entityType: e.type,
        lifecycleState: e.state,
        identityConfidence: 'medium',
        shortDescription: `Synthetic profile for ${e.name}.`,
        currentDossierSnapshotId: null,
        dataOrigin: 'live',
        createdAt: BASE,
        updatedAt: BASE,
      })
      .run();
  }

  for (const t of [
    { id: 'trial-a', nct: 'NCT00000001', status: 'Recruiting' },
    { id: 'trial-b', nct: 'NCT00000002', status: 'Completed' },
  ]) {
    db.insert(contentItems)
      .values({
        id: t.id,
        type: 'trial',
        dataOrigin: 'live',
        title: `Trial ${t.nct}`,
        summary: null,
        firstSeenAt: BASE,
        lastSeenAt: BASE,
        createdAt: BASE,
        updatedAt: BASE,
      })
      .run();
    db.insert(trials)
      .values({
        contentItemId: t.id,
        nctId: t.nct,
        overallStatus: t.status,
      })
      .run();
  }

  const links = [
    { id: 'link-a', trial: 'trial-a', term: 'metformin hydrochloride', superseded: null },
    { id: 'link-b', trial: 'trial-b', term: 'Metformin', superseded: null },
    // Superseded: excluded from the portfolio.
    { id: 'link-old', trial: 'trial-a', term: 'old term', superseded: BASE + 1_000 },
    // Points at a trial row that does not exist: must survive the left join with nulls.
    { id: 'link-missing', trial: 'trial-gone', term: 'orphan term', superseded: null },
  ];
  for (const l of links) {
    db.insert(trialInterventionEntityLinks)
      .values({
        id: l.id,
        trialInterventionId: `ti-${l.id}`,
        trialId: l.trial,
        entityId: 'ent-metformin',
        sourceTerm: l.term,
        mappingState: 'accepted',
        ruleOrDecisionId: 'rule-1',
        effectiveAt: BASE,
        supersededAt: l.superseded,
      })
      .run();
  }

  for (const t of [
    { id: 'task-new', createdAt: BASE + 3_000, status: 'open' },
    { id: 'task-old', createdAt: BASE + 1_000, status: 'resolved' },
  ]) {
    db.insert(entityResolutionTasks)
      .values({
        id: t.id,
        mentionId: 'mention-1',
        title: `Task ${t.id}`,
        reason: 'ambiguous mention',
        priority: 'medium',
        status: t.status,
        proposedEntityId: 'ent-metformin',
        createdAt: t.createdAt,
      })
      .run();
  }

  // Comparison inputs: a peptide profile on one entity only, identifiers and assertions
  // in different quantities, and a stored dossier snapshot on one entity.
  db.insert(peptideProfiles)
    .values({
      id: 'peptide-bpc157',
      entityId: 'ent-bpc157',
      classification: 'research_peptide',
      sequenceState: 'no_sequence',
      warningState: 'sequence_unverified',
      updatedAt: BASE,
    })
    .run();

  for (const i of [
    { id: 'ident-1', entity: 'ent-metformin', scheme: 'rxnorm', value: '6809' },
    { id: 'ident-2', entity: 'ent-metformin', scheme: 'unii', value: '9100L32L2N' },
    { id: 'ident-3', entity: 'ent-rapamycin', scheme: 'rxnorm', value: '35302' },
  ]) {
    db.insert(interventionIdentifiers)
      .values({
        id: i.id,
        entityId: i.entity,
        scheme: i.scheme,
        value: i.value,
        normalizedValue: i.value.toLowerCase(),
        createdAt: BASE,
      })
      .run();
  }

  for (const a of [
    { id: 'cmp-assert-1', entity: 'ent-metformin', state: 'current' },
    // Superseded: excluded by the current-only predicate.
    { id: 'cmp-assert-2', entity: 'ent-metformin', state: 'superseded' },
  ]) {
    db.insert(regulatoryAssertions)
      .values({
        id: a.id,
        entityId: a.entity,
        jurisdiction: 'AU',
        authority: 'TGA',
        assertionKind: 'registration',
        normalizedStanding: 'registered',
        currentState: a.state,
        createdAt: BASE,
      })
      .run();
  }

  db.insert(interventionAliases)
    .values({
      id: 'alias-1',
      entityId: 'ent-metformin',
      aliasText: 'Glucophage',
      normalizedAlias: 'glucophage',
      aliasType: 'brand',
      createdAt: BASE,
    })
    .run();

  db.insert(dossierSnapshots)
    .values({
      id: 'snap-metformin',
      entityId: 'ent-metformin',
      rulesetVersion: 'm4.1',
      inputHash: 'hash-1',
      summaryJson: JSON.stringify({ linkedAnalysisCount: 2, linkedClaimCount: 5 }),
      evidenceMapJson: JSON.stringify({
        analyses: [
          { evidenceMaturity: 'controlled_clinical_trial' },
          { evidenceMaturity: 'human_observational' },
        ],
      }),
      createdAt: BASE,
    })
    .run();
  db.update(interventionEntities)
    .set({ currentDossierSnapshotId: 'snap-metformin' })
    .where(eq(interventionEntities.id, 'ent-metformin'))
    .run();

  return { db, sqlite: live.sqlite, dir };
}
