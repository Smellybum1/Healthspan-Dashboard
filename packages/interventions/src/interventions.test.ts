import { describe, expect, it } from 'vitest';
import { normalizeForMatch } from './normalize.js';
import { canStoreSequence, classifyPeptideLabel, PEPTIDE_PROHIBITED_UI } from './peptide.js';
import { extractMentionsFromRecord } from './mentions.js';
import { proposeMapping } from './resolve.js';

describe('intervention normalization', () => {
  it('normalizes case/whitespace without erasing salt tokens', () => {
    expect(normalizeForMatch('  Metformin  HCl ')).toContain('hcl');
    expect(normalizeForMatch('BPC-157')).toBe('bpc-157');
  });
});

describe('peptide policy', () => {
  it('never invents sequence from marketing names', () => {
    const c = classifyPeptideLabel('BPC-157');
    expect(c.classification).toBe('peptide');
    expect(c.sequenceState).toBe('no_sequence');
    expect(canStoreSequence({ sourceScheme: null, sequenceText: 'GKLP', reviewed: false })).toBe(
      false,
    );
    expect(PEPTIDE_PROHIBITED_UI).toContain('dosing');
  });
});

describe('mention extraction + resolution', () => {
  it('extracts known substances and auto-maps unique aliases only', () => {
    const mentions = extractMentionsFromRecord({
      title: 'Metformin in aging',
      summary: 'Murine metformin study',
    });
    expect(mentions.some((m) => m.normalizedText === 'metformin')).toBe(true);

    const auto = proposeMapping({
      mentionNormalized: 'metformin',
      mentionRaw: 'metformin',
      entities: [
        {
          id: 'ent-metformin',
          preferredName: 'Metformin',
          normalizedPreferredName: 'metformin',
          entityType: 'substance',
          lifecycleState: 'active',
        },
      ],
      aliases: [
        {
          entityId: 'ent-metformin',
          normalizedAlias: 'metformin',
          aliasType: 'preferred',
          reviewState: 'accepted',
          collisionFlag: false,
        },
      ],
      identifiers: [],
    });
    expect(auto[0]?.method).toBe('exact_alias_unique');

    const collision = proposeMapping({
      mentionNormalized: 'nr',
      mentionRaw: 'NR',
      entities: [
        {
          id: 'a',
          preferredName: 'Nicotinamide riboside',
          normalizedPreferredName: 'nicotinamide riboside',
          entityType: 'substance',
          lifecycleState: 'active',
        },
        {
          id: 'b',
          preferredName: 'Other NR',
          normalizedPreferredName: 'other nr',
          entityType: 'substance',
          lifecycleState: 'active',
        },
      ],
      aliases: [
        {
          entityId: 'a',
          normalizedAlias: 'nr',
          aliasType: 'abbreviation',
          reviewState: 'accepted',
          collisionFlag: false,
        },
        {
          entityId: 'b',
          normalizedAlias: 'nr',
          aliasType: 'abbreviation',
          reviewState: 'accepted',
          collisionFlag: false,
        },
      ],
      identifiers: [],
    });
    expect(collision.every((c) => c.method === 'review_required')).toBe(true);
  });
});
