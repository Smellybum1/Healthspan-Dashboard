import { analyzeNormalizedRecord, type NormalizedLiveRecord } from '@healthspan/intelligence';

type Expectation = {
  availability?: string;
  maturity?: string;
  gap?: string;
  role?: string;
};

type Case = { id: string; record: NormalizedLiveRecord; expect: Expectation };

const cases: Case[] = [];

function add(id: string, record: NormalizedLiveRecord, expect: Expectation) {
  cases.push({ id, record, expect });
}

// Protocol vs results
for (let i = 0; i < 12; i += 1) {
  add(
    `trial-protocol-${i}`,
    {
      type: 'trial',
      title: `Protocol trial ${i}`,
      summary: 'Recruiting protocol',
      resultsPosted: false,
      overallStatus: 'RECRUITING',
      nctId: `NCT1000000${i}`,
    },
    { availability: 'protocol_only', role: 'protocol_intent', gap: 'protocol_to_results' },
  );
}
for (let i = 0; i < 8; i += 1) {
  add(
    `trial-results-${i}`,
    {
      type: 'trial',
      title: `Results trial ${i}`,
      summary: 'Results posted',
      resultsPosted: true,
      overallStatus: 'COMPLETED',
      nctId: `NCT2000000${i}`,
    },
    { availability: 'results_posted_registry' },
  );
}

// Animal / cell / observational / synthesis papers
for (let i = 0; i < 10; i += 1) {
  add(
    `animal-${i}`,
    {
      type: 'paper',
      title: `Animal paper ${i}`,
      summary: 'Murine lifespan',
      studyDesign: 'animal_experiment',
    },
    { maturity: 'animal_model', gap: 'animal_to_human' },
  );
}
for (let i = 0; i < 8; i += 1) {
  add(
    `invitro-${i}`,
    {
      type: 'paper',
      title: `Cell paper ${i}`,
      summary: 'In vitro senescence',
      studyDesign: 'in_vitro',
    },
    { maturity: 'in_vitro_ex_vivo', gap: 'cell_to_organism' },
  );
}
for (let i = 0; i < 8; i += 1) {
  add(
    `observational-${i}`,
    {
      type: 'paper',
      title: `Observational paper ${i}`,
      summary: 'Cohort association',
      studyDesign: 'observational',
    },
    { maturity: 'human_observational', gap: 'observational_to_interventional' },
  );
}
for (let i = 0; i < 8; i += 1) {
  add(
    `synthesis-${i}`,
    {
      type: 'paper',
      title: `Review ${i}`,
      summary: 'Meta-analysis',
      studyDesign: 'systematic_review_meta_analysis',
    },
    { maturity: 'replicated_controlled_or_synthesis' },
  );
}

// Regulatory
for (let i = 0; i < 10; i += 1) {
  add(
    `tga-${i}`,
    {
      type: 'regulatory_event',
      title: `TGA notice ${i}`,
      summary: 'Safety alert mentioning metformin',
      relevanceMatched: true,
    },
    { maturity: 'regulatory_or_guideline_supported', availability: 'regulatory_statement' },
  );
}

// Human interventional papers
for (let i = 0; i < 8; i += 1) {
  add(
    `human-int-${i}`,
    {
      type: 'paper',
      title: `Human interventional ${i}`,
      summary: 'Randomized adult participants',
      studyDesign: 'randomized_controlled_trial',
    },
    { maturity: 'early_human_interventional' },
  );
}

let passed = 0;
const failures: string[] = [];
for (const c of cases) {
  const result = analyzeNormalizedRecord(c.record);
  const checks = [
    !c.expect.availability || result.profile.evidenceAvailability === c.expect.availability,
    !c.expect.maturity || result.profile.evidenceMaturity === c.expect.maturity,
    !c.expect.gap || result.profile.translationGaps.includes(c.expect.gap),
    !c.expect.role || result.claims[0]?.assertionRole === c.expect.role,
    result.claims.every((cl) => Boolean(cl.primaryExcerpt && cl.fingerprint)),
  ];
  if (checks.every(Boolean)) passed += 1;
  else failures.push(c.id);
}

const report = {
  suite: 'intelligence:eval',
  total: cases.length,
  passed,
  failed: cases.length - passed,
  failures: failures.slice(0, 20),
  meetsMinimum72: cases.length >= 72,
};

console.log(JSON.stringify(report, null, 2));
process.exit(passed === cases.length && cases.length >= 72 ? 0 : 1);
