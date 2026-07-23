import { createHash } from 'node:crypto';
import type { ConnectorFetchResult, FetchTransport, SourceConnector } from './types.js';
import { createHttpClient } from './http.js';

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function normalizeDoi(doi: string): string {
  return doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
}

/** Crossref enrichment-only connector: exact DOI lookups for locally known DOIs. */
export function createCrossrefConnector(opts: {
  mailto?: string;
  dois?: string[];
  transport?: FetchTransport;
} = {}): SourceConnector {
  const client = createHttpClient({
    transport: opts.transport,
    userAgent: `HealthspanDashboard/0.2 (mailto:${opts.mailto ?? 'local@invalid'})`,
    minIntervalMs: 100,
  });

  return {
    id: 'crossref',
    name: 'Crossref',
    enabled: true,
    async fetchWindow({ recordCap }): Promise<ConnectorFetchResult> {
      const fetchedAt = new Date().toISOString();
      const dois = (opts.dois ?? []).slice(0, recordCap);
      const pages = [];
      const rawBodies = [];
      const warnings: string[] = [];

      for (const rawDoi of dois) {
        const doi = normalizeDoi(rawDoi);
        try {
          const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
          const res = await client.request(url);
          const json = (await res.json()) as { message?: Record<string, unknown> };
          const message = json.message ?? {};
          const normalized = {
            type: 'paper_enrichment',
            doi,
            title: Array.isArray(message.title) ? String(message.title[0] ?? '') : null,
            publisher: message.publisher ? String(message.publisher) : null,
            licence: Array.isArray(message.license)
              ? String((message.license[0] as { URL?: string })?.URL ?? '')
              : null,
            deposited: (message.deposited as { dateTime?: string } | undefined)?.dateTime ?? null,
            updateTo: message['update-to'] ?? null,
            canonicalUrl: `https://doi.org/${doi}`,
          };
          pages.push({
            externalId: doi,
            canonicalUrl: normalized.canonicalUrl,
            payload: message,
            normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
          });
          rawBodies.push({
            bytes: Buffer.from(JSON.stringify(json), 'utf8'),
            mediaType: 'application/json',
            ext: 'json',
          });
        } catch (err) {
          warnings.push(err instanceof Error ? err.message : `Crossref failed for ${doi}`);
        }
      }

      return {
        connectorId: 'crossref',
        fetchedAt,
        ok: warnings.length < dois.length || dois.length === 0,
        pages,
        nextCursor: { enriched: dois.length },
        rawBodies,
        warnings,
        errorMessage: pages.length === 0 && dois.length > 0 ? warnings[0] : undefined,
      };
    },
  };
}
