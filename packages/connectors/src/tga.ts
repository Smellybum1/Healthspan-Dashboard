import { createHash } from 'node:crypto';
import type { ConnectorFetchResult, FetchTransport, SourceConnector } from './types.js';
import { createHttpClient } from './http.js';

const TGA_FEEDS = [
  {
    feedId: 'tga-safety-alerts',
    feedKey: 'safety-alerts',
    category: 'safety_alerts',
    url: 'https://www.tga.gov.au/news/safety-alerts/rss.xml',
  },
  {
    feedId: 'tga-market-actions',
    feedKey: 'market-actions',
    category: 'market_actions',
    url: 'https://www.tga.gov.au/news/safety-alerts/market-actions/rss.xml',
  },
  {
    feedId: 'tga-safety-updates',
    feedKey: 'safety-updates',
    category: 'safety_updates',
    url: 'https://www.tga.gov.au/news/safety-updates/rss.xml',
  },
  {
    feedId: 'tga-media-releases',
    feedKey: 'media-releases',
    category: 'media_releases',
    url: 'https://www.tga.gov.au/news/media-releases/rss.xml',
  },
] as const;

const RELEVANCE_TERMS = [
  'peptide',
  'compounded',
  'compounding',
  'nad',
  'nmn',
  'rapamycin',
  'sirolimus',
  'metformin',
  'senolytic',
  'longevity',
  'ageing',
  'aging',
  'stem cell',
  'supplement',
];

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function parseRssItems(xml: string) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1] ?? '');
}

function tag(block: string, name: string): string | null {
  const m = block.match(
    new RegExp(
      `<${name}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${name}>|<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`,
      'i',
    ),
  );
  if (!m) return null;
  return (m[1] ?? m[2] ?? '').trim() || null;
}

function pagesFromTgaXml(xml: string, feedKey: string, category: string, recordCap: number) {
  const pages: ConnectorFetchResult['pages'] = [];
  for (const item of parseRssItems(xml)) {
    if (pages.length >= recordCap) break;
    const title = tag(item, 'title') ?? 'TGA item';
    const link = tag(item, 'link');
    const guid = tag(item, 'guid') ?? link ?? `${feedKey}:${title}`;
    const description = tag(item, 'description');
    const pubDate = tag(item, 'pubDate');
    const haystack = `${title} ${description ?? ''}`.toLowerCase();
    const matchedTerms = RELEVANCE_TERMS.filter((term) => haystack.includes(term));
    const normalized = {
      type: 'regulatory_event',
      jurisdiction: 'AU',
      authority: 'TGA',
      feedKey,
      category,
      title,
      summary: description,
      guid,
      officialUrl: link,
      publishedAt: pubDate,
      relevanceMatched: matchedTerms.length > 0,
      relevanceTerms: matchedTerms,
    };
    pages.push({
      externalId: guid,
      canonicalUrl: link ?? undefined,
      sourceCreatedAt: pubDate ?? undefined,
      payload: { feed: feedKey, itemXml: item },
      normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
    });
  }
  return pages;
}

/** Re-parse stored TGA RSS XML without network. */
export function reparseTgaRaw(bytes: Buffer, recordCap = 1000): ConnectorFetchResult {
  const fetchedAt = new Date().toISOString();
  const xml = bytes.toString('utf8');
  const pages = pagesFromTgaXml(xml, 'reprocess', 'safety_alerts', recordCap);
  return {
    connectorId: 'tga',
    fetchedAt,
    ok: true,
    pages,
    rawBodies: [{ bytes, mediaType: 'application/rss+xml', ext: 'rss' }],
  };
}

export function createTgaConnector(
  opts: {
    transport?: FetchTransport;
    feeds?: typeof TGA_FEEDS;
  } = {},
): SourceConnector {
  const client = createHttpClient({
    transport: opts.transport,
    userAgent: 'HealthspanDashboard/0.2 (tga-rss)',
    minIntervalMs: 300,
  });
  const feeds = opts.feeds ?? TGA_FEEDS;

  return {
    id: 'tga',
    name: 'TGA RSS',
    enabled: true,
    async fetchWindow({ recordCap }): Promise<ConnectorFetchResult> {
      const fetchedAt = new Date().toISOString();
      const pages: ConnectorFetchResult['pages'] = [];
      const rawBodies: ConnectorFetchResult['rawBodies'] = [];
      const warnings: string[] = [];

      for (const feed of feeds) {
        try {
          const res = await client.request(feed.url);
          const xml = await res.text();
          rawBodies.push({
            bytes: Buffer.from(xml, 'utf8'),
            mediaType: 'application/rss+xml',
            ext: 'rss',
            etag: res.headers.get('etag') ?? undefined,
            lastModified: res.headers.get('last-modified') ?? undefined,
          });

          for (const item of parseRssItems(xml)) {
            if (pages.length >= recordCap) break;
            const title = tag(item, 'title') ?? 'TGA item';
            const link = tag(item, 'link');
            const guid = tag(item, 'guid') ?? link ?? `${feed.feedKey}:${title}`;
            const description = tag(item, 'description');
            const pubDate = tag(item, 'pubDate');
            const haystack = `${title} ${description ?? ''}`.toLowerCase();
            const matchedTerms = RELEVANCE_TERMS.filter((term) => haystack.includes(term));
            const normalized = {
              type: 'regulatory_event',
              jurisdiction: 'AU',
              authority: 'TGA',
              feedKey: feed.feedKey,
              category: feed.category,
              title,
              summary: description,
              guid,
              officialUrl: link,
              publishedAt: pubDate,
              relevanceMatched: matchedTerms.length > 0,
              relevanceTerms: matchedTerms,
            };
            pages.push({
              externalId: guid,
              canonicalUrl: link ?? undefined,
              sourceCreatedAt: pubDate,
              payload: { feed: feed.feedKey, itemXml: item },
              normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
            });
          }
        } catch (err) {
          warnings.push(
            `${feed.feedKey}: ${err instanceof Error ? err.message : 'TGA feed failed'}`,
          );
        }
      }

      return {
        connectorId: 'tga',
        fetchedAt,
        ok: warnings.length < feeds.length,
        pages,
        nextCursor: { feeds: feeds.map((f) => f.feedKey) },
        rawBodies,
        warnings,
        errorMessage: pages.length === 0 && warnings.length ? warnings[0] : undefined,
      };
    },
  };
}

export { TGA_FEEDS, RELEVANCE_TERMS };
