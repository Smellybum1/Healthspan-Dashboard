import fs from 'node:fs';
import { desc, eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import {
  getLiveClaim,
  intelligenceStatus,
  listLiveClaims,
  liveRadarPoints,
} from '@healthspan/runtime';
import { contentItems, papers } from '../schema.js';
import {
  claimRelationships,
  claimSourceSpans,
  contentIntelligenceState,
  intelligenceAnalyses,
  intelligenceRuns,
  liveClaims,
  liveReviewTasks,
} from '../intelligence-schema.js';
import type { HealthspanDb } from '../client.js';
import { seedIntelligenceFixture } from '../testing/intelligence-fixture.js';
import { createLocalClaimAssessmentRepository } from './assessment.js';

/**
 * Behaviour parity between the retired intelligence reads and the ported ones.
 *
 * Four shapes changed, all for cost:
 *
 * - `intelligenceStatus` loaded two whole tables to count rows in them.
 * - `listLiveClaims` loaded every claim, filtered in memory, paged, then issued one query
 *   per claim on the page for its spans.
 * - `getLiveClaim` loaded the whole `claim_relationships` table to find one claim's.
 * - `liveRadarPoints` issued two or three queries per intelligence state.
 *
 * The retired implementations are frozen below. `liveRadarPoints` is compared
 * order-insensitively: it consumed states in whatever order the driver returned and
 * stopped at the limit, so which points survived a truncation was unspecified. The
 * fixture stays under the limit. See the porting ledger.
 *
 * Delete this file when the M7 completion report is accepted.
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

function retiredIntelligenceStatus(db: HealthspanDb) {
  const runs = db
    .select()
    .from(intelligenceRuns)
    .orderBy(desc(intelligenceRuns.startedAt))
    .limit(5)
    .all();
  const states = db.select().from(contentIntelligenceState).all();
  const staleCount = states.filter((s) => s.stale).length;
  const assessed = states.filter((s) => s.currentAnalysisId).length;
  const openReviews = db
    .select()
    .from(liveReviewTasks)
    .all()
    .filter((t) => t.status === 'open').length;
  return {
    dataMode: 'live' as const,
    rulesetVersion: 'm3.deterministic.1',
    assessedCount: assessed,
    staleCount,
    openReviewTaskCount: openReviews,
    recentRuns: runs.map((r) => ({
      id: r.id,
      status: r.status,
      trigger: r.trigger,
      completedCount: r.completedCount,
      startedAt: new Date(r.startedAt).toISOString(),
      completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : null,
      summary: r.summary,
    })),
  };
}

type ClaimQuery = {
  page?: number;
  pageSize?: number;
  claimKind?: string;
  assertionRole?: string;
  reviewStatus?: string;
  q?: string;
};

function retiredListLiveClaims(db: HealthspanDb, query: ClaimQuery) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  const offset = (page - 1) * pageSize;
  let rows = db.select().from(liveClaims).orderBy(desc(liveClaims.createdAt)).all();
  if (query.claimKind) rows = rows.filter((r) => r.claimKind === query.claimKind);
  if (query.assertionRole) rows = rows.filter((r) => r.assertionRole === query.assertionRole);
  if (query.reviewStatus) rows = rows.filter((r) => r.reviewStatus === query.reviewStatus);
  if (query.q) {
    const q = query.q.toLowerCase();
    rows = rows.filter((r) => r.claimText.toLowerCase().includes(q));
  }
  const total = rows.length;
  const pageRows = rows.slice(offset, offset + pageSize);
  return {
    items: pageRows.map((claim) => {
      // The N+1: one span query per claim on the page.
      const spans = db
        .select()
        .from(claimSourceSpans)
        .where(eq(claimSourceSpans.claimId, claim.id))
        .all();
      return {
        id: claim.id,
        analysisId: claim.analysisId,
        contentItemId: claim.contentItemId,
        claimKind: claim.claimKind,
        assertionRole: claim.assertionRole,
        claimText: claim.claimText,
        direction: claim.direction,
        outcomeFamily: claim.outcomeFamily,
        extractionMethod: claim.extractionMethod,
        classificationConfidence: claim.classificationConfidence,
        reviewStatus: claim.reviewStatus,
        active: claim.active,
        createdAt: new Date(claim.createdAt).toISOString(),
        spans: spans.map((s) => ({
          id: s.id,
          fieldPath: s.fieldPath,
          excerpt: s.excerpt,
          primarySupport: s.primarySupport,
        })),
      };
    }),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function retiredGetLiveClaim(db: HealthspanDb, id: string) {
  const claim = db.select().from(liveClaims).where(eq(liveClaims.id, id)).all()[0];
  if (!claim) return null;
  const spans = db.select().from(claimSourceSpans).where(eq(claimSourceSpans.claimId, id)).all();
  const item = db
    .select()
    .from(contentItems)
    .where(eq(contentItems.id, claim.contentItemId))
    .all()[0];
  const relationships = db
    .select()
    .from(claimRelationships)
    .all()
    .filter((r) => r.leftClaimId === id || r.rightClaimId === id);
  return {
    claim: { ...claim, createdAt: new Date(claim.createdAt).toISOString() },
    item: item ? { id: item.id, title: item.title, type: item.type } : null,
    spans,
    relationships,
  };
}

const MATURITY_X: Record<string, number> = {
  social_anecdotal: 0.05,
  mechanistic_hypothesis: 0.15,
  in_vitro_ex_vivo: 0.25,
  animal_model: 0.35,
  human_observational: 0.5,
  early_human_interventional: 0.65,
  controlled_clinical_trial: 0.8,
  replicated_controlled_or_synthesis: 0.9,
  regulatory_or_guideline_supported: 0.95,
};

function retiredRadarPoints(db: HealthspanDb, limit = 40) {
  const states = db.select().from(contentIntelligenceState).all();
  const points = [];
  for (const state of states) {
    if (!state.currentAnalysisId) continue;
    const analysis = db
      .select()
      .from(intelligenceAnalyses)
      .where(eq(intelligenceAnalyses.id, state.currentAnalysisId))
      .all()[0];
    const item = db
      .select()
      .from(contentItems)
      .where(eq(contentItems.id, state.contentItemId))
      .all()[0];
    if (!analysis || !item) continue;
    const paper =
      item.type === 'paper'
        ? db.select().from(papers).where(eq(papers.contentItemId, item.id)).all()[0]
        : null;
    points.push({
      id: `radar-${item.id}`,
      label: item.title.slice(0, 48),
      itemId: item.id,
      itemType: item.type,
      evidenceMaturity: analysis.evidenceMaturity,
      evidenceX: MATURITY_X[analysis.evidenceMaturity] ?? 0.2,
      attentionY: analysis.researchActivity,
      bubbleSize: analysis.resultsPresent ? 0.7 : 0.4,
      safetyConcern: item.type === 'regulatory_event' || Boolean(paper?.isCorrectionOrRetraction),
      formulaVersion: 'research_activity.v1',
      researchActivityRaw: analysis.researchActivity,
      stale: Boolean(state.stale),
      shape:
        item.type === 'paper'
          ? 'paper'
          : item.type === 'trial'
            ? 'trial'
            : item.type === 'regulatory_event'
              ? 'regulatory_event'
              : 'paper',
    });
    if (points.length >= limit) break;
  }
  return points;
}

const CLAIM_QUERIES: Array<[string, ClaimQuery]> = [
  ['no filters', {}],
  ['by claim kind', { claimKind: 'efficacy' }],
  ['by assertion role', { assertionRole: 'reported_finding' }],
  ['by review status', { reviewStatus: 'needs_review' }],
  ['search matches', { q: 'metformin' }],
  ['search is case-insensitive', { q: 'METFORMIN' }],
  ['search matches nothing', { q: 'zzzz' }],
  ['combined filters', { claimKind: 'efficacy', reviewStatus: 'needs_review' }],
  ['filter with no matches', { claimKind: 'nonexistent' }],
  ['page 1 of 2', { pageSize: 2, page: 1 }],
  ['page 2 of 2', { pageSize: 2, page: 2 }],
  ['page past the end', { page: 99 }],
  ['page size clamped high', { pageSize: 1_000 }],
  ['page size clamped low', { pageSize: 0 }],
];

function countingDb(db: HealthspanDb): {
  db: HealthspanDb;
  count: () => number;
  reset: () => void;
} {
  let statements = 0;
  const proxy = new Proxy(db, {
    get(target, prop, receiver) {
      if (prop === 'select') statements += 1;
      return Reflect.get(target, prop, receiver) as unknown;
    },
  }) as HealthspanDb;
  return { db: proxy, count: () => statements, reset: () => (statements = 0) };
}

describe('intelligence port — parity with the retired implementation', () => {
  const seeded = seedIntelligenceFixture();
  dirs.push(seeded.dir);
  handles.push(seeded.sqlite);
  const repo = createLocalClaimAssessmentRepository(seeded.db);

  it('intelligenceStatus produces identical output', async () => {
    expect(await intelligenceStatus(repo)).toEqual(retiredIntelligenceStatus(seeded.db));
  });

  it.each(CLAIM_QUERIES)('listLiveClaims produces identical output: %s', async (_n, query) => {
    expect(await listLiveClaims(repo, query)).toEqual(retiredListLiveClaims(seeded.db, query));
  });

  it.each(['claim-1', 'claim-2', 'claim-orphan', 'nope'])(
    'getLiveClaim produces identical output for %s',
    async (id) => {
      expect(await getLiveClaim(repo, id)).toEqual(retiredGetLiveClaim(seeded.db, id));
    },
  );

  it('liveRadarPoints produces the same set of points', async () => {
    // Order-insensitive: the retired implementation's order was unspecified.
    const ported = await liveRadarPoints(repo, 40);
    const retired = retiredRadarPoints(seeded.db, 40);
    const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);
    expect([...ported].sort(byId)).toEqual([...retired].sort(byId));
  });

  it('fetches a page of spans in one statement instead of one per claim', async () => {
    const counting = countingDb(seeded.db);
    await listLiveClaims(createLocalClaimAssessmentRepository(counting.db), {});
    // Rows, filtered count, and one span query for the whole page.
    expect(counting.count()).toBe(3);

    counting.reset();
    retiredListLiveClaims(counting.db, {});
    expect(counting.count()).toBeGreaterThan(3);
  });

  it('counts status aggregates without loading the tables', async () => {
    const counting = countingDb(seeded.db);
    await intelligenceStatus(createLocalClaimAssessmentRepository(counting.db));
    // Three bounded counts plus the recent-runs query.
    expect(counting.count()).toBe(4);
  });

  it('reads one claim relationships without scanning the table', async () => {
    const counting = countingDb(seeded.db);
    await getLiveClaim(createLocalClaimAssessmentRepository(counting.db), 'claim-1');
    // Claim, spans, relationships, item — four bounded statements.
    expect(counting.count()).toBe(4);
  });
});
