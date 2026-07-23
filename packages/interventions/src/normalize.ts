export const NORMALIZATION_VERSION = 'm4.normalize.1';

/**
 * Matching normalization — must not erase D-/L-, salt, fragment, or route distinctions.
 */
export function normalizeForMatch(input: string): string {
  return input
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[“”„]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function normalizeIdentifierValue(scheme: string, value: string): string {
  const trimmed = value.trim();
  if (scheme === 'rxcui' || scheme === 'unii' || scheme === 'cid' || scheme === 'pubchem_cid') {
    return trimmed.replace(/^0+/, '') || '0';
  }
  if (scheme === 'artg_id') return trimmed.replace(/\s+/g, '');
  if (scheme === 'fda_application_number' || scheme === 'spl_set_id') {
    return trimmed.toUpperCase().replace(/\s+/g, '');
  }
  return normalizeForMatch(trimmed);
}
