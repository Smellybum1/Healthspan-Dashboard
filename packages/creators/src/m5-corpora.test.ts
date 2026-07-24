import { describe, expect, it } from 'vitest';
import {
  CLAIM_CORPUS_SUBSET_MINIMA,
  COMPLIANCE_RETENTION_CORPUS,
  CREATOR_CLAIM_CORPUS,
  CREATOR_DOCUMENT_CORPUS,
  CREATOR_IDENTITY_CORPUS,
  RECURRENCE_CORPUS,
  countClaimSubsetCases,
  evaluateM5Corpora,
} from './m5-corpora.js';

describe('m5 evaluation corpora', () => {
  it('identity corpus meets minimum count and categories', () => {
    expect(CREATOR_IDENTITY_CORPUS.length).toBeGreaterThanOrEqual(48);
    const cats = new Set(CREATOR_IDENTITY_CORPUS.map((c) => c.category));
    for (const required of [
      'person_vs_org',
      'channel_brand_vs_person',
      'multiple_accounts',
      'same_display_name_collision',
      'handle_change',
      'redirect_archived',
      'cross_link',
      'ambiguous_identity',
      'self_described_credential',
      'public_role',
      'superseded_affiliation',
      'explicit_sponsorship_disclosure',
      'no_inferred_sponsorship',
    ]) {
      expect(cats.has(required as never)).toBe(true);
    }
  });

  it('document corpus meets minimum count and categories', () => {
    expect(CREATOR_DOCUMENT_CORPUS.length).toBeGreaterThanOrEqual(48);
    const cats = new Set(CREATOR_DOCUMENT_CORPUS.map((c) => c.category));
    for (const required of [
      'vtt',
      'srt',
      'txt',
      'json',
      'timed_claims',
      'malformed_cues',
      'unicode',
      'html_like',
      'oversized',
      'wrong_mime',
      'rights_eligible',
      'rights_ineligible',
      'replacement',
      'deletion',
      'manual_quote',
      'manual_paraphrase',
      'transcript_unavailable',
    ]) {
      expect(cats.has(required as never)).toBe(true);
    }
  });

  it('claim corpus meets minimum count and subset minima', () => {
    expect(CREATOR_CLAIM_CORPUS.length).toBeGreaterThanOrEqual(CLAIM_CORPUS_SUBSET_MINIMA.total);
    const subsets = countClaimSubsetCases();
    expect(subsets.documentStyle).toBeGreaterThanOrEqual(CLAIM_CORPUS_SUBSET_MINIMA.documentStyle);
    expect(subsets.xStyle).toBeGreaterThanOrEqual(CLAIM_CORPUS_SUBSET_MINIMA.xStyle);
    expect(subsets.evidenceOverstatement).toBeGreaterThanOrEqual(
      CLAIM_CORPUS_SUBSET_MINIMA.evidenceOverstatement,
    );
    expect(subsets.correctionDisclosure).toBeGreaterThanOrEqual(
      CLAIM_CORPUS_SUBSET_MINIMA.correctionDisclosure,
    );
    expect(subsets.noAssessmentInsufficient).toBeGreaterThanOrEqual(
      CLAIM_CORPUS_SUBSET_MINIMA.noAssessmentInsufficient,
    );
  });

  it('recurrence corpus meets minimum groups and categories', () => {
    expect(RECURRENCE_CORPUS.length).toBeGreaterThanOrEqual(24);
    const cats = new Set(RECURRENCE_CORPUS.map((c) => c.category));
    for (const required of [
      'exact_duplicate',
      'reviewed_paraphrase',
      'potential_paraphrase',
      'same_theme_different_claim',
      'correction',
      'source_unavailable',
      'mixed_maturity',
      'one_source_repeating',
      'multiple_distinct_sources',
      'no_platform_wide_inference',
    ]) {
      expect(cats.has(required as never)).toBe(true);
    }
  });

  it('compliance corpus meets minimum count', () => {
    expect(COMPLIANCE_RETENTION_CORPUS.length).toBeGreaterThanOrEqual(40);
  });

  it('evaluateM5Corpora reports all corpora ok', () => {
    const result = evaluateM5Corpora();
    expect(result.identity.ok).toBe(true);
    expect(result.documents.ok).toBe(true);
    expect(result.claims.ok).toBe(true);
    expect(result.recurrence.ok).toBe(true);
    expect(result.compliance.ok).toBe(true);
    expect(result.ok).toBe(true);
  });
});
