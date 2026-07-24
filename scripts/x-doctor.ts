import { createXConnector, X_PRICE_TABLE_VERSION } from '@healthspan/connectors';
import { isExternalAiAllowedForX } from '@healthspan/creators';
import {
  closeDatabase,
  openDatabase,
  creatorContentItems,
  platformContentCurrent,
  platformContentTombstones,
  xBudgetLedger,
  appMeta,
} from '@healthspan/db';

const { db, sqlite } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});

const failures: string[] = [];
const x = await createXConnector({}).fetchWindow({ cursor: {}, lookbackDays: 1, recordCap: 1 });

const enabled = process.env.HEALTHSPAN_X_ENABLED === 'true';
const budget = db.select().from(xBudgetLedger).all()[0];
const content = db
  .select()
  .from(creatorContentItems)
  .all()
  .filter((c) => c.platform === 'x');
const current = db.select().from(platformContentCurrent).all();
const tombstones = db.select().from(platformContentTombstones).all();
const lastRaw =
  db
    .select()
    .from(appMeta)
    .all()
    .find((r) => r.key === 'x_compliance_last_reconciled_at')?.value ?? null;
const lastReconciledAt = lastRaw && Number.isFinite(Number(lastRaw)) ? Number(lastRaw) : null;
const maxAgeMs = Number(process.env.HEALTHSPAN_X_COMPLIANCE_MAX_AGE_HOURS ?? 24) * 60 * 60 * 1000;
const overdue = enabled && (lastReconciledAt == null || Date.now() - lastReconciledAt > maxAgeMs);

const retainedDeletedText = content.some((item) => {
  if (item.currentState === 'current') return false;
  const row = current.find((r) => r.contentItemId === item.id);
  return Boolean(row?.textBody && row.textBody.trim().length > 0);
});

const displayedWhileOverdue =
  overdue &&
  content.some((item) => {
    const row = current.find((r) => r.contentItemId === item.id);
    return Boolean(row?.displayEligible);
  });

if (!(x.ok && (x.warnings?.some((w) => /disabled by default/i.test(w)) ?? false))) {
  failures.push('disabled X connector must warn that X is disabled by default');
}
if (isExternalAiAllowedForX()) failures.push('X content must never be allowed for external AI');
if (enabled && budget && !budget.acknowledged) {
  failures.push('X enabled without budget acknowledgement');
}
if (retainedDeletedText) failures.push('deleted/withheld X text must not be retained');
if (displayedWhileOverdue) {
  failures.push('X content must not remain display-eligible while compliance is overdue');
}

const report = {
  suite: 'x:doctor',
  xDisabledHealthy: x.ok,
  priceTableVersion: X_PRICE_TABLE_VERSION,
  enabled,
  overdue,
  lastReconciledAt,
  postCount: content.length,
  tombstoneCount: tombstones.length,
  budgetRows: db.select().from(xBudgetLedger).all().length,
  externalAiAllowed: isExternalAiAllowedForX(),
  autoRecharge: false,
  ok: failures.length === 0,
  failures,
};

console.log(JSON.stringify(report, null, 2));
closeDatabase(sqlite);
process.exit(report.ok ? 0 : 1);
