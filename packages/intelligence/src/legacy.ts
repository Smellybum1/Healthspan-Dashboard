import {
  confidenceBand,
  evidenceTone,
  formatEvidenceMaturity,
  type EvidenceAssessment,
  type EvidenceMaturity,
} from '@healthspan/core';

/** Rule-based helpers retained from Milestone 1 Demo assessments. */
export function describeAssessment(assessment: EvidenceAssessment) {
  return {
    maturityLabel: formatEvidenceMaturity(assessment.maturity),
    tone: evidenceTone(assessment.maturity),
    confidenceBand: confidenceBand(assessment.confidenceScore),
    rationale: assessment.confidenceRationale,
    translationGaps: assessment.translationGaps,
    attention: assessment.attentionScore,
    safetyNotes: assessment.safetyNotes,
    whatWouldChange: assessment.whatWouldChangeAssessment,
    provenance: assessment.provenance,
  };
}

export function quadrantFor(maturity: EvidenceMaturity, attention: number): string {
  const strong =
    maturity === 'controlled_clinical_trial' ||
    maturity === 'replicated_controlled_or_synthesis' ||
    maturity === 'regulatory_or_guideline_supported';
  const highAttention = attention >= 0.6;
  if (strong && highAttention) return 'Strong evidence / high attention';
  if (strong && !highAttention) return 'Strong evidence / low attention';
  if (!strong && highAttention) return 'Weak evidence / high attention';
  return 'Early evidence / low attention';
}
