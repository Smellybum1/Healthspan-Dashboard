import { analyzeNormalizedRecord } from '@healthspan/intelligence';

const cases = [
  {
    id: 'trial-protocol',
    record: {
      type: 'trial',
      title: 'Aging protocol',
      summary: 'Plan only',
      resultsPosted: false,
      overallStatus: 'RECRUITING',
    },
    expect: { availability: 'protocol_only' },
  },
  {
    id: 'animal-paper',
    record: {
      type: 'paper',
      title: 'Mouse study',
      summary: 'Lifespan',
      studyDesign: 'animal_experiment',
    },
    expect: { maturity: 'animal_model' },
  },
  {
    id: 'regulatory',
    record: {
      type: 'regulatory_event',
      title: 'TGA alert',
      summary: 'Safety notice',
    },
    expect: { maturity: 'regulatory_or_guideline_supported' },
  },
] as const;

let passed = 0;
for (const c of cases) {
  const result = analyzeNormalizedRecord(c.record);
  const okAvailability =
    !('availability' in c.expect) ||
    result.profile.evidenceAvailability === c.expect.availability;
  const okMaturity =
    !('maturity' in c.expect) || result.profile.evidenceMaturity === c.expect.maturity;
  const ok = okAvailability && okMaturity && result.claims.every((cl) => cl.primaryExcerpt);
  if (ok) passed += 1;
  else console.error('FAIL', c.id, result.profile);
}

console.log(
  JSON.stringify(
    {
      suite: 'intelligence:eval',
      total: cases.length,
      passed,
      failed: cases.length - passed,
      note: 'Seed corpus expands toward the M3 72-case requirement in subsequent commits.',
    },
    null,
    2,
  ),
);
process.exit(passed === cases.length ? 0 : 1);
