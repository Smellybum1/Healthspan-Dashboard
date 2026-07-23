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

  return {
    studyDesign: String(record.studyDesign ?? record.overallStatus ?? 'unspecified'),
    evidenceAvailability,
    evidenceMaturity,
    organismLevel,
    populationContext: null,
    resultsPresent,
    retractionOrCorrection: false,
    classificationConfidence,
    translationGaps,
    methodologicalSignals,
    whatWouldChange,
  };
}

export function buildClaims(
  record: NormalizedLiveRecord,
  profile: StudyProfileDraft,
  segments: EvidenceTextSegment[],
): ClaimDraft[] {
  const primary = segments.find((s) => s.kind === 'summary') ?? segments.find((s) => s.kind === 'title');
  if (!primary) return [];

  const role =
    record.type === 'trial' && !profile.resultsPresent
      ? 'protocol_intent'
      : record.type === 'regulatory_event'
        ? 'regulatory_statement'
        : 'reported_finding';

  const claimText =
    record.type === 'trial' && !profile.resultsPresent
      ? `Registry protocol/plan: ${record.title ?? 'Untitled trial'} (results not posted).`
      : primary.text.slice(0, 280);

  const fingerprint = hashText(
    [record.type, role, claimText, primary.textHash, profile.evidenceMaturity].join('|'),
  );

  return [
    {
      fingerprint,
      claimKind: record.type === 'regulatory_event' ? 'safety_regulatory' : 'scientific',
      assertionRole: role,
      claimText,
      direction: 'unspecified',
      outcomeFamily: null,
      classificationConfidence: profile.classificationConfidence,
      primaryExcerpt: primary.text.slice(0, 240),
      fieldPath: primary.fieldPath,
    },
  ];
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
