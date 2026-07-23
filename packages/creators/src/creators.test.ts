import { describe, expect, it } from 'vitest';
import { parseTranscriptDocument } from './documents.js';
import { alignCreatorClaim, extractCreatorClaimsFromText } from './claims.js';
import { CREATOR_PROHIBITED_SCORES, normalizeCreatorName } from './normalize.js';

describe('creator documents', () => {
  it('parses VTT without treating metadata as claims', () => {
    const vtt = `WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nMetformin improves aging biomarkers in mice.\n`;
    const parsed = parseTranscriptDocument({
      filename: 'talk.vtt',
      bytes: Buffer.from(vtt, 'utf8'),
    });
    expect(parsed.cueCount).toBe(1);
    expect(parsed.text).toMatch(/Metformin/);
  });
});

describe('creator claims', () => {
  it('does not convert questions into assertions', () => {
    const drafts = extractCreatorClaimsFromText(
      'Does rapamycin extend human healthspan? Metformin reduces glucose in humans. I was paid by a sponsor to discuss NMN.',
    );
    expect(drafts.some((d) => d.assertionRole === 'question')).toBe(true);
    expect(drafts.some((d) => d.assertionRole === 'assertion')).toBe(true);
    expect(drafts.some((d) => d.assertionRole === 'disclosure')).toBe(true);
  });

  it('alignment never invents trust scores', () => {
    const aligned = alignCreatorClaim({
      claimText: 'x',
      assertionRole: 'assertion',
      linkedEvidenceCount: 0,
      hasRegulatoryLink: false,
      hasInterventionLink: false,
    });
    expect(aligned.overallLabel).toMatch(/No creator trust/i);
    expect(CREATOR_PROHIBITED_SCORES).toContain('trust_score');
    expect(normalizeCreatorName('  Dr. Example  ')).toBe('dr. example');
  });

  it('refuses to send X content to external AI', async () => {
    const { assertXContentNotSentToExternalAi, isExternalAiAllowedForX } = await import('./x-ai-policy.js');
    expect(isExternalAiAllowedForX()).toBe(false);
    expect(() =>
      assertXContentNotSentToExternalAi({ provider: 'openai', includesXContent: true }),
    ).toThrow(/must not be sent/i);
  });
});
