import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import {
  appMeta,
  platformPolicyState,
  platformPolicyVersions,
  platformContentCurrent,
  creatorContentItems,
  type HealthspanDb,
} from '@healthspan/db';
import { getXComplianceStatus } from './x-sync-service.js';
import { getYoutubeQuotaLedger, applyYoutubeRetentionHold } from './youtube-sync-service.js';
import { ensureXBudgetRow } from './creator-service.js';
import { getXBudgetStatus } from './x-sync-service.js';

export type PolicyAuditTask = {
  id: string;
  platform: string;
  issue: string;
  severity: 'info' | 'warn' | 'error';
  status: 'open' | 'resolved';
  detail: Record<string, unknown>;
  createdAt: string;
};

const AUDIT_META_KEY = 'platform_policy_audit_queue';

function readQueue(db: HealthspanDb): PolicyAuditTask[] {
  const raw = db
    .select()
    .from(appMeta)
    .all()
    .find((r) => r.key === AUDIT_META_KEY)?.value;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PolicyAuditTask[];
  } catch {
    return [];
  }
}

function writeQueue(db: HealthspanDb, tasks: PolicyAuditTask[]) {
  const now = Date.now();
  const value = JSON.stringify(tasks.slice(0, 200));
  const existing = db
    .select()
    .from(appMeta)
    .all()
    .find((r) => r.key === AUDIT_META_KEY);
  if (existing) {
    db.update(appMeta).set({ value, updatedAt: now }).where(eq(appMeta.key, AUDIT_META_KEY)).run();
  } else {
    db.insert(appMeta).values({ key: AUDIT_META_KEY, value, updatedAt: now }).run();
  }
}

export function runPlatformPolicyAudit(db: HealthspanDb) {
  applyYoutubeRetentionHold(db);
  ensureXBudgetRow(db);
  const now = Date.now();
  const tasks: PolicyAuditTask[] = [];

  const policies = db.select().from(platformPolicyState).all();
  if (policies.length === 0) {
    tasks.push({
      id: randomUUID(),
      platform: 'all',
      issue: 'missing_current_policy_state',
      severity: 'warn',
      status: 'open',
      detail: {},
      createdAt: new Date(now).toISOString(),
    });
  }

  const versions = db.select().from(platformPolicyVersions).all();
  if (versions.length === 0) {
    db.insert(platformPolicyVersions)
      .values({
        id: randomUUID(),
        platform: 'youtube',
        policyId: 'youtube_metadata',
        policyVersion: 'm5.yt.policy.1',
        checkedAt: now,
        officialReference: 'YouTube Data API Terms',
        refreshDeleteRule: 'refresh_before_display_expiry',
        displayRule: 'metadata_only_never_claim_evidence',
        exportRule: 'metadata_ids_only',
        aiRule: 'youtube_metadata_never_to_external_ai',
        currentState: 'current',
        createdAt: now,
      })
      .run();
    db.insert(platformPolicyVersions)
      .values({
        id: randomUUID(),
        platform: 'x',
        policyId: 'x_content_compliance',
        policyVersion: 'm5.x.policy.1',
        checkedAt: now,
        officialReference: 'X API / Developer Agreement',
        refreshDeleteRule: 'purge_on_delete_withhold',
        displayRule: 'hide_when_compliance_overdue',
        exportRule: 'ids_links_review_decisions_only',
        aiRule: 'x_never_to_external_ai',
        currentState: 'current',
        createdAt: now,
      })
      .run();
  }

  const current = db.select().from(platformContentCurrent).all();
  for (const row of current) {
    if (row.displayEligible && row.expiryAt != null && row.expiryAt < now) {
      tasks.push({
        id: randomUUID(),
        platform: 'unknown',
        issue: 'display_eligibility_violation',
        severity: 'error',
        status: 'open',
        detail: { contentItemId: row.contentItemId, expiryAt: row.expiryAt },
        createdAt: new Date(now).toISOString(),
      });
    }
    if (row.textBody && row.textBody.length > 0) {
      const item = db
        .select()
        .from(creatorContentItems)
        .all()
        .find((c) => c.id === row.contentItemId);
      if (item?.platform === 'x' && item.currentState !== 'current') {
        tasks.push({
          id: randomUUID(),
          platform: 'x',
          issue: 'deleted_text_retained',
          severity: 'error',
          status: 'open',
          detail: { contentItemId: row.contentItemId },
          createdAt: new Date(now).toISOString(),
        });
      }
    }
  }

  const compliance = getXComplianceStatus(db, now);
  if (compliance.overdue) {
    tasks.push({
      id: randomUUID(),
      platform: 'x',
      issue: 'compliance_reconciliation_overdue',
      severity: 'error',
      status: 'open',
      detail: { lastReconciledAt: compliance.lastReconciledAt },
      createdAt: new Date(now).toISOString(),
    });
  }

  writeQueue(db, tasks);
  return {
    auditedAt: new Date(now).toISOString(),
    openCount: tasks.filter((t) => t.status === 'open').length,
    tasks,
  };
}

export function listPlatformPolicyAudits(db: HealthspanDb) {
  return readQueue(db);
}

export function getPlatformSourceHealth(db: HealthspanDb) {
  applyYoutubeRetentionHold(db);
  ensureXBudgetRow(db);
  return {
    youtube: {
      metadataIsClaimEvidence: false,
      quota: getYoutubeQuotaLedger(db),
    },
    x: {
      enabledByDefault: false,
      externalAiAllowed: false,
      budget: getXBudgetStatus(db),
      compliance: getXComplianceStatus(db),
    },
    policyVersions: db
      .select()
      .from(platformPolicyVersions)
      .all()
      .map((v) => ({
        platform: v.platform,
        policyId: v.policyId,
        policyVersion: v.policyVersion,
        exportRule: v.exportRule,
        aiRule: v.aiRule,
        currentState: v.currentState,
      })),
    audits: listPlatformPolicyAudits(db).slice(0, 20),
  };
}
