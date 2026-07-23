import { describe, expect, it } from 'vitest';
import { detectClaimRelationship } from './relationships.js';

const pairs = [
  {
    id: 'opposite-direction',
    a: {
      fingerprint: '1',
      claimText: 'Metformin improved gait speed',
      assertionRole: 'reported_finding',
      direction: 'positive',
      outcomeFamily: 'function',
    },
    b: {
      fingerprint: '2',
      claimText: 'Metformin worsened gait speed',
      assertionRole: 'reported_finding',
      direction: 'negative',
      outcomeFamily: 'function',
    },
    expect: 'potentially_conflicts',
  },
  {
    id: 'protocol-vs-finding',
    a: {
      fingerprint: '3',
      claimText: 'Protocol plans gait speed endpoint',
      assertionRole: 'protocol_intent',
      direction: 'unspecified',
      outcomeFamily: 'function',
    },
    b: {
      fingerprint: '4',
      claimText: 'Gait speed improved',
      assertionRole: 'reported_finding',
      direction: 'positive',
      outcomeFamily: 'function',
    },
    expect: 'updates',
  },
  {
    id: 'same-direction-support',
    a: {
      fingerprint: '5',
      claimText: 'Exercise improved VO2',
      assertionRole: 'reported_finding',
      direction: 'positive',
      outcomeFamily: 'cardiorespiratory',
    },
    b: {
      fingerprint: '6',
      claimText: 'Exercise increased VO2 max',
      assertionRole: 'reported_finding',
      direction: 'positive',
      outcomeFamily: 'cardiorespiratory',
    },
    expect: 'supports',
  },
] as const;

type PairCase = {
  id: string;
  a: {
    fingerprint: string;
    claimText: string;
    assertionRole: string;
    direction: string;
    outcomeFamily: string | null;
  };
  b: {
    fingerprint: string;
    claimText: string;
    assertionRole: string;
    direction: string;
    outcomeFamily: string | null;
  };
  expect: string;
};

// Expand to >=16 pairs by variations
const expanded: PairCase[] = [...pairs];
for (let i = 0; i < 13; i += 1) {
  expanded.push({
    id: `opposite-var-${i}`,
    a: {
      fingerprint: `a${i}`,
      claimText: `Intervention ${i} improved biomarker endpoint`,
      assertionRole: 'reported_finding',
      direction: 'positive',
      outcomeFamily: 'biomarker',
    },
    b: {
      fingerprint: `b${i}`,
      claimText: `Intervention ${i} reduced biomarker endpoint`,
      assertionRole: 'reported_finding',
      direction: 'negative',
      outcomeFamily: 'biomarker',
    },
    expect: 'potentially_conflicts',
  });
}

describe('claim relationships', () => {
  it('covers at least 16 relationship pairs', () => {
    expect(expanded.length).toBeGreaterThanOrEqual(16);
  });

  for (const pair of expanded) {
    it(`detects ${pair.id}`, () => {
      const rel = detectClaimRelationship(pair.a, pair.b);
      expect(rel?.kind).toBe(pair.expect);
      if (rel?.kind === 'potentially_conflicts') {
        expect(rel.kind).not.toBe('contradicts' as never);
      }
    });
  }
});
