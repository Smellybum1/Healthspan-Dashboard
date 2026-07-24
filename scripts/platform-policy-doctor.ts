import { createYoutubeConnector, createXConnector } from '@healthspan/connectors';
import {
  closeDatabase,
  openDatabase,
  platformPolicyState,
  platformContentCurrent,
  creatorContentItems,
  appMeta,
} from '@healthspan/db';

const { db, sqlite } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});

const yt = await createYoutubeConnector({ apiKey: null }).fetchWindow({
  cursor: {},
  lookbackDays: 1,
  recordCap: 1,
});
const x = await createXConnector({}).fetchWindow({ cursor: {}, lookbackDays: 1, recordCap: 1 });

const failures: string[] = [];
const policies = db.select().from(platformPolicyState).all();
const current = db.select().from(platformContentCurrent).all();
const content = db.select().from(creatorContentItems).all();

const youtubeDisabledHealthy =
  yt.ok && (yt.warnings?.some((w) => /never claim evidence/i.test(w)) ?? false);
const xDisabledHealthy =
  x.ok && (x.warnings?.some((w) => /disabled by default/i.test(w)) ?? false);

if (!youtubeDisabledHealthy) failures.push('YouTube disabled path unhealthy');
if (!xDisabledHealthy) failures.push('X disabled path unhealthy');

const now = Date.now();
const displayEligibilityViolations = current.filter((row) => {
  if (!row.displayEligible) return false;
  return row.expiryAt != null && row.expiryAt < now;
}).length;
if (displayEligibilityViolations > 0) {
  failures.push(`display eligibility violations: ${displayEligibilityViolations}`);
}

const xEnabled = process.env.HEALTHSPAN_X_ENABLED === 'true';
const lastRaw =
  db.select().from(appMeta).all().find((r) => r.key === 'x_compliance_last_reconciled_at')?.value ??
  null;
const lastReconciledAt = lastRaw && Number.isFinite(Number(lastRaw)) ? Number(lastRaw) : null;
const maxAgeMs = Number(process.env.HEALTHSPAN_X_COMPLIANCE_MAX_AGE_HOURS ?? 24) * 60 * 60 * 1000;
const purgeJobOverdue =
  xEnabled && (lastReconciledAt == null || Date.now() - lastReconciledAt > maxAgeMs);

const report = {
  suite: 'platform-policy:doctor',
  youtubeDisabledHealthy,
  xDisabledHealthy,
  policyRows: policies.length,
  contentRows: content.length,
  displayEligibilityViolations,
  purgeJobOverdue,
  ok: failures.length === 0 && !purgeJobOverdue,
  failures: purgeJobOverdue ? [...failures, 'X compliance/purge reconciliation overdue'] : failures,
};

console.log(JSON.stringify(report, null, 2));
closeDatabase(sqlite);
process.exit(report.ok ? 0 : 1);
