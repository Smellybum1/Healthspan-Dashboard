import { z } from 'zod';

/** All seed records are demonstration data for Milestone 1. */
export const DEMO_SNAPSHOT_NOTICE =
  'Demo snapshot — fictionalised demonstration data for Healthspan Dashboard Milestone 1. Not live scientific facts.';

export const EvidenceMaturitySchema = z.enum([
  'social_anecdotal',
  'mechanistic_hypothesis',
  'in_vitro_ex_vivo',
  'animal_model',
  'human_observational',
  'early_human_interventional',
  'controlled_clinical_trial',
  'replicated_controlled_or_synthesis',
  'regulatory_or_guideline_supported',
]);
export type EvidenceMaturity = z.infer<typeof EvidenceMaturitySchema>;

export const StudyDesignSchema = z.enum([
  'anecdote',
  'case_series',
  'cross_sectional',
  'case_control',
  'cohort',
  'non_randomised_interventional',
  'randomised_controlled',
  'crossover_rct',
  'systematic_review_meta_analysis',
  'in_vitro',
  'animal_experiment',
  'registry_analysis',
  'other',
]);
export type StudyDesign = z.infer<typeof StudyDesignSchema>;

export const PeerReviewStatusSchema = z.enum([
  'peer_reviewed',
  'preprint',
  'conference_abstract',
  'not_applicable',
  'unknown',
]);
export type PeerReviewStatus = z.infer<typeof PeerReviewStatusSchema>;

export const RegulatoryStatusSchema = z.enum([
  'approved',
  'off_label',
  'investigational',
  'unapproved',
  'prohibited',
  'unknown',
]);
export type RegulatoryStatus = z.infer<typeof RegulatoryStatusSchema>;

export const JurisdictionSchema = z.enum([
  'AU',
  'US',
  'EU',
  'UK',
  'CA',
  'JP',
  'global',
  'other',
]);
export type Jurisdiction = z.infer<typeof JurisdictionSchema>;

export const SafetySeveritySchema = z.enum([
  'info',
  'low',
  'moderate',
  'high',
  'critical',
]);
export type SafetySeverity = z.infer<typeof SafetySeveritySchema>;

export const ContentTypeSchema = z.enum([
  'paper',
  'trial',
  'intervention',
  'peptide',
  'creator',
  'claim',
  'regulatory_event',
  'organisation',
  'watchlist',
  'change_event',
  'review_task',
]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const AgeingHallmarkSchema = z.enum([
  'genomic_instability',
  'telomere_attrition',
  'epigenetic_alterations',
  'loss_of_proteostasis',
  'disabled_macroautophagy',
  'deregulated_nutrient_sensing',
  'mitochondrial_dysfunction',
  'cellular_senescence',
  'stem_cell_exhaustion',
  'altered_intercellular_communication',
  'chronic_inflammation',
  'dysbiosis',
]);
export type AgeingHallmark = z.infer<typeof AgeingHallmarkSchema>;

export const TranslationGapTypeSchema = z.enum([
  'cell_to_organism',
  'animal_to_human',
  'disease_treatment_to_longevity',
  'biomarker_to_health_outcome',
  'short_term_to_durable',
  'association_to_causation',
  'selected_sample_to_population',
]);
export type TranslationGapType = z.infer<typeof TranslationGapTypeSchema>;

export const TrialStatusSchema = z.enum([
  'not_yet_recruiting',
  'recruiting',
  'active_not_recruiting',
  'completed',
  'terminated',
  'withdrawn',
  'suspended',
  'unknown',
]);
export type TrialStatus = z.infer<typeof TrialStatusSchema>;

export const CreatorTypeSchema = z.enum([
  'scientist',
  'clinician',
  'journalist',
  'influencer',
  'podcast',
  'newsletter',
  'organisation_channel',
  'other',
]);
export type CreatorType = z.infer<typeof CreatorTypeSchema>;

export const ReviewTaskStatusSchema = z.enum([
  'open',
  'in_progress',
  'resolved',
  'dismissed',
]);
export type ReviewTaskStatus = z.infer<typeof ReviewTaskStatusSchema>;

export const ChangeKindSchema = z.enum([
  'new_paper',
  'paper_updated',
  'new_trial',
  'trial_status_change',
  'trial_material_change',
  'results_posted',
  'safety_alert',
  'regulatory_update',
  'correction_or_retraction',
  'creator_claim',
  'evidence_assessment_update',
  'other',
]);
export type ChangeKind = z.infer<typeof ChangeKindSchema>;

export const EVIDENCE_MATURITY_LABELS: Record<EvidenceMaturity, string> = {
  social_anecdotal: 'Social / anecdotal',
  mechanistic_hypothesis: 'Mechanistic hypothesis',
  in_vitro_ex_vivo: 'In vitro / ex vivo',
  animal_model: 'Animal model',
  human_observational: 'Human observational',
  early_human_interventional: 'Early human interventional',
  controlled_clinical_trial: 'Controlled clinical trial',
  replicated_controlled_or_synthesis: 'Replicated / synthesis',
  regulatory_or_guideline_supported: 'Regulatory / guideline-supported',
};

export const TRANSLATION_GAP_LABELS: Record<TranslationGapType, string> = {
  cell_to_organism: 'Cell → organism',
  animal_to_human: 'Animal → human',
  disease_treatment_to_longevity: 'Disease treatment → longevity',
  biomarker_to_health_outcome: 'Biomarker → health outcome',
  short_term_to_durable: 'Short-term → durable benefit',
  association_to_causation: 'Association → causation',
  selected_sample_to_population: 'Selected sample → population',
};

export const REGULATORY_STATUS_LABELS: Record<RegulatoryStatus, string> = {
  approved: 'Approved',
  off_label: 'Off-label',
  investigational: 'Investigational',
  unapproved: 'Unapproved',
  prohibited: 'Prohibited',
  unknown: 'Unknown',
};

export const SAFETY_SEVERITY_LABELS: Record<SafetySeverity, string> = {
  info: 'Informational',
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  critical: 'Critical',
};
