import { normalizeCreatorName } from './normalize.js';

export const CLAIM_EXTRACT_VERSION = 'm5.claims.1';
export const ALIGNMENT_RULES_VERSION = 'm5.alignment.11.1';

export type CreatorClaimDraft = {
  claimText: string;
  assertionRole: 'assertion' | 'question' | 'hypothetical' | 'quotation' | 'correction' | 'disclosure';
  excerpt: string;
  fieldPath: string;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
};

const ASSERTION_HINTS =
  /\b(extends|improves|reduces|prevents|causes|treats|reverses|increases|decreases|is safe|is proven|works for|cures)\b/i;
const QUESTION_HINTS = /\?$|^(what|why|how|does|is|are|can|should)\b/i;
const HYPOTHETICAL = /\b(might|may|could|possibly|hypothetically|if we assume)\b/i;
const DISCLOSURE = /\b(sponsor|sponsored|affiliate|conflict|disclosure|i was paid)\b/i;
const CORRECTION = /\b(correction|update|i was wrong|retract|previously said)\b/i;
const ANIMAL = /\b(mice|mouse|rat|rats|rodent|animal|in vivo)\b/i;
const HUMAN = /\b(human|patients?|participants?|adults?|people)\b/i;
const CAUSAL = /\b(causes?|causal|proves?|proven to|guarantees?)\b/i;
const REGULATORY = /\b(approved|fda|tga|authorised|authorized|unapproved)\b/i;
const SAFETY = /\b(safe|safety|adverse|toxicity|side effect)\b/i;
const MAGNITUDE = /\b(\d+\s*%|fold|doubles?|dramatically|massive|huge)\b/i;
const CITATION = /\b(doi:|pmid|nct\d+|study|trial|paper|meta-analysis)\b/i;

/**
 * Deterministic creator-claim extraction from user-supplied / authorised text only.
 * Questions are not silently converted into assertions.
 */
export function extractCreatorClaimsFromText(text: string, fieldPath = 'document.text'): CreatorClaimDraft[] {
  const chunks = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 24 && s.length <= 500);

  const drafts: CreatorClaimDraft[] = [];
  for (const chunk of chunks) {
    let assertionRole: CreatorClaimDraft['assertionRole'] = 'assertion';
    const reasons: string[] = [];
    if (DISCLOSURE.test(chunk)) {
      assertionRole = 'disclosure';
      reasons.push('Disclosure language detected');
    } else if (CORRECTION.test(chunk)) {
      assertionRole = 'correction';
      reasons.push('Correction language detected');
    } else if (QUESTION_HINTS.test(chunk.trim())) {
      assertionRole = 'question';
      reasons.push('Question form — not converted to assertion');
    } else if (HYPOTHETICAL.test(chunk)) {
      assertionRole = 'hypothetical';
      reasons.push('Hypothetical / modal language');
    } else if (!ASSERTION_HINTS.test(chunk)) {
      continue;
    } else {
      reasons.push('Assertive healthspan/longevity-like wording');
    }

    drafts.push({
      claimText: chunk,
      assertionRole,
      excerpt: chunk.slice(0, 240),
      fieldPath,
      confidence: assertionRole === 'assertion' ? 'medium' : 'low',
      reasons,
    });
  }
  return drafts.slice(0, 50);
}

/** Official brief §11.2 dimension states. */
export type AlignmentDimensionState =
  | 'aligned'
  | 'partially_aligned'
  | 'overstated'
  | 'understated'
  | 'not_comparable'
  | 'insufficient_information'
  | 'unresolved'
  | 'not_applicable'
  | 'source_unavailable';

export type AlignmentDimension = {
  id: string;
  label: string;
  state: AlignmentDimensionState;
  note: string;
  /** Adverse candidate findings require human review before Live profile prominence. */
  requiresHumanReview: boolean;
  candidateFinding?: string;
};

export const ALIGNMENT_DIMENSION_IDS = [
  'intervention_identity',
  'species_or_organism',
  'population',
  'study_design',
  'results_availability',
  'outcome_type',
  'result_direction',
  'effect_magnitude',
  'causality',
  'timeframe',
  'regulatory_scope',
  'safety_scope',
  'certainty_language',
  'evidence_recency',
  'source_citation',
] as const;

function dim(
  id: (typeof ALIGNMENT_DIMENSION_IDS)[number],
  label: string,
  state: AlignmentDimensionState,
  note: string,
  opts?: { requiresHumanReview?: boolean; candidateFinding?: string },
): AlignmentDimension {
  return {
    id,
    label,
    state,
    note,
    requiresHumanReview: Boolean(opts?.requiresHumanReview),
    candidateFinding: opts?.candidateFinding,
  };
}

/** Claim-to-evidence alignment — never a creator trust/worth score. */
export function alignCreatorClaim(opts: {
  claimText: string;
  assertionRole: string;
  linkedEvidenceCount: number;
  hasRegulatoryLink: boolean;
  hasInterventionLink: boolean;
}): { dimensions: AlignmentDimension[]; overallLabel: string; rulesVersion: string; findings: string[] } {
  const text = opts.claimText;
  const nonAssertion = opts.assertionRole !== 'assertion';
  const animal = ANIMAL.test(text);
  const human = HUMAN.test(text);
  const causal = CAUSAL.test(text);
  const regulatory = REGULATORY.test(text);
  const safety = SAFETY.test(text);
  const magnitude = MAGNITUDE.test(text);
  const citation = CITATION.test(text);
  const linked = opts.linkedEvidenceCount > 0;

  const dimensions: AlignmentDimension[] = [
    dim(
      'intervention_identity',
      'Intervention identity',
      opts.hasInterventionLink ? 'partially_aligned' : 'insufficient_information',
      opts.hasInterventionLink
        ? 'Linked to an M4 intervention entity; identity review may still be required.'
        : 'No reviewed intervention mapping yet.',
    ),
    dim(
      'species_or_organism',
      'Species / organism',
      animal && human
        ? 'not_comparable'
        : animal
          ? 'partially_aligned'
          : human
            ? 'partially_aligned'
            : 'insufficient_information',
      animal && human
        ? 'Claim mixes animal and human language without separable spans.'
        : animal
          ? 'Animal organism language detected; not treated as human evidence.'
          : human
            ? 'Human organism language detected; still needs linked study confirmation.'
            : 'Organism not clear from claim text.',
      animal && human
        ? { requiresHumanReview: true, candidateFinding: 'not_comparable' }
        : animal && !linked
          ? { requiresHumanReview: true, candidateFinding: 'animal_to_human_overreach' }
          : undefined,
    ),
    dim(
      'population',
      'Population',
      /healthy|patient|disease|frailty/i.test(text) ? 'partially_aligned' : 'insufficient_information',
      'Population must be taken from linked evidence; claim wording alone is not enough.',
    ),
    dim(
      'study_design',
      'Study design',
      linked ? 'unresolved' : 'insufficient_information',
      linked
        ? 'Linked evidence present; design comparability not yet scored.'
        : 'No linked study/assessment to compare design.',
    ),
    dim(
      'results_availability',
      'Results availability',
      linked ? 'partially_aligned' : 'insufficient_information',
      linked
        ? `${opts.linkedEvidenceCount} linked local evidence item(s) — not proof the creator is correct.`
        : 'No linked scientific claim/analysis yet.',
      !linked && opts.assertionRole === 'assertion'
        ? { requiresHumanReview: true, candidateFinding: 'unsupported_by_linked_local_evidence' }
        : undefined,
    ),
    dim(
      'outcome_type',
      'Outcome type',
      /biomarker|mortality|lifespan|healthspan|function/i.test(text)
        ? 'partially_aligned'
        : 'insufficient_information',
      'Outcome class inferred from wording only until evidence links exist.',
      /biomarker/i.test(text) && /healthspan|lifespan|mortality/i.test(text)
        ? {
            requiresHumanReview: true,
            candidateFinding: 'biomarker_to_health_outcome_overreach',
          }
        : undefined,
    ),
    dim(
      'result_direction',
      'Result direction',
      /improv|reduc|increas|decreas|prevent|extend/i.test(text)
        ? 'partially_aligned'
        : 'insufficient_information',
      'Direction taken from claim language; compare against linked results when available.',
    ),
    dim(
      'effect_magnitude',
      'Effect magnitude',
      magnitude ? 'unresolved' : 'not_applicable',
      magnitude
        ? 'Magnitude language present — compare only against linked numeric results.'
        : 'No strong magnitude language detected.',
      magnitude
        ? { requiresHumanReview: true, candidateFinding: 'overstates_effect_magnitude' }
        : undefined,
    ),
    dim(
      'causality',
      'Causality',
      causal ? 'unresolved' : HYPOTHETICAL.test(text) ? 'partially_aligned' : 'insufficient_information',
      causal
        ? 'Strong causal wording — do not upgrade linked associations into causation.'
        : 'Causal strength not asserted strongly in text.',
      causal
        ? { requiresHumanReview: true, candidateFinding: 'overstates_causality' }
        : undefined,
    ),
    dim(
      'timeframe',
      'Timeframe',
      /week|month|year|day|chronic|acute|long[- ]term/i.test(text)
        ? 'partially_aligned'
        : 'insufficient_information',
      'Timeframe must match linked evidence windows when present.',
    ),
    dim(
      'regulatory_scope',
      'Regulatory scope',
      opts.hasRegulatoryLink || regulatory
        ? opts.hasRegulatoryLink
          ? 'partially_aligned'
          : 'unresolved'
        : nonAssertion
          ? 'not_applicable'
          : 'not_applicable',
      opts.hasRegulatoryLink
        ? 'Scoped regulatory fact linked — not longevity authorisation.'
        : regulatory
          ? 'Regulatory wording in claim without linked scoped assertion.'
          : 'No regulatory claim scope detected.',
      regulatory && !opts.hasRegulatoryLink
        ? { requiresHumanReview: true, candidateFinding: 'regulatory_scope_overreach' }
        : undefined,
    ),
    dim(
      'safety_scope',
      'Safety scope',
      safety ? 'unresolved' : 'not_applicable',
      safety
        ? 'Safety language present — link only to scoped safety/regulatory sources.'
        : 'No safety claim detected.',
      safety ? { requiresHumanReview: true, candidateFinding: 'safety_scope_overreach' } : undefined,
    ),
    dim(
      'certainty_language',
      'Certainty language',
      nonAssertion
        ? 'not_applicable'
        : HYPOTHETICAL.test(text)
          ? 'partially_aligned'
          : causal
            ? 'overstated'
            : 'partially_aligned',
      nonAssertion
        ? `Treated as ${opts.assertionRole}; not scored as an efficacy claim.`
        : 'Preserve source certainty; never make wording stronger.',
      causal && opts.assertionRole === 'assertion'
        ? { requiresHumanReview: true, candidateFinding: 'overstates_evidence_maturity' }
        : undefined,
    ),
    dim(
      'evidence_recency',
      'Evidence recency',
      linked ? 'unresolved' : 'insufficient_information',
      'Recency can only be assessed against linked evidence timestamps.',
    ),
    dim(
      'source_citation',
      'Source citation',
      citation ? 'partially_aligned' : linked ? 'partially_aligned' : 'insufficient_information',
      citation || linked
        ? 'Citation or local evidence link present; verify identity before publishing findings.'
        : 'No citation cues or linked local evidence.',
    ),
  ];

  const findings = [
    ...new Set(
      dimensions
        .map((d) => d.candidateFinding)
        .filter((f): f is string => Boolean(f)),
    ),
  ];

  return {
    dimensions,
    findings,
    rulesVersion: ALIGNMENT_RULES_VERSION,
    overallLabel:
      'Alignment is multi-dimensional and claim-scoped. No creator trust, credibility, misinformation, influence, attention, engagement, or popularity score is computed.',
  };
}

export function claimRecurrenceKey(claimText: string): string {
  return normalizeCreatorName(claimText).slice(0, 200);
}
