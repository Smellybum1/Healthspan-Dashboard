/**
 * Generates Milestone 1 demonstration seed data for Healthspan Dashboard.
 * All records are fictionalised demo snapshot data — not live scientific facts.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../packages/core/src/seed/bundle.ts');

const DEMO = true;
const notice =
  'Demo snapshot — fictionalised demonstration data for Healthspan Dashboard Milestone 1. Not live scientific facts.';

const iso = (d) => new Date(d).toISOString();
const now = iso('2026-07-20T10:00:00.000Z');
const lastVisit = iso('2026-07-18T08:00:00.000Z');

const sources = [
  {
    id: 'src-demo-manual',
    name: 'Demo Manual Seed',
    kind: 'manual_demo',
    homepageUrl: 'https://example.invalid/demo',
    health: 'healthy',
    lastSuccessfulFetchAt: now,
    lastError: null,
    dataOrigin: 'demo',
  },
  {
    id: 'src-pubmed-stub',
    name: 'PubMed (stub)',
    kind: 'publication_index',
    homepageUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    health: 'unknown',
    lastSuccessfulFetchAt: null,
    lastError: 'Not connected in Milestone 1',
    dataOrigin: 'demo',
  },
  {
    id: 'src-ctg-stub',
    name: 'ClinicalTrials.gov (stub)',
    kind: 'registry',
    homepageUrl: 'https://clinicaltrials.gov/',
    health: 'unknown',
    lastSuccessfulFetchAt: null,
    lastError: 'Not connected in Milestone 1',
    dataOrigin: 'demo',
  },
  {
    id: 'src-tga-stub',
    name: 'TGA feeds (stub)',
    kind: 'regulator',
    homepageUrl: 'https://www.tga.gov.au/',
    health: 'degraded',
    lastSuccessfulFetchAt: iso('2026-07-19T02:00:00.000Z'),
    lastError: 'Demo degraded state for UI',
    dataOrigin: 'demo',
  },
  {
    id: 'src-crossref-stub',
    name: 'Crossref (stub)',
    kind: 'publication_index',
    homepageUrl: 'https://www.crossref.org/',
    health: 'unknown',
    lastSuccessfulFetchAt: null,
    lastError: 'Not connected in Milestone 1',
    dataOrigin: 'demo',
  },
  {
    id: 'src-anzctr-stub',
    name: 'ANZCTR enrichment (stub)',
    kind: 'registry',
    homepageUrl: 'https://www.anzctr.org.au/',
    health: 'unknown',
    lastSuccessfulFetchAt: null,
    lastError: 'Not connected in Milestone 1',
    dataOrigin: 'demo',
  },
];

const sourceRecords = sources.map((s, i) => ({
  id: `srec-${i + 1}`,
  sourceId: s.id,
  externalId: `demo-ext-${i + 1}`,
  fetchedAt: now,
  rawHash: `hash-demo-${i + 1}`,
  url: s.homepageUrl,
  dataOrigin: 'demo',
}));

const hallmarks = [
  'genomic_instability',
  'telomere_attrition',
  'epigenetic_alterations',
  'loss_of_proteostasis',
  'disabled_macroautophagy',
  'deregulated_nutrient_sensing',
  'mitochondrial_dysfunction',
  'cellular_senescence',
  'stem_cell_exhaustion',
  'altered_intercellular_communication',
  'chronic_inflammation',
  'dysbiosis',
];

const maturityLadder = [
  'social_anecdotal',
  'mechanistic_hypothesis',
  'in_vitro_ex_vivo',
  'animal_model',
  'human_observational',
  'early_human_interventional',
  'controlled_clinical_trial',
  'replicated_controlled_or_synthesis',
  'regulatory_or_guideline_supported',
];

const maturityX = {
  social_anecdotal: 0.05,
  mechanistic_hypothesis: 0.15,
  in_vitro_ex_vivo: 0.25,
  animal_model: 0.35,
  human_observational: 0.5,
  early_human_interventional: 0.65,
  controlled_clinical_trial: 0.8,
  replicated_controlled_or_synthesis: 0.9,
  regulatory_or_guideline_supported: 0.98,
};

function assessment(id, subjectId, subjectType, maturity, attention, extras = {}) {
  return {
    id,
    subjectId,
    subjectType,
    maturity,
    studyDesign: extras.studyDesign ?? 'other',
    peerReviewStatus: extras.peerReviewStatus ?? 'unknown',
    confidenceScore: extras.confidenceScore ?? 0.55,
    confidenceRationale: extras.confidenceRationale ?? [
      'Demo rationale: design quality reviewed against seeded criteria.',
      'Sample size and endpoint relevance scored independently of attention.',
    ],
    translationGaps: extras.translationGaps ?? [],
    attentionScore: attention,
    attentionRationale: extras.attentionRationale ?? [
      'Demo attention derived from seeded mention velocity.',
    ],
    safetyNotes: extras.safetyNotes ?? [],
    regulatoryStatuses: extras.regulatoryStatuses ?? [],
    whatWouldChangeAssessment: extras.whatWouldChangeAssessment ?? [
      'A preregistered, adequately powered human RCT with hard clinical endpoints.',
    ],
    provenance: {
      sourceIds: ['src-demo-manual'],
      sourceRecordIds: ['srec-1'],
      notes: 'Seeded demonstration provenance.',
    },
    dataOrigin: 'demo',
  };
}

// --- Hand-crafted cornerstone interventions ---
const interventions = [
  {
    id: 'int-metformin',
    type: 'intervention',
    title: 'Metformin',
    summary:
      'Biguanide with established diabetes indication and ongoing longevity-adjacent research interest.',
    tags: ['metabolic', 'approved-drug'],
    publishedAt: iso('1957-01-01'),
    updatedAt: now,
    assessmentId: 'ea-int-metformin',
    dataOrigin: 'demo',
    canonicalName: 'Metformin',
    aliases: ['Glucophage'],
    interventionClass: 'Biguanide',
    claimedPurpose: 'Glycaemic control; hypothesized broader ageing benefits',
    demonstratedIndications: ['Type 2 diabetes mellitus'],
    biologicalTargets: ['AMPK', 'hepatic gluconeogenesis'],
    ageingHallmarks: ['deregulated_nutrient_sensing', 'mitochondrial_dysfunction'],
    wadaStatus: 'not_listed',
    relatedPaperIds: ['paper-metformin-rct', 'paper-metformin-obs'],
    relatedTrialIds: ['trial-metformin-tame-demo'],
    isPeptide: false,
    unapprovedWarning: false,
    provenance: {
      sourceIds: ['src-demo-manual'],
      sourceRecordIds: ['srec-1'],
      notes: 'Demo intervention dossier.',
    },
  },
  {
    id: 'int-rapamycin',
    type: 'intervention',
    title: 'Rapamycin (sirolimus)',
    summary: 'mTOR inhibitor with strong animal longevity signals and cautious human translation.',
    tags: ['mTOR', 'immunosuppressant'],
    publishedAt: iso('1975-01-01'),
    updatedAt: now,
    assessmentId: 'ea-int-rapamycin',
    dataOrigin: 'demo',
    canonicalName: 'Rapamycin',
    aliases: ['Sirolimus'],
    interventionClass: 'mTOR inhibitor',
    claimedPurpose: 'Immunosuppression; hypothesized healthspan extension',
    demonstratedIndications: ['Organ transplant rejection prophylaxis (approved contexts)'],
    biologicalTargets: ['mTORC1'],
    ageingHallmarks: [
      'deregulated_nutrient_sensing',
      'disabled_macroautophagy',
      'cellular_senescence',
    ],
    wadaStatus: 'not_listed',
    relatedPaperIds: ['paper-rapamycin-animal', 'paper-rapamycin-early'],
    relatedTrialIds: ['trial-rapamycin-early'],
    isPeptide: false,
    unapprovedWarning: false,
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'int-exercise',
    type: 'intervention',
    title: 'Structured aerobic + resistance training',
    summary:
      'High-evidence lifestyle intervention for function, cardiometabolic health, and healthspan.',
    tags: ['lifestyle', 'high-evidence'],
    publishedAt: iso('1990-01-01'),
    updatedAt: now,
    assessmentId: 'ea-int-exercise',
    dataOrigin: 'demo',
    canonicalName: 'Structured exercise',
    aliases: ['Aerobic training', 'Resistance training'],
    interventionClass: 'Lifestyle',
    claimedPurpose: 'Preserve physical function and cardiometabolic health',
    demonstratedIndications: [
      'Cardiorespiratory fitness',
      'Muscle strength',
      'Fall-risk reduction in older adults (context-dependent)',
    ],
    biologicalTargets: ['skeletal muscle', 'VO2 pathways'],
    ageingHallmarks: ['stem_cell_exhaustion', 'mitochondrial_dysfunction', 'chronic_inflammation'],
    wadaStatus: 'not_listed',
    relatedPaperIds: ['paper-exercise-synthesis'],
    relatedTrialIds: ['trial-exercise-au'],
    isPeptide: false,
    unapprovedWarning: false,
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'int-nmn',
    type: 'intervention',
    title: 'NMN (nicotinamide mononucleotide)',
    summary: 'NAD+ precursor with strong consumer attention and still-maturing human evidence.',
    tags: ['NAD', 'supplement-adjacent'],
    publishedAt: iso('2016-01-01'),
    updatedAt: now,
    assessmentId: 'ea-int-nmn',
    dataOrigin: 'demo',
    canonicalName: 'NMN',
    aliases: ['Nicotinamide mononucleotide'],
    interventionClass: 'NAD precursor',
    claimedPurpose: 'Raise NAD+; claimed vitality and metabolic benefits',
    demonstratedIndications: [],
    biologicalTargets: ['NAD+ biosynthesis'],
    ageingHallmarks: ['mitochondrial_dysfunction', 'deregulated_nutrient_sensing'],
    wadaStatus: 'unknown',
    relatedPaperIds: ['paper-nmn-early', 'paper-nmn-invitro'],
    relatedTrialIds: ['trial-nmn-recruiting'],
    isPeptide: false,
    unapprovedWarning: false,
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'int-senolytic-demo',
    type: 'intervention',
    title: 'Demo senolytic cocktail (fictional)',
    summary:
      'Fictional senolytic combination used to illustrate weak-evidence / high-attention quadrant.',
    tags: ['senolytic', 'high-attention'],
    publishedAt: iso('2024-01-01'),
    updatedAt: now,
    assessmentId: 'ea-int-senolytic',
    dataOrigin: 'demo',
    canonicalName: 'Demo-Senol-X',
    aliases: ['Fictional dasatinib+quercetin analogue'],
    interventionClass: 'Senolytic (demo)',
    claimedPurpose: 'Clear senescent cells; dramatic rejuvenation claims online',
    demonstratedIndications: [],
    biologicalTargets: ['senescent cell anti-apoptotic pathways'],
    ageingHallmarks: ['cellular_senescence'],
    wadaStatus: 'unknown',
    relatedPaperIds: ['paper-senolytic-animal'],
    relatedTrialIds: ['trial-senolytic-withdrawn'],
    isPeptide: false,
    unapprovedWarning: true,
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
];

// Fill remaining interventions for volume
for (let i = 1; i <= 7; i++) {
  const id = `int-gen-${i}`;
  interventions.push({
    id,
    type: 'intervention',
    title: `Demo Intervention ${i}`,
    summary: `Fictional intervention dossier ${i} for list/filter density.`,
    tags: ['demo', i % 2 ? 'metabolic' : 'inflammatory'],
    publishedAt: iso(`2020-0${(i % 9) + 1}-15`),
    updatedAt: now,
    assessmentId: `ea-${id}`,
    dataOrigin: 'demo',
    canonicalName: `Demo Intervention ${i}`,
    aliases: [`DI-${i}`],
    interventionClass: i % 2 ? 'Small molecule' : 'Nutrient',
    claimedPurpose: 'Demo claimed purpose',
    demonstratedIndications: i > 4 ? ['Demo indication A'] : [],
    biologicalTargets: ['demo-target'],
    ageingHallmarks: [hallmarks[i % hallmarks.length]],
    wadaStatus: 'unknown',
    relatedPaperIds: [],
    relatedTrialIds: [],
    isPeptide: false,
    unapprovedWarning: false,
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  });
}

const peptides = [
  {
    id: 'pep-bpc157',
    type: 'peptide',
    title: 'BPC-157 (demo)',
    summary:
      'Investigational/unapproved peptide example with strong online claims and weak controlled human evidence in this demo snapshot.',
    tags: ['peptide', 'unapproved'],
    publishedAt: iso('2018-01-01'),
    updatedAt: now,
    assessmentId: 'ea-pep-bpc157',
    dataOrigin: 'demo',
    canonicalName: 'BPC-157',
    aliases: ['Body Protection Compound-157'],
    interventionClass: 'Synthetic peptide',
    claimedPurpose:
      'Tissue repair and gut protection (claims; not established clinical indications here)',
    demonstratedIndications: [],
    biologicalTargets: ['angiogenesis-related pathways (hypothesized)'],
    ageingHallmarks: ['altered_intercellular_communication'],
    wadaStatus: 'prohibited',
    relatedPaperIds: ['paper-bpc-animal'],
    relatedTrialIds: ['trial-bpc-early'],
    isPeptide: true,
    unapprovedWarning: true,
    sequenceHint: 'Demo sequence withheld',
    provenance: {
      sourceIds: ['src-demo-manual'],
      sourceRecordIds: ['srec-1'],
      notes: 'Unapproved peptide — informational only.',
    },
  },
  {
    id: 'pep-epitalon',
    type: 'peptide',
    title: 'Epitalon (demo)',
    summary:
      'Fictionalised peptide dossier illustrating unknown regulatory status and telomere-related claims.',
    tags: ['peptide', 'telomere'],
    publishedAt: iso('2015-01-01'),
    updatedAt: now,
    assessmentId: 'ea-pep-epitalon',
    dataOrigin: 'demo',
    canonicalName: 'Epitalon',
    aliases: ['Epithalon'],
    interventionClass: 'Synthetic peptide',
    claimedPurpose: 'Telomere / pineal-axis claims',
    demonstratedIndications: [],
    biologicalTargets: ['telomerase (claimed)'],
    ageingHallmarks: ['telomere_attrition'],
    wadaStatus: 'unknown',
    relatedPaperIds: ['paper-epitalon-invitro'],
    relatedTrialIds: [],
    isPeptide: true,
    unapprovedWarning: true,
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
];

for (let i = 1; i <= 4; i++) {
  const id = `pep-gen-${i}`;
  peptides.push({
    id,
    type: 'peptide',
    title: `Demo Peptide ${i}`,
    summary: `Fictional peptide ${i} for peptide list density. Unapproved demonstration example.`,
    tags: ['peptide', 'demo'],
    publishedAt: iso(`2021-0${i}-01`),
    updatedAt: now,
    assessmentId: `ea-${id}`,
    dataOrigin: 'demo',
    canonicalName: `Demo Peptide ${i}`,
    aliases: [`DP-${i}`],
    interventionClass: 'Synthetic peptide',
    claimedPurpose: 'Demo claim',
    demonstratedIndications: [],
    biologicalTargets: ['demo'],
    ageingHallmarks: [hallmarks[i]],
    wadaStatus: i === 1 ? 'prohibited' : 'unknown',
    relatedPaperIds: [],
    relatedTrialIds: [],
    isPeptide: true,
    unapprovedWarning: true,
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  });
}

const papers = [
  {
    id: 'paper-metformin-rct',
    type: 'paper',
    title: 'Demo RCT: metformin and functional endpoints in older adults',
    summary:
      'Peer-reviewed human RCT demo with mixed functional outcomes; illustrates controlled clinical evidence.',
    tags: ['RCT', 'metformin'],
    publishedAt: iso('2023-05-01'),
    updatedAt: now,
    assessmentId: 'ea-paper-metformin-rct',
    dataOrigin: 'demo',
    authors: ['A. Demo', 'B. Example'],
    venue: 'Demo Geriatrics Journal',
    doi: '10.0000/demo.metformin.rct',
    peerReviewStatus: 'peer_reviewed',
    studyDesign: 'randomised_controlled',
    speciesOrPopulation: 'Humans (older adults)',
    findingDirection: 'mixed',
    isCorrectionOrRetraction: false,
    relatedInterventionIds: ['int-metformin'],
    ageingHallmarks: ['deregulated_nutrient_sensing'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'paper-metformin-obs',
    type: 'paper',
    title: 'Demo observational cohort: metformin users and ageing biomarkers',
    summary: 'Observational human study demo; association-to-causation gap highlighted.',
    tags: ['observational', 'metformin'],
    publishedAt: iso('2022-03-01'),
    updatedAt: now,
    assessmentId: 'ea-paper-metformin-obs',
    dataOrigin: 'demo',
    authors: ['C. Cohort'],
    venue: 'Demo Epidemiology Letters',
    peerReviewStatus: 'peer_reviewed',
    studyDesign: 'cohort',
    speciesOrPopulation: 'Humans',
    findingDirection: 'positive',
    isCorrectionOrRetraction: false,
    relatedInterventionIds: ['int-metformin'],
    ageingHallmarks: ['deregulated_nutrient_sensing'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'paper-rapamycin-animal',
    type: 'paper',
    title: 'Demo murine study: intermittent rapamycin and healthspan metrics',
    summary: 'Animal-model evidence with explicit animal-to-human translation gap.',
    tags: ['animal', 'rapamycin'],
    publishedAt: iso('2021-08-01'),
    updatedAt: now,
    assessmentId: 'ea-paper-rapamycin-animal',
    dataOrigin: 'demo',
    authors: ['D. Murine'],
    venue: 'Demo Ageing Biology',
    peerReviewStatus: 'peer_reviewed',
    studyDesign: 'animal_experiment',
    speciesOrPopulation: 'Mice',
    findingDirection: 'positive',
    isCorrectionOrRetraction: false,
    relatedInterventionIds: ['int-rapamycin'],
    ageingHallmarks: ['deregulated_nutrient_sensing', 'disabled_macroautophagy'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'paper-rapamycin-early',
    type: 'paper',
    title: 'Demo early human interventional: low-dose rapamycin biomarkers',
    summary: 'Small early human interventional study; surrogate endpoints only.',
    tags: ['early-human', 'rapamycin'],
    publishedAt: iso('2024-01-15'),
    updatedAt: now,
    assessmentId: 'ea-paper-rapamycin-early',
    dataOrigin: 'demo',
    authors: ['E. Early'],
    venue: 'Demo Translational Ageing',
    peerReviewStatus: 'peer_reviewed',
    studyDesign: 'non_randomised_interventional',
    speciesOrPopulation: 'Humans',
    findingDirection: 'positive',
    isCorrectionOrRetraction: false,
    relatedInterventionIds: ['int-rapamycin'],
    ageingHallmarks: ['deregulated_nutrient_sensing'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'paper-exercise-synthesis',
    type: 'paper',
    title: 'Demo systematic synthesis: exercise and physical function in ageing',
    summary:
      'Replicated / synthesis-level evidence demo — low attention relative to strength (undernoticed quadrant).',
    tags: ['synthesis', 'exercise'],
    publishedAt: iso('2020-11-01'),
    updatedAt: now,
    assessmentId: 'ea-paper-exercise-synthesis',
    dataOrigin: 'demo',
    authors: ['F. Synthesis'],
    venue: 'Demo Cochrane-style Review (fictional)',
    peerReviewStatus: 'peer_reviewed',
    studyDesign: 'systematic_review_meta_analysis',
    speciesOrPopulation: 'Humans',
    findingDirection: 'positive',
    isCorrectionOrRetraction: false,
    relatedInterventionIds: ['int-exercise'],
    ageingHallmarks: ['stem_cell_exhaustion'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'paper-nmn-early',
    type: 'paper',
    title: 'Demo early human NMN trial preprint',
    summary: 'Preprint early human interventional study; not peer-reviewed in this demo snapshot.',
    tags: ['preprint', 'NMN'],
    publishedAt: iso('2025-09-01'),
    updatedAt: now,
    assessmentId: 'ea-paper-nmn-early',
    dataOrigin: 'demo',
    authors: ['G. Preprint'],
    venue: 'DemoRxiv',
    peerReviewStatus: 'preprint',
    studyDesign: 'randomised_controlled',
    speciesOrPopulation: 'Humans',
    findingDirection: 'positive',
    isCorrectionOrRetraction: false,
    relatedInterventionIds: ['int-nmn'],
    ageingHallmarks: ['mitochondrial_dysfunction'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'paper-nmn-invitro',
    type: 'paper',
    title: 'Demo in vitro NAD salvage modulation',
    summary: 'In vitro mechanistic paper; cell-to-organism gap.',
    tags: ['in-vitro', 'NAD'],
    publishedAt: iso('2019-04-01'),
    updatedAt: now,
    assessmentId: 'ea-paper-nmn-invitro',
    dataOrigin: 'demo',
    authors: ['H. Dish'],
    venue: 'Demo Cell Metabolism Letters',
    peerReviewStatus: 'peer_reviewed',
    studyDesign: 'in_vitro',
    speciesOrPopulation: 'Human cell lines',
    findingDirection: 'positive',
    isCorrectionOrRetraction: false,
    relatedInterventionIds: ['int-nmn'],
    ageingHallmarks: ['mitochondrial_dysfunction'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'paper-senolytic-animal',
    type: 'paper',
    title: 'Demo animal senolytic efficacy in frailty model',
    summary: 'Animal evidence used by high-attention creators; human translation unsettled.',
    tags: ['animal', 'senolytic'],
    publishedAt: iso('2023-02-01'),
    updatedAt: now,
    assessmentId: 'ea-paper-senolytic-animal',
    dataOrigin: 'demo',
    authors: ['I. Frailty'],
    venue: 'Demo Nature Ageing Analogue',
    peerReviewStatus: 'peer_reviewed',
    studyDesign: 'animal_experiment',
    speciesOrPopulation: 'Mice',
    findingDirection: 'positive',
    isCorrectionOrRetraction: false,
    relatedInterventionIds: ['int-senolytic-demo'],
    ageingHallmarks: ['cellular_senescence'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'paper-bpc-animal',
    type: 'paper',
    title: 'Demo BPC-157 wound healing in rodents',
    summary: 'Animal peptide evidence; not a human approval basis.',
    tags: ['peptide', 'animal'],
    publishedAt: iso('2017-06-01'),
    updatedAt: now,
    assessmentId: 'ea-paper-bpc-animal',
    dataOrigin: 'demo',
    authors: ['J. Peptide'],
    venue: 'Demo Experimental Surgery',
    peerReviewStatus: 'peer_reviewed',
    studyDesign: 'animal_experiment',
    speciesOrPopulation: 'Rats',
    findingDirection: 'positive',
    isCorrectionOrRetraction: false,
    relatedInterventionIds: ['pep-bpc157'],
    ageingHallmarks: ['altered_intercellular_communication'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'paper-epitalon-invitro',
    type: 'paper',
    title: 'Demo epitalon telomerase expression in vitro',
    summary: 'In vitro peptide paper with telomere hallmark tagging.',
    tags: ['in-vitro', 'peptide'],
    publishedAt: iso('2016-01-01'),
    updatedAt: now,
    assessmentId: 'ea-paper-epitalon-invitro',
    dataOrigin: 'demo',
    authors: ['K. Telomere'],
    venue: 'Demo Biogerontology Letters',
    peerReviewStatus: 'peer_reviewed',
    studyDesign: 'in_vitro',
    speciesOrPopulation: 'Human fibroblasts',
    findingDirection: 'positive',
    isCorrectionOrRetraction: false,
    relatedInterventionIds: ['pep-epitalon'],
    ageingHallmarks: ['telomere_attrition'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'paper-retraction-demo',
    type: 'paper',
    title: 'RETRACTED DEMO: exaggerated NAD clinical benefit claim',
    summary: 'Demonstration retraction/correction example. Do not treat as current evidence.',
    tags: ['retraction', 'demo'],
    publishedAt: iso('2022-01-01'),
    updatedAt: iso('2024-06-01'),
    assessmentId: 'ea-paper-retraction',
    dataOrigin: 'demo',
    authors: ['L. Retracted'],
    venue: 'Demo Predatory Outlet',
    peerReviewStatus: 'peer_reviewed',
    studyDesign: 'non_randomised_interventional',
    speciesOrPopulation: 'Humans',
    findingDirection: 'inconclusive',
    isCorrectionOrRetraction: true,
    correctionNote: 'Retracted after data integrity concerns (demo narrative).',
    relatedInterventionIds: ['int-nmn'],
    ageingHallmarks: ['mitochondrial_dysfunction'],
    provenance: {
      sourceIds: ['src-demo-manual', 'src-crossref-stub'],
      sourceRecordIds: ['srec-1', 'srec-5'],
    },
  },
  {
    id: 'paper-null-metformin',
    type: 'paper',
    title: 'Demo null finding: metformin and cognitive composite',
    summary: 'Null peer-reviewed human result for balance against positive-only narratives.',
    tags: ['null', 'cognition'],
    publishedAt: iso('2024-07-01'),
    updatedAt: now,
    assessmentId: 'ea-paper-null',
    dataOrigin: 'demo',
    authors: ['M. Null'],
    venue: 'Demo Neurology Ageing',
    peerReviewStatus: 'peer_reviewed',
    studyDesign: 'randomised_controlled',
    speciesOrPopulation: 'Humans',
    findingDirection: 'null',
    isCorrectionOrRetraction: false,
    relatedInterventionIds: ['int-metformin'],
    ageingHallmarks: ['altered_intercellular_communication'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
];

for (let i = 1; i <= 10; i++) {
  const maturity = maturityLadder[i % maturityLadder.length];
  const id = `paper-gen-${i}`;
  papers.push({
    id,
    type: 'paper',
    title: `Demo paper ${i}: ${maturity.replaceAll('_', ' ')} signal`,
    summary: `Fictional paper ${i} spanning evidence ladder for filters and radar density.`,
    tags: ['demo', maturity],
    publishedAt: iso(`202${i % 6}-0${(i % 9) + 1}-10`),
    updatedAt: now,
    assessmentId: `ea-${id}`,
    dataOrigin: 'demo',
    authors: [`Author ${i}`],
    venue: i % 3 === 0 ? 'DemoRxiv' : 'Demo Journal',
    peerReviewStatus: i % 3 === 0 ? 'preprint' : 'peer_reviewed',
    studyDesign: i % 2 ? 'cohort' : 'animal_experiment',
    speciesOrPopulation: i % 2 ? 'Humans' : 'Mice',
    findingDirection: ['positive', 'null', 'negative', 'mixed'][i % 4],
    isCorrectionOrRetraction: false,
    relatedInterventionIds: [interventions[i % interventions.length].id],
    ageingHallmarks: [hallmarks[i % hallmarks.length]],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  });
}

const trials = [
  {
    id: 'trial-metformin-tame-demo',
    type: 'trial',
    title: 'DEMO-TAME: metformin for ageing-related outcomes',
    summary:
      'Fictionalised large interventional trial dossier inspired by public TAME discourse — not the real registry record.',
    tags: ['metformin', 'ageing'],
    publishedAt: iso('2019-01-01'),
    updatedAt: now,
    assessmentId: 'ea-trial-metformin',
    dataOrigin: 'demo',
    registryId: 'DEMO-CT-0001',
    registryUrl: 'https://example.invalid/trials/DEMO-CT-0001',
    status: 'not_yet_recruiting',
    statusHistory: [
      { status: 'not_yet_recruiting', at: iso('2019-01-01'), note: 'Demo seeded status' },
    ],
    phase: 'Phase 3 (demo)',
    design: 'Randomised, parallel, placebo-controlled',
    conditions: ['Ageing-related multimorbidity (demo)'],
    interventions: ['Metformin'],
    relatedInterventionIds: ['int-metformin'],
    locations: [
      { country: 'United States', city: 'Demo City' },
      { country: 'Australia', city: 'Melbourne', australiaRelevant: true },
    ],
    healthyVolunteers: false,
    ageRange: '65-79',
    sponsor: 'Demo Longevity Consortium',
    primaryOutcomes: ['Time to new age-related disease (demo endpoint)'],
    enrollmentTarget: 3000,
    enrollmentActual: null,
    resultsPosted: false,
    provenance: {
      sourceIds: ['src-demo-manual', 'src-ctg-stub'],
      sourceRecordIds: ['srec-1', 'srec-3'],
    },
  },
  {
    id: 'trial-rapamycin-early',
    type: 'trial',
    title: 'Demo early rapamycin biomarker study',
    summary: 'Active not recruiting early-phase demo trial.',
    tags: ['rapamycin'],
    publishedAt: iso('2023-01-01'),
    updatedAt: now,
    assessmentId: 'ea-trial-rapamycin',
    dataOrigin: 'demo',
    registryId: 'DEMO-CT-0002',
    registryUrl: 'https://example.invalid/trials/DEMO-CT-0002',
    status: 'active_not_recruiting',
    statusHistory: [
      { status: 'recruiting', at: iso('2023-01-01') },
      { status: 'active_not_recruiting', at: iso('2025-11-01'), note: 'Enrollment closed (demo)' },
    ],
    phase: 'Phase 1/2 (demo)',
    design: 'Open-label',
    conditions: ['Healthy ageing volunteers (demo)'],
    interventions: ['Rapamycin'],
    relatedInterventionIds: ['int-rapamycin'],
    locations: [{ country: 'United States', city: 'Boston' }],
    healthyVolunteers: true,
    ageRange: '50-75',
    sponsor: 'Demo Translational Institute',
    primaryOutcomes: ['Safety', 'Selected ageing biomarkers'],
    enrollmentTarget: 40,
    enrollmentActual: 38,
    resultsPosted: false,
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'trial-nmn-recruiting',
    type: 'trial',
    title: 'Demo NMN metabolic outcomes — recruiting',
    summary: 'Newly recruiting demo trial for Trial Pulse.',
    tags: ['NMN', 'recruiting'],
    publishedAt: iso('2026-06-01'),
    updatedAt: now,
    assessmentId: 'ea-trial-nmn',
    dataOrigin: 'demo',
    registryId: 'DEMO-CT-0003',
    registryUrl: 'https://example.invalid/trials/DEMO-CT-0003',
    status: 'recruiting',
    statusHistory: [
      { status: 'not_yet_recruiting', at: iso('2026-04-01') },
      { status: 'recruiting', at: iso('2026-06-01') },
    ],
    phase: 'Phase 2 (demo)',
    design: 'RCT',
    conditions: ['Impaired glucose tolerance (demo)'],
    interventions: ['NMN'],
    relatedInterventionIds: ['int-nmn'],
    locations: [{ country: 'Australia', city: 'Sydney', australiaRelevant: true }],
    healthyVolunteers: false,
    ageRange: '40-70',
    sponsor: 'Demo Metabolic Lab AU',
    primaryOutcomes: ['HOMA-IR change'],
    enrollmentTarget: 120,
    enrollmentActual: 18,
    resultsPosted: false,
    provenance: {
      sourceIds: ['src-demo-manual', 'src-anzctr-stub'],
      sourceRecordIds: ['srec-1', 'srec-6'],
    },
  },
  {
    id: 'trial-senolytic-withdrawn',
    type: 'trial',
    title: 'Demo senolytic frailty trial — withdrawn',
    summary: 'Withdrawn trial example for status-change and safety narrative.',
    tags: ['withdrawn', 'senolytic'],
    publishedAt: iso('2024-01-01'),
    updatedAt: iso('2025-02-01'),
    assessmentId: 'ea-trial-senolytic',
    dataOrigin: 'demo',
    registryId: 'DEMO-CT-0004',
    registryUrl: 'https://example.invalid/trials/DEMO-CT-0004',
    status: 'withdrawn',
    statusHistory: [
      { status: 'recruiting', at: iso('2024-01-01') },
      {
        status: 'withdrawn',
        at: iso('2025-02-01'),
        note: 'Sponsor decision / safety monitoring (demo)',
      },
    ],
    phase: 'Phase 2 (demo)',
    design: 'RCT',
    conditions: ['Frailty (demo)'],
    interventions: ['Demo-Senol-X'],
    relatedInterventionIds: ['int-senolytic-demo'],
    locations: [{ country: 'United Kingdom', city: 'London' }],
    healthyVolunteers: false,
    ageRange: '70+',
    sponsor: 'Demo Biotech',
    primaryOutcomes: ['Frailty index'],
    enrollmentTarget: 80,
    enrollmentActual: 0,
    resultsPosted: false,
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'trial-exercise-au',
    type: 'trial',
    title: 'Demo Australian exercise and independence trial',
    summary: 'Australia-located completed trial with results posted.',
    tags: ['exercise', 'Australia'],
    publishedAt: iso('2018-01-01'),
    updatedAt: iso('2022-01-01'),
    assessmentId: 'ea-trial-exercise',
    dataOrigin: 'demo',
    registryId: 'DEMO-ACTRN-0005',
    registryUrl: 'https://example.invalid/trials/DEMO-ACTRN-0005',
    status: 'completed',
    statusHistory: [
      { status: 'recruiting', at: iso('2018-01-01') },
      { status: 'completed', at: iso('2021-06-01') },
    ],
    phase: 'N/A (behavioural)',
    design: 'RCT',
    conditions: ['Community-dwelling older adults'],
    interventions: ['Structured exercise'],
    relatedInterventionIds: ['int-exercise'],
    locations: [
      { country: 'Australia', city: 'Brisbane', australiaRelevant: true },
      { country: 'Australia', city: 'Adelaide', australiaRelevant: true },
    ],
    healthyVolunteers: true,
    ageRange: '65-85',
    sponsor: 'Demo AU University',
    primaryOutcomes: ['Short Physical Performance Battery'],
    enrollmentTarget: 200,
    enrollmentActual: 188,
    resultsPosted: true,
    provenance: {
      sourceIds: ['src-demo-manual', 'src-anzctr-stub'],
      sourceRecordIds: ['srec-1', 'srec-6'],
    },
  },
  {
    id: 'trial-bpc-early',
    type: 'trial',
    title: 'Demo BPC-157 early human safety study — terminated',
    summary: 'Terminated early peptide trial for safety/status teaching case.',
    tags: ['peptide', 'terminated'],
    publishedAt: iso('2022-05-01'),
    updatedAt: iso('2023-09-01'),
    assessmentId: 'ea-trial-bpc',
    dataOrigin: 'demo',
    registryId: 'DEMO-CT-0006',
    registryUrl: 'https://example.invalid/trials/DEMO-CT-0006',
    status: 'terminated',
    statusHistory: [
      { status: 'recruiting', at: iso('2022-05-01') },
      {
        status: 'terminated',
        at: iso('2023-09-01'),
        note: 'Terminated for enrollment futility (demo)',
      },
    ],
    phase: 'Phase 1 (demo)',
    design: 'Open-label',
    conditions: ['Healthy volunteers'],
    interventions: ['BPC-157'],
    relatedInterventionIds: ['pep-bpc157'],
    locations: [{ country: 'Canada', city: 'Toronto' }],
    healthyVolunteers: true,
    ageRange: '18-45',
    sponsor: 'Demo Peptide Co',
    primaryOutcomes: ['Adverse events'],
    enrollmentTarget: 24,
    enrollmentActual: 7,
    resultsPosted: false,
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
];

for (let i = 1; i <= 6; i++) {
  const id = `trial-gen-${i}`;
  trials.push({
    id,
    type: 'trial',
    title: `Demo trial ${i}`,
    summary: `Generated demo trial ${i} for list density.`,
    tags: ['demo'],
    publishedAt: iso(`202${i % 5}-03-01`),
    updatedAt: now,
    assessmentId: `ea-${id}`,
    dataOrigin: 'demo',
    registryId: `DEMO-CT-1${i}`,
    registryUrl: `https://example.invalid/trials/DEMO-CT-1${i}`,
    status: ['recruiting', 'completed', 'active_not_recruiting'][i % 3],
    statusHistory: [{ status: 'recruiting', at: iso('2024-01-01') }],
    phase: `Phase ${(i % 3) + 1}`,
    design: 'RCT',
    conditions: ['Demo condition'],
    interventions: ['Demo agent'],
    relatedInterventionIds: [interventions[i % interventions.length].id],
    locations:
      i % 2
        ? [{ country: 'Australia', city: 'Perth', australiaRelevant: true }]
        : [{ country: 'Germany', city: 'Berlin' }],
    healthyVolunteers: i % 2 === 0,
    ageRange: '18-80',
    sponsor: 'Demo Sponsor',
    primaryOutcomes: ['Demo endpoint'],
    enrollmentTarget: 50 + i * 10,
    enrollmentActual: i * 5,
    resultsPosted: i % 3 === 0,
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  });
}

const creators = [
  {
    id: 'creator-evidence-pod',
    type: 'creator',
    title: 'Evidence Hours (demo podcast)',
    summary: 'Scientist-hosted demo podcast with relatively careful citations.',
    tags: ['podcast', 'scientist'],
    publishedAt: iso('2020-01-01'),
    updatedAt: now,
    assessmentId: 'ea-creator-evidence',
    dataOrigin: 'demo',
    handle: '@evidencehours-demo',
    creatorType: 'podcast',
    platform: 'Podcast RSS (demo)',
    topics: ['exercise', 'trial literacy', 'metformin'],
    citationRateNote: 'High rate of primary-source links in show notes (demo metric).',
    sponsorshipDisclosures: ['Occasional book affiliate links disclosed'],
    relatedClaimIds: ['claim-exercise-undernoticed'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'creator-hype-yt',
    type: 'creator',
    title: 'Longevity Flash (demo YouTube)',
    summary: 'High-attention influencer channel; frequent overclaiming vs evidence maturity.',
    tags: ['youtube', 'influencer'],
    publishedAt: iso('2021-01-01'),
    updatedAt: now,
    assessmentId: 'ea-creator-hype',
    dataOrigin: 'demo',
    handle: '@longevityflash-demo',
    creatorType: 'influencer',
    platform: 'YouTube (demo)',
    topics: ['peptides', 'senolytics', 'NMN'],
    citationRateNote: 'Low citation rate; many anecdotal claims (demo metric).',
    sponsorshipDisclosures: ['Supplement brand sponsorships stated in descriptions'],
    relatedClaimIds: ['claim-senolytic-overclaim', 'claim-bpc-overclaim'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'creator-clinician-nl',
    type: 'creator',
    title: 'Clinic Notes AU (demo newsletter)',
    summary: 'Clinician newsletter focused on TGA-aware framing.',
    tags: ['newsletter', 'clinician'],
    publishedAt: iso('2019-01-01'),
    updatedAt: now,
    assessmentId: 'ea-creator-clinician',
    dataOrigin: 'demo',
    handle: 'clinicnotes-au-demo',
    creatorType: 'newsletter',
    platform: 'Email/RSS (demo)',
    topics: ['TGA', 'off-label', 'exercise'],
    citationRateNote: 'Moderate; prefers guidelines and regulator notices.',
    sponsorshipDisclosures: ['None stated'],
    relatedClaimIds: ['claim-tga-awareness'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
];

for (let i = 1; i <= 4; i++) {
  const id = `creator-gen-${i}`;
  creators.push({
    id,
    type: 'creator',
    title: `Demo Creator ${i}`,
    summary: `Generated creator profile ${i}.`,
    tags: ['demo'],
    publishedAt: iso('2022-01-01'),
    updatedAt: now,
    assessmentId: `ea-${id}`,
    dataOrigin: 'demo',
    handle: `@demo-creator-${i}`,
    creatorType: 'other',
    platform: 'X (demo)',
    topics: ['longevity'],
    citationRateNote: 'Unknown',
    sponsorshipDisclosures: [],
    relatedClaimIds: [],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  });
}

const claims = [
  {
    id: 'claim-senolytic-overclaim',
    type: 'claim',
    title: '“Demo-Senol-X reverses ageing in weeks”',
    summary: 'High-attention creator claim far ahead of human evidence.',
    tags: ['overclaim'],
    publishedAt: iso('2026-07-10'),
    updatedAt: now,
    assessmentId: 'ea-claim-senolytic',
    dataOrigin: 'demo',
    creatorId: 'creator-hype-yt',
    claimText:
      'Demo-Senol-X reverses biological ageing in weeks — animal papers prove it works in people.',
    relatedInterventionIds: ['int-senolytic-demo'],
    supportingPaperIds: ['paper-senolytic-animal'],
    conflictingPaperIds: [],
    evidenceAttentionDivergence: 'overclaimed',
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'claim-bpc-overclaim',
    type: 'claim',
    title: 'BPC-157 “clinic-ready” claim',
    summary: 'Unapproved peptide framed as established therapy.',
    tags: ['peptide', 'overclaim'],
    publishedAt: iso('2026-07-12'),
    updatedAt: now,
    assessmentId: 'ea-claim-bpc',
    dataOrigin: 'demo',
    creatorId: 'creator-hype-yt',
    claimText: 'BPC-157 is clinic-ready for tendon repair with negligible risk.',
    relatedInterventionIds: ['pep-bpc157'],
    supportingPaperIds: ['paper-bpc-animal'],
    conflictingPaperIds: [],
    evidenceAttentionDivergence: 'overclaimed',
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'claim-exercise-undernoticed',
    type: 'claim',
    title: 'Exercise evidence under-discussed vs supplements',
    summary: 'Creator notes strong evidence getting less feed attention than novel compounds.',
    tags: ['undernoticed'],
    publishedAt: iso('2026-07-08'),
    updatedAt: now,
    assessmentId: 'ea-claim-exercise',
    dataOrigin: 'demo',
    creatorId: 'creator-evidence-pod',
    claimText:
      'Structured training still has stronger functional evidence than most longevity supplements in the feed.',
    relatedInterventionIds: ['int-exercise'],
    supportingPaperIds: ['paper-exercise-synthesis'],
    conflictingPaperIds: [],
    evidenceAttentionDivergence: 'undernoticed',
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'claim-tga-awareness',
    type: 'claim',
    title: 'TGA compounding alert awareness',
    summary: 'Clinician newsletter flags demo TGA safety communication.',
    tags: ['TGA'],
    publishedAt: iso('2026-07-15'),
    updatedAt: now,
    assessmentId: 'ea-claim-tga',
    dataOrigin: 'demo',
    creatorId: 'creator-clinician-nl',
    claimText:
      'Australian clinicians should read the latest TGA demo safety communication on compounded peptides.',
    relatedInterventionIds: ['pep-bpc157'],
    supportingPaperIds: [],
    conflictingPaperIds: [],
    evidenceAttentionDivergence: 'aligned',
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
];

for (let i = 1; i <= 4; i++) {
  const id = `claim-gen-${i}`;
  claims.push({
    id,
    type: 'claim',
    title: `Demo claim ${i}`,
    summary: `Generated claim ${i}.`,
    tags: ['demo'],
    publishedAt: iso('2026-06-01'),
    updatedAt: now,
    assessmentId: `ea-${id}`,
    dataOrigin: 'demo',
    creatorId: creators[i % creators.length].id,
    claimText: `Demo claim text ${i}`,
    relatedInterventionIds: [interventions[i % interventions.length].id],
    supportingPaperIds: [],
    conflictingPaperIds: [],
    evidenceAttentionDivergence: 'unclear',
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  });
}

const regulatoryEvents = [
  {
    id: 'reg-tga-peptide',
    type: 'regulatory_event',
    title: 'TGA demo safety communication: compounded peptides',
    summary: 'Australia-relevant demo safety alert for unapproved compounded peptide products.',
    tags: ['TGA', 'peptides'],
    publishedAt: iso('2026-07-14'),
    updatedAt: now,
    assessmentId: 'ea-reg-tga-peptide',
    dataOrigin: 'demo',
    jurisdiction: 'AU',
    authority: 'TGA (demo)',
    severity: 'high',
    eventKind: 'safety_alert',
    relatedInterventionIds: ['pep-bpc157', 'pep-epitalon'],
    officialUrl: 'https://example.invalid/tga/demo-peptide-alert',
    provenance: { sourceIds: ['src-tga-stub'], sourceRecordIds: ['srec-4'] },
  },
  {
    id: 'reg-tga-recall',
    type: 'regulatory_event',
    title: 'TGA demo recall: contaminated NAD product batch',
    summary: 'Fictional ARTG-adjacent recall narrative for product-quality uncertainty.',
    tags: ['TGA', 'recall'],
    publishedAt: iso('2026-06-20'),
    updatedAt: now,
    assessmentId: 'ea-reg-tga-recall',
    dataOrigin: 'demo',
    jurisdiction: 'AU',
    authority: 'TGA (demo)',
    severity: 'critical',
    eventKind: 'recall',
    relatedInterventionIds: ['int-nmn'],
    officialUrl: 'https://example.invalid/tga/demo-recall',
    provenance: { sourceIds: ['src-tga-stub'], sourceRecordIds: ['srec-4'] },
  },
  {
    id: 'reg-fda-label',
    type: 'regulatory_event',
    title: 'FDA demo label update: sirolimus interaction caution',
    summary: 'US label-change demo tied to rapamycin dossier.',
    tags: ['FDA', 'label'],
    publishedAt: iso('2025-12-01'),
    updatedAt: now,
    assessmentId: 'ea-reg-fda-label',
    dataOrigin: 'demo',
    jurisdiction: 'US',
    authority: 'FDA (demo)',
    severity: 'moderate',
    eventKind: 'label_change',
    relatedInterventionIds: ['int-rapamycin'],
    officialUrl: 'https://example.invalid/fda/demo-label',
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
  {
    id: 'reg-wada-peptide',
    type: 'regulatory_event',
    title: 'WADA status note: BPC-157 prohibited (demo)',
    summary: 'Sport/WADA prohibited status callout for peptide dossier.',
    tags: ['WADA'],
    publishedAt: iso('2024-01-01'),
    updatedAt: now,
    assessmentId: 'ea-reg-wada',
    dataOrigin: 'demo',
    jurisdiction: 'global',
    authority: 'WADA (demo reference)',
    severity: 'info',
    eventKind: 'status_change',
    relatedInterventionIds: ['pep-bpc157'],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
];

for (let i = 1; i <= 3; i++) {
  const id = `reg-gen-${i}`;
  regulatoryEvents.push({
    id,
    type: 'regulatory_event',
    title: `Demo regulatory event ${i}`,
    summary: `Generated regulatory event ${i}.`,
    tags: ['demo'],
    publishedAt: iso('2025-01-01'),
    updatedAt: now,
    assessmentId: `ea-${id}`,
    dataOrigin: 'demo',
    jurisdiction: i === 1 ? 'AU' : 'US',
    authority: 'Demo Authority',
    severity: 'low',
    eventKind: 'advisory',
    relatedInterventionIds: [interventions[i].id],
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  });
}

const organisations = [
  {
    id: 'org-tga',
    type: 'organisation',
    title: 'Therapeutic Goods Administration (demo ref)',
    summary: 'Australian regulator reference organisation for safety context.',
    tags: ['regulator', 'AU'],
    publishedAt: null,
    updatedAt: now,
    dataOrigin: 'demo',
    organisationKind: 'regulator',
    country: 'Australia',
    homepageUrl: 'https://www.tga.gov.au/',
    provenance: { sourceIds: ['src-tga-stub'], sourceRecordIds: ['srec-4'] },
  },
  {
    id: 'org-ctg',
    type: 'organisation',
    title: 'ClinicalTrials.gov (demo ref)',
    summary: 'US trial registry reference.',
    tags: ['registry'],
    publishedAt: null,
    updatedAt: now,
    dataOrigin: 'demo',
    organisationKind: 'registry',
    country: 'United States',
    homepageUrl: 'https://clinicaltrials.gov/',
    provenance: { sourceIds: ['src-ctg-stub'], sourceRecordIds: ['srec-3'] },
  },
  {
    id: 'org-anzctr',
    type: 'organisation',
    title: 'ANZCTR (demo ref)',
    summary: 'Australian New Zealand Clinical Trials Registry reference.',
    tags: ['registry', 'AU'],
    publishedAt: null,
    updatedAt: now,
    dataOrigin: 'demo',
    organisationKind: 'registry',
    country: 'Australia',
    homepageUrl: 'https://www.anzctr.org.au/',
    provenance: { sourceIds: ['src-anzctr-stub'], sourceRecordIds: ['srec-6'] },
  },
  {
    id: 'org-demo-uni',
    type: 'organisation',
    title: 'Demo AU University Ageing Centre',
    summary: 'Fictional university sponsor/org.',
    tags: ['university'],
    publishedAt: null,
    updatedAt: now,
    dataOrigin: 'demo',
    organisationKind: 'university',
    country: 'Australia',
    homepageUrl: 'https://example.invalid/uni',
    provenance: { sourceIds: ['src-demo-manual'], sourceRecordIds: ['srec-1'] },
  },
];

const watchlists = [
  {
    id: 'wl-core',
    name: 'Core longevity watch',
    description: 'Default demo watchlist spanning evidence tiers.',
    itemIds: [
      'int-metformin',
      'int-rapamycin',
      'int-exercise',
      'int-nmn',
      'pep-bpc157',
      'creator-hype-yt',
    ],
    topics: ['mTOR', 'NAD', 'peptides', 'exercise'],
    updatedAt: now,
    dataOrigin: 'demo',
  },
  {
    id: 'wl-au-safety',
    name: 'Australia safety focus',
    description: 'TGA-relevant demo items.',
    itemIds: ['reg-tga-peptide', 'reg-tga-recall', 'pep-bpc157', 'trial-nmn-recruiting'],
    topics: ['TGA', 'Australia'],
    updatedAt: now,
    dataOrigin: 'demo',
  },
];

const changeEvents = [
  {
    id: 'chg-1',
    kind: 'safety_alert',
    title: 'New TGA demo peptide safety communication',
    summary: 'High-severity AU alert added to Safety & Regulation.',
    occurredAt: iso('2026-07-14T04:00:00.000Z'),
    relatedItemIds: ['reg-tga-peptide'],
    importance: 'high',
    dataOrigin: 'demo',
  },
  {
    id: 'chg-2',
    kind: 'trial_status_change',
    title: 'NMN demo trial moved to recruiting',
    summary: 'Trial Pulse status change with AU location.',
    occurredAt: iso('2026-07-01T00:00:00.000Z'),
    relatedItemIds: ['trial-nmn-recruiting'],
    importance: 'medium',
    dataOrigin: 'demo',
  },
  {
    id: 'chg-3',
    kind: 'new_paper',
    title: 'NMN early human preprint appeared',
    summary: 'Research Brief addition — preprint labelled.',
    occurredAt: iso('2026-07-11T12:00:00.000Z'),
    relatedItemIds: ['paper-nmn-early'],
    importance: 'medium',
    dataOrigin: 'demo',
  },
  {
    id: 'chg-4',
    kind: 'creator_claim',
    title: 'Overclaim on Demo-Senol-X',
    summary: 'Creator Claims flagged evidence–attention divergence.',
    occurredAt: iso('2026-07-10T18:00:00.000Z'),
    relatedItemIds: ['claim-senolytic-overclaim'],
    importance: 'high',
    dataOrigin: 'demo',
  },
  {
    id: 'chg-5',
    kind: 'correction_or_retraction',
    title: 'Retraction demo record highlighted',
    summary: 'Correction/retraction example surfaced for review.',
    occurredAt: iso('2026-07-09T09:00:00.000Z'),
    relatedItemIds: ['paper-retraction-demo'],
    importance: 'high',
    dataOrigin: 'demo',
  },
  {
    id: 'chg-6',
    kind: 'trial_status_change',
    title: 'Senolytic demo trial withdrawn',
    summary: 'Terminated/withdrawn pathway example.',
    occurredAt: iso('2025-02-01T00:00:00.000Z'),
    relatedItemIds: ['trial-senolytic-withdrawn'],
    importance: 'medium',
    dataOrigin: 'demo',
  },
];

const reviewTasks = [
  {
    id: 'rev-1',
    title: 'Confirm entity match: Demo-Senol-X aliases',
    reason: 'Low-confidence alias collision with unrelated kinase inhibitor name in seed.',
    status: 'open',
    relatedItemIds: ['int-senolytic-demo'],
    confidence: 0.32,
    createdAt: iso('2026-07-16T00:00:00.000Z'),
    dataOrigin: 'demo',
  },
  {
    id: 'rev-2',
    title: 'Review AI-ready summary field (unused in M1)',
    reason: 'Placeholder review task for future AI provenance queue.',
    status: 'open',
    relatedItemIds: ['paper-nmn-early'],
    confidence: 0.4,
    createdAt: iso('2026-07-17T00:00:00.000Z'),
    dataOrigin: 'demo',
  },
  {
    id: 'rev-3',
    title: 'Peptide claim vs animal-only papers',
    reason: 'Claim extraction confidence low; needs human confirmation.',
    status: 'open',
    relatedItemIds: ['claim-bpc-overclaim', 'pep-bpc157'],
    confidence: 0.28,
    createdAt: iso('2026-07-18T00:00:00.000Z'),
    dataOrigin: 'demo',
  },
];

// Assessments for all subjects
const assessments = [];

function pushA(a) {
  assessments.push(a);
}

pushA(
  assessment(
    'ea-int-metformin',
    'int-metformin',
    'intervention',
    'regulatory_or_guideline_supported',
    0.55,
    {
      studyDesign: 'randomised_controlled',
      peerReviewStatus: 'peer_reviewed',
      confidenceScore: 0.82,
      confidenceRationale: [
        'Approved indication with large human exposure for diabetes.',
        'Longevity indication remains unproven; separate from approved use.',
      ],
      translationGaps: ['disease_treatment_to_longevity'],
      regulatoryStatuses: [
        { jurisdiction: 'AU', status: 'approved', indication: 'Type 2 diabetes' },
        { jurisdiction: 'US', status: 'approved', indication: 'Type 2 diabetes' },
        { jurisdiction: 'AU', status: 'off_label', indication: 'Longevity (not established)' },
      ],
      safetyNotes: [
        'GI adverse effects common; lactic acidosis rare but serious in susceptible patients.',
      ],
      whatWouldChangeAssessment: [
        'Completed large RCT with hard ageing outcomes (demo TAME-like).',
      ],
    },
  ),
);

pushA(
  assessment(
    'ea-int-rapamycin',
    'int-rapamycin',
    'intervention',
    'early_human_interventional',
    0.7,
    {
      studyDesign: 'non_randomised_interventional',
      confidenceScore: 0.58,
      translationGaps: ['animal_to_human', 'biomarker_to_health_outcome'],
      regulatoryStatuses: [
        { jurisdiction: 'US', status: 'approved', indication: 'Transplant (context)' },
        { jurisdiction: 'AU', status: 'approved', indication: 'Specific approved contexts' },
        { jurisdiction: 'global', status: 'off_label', indication: 'Longevity dosing' },
      ],
      safetyNotes: ['Immunosuppression and metabolic adverse effects require clinical oversight.'],
    },
  ),
);

pushA(
  assessment(
    'ea-int-exercise',
    'int-exercise',
    'intervention',
    'replicated_controlled_or_synthesis',
    0.25,
    {
      studyDesign: 'systematic_review_meta_analysis',
      confidenceScore: 0.9,
      confidenceRationale: [
        'Multiple RCTs and syntheses support functional outcomes.',
        'Low social-feed attention relative to evidence strength in this demo.',
      ],
      attentionRationale: [
        'Demo attention score kept low to illustrate undernoticed strong evidence.',
      ],
      regulatoryStatuses: [{ jurisdiction: 'global', status: 'unknown' }],
      translationGaps: [],
    },
  ),
);

pushA(
  assessment('ea-int-nmn', 'int-nmn', 'intervention', 'early_human_interventional', 0.85, {
    confidenceScore: 0.45,
    translationGaps: ['biomarker_to_health_outcome', 'short_term_to_durable'],
    regulatoryStatuses: [
      { jurisdiction: 'AU', status: 'unknown' },
      { jurisdiction: 'US', status: 'unapproved' },
    ],
    safetyNotes: ['Product quality variability; see demo TGA recall narrative.'],
  }),
);

pushA(
  assessment('ea-int-senolytic', 'int-senolytic-demo', 'intervention', 'animal_model', 0.92, {
    confidenceScore: 0.3,
    translationGaps: ['animal_to_human'],
    regulatoryStatuses: [{ jurisdiction: 'global', status: 'investigational' }],
    safetyNotes: ['Withdrawn demo trial; human safety unsettled.'],
    attentionRationale: ['Viral creator coverage drives attention far above evidence maturity.'],
  }),
);

pushA(
  assessment('ea-pep-bpc157', 'pep-bpc157', 'peptide', 'animal_model', 0.88, {
    confidenceScore: 0.25,
    translationGaps: ['animal_to_human'],
    regulatoryStatuses: [
      { jurisdiction: 'AU', status: 'unapproved' },
      { jurisdiction: 'US', status: 'unapproved' },
      { jurisdiction: 'global', status: 'prohibited' },
    ],
    safetyNotes: [
      'Unapproved peptide; compounding quality and sterility uncertainty.',
      'WADA prohibited status relevant for athletes.',
    ],
  }),
);

pushA(
  assessment('ea-pep-epitalon', 'pep-epitalon', 'peptide', 'in_vitro_ex_vivo', 0.6, {
    confidenceScore: 0.2,
    translationGaps: ['cell_to_organism', 'animal_to_human'],
    regulatoryStatuses: [{ jurisdiction: 'global', status: 'unknown' }],
    safetyNotes: ['Unapproved peptide demonstration example.'],
  }),
);

for (const p of peptides.filter((x) => x.id.startsWith('pep-gen-'))) {
  pushA(
    assessment(`ea-${p.id}`, p.id, 'peptide', 'mechanistic_hypothesis', 0.4 + Math.random() * 0.2, {
      confidenceScore: 0.2,
      regulatoryStatuses: [{ jurisdiction: 'global', status: 'unapproved' }],
      safetyNotes: ['Unapproved demo peptide.'],
      translationGaps: ['cell_to_organism'],
    }),
  );
}
for (const it of interventions.filter((x) => x.id.startsWith('int-gen-'))) {
  pushA(
    assessment(
      `ea-${it.id}`,
      it.id,
      'intervention',
      maturityLadder[it.id.length % maturityLadder.length],
      0.3,
      {
        confidenceScore: 0.4,
        regulatoryStatuses: [{ jurisdiction: 'global', status: 'unknown' }],
      },
    ),
  );
}

const paperAssessmentMap = {
  'paper-metformin-rct': ['controlled_clinical_trial', 0.4, 0.75],
  'paper-metformin-obs': ['human_observational', 0.35, 0.55],
  'paper-rapamycin-animal': ['animal_model', 0.5, 0.5],
  'paper-rapamycin-early': ['early_human_interventional', 0.55, 0.5],
  'paper-exercise-synthesis': ['replicated_controlled_or_synthesis', 0.2, 0.88],
  'paper-nmn-early': ['early_human_interventional', 0.7, 0.42],
  'paper-nmn-invitro': ['in_vitro_ex_vivo', 0.3, 0.4],
  'paper-senolytic-animal': ['animal_model', 0.8, 0.35],
  'paper-bpc-animal': ['animal_model', 0.75, 0.3],
  'paper-epitalon-invitro': ['in_vitro_ex_vivo', 0.45, 0.25],
  'paper-retraction-demo': ['early_human_interventional', 0.5, 0.1],
  'paper-null-metformin': ['controlled_clinical_trial', 0.3, 0.7],
};

for (const paper of papers) {
  const mapped = paperAssessmentMap[paper.id];
  const maturity = mapped ? mapped[0] : maturityLadder[paper.id.length % maturityLadder.length];
  const attention = mapped ? mapped[1] : 0.3;
  const confidence = mapped ? mapped[2] : 0.4;
  pushA(
    assessment(paper.assessmentId, paper.id, 'paper', maturity, attention, {
      studyDesign: paper.studyDesign,
      peerReviewStatus: paper.peerReviewStatus,
      confidenceScore: confidence,
      translationGaps:
        paper.speciesOrPopulation.includes('Mice') || paper.speciesOrPopulation.includes('Rats')
          ? ['animal_to_human']
          : paper.studyDesign === 'in_vitro'
            ? ['cell_to_organism']
            : paper.studyDesign === 'cohort'
              ? ['association_to_causation']
              : [],
      safetyNotes: paper.isCorrectionOrRetraction
        ? ['Retracted or corrected — do not use as current evidence.']
        : [],
    }),
  );
}

for (const trial of trials) {
  const maturity = trial.resultsPosted ? 'controlled_clinical_trial' : 'early_human_interventional';
  pushA(
    assessment(
      trial.assessmentId,
      trial.id,
      'trial',
      maturity,
      trial.status === 'recruiting' ? 0.65 : 0.4,
      {
        confidenceScore: trial.status === 'withdrawn' || trial.status === 'terminated' ? 0.25 : 0.5,
        safetyNotes:
          trial.status === 'withdrawn' || trial.status === 'terminated'
            ? ['Trial ended early — interpret cautiously.']
            : [],
        regulatoryStatuses: [{ jurisdiction: 'global', status: 'investigational' }],
      },
    ),
  );
}

for (const c of creators) {
  pushA(
    assessment(
      c.assessmentId,
      c.id,
      'creator',
      'social_anecdotal',
      c.id.includes('hype') ? 0.9 : 0.4,
      {
        confidenceScore: 0.35,
        attentionRationale: ['Creator attention is not scientific validation.'],
      },
    ),
  );
}
for (const c of claims) {
  pushA(
    assessment(
      c.assessmentId,
      c.id,
      'claim',
      c.id.includes('exercise') ? 'replicated_controlled_or_synthesis' : 'social_anecdotal',
      c.id.includes('overclaim') ? 0.9 : 0.4,
      {
        confidenceScore: 0.3,
      },
    ),
  );
}
for (const r of regulatoryEvents) {
  pushA(
    assessment(r.assessmentId, r.id, 'regulatory_event', 'regulatory_or_guideline_supported', 0.5, {
      confidenceScore: 0.7,
      safetyNotes: [r.summary],
      regulatoryStatuses: [
        {
          jurisdiction: r.jurisdiction,
          status: r.severity === 'critical' || r.severity === 'high' ? 'unapproved' : 'unknown',
        },
      ],
    }),
  );
}

const radar = [];
const radarSubjects = [
  ...interventions.map((x) => ({ item: x, shape: 'intervention' })),
  ...peptides.map((x) => ({ item: x, shape: 'intervention' })),
  ...papers.slice(0, 12).map((x) => ({ item: x, shape: 'paper' })),
  ...trials.map((x) => ({ item: x, shape: 'trial' })),
  ...claims.map((x) => ({ item: x, shape: 'creator_claim' })),
  ...regulatoryEvents.map((x) => ({ item: x, shape: 'regulatory_event' })),
];

for (const { item, shape } of radarSubjects) {
  const ea = assessments.find((a) => a.id === item.assessmentId);
  if (!ea) continue;
  radar.push({
    id: `radar-${item.id}`,
    label: item.title,
    itemId: item.id,
    itemType: item.type,
    evidenceMaturity: ea.maturity,
    evidenceX: maturityX[ea.maturity],
    attentionY: ea.attentionScore,
    bubbleSize: Math.min(1, 0.3 + ea.attentionScore * 0.4 + (1 - ea.confidenceScore) * 0.2),
    safetyConcern:
      ea.safetyNotes.length > 0 ||
      ea.regulatoryStatuses.some((s) => s.status === 'unapproved' || s.status === 'prohibited'),
    shape,
  });
}

const counts = {
  papers: papers.length,
  trials: trials.length,
  interventions: interventions.length,
  peptides: peptides.length,
  creators: creators.length,
  claims: claims.length,
  regulatoryEvents: regulatoryEvents.length,
  organisations: organisations.length,
  watchlists: watchlists.length,
  changeEvents: changeEvents.length,
  reviewTasks: reviewTasks.length,
  assessments: assessments.length,
  sources: sources.length,
  sourceRecords: sourceRecords.length,
  radar: radar.length,
};
const totalRecords =
  papers.length +
  trials.length +
  interventions.length +
  peptides.length +
  creators.length +
  claims.length +
  regulatoryEvents.length +
  organisations.length +
  watchlists.length +
  changeEvents.length +
  reviewTasks.length;

mkdirSync(dirname(outPath), { recursive: true });

const file = `// AUTO-GENERATED by scripts/generate-seed.mjs — demo snapshot data only.
import type { SeedBundle } from '../schemas.js';
import { DEMO_SNAPSHOT_NOTICE } from '../taxonomies.js';

export const SEED_RECORD_COUNTS = ${JSON.stringify(counts, null, 2)} as const;

export const SEED_TOTAL_CONTENT_RECORDS = ${totalRecords};

export const seedBundle = {
  demoNotice: DEMO_SNAPSHOT_NOTICE,
  generatedAt: ${JSON.stringify(now)},
  sources: ${JSON.stringify(sources, null, 2)},
  sourceRecords: ${JSON.stringify(sourceRecords, null, 2)},
  assessments: ${JSON.stringify(assessments, null, 2)},
  papers: ${JSON.stringify(papers, null, 2)},
  trials: ${JSON.stringify(trials, null, 2)},
  interventions: ${JSON.stringify(interventions, null, 2)},
  peptides: ${JSON.stringify(peptides, null, 2)},
  creators: ${JSON.stringify(creators, null, 2)},
  claims: ${JSON.stringify(claims, null, 2)},
  regulatoryEvents: ${JSON.stringify(regulatoryEvents, null, 2)},
  organisations: ${JSON.stringify(organisations, null, 2)},
  watchlists: ${JSON.stringify(watchlists, null, 2)},
  changeEvents: ${JSON.stringify(changeEvents, null, 2)},
  reviewTasks: ${JSON.stringify(reviewTasks, null, 2)},
  radar: ${JSON.stringify(radar, null, 2)},
} as const satisfies SeedBundle;

export const seedMeta = {
  lastVisitAt: ${JSON.stringify(lastVisit)},
  asOf: ${JSON.stringify(now)},
} as const;
`;

writeFileSync(outPath, file);
console.log('Wrote', outPath);
console.log('Total content records:', totalRecords);
console.log(counts);
