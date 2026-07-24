import { createYoutubeConnector, YOUTUBE_QUOTA_COST_TABLE_VERSION } from '@healthspan/connectors';
import {
  closeDatabase,
  openDatabase,
  creatorClaims,
  creatorContentItems,
  platformContentCurrent,
  platformQuotaLedgers,
  platformPolicyState,
} from '@healthspan/db';

const { db, sqlite } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});

const failures: string[] = [];
const yt = await createYoutubeConnector({ apiKey: null }).fetchWindow({
  cursor: {},
  lookbackDays: 1,
  recordCap: 1,
});

const content = db.select().from(creatorContentItems).all().filter((c) => c.platform === 'youtube');
const current = db.select().from(platformContentCurrent).all();
const quota = db.select().from(platformQuotaLedgers).all().filter((r) => r.platform === 'youtube');
const policies = db.select().from(platformPolicyState).all();
const claims = db.select().from(creatorClaims).all();

const engagementFieldsPersisted = current.some(
  (row) =>
    /viewCount|likeCount|subscriberCount|engagement/i.test(row.thumbnailUrl ?? '') ||
    /viewCount|likeCount|subscriberCount|engagement/i.test(JSON.stringify(row)),
);

const metadataDerivedClaims = claims.filter((c) => {
  try {
    const alignment = JSON.parse(c.alignmentJson) as { notes?: string };
    return /youtube metadata|metadata-derived/i.test(String(alignment.notes ?? ''));
  } catch {
    return false;
  }
});

const now = Date.now();
const staleDisplayed = content.filter((item) => {
  if (item.currentState !== 'current') return false;
  const row = current.find((r) => r.contentItemId === item.id);
  if (!row?.displayEligible) return false;
  return row.expiryAt != null && row.expiryAt < now;
});

const deletedStillDisplayed = content.filter((item) => {
  if (item.currentState === 'current') return false;
  const row = current.find((r) => r.contentItemId === item.id);
  return Boolean(row?.displayEligible);
});

if (!(yt.ok && (yt.warnings?.some((w) => /never claim evidence/i.test(w)) ?? false))) {
  failures.push('disabled YouTube connector must warn that metadata is never claim evidence');
}
if (engagementFieldsPersisted) failures.push('engagement metrics must not be persisted for YouTube');
if (metadataDerivedClaims.length > 0) failures.push('YouTube metadata must not produce scientific claims');
if (staleDisplayed.length > 0) failures.push('expired YouTube content must not remain display-eligible');
if (deletedStillDisplayed.length > 0) failures.push('deleted/private YouTube content must not remain displayed');

const report = {
  suite: 'youtube:doctor',
  youtubeDisabledHealthy: yt.ok,
  costTableVersion: YOUTUBE_QUOTA_COST_TABLE_VERSION,
  videoCount: content.length,
  quotaRows: quota.length,
  policyRows: policies.length,
  staleDisplayed: staleDisplayed.length,
  deletedStillDisplayed: deletedStillDisplayed.length,
  metadataIsClaimEvidence: false,
  ok: failures.length === 0,
  failures,
};

console.log(JSON.stringify(report, null, 2));
closeDatabase(sqlite);
process.exit(report.ok ? 0 : 1);
