import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import {
  creatorClaims,
  creatorClaimEvidenceLinks,
  creatorClaimAlignmentAssessments,
  creatorProfileState,
  interventionEntities,
  liveClaims,
  type HealthspanDb,
} from '@healthspan/db';

/**
 * Link creator claims to local M3/M4 evidence by simple term match.
 * Never mutates scientific maturity or regulatory status.
 */
export function linkCreatorClaimEvidence(db: HealthspanDb, claimId: string) {
  const claim = db.select().from(creatorClaims).where(eq(creatorClaims.id, claimId)).all()[0];
  if (!claim) return { ok: false as const, status: 404 as const, error: 'Claim not found' };

  const now = Date.now();
  const text = claim.claimText.toLowerCase();
  const links: Array<{ targetType: string; targetId: string; rationale: string }> = [];

  const interventions = db.select().from(interventionEntities).all();
  for (const ent of interventions) {
    const name = (ent.preferredName ?? '').toLowerCase();
    if (name.length >= 4 && text.includes(name)) {
      links.push({
        targetType: 'intervention_entity',
        targetId: ent.id,
        rationale: `Term match on intervention "${ent.preferredName}"`,
      });
    }
  }

  const scientific = db.select().from(liveClaims).all().slice(0, 500);
  for (const sc of scientific) {
    const scText = String(sc.claimText ?? '').toLowerCase();
    if (!scText) continue;
    const overlap = scText
      .split(/\s+/)
      .filter((t) => t.length > 4 && text.includes(t))
      .slice(0, 3);
    if (overlap.length >= 2) {
      links.push({
        targetType: 'scientific_claim',
        targetId: sc.id,
        rationale: `Lexical overlap with local scientific claim (${overlap.join(', ')})`,
      });
    }
  }

  // Clear prior candidate auto-links for this claim (keep reviewed)
  for (const existing of db
    .select()
    .from(creatorClaimEvidenceLinks)
    .all()
    .filter((l) => l.creatorClaimId === claimId && l.linkState === 'candidate')) {
    // leave rows; insert fresh with new ids — avoid destructive delete for audit
    void existing;
  }

  let created = 0;
  for (const link of links.slice(0, 10)) {
    const compatibility = [
      {
        dimension: 'intervention_identity',
        state: link.targetType === 'intervention_entity' ? 'aligned' : 'unresolved',
      },
      { dimension: 'species_or_organism', state: 'unresolved' },
    ];
    db.insert(creatorClaimEvidenceLinks)
      .values({
        id: randomUUID(),
        creatorClaimId: claimId,
        targetType: link.targetType,
        targetId: link.targetId,
        linkRole: 'evidence_alignment',
        detectionMethod: 'deterministic_term_match',
        compatibilityDimensionsJson: JSON.stringify(compatibility),
        linkState: 'candidate',
        rationale: link.rationale,
        sourceOrVersion: 'm5.evidence-link.1',
        createdAt: now,
      })
      .run();
    created += 1;
  }

  return {
    ok: true as const,
    claimId,
    linksCreated: created,
    linkedEvidenceCount: created,
    note: 'Creator claims never alter scientific evidence maturity or regulatory status.',
  };
}

export function listClaimEvidenceLinks(db: HealthspanDb, claimId: string) {
  return db
    .select()
    .from(creatorClaimEvidenceLinks)
    .all()
    .filter((l) => l.creatorClaimId === claimId)
    .map((l) => ({
      id: l.id,
      targetType: l.targetType,
      targetId: l.targetId,
      linkRole: l.linkRole,
      detectionMethod: l.detectionMethod,
      linkState: l.linkState,
      rationale: l.rationale,
      compatibilityDimensions: JSON.parse(l.compatibilityDimensionsJson || '[]'),
      createdAt: new Date(l.createdAt).toISOString(),
    }));
}

/** Mark creator profile/alignment stale when linked evidence changes (H16). */
export function markCreatorAlignmentStaleForEvidence(
  db: HealthspanDb,
  opts: { targetType: string; targetId: string; reason: string },
) {
  const now = Date.now();
  const links = db
    .select()
    .from(creatorClaimEvidenceLinks)
    .all()
    .filter((l) => l.targetType === opts.targetType && l.targetId === opts.targetId);
  let marked = 0;
  for (const link of links) {
    const claim = db
      .select()
      .from(creatorClaims)
      .where(eq(creatorClaims.id, link.creatorClaimId))
      .all()[0];
    if (!claim) continue;
    for (const assessment of db
      .select()
      .from(creatorClaimAlignmentAssessments)
      .all()
      .filter((a) => a.creatorClaimId === claim.id && a.lifecycleState === 'current')) {
      db.update(creatorClaimAlignmentAssessments)
        .set({ lifecycleState: 'superseded' })
        .where(eq(creatorClaimAlignmentAssessments.id, assessment.id))
        .run();
    }
    const state = db
      .select()
      .from(creatorProfileState)
      .all()
      .find((s) => s.creatorId === claim.creatorId);
    if (state) {
      db.update(creatorProfileState)
        .set({
          stale: true,
          staleReason: opts.reason,
          updatedAt: now,
        })
        .where(eq(creatorProfileState.id, state.id))
        .run();
    }
    marked += 1;
  }
  return { marked, reason: opts.reason };
}
