import { eq } from 'drizzle-orm';
import { creatorClaimFindings, creatorClaims, type HealthspanDb } from '@healthspan/db';

export const CREATOR_REVIEW_ACTIONS = ['accept', 'reject', 'dismiss'] as const;
export type CreatorReviewAction = (typeof CREATOR_REVIEW_ACTIONS)[number];

const ADVERSE_FINDING_PREFIXES = [
  'overstates_',
  'protocol_as_result',
  'animal_to_human_overreach',
  'biomarker_to_health_outcome_overreach',
  'regulatory_scope_overreach',
  'safety_scope_overreach',
  'potentially_conflicts_with_current_evidence',
  'unsupported_by_linked_local_evidence',
];

export function isAdverseCreatorFinding(findingType: string): boolean {
  return ADVERSE_FINDING_PREFIXES.some((p) => findingType === p || findingType.startsWith(p));
}

/** Open creator-alignment findings that require human review before profile publish. */
export function listCreatorReviewTasks(db: HealthspanDb, opts?: { limit?: number }) {
  const limit = Math.min(200, Math.max(1, opts?.limit ?? 100));
  const findings = db
    .select()
    .from(creatorClaimFindings)
    .all()
    .filter(
      (f) =>
        f.findingState === 'candidate' &&
        f.reviewRequired &&
        isAdverseCreatorFinding(f.findingType),
    )
    .slice(0, limit);

  return findings.map((f) => {
    const claim = f.claimId
      ? db
          .select()
          .from(creatorClaims)
          .all()
          .find((c) => c.id === f.claimId)
      : undefined;
    return {
      id: f.id,
      kind: 'creator_alignment_finding' as const,
      title: claim?.claimText?.slice(0, 160) ?? f.findingType,
      reason: f.explanation,
      findingType: f.findingType,
      findingState: f.findingState,
      claimId: f.claimId,
      creatorId: claim?.creatorId ?? null,
      status: 'open',
      confidence: claim?.confidence ?? 'medium',
      publishedToProfile: Boolean(f.publishedToProfile),
      createdAt: new Date(f.createdAt).toISOString(),
    };
  });
}

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
export function listPublishedCreatorFindings(db: HealthspanDb, claimId: string) {
  return db
    .select()
    .from(creatorClaimFindings)
    .all()
    .filter((f) => {
      if (f.claimId !== claimId) return false;
      if (!isAdverseCreatorFinding(f.findingType)) return f.findingState !== 'rejected';
      return f.findingState === 'accepted' && f.publishedToProfile;
    });
}
