import { randomUUID } from 'node:crypto';
import {
  computeClaimRecurrence,
  classifyClaimRelationship,
  recurrenceSourceScopeHash,
  RECURRENCE_FORMULA_VERSION,
} from '@healthspan/creators';
import {
  claimRecurrenceSnapshots,
  creatorClaims,
  creatorClaimRelationships,
  type HealthspanDb,
} from '@healthspan/db';

function toInputs(db: HealthspanDb, creatorId?: string) {
  let claims = db.select().from(creatorClaims).all();
  if (creatorId) claims = claims.filter((c) => c.creatorId === creatorId);
  return claims.map((c) => ({
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
  }));
}

export function getCreatorRecurrence(db: HealthspanDb, creatorId: string) {
  const inputs = toInputs(db, creatorId);
  const groups = computeClaimRecurrence(inputs);
  return {
    formulaVersion: RECURRENCE_FORMULA_VERSION,
    groupCount: groups.length,
    groups,
    note: 'Recurrence is not popularity, influence, attention, engagement, or truth.',
  };
}

export function rebuildClaimRecurrence(db: HealthspanDb, opts?: { creatorId?: string }) {
  const now = Date.now();
  const inputs = toInputs(db, opts?.creatorId);

  for (let i = 0; i < inputs.length; i += 1) {
    for (let j = i + 1; j < inputs.length; j += 1) {
      const rel = classifyClaimRelationship(inputs[i]!, inputs[j]!);
      if (rel.relationshipType === 'unrelated') continue;
      const exists = db
        .select()
        .from(creatorClaimRelationships)
        .all()
        .some(
          (r) =>
            r.sourceClaimId === rel.sourceClaimId &&
            r.targetClaimId === rel.targetClaimId &&
            r.relationshipType === rel.relationshipType,
        );
      if (exists) continue;
      db.insert(creatorClaimRelationships)
        .values({
          id: randomUUID(),
          sourceClaimId: rel.sourceClaimId,
          targetClaimId: rel.targetClaimId,
          relationshipType: rel.relationshipType,
          relationshipState: rel.relationshipType === 'potential_paraphrase' ? 'candidate' : 'accepted',
          similarityFeaturesJson: JSON.stringify({ similarity: rel.similarity }),
          scopeCompatibility: 'monitored_sources',
          createdAt: now,
        })
        .run();
    }
  }

  const groups = computeClaimRecurrence(inputs);
  const snapshots = [];
  for (const g of groups) {
    if (g.reviewedClaimCount < 1) continue;
    const id = randomUUID();
    const sourceKeys = inputs
      .filter((c) => c.recurrenceKey === g.recurrenceKey)
      .map((c) => c.sourceKey)
      .filter((k): k is string => Boolean(k));
    db.insert(claimRecurrenceSnapshots)
      .values({
        id,
        claimThemeConcept: g.recurrenceKey,
        windowStart: g.firstObservedAt ?? now,
        windowEnd: now,
        distinctMonitoredSourceCount: g.distinctMonitoredSourceCount,
        reviewedClaimCount: g.reviewedClaimCount,
        correctionCount: 0,
        conflictCount: 0,
        sourceUnavailableCount: g.sourceUnavailableCount,
        formulaVersion: RECURRENCE_FORMULA_VERSION,
        sourceScopeHash: recurrenceSourceScopeHash(sourceKeys),
        createdAt: now,
      })
      .run();
    snapshots.push({ id, ...g });
  }

  return {
    formulaVersion: RECURRENCE_FORMULA_VERSION,
    groupCount: groups.length,
    groups,
    snapshots,
    note: 'Recurrence is not popularity, influence, attention, engagement, or truth.',
  };
}

export function listRecurrenceSnapshots(db: HealthspanDb, limit = 50) {
  return db
    .select()
    .from(claimRecurrenceSnapshots)
    .all()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
    .map((s) => ({
      id: s.id,
      claimThemeConcept: s.claimThemeConcept,
      distinctMonitoredSourceCount: s.distinctMonitoredSourceCount,
      reviewedClaimCount: s.reviewedClaimCount,
      sourceUnavailableCount: s.sourceUnavailableCount,
      formulaVersion: s.formulaVersion,
      firstObservedScope: 'monitored_sources' as const,
      notPopularity: true,
      createdAt: new Date(s.createdAt).toISOString(),
    }));
}
