import { createHash } from 'node:crypto';
import type { ConnectorFetchResult, FetchTransport, SourceConnector } from './types.js';
import { createHttpClient } from './http.js';

function normalizeDoi(doi?: string | null): string | null {
  if (!doi) return null;
  return doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
}

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/** PubMed connector — uses ESearch/EFetch. Fixture transport supported for tests. */
export function createPubmedConnector(opts: {
  tool?: string;
  email?: string;
  apiKey?: string;
  transport?: FetchTransport;
} = {}): SourceConnector {
  const client = createHttpClient({
    transport: opts.transport,
    userAgent: `HealthspanDashboard/0.2 (${opts.tool ?? 'healthspan_dashboard'}; ${opts.email ?? 'local@invalid'})`,
    minIntervalMs: opts.apiKey ? 100 : 350,
  });

  return {
    id: 'pubmed',
    name: 'PubMed',
    enabled: true,
    async fetchWindow({ cursor, lookbackDays, recordCap }): Promise<ConnectorFetchResult> {
      const fetchedAt = new Date().toISOString();
      const term =
        (cursor.query as string | undefined) ??
        '(aging[Title/Abstract] OR ageing[Title/Abstract] OR longevity[Title/Abstract] OR senolytic[Title/Abstract])';
      const mindate = new Date(Date.now() - lookbackDays * 86400000).toISOString().slice(0, 10);

      try {
        const searchParams = new URLSearchParams({
          db: 'pubmed',
          term,
          retmax: String(Math.min(recordCap, 200)),
          retmode: 'json',
          datetype: 'edat',
          mindate,
          tool: opts.tool ?? 'healthspan_dashboard',
          email: opts.email ?? 'local@invalid',
        });
        if (opts.apiKey) searchParams.set('api_key', opts.apiKey);

        const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${searchParams}`;
        const searchRes = await client.request(searchUrl);
        const searchJson = (await searchRes.json()) as {
          esearchresult?: { idlist?: string[] };
        };
        const ids = searchJson.esearchresult?.idlist ?? [];
        if (ids.length === 0) {
          return {
            connectorId: 'pubmed',
            fetchedAt,
            ok: true,
            pages: [],
            nextCursor: { query: term, mindate },
            rawBodies: [
              {
                bytes: Buffer.from(JSON.stringify(searchJson), 'utf8'),
                mediaType: 'application/json',
                ext: 'json',
              },
            ],
          };
        }

        const fetchParams = new URLSearchParams({
          db: 'pubmed',
          id: ids.join(','),
          retmode: 'xml',
          tool: opts.tool ?? 'healthspan_dashboard',
          email: opts.email ?? 'local@invalid',
        });
        if (opts.apiKey) fetchParams.set('api_key', opts.apiKey);
        const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?${fetchParams}`;
        const fetchRes = await client.request(fetchUrl);
        const xml = await fetchRes.text();

        const articles = [...xml.matchAll(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g)].map((m) => m[0]);
        const pages = articles.slice(0, recordCap).map((articleXml) => {
          const pmid = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] ?? 'unknown';
          const title =
            articleXml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1]?.replace(/<[^>]+>/g, '') ??
            `PubMed ${pmid}`;
          const abstract =
            articleXml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/)?.[1]?.replace(/<[^>]+>/g, '') ??
            null;
          const doiMatch = articleXml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/)?.[1];
          const journal = articleXml.match(/<Title>([\s\S]*?)<\/Title>/)?.[1] ?? null;
          const normalized = {
            type: 'paper',
            pmid,
            doi: normalizeDoi(doiMatch),
            title,
            summary: abstract,
            journal,
            canonicalUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          };
          return {
            externalId: pmid,
            canonicalUrl: normalized.canonicalUrl,
            payload: { xmlFragment: articleXml },
            normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
          };
        });

        return {
          connectorId: 'pubmed',
          fetchedAt,
          ok: true,
          pages,
          nextCursor: { query: term, mindate, lastIds: ids },
          rawBodies: [
            {
              bytes: Buffer.from(JSON.stringify(searchJson), 'utf8'),
              mediaType: 'application/json',
              ext: 'json',
            },
            { bytes: Buffer.from(xml, 'utf8'), mediaType: 'application/xml', ext: 'xml' },
          ],
        };
      } catch (err) {
        return {
          connectorId: 'pubmed',
          fetchedAt,
          ok: false,
          pages: [],
          rawBodies: [],
          errorMessage: err instanceof Error ? err.message : 'PubMed fetch failed',
        };
      }
    },
  };
}
