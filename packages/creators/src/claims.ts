import { normalizeCreatorName } from './normalize.js';

export const CLAIM_EXTRACT_VERSION = 'm5.claims.1';

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
      // Keep as low-confidence assertion candidate only when claim-like verbs appear;
      // otherwise skip non-claim chatter.
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

export type AlignmentDimension = {
  id: string;
  label: string;
  state: 'aligned' | 'partial' | 'conflict_candidate' | 'unsupported' | 'not_checked' | 'not_applicable';
  note: string;
};

/** Claim-to-evidence alignment — never a creator trust/worth score. */
export function alignCreatorClaim(opts: {
  claimText: string;
  assertionRole: string;
  linkedEvidenceCount: number;
  hasRegulatoryLink: boolean;
  hasInterventionLink: boolean;
}): { dimensions: AlignmentDimension[]; overallLabel: string } {
  const dimensions: AlignmentDimension[] = [
    {
      id: 'scientific_link',
      label: 'Linked scientific evidence',
      state: opts.linkedEvidenceCount > 0 ? 'partial' : 'unsupported',
      note:
        opts.linkedEvidenceCount > 0
          ? `${opts.linkedEvidenceCount} linked M3 analyses/claims (not proof the creator is correct).`
          : 'No linked scientific claim/analysis yet.',
    },
    {
      id: 'intervention_link',
      label: 'Intervention dossier link',
      state: opts.hasInterventionLink ? 'partial' : 'not_checked',
      note: opts.hasInterventionLink
        ? 'Linked to an M4 intervention entity; register inclusion is separate.'
        : 'No intervention mapping yet.',
    },
    {
      id: 'regulatory_link',
      label: 'Regulatory assertion link',
      state: opts.hasRegulatoryLink ? 'partial' : 'not_applicable',
      note: opts.hasRegulatoryLink
        ? 'Scoped regulatory fact linked — not longevity authorisation.'
        : 'No regulatory link.',
    },
    {
      id: 'speech_act',
      label: 'Speech-act role',
      state: opts.assertionRole === 'assertion' ? 'partial' : 'not_applicable',
      note: `Treated as ${opts.assertionRole}; questions/hypotheticals are not efficacy claims.`,
    },
  ];

  return {
    dimensions,
    overallLabel:
      'Alignment is multi-dimensional and claim-scoped. No creator trust, credibility, misinformation, influence, attention, engagement, or popularity score is computed.',
  };
}

export function claimRecurrenceKey(claimText: string): string {
  return normalizeCreatorName(claimText).slice(0, 200);
}
