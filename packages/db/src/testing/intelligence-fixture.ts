import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase } from '../client.js';
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

/**
 * Seeds a migrated database with intelligence fixtures. **Test support only.**
 *
 * Built to hit the branches the retired reads had: a claim with several spans and one
 * with none, a claim whose content item is missing, a state with no current analysis, a
 * regulatory event (which is a safety concern by type), a retracted paper (a safety
 * concern by flag), a stale state, and both an open and a resolved review task.
 *
 * Kept below the forty-point radar limit on purpose — the retired implementation's
 * behaviour past that limit depended on unspecified row order, so there is nothing there
 * to be faithful to.
 */
const BASE = Date.UTC(2026, 0, 1);

export type SeededIntelligenceDatabase = {
  db: ReturnType<typeof openDatabase>['db'];
  sqlite: ReturnType<typeof openDatabase>['sqlite'];
  dir: string;
};

export function seedIntelligenceFixture(): SeededIntelligenceDatabase {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-intel-'));
  const live = openDatabase({
    dbPath: path.join(dir, 'healthspan-dashboard.sqlite3'),
    migrateOnOpen: true,
  });
  const db = live.db;

  const items = [
    { id: 'item-paper', type: 'paper', title: 'Metformin randomised trial', retracted: false },
    { id: 'item-retracted', type: 'paper', title: 'Retracted senolytic paper', retracted: true },
    { id: 'item-reg', type: 'regulatory_event', title: 'Safety communication', retracted: false },
    { id: 'item-trial', type: 'trial', title: 'Rapamycin trial', retracted: false },
    { id: 'item-unassessed', type: 'paper', title: 'Never assessed', retracted: false },
  ];
  for (const i of items) {
    db.insert(contentItems)
      .values({
        id: i.id,
        type: i.type,
        dataOrigin: 'live',
        title: i.title,
        summary: `Summary for ${i.id}`,
        firstSeenAt: BASE,
        lastSeenAt: BASE,
        createdAt: BASE,
        updatedAt: BASE,
      })
      .run();
    if (i.type === 'paper') {
      db.insert(papers)
        .values({
          contentItemId: i.id,
          isCorrectionOrRetraction: i.retracted,
        })
        .run();
    }
  }

  const analyses = [
    {
      id: 'analysis-paper',
      item: 'item-paper',
      maturity: 'controlled_clinical_trial',
      activity: 7,
    },
    {
      id: 'analysis-retracted',
      item: 'item-retracted',
      maturity: 'human_observational',
      activity: 3,
    },
    {
      id: 'analysis-reg',
      item: 'item-reg',
      maturity: 'regulatory_or_guideline_supported',
      activity: 5,
    },
    // A maturity outside the x-axis table: must fall back to 0.2.
    { id: 'analysis-trial', item: 'item-trial', maturity: 'unknown_maturity', activity: 1 },
  ];
  for (const a of analyses) {
    db.insert(intelligenceAnalyses)
      .values({
        id: a.id,
        contentItemId: a.item,
        analysisMode: 'deterministic',
        inputHash: `hash-${a.id}`,
        rulesetVersion: 'm3.deterministic.1',
        segmentBuilderVersion: 'v1',
        claimSchemaVersion: 'v1',
        status: 'complete',
        classificationConfidence: 'medium',
        assessmentCompleteness: 'partial',
        evidenceMaturity: a.maturity,
        evidenceAvailability: 'full_text',
        researchActivity: a.activity,
        resultsPresent: a.item === 'item-paper',
        createdAt: BASE + analyses.indexOf(a) * 1_000,
      })
      .run();
  }

  const states = [
    { item: 'item-paper', analysis: 'analysis-paper', stale: false },
    { item: 'item-retracted', analysis: 'analysis-retracted', stale: true },
    { item: 'item-reg', analysis: 'analysis-reg', stale: false },
    { item: 'item-trial', analysis: 'analysis-trial', stale: false },
    // No current analysis: excluded from the radar and from the assessed count.
    { item: 'item-unassessed', analysis: null, stale: false },
  ];
  for (const s of states) {
    db.insert(contentIntelligenceState)
      .values({
        contentItemId: s.item,
        currentAnalysisId: s.analysis,
        stale: s.stale,
        updatedAt: BASE,
      })
      .run();
  }

  for (const r of [
    { id: 'run-new', startedAt: BASE + 5_000, status: 'succeeded', completed: 4 },
    { id: 'run-old', startedAt: BASE + 1_000, status: 'failed', completed: 0 },
  ]) {
    db.insert(intelligenceRuns)
      .values({
        id: r.id,
        trigger: 'manual',
        scope: 'recent',
        status: r.status,
        rulesetVersion: 'm3.deterministic.1',
        requestedCount: 4,
        completedCount: r.completed,
        startedAt: r.startedAt,
        completedAt: r.startedAt + 500,
        summary: `Summary for ${r.id}`,
      })
      .run();
  }

  const claims = [
    {
      id: 'claim-1',
      item: 'item-paper',
      analysis: 'analysis-paper',
      text: 'Metformin reduced the primary endpoint',
      kind: 'efficacy',
      role: 'reported_finding',
      review: 'needs_review',
      createdAt: BASE + 3_000,
    },
    {
      id: 'claim-2',
      item: 'item-reg',
      analysis: 'analysis-reg',
      text: 'Regulator issued a safety restriction',
      kind: 'safety',
      role: 'regulatory_statement',
      review: 'accepted',
      createdAt: BASE + 2_000,
    },
    {
      // Its content item does not exist: `getLiveClaim` must report a null item.
      id: 'claim-orphan',
      item: 'item-gone',
      analysis: 'analysis-paper',
      text: 'Orphaned claim about metformin',
      kind: 'efficacy',
      role: 'reported_finding',
      review: 'needs_review',
      createdAt: BASE + 1_000,
    },
  ];
  for (const c of claims) {
    db.insert(liveClaims)
      .values({
        id: c.id,
        analysisId: c.analysis,
        contentItemId: c.item,
        fingerprint: `fp-${c.id}`,
        claimKind: c.kind,
        assertionRole: c.role,
        claimText: c.text,
        direction: 'positive',
        extractionMethod: 'deterministic',
        classificationConfidence: 'low',
        reviewStatus: c.review,
        active: true,
        createdAt: c.createdAt,
      })
      .run();
  }

  // claim-1 has two spans; claim-2 has one; claim-orphan has none.
  for (const s of [
    { id: 'span-1a', claim: 'claim-1', primary: true },
    { id: 'span-1b', claim: 'claim-1', primary: false },
    { id: 'span-2a', claim: 'claim-2', primary: true },
  ]) {
    db.insert(claimSourceSpans)
      .values({
        id: s.id,
        claimId: s.claim,
        fieldPath: 'summary',
        excerpt: `Excerpt ${s.id}`,
        spanHash: `hash-${s.id}`,
        primarySupport: s.primary,
        createdAt: BASE,
      })
      .run();
  }

  // One relationship on each side of claim-1, and one unrelated to it.
  for (const r of [
    { id: 'rel-left', left: 'claim-1', right: 'claim-2' },
    { id: 'rel-right', left: 'claim-2', right: 'claim-1' },
    { id: 'rel-other', left: 'claim-2', right: 'claim-orphan' },
  ]) {
    db.insert(claimRelationships)
      .values({
        id: r.id,
        leftClaimId: r.left,
        rightClaimId: r.right,
        relationship: 'supports',
        rationale: 'Directionally compatible.',
        rulesetVersion: 'm3.deterministic.1',
        createdAt: BASE,
      })
      .run();
  }

  for (const t of [
    { id: 'review-open', status: 'open' },
    { id: 'review-done', status: 'resolved' },
  ]) {
    db.insert(liveReviewTasks)
      .values({
        id: t.id,
        contentItemId: 'item-paper',
        claimId: 'claim-1',
        analysisId: 'analysis-paper',
        title: 'Review',
        reason: 'low confidence',
        status: t.status,
        confidence: 'low',
        createdAt: BASE,
      })
      .run();
  }

  return { db, sqlite: live.sqlite, dir };
}
