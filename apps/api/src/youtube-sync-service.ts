import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import {
  YOUTUBE_APP_DAILY_QUOTA_CAP,
  YOUTUBE_DISPLAY_MAX_AGE_DAYS,
  YOUTUBE_MAX_CHANNELS_PER_SYNC,
  YOUTUBE_MAX_VIDEOS_PER_JOB,
  YOUTUBE_QUOTA_COST_TABLE_VERSION,
  YOUTUBE_REFRESH_WITHIN_DAYS,
  createYoutubeClient,
  type FetchTransport,
  type YoutubeQuotaEvent,
  type YoutubeVideoMetadata,
} from '@healthspan/connectors';
import {
  creatorContentItems,
  creatorPlatformAccounts,
  monitoredCreatorSources,
  platformContentCurrent,
  platformContentTombstones,
  platformQuotaLedgers,
  type HealthspanDb,
} from '@healthspan/db';
import { listMonitoredAccounts } from './creator-service.js';

function periodKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function parseMaybeDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

export function getYoutubeQuotaLedger(db: HealthspanDb) {
  const key = periodKey();
  const rows = db
    .select()
    .from(platformQuotaLedgers)
    .all()
    .filter((r) => r.platform === 'youtube' && r.periodKey === key);
  const byMethod = rows.map((r) => ({
    methodOrResource: r.methodOrResource,
    units: r.unitsOrReads,
    appCap: r.appCap ?? YOUTUBE_APP_DAILY_QUOTA_CAP,
    remainingAllowance: r.remainingAllowance,
    priceTableVersion: r.priceTableVersion,
    updatedAt: new Date(r.updatedAt).toISOString(),
  }));
  const totalUnits = rows.reduce((sum, r) => sum + r.unitsOrReads, 0);
  const cap = YOUTUBE_APP_DAILY_QUOTA_CAP;
  const remaining = Math.max(0, cap - totalUnits);
  let status: 'healthy' | 'not_configured' | 'quota_near_limit' | 'quota_exhausted' = 'healthy';
  if (!process.env.YOUTUBE_API_KEY) status = 'not_configured';
  else if (remaining <= 0) status = 'quota_exhausted';
  else if (remaining <= Math.ceil(cap * 0.1)) status = 'quota_near_limit';
  return {
    periodKey: key,
    costTableVersion: YOUTUBE_QUOTA_COST_TABLE_VERSION,
    appDailyCap: cap,
    totalUnits,
    remaining,
    status,
    metadataIsClaimEvidence: false,
    unofficialCaptionsAllowed: false,
    mediaDownloadAllowed: false,
    methods: byMethod,
  };
}

export function recordYoutubeQuotaEvents(db: HealthspanDb, events: YoutubeQuotaEvent[]) {
  const key = periodKey();
  const now = Date.now();
  for (const event of events) {
    const existing = db
      .select()
      .from(platformQuotaLedgers)
      .all()
      .find(
        (r) =>
          r.platform === 'youtube' && r.periodKey === key && r.methodOrResource === event.method,
      );
    const nextUnits = (existing?.unitsOrReads ?? 0) + event.units;
    const remaining = Math.max(0, YOUTUBE_APP_DAILY_QUOTA_CAP - nextUnits);
    if (existing) {
      db.update(platformQuotaLedgers)
        .set({
          unitsOrReads: nextUnits,
          remainingAllowance: remaining,
          priceTableVersion: event.costTableVersion,
          appCap: YOUTUBE_APP_DAILY_QUOTA_CAP,
          updatedAt: now,
        })
        .where(eq(platformQuotaLedgers.id, existing.id))
        .run();
    } else {
      db.insert(platformQuotaLedgers)
        .values({
          id: randomUUID(),
          platform: 'youtube',
          periodKey: key,
          methodOrResource: event.method,
          unitsOrReads: nextUnits,
          estimatedCostMicros: 0,
          priceTableVersion: event.costTableVersion,
          appCap: YOUTUBE_APP_DAILY_QUOTA_CAP,
          remainingAllowance: remaining,
          updatedAt: now,
          createdAt: now,
        })
        .run();
    }
  }
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
      onboardingMethod: 'exact_channel_id',
      initialLookbackDays: 180,
      addedAt: now,
      lastSyncedAt: null,
      nextDueAt: now,
    })
    .run();
  return id;
}

function upsertVideoMetadata(
  db: HealthspanDb,
  opts: {
    creatorId: string;
    accountId: string;
    video: YoutubeVideoMetadata;
    baseline: boolean;
    at: number;
  },
) {
  const existing = db
    .select()
    .from(creatorContentItems)
    .all()
    .find((r) => r.platform === 'youtube' && r.externalId === opts.video.videoId);
  const refreshDeadlineAt = opts.at + YOUTUBE_REFRESH_WITHIN_DAYS * 24 * 60 * 60 * 1000;
  const unavailable =
    opts.video.statusText === 'private' ||
    opts.video.statusText === 'privacyStatusUnspecified' ||
    opts.video.statusText === 'deleted';

  if (unavailable && existing) {
    db.update(creatorContentItems)
      .set({
        currentState: 'unavailable',
        retentionState: 'purged',
        complianceState: 'purged',
        updatedAt: opts.at,
      })
      .where(eq(creatorContentItems.id, existing.id))
      .run();
    db.delete(platformContentCurrent)
      .where(eq(platformContentCurrent.contentItemId, existing.id))
      .run();
    db.insert(platformContentTombstones)
      .values({
        id: randomUUID(),
        contentItemId: existing.id,
        platform: 'youtube',
        contentIdHash: opts.video.videoId,
        unavailabilityReason: opts.video.statusText ?? 'unavailable',
        purgedAt: opts.at,
        auditMetadataJson: JSON.stringify({
          note: 'Purged current YouTube metadata; user transcripts unaffected',
        }),
        createdAt: opts.at,
      })
      .run();
    return { contentId: existing.id, created: false, purged: true, isNew: false };
  }

  const contentId = existing?.id ?? randomUUID();
  const isNew = !existing;
  if (isNew) {
    db.insert(creatorContentItems)
      .values({
        id: contentId,
        creatorId: opts.creatorId,
        platformAccountId: opts.accountId,
        platform: 'youtube',
        externalId: opts.video.videoId,
        contentType: 'video',
        title: opts.video.title,
        publishedAt: parseMaybeDate(opts.video.publishedAt),
        canonicalUrl: `https://www.youtube.com/watch?v=${opts.video.videoId}`,
        currentState: 'current',
        retentionState: 'current',
        complianceState: 'ok',
        metadataOnly: true,
        lastRetrievedAt: opts.at,
        refreshDeadlineAt,
        policyVersion: YOUTUBE_QUOTA_COST_TABLE_VERSION,
        createdAt: opts.at,
        updatedAt: opts.at,
      })
      .run();
  } else {
    db.update(creatorContentItems)
      .set({
        title: opts.video.title,
        publishedAt: parseMaybeDate(opts.video.publishedAt),
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

  const expiryAt = opts.at + YOUTUBE_DISPLAY_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const current = db
    .select()
    .from(platformContentCurrent)
    .all()
    .find((r) => r.contentItemId === contentId);
  const currentValues = {
    title: opts.video.title,
    description: opts.video.description,
    textBody: null,
    durationSeconds: opts.video.durationSeconds,
    statusText: opts.video.statusText,
    thumbnailUrl: opts.video.thumbnailUrl,
    paidPlacementDeclared: opts.video.paidPlacementDeclared,
    captionAvailable: opts.video.captionAvailable,
    sourceVersionIdentity: opts.video.videoId,
    contentHash: null,
    retrievedAt: opts.at,
    expiryAt,
    displayEligible: true,
    updatedAt: opts.at,
  };
  if (current) {
    db.update(platformContentCurrent)
      .set(currentValues)
      .where(eq(platformContentCurrent.id, current.id))
      .run();
  } else {
    db.insert(platformContentCurrent)
      .values({
        id: randomUUID(),
        contentItemId: contentId,
        ...currentValues,
        createdAt: opts.at,
      })
      .run();
  }

  return { contentId, created: isNew, purged: false, isNew: isNew && !opts.baseline };
}

export async function syncYoutubeMonitoredAccounts(
  db: HealthspanDb,
  opts: {
    creatorId?: string;
    accountId?: string;
    transport?: FetchTransport;
    lookbackDays?: number;
    baseline?: boolean;
  } = {},
) {
  const yt = createYoutubeClient({
    transport: opts.transport,
    apiKey: process.env.YOUTUBE_API_KEY,
  });
  if (!yt) {
    return {
      ok: false as const,
      status: 'not_configured' as const,
      error: 'YOUTUBE_API_KEY not configured',
      channelsSynced: 0,
      videosUpserted: 0,
      newVideos: 0,
      purged: 0,
      unitsSpent: 0,
      quota: getYoutubeQuotaLedger(db),
    };
  }

  const quota = getYoutubeQuotaLedger(db);
  if (quota.status === 'quota_exhausted') {
    return {
      ok: false as const,
      status: 'quota_exhausted' as const,
      error: 'quota_exhausted',
      channelsSynced: 0,
      videosUpserted: 0,
      newVideos: 0,
      purged: 0,
      unitsSpent: 0,
      quota,
    };
  }

  let accounts = listMonitoredAccounts(db).filter(
    (a) => a.platform === 'youtube' && a.externalAccountId.startsWith('UC'),
  );
  if (opts.creatorId) accounts = accounts.filter((a) => a.creatorId === opts.creatorId);
  if (opts.accountId) accounts = accounts.filter((a) => a.id === opts.accountId);
  accounts = accounts.slice(0, YOUTUBE_MAX_CHANNELS_PER_SYNC);

  const at = Date.now();
  let channelsSynced = 0;
  let videosUpserted = 0;
  let newVideos = 0;
  let purged = 0;
  let unitsSpent = 0;
  const warnings: string[] = [];
  let jobVideos = 0;

  for (const account of accounts) {
    if (jobVideos >= YOUTUBE_MAX_VIDEOS_PER_JOB) break;
    const known = new Set(
      db
        .select()
        .from(creatorContentItems)
        .all()
        .filter((c) => c.platformAccountId === account.id && c.platform === 'youtube')
        .map((c) => c.externalId),
    );
    const sync = await yt.syncChannelUploads({
      channelId: account.externalAccountId,
      lookbackDays: opts.lookbackDays,
      knownVideoIds: opts.baseline === false ? known : undefined,
      unitsAlreadySpentToday: quota.totalUnits + unitsSpent,
      baseline: opts.baseline ?? known.size === 0,
    });
    recordYoutubeQuotaEvents(db, sync.quotaEvents);
    unitsSpent += sync.unitsSpent;
    warnings.push(...sync.warnings.map((w) => `${account.externalAccountId}: ${w}`));

    if (sync.status === 'quota_exhausted') {
      warnings.push('quota_exhausted');
      break;
    }
    if (!sync.ok) {
      warnings.push(sync.errorMessage ?? sync.status);
      continue;
    }

    channelsSynced += 1;
    ensureMonitoredSource(db, account.id);
    db.update(creatorPlatformAccounts)
      .set({
        displayName: sync.channel?.title ?? account.displayName,
        lastCheckedAt: at,
        platformDataExpiryAt: at + YOUTUBE_DISPLAY_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
        sourcePolicyVersion: YOUTUBE_QUOTA_COST_TABLE_VERSION,
      })
      .where(eq(creatorPlatformAccounts.id, account.id))
      .run();
    const monitored = db
      .select()
      .from(monitoredCreatorSources)
      .all()
      .find((r) => r.accountId === account.id && !r.removedAt);
    if (monitored) {
      db.update(monitoredCreatorSources)
        .set({
          lastSyncedAt: at,
          nextDueAt: at + YOUTUBE_REFRESH_WITHIN_DAYS * 24 * 60 * 60 * 1000,
          syncPolicyJson: JSON.stringify({
            uploadsPlaylistId: sync.channel?.uploadsPlaylistId ?? null,
            claimEvidence: false,
          }),
        })
        .where(eq(monitoredCreatorSources.id, monitored.id))
        .run();
    }

    for (const video of sync.videos) {
      if (jobVideos >= YOUTUBE_MAX_VIDEOS_PER_JOB) break;
      const result = upsertVideoMetadata(db, {
        creatorId: account.creatorId,
        accountId: account.id,
        video,
        baseline: sync.baseline,
        at,
      });
      videosUpserted += 1;
      jobVideos += 1;
      if (result.purged) purged += 1;
      if (result.isNew) newVideos += 1;
    }
  }

  return {
    ok: true as const,
    status: getYoutubeQuotaLedger(db).status,
    channelsSynced,
    videosUpserted,
    newVideos,
    purged,
    unitsSpent,
    warnings,
    quota: getYoutubeQuotaLedger(db),
    note: 'YouTube API metadata is never claim evidence. No captions scraped, media downloaded, or STT.',
  };
}

export function listCreatorYoutubeVideos(db: HealthspanDb, creatorId: string, limit = 50) {
  const now = Date.now();
  const items = db
    .select()
    .from(creatorContentItems)
    .all()
    .filter(
      (c) => c.creatorId === creatorId && c.platform === 'youtube' && c.currentState === 'current',
    )
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
    .slice(0, limit);
  return items.map((item) => {
    const current = db
      .select()
      .from(platformContentCurrent)
      .all()
      .find((r) => r.contentItemId === item.id);
    const expired = current?.expiryAt != null && current.expiryAt < now;
    const displayEligible = Boolean(current?.displayEligible) && !expired;
    return {
      id: item.id,
      videoId: item.externalId,
      title: item.title,
      publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString() : null,
      canonicalUrl: item.canonicalUrl,
      thumbnailUrl: current?.thumbnailUrl ?? null,
      durationSeconds: current?.durationSeconds ?? null,
      captionAvailable: Boolean(current?.captionAvailable),
      paidPlacementDeclared: Boolean(current?.paidPlacementDeclared),
      statusText: current?.statusText ?? null,
      displayEligible,
      claimEvidence: false as const,
      metadataOnly: true as const,
      refreshDeadlineAt: item.refreshDeadlineAt
        ? new Date(item.refreshDeadlineAt).toISOString()
        : null,
      note: expired
        ? 'retention_refresh_due: metadata older than display window — refresh required'
        : 'YouTube API metadata is operational context only — not claim evidence',
    };
  });
}

/** Hide expired YouTube current metadata without deleting user documents. */
export function applyYoutubeRetentionHold(db: HealthspanDb) {
  const now = Date.now();
  let hidden = 0;
  for (const row of db.select().from(platformContentCurrent).all()) {
    if (row.expiryAt != null && row.expiryAt < now && row.displayEligible) {
      db.update(platformContentCurrent)
        .set({ displayEligible: false, updatedAt: now })
        .where(eq(platformContentCurrent.id, row.id))
        .run();
      hidden += 1;
    }
  }
  return { hidden };
}
