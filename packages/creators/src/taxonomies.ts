/** Official M5 brief taxonomies for creator identity and claims. */

export const CREATOR_ROLES = [
  'researcher',
  'clinician',
  'patient_advocate',
  'educator',
  'journalist',
  'podcaster',
  'channel_operator',
  'organisation_spokesperson',
  'unknown',
] as const;
export type CreatorRole = (typeof CREATOR_ROLES)[number];

export const IDENTITY_CONFIDENCE_LEVELS = ['high', 'medium', 'low', 'unverified'] as const;
export type IdentityConfidence = (typeof IDENTITY_CONFIDENCE_LEVELS)[number];

export const CREATOR_LIFECYCLE_STATES = [
  'active',
  'merged',
  'redirected',
  'retired',
  'under_review',
] as const;

export const ROLE_PROVENANCE_STATES = [
  'declared',
  'documented',
  'reviewed',
  'withdrawn',
] as const;

export const CREATOR_CLAIM_KINDS = [
  'efficacy',
  'safety',
  'mechanism',
  'protocol',
  'regulatory',
  'personal_experience',
  'quotation',
  'correction',
  'disclosure',
  'other',
] as const;
export type CreatorClaimKind = (typeof CREATOR_CLAIM_KINDS)[number];

export const CREATOR_CLAIM_DIRECTIONS = [
  'benefit',
  'harm',
  'null',
  'mixed',
  'unclear',
  'not_applicable',
] as const;
export type CreatorClaimDirection = (typeof CREATOR_CLAIM_DIRECTIONS)[number];

export const CERTAINTY_LANGUAGE_LEVELS = [
  'certain',
  'probable',
  'possible',
  'speculative',
  'unknown',
] as const;
export type CertaintyLanguage = (typeof CERTAINTY_LANGUAGE_LEVELS)[number];

export function classifyCreatorClaimTaxonomy(
  claimText: string,
  assertionRole: string,
): {
  claimKind: CreatorClaimKind;
  direction: CreatorClaimDirection;
  certaintyLanguage: CertaintyLanguage;
} {
  const text = claimText.toLowerCase();
  let claimKind: CreatorClaimKind = 'other';
  if (assertionRole === 'disclosure') claimKind = 'disclosure';
  else if (assertionRole === 'correction') claimKind = 'correction';
  else if (assertionRole === 'quotation') claimKind = 'quotation';
  else if (/\b(fda|tga|approved|authoris|authoriz)/i.test(text)) claimKind = 'regulatory';
  else if (/\b(safe|safety|adverse|toxicity|side effect)/i.test(text)) claimKind = 'safety';
  else if (/\b(dose|protocol|stack|regimen|mg|iu)\b/i.test(text)) claimKind = 'protocol';
  else if (/\b(mechanism|pathway|receptor|autophagy)/i.test(text)) claimKind = 'mechanism';
  else if (/\b(i took|my experience|anecdotal|personally)/i.test(text)) claimKind = 'personal_experience';
  else if (/\b(improv\w*|reduc\w*|prevent\w*|extend\w*|benefit\w*|efficac\w*|works)\b/i.test(text))
    claimKind = 'efficacy';

  let direction: CreatorClaimDirection = 'unclear';
  if (assertionRole === 'question' || assertionRole === 'hypothetical') direction = 'not_applicable';
  else if (/\b(harm|toxic|danger|worsen|adverse)/i.test(text)) direction = 'harm';
  else if (/\b(no effect|null|no benefit|does not)/i.test(text)) direction = 'null';
  else if (/\b(mixed|depends|context)/i.test(text)) direction = 'mixed';
  else if (/\b(improv\w*|reduc\w*|prevent\w*|extend\w*|benefit\w*|safe)/i.test(text)) direction = 'benefit';

  let certaintyLanguage: CertaintyLanguage = 'unknown';
  if (/\b(proven|guarantees?|definitely|always|causes)\b/.test(text)) certaintyLanguage = 'certain';
  else if (/\b(likely|probably|suggests)\b/.test(text)) certaintyLanguage = 'probable';
  else if (/\b(may|might|could|possibly)\b/.test(text)) certaintyLanguage = 'possible';
  else if (/\b(hypothetically|speculate|unproven)\b/.test(text)) certaintyLanguage = 'speculative';
  else if (assertionRole === 'assertion') certaintyLanguage = 'probable';

  return { claimKind, direction, certaintyLanguage };
}

/** Redact actionable dosing instructions from claim text for display. */
export function redactActionableDosing(text: string): string {
  return text.replace(
    /\b(\d+(?:\.\d+)?\s*(?:mg|mcg|µg|ug|iu|ml|g)\b(?:\s*\/\s*(?:day|daily|week|wk))?)/gi,
    '[dose redacted]',
  );
}
