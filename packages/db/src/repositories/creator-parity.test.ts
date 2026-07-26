import fs from 'node:fs';
import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { computeClaimRecurrence } from '@healthspan/creators/recurrence';
import { getCreatorDetail, listCreatorClaims, listCreators } from '@healthspan/runtime';
import {
  creatorClaims,
  creatorContentItems,
  creatorDisclosures,
  creatorDocuments,
  creatorEntities,
  creatorPlatformAccounts,
  creatorRoles,
  platformContentCurrent,
} from '../creator-schema.js';
import type { HealthspanDb } from '../client.js';
import { seedCreatorFixture } from '../testing/creator-fixture.js';
import { createLocalCreatorReadRepository } from './creator.js';

/**
 * Behaviour parity between the retired creator reads and the ported ones.
 *
 * Three shapes changed, all for cost rather than correctness: whole-table loads with
 * in-memory filtering became column predicates, and the per-video lookup inside creator
 * detail — which re-selected the entire `platform_content_current` table once per video —
 * became a left join. None of those may change what comes out.
 *
 * The retired implementations are frozen below, verbatim apart from their imports. One
 * deliberate exception: they no longer call `bootstrapCreatorCatalog`, because that call
 * was removed from the read path on purpose and the fixture seeds its own creators. The
 * comparison is therefore of the read behaviour, which is what the port changed.
 *
 * Delete this file when the M7 completion report is accepted; until then it is the
 * evidence that the creator port preserved behaviour.
 */

const dirs: string[] = [];
const handles: Array<{ close(): void }> = [];

afterAll(() => {
  // Windows holds the SQLite file open until the handle is closed, so closing must
  // precede removal or cleanup fails with EPERM.
  for (const h of handles) {
    try {
      h.close();
    } catch {
      /* already closed */
    }
  }
  for (const d of dirs) {
    try {
      fs.rmSync(d, { recursive: true, force: true });
    } catch {
      /* best-effort temp cleanup */
    }
  }
});

/** The pre-port `listCreators`, minus its bootstrap call. */
function retiredListCreators(
  db: HealthspanDb,
  opts?: { page?: number; pageSize?: number; q?: string },
) {
  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts?.pageSize ?? 25));
  let rows = db
    .select()
    .from(creatorEntities)
    .all()
    .filter((c) => c.lifecycleState === 'active');
  if (opts?.q) {
    const q = opts.q.toLowerCase();
    rows = rows.filter((c) => c.preferredName.toLowerCase().includes(q));
  }
  const total = rows.length;
  const items = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize).map((c) => ({
    id: c.id,
    preferredName: c.preferredName,
    creatorKind: c.creatorKind,
    identityConfidence: c.identityConfidence,
    neutralDescription: c.neutralDescription,
  }));
  return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** The pre-port `listCreatorClaims`, minus its bootstrap call. */
function retiredListCreatorClaims(db: HealthspanDb, opts?: { creatorId?: string; limit?: number }) {
  const limit = Math.min(200, Math.max(1, opts?.limit ?? 50));
  let rows = db
    .select()
    .from(creatorClaims)
    .orderBy(eq(creatorClaims.id, creatorClaims.id))
    .all()
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((r) => r.active && (!opts?.creatorId || r.creatorId === opts.creatorId));
  rows = rows.slice(0, limit);
  return rows.map((r) => ({
    id: r.id,
    creatorId: r.creatorId,
    claimText: r.claimText,
    assertionRole: r.assertionRole,
    claimKind: r.claimKind,
    direction: r.direction,
    certaintyLanguage: r.certaintyLanguage,
    confidence: r.confidence,
    reviewStatus: r.reviewStatus ?? 'unreviewed',
    recurrenceKey: r.recurrenceKey,
    alignment: JSON.parse(r.alignmentJson) as Record<string, unknown>,
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}

function retiredRecurrence(db: HealthspanDb, creatorId: string) {
  const claims = db
    .select()
    .from(creatorClaims)
    .all()
    .filter((c) => c.creatorId === creatorId);
  return computeClaimRecurrence(
    claims.map((c) => ({
      id: c.id,
      recurrenceKey: c.recurrenceKey,
      claimText: c.claimText,
      reviewStatus: c.reviewStatus ?? 'unreviewed',
      active: Boolean(c.active),
      lifecycleState: c.lifecycleState,
      sourceKey: c.accountId ?? c.contentItemId ?? c.documentId ?? null,
      firstObservedAt: c.createdAt,
      sourceUnavailable:
        c.lifecycleState === 'source_unavailable' || c.reviewStatus === 'source_unavailable',
    })),
  );
}

/** The pre-port `getCreatorDetail`, including its per-video table scan. */
function retiredGetCreatorDetail(db: HealthspanDb, id: string) {
  const creator = db.select().from(creatorEntities).where(eq(creatorEntities.id, id)).all()[0];
  if (!creator) return null;
  const accounts = db
    .select()
    .from(creatorPlatformAccounts)
    .all()
    .filter((a) => a.creatorId === id);
  const claims = retiredListCreatorClaims(db, { creatorId: id, limit: 100 });
  const disclosures = db
    .select()
    .from(creatorDisclosures)
    .all()
    .filter((d) => d.creatorId === id);
  const documents = db
    .select()
    .from(creatorDocuments)
    .all()
    .filter((d) => d.creatorId === id && d.lifecycleState !== 'deleted')
    .map((d) => ({
      id: d.id,
      filename: d.filename,
      documentKind: d.documentKind,
      rightsBasis: d.rightsBasis,
      claimEligible: Boolean(d.claimEligible),
      lifecycleState: d.lifecycleState,
      createdAt: new Date(d.createdAt).toISOString(),
    }));
  const now = Date.now();
  const youtubeVideos = db
    .select()
    .from(creatorContentItems)
    .all()
    .filter((c) => c.creatorId === id && c.platform === 'youtube' && c.currentState === 'current')
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
    .slice(0, 40)
    .map((item) => {
      // The N+1: one full scan of platform_content_current per video.
      const current = db
        .select()
        .from(platformContentCurrent)
        .all()
        .find((r) => r.contentItemId === item.id);
      const expired = current?.expiryAt != null && current.expiryAt < now;
      return {
        id: item.id,
        videoId: item.externalId,
        title: item.title,
        publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString() : null,
        canonicalUrl: item.canonicalUrl,
        thumbnailUrl: current?.thumbnailUrl ?? null,
        captionAvailable: Boolean(current?.captionAvailable),
        paidPlacementDeclared: Boolean(current?.paidPlacementDeclared),
        displayEligible: Boolean(current?.displayEligible) && !expired,
        claimEvidence: false as const,
        metadataOnly: true as const,
        note: 'YouTube API metadata is operational context only — not claim evidence',
      };
    });
  const recurrence = retiredRecurrence(db, id).map((g) => ({
    recurrenceKey: g.recurrenceKey,
    reviewedClaimCount: g.reviewedClaimCount,
    distinctMonitoredSourceCount: g.distinctMonitoredSourceCount,
    formulaVersion: g.formulaVersion,
    firstObservedAt: g.firstObservedAt ? new Date(g.firstObservedAt).toISOString() : null,
    firstObservedScope: g.firstObservedScope,
    notPopularity: true as const,
  }));

  return {
    id: creator.id,
    preferredName: creator.preferredName,
    creatorKind: creator.creatorKind,
    identityConfidence: creator.identityConfidence,
    identityRevision: creator.identityRevision,
    currentProfileSnapshotId: creator.currentProfileSnapshotId,
    neutralDescription: creator.neutralDescription,
    lifecycleState: creator.lifecycleState,
    accounts,
    claims,
    disclosures: disclosures.map((d) => ({
      id: d.id,
      disclosureText: d.disclosureText,
      source: d.source,
      createdAt: new Date(d.createdAt).toISOString(),
    })),
    documents,
    youtubeVideos,
    roles: db
      .select()
      .from(creatorRoles)
      .all()
      .filter((r) => r.creatorId === id)
      .map((r) => ({
        id: r.id,
        role: r.role,
        provenanceState: r.provenanceState,
        reviewState: r.reviewState,
        createdAt: new Date(r.createdAt).toISOString(),
      })),
    recurrence,
    prohibitedScores: [
      'trust_score',
      'credibility_score',
      'misinformation_rank',
      'influence_score',
      'attention_score',
      'engagement_score',
      'popularity_score',
    ],
  };
}

const LIST_QUERIES: Array<[string, { page?: number; pageSize?: number; q?: string }]> = [
  ['no filters', {}],
  ['search by name', { q: 'ada' }],
  ['search is case-insensitive', { q: 'ADA' }],
  ['search matches a merged creator', { q: 'cara' }],
  ['search matches nothing', { q: 'zzzz' }],
  ['page 1 of 2', { pageSize: 1, page: 1 }],
  ['page 2 of 2', { pageSize: 1, page: 2 }],
  ['page past the end', { page: 99 }],
  ['page size clamped high', { pageSize: 1_000 }],
  ['page size clamped low', { pageSize: 0 }],
  ['negative page clamped', { page: -2 }],
];

const CLAIM_QUERIES: Array<[string, { creatorId?: string; limit?: number }]> = [
  ['all claims', {}],
  ['scoped to a creator', { creatorId: 'creator-a' }],
  ['scoped to a creator with no claims', { creatorId: 'creator-c' }],
  ['limit clamped high', { limit: 1_000 }],
  ['limit clamped low', { limit: 0 }],
];

describe('creator port — parity with the retired implementation', () => {
  const seeded = seedCreatorFixture();
  dirs.push(seeded.dir);
  handles.push(seeded.sqlite);
  const repo = createLocalCreatorReadRepository(seeded.db);

  it.each(LIST_QUERIES)('listCreators produces identical output: %s', async (_name, query) => {
    expect(await listCreators(repo, query)).toEqual(retiredListCreators(seeded.db, query));
  });

  it.each(CLAIM_QUERIES)(
    'listCreatorClaims produces identical output: %s',
    async (_name, query) => {
      expect(await listCreatorClaims(repo, query)).toEqual(
        retiredListCreatorClaims(seeded.db, query),
      );
    },
  );

  it.each(['creator-a', 'creator-b', 'creator-c', 'nope'])(
    'getCreatorDetail produces identical output for %s',
    async (id) => {
      expect(await getCreatorDetail(repo, id)).toEqual(retiredGetCreatorDetail(seeded.db, id));
    },
  );

  it('replaces the per-video table scan with a single joined query', async () => {
    // Creator detail issues one statement per source rather than one per video. With
    // three videos the retired version cost three extra full scans; at the forty-video
    // cap it cost forty, which on D1 is forty network round trips.
    let statements = 0;
    const counting = new Proxy(seeded.db, {
      get(target, prop, receiver) {
        if (prop === 'select') statements += 1;
        return Reflect.get(target, prop, receiver) as unknown;
      },
    }) as HealthspanDb;

    await getCreatorDetail(createLocalCreatorReadRepository(counting), 'creator-a');
    const ported = statements;

    statements = 0;
    retiredGetCreatorDetail(counting, 'creator-a');
    const retired = statements;

    expect(retired - ported).toBe(3); // exactly the three videos' lookups
    expect(ported).toBeLessThan(retired);
  });
});
