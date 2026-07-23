import { createHash } from 'node:crypto';
import type { EvidenceAvailability, ClassificationConfidence } from './versions.js';
import type { EvidenceMaturity } from '@healthspan/core';

export type NormalizedLiveRecord = {
  type: string;
  title?: string | null;
  summary?: string | null;
  studyDesign?: string | null;
  overallStatus?: string | null;
  resultsPosted?: boolean | null;
  phases?: string[] | null;
  journal?: string | null;
  pmid?: string | null;
  doi?: string | null;
  nctId?: string | null;
  australiaLocation?: boolean | null;
  relevanceMatched?: boolean | null;
  canonicalUrl?: string | null;
  [key: string]: unknown;
};

export type EvidenceTextSegment = {
  kind: string;
  fieldPath: string;
  text: string;
  textHash: string;
};

export type StudyProfileDraft = {
  studyDesign: string;
  evidenceAvailability: EvidenceAvailability;
  evidenceMaturity: EvidenceMaturity;
  organismLevel: string;
  populationContext: string | null;
  resultsPresent: boolean;
  retractionOrCorrection: boolean;
  classificationConfidence: ClassificationConfidence;
  translationGaps: string[];
  methodologicalSignals: Array<{ code: string; state: string; explanation: string }>;
  whatWouldChange: string[];
  potentialHallmarks: Array<{
    hallmark: string;
    relationship: 'potential';
    method: 'keyword_heuristic';
    confidence: 'low';
  }>;
};

export type ClaimDraft = {
  fingerprint: string;
  claimKind: string;
  assertionRole: string;
  claimText: string;
  direction: string;
  outcomeFamily: string | null;
  classificationConfidence: ClassificationConfidence;
  primaryExcerpt: string;
  fieldPath: string;
};

export function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export function buildSegments(record: NormalizedLiveRecord): EvidenceTextSegment[] {
  const segments: EvidenceTextSegment[] = [];
  const push = (kind: string, fieldPath: string, text: unknown) => {
    if (!text) return;
    const value = String(text).trim();
    if (!value) return;
    segments.push({ kind, fieldPath, text: value, textHash: hashText(value) });
  };
  push('title', 'normalized.title', record.title);
  push('summary', 'normalized.summary', record.summary);
  push('study_design', 'normalized.studyDesign', record.studyDesign);
  push('status', 'normalized.overallStatus', record.overallStatus);
  push('journal', 'normalized.journal', record.journal);
  if (Array.isArray(record.phases)) {
    push('phases', 'normalized.phases', record.phases.join(', '));
  }
  return segments;
}

export function classifyStudyProfile(record: NormalizedLiveRecord): StudyProfileDraft {
  const type = record.type;
  const resultsPresent = Boolean(record.resultsPosted);
  const design = String(record.studyDesign ?? record.overallStatus ?? 'unknown').toLowerCase();

  let evidenceAvailability: EvidenceAvailability = 'unknown';
  let evidenceMaturity: EvidenceMaturity = 'mechanistic_hypothesis';
  let organismLevel = 'unknown';
  const translationGaps: string[] = [];
  const methodologicalSignals: StudyProfileDraft['methodologicalSignals'] = [];
  const whatWouldChange: string[] = [];

  if (type === 'trial') {
    evidenceAvailability = resultsPresent ? 'results_posted_registry' : 'protocol_only';
    evidenceMaturity = resultsPresent
      ? 'early_human_interventional'
      : 'early_human_interventional';
    organismLevel = 'human';
    if (!resultsPresent) {
      translationGaps.push('protocol_to_results');
      whatWouldChange.push('Posted primary results with outcome measures and participant counts.');
      methodologicalSignals.push({
        code: 'results_not_posted',
        state: 'absent',
        explanation: 'Registry record does not yet report results; treat as protocol/plan only.',
      });
    } else {
      whatWouldChange.push('Peer-reviewed full results publication and independent replication.');
    }
  } else if (type === 'paper' || type === 'paper_enrichment') {
    evidenceAvailability = 'peer_reviewed_results';
    if (design.includes('animal') || design.includes('mice') || design.includes('mouse')) {
      evidenceMaturity = 'animal_model';
      organismLevel = 'animal';
      translationGaps.push('animal_to_human');
      whatWouldChange.push('Controlled human interventional evidence on the same outcome.');
    } else if (design.includes('in_vitro') || design.includes('cell')) {
      evidenceMaturity = 'in_vitro_ex_vivo';
      organismLevel = 'cell';
      translationGaps.push('cell_to_organism');
      whatWouldChange.push('Organism-level and then human evidence.');
    } else if (design.includes('review') || design.includes('meta')) {
      evidenceMaturity = 'replicated_controlled_or_synthesis';
      organismLevel = 'human_or_mixed';
    } else if (design.includes('observ')) {
      evidenceMaturity = 'human_observational';
      organismLevel = 'human';
      translationGaps.push('observational_to_interventional');
      whatWouldChange.push('Randomized or otherwise controlled human interventional data.');
    } else {
      evidenceMaturity = 'early_human_interventional';
      organismLevel = 'human';
      whatWouldChange.push('Larger controlled trials and independent replication.');
    }
  } else if (type === 'regulatory_event') {
    evidenceAvailability = 'regulatory_statement';
    evidenceMaturity = 'regulatory_or_guideline_supported';
    organismLevel = 'human';
    whatWouldChange.push('Updated regulator notice or label change.');
  } else {
    evidenceMaturity = 'social_anecdotal';
    evidenceAvailability = 'unknown';
    whatWouldChange.push('Primary-source paper, trial, or regulator statement.');
  }

  const classificationConfidence: ClassificationConfidence =
    type === 'trial' || type === 'paper' || type === 'regulatory_event' ? 'medium' : 'low';

  const summary = `${record.title ?? ''} ${record.summary ?? ''}`.toLowerCase();
  let populationContext: string | null = null;
  if (summary.includes('adult')) populationContext = 'adults';
  else if (summary.includes('older') || summary.includes('elderly')) populationContext = 'older_adults';
  else if (organismLevel === 'human') populationContext = 'human_unspecified';
  else if (organismLevel === 'unknown') populationContext = null;
  else populationContext = organismLevel;

  const retractionOrCorrection = Boolean(record.retractionOrCorrection);

  return {
    studyDesign: String(record.studyDesign ?? record.overallStatus ?? 'unspecified'),
    evidenceAvailability,
    evidenceMaturity,
    organismLevel,
    populationContext,
    resultsPresent,
    retractionOrCorrection,
    classificationConfidence: retractionOrCorrection ? 'low' : classificationConfidence,
    translationGaps,
    methodologicalSignals: retractionOrCorrection
      ? [
          ...methodologicalSignals,
          {
            code: 'retraction_or_correction',
            state: 'present',
            explanation: 'Correction/retraction signal overrides ordinary presentation until reviewed.',
          },
        ]
      : methodologicalSignals,
    whatWouldChange,
    potentialHallmarks: inferPotentialHallmarks(summary),
  };
}

function inferPotentialHallmarks(text: string): Array<{
  hallmark: string;
  relationship: 'potential';
  method: 'keyword_heuristic';
  confidence: 'low';
}> {
  const out: Array<{
    hallmark: string;
    relationship: 'potential';
    method: 'keyword_heuristic';
    confidence: 'low';
  }> = [];
  const rules: Array<[string, string]> = [
    ['telomere', 'telomere_attrition'],
    ['senescen', 'cellular_senescence'],
    ['mitochond', 'mitochondrial_dysfunction'],
    ['inflam', 'chronic_inflammation'],
    ['autophagy', 'disabled_macroautophagy'],
  ];
  for (const [needle, hallmark] of rules) {
    if (text.includes(needle)) {
      out.push({
        hallmark,
        relationship: 'potential',
        method: 'keyword_heuristic',
        confidence: 'low',
      });
    }
  }
  return out;
}

export function buildClaims(
  record: NormalizedLiveRecord,
  profile: StudyProfileDraft,
  segments: EvidenceTextSegment[],
): ClaimDraft[] {
  const role =
    record.type === 'trial' && !profile.resultsPresent
      ? 'protocol_intent'
      : record.type === 'regulatory_event'
        ? 'regulatory_statement'
        : 'reported_finding';

  const maxClaims = Math.min(
    12,
    Math.max(1, Number(process.env.HEALTHSPAN_MAX_CLAIMS_PER_ITEM ?? 6)),
  );

  const preferredKinds =
    record.type === 'trial' && !profile.resultsPresent
      ? ['title', 'summary', 'study_design']
      : record.type === 'regulatory_event'
        ? ['summary', 'title']
        : ['summary', 'title', 'study_design'];

  const ordered = [
    ...preferredKinds
      .map((kind) => segments.find((s) => s.kind === kind))
      .filter((s): s is EvidenceTextSegment => Boolean(s)),
    ...segments.filter((s) => !preferredKinds.includes(s.kind)),
  ];

  const uniqueSegments: EvidenceTextSegment[] = [];
  const seenHashes = new Set<string>();
  for (const segment of ordered) {
    if (seenHashes.has(segment.textHash)) continue;
    seenHashes.add(segment.textHash);
    uniqueSegments.push(segment);
    if (uniqueSegments.length >= maxClaims) break;
  }

  if (uniqueSegments.length === 0) return [];

  const claims: ClaimDraft[] = [];
  for (const segment of uniqueSegments) {
    const text = segment.text.toLowerCase();
    let outcomeFamily: string | null = null;
    if (text.includes('lifespan') || text.includes('mortality')) outcomeFamily = 'lifespan_mortality';
    else if (text.includes('biomarker') || text.includes('hdl') || text.includes('crp')) {
      outcomeFamily = 'biomarker';
    } else if (text.includes('function') || text.includes('gait') || text.includes('vo2')) {
      outcomeFamily = 'function';
    } else if (text.includes('safety') || text.includes('adverse')) outcomeFamily = 'safety';

    let claimText =
      record.type === 'trial' && !profile.resultsPresent && segment.kind === 'title'
        ? `Registry protocol/plan: ${record.title ?? 'Untitled trial'} (results not posted).`
        : segment.text.slice(0, 280);
    if (outcomeFamily === 'biomarker' && /lifespan extension|extends lifespan|prolongs life/i.test(claimText)) {
      claimText = `${claimText.slice(0, 200)} [biomarker-only; not demonstrated lifespan extension]`;
    }
    if (profile.organismLevel === 'animal' || profile.organismLevel === 'cell') {
      claimText = `${claimText} [${profile.organismLevel} evidence — not human evidence]`;
    }

    let direction = 'unspecified';
    if (/\b(improv|increas|benefit|positiv)/i.test(text) && !/\b(worsen|decreas|reduc)/i.test(text)) {
      direction = 'positive';
    } else if (/\b(worsen|adverse|harm)/i.test(text)) {
      direction = 'negative';
    }

    const assertionRole =
      segment.kind === 'study_design' && record.type === 'trial' && !profile.resultsPresent
        ? 'protocol_intent'
        : role;

    const fingerprint = hashText(
      [record.type, assertionRole, claimText, segment.textHash, profile.evidenceMaturity].join('|'),
    );

    claims.push({
      fingerprint,
      claimKind: record.type === 'regulatory_event' ? 'safety_regulatory' : 'scientific',
      assertionRole,
      claimText,
      direction,
      outcomeFamily,
      classificationConfidence: profile.classificationConfidence,
      primaryExcerpt: segment.text.slice(0, 240),
      fieldPath: segment.fieldPath,
    });
  }

  return claims;
}

export function researchActivityScore(input: {
  evidenceMaturity: EvidenceMaturity;
  resultsPresent: boolean;
  recent: boolean;
}): number {
  const maturityWeight: Record<EvidenceMaturity, number> = {
    social_anecdotal: 0.1,
    mechanistic_hypothesis: 0.2,
    in_vitro_ex_vivo: 0.3,
    animal_model: 0.35,
    human_observational: 0.45,
    early_human_interventional: 0.55,
    controlled_clinical_trial: 0.75,
    replicated_controlled_or_synthesis: 0.85,
    regulatory_or_guideline_supported: 0.9,
  };
  let score = maturityWeight[input.evidenceMaturity] ?? 0.2;
  if (input.resultsPresent) score += 0.1;
  if (input.recent) score += 0.05;
  return Math.max(0, Math.min(1, score));
}
