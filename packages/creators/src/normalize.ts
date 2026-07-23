export const CREATOR_NORMALIZE_VERSION = 'm5.normalize.1';

export function normalizeCreatorName(input: string): string {
  return input
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export const CREATOR_KINDS = [
  'individual',
  'organisation',
  'channel_brand',
  'podcast_host_reference_only',
  'unknown',
] as const;

export type CreatorKind = (typeof CREATOR_KINDS)[number];

/** Prohibited creator-level judgements — never computed or displayed. */
export const CREATOR_PROHIBITED_SCORES = [
  'trust_score',
  'credibility_score',
  'misinformation_rank',
  'influence_score',
  'attention_score',
  'engagement_score',
  'popularity_score',
] as const;
