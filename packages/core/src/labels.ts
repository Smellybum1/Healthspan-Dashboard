import type { EvidenceMaturity } from './taxonomies.js';
import { EVIDENCE_MATURITY_LABELS } from './taxonomies.js';

const MATURITY_TO_X: Record<EvidenceMaturity, number> = {
  social_anecdotal: 0.05,
  mechanistic_hypothesis: 0.15,
  in_vitro_ex_vivo: 0.25,
  animal_model: 0.35,
  human_observational: 0.5,
  early_human_interventional: 0.65,
  controlled_clinical_trial: 0.8,
  replicated_controlled_or_synthesis: 0.9,
  regulatory_or_guideline_supported: 0.98,
};

export function evidenceMaturityToRadarX(maturity: EvidenceMaturity): number {
  return MATURITY_TO_X[maturity];
}

export function evidenceTone(
  maturity: EvidenceMaturity,
): 'established' | 'emerging' | 'weak' {
  if (
    maturity === 'controlled_clinical_trial' ||
    maturity === 'replicated_controlled_or_synthesis' ||
    maturity === 'regulatory_or_guideline_supported'
  ) {
    return 'established';
  }
  if (
    maturity === 'human_observational' ||
    maturity === 'early_human_interventional' ||
    maturity === 'animal_model'
  ) {
    return 'emerging';
  }
  return 'weak';
}

export function formatEvidenceMaturity(maturity: EvidenceMaturity): string {
  return EVIDENCE_MATURITY_LABELS[maturity];
}

export function confidenceBand(score: number): 'low' | 'moderate' | 'high' {
  if (score < 0.4) return 'low';
  if (score < 0.7) return 'moderate';
  return 'high';
}
