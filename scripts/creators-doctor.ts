import {
  closeDatabase,
  openDatabase,
  creatorClaimAlignmentDimensions,
  creatorClaims,
  creatorContentItems,
  creatorEntities,
  platformPolicyState,
  platformQuotaLedgers,
  xBudgetLedger,
} from '@healthspan/db';
import {
  ALIGNMENT_DIMENSION_IDS,
  CREATOR_PROHIBITED_SCORES,
  isExternalAiAllowedForX,
} from '@healthspan/creators';
import { YOUTUBE_QUOTA_COST_TABLE_VERSION, X_PRICE_TABLE_VERSION } from '@healthspan/connectors';

const { db, sqlite } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});

const creators = db.select().from(creatorEntities).all();
const claims = db.select().from(creatorClaims).all();
const policies = db.select().from(platformPolicyState).all();
const dimensions = db.select().from(creatorClaimAlignmentDimensions).all();
const content = db.select().from(creatorContentItems).all();
const ytQuota = db
  .select()
  .from(platformQuotaLedgers)
  .all()
  .filter((r) => r.platform === 'youtube');
const xBudget = db.select().from(xBudgetLedger).all();

const youtubeVideos = content.filter((c) => c.platform === 'youtube');
const xPosts = content.filter((c) => c.platform === 'x');
const dimensionIds = new Set(dimensions.map((d) => d.dimension));
const missingDimensions = ALIGNMENT_DIMENSION_IDS.filter(
  (id) => dimensions.length > 0 && !dimensionIds.has(id),
);

const failures: string[] = [];
if (isExternalAiAllowedForX()) failures.push('external AI must never be allowed for X');
if (CREATOR_PROHIBITED_SCORES.length < 7) failures.push('prohibited score list incomplete');
for (const claim of claims) {
  try {
    const alignment = JSON.parse(claim.alignmentJson) as { dimensions?: unknown[] };
    if (
      Array.isArray(alignment.dimensions) &&
      alignment.dimensions.length > 0 &&
      alignment.dimensions.length < 15
    ) {
      failures.push(`claim ${claim.id} has fewer than 15 alignment dimensions`);
    }
  } catch {
    failures.push(`claim ${claim.id} has invalid alignmentJson`);
  }
}

const report = {
  suite: 'creators:doctor',
  creatorCount: creators.length,
  claimCount: claims.length,
  policyCount: policies.length,
  alignmentDimensionRows: dimensions.length,
  missingDimensionsWhenPresent: missingDimensions,
  youtubeVideoCount: youtubeVideos.length,
  xPostCount: xPosts.length,
  youtubeQuotaRows: ytQuota.length,
  xBudgetRows: xBudget.length,
  youtubeCostTableVersion: YOUTUBE_QUOTA_COST_TABLE_VERSION,
  xPriceTableVersion: X_PRICE_TABLE_VERSION,
  prohibitedScores: CREATOR_PROHIBITED_SCORES,
  externalAiAllowedForX: isExternalAiAllowedForX(),
  ok: failures.length === 0,
  failures,
  notes: [
    'No creator trust/credibility/misinformation/influence/attention/engagement/popularity scores.',
    'YouTube metadata is not claim evidence.',
    'X is optional, budget-capped, and never sent to external AI.',
    'Alignment is claim-scoped across the official §11 dimension set.',
  ],
};

console.log(JSON.stringify(report, null, 2));
closeDatabase(sqlite);
process.exit(report.ok ? 0 : 1);
