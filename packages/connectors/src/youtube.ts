import { createHash } from 'node:crypto';
import { createHttpClient } from './http.js';
import type { ConnectorFetchResult, ConnectorPage, FetchTransport, SourceConnector } from './types.js';

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
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
  } = {},
): SourceConnector {
  const apiKey = opts.apiKey ?? process.env.YOUTUBE_API_KEY ?? null;
  const enabled = Boolean(apiKey) && (opts.channelIds?.length ?? 0) > 0;

  const client = createHttpClient({
    transport: opts.transport,
    userAgent: 'HealthspanDashboard/0.2 (youtube-metadata; local@invalid)',
    minIntervalMs: opts.minIntervalMs ?? 1000,
  });

  return {
        id: 'youtube',
        name: 'YouTube Data API',
        enabled,
        async fetchWindow({ recordCap }): Promise<ConnectorFetchResult> {
          const fetchedAt = new Date().toISOString();
          if (!enabled) {
            return {
              connectorId: 'youtube',
              fetchedAt,
              ok: true,
              pages: [],
              rawBodies: [],
              warnings: [
                'YouTube metadata connector disabled until YOUTUBE_API_KEY and monitored channel IDs are configured. Metadata is never claim evidence.',
              ],
            };
          }

          try {
            const channelId = opts.channelIds![0]!;
            const params = new URLSearchParams({
              part: 'snippet,contentDetails',
              id: channelId,
              key: apiKey!,
            });
            const url = `https://www.googleapis.com/youtube/v3/channels?${params}`;
            const res = await client.request(url);
            const json = (await res.json()) as {
              items?: Array<{
                id?: string;
                snippet?: { title?: string; description?: string; customUrl?: string };
              }>;
            };
            const pages: ConnectorPage[] = (json.items ?? []).slice(0, recordCap).map((item) => {
              const normalized = {
                type: 'platform_metadata',
                platform: 'youtube',
                channelId: item.id,
                title: item.snippet?.title ?? null,
                description: item.snippet?.description ?? null,
                customUrl: item.snippet?.customUrl ?? null,
                claimEvidence: false,
                captionsScraped: false,
                mediaDownloaded: false,
                note: 'YouTube API metadata is operational context only — not scientific or creator-claim evidence.',
              };
              return {
                externalId: item.id ?? 'unknown',
                canonicalUrl: item.id ? `https://www.youtube.com/channel/${item.id}` : undefined,
                payload: item,
                normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
              };
            });
            return {
              connectorId: 'youtube',
              fetchedAt,
              ok: true,
              pages,
              rawBodies: [
                { bytes: Buffer.from(JSON.stringify(json), 'utf8'), mediaType: 'application/json', ext: 'json' },
              ],
            };
          } catch (err) {
            return {
              connectorId: 'youtube',
              fetchedAt,
              ok: false,
              pages: [],
              rawBodies: [],
              errorMessage: err instanceof Error ? err.message : 'YouTube fetch failed',
            };
          }
        },
  };
}
