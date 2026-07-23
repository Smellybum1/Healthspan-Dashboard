import { normalizeForMatch, NORMALIZATION_VERSION } from './normalize.js';

export const MENTION_EXTRACTION_VERSION = 'm4.mentions.1';

export type MentionDraft = {
  rawText: string;
  normalizedText: string;
  mentionType: 'substance_name' | 'product_name' | 'class_name' | 'identifier';
  fieldPath: string;
  excerpt: string;
  ruleVersion: string;
};

const KNOWN_SUBSTANCES = [
  'metformin',
  'rapamycin',
  'sirolimus',
  'resveratrol',
  'nmn',
  'nr',
  'nicotinamide riboside',
  'urolithin a',
  'spermidine',
  'fisetin',
  'quercetin',
  'dasatinib',
  'bpc-157',
  'tb-500',
  'epitalon',
  'semaglutide',
  'tirzepatide',
  'aspirin',
  'exercise',
  'caloric restriction',
];

export function extractMentionsFromText(opts: {
  text: string;
  fieldPath: string;
}): MentionDraft[] {
  const text = opts.text ?? '';
  if (!text.trim()) return [];
  const lower = text.toLowerCase();
  const out: MentionDraft[] = [];
  const seen = new Set<string>();

  for (const name of KNOWN_SUBSTANCES) {
    if (!lower.includes(name)) continue;
    const normalized = normalizeForMatch(name);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push({
      rawText: name,
      normalizedText: normalized,
      mentionType: name === 'exercise' || name === 'caloric restriction' ? 'class_name' : 'substance_name',
      fieldPath: opts.fieldPath,
      excerpt: text.slice(0, 240),
      ruleVersion: MENTION_EXTRACTION_VERSION,
    });
  }

  return out;
}

export function extractMentionsFromRecord(record: {
  title?: string | null;
  summary?: string | null;
}): MentionDraft[] {
  const drafts = [
    ...extractMentionsFromText({ text: record.title ?? '', fieldPath: 'normalized.title' }),
    ...extractMentionsFromText({ text: record.summary ?? '', fieldPath: 'normalized.summary' }),
  ];
  const seen = new Set<string>();
  return drafts.filter((d) => {
    const key = `${d.normalizedText}|${d.fieldPath}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { NORMALIZATION_VERSION };
