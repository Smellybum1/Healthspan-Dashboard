import { eq } from 'drizzle-orm';
import { isAdverseCreatorFinding } from '@healthspan/core';
import { creatorClaimFindings, creatorClaims, type HealthspanDb } from '@healthspan/db';

export const CREATOR_REVIEW_ACTIONS = ['accept', 'reject', 'dismiss'] as const;
export type CreatorReviewAction = (typeof CREATOR_REVIEW_ACTIONS)[number];

// The adverse-finding rule now lives in @healthspan/core so both runtimes apply one
// definition; this local-only write path consumes the same function the hosted reads do.
export { isAdverseCreatorFinding };

export function resolveCreatorReviewTask(
  db: HealthspanDb,
  opts: { findingId: string; action: CreatorReviewAction; notes?: string },
) {
  const finding = db
    .select()
    .from(creatorClaimFindings)
    .all()
    .find((f) => f.id === opts.findingId);
  if (!finding) return { ok: false as const, status: 404 as const, error: 'Finding not found' };
  if (finding.findingState !== 'candidate') {
    return { ok: false as const, status: 409 as const, error: 'Finding is no longer a candidate' };
  }
  const now = Date.now();
  if (opts.action === 'accept') {
    db.update(creatorClaimFindings)
      .set({
        findingState: 'accepted',
        reviewDecision: 'accept',
        publishedToProfile: true,
        reviewedAt: now,
        explanation: opts.notes
          ? `${finding.explanation} | reviewer: ${opts.notes}`
          : finding.explanation,
      })
      .where(eq(creatorClaimFindings.id, finding.id))
      .run();
    if (finding.claimId) {
      db.update(creatorClaims)
        .set({ reviewStatus: 'reviewed' })
        .where(eq(creatorClaims.id, finding.claimId))
        .run();
    }
  } else {
    db.update(creatorClaimFindings)
      .set({
        findingState: opts.action === 'reject' ? 'rejected' : 'dismissed',
        reviewDecision: opts.action,
        publishedToProfile: false,
        reviewedAt: now,
        explanation: opts.notes
          ? `${finding.explanation} | reviewer: ${opts.notes}`
          : finding.explanation,
      })
      .where(eq(creatorClaimFindings.id, finding.id))
      .run();
  }
  return { ok: true as const, findingId: finding.id, action: opts.action };
}

/** Profile display: adverse findings only when accepted+published. */
