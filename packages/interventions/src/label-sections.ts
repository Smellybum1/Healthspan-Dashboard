/** Allowed openFDA / label sections for dossier and Regulatory workspace display. */
export const ALLOWED_PRODUCT_LABEL_SECTIONS = [
  'warnings',
  'boxed_warning',
  'contraindications',
  'indications_and_usage',
  'adverse_reactions',
  'drug_interactions',
  'use_in_specific_populations',
] as const;

export type AllowedProductLabelSection = (typeof ALLOWED_PRODUCT_LABEL_SECTIONS)[number];

/** Explicitly excluded from display (actionable dosing). */
export const EXCLUDED_PRODUCT_LABEL_SECTIONS = [
  'dosage_and_administration',
  'dosage_forms_and_strengths',
] as const;

export function isAllowedLabelSection(section: string): boolean {
  const n = section.toLowerCase().replace(/[\s-]+/g, '_');
  if ((EXCLUDED_PRODUCT_LABEL_SECTIONS as readonly string[]).includes(n)) return false;
  return (ALLOWED_PRODUCT_LABEL_SECTIONS as readonly string[]).includes(n);
}
