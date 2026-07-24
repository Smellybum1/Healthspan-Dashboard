/**
 * Reserved optional AI path for creator claim assist (brief §19 / J6–J10).
 * Default: disabled. Never required for M5 completion. No model calls in default tests.
 */

export const CREATOR_AI_RESERVED_PATH_VERSION = 'm5.creator-ai.reserved.1';

export type CreatorAiGate =
  | { allowed: false; reason: string }
  | { allowed: true; constraints: string[] };

export function isCreatorAiEnabled(): boolean {
  return process.env.HEALTHSPAN_CREATOR_AI_ENABLED === 'true';
}

/**
 * Gate external AI for creator segments. YouTube metadata and X content are hard-blocked.
 */
export function gateCreatorAiSegment(opts: {
  enabled?: boolean;
  rightsEligible: boolean;
  sourceKind: 'user_document_segment' | 'youtube_metadata' | 'x_content' | 'other';
  segmentCharCount: number;
  maxSegmentChars?: number;
}): CreatorAiGate {
  const enabled = opts.enabled ?? isCreatorAiEnabled();
  if (!enabled) {
    return { allowed: false, reason: 'creator_ai_disabled_by_default' };
  }
  if (opts.sourceKind === 'youtube_metadata') {
    return { allowed: false, reason: 'youtube_metadata_cannot_reach_external_ai' };
  }
  if (opts.sourceKind === 'x_content') {
    return { allowed: false, reason: 'x_content_cannot_reach_external_ai' };
  }
  if (!opts.rightsEligible) {
    return { allowed: false, reason: 'rights_ineligible_segment' };
  }
  const max = opts.maxSegmentChars ?? 2_000;
  if (opts.segmentCharCount > max) {
    return { allowed: false, reason: 'segment_exceeds_minimal_bound' };
  }
  return {
    allowed: true,
    constraints: [
      'schema_constrained_output_required',
      'source_bound_excerpts_only',
      'no_auto_publish_adverse_findings',
      'no_creator_ranking_or_motive_inference',
      'no_sponsorship_inference',
      'no_model_training_or_fine_tuning',
    ],
  };
}

export function creatorAiPolicyNotes(): string[] {
  return [
    'AI remains disabled by default and is not required for M5 completion.',
    'Only rights-eligible user-supplied segments may reach external AI when explicitly enabled.',
    'YouTube API metadata and X content never reach external AI.',
    'AI candidates never auto-publish adverse findings; human review is required.',
    'AI cannot rank creators or infer motives/sponsorship.',
    'No model training or fine-tuning is performed.',
  ];
}
