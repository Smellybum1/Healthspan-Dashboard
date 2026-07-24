import { alignCreatorClaim, type AlignmentDimensionState } from './claims.js';

export type AlignmentEvidenceContext = {
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

export type AlignmentPairCase = {
  id: string;
  category:
    | 'fully_aligned'
    | 'partially_aligned'
    | 'species_mismatch'
    | 'population_mismatch'
    | 'protocol_as_result'
    | 'biomarker_overreach'
    | 'effect_magnitude_overreach'
    | 'causality_overreach'
    | 'regulatory_indication_mismatch'
    | 'safety_scope_overreach'
    | 'not_comparable'
    | 'potential_conflict'
    | 'evidence_update'
    | 'retraction'
    | 'source_unavailable'
    | 'no_linked_local_evidence';
  claimText: string;
  assertionRole: string;
  evidence: AlignmentEvidenceContext;
  /** At least one of these findings must appear (when non-empty). */
  expectAnyFindings: string[];
  /** Dimension id → required state (subset). */
  expectDimensionStates?: Partial<Record<string, AlignmentDimensionState>>;
};

function variants(prefix: string, texts: string[]): string[] {
  return texts.map((t, i) => `${prefix}${i + 1}: ${t}`);
}

function buildCorpus(): AlignmentPairCase[] {
  const cases: AlignmentPairCase[] = [];

  const alignedTexts = variants('Aligned', [
    'Metformin reduces glucose in adults with type 2 diabetes in linked human trials.',
    'Exercise improves cardiorespiratory fitness in healthy adults in reviewed studies.',
    'A linked human RCT reported lower HbA1c with metformin versus placebo.',
    'Reviewed trial status shows an ongoing longevity-adjacent metformin study.',
    'Linked evidence supports a biomarker change without claiming lifespan extension.',
    'A scoped TGA listing exists for a metformin product for diabetes indication.',
  ]);
  for (const claimText of alignedTexts) {
    cases.push({
      id: `align-${cases.length + 1}`,
      category: 'fully_aligned',
      claimText,
      assertionRole: 'assertion',
      evidence: {
        linkedEvidenceCount: 2,
        hasInterventionLink: true,
        hasRegulatoryLink: /TGA|FDA|approved/i.test(claimText),
        evidenceOrganism: 'human',
        claimOrganism: 'human',
        evidencePopulation: 'disease_specific',
        claimPopulation: 'disease_specific',
      },
      expectAnyFindings: [],
      expectDimensionStates: {
        results_availability: 'partially_aligned',
        intervention_identity: 'partially_aligned',
      },
    });
  }

  const partialTexts = variants('Partial', [
    'Metformin may improve aging markers, pending stronger human data.',
    'Rapamycin might extend healthspan; linked evidence is mixed.',
    'NMN could support NAD pathways based on early linked work.',
    'Sleep extension possibly affects metabolic markers in linked cohorts.',
    'Protein timing might matter for older adults in limited linked studies.',
    'Cold exposure may change brown-fat markers in small linked samples.',
  ]);
  for (const claimText of partialTexts) {
    cases.push({
      id: `partial-${cases.length + 1}`,
      category: 'partially_aligned',
      claimText,
      assertionRole: 'hypothetical',
      evidence: {
        linkedEvidenceCount: 1,
        hasInterventionLink: true,
        evidenceOrganism: 'human',
        claimOrganism: 'human',
      },
      expectAnyFindings: [],
      expectDimensionStates: {
        results_availability: 'partially_aligned',
        certainty_language: 'not_applicable',
      },
    });
  }

  const speciesTexts = variants('Species', [
    'Metformin extends human lifespan based on mouse data alone.',
    'Rapamycin reverses aging in people according to rodent studies.',
    'NMN cures frailty in humans as shown in rats.',
    'A mouse study proves lifespan extension in patients.',
    'Animal results confirm human healthspan gains.',
    'In vivo rodent data establish human mortality benefit.',
  ]);
  for (const claimText of speciesTexts) {
    cases.push({
      id: `species-${cases.length + 1}`,
      category: 'species_mismatch',
      claimText,
      assertionRole: 'assertion',
      evidence: {
        linkedEvidenceCount: 1,
        hasInterventionLink: true,
        evidenceOrganism: 'animal',
        claimOrganism: 'human',
      },
      expectAnyFindings: ['animal_to_human_overreach'],
    });
  }

  const popTexts = variants('Population', [
    'Metformin works for healthy adults based on disease-specific trial data.',
    'A diabetes RCT proves benefit for all healthy older people.',
    'Cancer-patient dosing data apply to healthy longevity users.',
    'Frail-cohort results generalize to healthy athletes.',
    'Disease-specific safety findings cover healthy consumers.',
  ]);
  for (const claimText of popTexts) {
    cases.push({
      id: `pop-${cases.length + 1}`,
      category: 'population_mismatch',
      claimText,
      assertionRole: 'assertion',
      evidence: {
        linkedEvidenceCount: 1,
        hasInterventionLink: true,
        evidenceOrganism: 'human',
        claimOrganism: 'human',
        evidencePopulation: 'disease_specific',
        claimPopulation: 'healthy',
      },
      expectAnyFindings: ['not_comparable', 'unsupported_by_linked_local_evidence'],
      expectDimensionStates: { population: 'not_comparable' },
    });
  }

  const protocolTexts = variants('Protocol', [
    'Taking metformin 500 mg twice daily extends lifespan.',
    'The protocol itself proves efficacy without outcome data.',
    'Following this stacking schedule reverses aging.',
    'Dose escalation to 2000 mg guarantees healthspan gains.',
    'The prescribed regimen is proven because it was published as a protocol.',
  ]);
  for (const claimText of protocolTexts) {
    cases.push({
      id: `protocol-${cases.length + 1}`,
      category: 'protocol_as_result',
      claimText,
      assertionRole: 'assertion',
      evidence: {
        linkedEvidenceCount: 1,
        protocolOnly: true,
        hasInterventionLink: true,
      },
      expectAnyFindings: ['protocol_as_result'],
    });
  }

  const bioTexts = variants('Biomarker', [
    'Lower CRP proves longer human lifespan.',
    'Improved epigenetic clock means healthspan is extended.',
    'NAD biomarkers show mortality reduction.',
    'A glucose change proves people live longer.',
    'Telomere lengthening equals lifespan extension.',
  ]);
  for (const claimText of bioTexts) {
    cases.push({
      id: `bio-${cases.length + 1}`,
      category: 'biomarker_overreach',
      claimText,
      assertionRole: 'assertion',
      evidence: {
        linkedEvidenceCount: 1,
        biomarkerOnly: true,
        healthOutcomeClaimed: true,
        hasInterventionLink: true,
      },
      expectAnyFindings: ['biomarker_to_health_outcome_overreach'],
    });
  }

  const magTexts = variants('Magnitude', [
    'Metformin doubles human lifespan dramatically.',
    'Rapamycin causes a massive 80% mortality drop overnight.',
    'NMN produces huge fold-change healthspan gains.',
    'Exercise guarantees dramatic lifespan doubling.',
    'A single biomarker shift yields massive longevity.',
  ]);
  for (const claimText of magTexts) {
    cases.push({
      id: `mag-${cases.length + 1}`,
      category: 'effect_magnitude_overreach',
      claimText,
      assertionRole: 'assertion',
      evidence: {
        linkedEvidenceCount: 1,
        magnitudeOverstated: true,
        hasInterventionLink: true,
      },
      expectAnyFindings: ['overstates_effect_magnitude'],
    });
  }

  const causalTexts = variants('Causal', [
    'Metformin causes and proves human lifespan extension.',
    'Rapamycin is proven to guarantee aging reversal.',
    'NMN causes mortality reduction with certainty.',
    'Cold exposure proves causal healthspan gains.',
    'Protein timing causes guaranteed longevity.',
  ]);
  for (const claimText of causalTexts) {
    cases.push({
      id: `causal-${cases.length + 1}`,
      category: 'causality_overreach',
      claimText,
      assertionRole: 'assertion',
      evidence: {
        linkedEvidenceCount: 1,
        causalityOverstated: true,
        hasInterventionLink: true,
      },
      expectAnyFindings: ['overstates_causality'],
    });
  }

  const regTexts = variants('Regulatory', [
    'Metformin is FDA approved for aging and longevity.',
    'TGA approved this peptide for healthspan extension.',
    'The product is authorised as an anti-aging medicine.',
    'FDA approval for diabetes means approval for longevity.',
    'Unapproved research compound is approved for consumer aging use.',
  ]);
  for (const claimText of regTexts) {
    cases.push({
      id: `reg-${cases.length + 1}`,
      category: 'regulatory_indication_mismatch',
      claimText,
      assertionRole: 'assertion',
      evidence: {
        linkedEvidenceCount: 1,
        hasRegulatoryLink: true,
        regulatoryMismatch: true,
        hasInterventionLink: true,
      },
      expectAnyFindings: ['regulatory_scope_overreach'],
    });
  }

  const safetyTexts = variants('Safety', [
    'Metformin is completely safe for everyone at any dose.',
    'No adverse effects exist for this research peptide.',
    'Safety is proven for unsupervised longevity stacking.',
    'Toxicity data from animals guarantee human safety.',
    'The compound has zero side effects in all populations.',
  ]);
  for (const claimText of safetyTexts) {
    cases.push({
      id: `safety-${cases.length + 1}`,
      category: 'safety_scope_overreach',
      claimText,
      assertionRole: 'assertion',
      evidence: {
        linkedEvidenceCount: 1,
        safetyOverreach: true,
        hasInterventionLink: true,
      },
      expectAnyFindings: ['safety_scope_overreach'],
    });
  }

  const notCompTexts = variants('NotComp', [
    'Mouse and human outcomes are interchangeable here.',
    'In vitro and patient results are the same claim.',
    'Animal mortality equals human healthspan.',
    'Cell assays prove clinical longevity.',
    'Mixed organism wording without separable spans.',
  ]);
  for (const claimText of notCompTexts) {
    cases.push({
      id: `nc-${cases.length + 1}`,
      category: 'not_comparable',
      claimText: claimText.includes('Mouse and human')
        ? 'Metformin helps mice and humans the same way without separation.'
        : claimText,
      assertionRole: 'assertion',
      evidence: {
        linkedEvidenceCount: 1,
        evidenceOrganism: 'mixed',
        claimOrganism: 'mixed',
        hasInterventionLink: true,
      },
      expectAnyFindings: ['not_comparable', 'animal_to_human_overreach'],
    });
  }

  const conflictTexts = variants('Conflict', [
    'Linked evidence suggests null effect but the claim asserts strong benefit.',
    'Creator asserts benefit while linked assessment leans harmful.',
    'Claim says proven; linked trial is inconclusive.',
    'Claim asserts safety while linked label warns strongly.',
  ]);
  for (const claimText of conflictTexts) {
    cases.push({
      id: `conflict-${cases.length + 1}`,
      category: 'potential_conflict',
      claimText,
      assertionRole: 'assertion',
      evidence: {
        linkedEvidenceCount: 2,
        potentialConflict: true,
        hasInterventionLink: true,
      },
      expectAnyFindings: ['potentially_conflicts_with_current_evidence'],
    });
  }

  const updateTexts = variants('Update', [
    'Prior claim remains current after linked evidence was updated.',
    'Alignment should go stale when dossier snapshot changes.',
    'New trial results supersede the previous linked paper.',
    'Evidence update requires reassessment before republishing.',
  ]);
  for (const claimText of updateTexts) {
    cases.push({
      id: `update-${cases.length + 1}`,
      category: 'evidence_update',
      claimText,
      assertionRole: 'assertion',
      evidence: {
        linkedEvidenceCount: 2,
        evidenceUpdated: true,
        hasInterventionLink: true,
      },
      expectAnyFindings: ['unresolved'],
      expectDimensionStates: { evidence_recency: 'unresolved' },
    });
  }

  const retractTexts = variants('Retract', [
    'Creator previously claimed benefit; correction supersedes it.',
    'Linked paper was retracted; claim must not stay current.',
    'Update: I was wrong about metformin lifespan claims.',
  ]);
  for (const claimText of retractTexts) {
    cases.push({
      id: `retract-${cases.length + 1}`,
      category: 'retraction',
      claimText,
      assertionRole: claimText.startsWith('Update') ? 'correction' : 'assertion',
      evidence: {
        linkedEvidenceCount: 1,
        retracted: true,
        hasInterventionLink: true,
      },
      expectAnyFindings: ['superseded_or_corrected'],
    });
  }

  const unavailableTexts = variants('Unavailable', [
    'Claim depended on a now-deleted X post.',
    'Source video became private; claim is source-unavailable.',
    'Withheld platform content cannot support the claim.',
  ]);
  for (const claimText of unavailableTexts) {
    cases.push({
      id: `unavail-${cases.length + 1}`,
      category: 'source_unavailable',
      claimText,
      assertionRole: 'assertion',
      evidence: {
        linkedEvidenceCount: 0,
        sourceUnavailable: true,
      },
      expectAnyFindings: ['source_unavailable'],
    });
  }

  const noneTexts = variants('NoEvidence', [
    'Metformin reverses aging in everyone immediately.',
    'This peptide is the longevity breakthrough.',
    'Unlinked claim asserts human lifespan extension.',
    'No corpus support exists for this certainty claim.',
    'Creator asserts cure without any linked local evidence.',
  ]);
  for (const claimText of noneTexts) {
    cases.push({
      id: `none-${cases.length + 1}`,
      category: 'no_linked_local_evidence',
      claimText,
      assertionRole: 'assertion',
      evidence: { linkedEvidenceCount: 0 },
      expectAnyFindings: ['unsupported_by_linked_local_evidence'],
    });
  }

  return cases;
}

export const ALIGNMENT_PAIR_CORPUS: AlignmentPairCase[] = buildCorpus();

export type AlignmentPairEvalResult = {
  total: number;
  passed: number;
  failed: number;
  byCategory: Record<string, { total: number; passed: number }>;
  failures: Array<{ id: string; category: string; reason: string }>;
  ok: boolean;
};

/** Run the ≥72 alignment-pair corpus against deterministic alignment rules. */
export function evaluateAlignmentPairCorpus(
  corpus: AlignmentPairCase[] = ALIGNMENT_PAIR_CORPUS,
): AlignmentPairEvalResult {
  const byCategory: Record<string, { total: number; passed: number }> = {};
  const failures: AlignmentPairEvalResult['failures'] = [];

  for (const item of corpus) {
    byCategory[item.category] ??= { total: 0, passed: 0 };
    byCategory[item.category]!.total += 1;

    const aligned = alignCreatorClaim({
      claimText: item.claimText,
      assertionRole: item.assertionRole,
      linkedEvidenceCount: item.evidence.linkedEvidenceCount ?? 0,
      hasRegulatoryLink: Boolean(item.evidence.hasRegulatoryLink),
      hasInterventionLink: Boolean(item.evidence.hasInterventionLink),
      evidence: item.evidence,
    });

    let ok = true;
    let reason = '';

    if (item.expectAnyFindings.length) {
      const hit = item.expectAnyFindings.some((f) => aligned.findings.includes(f));
      if (!hit) {
        ok = false;
        reason = `expected one of [${item.expectAnyFindings.join(', ')}] got [${aligned.findings.join(', ')}]`;
      }
    }

    if (ok && item.expectDimensionStates) {
      for (const [dimId, state] of Object.entries(item.expectDimensionStates)) {
        const dim = aligned.dimensions.find((d) => d.id === dimId);
        if (!dim || dim.state !== state) {
          ok = false;
          reason = `dimension ${dimId} expected ${state} got ${dim?.state ?? 'missing'}`;
          break;
        }
      }
    }

    // Policy: never invent person scores.
    if (ok && /trust|credibility|popularity|engagement/i.test(aligned.overallLabel) === false) {
      // overallLabel must explicitly deny scores
      if (!/No creator trust/i.test(aligned.overallLabel)) {
        ok = false;
        reason = 'overallLabel missing no-score affirmation';
      }
    }

    if (ok) byCategory[item.category]!.passed += 1;
    else failures.push({ id: item.id, category: item.category, reason });
  }

  const total = corpus.length;
  const failed = failures.length;
  const passed = total - failed;
  return {
    total,
    passed,
    failed,
    byCategory,
    failures: failures.slice(0, 20),
    ok: total >= 72 && failed === 0,
  };
}
