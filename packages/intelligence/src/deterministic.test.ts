import { describe, expect, it } from 'vitest';
import { analyzeNormalizedRecord } from './pipeline.js';

describe('deterministic intelligence', () => {
  it('treats trials without results as protocol-only', () => {
    const result = analyzeNormalizedRecord({
      type: 'trial',
      title: 'Example aging trial',
      summary: 'Investigating metformin in older adults',
      overallStatus: 'RECRUITING',
      resultsPosted: false,
      nctId: 'NCT01234567',
    });
    expect(result.profile.evidenceAvailability).toBe('protocol_only');
    expect(result.profile.translationGaps).toContain('protocol_to_results');
    expect(result.claims[0]?.assertionRole).toBe('protocol_intent');
    expect(result.claims[0]?.primaryExcerpt.length).toBeGreaterThan(0);
  });

  it('labels animal papers with animal_to_human gap', () => {
    const result = analyzeNormalizedRecord({
      type: 'paper',
      title: 'Mouse longevity study',
      summary: 'Lifespan increased in mice',
      studyDesign: 'animal_experiment',
    });
    expect(result.profile.evidenceMaturity).toBe('animal_model');
    expect(result.profile.translationGaps).toContain('animal_to_human');
    expect(result.claims.length).toBeGreaterThanOrEqual(1);
    expect(result.claims.every((c) => c.primaryExcerpt.length > 0)).toBe(true);
  });

  it('does not treat regulator notices as evidence-maturity stages', () => {
    const result = analyzeNormalizedRecord({
      type: 'regulatory_event',
      title: 'TGA safety advisory',
      summary: 'Updated product information for example medicine',
    });
    expect(result.profile.evidenceAvailability).toBe('regulatory_statement');
    expect(result.profile.evidenceMaturity).not.toBe('regulatory_or_guideline_supported');
    expect(result.profile.methodologicalSignals.some((s) => s.code === 'regulator_notice_not_evidence_maturity')).toBe(
      true,
    );
  });
});
