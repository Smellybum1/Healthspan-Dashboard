export const RULESET_VERSION = 'm3.deterministic.1';
export const SEGMENT_BUILDER_VERSION = 'm3.segments.1';
export const CLAIM_SCHEMA_VERSION = 'm3.claims.1';
export const PROMPT_VERSION = 'm3.prompt.none';

export type AnalysisMode = 'deterministic' | 'ai_assisted' | 'human_reviewed_projection';

export type ClassificationConfidence = 'high' | 'medium' | 'low' | 'insufficient';

export type EvidenceAvailability =
  | 'protocol_only'
  | 'results_reported'
  | 'results_posted_registry'
  | 'peer_reviewed_results'
  | 'regulatory_statement'
  | 'unknown';
