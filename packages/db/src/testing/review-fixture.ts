import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { openDatabase } from '../client.js';
import { contentIntelligenceState, liveClaims, liveReviewTasks } from '../intelligence-schema.js';
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

  return { db: live.db, sqlite: live.sqlite, dir };
}

/** Reads a claim back for the contract's `readClaim` hook. */
export function readSeededClaim(db: SeededReviewDatabase['db'], id: string) {
  const row = db.select().from(liveClaims).where(eq(liveClaims.id, id)).all()[0];
  if (!row) return null;
  return { reviewStatus: row.reviewStatus, active: Boolean(row.active), claimText: row.claimText };
}
