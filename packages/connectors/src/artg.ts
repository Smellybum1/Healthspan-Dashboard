import { createHash } from 'node:crypto';
import { createHttpClient } from './http.js';
import {
  identityResult,
  type IdentityConnector,
  type IdentityLookupQuery,
} from './identity-types.js';
import type {
  ConnectorFetchResult,
  ConnectorPage,
  FetchTransport,
  SourceConnector,
} from './types.js';

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

const ARTG_SEARCH_BASE = 'https://www.tga.gov.au/resources/artg';
const REQUIRED_MARKERS = ['ARTG ID', 'artg'];

export type ArtgParsedProduct = {
  artgId: string;
  productName: string;
  sponsor?: string | null;
  licenceStatus?: string | null;
  registrationType?: string | null;
  ingredients?: string | null;
  officialUrl: string;
  piUrl?: string | null;
  cmiUrl?: string | null;
};

function parseArtgSearchHtml(html: string): ArtgParsedProduct[] {
  if (
    !REQUIRED_MARKERS.some((m) => html.toLowerCase().includes(m.toLowerCase())) &&
    !html.includes('data-artg-id')
  ) {
    throw new Error('ARTG HTML contract markers missing — parser_contract_failure');
  }

  const products: ArtgParsedProduct[] = [];
  const rowRe = /<[^>]*data-artg-id="(\d+)"[^>]*>/gi;
  for (const match of html.matchAll(rowRe)) {
    const tag = match[0]!;
    const artgId = match[1]!;
    const attr = (name: string) => tag.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1] ?? null;
    products.push({
      artgId,
      productName: attr('data-product-name') ?? `ARTG ${artgId}`,
      sponsor: attr('data-sponsor'),
      licenceStatus: attr('data-status'),
      officialUrl: `${ARTG_SEARCH_BASE}/${artgId}`,
    });
  }

  // Detail-page fallback
  if (products.length === 0) {
    const id = html.match(/ARTG ID[^0-9]*(\d+)/i)?.[1];
    const name = html.match(/Product name[^<]*<[^>]*>([^<]+)/i)?.[1]?.trim();
    const status = html.match(/Licence status[^<]*<[^>]*>([^<]+)/i)?.[1]?.trim();
    const sponsor = html.match(/Sponsor[^<]*<[^>]*>([^<]+)/i)?.[1]?.trim();
    if (id && name) {
      products.push({
        artgId: id,
        productName: name,
        sponsor: sponsor ?? null,
        licenceStatus: status ?? null,
        registrationType: html.match(/Registration type[^<]*<[^>]*>([^<]+)/i)?.[1]?.trim() ?? null,
        ingredients: html.match(/Active ingredients?[^<]*<[^>]*>([^<]+)/i)?.[1]?.trim() ?? null,
        officialUrl: `${ARTG_SEARCH_BASE}/${id}`,
        piUrl: html.match(/href="([^"]+)"[^>]*>\s*PI\s*</i)?.[1] ?? null,
        cmiUrl: html.match(/href="([^"]+)"[^>]*>\s*CMI\s*</i)?.[1] ?? null,
      });
    }
  }

  return products;
}

function normalizeLicenceStanding(raw: string | null | undefined): string {
  const s = (raw ?? '').toLowerCase();
  if (!s) return 'unknown_source_status';
  if (s.includes('cancelled')) return 'cancelled';
  if (s.includes('suspended')) return 'suspended';
  if (s.includes('active') || s.includes('registered') || s.includes('listed'))
    return 'included_or_authorised';
  return 'source_native_unmapped';
}

/**
 * Bounded official TGA ARTG connector — no full crawl.
 * Search misses are no_exact_match_found, never unapproved.
 */
export function createArtgConnector(
  opts: { transport?: FetchTransport; minIntervalMs?: number; enabled?: boolean } = {},
): IdentityConnector & SourceConnector {
  const enabled = opts.enabled ?? true;
  const client = createHttpClient({
    transport: opts.transport,
    userAgent: 'HealthspanDashboard/0.2 (artg-bounded; local@invalid)',
    minIntervalMs: opts.minIntervalMs ?? 2000,
  });

  async function lookup(args: IdentityLookupQuery) {
    const fetchedAt = new Date().toISOString();
    if (!enabled) {
      return identityResult({
        connectorId: 'artg',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: 'disabled',
        pages: [],
        rawBodies: [],
        warnings: ['ARTG connector intentionally disabled'],
      });
    }

    const q = args.query.trim();
    if (!q) {
      return identityResult({
        connectorId: 'artg',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: 'identity_unresolved',
        pages: [],
        rawBodies: [],
        warnings: ['Unresolved identity — ARTG was not queried'],
      });
    }

    try {
      const isId = args.mode === 'artg_id' || /^\d{5,8}$/.test(q);
      const url = isId
        ? `${ARTG_SEARCH_BASE}/${encodeURIComponent(q)}`
        : `${ARTG_SEARCH_BASE}?search_api_fulltext=${encodeURIComponent(q)}`;
      const res = await client.request(url);
      const html = await res.text();
      const rawBodies: ConnectorFetchResult['rawBodies'] = [
        { bytes: Buffer.from(html, 'utf8'), mediaType: 'text/html', ext: 'html' },
      ];

      let products: ArtgParsedProduct[];
      try {
        products = parseArtgSearchHtml(html);
      } catch (err) {
        return identityResult({
          connectorId: 'artg',
          fetchedAt,
          ok: false,
          query: args,
          matchKind: 'parser_contract_failure',
          pages: [],
          rawBodies,
          errorMessage: err instanceof Error ? err.message : 'ARTG parse failed',
        });
      }

      if (products.length === 0) {
        return identityResult({
          connectorId: 'artg',
          fetchedAt,
          ok: true,
          query: args,
          matchKind: 'no_exact_match_found',
          pages: [],
          rawBodies,
          warnings: [
            'ARTG search miss is no_exact_match_found — not unapproved. Absence of a hit is not a permanent fact.',
          ],
        });
      }

      const pages: ConnectorPage[] = products
        .slice(0, Math.min(args.recordCap ?? 10, 20))
        .map((p) => {
          const normalized = {
            type: 'regulated_product',
            authority: 'tga_artg',
            jurisdiction: 'AU',
            scheme: 'artg_id',
            artgId: p.artgId,
            productName: p.productName,
            sponsor: p.sponsor ?? null,
            licenceStatusRaw: p.licenceStatus ?? null,
            licenceStandingNormalized: normalizeLicenceStanding(p.licenceStatus),
            registrationType: p.registrationType ?? null,
            ingredients: p.ingredients ?? null,
            officialUrl: p.officialUrl,
            piUrl: p.piUrl ?? null,
            cmiUrl: p.cmiUrl ?? null,
            approvalInferred: false,
            note: 'ARTG inclusion is product/register scoped and is not longevity evidence.',
          };
          return {
            externalId: p.artgId,
            canonicalUrl: p.officialUrl,
            payload: p,
            normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
          };
        });

      const matchKind =
        isId && pages.length === 1 ? 'exact' : pages.length === 1 ? 'exact' : 'ambiguous';

      return identityResult({
        connectorId: 'artg',
        fetchedAt,
        ok: true,
        query: args,
        matchKind,
        pages,
        rawBodies,
        warnings:
          matchKind === 'ambiguous'
            ? ['Ambiguous ARTG results require review before product mapping.']
            : undefined,
      });
    } catch (err) {
      return identityResult({
        connectorId: 'artg',
        fetchedAt,
        ok: false,
        query: args,
        matchKind: 'source_unavailable',
        pages: [],
        rawBodies: [],
        errorMessage: err instanceof Error ? err.message : 'ARTG lookup failed',
      });
    }
  }

  return {
    id: 'artg',
    name: 'TGA ARTG',
    enabled,
    lookup,
    async fetchWindow({ cursor, recordCap }): Promise<ConnectorFetchResult> {
      const query = String(cursor.query ?? cursor.artgId ?? '');
      const mode =
        (cursor.mode as IdentityLookupQuery['mode']) ?? (cursor.artgId ? 'artg_id' : 'exact_name');
      const result = await lookup({ query, mode, recordCap });
      return {
        connectorId: 'artg',
        fetchedAt: result.fetchedAt,
        ok: result.ok,
        pages: result.pages,
        rawBodies: result.rawBodies,
        errorMessage: result.errorMessage,
        warnings: result.warnings,
        nextCursor: { query, mode },
      };
    },
  };
}

export { parseArtgSearchHtml, normalizeLicenceStanding };
