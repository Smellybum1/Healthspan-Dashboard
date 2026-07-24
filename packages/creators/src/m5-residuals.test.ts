import { describe, expect, it } from 'vitest';
import {
  classifyCreatorClaimTaxonomy,
  redactActionableDosing,
  computeClaimRecurrence,
  classifyClaimRelationship,
  gateCreatorAiSegment,
  isCreatorAiEnabled,
  creatorAiPolicyNotes,
  RECURRENCE_FORMULA_VERSION,
} from './index.js';

describe('claim taxonomies', () => {
  it('classifies kind, direction, and certainty', () => {
    const t = classifyCreatorClaimTaxonomy(
      'Rapamycin improves healthspan in humans and dramatically extends lifespan.',
      'assertion',
    );
    expect(t.claimKind).toBe('efficacy');
    expect(t.direction).toBe('benefit');
    expect(['certain', 'probable']).toContain(t.certaintyLanguage);
  });

  it('redacts actionable dosing', () => {
    expect(redactActionableDosing('Take 5 mg / day of compound X')).toContain('[dose redacted]');
  });
});

describe('recurrence formula', () => {
  it('counts distinct monitored sources and never labels popularity', () => {
    const groups = computeClaimRecurrence([
      {
        id: '1',
        recurrenceKey: 'theme-a',
        claimText: 'Rapamycin extends healthspan in adults.',
        reviewStatus: 'accepted',
        active: true,
        sourceKey: 'acct-1',
        firstObservedAt: 100,
      },
      {
        id: '2',
        recurrenceKey: 'theme-a',
        claimText: 'Rapamycin extends healthspan in adults.',
        reviewStatus: 'accepted',
        active: true,
        sourceKey: 'acct-1',
        firstObservedAt: 200,
      },
      {
        id: '3',
        recurrenceKey: 'theme-a',
        claimText: 'Rapamycin extends healthspan in adults.',
        reviewStatus: 'accepted',
        active: true,
        sourceKey: 'acct-2',
        firstObservedAt: 300,
      },
      {
        id: '4',
        recurrenceKey: 'theme-a',
        claimText: 'Rapamycin extends healthspan in adults.',
        reviewStatus: 'unreviewed',
        active: true,
        sourceKey: 'acct-3',
        firstObservedAt: 400,
      },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.reviewedClaimCount).toBe(3);
    expect(groups[0]!.distinctMonitoredSourceCount).toBe(2);
    expect(groups[0]!.sameSourceRepetitionCount).toBe(1);
    expect(groups[0]!.formulaVersion).toBe(RECURRENCE_FORMULA_VERSION);
    expect(groups[0]!.labels.notPopularity).toBe(true);
    expect(groups[0]!.firstObservedScope).toBe('monitored_sources');
  });

  it('never emits plagiarism labels', () => {
    const rel = classifyClaimRelationship(
      { id: 'a', claimText: 'Rapamycin extends healthspan in adults.', recurrenceKey: 'k1' },
      { id: 'b', claimText: 'Rapamycin extends healthspan among adults.', recurrenceKey: 'k2' },
    );
    expect(rel.relationshipType).not.toBe('plagiarism' as never);
    expect([
      'exact_duplicate',
      'reviewed_paraphrase',
      'potential_paraphrase',
      'unrelated',
    ]).toContain(rel.relationshipType);
  });
});

describe('optional creator AI policy', () => {
  it('is disabled by default and blocks youtube/x', () => {
    expect(isCreatorAiEnabled()).toBe(false);
    expect(
      gateCreatorAiSegment({
        rightsEligible: true,
        sourceKind: 'youtube_metadata',
        segmentCharCount: 10,
      }).allowed,
    ).toBe(false);
    expect(
      gateCreatorAiSegment({
        rightsEligible: true,
        sourceKind: 'x_content',
        segmentCharCount: 10,
      }).allowed,
    ).toBe(false);
    expect(creatorAiPolicyNotes().length).toBeGreaterThan(3);
  });
});
