import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase } from '../client.js';
import { contentItems, regulatoryEvents } from '../schema.js';
import {
  adverseEventReportingSnapshots,
  adverseEventTermCounts,
  dossierChangeEvents,
  interventionSafetyLinks,
  productLabelRecords,
  regulatedProductIngredients,
  regulatedProducts,
  regulatorSignalRecords,
  regulatoryAssertions,
  regulatoryStatusHistory,
  safetyItems,
} from '../intervention-schema.js';

/**
 * Seeds a migrated database with regulatory and safety fixtures. **Test support only.**
 *
 * Two jurisdictions and two authorities so the case-insensitive filters have something to
 * exclude; a product with two ingredients and one with none, and a snapshot with two term
 * counts and one with none, so the batched reads have to group correctly rather than
 * attach whatever single row they happened to find.
 */
const BASE = Date.UTC(2026, 0, 1);
const SPONTANEOUS = 'Spontaneous-report counts are not incidence, causality, or ranking.';

export type SeededRegulatoryDatabase = {
  db: ReturnType<typeof openDatabase>['db'];
  sqlite: ReturnType<typeof openDatabase>['sqlite'];
  dir: string;
};

export function seedRegulatoryFixture(): SeededRegulatoryDatabase {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-regulatory-'));
  const live = openDatabase({
    dbPath: path.join(dir, 'healthspan-dashboard.sqlite3'),
    migrateOnOpen: true,
  });
  const db = live.db;

  for (const p of [
    { id: 'prod-au', jurisdiction: 'AU', authority: 'TGA', updatedAt: BASE + 3_000 },
    { id: 'prod-us', jurisdiction: 'US', authority: 'FDA', updatedAt: BASE + 2_000 },
    { id: 'prod-au-2', jurisdiction: 'AU', authority: 'TGA', updatedAt: BASE + 1_000 },
  ]) {
    db.insert(regulatedProducts)
      .values({
        id: p.id,
        jurisdiction: p.jurisdiction,
        authority: p.authority,
        sourceNativeId: `NATIVE-${p.id}`,
        productName: `Product ${p.id}`,
        createdAt: BASE,
        updatedAt: p.updatedAt,
      })
      .run();
  }

  // prod-au has two ingredients, prod-us has one, prod-au-2 has none.
  for (const i of [
    { id: 'ing-1', product: 'prod-au', name: 'Metformin' },
    { id: 'ing-2', product: 'prod-au', name: 'Excipient' },
    { id: 'ing-3', product: 'prod-us', name: 'Rapamycin' },
  ]) {
    db.insert(regulatedProductIngredients)
      .values({
        id: i.id,
        productId: i.product,
        ingredientName: i.name,
        createdAt: BASE,
      })
      .run();
  }

  for (const a of [
    { id: 'assert-1', entity: 'ent-metformin', jurisdiction: 'AU', createdAt: BASE + 3_000 },
    { id: 'assert-2', entity: 'ent-rapamycin', jurisdiction: 'US', createdAt: BASE + 1_000 },
  ]) {
    db.insert(regulatoryAssertions)
      .values({
        id: a.id,
        productId: 'prod-au',
        entityId: a.entity,
        jurisdiction: a.jurisdiction,
        authority: a.jurisdiction === 'AU' ? 'TGA' : 'FDA',
        assertionKind: 'registration',
        normalizedStanding: 'registered',
        scopeJson: JSON.stringify({ indication: 'type 2 diabetes' }),
        createdAt: a.createdAt,
      })
      .run();
  }

  db.insert(regulatoryStatusHistory)
    .values({
      id: 'hist-1',
      productId: 'prod-au',
      fromStanding: 'pending',
      toStanding: 'registered',
      note: 'registration confirmed',
      createdAt: BASE + 2_000,
    })
    .run();

  db.insert(dossierChangeEvents)
    .values({
      id: 'dossier-evt-1',
      entityId: 'ent-metformin',
      fromSnapshotId: null,
      toSnapshotId: 'snap-1',
      changeSummary: 'Initial dossier build.',
      createdAt: BASE + 4_000,
    })
    .run();

  for (const s of [
    { id: 'safety-au', jurisdiction: 'AU', updatedAt: BASE + 2_000 },
    { id: 'safety-us', jurisdiction: 'US', updatedAt: BASE + 1_000 },
  ]) {
    db.insert(safetyItems)
      .values({
        id: s.id,
        kind: 'advisory',
        title: `Safety item ${s.id}`,
        summary: 'Synthetic advisory.',
        jurisdiction: s.jurisdiction,
        authority: s.jurisdiction === 'AU' ? 'TGA' : 'FDA',
        severityCaveat: 'Notice presence is not a treatment recommendation.',
        createdAt: BASE,
        updatedAt: s.updatedAt,
      })
      .run();
  }

  // A TGA notice, folded into the safety list from a different table.
  db.insert(contentItems)
    .values({
      id: 'notice-1',
      type: 'regulatory_event',
      dataOrigin: 'live',
      title: 'TGA safety notice',
      summary: 'Synthetic notice.',
      canonicalUrl: 'https://example.invalid/notice',
      sourcePublishedAt: BASE,
      firstSeenAt: BASE,
      lastSeenAt: BASE,
      createdAt: BASE,
      updatedAt: BASE + 5_000,
    })
    .run();
  db.insert(regulatoryEvents)
    .values({
      contentItemId: 'notice-1',
      jurisdiction: 'AU',
      authority: 'TGA',
      category: 'safety_advisory',
      officialUrl: 'https://example.invalid/official',
      publishedAt: BASE,
    })
    .run();

  for (const s of [
    { id: 'signal-1', entity: 'ent-metformin', createdAt: BASE + 2_000 },
    { id: 'signal-2', entity: 'ent-rapamycin', createdAt: BASE + 1_000 },
  ]) {
    db.insert(regulatorSignalRecords)
      .values({
        id: s.id,
        authority: 'FDA',
        jurisdiction: 'US',
        productOrClass: 'metformin',
        signalText: 'Synthetic potential signal.',
        entityId: s.entity,
        createdAt: s.createdAt,
      })
      .run();
  }

  for (const s of [
    { id: 'snap-a', entity: 'ent-metformin', createdAt: BASE + 2_000 },
    { id: 'snap-b', entity: 'ent-rapamycin', createdAt: BASE + 1_000 },
  ]) {
    db.insert(adverseEventReportingSnapshots)
      .values({
        id: s.id,
        queryDefinitionId: 'query-1',
        entityId: s.entity,
        fetchedAt: BASE,
        totalCount: 3,
        caveat: SPONTANEOUS,
        createdAt: s.createdAt,
      })
      .run();
  }

  // snap-a has two terms, snap-b has none.
  for (const t of [
    { id: 'term-1', snapshot: 'snap-a', term: 'nausea' },
    { id: 'term-2', snapshot: 'snap-a', term: 'headache' },
  ]) {
    db.insert(adverseEventTermCounts)
      .values({
        id: t.id,
        snapshotId: t.snapshot,
        term: t.term,
        count: 2,
        createdAt: BASE,
      })
      .run();
  }

  db.insert(productLabelRecords)
    .values({
      id: 'label-1',
      productId: 'prod-au',
      jurisdiction: 'AU',
      authority: 'TGA',
      sectionKind: 'indications',
      sectionText: 'Synthetic label text.',
      createdAt: BASE,
    })
    .run();

  db.insert(interventionSafetyLinks)
    .values({
      id: 'link-1',
      entityId: 'ent-metformin',
      safetyItemId: 'safety-au',
      createdAt: BASE,
    })
    .run();

  return { db, sqlite: live.sqlite, dir };
}
