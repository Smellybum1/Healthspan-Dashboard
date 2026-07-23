import { describe, expect, it } from 'vitest';
import {
  EvidenceAssessmentSchema,
  PaperSchema,
  SEED_TOTAL_CONTENT_RECORDS,
  SeedBundleSchema,
  confidenceBand,
  evidenceTone,
  getSeedBundle,
  searchItems,
} from './index.js';

describe('domain schemas', () => {
  it('validates the seed bundle', () => {
    const seed = getSeedBundle();
    expect(() => SeedBundleSchema.parse(seed)).not.toThrow();
    expect(SEED_TOTAL_CONTENT_RECORDS).toBeGreaterThanOrEqual(60);
  });

  it('validates cornerstone paper and assessment shapes', () => {
    const seed = getSeedBundle();
    const paper = seed.papers.find((p) => p.id === 'paper-metformin-rct');
    expect(paper).toBeTruthy();
    expect(() => PaperSchema.parse(paper)).not.toThrow();
    const assessment = seed.assessments.find((a) => a.subjectId === 'paper-metformin-rct');
    expect(() => EvidenceAssessmentSchema.parse(assessment)).not.toThrow();
  });

  it('includes required demo diversity', () => {
    const seed = getSeedBundle();
    expect(seed.papers.some((p) => p.peerReviewStatus === 'preprint')).toBe(true);
    expect(seed.papers.some((p) => p.isCorrectionOrRetraction)).toBe(true);
    expect(seed.papers.some((p) => p.findingDirection === 'null')).toBe(true);
    expect(seed.trials.some((t) => t.status === 'terminated' || t.status === 'withdrawn')).toBe(true);
    expect(seed.trials.some((t) => t.locations.some((l) => l.australiaRelevant))).toBe(true);
    expect(seed.regulatoryEvents.some((r) => r.jurisdiction === 'AU')).toBe(true);
    expect(seed.peptides.some((p) => p.unapprovedWarning)).toBe(true);

    const exercise = seed.assessments.find((a) => a.subjectId === 'int-exercise');
    const senolytic = seed.assessments.find((a) => a.subjectId === 'int-senolytic-demo');
    expect(exercise && exercise.attentionScore < 0.4).toBe(true);
    expect(senolytic && senolytic.attentionScore > 0.8).toBe(true);
  });
});

describe('evidence labels', () => {
  it('maps maturity tones and confidence bands', () => {
    expect(evidenceTone('regulatory_or_guideline_supported')).toBe('established');
    expect(evidenceTone('animal_model')).toBe('emerging');
    expect(evidenceTone('social_anecdotal')).toBe('weak');
    expect(confidenceBand(0.2)).toBe('low');
    expect(confidenceBand(0.5)).toBe('moderate');
    expect(confidenceBand(0.9)).toBe('high');
  });
});

describe('search behaviour', () => {
  it('finds metformin-related records', () => {
    const hits = searchItems('metformin');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.title.toLowerCase().includes('metformin'))).toBe(true);
  });
});
