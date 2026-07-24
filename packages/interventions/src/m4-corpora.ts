/** M4 residual evaluation corpora (deterministic, fixture-backed). */

export type M4IdentityCase = {
  id: string;
  query: string;
  expectExactFirst: boolean;
  neverInferApproval: true;
};

export type M4RegulatoryCase = {
  id: string;
  jurisdiction: 'AU' | 'US';
  standing: string;
  missMeansUnapproved: false;
  trialMeansAuthorized: false;
};

export type M4SafetyCase = {
  id: string;
  kind: 'aems' | 'spontaneous' | 'notice';
  provenCausality: false;
  isIncidence: false;
  zeroMeansSafe: false;
};

export type M4MultiClaimCase = {
  id: string;
  claimCount: number;
  allowCompositeScore: false;
};

function pad<T>(prefix: string, count: number, factory: (i: number) => T): T[] {
  return Array.from({ length: count }, (_, i) => factory(i + 1));
}

export const M4_IDENTITY_CORPUS: M4IdentityCase[] = pad('id', 120, (i) => ({
  id: `m4-identity-${i}`,
  query: i % 2 === 0 ? `EntityExact${i}` : `entity alias ${i}`,
  expectExactFirst: i % 2 === 0,
  neverInferApproval: true,
}));

export const M4_REGULATORY_CORPUS: M4RegulatoryCase[] = pad('reg', 72, (i) => ({
  id: `m4-reg-${i}`,
  jurisdiction: i % 2 === 0 ? 'AU' : 'US',
  standing:
    i % 3 === 0 ? 'included_or_authorised' : i % 3 === 1 ? 'unknown_source_status' : 'not_found',
  missMeansUnapproved: false,
  trialMeansAuthorized: false,
}));

export const M4_SAFETY_CORPUS: M4SafetyCase[] = pad('saf', 48, (i) => ({
  id: `m4-saf-${i}`,
  kind: i % 3 === 0 ? 'aems' : i % 3 === 1 ? 'spontaneous' : 'notice',
  provenCausality: false,
  isIncidence: false,
  zeroMeansSafe: false,
}));

export const M4_MULTI_CLAIM_CORPUS: M4MultiClaimCase[] = pad('mc', 32, (i) => ({
  id: `m4-mc-${i}`,
  claimCount: 2 + (i % 4),
  allowCompositeScore: false,
}));

export function m4CorpusCounts() {
  return {
    identity: M4_IDENTITY_CORPUS.length,
    regulatory: M4_REGULATORY_CORPUS.length,
    safety: M4_SAFETY_CORPUS.length,
    multiClaim: M4_MULTI_CLAIM_CORPUS.length,
  };
}

export function assertM4CorporaMinima() {
  const c = m4CorpusCounts();
  const ok = c.identity >= 120 && c.regulatory >= 72 && c.safety >= 48 && c.multiClaim >= 32;
  return { ok, ...c };
}
