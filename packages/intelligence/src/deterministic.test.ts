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
  });
});
