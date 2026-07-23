import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import {
  X_DEFAULT_LOOKBACK_DAYS,
  X_DISPLAY_MAX_AGE_DAYS,
  X_MAX_POSTS_PER_ACCOUNT,
  X_PRICE_TABLE_VERSION,
  X_REFRESH_WITHIN_DAYS,
  applyXComplianceActionsLocally,
  createXClient,
  estimateXTimelineJobMicros,
  gateXBudget,
  type FetchTransport,
  type XComplianceAction,
  type XPostMetadata,
} from '@healthspan/connectors';
import {
  creatorClaims,
  creatorContentItems,
  creatorPlatformAccounts,
  monitoredCreatorSources,
  platformComplianceEvents,
  platformContentCurrent,
  platformContentTombstones,
  xBudgetLedger,
  type HealthspanDb,
} from '@healthspan/db';
import { ensureXBudgetRow, listMonitoredAccounts } from './creator-service.js';

function periodKeyMonth(d = new Date()): string {
  return d.toISOString().slice(0, 7);
}

function parseMaybeDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

export function getXBudgetStatus(db: HealthspanDb) {
  const row = ensureXBudgetRow(db);
  const remaining = Math.max(0, row.capMicros - row.spentMicros);
  let status: 'healthy' | 'disabled' | 'not_configured' | 'budget_blocked' = 'healthy';
  if (process.env.HEALTHSPAN_X_ENABLED !== 'true') status = 'disabled';
  else if (!process.env.X_BEARER_TOKEN || !row.acknowledged || row.capMicros <= 0) status = 'not_configured';
  else if (remaining <= 0) status = 'budget_blocked';
  return {
    periodKey: row.periodKey,
    spentMicros: row.spentMicros,
    capMicros: row.capMicros,
    remainingMicros: remaining,
    acknowledged: Boolean(row.acknowledged),
    automaticRecharge: false,
    externalAiAllowed: false,
    priceTableVersion: X_PRICE_TABLE_VERSION,
    status,
  };
}

export function recordXSpend(db: HealthspanDb, micros: number) {
  const row = ensureXBudgetRow(db);
  const next = row.spentMicros + Math.max(0, micros);
  db.update(xBudgetLedger)
    .set({ spentMicros: next, updatedAt: Date.now() })
    .where(eq(xBudgetLedger.id, row.id))
    .run();
  return getXBudgetStatus(db);
}

function ensureMonitoredSource(db: HealthspanDb, accountId: string) {
  const existing = db
    .select()
    .from(monitoredCreatorSources)
    .all()
    .find((r) => r.accountId === accountId && !r.removedAt);
  if (existing) return existing.id;
  const id = randomUUID();
  const now = Date.now();
  db.insert(monitoredCreatorSources)
    .values({
      id,
      accountId,
      enabled: true,
      paused: false,
      onboardingMethod: 'username',
      includeReplies: false,
      includeReposts: false,
      initialLookbackDays: X_DEFAULT_LOOKBACK_DAYS,
      addedAt: now,
    })
    .run();
  return id;
}

function upsertXPost(
  db: HealthspanDb,
  opts: {
    creatorId: string;
    accountId: string;
    post: XPostMetadata;
    baseline: boolean;
    at: number;
  },
) {
  if (opts.post.withheld) {
    const purged = purgeXPost(db, opts.post.postId, 'withheld', opts.at);
    return {
      contentId: opts.post.postId,
      created: false,
      purged: purged.purged,
      isNew: false,
    };
  }
  const existing = db
    .select()
    .from(creatorContentItems)
    .all()
    .find((r) => r.platform === 'x' && r.externalId === opts.post.postId);
  const refreshDeadlineAt = opts.at + X_REFRESH_WITHIN_DAYS * 24 * 60 * 60 * 1000;
  const contentId = existing?.id ?? randomUUID();
  const isNew = !existing;
  if (isNew) {
    db.insert(creatorContentItems)
      .values({
        id: contentId,
        creatorId: opts.creatorId,
        platformAccountId: opts.accountId,
        platform: 'x',
        externalId: opts.post.postId,
        contentType: 'post',
        title: opts.post.text.slice(0, 120) || opts.post.postId,
        publishedAt: parseMaybeDate(opts.post.createdAt),
        canonicalUrl: `https://x.com/i/web/status/${opts.post.postId}`,
        currentState: 'current',
        retentionState: 'current',
        complianceState: 'ok',
        metadataOnly: false,
        lastRetrievedAt: opts.at,
        refreshDeadlineAt,
        policyVersion: X_PRICE_TABLE_VERSION,
        createdAt: opts.at,
        updatedAt: opts.at,
      })
      .run();
  } else {
    db.update(creatorContentItems)
      .set({
        title: opts.post.text.slice(0, 120) || opts.post.postId,
        publishedAt: parseMaybeDate(opts.post.createdAt),
        currentState: 'current',
        retentionState: 'current',
        complianceState: 'ok',
        lastRetrievedAt: opts.at,
        refreshDeadlineAt,
        updatedAt: opts.at,
      })
      .where(eq(creatorContentItems.id, contentId))
      .run();
  }

  const expiryAt = opts.at + X_DISPLAY_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const current = db
    .select()
    .from(platformContentCurrent)
    .all()
    .find((r) => r.contentItemId === contentId);
  const values = {
    title: opts.post.text.slice(0, 120),
    description: null,
    textBody: opts.post.text,
    durationSeconds: null,
    statusText: opts.post.withheld ? 'withheld' : 'active',
    thumbnailUrl: null,
    paidPlacementDeclared: false,
    captionAvailable: false,
    sourceVersionIdentity: opts.post.postId,
    contentHash: null,
    retrievedAt: opts.at,
    expiryAt,
    displayEligible: true,
    updatedAt: opts.at,
  };
  if (current) {
    db.update(platformContentCurrent).set(values).where(eq(platformContentCurrent.id, current.id)).run();
  } else {
    db.insert(platformContentCurrent)
      .values({ id: randomUUID(), contentItemId: contentId, ...values, createdAt: opts.at })
      .run();
  }
  return { contentId, created: isNew, purged: false, isNew: isNew && !opts.baseline };
}

export function purgeXPost(db: HealthspanDb, postId: string, reason: string, at = Date.now()) {
  const item = db
    .select()
    .from(creatorContentItems)
    .all()
    .find((r) => r.platform === 'x' && r.externalId === postId);
  if (!item) return { purged: false, invalidatedClaims: 0 };
  db.update(creatorContentItems)
    .set({
      currentState: 'unavailable',
      retentionState: 'purged',
      complianceState: 'purged',
      updatedAt: at,
    })
    .where(eq(creatorContentItems.id, item.id))
    .run();
  db.delete(platformContentCurrent).where(eq(platformContentCurrent.contentItemId, item.id)).run();
  const eventId = randomUUID();
  db.insert(platformComplianceEvents)
    .values({
      id: eventId,
      platform: 'x',
      contentItemId: item.id,
      accountId: item.platformAccountId,
      eventType: reason,
      receivedAt: at,
      appliedAt: at,
      actionTaken: 'purge_current_text',
      detailJson: JSON.stringify({ postId, externalAiInvolved: false }),
      createdAt: at,
    })
    .run();
  db.insert(platformContentTombstones)
    .values({
      id: randomUUID(),
      contentItemId: item.id,
      platform: 'x',
      contentIdHash: postId,
      unavailabilityReason: reason,
      complianceEventId: eventId,
      purgedAt: at,
      auditMetadataJson: JSON.stringify({ note: 'X source text purged; dependent platform claims invalidated' }),
      createdAt: at,
    })
    .run();

  let invalidatedClaims = 0;
  for (const claim of db.select().from(creatorClaims).all()) {
    if (claim.contentItemId === item.id && claim.active) {
      db.update(creatorClaims)
        .set({ active: false, lifecycleState: 'invalidated_compliance', reviewStatus: 'invalidated' })
        .where(eq(creatorClaims.id, claim.id))
        .run();
      invalidatedClaims += 1;
    }
  }
  return { purged: true, invalidatedClaims };
}

export function applyXComplianceBatch(db: HealthspanDb, actions: XComplianceAction[]) {
  const at = Date.now();
  let purged = 0;
  let invalidatedClaims = 0;
  const posts = db
    .select()
    .from(creatorContentItems)
    .all()
    .filter((c) => c.platform === 'x')
    .map(
      (c): XPostMetadata => ({
        postId: c.externalId,
        userId: c.platformAccountId ?? '',
        text: c.title,
        createdAt: c.publishedAt ? new Date(c.publishedAt).toISOString() : null,
        editedAt: null,
        conversationId: null,
        isReply: false,
        isRepost: false,
        withheld: false,
        claimEvidence: false,
        externalAiAllowed: false,
        note: '',
      }),
    );
  const local = applyXComplianceActionsLocally(posts, actions);
  for (const postId of local.purged) {
    const result = purgeXPost(db, postId, actions.find((a) => a.postId === postId)?.reason ?? 'compliance', at);
    if (result.purged) purged += 1;
    invalidatedClaims += result.invalidatedClaims;
  }
  return { purged, invalidatedClaims, remaining: local.remaining.length };
}

export async function syncXMonitoredAccounts(
  db: HealthspanDb,
  opts: {
    creatorId?: string;
    transport?: FetchTransport;
    lookbackDays?: number;
    baseline?: boolean;
  } = {},
) {
  const budget = getXBudgetStatus(db);
  const estimated = estimateXTimelineJobMicros({
    includeUserLookup: true,
    maxPosts: X_MAX_POSTS_PER_ACCOUNT,
  });
  const gate = gateXBudget({
    enabled: process.env.HEALTHSPAN_X_ENABLED === 'true',
    acknowledged: budget.acknowledged,
    capMicros: budget.capMicros,
    spentMicros: budget.spentMicros,
    estimatedMicros: estimated,
  });
  if (!gate.allowed) {
    return {
      ok: false as const,
      status: gate.reason,
      error: gate.reason,
      estimatedCostMicros: gate.estimatedMicros,
      remainingMicros: gate.remainingMicros,
      accountsSynced: 0,
      postsUpserted: 0,
      newPosts: 0,
      purged: 0,
      budget: getXBudgetStatus(db),
    };
  }

  const client = createXClient({
    transport: opts.transport,
    bearerToken: process.env.X_BEARER_TOKEN,
  });
  if (!client) {
    return {
      ok: false as const,
      status: 'not_configured' as const,
      error: 'X_BEARER_TOKEN not configured',
      estimatedCostMicros: estimated,
      remainingMicros: gate.remainingMicros,
      accountsSynced: 0,
      postsUpserted: 0,
      newPosts: 0,
      purged: 0,
      budget: getXBudgetStatus(db),
    };
  }

  let accounts = listMonitoredAccounts(db).filter((a) => a.platform === 'x');
  if (opts.creatorId) accounts = accounts.filter((a) => a.creatorId === opts.creatorId);

  const at = Date.now();
  let accountsSynced = 0;
  let postsUpserted = 0;
  let newPosts = 0;
  let purged = 0;
  let spent = 0;
  const warnings: string[] = [];

  for (const account of accounts) {
    let userId = account.externalAccountId;
    if (!/^\d+$/.test(userId)) {
      const resolved = await client.resolveUsername(account.handle?.replace(/^@/, '') || userId);
      spent += estimateXTimelineJobMicros({ includeUserLookup: true, maxPosts: 0 });
      if (!resolved.user) {
        warnings.push(resolved.error ?? `resolve failed for ${account.id}`);
        continue;
      }
      if (resolved.user.protected) {
        warnings.push(`protected account ${resolved.user.username}`);
        continue;
      }
      userId = resolved.user.userId;
      db.update(creatorPlatformAccounts)
        .set({
          externalAccountId: userId,
          displayName: resolved.user.name,
          canonicalUrl: resolved.user.canonicalUrl,
          lastCheckedAt: at,
        })
        .where(eq(creatorPlatformAccounts.id, account.id))
        .run();
    }

    const timeline = await client.fetchUserTimeline({
      userId,
      lookbackDays: opts.lookbackDays ?? X_DEFAULT_LOOKBACK_DAYS,
      maxPosts: X_MAX_POSTS_PER_ACCOUNT,
      includeReplies: false,
      includeReposts: false,
    });
    spent += estimateXTimelineJobMicros({
      includeUserLookup: false,
      maxPosts: timeline.posts.length || 1,
    });
    if (timeline.error) {
      warnings.push(timeline.error);
      continue;
    }

    accountsSynced += 1;
    ensureMonitoredSource(db, account.id);
    const monitored = db
      .select()
      .from(monitoredCreatorSources)
      .all()
      .find((r) => r.accountId === account.id && !r.removedAt);
    if (monitored) {
      db.update(monitoredCreatorSources)
        .set({
          lastSyncedAt: at,
          nextDueAt: at + X_REFRESH_WITHIN_DAYS * 24 * 60 * 60 * 1000,
        })
        .where(eq(monitoredCreatorSources.id, monitored.id))
        .run();
    }

    const baseline = opts.baseline ?? true;
    for (const post of timeline.posts) {
      const result = upsertXPost(db, {
        creatorId: account.creatorId,
        accountId: account.id,
        post,
        baseline,
        at,
      });
      postsUpserted += 1;
      if (result.purged) purged += 1;
      if (result.isNew) newPosts += 1;
    }
  }

  recordXSpend(db, spent);
  return {
    ok: true as const,
    status: getXBudgetStatus(db).status,
    estimatedCostMicros: estimated,
    spentMicrosThisJob: spent,
    accountsSynced,
    postsUpserted,
    newPosts,
    purged,
    warnings,
    budget: getXBudgetStatus(db),
    note: 'X is optional, budget-capped, no automatic recharge, and never sent to external AI.',
  };
}
