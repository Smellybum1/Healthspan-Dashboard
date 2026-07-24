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

/** Optional linked-evidence context for richer §11 dimension rules. */
export type AlignmentEvidenceHints = {
  linkedEvidenceCount?: number;
  hasRegulatoryLink?: boolean;
  hasInterventionLink?: boolean;
  evidenceOrganism?: 'animal' | 'human' | 'in_vitro' | 'mixed' | 'unknown';
  evidencePopulation?: 'healthy' | 'disease_specific' | 'mixed' | 'unknown';
  claimOrganism?: 'animal' | 'human' | 'mixed' | 'unknown';
  claimPopulation?: 'healthy' | 'disease_specific' | 'mixed' | 'unknown';
  protocolOnly?: boolean;
  biomarkerOnly?: boolean;
  healthOutcomeClaimed?: boolean;
  magnitudeOverstated?: boolean;
  causalityOverstated?: boolean;
  regulatoryMismatch?: boolean;
  safetyOverreach?: boolean;
  potentialConflict?: boolean;
  evidenceUpdated?: boolean;
  retracted?: boolean;
  sourceUnavailable?: boolean;
};

/** Claim-to-evidence alignment — never a creator trust/worth score. */
export function alignCreatorClaim(opts: {
  claimText: string;
  assertionRole: string;
  linkedEvidenceCount: number;
  hasRegulatoryLink: boolean;
  hasInterventionLink: boolean;
  evidence?: AlignmentEvidenceHints;
}): { dimensions: AlignmentDimension[]; overallLabel: string; rulesVersion: string; findings: string[] } {
  const text = opts.claimText;
  const ev = opts.evidence ?? {};
  const nonAssertion = opts.assertionRole !== 'assertion' && opts.assertionRole !== 'correction';
  const animal = ANIMAL.test(text) || ev.claimOrganism === 'animal' || ev.evidenceOrganism === 'animal';
  const human = HUMAN.test(text) || ev.claimOrganism === 'human' || ev.evidenceOrganism === 'human';
  const mixedOrganism =
    ev.evidenceOrganism === 'mixed' ||
    ev.claimOrganism === 'mixed' ||
    (animal && human && (ev.evidenceOrganism === 'animal' || /mice and humans|mouse and human|interchangeable/i.test(text)));
  const speciesMismatch =
    (ev.evidenceOrganism === 'animal' && (ev.claimOrganism === 'human' || HUMAN.test(text))) ||
    (/human|people|patients?/i.test(text) && /mice|mouse|rat|rodent|animal/i.test(text));
  const causal = CAUSAL.test(text) || Boolean(ev.causalityOverstated);
  const regulatory = REGULATORY.test(text) || Boolean(ev.regulatoryMismatch);
  const safety = SAFETY.test(text) || Boolean(ev.safetyOverreach);
  const magnitude = MAGNITUDE.test(text) || Boolean(ev.magnitudeOverstated);
  const citation = CITATION.test(text);
  const linked = opts.linkedEvidenceCount > 0;
  const populationMismatch =
    Boolean(ev.evidencePopulation) &&
    Boolean(ev.claimPopulation) &&
    ev.evidencePopulation !== ev.claimPopulation &&
    ev.evidencePopulation !== 'mixed' &&
    ev.claimPopulation !== 'mixed';

  const extraFindings: string[] = [];
  if (ev.sourceUnavailable) extraFindings.push('source_unavailable');
  if (ev.retracted) extraFindings.push('superseded_or_corrected');
  if (ev.potentialConflict) extraFindings.push('potentially_conflicts_with_current_evidence');
  if (ev.protocolOnly) extraFindings.push('protocol_as_result');
  if (ev.biomarkerOnly && (ev.healthOutcomeClaimed || /lifespan|healthspan|mortality/i.test(text))) {
    extraFindings.push('biomarker_to_health_outcome_overreach');
  }
  if (ev.regulatoryMismatch) extraFindings.push('regulatory_scope_overreach');
  if (ev.safetyOverreach) extraFindings.push('safety_scope_overreach');
  if (ev.magnitudeOverstated) extraFindings.push('overstates_effect_magnitude');
  if (ev.causalityOverstated) extraFindings.push('overstates_causality');
  if (speciesMismatch) extraFindings.push('animal_to_human_overreach');
  if (populationMismatch || mixedOrganism) extraFindings.push('not_comparable');
  if (ev.evidenceUpdated) extraFindings.push('unresolved');

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
      mixedOrganism || (animal && human && speciesMismatch)
        ? 'not_comparable'
        : speciesMismatch
          ? 'not_comparable'
          : animal
            ? 'partially_aligned'
            : human
              ? 'partially_aligned'
              : 'insufficient_information',
      speciesMismatch
        ? 'Species/organism mismatch between claim wording and linked evidence.'
        : animal && human
          ? 'Claim mixes animal and human language without separable spans.'
          : animal
            ? 'Animal organism language detected; not treated as human evidence.'
            : human
              ? 'Human organism language detected; still needs linked study confirmation.'
              : 'Organism not clear from claim text.',
      speciesMismatch || (animal && human)
        ? {
            requiresHumanReview: true,
            candidateFinding: speciesMismatch ? 'animal_to_human_overreach' : 'not_comparable',
          }
        : animal && !linked
          ? { requiresHumanReview: true, candidateFinding: 'animal_to_human_overreach' }
          : undefined,
    ),
    dim(
      'population',
      'Population',
      populationMismatch
        ? 'not_comparable'
        : /healthy|patient|disease|frailty/i.test(text)
          ? 'partially_aligned'
          : 'insufficient_information',
      populationMismatch
        ? 'Claim population does not match linked evidence population.'
        : 'Population must be taken from linked evidence; claim wording alone is not enough.',
      populationMismatch
        ? { requiresHumanReview: true, candidateFinding: 'not_comparable' }
        : undefined,
    ),
    dim(
      'study_design',
      'Study design',
      ev.protocolOnly ? 'not_comparable' : linked ? 'unresolved' : 'insufficient_information',
      ev.protocolOnly
        ? 'Protocol/methods text is not a result.'
        : linked
          ? 'Linked evidence present; design comparability not yet scored.'
          : 'No linked study/assessment to compare design.',
      ev.protocolOnly
        ? { requiresHumanReview: true, candidateFinding: 'protocol_as_result' }
        : undefined,
    ),
    dim(
      'results_availability',
      'Results availability',
      ev.sourceUnavailable
        ? 'source_unavailable'
        : linked
          ? 'partially_aligned'
          : 'insufficient_information',
      ev.sourceUnavailable
        ? 'Supporting platform/document source is unavailable; claim cannot stay current on that span.'
        : linked
          ? `${opts.linkedEvidenceCount} linked local evidence item(s) — not proof the creator is correct.`
          : 'No linked scientific claim/analysis yet. No supporting source is linked in the current local corpus.',
      ev.sourceUnavailable
        ? { requiresHumanReview: true, candidateFinding: 'source_unavailable' }
        : !linked && opts.assertionRole === 'assertion'
          ? { requiresHumanReview: true, candidateFinding: 'unsupported_by_linked_local_evidence' }
          : undefined,
    ),
    dim(
      'outcome_type',
      'Outcome type',
      ev.biomarkerOnly && (ev.healthOutcomeClaimed || /lifespan|healthspan|mortality/i.test(text))
        ? 'overstated'
        : /biomarker|mortality|lifespan|healthspan|function/i.test(text)
          ? 'partially_aligned'
          : 'insufficient_information',
      'Outcome class inferred from wording and linked evidence class.',
      ev.biomarkerOnly && (ev.healthOutcomeClaimed || /lifespan|healthspan|mortality/i.test(text))
        ? {
            requiresHumanReview: true,
            candidateFinding: 'biomarker_to_health_outcome_overreach',
          }
        : /biomarker/i.test(text) && /healthspan|lifespan|mortality/i.test(text)
          ? {
              requiresHumanReview: true,
              candidateFinding: 'biomarker_to_health_outcome_overreach',
            }
          : undefined,
    ),
    dim(
      'result_direction',
      'Result direction',
      ev.potentialConflict
        ? 'unresolved'
        : /improv|reduc|increas|decreas|prevent|extend|benefit|harm/i.test(text)
          ? 'partially_aligned'
          : 'insufficient_information',
      ev.potentialConflict
        ? 'Potential disagreement with linked evidence — not a definitive contradiction.'
        : 'Direction taken from claim language; compare against linked results when available.',
      ev.potentialConflict
        ? {
            requiresHumanReview: true,
            candidateFinding: 'potentially_conflicts_with_current_evidence',
          }
        : undefined,
    ),
    dim(
      'effect_magnitude',
      'Effect magnitude',
      magnitude ? 'overstated' : 'not_applicable',
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
      causal ? 'overstated' : HYPOTHETICAL.test(text) ? 'partially_aligned' : 'insufficient_information',
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
      /week|month|year|day|chronic|acute|long[- ]term|overnight/i.test(text)
        ? 'partially_aligned'
        : 'insufficient_information',
      'Timeframe must match linked evidence windows when present.',
    ),
    dim(
      'regulatory_scope',
      'Regulatory scope',
      ev.regulatoryMismatch || (regulatory && !opts.hasRegulatoryLink)
        ? 'overstated'
        : opts.hasRegulatoryLink
          ? 'partially_aligned'
          : regulatory
            ? 'unresolved'
            : 'not_applicable',
      opts.hasRegulatoryLink && !ev.regulatoryMismatch
        ? 'Scoped regulatory fact linked — not longevity authorisation.'
        : regulatory || ev.regulatoryMismatch
          ? 'Regulatory wording exceeds linked jurisdiction/indication scope.'
          : 'No regulatory claim scope detected.',
      ev.regulatoryMismatch || (regulatory && (!opts.hasRegulatoryLink || /aging|longevity|healthspan/i.test(text)))
        ? { requiresHumanReview: true, candidateFinding: 'regulatory_scope_overreach' }
        : undefined,
    ),
    dim(
      'safety_scope',
      'Safety scope',
      safety || ev.safetyOverreach ? 'overstated' : 'not_applicable',
      safety || ev.safetyOverreach
        ? 'Safety language present — link only to scoped safety/regulatory sources.'
        : 'No safety claim detected.',
      safety || ev.safetyOverreach
        ? { requiresHumanReview: true, candidateFinding: 'safety_scope_overreach' }
        : undefined,
    ),
    dim(
      'certainty_language',
      'Certainty language',
      nonAssertion || opts.assertionRole === 'correction'
        ? 'not_applicable'
        : HYPOTHETICAL.test(text)
          ? 'partially_aligned'
          : causal
            ? 'overstated'
            : 'partially_aligned',
      nonAssertion || opts.assertionRole === 'correction'
        ? `Treated as ${opts.assertionRole}; not scored as an efficacy claim.`
        : 'Preserve source certainty; never make wording stronger.',
      causal && opts.assertionRole === 'assertion'
        ? { requiresHumanReview: true, candidateFinding: 'overstates_evidence_maturity' }
        : undefined,
    ),
    dim(
      'evidence_recency',
      'Evidence recency',
      ev.evidenceUpdated || ev.retracted
        ? 'unresolved'
        : linked
          ? 'unresolved'
          : 'insufficient_information',
      ev.retracted
        ? 'Linked evidence retracted/corrected — prior alignment is historical only.'
        : ev.evidenceUpdated
          ? 'Linked evidence changed; alignment is stale until reassessed.'
          : 'Recency can only be assessed against linked evidence timestamps.',
      ev.retracted
        ? { requiresHumanReview: true, candidateFinding: 'superseded_or_corrected' }
        : undefined,
    ),
    dim(
      'source_citation',
      'Source citation',
      ev.sourceUnavailable
        ? 'source_unavailable'
        : citation
          ? 'partially_aligned'
          : linked
            ? 'partially_aligned'
            : 'insufficient_information',
      ev.sourceUnavailable
        ? 'Source unavailable for citation display.'
        : citation || linked
          ? 'Citation or local evidence link present; verify identity before publishing findings.'
          : 'No citation cues or linked local evidence.',
    ),
  ];

  const findings = [
    ...new Set([
      ...extraFindings,
      ...dimensions.map((d) => d.candidateFinding).filter((f): f is string => Boolean(f)),
    ]),
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
