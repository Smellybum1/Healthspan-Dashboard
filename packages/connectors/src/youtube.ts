import { createHash } from 'node:crypto';
import { createHttpClient } from './http.js';
import type {
  ConnectorFetchResult,
  ConnectorPage,
  FetchTransport,
  SourceConnector,
} from './types.js';

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/** Versioned method-cost table — do not assume costs never change. */
export const YOUTUBE_QUOTA_COST_TABLE_VERSION = '2026-07-24.youtube.v3';
export const YOUTUBE_METHOD_COSTS = {
  'channels.list': 1,
  'playlistItems.list': 1,
  'videos.list': 1,
  'search.list': 100,
} as const;
export type YoutubeApiMethod = keyof typeof YOUTUBE_METHOD_COSTS;

export const YOUTUBE_APP_DAILY_QUOTA_CAP = 5000;
export const YOUTUBE_MANUAL_SEARCH_CAP_PER_DAY = 10;
export const YOUTUBE_MAX_CHANNELS_PER_SYNC = 25;
export const YOUTUBE_MAX_VIDEOS_PER_CHANNEL = 200;
export const YOUTUBE_MAX_VIDEOS_PER_JOB = 500;
export const YOUTUBE_DEFAULT_LOOKBACK_DAYS = 180;
export const YOUTUBE_REFRESH_WITHIN_DAYS = 25;
export const YOUTUBE_DISPLAY_MAX_AGE_DAYS = 30;

export type YoutubeQuotaEvent = {
  method: YoutubeApiMethod;
  units: number;
  costTableVersion: string;
  ok: boolean;
  retryCount: number;
  at: string;
  detail?: string;
};

export type YoutubeChannelResolved = {
  channelId: string;
  title: string | null;
  handle: string | null;
  canonicalUrl: string;
  thumbnailUrl: string | null;
  uploadsPlaylistId: string | null;
  resolutionMethod: 'channel_id' | 'forHandle' | 'search.list';
};

export type YoutubeVideoMetadata = {
  videoId: string;
  channelId: string;
  title: string;
  description: string | null;
  publishedAt: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  captionAvailable: boolean;
  paidPlacementDeclared: boolean;
  statusText: string | null;
  liveBroadcastContent: string | null;
  claimEvidence: false;
  captionsScraped: false;
  mediaDownloaded: false;
  note: string;
};

export type YoutubeChannelSyncResult = {
  ok: boolean;
  status:
    | 'healthy'
    | 'not_configured'
    | 'disabled'
    | 'quota_near_limit'
    | 'quota_exhausted'
    | 'channel_not_found'
    | 'permission_error'
    | 'failed';
  channel: YoutubeChannelResolved | null;
  videos: YoutubeVideoMetadata[];
  quotaEvents: YoutubeQuotaEvent[];
  unitsSpent: number;
  warnings: string[];
  errorMessage?: string;
  baseline: boolean;
};

function parseIsoDurationSeconds(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export type YoutubeClient = {
  resolveChannel: (
    ref: string,
    opts?: { allowSearchFallback?: boolean },
  ) => Promise<{
    candidates: YoutubeChannelResolved[];
    quotaEvents: YoutubeQuotaEvent[];
    unitsSpent: number;
  }>;
  syncChannelUploads: (opts: {
    channelId: string;
    lookbackDays?: number;
    maxVideos?: number;
    knownVideoIds?: Set<string>;
    unitsAlreadySpentToday?: number;
    appDailyCap?: number;
    baseline?: boolean;
  }) => Promise<YoutubeChannelSyncResult>;
};

export function createYoutubeClient(opts: {
  transport?: FetchTransport;
  apiKey?: string | null;
  minIntervalMs?: number;
}): YoutubeClient | null {
  const apiKey = opts.apiKey ?? process.env.YOUTUBE_API_KEY ?? null;
  if (!apiKey) return null;
  const client = createHttpClient({
    transport: opts.transport,
    userAgent: 'HealthspanDashboard/0.2 (youtube-metadata; local@invalid)',
    minIntervalMs: opts.minIntervalMs ?? 250,
  });

  async function callApi(
    method: YoutubeApiMethod,
    pathAndQuery: string,
  ): Promise<{ json: Record<string, unknown>; event: YoutubeQuotaEvent }> {
    const url = `https://www.googleapis.com/youtube/v3/${pathAndQuery}${pathAndQuery.includes('?') ? '&' : '?'}key=${apiKey}`;
    const at = new Date().toISOString();
    try {
      const res = await client.request(url);
      const json = (await res.json()) as Record<string, unknown>;
      return {
        json,
        event: {
          method,
          units: YOUTUBE_METHOD_COSTS[method],
          costTableVersion: YOUTUBE_QUOTA_COST_TABLE_VERSION,
          ok: true,
          retryCount: 0,
          at,
        },
      };
    } catch (err) {
      return {
        json: {},
        event: {
          method,
          units: YOUTUBE_METHOD_COSTS[method],
          costTableVersion: YOUTUBE_QUOTA_COST_TABLE_VERSION,
          ok: false,
          retryCount: 0,
          at,
          detail: err instanceof Error ? err.message : 'YouTube request failed',
        },
      };
    }
  }

  function mapChannelItem(
    item: Record<string, unknown>,
    resolutionMethod: YoutubeChannelResolved['resolutionMethod'],
  ): YoutubeChannelResolved {
    const id = String(item.id ?? '');
    const snippet = (item.snippet ?? {}) as Record<string, unknown>;
    const contentDetails = (item.contentDetails ?? {}) as Record<string, unknown>;
    const related = (contentDetails.relatedPlaylists ?? {}) as Record<string, unknown>;
    const thumbs = (snippet.thumbnails ?? {}) as Record<string, { url?: string }>;
    const customUrl = snippet.customUrl ? String(snippet.customUrl) : null;
    return {
      channelId: id,
      title: snippet.title ? String(snippet.title) : null,
      handle: customUrl,
      canonicalUrl: id ? `https://www.youtube.com/channel/${id}` : '',
      thumbnailUrl: thumbs.default?.url ?? thumbs.medium?.url ?? null,
      uploadsPlaylistId: related.uploads ? String(related.uploads) : null,
      resolutionMethod,
    };
  }

  async function resolveChannel(
    ref: string,
    resolveOpts: { allowSearchFallback?: boolean } = {},
  ): Promise<{
    candidates: YoutubeChannelResolved[];
    quotaEvents: YoutubeQuotaEvent[];
    unitsSpent: number;
  }> {
    const quotaEvents: YoutubeQuotaEvent[] = [];
    let unitsSpent = 0;
    const raw = ref.trim();
    const idMatch = raw.match(/(UC[\w-]{22})/);
    if (idMatch) {
      const { json, event } = await callApi(
        'channels.list',
        `channels?part=snippet,contentDetails&id=${encodeURIComponent(idMatch[1]!)}`,
      );
      quotaEvents.push(event);
      unitsSpent += event.units;
      if (!event.ok) return { candidates: [], quotaEvents, unitsSpent };
      const items = (json.items as Array<Record<string, unknown>> | undefined) ?? [];
      return {
        candidates: items.map((i) => mapChannelItem(i, 'channel_id')),
        quotaEvents,
        unitsSpent,
      };
    }

    const handle = (raw.match(/@([\w.-]+)/) ?? raw.match(/^([\w.-]+)$/))?.[1];
    if (handle) {
      const { json, event } = await callApi(
        'channels.list',
        `channels?part=snippet,contentDetails&forHandle=${encodeURIComponent(handle)}`,
      );
      quotaEvents.push(event);
      unitsSpent += event.units;
      if (event.ok) {
        const items = (json.items as Array<Record<string, unknown>> | undefined) ?? [];
        if (items.length) {
          return {
            candidates: items.map((i) => mapChannelItem(i, 'forHandle')),
            quotaEvents,
            unitsSpent,
          };
        }
      }
      if (!resolveOpts.allowSearchFallback) {
        return { candidates: [], quotaEvents, unitsSpent };
      }
      const search = await callApi(
        'search.list',
        `search?part=snippet&type=channel&maxResults=5&q=${encodeURIComponent(handle)}`,
      );
      quotaEvents.push(search.event);
      unitsSpent += search.event.units;
      if (!search.event.ok) return { candidates: [], quotaEvents, unitsSpent };
      const searchItems = (search.json.items as Array<Record<string, unknown>> | undefined) ?? [];
      const channelIds = searchItems
        .map((i) => String((i.id as { channelId?: string } | undefined)?.channelId ?? ''))
        .filter(Boolean);
      if (!channelIds.length) return { candidates: [], quotaEvents, unitsSpent };
      const detail = await callApi(
        'channels.list',
        `channels?part=snippet,contentDetails&id=${encodeURIComponent(channelIds.join(','))}`,
      );
      quotaEvents.push(detail.event);
      unitsSpent += detail.event.units;
      const items = (detail.json.items as Array<Record<string, unknown>> | undefined) ?? [];
      return {
        candidates: items.map((i) => mapChannelItem(i, 'search.list')),
        quotaEvents,
        unitsSpent,
      };
    }

    return { candidates: [], quotaEvents, unitsSpent };
  }

  async function syncChannelUploads(syncOpts: {
    channelId: string;
    lookbackDays?: number;
    maxVideos?: number;
    knownVideoIds?: Set<string>;
    unitsAlreadySpentToday?: number;
    appDailyCap?: number;
    baseline?: boolean;
  }): Promise<YoutubeChannelSyncResult> {
    const warnings: string[] = [];
    const quotaEvents: YoutubeQuotaEvent[] = [];
    let unitsSpent = 0;
    const appCap = syncOpts.appDailyCap ?? YOUTUBE_APP_DAILY_QUOTA_CAP;
    const already = syncOpts.unitsAlreadySpentToday ?? 0;
    const remaining = Math.max(0, appCap - already);
    const nearLimit = remaining <= Math.ceil(appCap * 0.1);

    const stopIfExhausted = (need: number): YoutubeChannelSyncResult | null => {
      if (already + unitsSpent + need > appCap) {
        return {
          ok: false,
          status: 'quota_exhausted',
          channel: null,
          videos: [],
          quotaEvents,
          unitsSpent,
          warnings: ['quota_exhausted: stopped before exceeding app daily quota cap'],
          errorMessage: 'quota_exhausted',
          baseline: Boolean(syncOpts.baseline),
        };
      }
      return null;
    };

    const blocked = stopIfExhausted(YOUTUBE_METHOD_COSTS['channels.list']);
    if (blocked) return blocked;

    const channelCall = await callApi(
      'channels.list',
      `channels?part=snippet,contentDetails&id=${encodeURIComponent(syncOpts.channelId)}`,
    );
    quotaEvents.push(channelCall.event);
    unitsSpent += channelCall.event.units;
    if (!channelCall.event.ok) {
      const detail = channelCall.event.detail ?? '';
      const status = /403|401|permission/i.test(detail) ? 'permission_error' : 'failed';
      return {
        ok: false,
        status,
        channel: null,
        videos: [],
        quotaEvents,
        unitsSpent,
        warnings,
        errorMessage: detail || 'channels.list failed',
        baseline: Boolean(syncOpts.baseline),
      };
    }
    const channelItems =
      (channelCall.json.items as Array<Record<string, unknown>> | undefined) ?? [];
    if (!channelItems.length) {
      return {
        ok: false,
        status: 'channel_not_found',
        channel: null,
        videos: [],
        quotaEvents,
        unitsSpent,
        warnings,
        errorMessage: 'channel_not_found',
        baseline: Boolean(syncOpts.baseline),
      };
    }
    const channel = mapChannelItem(channelItems[0]!, 'channel_id');
    if (!channel.uploadsPlaylistId) {
      return {
        ok: false,
        status: 'failed',
        channel,
        videos: [],
        quotaEvents,
        unitsSpent,
        warnings: ['Channel has no uploads playlist'],
        errorMessage: 'missing_uploads_playlist',
        baseline: Boolean(syncOpts.baseline),
      };
    }

    const lookbackDays = syncOpts.lookbackDays ?? YOUTUBE_DEFAULT_LOOKBACK_DAYS;
    const maxVideos = Math.min(
      syncOpts.maxVideos ?? YOUTUBE_MAX_VIDEOS_PER_CHANNEL,
      YOUTUBE_MAX_VIDEOS_PER_CHANNEL,
    );
    const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
    const videoIds: string[] = [];
    let pageToken: string | undefined;
    let hitKnown = false;

    while (videoIds.length < maxVideos && !hitKnown) {
      const need = YOUTUBE_METHOD_COSTS['playlistItems.list'];
      const stop = stopIfExhausted(need);
      if (stop) {
        return { ...stop, channel, warnings: [...warnings, ...(stop.warnings ?? [])] };
      }
      const params = new URLSearchParams({
        part: 'contentDetails,snippet',
        playlistId: channel.uploadsPlaylistId,
        maxResults: '50',
      });
      if (pageToken) params.set('pageToken', pageToken);
      const page = await callApi('playlistItems.list', `playlistItems?${params}`);
      quotaEvents.push(page.event);
      unitsSpent += page.event.units;
      if (!page.event.ok) {
        return {
          ok: false,
          status: 'failed',
          channel,
          videos: [],
          quotaEvents,
          unitsSpent,
          warnings,
          errorMessage: page.event.detail ?? 'playlistItems.list failed',
          baseline: Boolean(syncOpts.baseline),
        };
      }
      const items = (page.json.items as Array<Record<string, unknown>> | undefined) ?? [];
      for (const item of items) {
        const details = (item.contentDetails ?? {}) as Record<string, unknown>;
        const snippet = (item.snippet ?? {}) as Record<string, unknown>;
        const videoId = String(details.videoId ?? '');
        if (!videoId) continue;
        if (syncOpts.knownVideoIds?.has(videoId)) {
          hitKnown = true;
          break;
        }
        const published = snippet.publishedAt ? Date.parse(String(snippet.publishedAt)) : NaN;
        if (Number.isFinite(published) && published < cutoff) {
          hitKnown = true;
          break;
        }
        videoIds.push(videoId);
        if (videoIds.length >= maxVideos) break;
      }
      pageToken = page.json.nextPageToken ? String(page.json.nextPageToken) : undefined;
      if (!pageToken) break;
    }

    const videos: YoutubeVideoMetadata[] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const need = YOUTUBE_METHOD_COSTS['videos.list'];
      const stop = stopIfExhausted(need);
      if (stop) {
        warnings.push('quota_exhausted during videos.list batching');
        break;
      }
      const { json, event } = await callApi(
        'videos.list',
        `videos?part=snippet,contentDetails,status,paidProductPlacementDetails&id=${encodeURIComponent(batch.join(','))}`,
      );
      quotaEvents.push(event);
      unitsSpent += event.units;
      if (!event.ok) {
        warnings.push(event.detail ?? 'videos.list failed');
        continue;
      }
      for (const item of (json.items as Array<Record<string, unknown>> | undefined) ?? []) {
        const id = String(item.id ?? '');
        const snippet = (item.snippet ?? {}) as Record<string, unknown>;
        const contentDetails = (item.contentDetails ?? {}) as Record<string, unknown>;
        const status = (item.status ?? {}) as Record<string, unknown>;
        const paid = (item.paidProductPlacementDetails ?? {}) as Record<string, unknown>;
        const thumbs = (snippet.thumbnails ?? {}) as Record<string, { url?: string }>;
        videos.push({
          videoId: id,
          channelId: syncOpts.channelId,
          title: String(snippet.title ?? id),
          description: snippet.description ? String(snippet.description) : null,
          publishedAt: snippet.publishedAt ? String(snippet.publishedAt) : null,
          durationSeconds: parseIsoDurationSeconds(
            contentDetails.duration ? String(contentDetails.duration) : undefined,
          ),
          thumbnailUrl: thumbs.medium?.url ?? thumbs.default?.url ?? null,
          captionAvailable: String(contentDetails.caption ?? 'false') === 'true',
          paidPlacementDeclared: Boolean(paid.hasPaidProductPlacement),
          statusText: status.privacyStatus ? String(status.privacyStatus) : null,
          liveBroadcastContent: snippet.liveBroadcastContent
            ? String(snippet.liveBroadcastContent)
            : null,
          claimEvidence: false,
          captionsScraped: false,
          mediaDownloaded: false,
          note: 'YouTube API metadata is operational context only — not scientific or creator-claim evidence.',
        });
      }
    }

    if (nearLimit) warnings.push('quota_near_limit');
    return {
      ok: true,
      status: nearLimit ? 'quota_near_limit' : 'healthy',
      channel,
      videos,
      quotaEvents,
      unitsSpent,
      warnings,
      baseline: Boolean(syncOpts.baseline),
    };
  }

  return { resolveChannel, syncChannelUploads };
}

/**
 * YouTube Data API v3 — metadata for explicitly monitored channels only.
 * Never treats metadata as scientific/creator-claim evidence.
 * Never scrapes captions, downloads media, or runs speech-to-text.
 */
export function createYoutubeConnector(
  opts: {
    transport?: FetchTransport;
    apiKey?: string | null;
    channelIds?: string[];
    minIntervalMs?: number;
    unitsAlreadySpentToday?: number;
  } = {},
): SourceConnector {
  const apiKey = opts.apiKey ?? process.env.YOUTUBE_API_KEY ?? null;
  const channelIds = (opts.channelIds ?? [])
    .filter((id) => id.startsWith('UC'))
    .slice(0, YOUTUBE_MAX_CHANNELS_PER_SYNC);
  const enabled = Boolean(apiKey) && channelIds.length > 0;
  const yt = createYoutubeClient(opts);

  return {
    id: 'youtube',
    name: 'YouTube Data API',
    enabled,
    async fetchWindow({ recordCap, lookbackDays }): Promise<ConnectorFetchResult> {
      const fetchedAt = new Date().toISOString();
      if (!apiKey) {
        return {
          connectorId: 'youtube',
          fetchedAt,
          ok: true,
          pages: [],
          rawBodies: [],
          warnings: [
            'YouTube metadata connector not_configured until YOUTUBE_API_KEY is set. Metadata is never claim evidence.',
          ],
        };
      }
      if (!channelIds.length || !yt) {
        return {
          connectorId: 'youtube',
          fetchedAt,
          ok: true,
          pages: [],
          rawBodies: [],
          warnings: [
            'YouTube metadata connector disabled until monitored channel IDs (UC…) are configured. Metadata is never claim evidence.',
          ],
        };
      }

      const pages: ConnectorPage[] = [];
      const warnings: string[] = [];
      let unitsSpent = 0;
      let remainingCap = recordCap;
      let jobVideos = 0;

      for (const channelId of channelIds) {
        if (remainingCap <= 0 || jobVideos >= YOUTUBE_MAX_VIDEOS_PER_JOB) break;
        const sync = await yt.syncChannelUploads({
          channelId,
          lookbackDays: lookbackDays || YOUTUBE_DEFAULT_LOOKBACK_DAYS,
          maxVideos: Math.min(remainingCap, YOUTUBE_MAX_VIDEOS_PER_CHANNEL),
          unitsAlreadySpentToday: (opts.unitsAlreadySpentToday ?? 0) + unitsSpent,
          baseline: true,
        });
        unitsSpent += sync.unitsSpent;
        warnings.push(...sync.warnings);
        if (sync.status === 'quota_exhausted') {
          warnings.push('quota_exhausted');
          break;
        }
        if (!sync.ok) {
          warnings.push(sync.errorMessage ?? sync.status);
          continue;
        }
        if (sync.channel) {
          const normalized = {
            type: 'youtube_channel_metadata',
            platform: 'youtube',
            channelId: sync.channel.channelId,
            title: sync.channel.title,
            uploadsPlaylistId: sync.channel.uploadsPlaylistId,
            claimEvidence: false,
            captionsScraped: false,
            mediaDownloaded: false,
            note: 'YouTube API metadata is operational context only — not scientific or creator-claim evidence.',
            dayKey: dayKey(),
            quotaCostTableVersion: YOUTUBE_QUOTA_COST_TABLE_VERSION,
          };
          pages.push({
            externalId: sync.channel.channelId,
            canonicalUrl: sync.channel.canonicalUrl,
            payload: { channel: sync.channel, quotaEvents: sync.quotaEvents },
            normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
          });
        }
        for (const video of sync.videos) {
          if (remainingCap <= 0 || jobVideos >= YOUTUBE_MAX_VIDEOS_PER_JOB) break;
          const normalized = {
            type: 'youtube_video_metadata',
            platform: 'youtube',
            ...video,
          };
          pages.push({
            externalId: video.videoId,
            canonicalUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
            sourceCreatedAt: video.publishedAt,
            sourceUpdatedAt: video.publishedAt,
            payload: video,
            normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
          });
          remainingCap -= 1;
          jobVideos += 1;
        }
      }

      return {
        connectorId: 'youtube',
        fetchedAt,
        ok: true,
        pages,
        rawBodies: [],
        warnings: [
          ...warnings,
          'YouTube responses are not stored in permanent RawSnapshotStore; current metadata only.',
          `quota_units_spent_this_fetch=${unitsSpent}`,
        ],
      };
    },
  };
}
