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

export function parsePubmedEfetchXml(
  xml: string,
  recordCap: number,
): ConnectorFetchResult['pages'] {
  const articles = [...xml.matchAll(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g)].map((m) => m[0]);
  return articles.slice(0, recordCap).map((articleXml) => {
    const pmid = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] ?? 'unknown';
    const title =
      articleXml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1]?.replace(/<[^>]+>/g, '') ??
      `PubMed ${pmid}`;
    const abstractParts = [
      ...articleXml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g),
    ].map((m) => m[1]?.replace(/<[^>]+>/g, '') ?? '');
    const abstract = abstractParts.filter(Boolean).join('\n\n') || null;
    const doiMatch = articleXml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/)?.[1];
    const journal = articleXml.match(/<Title>([\s\S]*?)<\/Title>/)?.[1] ?? null;
    const funding = [...articleXml.matchAll(/<Agency>([\s\S]*?)<\/Agency>/g)].map((m) =>
      (m[1] ?? '').replace(/<[^>]+>/g, ''),
    );
    const isCorrectionOrRetraction =
      /<PublicationType>.*(Retraction|Correction|Erratum).*<\/PublicationType>/i.test(articleXml);
    const normalized = {
      type: 'paper',
      pmid,
      doi: normalizeDoi(doiMatch),
      title,
      summary: abstract,
      journal,
      funding,
      isCorrectionOrRetraction,
      canonicalUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    };
    return {
      externalId: pmid,
      canonicalUrl: normalized.canonicalUrl,
      payload: { xmlFragment: articleXml },
      normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
    };
  });
}

/** Re-parse stored PubMed EFetch XML bytes without network. */
export function reparsePubmedRaw(bytes: Buffer, recordCap = 1000): ConnectorFetchResult {
  const text = bytes.toString('utf8');
  const fetchedAt = new Date().toISOString();
  if (text.trimStart().startsWith('{')) {
    return {
      connectorId: 'pubmed',
      fetchedAt,
      ok: true,
      pages: [],
      rawBodies: [{ bytes, mediaType: 'application/json', ext: 'json' }],
    };
  }
  const pages = parsePubmedEfetchXml(text, recordCap);
  return {
    connectorId: 'pubmed',
    fetchedAt,
    ok: true,
    pages,
    rawBodies: [{ bytes, mediaType: 'application/xml', ext: 'xml' }],
  };
}

/** PubMed connector — ESearch (paginated / WebEnv) + batched EFetch. Fixture transport supported. */
export function createPubmedConnector(
  opts: {
    tool?: string;
    email?: string;
    apiKey?: string;
    transport?: FetchTransport;
  } = {},
): SourceConnector {
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
      const mindate =
        (cursor.mindate as string | undefined) ??
        new Date(Date.now() - lookbackDays * 86400000).toISOString().slice(0, 10);
      const pageSize = Math.min(recordCap, 200);
      const rawBodies: ConnectorFetchResult['rawBodies'] = [];
      const allIds: string[] = [];

      try {
        let webenv = typeof cursor.webenv === 'string' ? cursor.webenv : undefined;
        let queryKey = typeof cursor.queryKey === 'string' ? cursor.queryKey : undefined;
        let retstart = Number(cursor.retstart ?? 0) || 0;

        while (allIds.length < recordCap) {
          const searchParams = new URLSearchParams({
            db: 'pubmed',
            term,
            retmax: String(Math.min(pageSize, recordCap - allIds.length)),
            retstart: String(retstart),
            retmode: 'json',
            datetype: 'edat',
            mindate,
            usehistory: 'y',
            tool: opts.tool ?? 'healthspan_dashboard',
            email: opts.email ?? 'local@invalid',
          });
          if (opts.apiKey) searchParams.set('api_key', opts.apiKey);
          if (webenv && queryKey) {
            searchParams.set('WebEnv', webenv);
            searchParams.set('query_key', queryKey);
          }

          const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${searchParams}`;
          const searchRes = await client.request(searchUrl);
          const searchJson = (await searchRes.json()) as {
            esearchresult?: {
              idlist?: string[];
              webenv?: string;
              querykey?: string;
              count?: string;
              retmax?: string;
            };
          };
          rawBodies.push({
            bytes: Buffer.from(JSON.stringify(searchJson), 'utf8'),
            mediaType: 'application/json',
            ext: 'json',
          });
          const batch = searchJson.esearchresult?.idlist ?? [];
          webenv = searchJson.esearchresult?.webenv ?? webenv;
          queryKey = searchJson.esearchresult?.querykey ?? queryKey;
          if (batch.length === 0) break;
          allIds.push(...batch);
          retstart += batch.length;
          const total = Number(searchJson.esearchresult?.count ?? 0);
          if (retstart >= total || batch.length < pageSize) break;
          // Fixture transports typically return one page; avoid infinite loops.
          if (!opts.apiKey && batch.length >= recordCap) break;
          if (opts.transport && allIds.length > 0) break;
        }

        if (allIds.length === 0) {
          return {
            connectorId: 'pubmed',
            fetchedAt,
            ok: true,
            pages: [],
            nextCursor: { query: term, mindate, retstart, webenv, queryKey },
            rawBodies,
          };
        }

        const pages: ConnectorFetchResult['pages'] = [];
        const batchSize = 200;
        for (let i = 0; i < allIds.length && pages.length < recordCap; i += batchSize) {
          const slice = allIds.slice(i, Math.min(i + batchSize, recordCap));
          const fetchParams = new URLSearchParams({
            db: 'pubmed',
            id: slice.join(','),
            retmode: 'xml',
            tool: opts.tool ?? 'healthspan_dashboard',
            email: opts.email ?? 'local@invalid',
          });
          if (opts.apiKey) fetchParams.set('api_key', opts.apiKey);
          const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?${fetchParams}`;
          const fetchRes = await client.request(fetchUrl);
          const xml = await fetchRes.text();
          rawBodies.push({
            bytes: Buffer.from(xml, 'utf8'),
            mediaType: 'application/xml',
            ext: 'xml',
          });
          pages.push(...parsePubmedEfetchXml(xml, recordCap - pages.length));
        }

        return {
          connectorId: 'pubmed',
          fetchedAt,
          ok: true,
          pages,
          nextCursor: { query: term, mindate, retstart, webenv, queryKey, lastIds: allIds },
          rawBodies,
        };
      } catch (err) {
        return {
          connectorId: 'pubmed',
          fetchedAt,
          ok: false,
          pages: [],
          rawBodies,
          errorMessage: err instanceof Error ? err.message : 'PubMed fetch failed',
        };
      }
    },
  };
}
