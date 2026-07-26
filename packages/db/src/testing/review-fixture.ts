import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { openDatabase } from '../client.js';
import { contentIntelligenceState, liveClaims, liveReviewTasks } from '../intelligence-schema.js';
import {
  creatorClaimEvidenceLinks,
  creatorClaimFindings,
  creatorClaims,
  creatorIdentityTasks,
} from '../creator-schema.js';
import type { ReviewContractFixture } from '../repositories/review.contract.js';

/**
 * Seeds a migrated database with a review contract fixture. **Test support only.**
 *
 * Shared by the local and D1 contract bindings so both adapters are measured against
 * byte-identical starting state. If each test seeded its own rows, a difference in the
 * seed could pass for a difference in the adapter.
 *
 * Rows are written through the local driver in both cases — seeding is not the behaviour
 * under test, and using one writer keeps the fixtures identical by construction.
 */
export type SeededReviewDatabase = {
  db: ReturnType<typeof openDatabase>['db'];
  sqlite: ReturnType<typeof openDatabase>['sqlite'];
  dir: string;
};

export function seedReviewFixture(fixture: ReviewContractFixture): SeededReviewDatabase {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-review-'));
  const live = openDatabase({
    dbPath: path.join(dir, 'healthspan-dashboard.sqlite3'),
    migrateOnOpen: true,
  });
  const now = Date.now();

  for (const claim of fixture.claims) {
    live.db
      .insert(liveClaims)
      .values({
        id: claim.id,
        analysisId: claim.analysisId,
        contentItemId: claim.contentItemId,
        fingerprint: `fp-${claim.id}`,
        claimKind: 'efficacy',
        assertionRole: 'reported_finding',
        claimText: claim.claimText,
        direction: 'positive',
        extractionMethod: 'deterministic',
        classificationConfidence: 'low',
        reviewStatus: claim.reviewStatus,
        active: claim.active,
        createdAt: now,
      })
      .run();
  }

  for (const task of fixture.tasks) {
    live.db
      .insert(liveReviewTasks)
      .values({ ...task })
      .run();
  }

  for (const state of fixture.intelligence) {
    live.db
      .insert(contentIntelligenceState)
      .values({
        contentItemId: state.contentItemId,
        currentAnalysisId: state.currentAnalysisId,
        stale: state.stale,
        updatedAt: now,
      })
      .run();
  }

  seedReviewSurface(live.db);

  return { db: live.db, sqlite: live.sqlite, dir };
}

/** Reads a claim back for the contract's `readClaim` hook. */
export function readSeededClaim(db: SeededReviewDatabase['db'], id: string) {
  const row = db.select().from(liveClaims).where(eq(liveClaims.id, id)).all()[0];
  if (!row) return null;
  return { reviewStatus: row.reviewStatus, active: Boolean(row.active), claimText: row.claimText };
}

/**
 * Seeds the creator-review surface: alignment findings, an identity task, and an
 * evidence link. Called by the review and creator contract bindings.
 *
 * The findings cover every branch the retired filters had — an adverse candidate needing
 * review, a non-adverse candidate, an adverse candidate with **no claim** (the retired
 * code produced a task titled by its finding type, so the join must be a left one), an
 * accepted-and-published adverse finding, and a rejected non-adverse one.
 */
export function seedReviewSurface(db: SeededReviewDatabase['db']) {
  const now = Date.UTC(2026, 0, 1);

  const findings = [
    {
      id: 'finding-adverse-open',
      claimId: 'claim-1',
      findingType: 'overstates_causality',
      findingState: 'candidate',
      reviewRequired: true,
      publishedToProfile: false,
    },
    {
      id: 'finding-benign-open',
      claimId: 'claim-1',
      findingType: 'context_note',
      findingState: 'candidate',
      reviewRequired: true,
      publishedToProfile: false,
    },
    {
      id: 'finding-adverse-noclaim',
      claimId: null,
      findingType: 'safety_scope_overreach',
      findingState: 'candidate',
      reviewRequired: true,
      publishedToProfile: false,
    },
    {
      id: 'finding-adverse-published',
      claimId: 'claim-1',
      findingType: 'animal_to_human_overreach',
      findingState: 'accepted',
      reviewRequired: false,
      publishedToProfile: true,
    },
    {
      id: 'finding-benign-rejected',
      claimId: 'claim-1',
      findingType: 'context_note',
      findingState: 'rejected',
      reviewRequired: false,
      publishedToProfile: false,
    },
  ];
  for (const f of findings) {
    db.insert(creatorClaimFindings)
      .values({
        id: f.id,
        assessmentId: 'assessment-1',
        claimId: f.claimId,
        findingType: f.findingType,
        findingState: f.findingState,
        explanation: `Explanation for ${f.id}`,
        reviewRequired: f.reviewRequired,
        publishedToProfile: f.publishedToProfile,
        createdAt: now,
      })
      .run();
  }

  // `claim-1` here is a *creator* claim, distinct from the live claim of the same id in
  // the review fixture above. The finding join reads this table.
  db.insert(creatorClaims)
    .values({
      id: 'claim-1',
      creatorId: 'creator-a',
      claimText: 'Creator claim under alignment review',
      assertionRole: 'reported_finding',
      claimKind: 'efficacy',
      direction: 'positive',
      confidence: 'high',
      recurrenceKey: 'theme-1',
      reviewStatus: 'accepted',
      active: true,
      lifecycleState: 'current',
      alignmentJson: '{}',
      fieldPath: 'transcript',
      excerpt: 'Excerpt',
      extractionVersion: 'v1',
      createdAt: now,
    })
    .run();

  for (const t of [
    { id: 'identity-high', priority: 9, reviewStatus: 'pending', currentState: 'open' },
    { id: 'identity-low', priority: 1, reviewStatus: 'pending', currentState: 'open' },
    // Neither pending nor open: excluded.
    { id: 'identity-done', priority: 5, reviewStatus: 'resolved', currentState: 'closed' },
  ]) {
    db.insert(creatorIdentityTasks)
      .values({
        id: t.id,
        accountId: 'account-a-yt',
        reason: 'ambiguous handle',
        proposedCreatorId: 'creator-a',
        currentState: t.currentState,
        priority: t.priority,
        reviewStatus: t.reviewStatus,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }

  db.insert(creatorClaimEvidenceLinks)
    .values({
      id: 'link-1',
      creatorClaimId: 'claim-1',
      targetType: 'live_claim',
      targetId: 'live-claim-1',
      linkRole: 'supports',
      detectionMethod: 'deterministic',
      compatibilityDimensionsJson: JSON.stringify(['direction']),
      linkState: 'candidate',
      rationale: 'Directionally compatible.',
      createdAt: now,
    })
    .run();
}
