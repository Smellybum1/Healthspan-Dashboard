import { createHash } from 'node:crypto';
import { createHttpClient } from './http.js';
import { identityResult, type IdentityConnector, type IdentityLookupQuery } from './identity-types.js';
import type { ConnectorFetchResult, ConnectorPage, FetchTransport, SourceConnector } from './types.js';

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export type AemsSignal = {
  quarter: string;
  publishedAt?: string | null;
  productOrClass: string;
  signalText: string;
  additionalInformation?: string | null;
  officialUrl?: string | null;
};

const REQUIRED_MARKERS = ['potential signal', 'aems', 'faers'];

export function parseAemsHtml(html: string, quarterHint?: string): AemsSignal[] {
  const lower = html.toLowerCase();
  if (!REQUIRED_MARKERS.some((m) => lower.includes(m))) {
    throw new Error('AEMS HTML contract markers missing — parser_contract_failure');
  }

  const quarter =
    quarterHint ??
    html.match(/data-quarter="([^"]+)"/i)?.[1] ??
    html.match(/Quarter[:\s]+([0-9]{4}\s*Q[1-4])/i)?.[1] ??
    'unknown';

  const signals: AemsSignal[] = [];
  const rowRe =
    /data-aems-product="([^"]*)"[^>]*data-aems-signal="([^"]*)"[^>]*(?:data-aems-extra="([^"]*)")?/gi;
  for (const match of html.matchAll(rowRe)) {
    signals.push({
      quarter,
      publishedAt: html.match(/data-published="([^"]*)"/i)?.[1] ?? null,
      productOrClass: match[1]!,
      signalText: match[2]!,
      additionalInformation: match[3] ?? null,
      officialUrl: html.match(/data-official-url="([^"]*)"/i)?.[1] ?? null,
    });
  }

  // Fallback list items
  if (signals.length === 0) {
    for (const m of html.matchAll(/<li[^>]*class="[^"]*aems-signal[^"]*"[^>]*>([\s\S]*?)<\/li>/gi)) {
      const block = m[1]!;
      const product = block.match(/Product\/class:\s*([^<\n]+)/i)?.[1]?.trim();
      const signal = block.match(/Potential signal:\s*([^<\n]+)/i)?.[1]?.trim();
      if (product && signal) {
        signals.push({
          quarter,
          productOrClass: product,
          signalText: signal,
          additionalInformation: block.match(/Additional:\s*([^<\n]+)/i)?.[1]?.trim() ?? null,
        });
      }
    }
  }

  return signals;
}

/**
 * FDA AEMS potential-signal pages — regulator-identified potential signals only.
 * Never displayed as proven causality or incidence.
 */
export function createFdaAemsConnector(
  opts: {
    transport?: FetchTransport;
    minIntervalMs?: number;
    enabled?: boolean;
    indexUrl?: string;
  } = {},
): IdentityConnector & SourceConnector {
  const enabled = opts.enabled ?? true;
  const indexUrl =
    opts.indexUrl ??
    'https://www.fda.gov/drugs/questions-and-answers-fdas-adverse-event-reporting-system-faers/april-june-2024-potential-signals-serious-risksnew-safety-information-identified-fdas-adverse-event';
  const client = createHttpClient({
    transport: opts.transport,
    userAgent: 'HealthspanDashboard/0.2 (fda-aems; local@invalid)',
    minIntervalMs: opts.minIntervalMs ?? 2000,
  });

  async function lookup(args: IdentityLookupQuery) {
    const fetchedAt = new Date().toISOString();
    if (!enabled) {
      return identityResult({
        connectorId: 'fda-aems',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: 'disabled',
        pages: [],
        rawBodies: [],
      });
    }

    const q = args.query.trim().toLowerCase();
    if (!q) {
      return identityResult({
        connectorId: 'fda-aems',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: 'identity_unresolved',
        pages: [],
        rawBodies: [],
        warnings: ['Unresolved identity — AEMS was not queried'],
      });
    }

    try {
      const res = await client.request(indexUrl);
      const html = await res.text();
      const rawBodies: ConnectorFetchResult['rawBodies'] = [
        { bytes: Buffer.from(html, 'utf8'), mediaType: 'text/html', ext: 'html' },
      ];

      let signals: AemsSignal[];
      try {
        signals = parseAemsHtml(html);
      } catch (err) {
        return identityResult({
          connectorId: 'fda-aems',
          fetchedAt,
          ok: false,
          query: args,
          matchKind: 'parser_contract_failure',
          pages: [],
          rawBodies,
          errorMessage: err instanceof Error ? err.message : 'AEMS parse failed',
        });
      }

      const hits = signals.filter(
        (s) =>
          s.productOrClass.toLowerCase().includes(q) || s.signalText.toLowerCase().includes(q),
      );

      if (hits.length === 0) {
        return identityResult({
          connectorId: 'fda-aems',
          fetchedAt,
          ok: true,
          query: args,
          matchKind: 'no_exact_match_found',
          pages: [],
          rawBodies,
        });
      }

      const pages: ConnectorPage[] = hits.slice(0, Math.min(args.recordCap ?? 20, 50)).map((s, i) => {
        const normalized = {
          type: 'potential_signal',
          authority: 'fda_aems',
          jurisdiction: 'US',
          scheme: 'aems_signal',
          quarter: s.quarter,
          publishedAt: s.publishedAt ?? null,
          productOrClass: s.productOrClass,
          signalText: s.signalText,
          additionalInformation: s.additionalInformation ?? null,
          officialUrl: s.officialUrl ?? null,
          provenCausality: false,
          incidenceEstablished: false,
          approvalInferred: false,
          note: 'FDA AEMS potential signals are regulator-identified potential signals / new safety information — not proven causality and not incidence rates.',
        };
        return {
          externalId: `${s.quarter}:${i}:${s.productOrClass}`.slice(0, 180),
          canonicalUrl: s.officialUrl ?? undefined,
          payload: s,
          normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
        };
      });

      return identityResult({
        connectorId: 'fda-aems',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: pages.length === 1 ? 'exact' : 'ambiguous',
        pages,
        rawBodies,
        warnings: ['AEMS potential signals must never be labelled as causal proof in UI.'],
      });
    } catch (err) {
      return identityResult({
        connectorId: 'fda-aems',
        fetchedAt,
        ok: false,
        query: args,
        matchKind: 'source_unavailable',
        pages: [],
        rawBodies: [],
        errorMessage: err instanceof Error ? err.message : 'AEMS lookup failed',
      });
    }
  }

  return {
    id: 'fda-aems',
    name: 'FDA AEMS Potential Signals',
    enabled,
    lookup,
    async fetchWindow({ cursor, recordCap }): Promise<ConnectorFetchResult> {
      const query = String(cursor.query ?? '');
      const result = await lookup({ query, recordCap });
      return {
        connectorId: 'fda-aems',
        fetchedAt: result.fetchedAt,
        ok: result.ok,
        pages: result.pages,
        rawBodies: result.rawBodies,
        errorMessage: result.errorMessage,
        warnings: result.warnings,
        nextCursor: { query },
      };
    },
  };
}
