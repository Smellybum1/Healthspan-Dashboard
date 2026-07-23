import { closeDatabase, openDatabase, creatorClaims, creatorEntities, platformPolicyState } from '@healthspan/db';
import { CREATOR_PROHIBITED_SCORES } from '@healthspan/creators';

const { db, sqlite } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});

const creators = db.select().from(creatorEntities).all();
const claims = db.select().from(creatorClaims).all();
const policies = db.select().from(platformPolicyState).all();

const report = {
  suite: 'creators:doctor',
  creatorCount: creators.length,
  claimCount: claims.length,
  policyCount: policies.length,
  prohibitedScores: CREATOR_PROHIBITED_SCORES,
  ok: true,
  notes: [
    'No creator trust/credibility/misinformation/influence/attention/engagement/popularity scores.',
    'YouTube metadata is not claim evidence.',
    'X is optional, budget-capped, and never sent to external AI.',
  ],
};

console.log(JSON.stringify(report, null, 2));
closeDatabase(sqlite);
process.exit(report.ok ? 0 : 1);
