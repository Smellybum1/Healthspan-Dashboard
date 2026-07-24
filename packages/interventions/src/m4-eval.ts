import { assertM4CorporaMinima, M4_IDENTITY_CORPUS } from './m4-corpora.js';

export function runInterventionsEval() {
  const minima = assertM4CorporaMinima();
  const exactFirst = M4_IDENTITY_CORPUS.filter((c) => c.expectExactFirst).length;
  const neverApproval = M4_IDENTITY_CORPUS.every((c) => c.neverInferApproval);
  return {
    suite: 'interventions:eval',
    minima,
    exactFirstCases: exactFirst,
    neverInferApproval: neverApproval,
    ok: minima.ok && neverApproval,
  };
}

export function runRegulatoryEval() {
  const minima = assertM4CorporaMinima();
  return {
    suite: 'regulatory:eval',
    minima,
    boundaries: {
      missMeansUnapproved: false,
      trialMeansAuthorized: false,
      labelPresenceApproves: false,
    },
    ok: minima.ok && minima.regulatory >= 72,
  };
}
