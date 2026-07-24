import { describe, expect, it } from 'vitest';
import {
  ALIGNMENT_PAIR_CORPUS,
  evaluateAlignmentPairCorpus,
} from './alignment-corpus.js';

describe('alignment-pair corpus', () => {
  it('has at least 72 cases across required categories', () => {
    expect(ALIGNMENT_PAIR_CORPUS.length).toBeGreaterThanOrEqual(72);
    const cats = new Set(ALIGNMENT_PAIR_CORPUS.map((c) => c.category));
    for (const required of [
      'fully_aligned',
      'partially_aligned',
      'species_mismatch',
      'population_mismatch',
      'protocol_as_result',
      'biomarker_overreach',
      'effect_magnitude_overreach',
      'causality_overreach',
      'regulatory_indication_mismatch',
      'safety_scope_overreach',
      'not_comparable',
      'potential_conflict',
      'evidence_update',
      'retraction',
      'source_unavailable',
      'no_linked_local_evidence',
    ]) {
      expect(cats.has(required as never)).toBe(true);
    }
  });

  it('passes deterministic evaluation for all pairs', () => {
    const result = evaluateAlignmentPairCorpus();
    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.passed).toBe(result.total);
  });
});
