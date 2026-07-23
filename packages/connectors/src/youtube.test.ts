import {
  createYoutubeClient,
  createYoutubeConnector,
  YOUTUBE_METHOD_COSTS,
  YOUTUBE_QUOTA_COST_TABLE_VERSION,
} from './youtube.js';
import { describe, expect, it } from 'vitest';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function youtubeFixtureTransport(): (input: string | URL) => Promise<Response> {
  return async (input) => {
    const url = String(input);
    if (url.includes('/channels?') && url.includes('id=UCxxxxxxxxxxxxxxxxxxxxxx')) {
      return jsonResponse({
        items: [
          {
            id: 'UCxxxxxxxxxxxxxxxxxxxxxx',
            snippet: { title: 'Fixture Channel', customUrl: '@fixture' },
            contentDetails: { relatedPlaylists: { uploads: 'UUxxxxxxxxxxxxxxxxxxxxxx' } },
          },
        ],
      });
    }
    if (url.includes('/channels?') && url.includes('forHandle=')) {
      return jsonResponse({
        items: [
          {
            id: 'UCxxxxxxxxxxxxxxxxxxxxxx',
            snippet: { title: 'Fixture Channel', customUrl: '@fixture' },
            contentDetails: { relatedPlaylists: { uploads: 'UUxxxxxxxxxxxxxxxxxxxxxx' } },
          },
        ],
      });
    }
    if (url.includes('/playlistItems?')) {
      return jsonResponse({
        items: [
          {
            contentDetails: { videoId: 'vid001' },
            snippet: { publishedAt: new Date().toISOString(), title: 'New talk' },
          },
          {
            contentDetails: { videoId: 'vid002' },
            snippet: {
              publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              title: 'Older talk',
            },
          },
        ],
      });
    }
    if (url.includes('/videos?')) {
      return jsonResponse({
        items: [
          {
            id: 'vid001',
            snippet: {
              title: 'New talk',
              description: 'Metformin improves aging biomarkers in mice.',
              publishedAt: new Date().toISOString(),
              liveBroadcastContent: 'none',
              thumbnails: { default: { url: 'https://i.ytimg.com/vi/vid001/default.jpg' } },
            },
            contentDetails: { duration: 'PT12M5S', caption: 'true' },
            status: { privacyStatus: 'public' },
            paidProductPlacementDetails: { hasPaidProductPlacement: false },
          },
          {
            id: 'vid002',
            snippet: {
              title: 'Older talk',
              description: 'Operational description only',
              publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              liveBroadcastContent: 'none',
              thumbnails: { default: { url: 'https://i.ytimg.com/vi/vid002/default.jpg' } },
            },
            contentDetails: { duration: 'PT8M', caption: 'false' },
            status: { privacyStatus: 'public' },
            paidProductPlacementDetails: { hasPaidProductPlacement: true },
          },
        ],
      });
    }
    return jsonResponse({ error: 'unexpected fixture url', url }, 404);
  };
}

describe('YouTube connector depth', () => {
  it('resolves channel by forHandle and syncs uploads playlist + videos', async () => {
    const client = createYoutubeClient({
      apiKey: 'test-key',
      transport: youtubeFixtureTransport(),
      minIntervalMs: 0,
    });
    expect(client).not.toBeNull();
    const resolved = await client!.resolveChannel('@fixture');
    expect(resolved.candidates[0]?.channelId).toBe('UCxxxxxxxxxxxxxxxxxxxxxx');
    expect(resolved.candidates[0]?.uploadsPlaylistId).toBe('UUxxxxxxxxxxxxxxxxxxxxxx');
    expect(resolved.unitsSpent).toBe(YOUTUBE_METHOD_COSTS['channels.list']);

    const sync = await client!.syncChannelUploads({
      channelId: 'UCxxxxxxxxxxxxxxxxxxxxxx',
      maxVideos: 10,
      baseline: true,
    });
    expect(sync.ok).toBe(true);
    expect(sync.videos).toHaveLength(2);
    expect(sync.videos.every((v) => v.claimEvidence === false)).toBe(true);
    expect(sync.videos.every((v) => v.captionsScraped === false)).toBe(true);
    expect(sync.videos.every((v) => v.mediaDownloaded === false)).toBe(true);
    expect(sync.videos[0]?.captionAvailable).toBe(true);
    expect(sync.videos[1]?.paidPlacementDeclared).toBe(true);
    expect(sync.quotaEvents.every((e) => e.costTableVersion === YOUTUBE_QUOTA_COST_TABLE_VERSION)).toBe(
      true,
    );
    // channels.list + playlistItems.list + videos.list
    expect(sync.unitsSpent).toBe(
      YOUTUBE_METHOD_COSTS['channels.list'] +
        YOUTUBE_METHOD_COSTS['playlistItems.list'] +
        YOUTUBE_METHOD_COSTS['videos.list'],
    );
  });

  it('stops before exceeding app daily quota cap and surfaces quota_exhausted', async () => {
    const client = createYoutubeClient({
      apiKey: 'test-key',
      transport: youtubeFixtureTransport(),
      minIntervalMs: 0,
    });
    const sync = await client!.syncChannelUploads({
      channelId: 'UCxxxxxxxxxxxxxxxxxxxxxx',
      unitsAlreadySpentToday: 4999,
      appDailyCap: 5000,
      baseline: true,
    });
    expect(sync.ok).toBe(false);
    expect(sync.status).toBe('quota_exhausted');
    expect(sync.errorMessage).toMatch(/quota_exhausted/);
  });

  it('createYoutubeConnector fetchWindow returns video pages without raw snapshot bodies', async () => {
    const result = await createYoutubeConnector({
      apiKey: 'test-key',
      channelIds: ['UCxxxxxxxxxxxxxxxxxxxxxx'],
      transport: youtubeFixtureTransport(),
      minIntervalMs: 0,
    }).fetchWindow({ cursor: {}, lookbackDays: 180, recordCap: 50 });
    expect(result.ok).toBe(true);
    expect(result.rawBodies).toHaveLength(0);
    expect(result.pages.some((p) => p.normalized.type === 'youtube_video_metadata')).toBe(true);
    expect(result.pages.every((p) => p.normalized.claimEvidence === false)).toBe(true);
    expect(result.warnings?.some((w) => /RawSnapshotStore/i.test(w))).toBe(true);
  });

  it('disabled connector stays healthy and never claims evidence', async () => {
    const result = await createYoutubeConnector({ apiKey: null, channelIds: [] }).fetchWindow({
      cursor: {},
      lookbackDays: 7,
      recordCap: 5,
    });
    expect(result.ok).toBe(true);
    expect(result.warnings?.[0]).toMatch(/never claim evidence/i);
  });
});
