export const PEPTIDE_RULESET_VERSION = 'm4.peptide.1';

export type PeptideClassification =
  | 'peptide'
  | 'peptide_analogue'
  | 'peptide_fragment'
  | 'protein_or_biologic'
  | 'marketing_or_research_label'
  | 'unknown';

export type SequenceState =
  | 'verified_sequence'
  | 'partial_sequence'
  | 'no_sequence'
  | 'conflicting_sequence'
  | 'unreviewed_candidate';

export type PeptideWarningState =
  | 'identity_unresolved'
  | 'sequence_unverified'
  | 'analogue_or_fragment_ambiguity'
  | 'research_use_only_label'
  | 'no_human_authorisation_inferred'
  | 'none';

const PEPTIDE_HINTS = [
  'bpc-157',
  'bpc157',
  'tb-500',
  'tb500',
  'epitalon',
  'semax',
  'selank',
  'ghk-cu',
  'mots-c',
  'ss-31',
  'peptide',
];

export function classifyPeptideLabel(name: string): {
  classification: PeptideClassification;
  warning: PeptideWarningState;
  sequenceState: SequenceState;
} {
  const n = name.toLowerCase();
  const looksPeptide = PEPTIDE_HINTS.some((h) => n.includes(h));
  if (!looksPeptide) {
    return {
      classification: 'unknown',
      warning: 'none',
      sequenceState: 'no_sequence',
    };
  }
  if (n.includes('analogue') || n.includes('analog')) {
    return {
      classification: 'peptide_analogue',
      warning: 'analogue_or_fragment_ambiguity',
      sequenceState: 'no_sequence',
    };
  }
  if (n.includes('fragment')) {
    return {
      classification: 'peptide_fragment',
      warning: 'analogue_or_fragment_ambiguity',
      sequenceState: 'no_sequence',
    };
  }
  return {
    classification: 'peptide',
    warning: 'sequence_unverified',
    sequenceState: 'no_sequence',
  };
}

/** Sequence may only be stored when a recognized source supplies it. */
export function canStoreSequence(opts: {
  sourceScheme: string | null;
  sequenceText: string | null;
  reviewed: boolean;
}): boolean {
  if (!opts.sequenceText?.trim()) return false;
  if (!opts.sourceScheme) return false;
  const trusted = ['uniprotkb', 'pubchem', 'gsrs', 'manual_reviewed'];
  return trusted.includes(opts.sourceScheme) && opts.reviewed;
}

export const PEPTIDE_PROHIBITED_UI = [
  'dosing',
  'cycling',
  'reconstitution',
  'vendor_links',
  'purchasing',
  'stacking',
  'treatment_recommendation',
] as const;
