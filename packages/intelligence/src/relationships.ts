export type ClaimRelationshipKind =
  | 'supports'
  | 'extends'
  | 'potentially_conflicts'
  | 'updates'
  | 'retracts';

export type ClaimLike = {
  fingerprint: string;
  claimText: string;
  assertionRole: string;
  direction: string;
  outcomeFamily: string | null;
  population?: string | null;
  intervention?: string | null;
};

export type RelationshipCandidate = {
  kind: ClaimRelationshipKind;
  status: 'candidate';
  confidence: 'low' | 'medium';
  rationale: string;
  populationCompatible: boolean;
  interventionCompatible: boolean;
  outcomeCompatible: boolean;
};

/**
 * Conservative relationship detector — never emits definitive contradiction.
 */
export function detectClaimRelationship(
  a: ClaimLike,
  b: ClaimLike,
): RelationshipCandidate | null {
  if (a.fingerprint === b.fingerprint) return null;

  const sameOutcome =
    Boolean(a.outcomeFamily && b.outcomeFamily && a.outcomeFamily === b.outcomeFamily) ||
    overlappingTokens(a.claimText, b.claimText);
  const oppositeDirection =
    (a.direction === 'positive' && b.direction === 'negative') ||
    (a.direction === 'negative' && b.direction === 'positive');
  const protocolVsFinding =
    (a.assertionRole === 'protocol_intent' && b.assertionRole === 'reported_finding') ||
    (b.assertionRole === 'protocol_intent' && a.assertionRole === 'reported_finding');

  if (protocolVsFinding) {
    return {
      kind: 'updates',
      status: 'candidate',
      confidence: 'low',
      rationale: 'Protocol/plan claim compared with a reported finding; not treated as conflict.',
      populationCompatible: true,
      interventionCompatible: true,
      outcomeCompatible: sameOutcome,
    };
  }

  if (sameOutcome && oppositeDirection) {
    return {
      kind: 'potentially_conflicts',
      status: 'candidate',
      confidence: 'low',
      rationale:
        'Opposite reported directions on overlapping outcome language. Comparability not established — labelled potentially_conflicts only.',
      populationCompatible: a.population == null || b.population == null || a.population === b.population,
      interventionCompatible:
        a.intervention == null || b.intervention == null || a.intervention === b.intervention,
      outcomeCompatible: true,
    };
  }

  if (sameOutcome && a.direction === b.direction && a.direction !== 'unspecified') {
    return {
      kind: 'supports',
      status: 'candidate',
      confidence: 'low',
      rationale: 'Similar direction and overlapping outcome language — candidate support only.',
      populationCompatible: true,
      interventionCompatible: true,
      outcomeCompatible: true,
    };
  }

  return null;
}

function overlappingTokens(a: string, b: string) {
  const ta = new Set(
    a
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 3),
  );
  const tb = b
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);
  return tb.some((t) => ta.has(t));
}
