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

type RxcuiResponse = {
  idGroup?: { rxnormId?: string[] | string; name?: string };
};

type PropertiesResponse = {
  properties?: {
    rxcui?: string;
    name?: string;
    synonym?: string;
    tty?: string;
    language?: string;
    suppress?: string;
    umlscui?: string;
  };
};

function asIdList(value: string[] | string | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * RxNorm identity connector — exact-first name/RxCUI lookup.
 * Approximate hits are review candidates only. Never infers approval.
 */
export function createRxNormConnector(
  opts: { transport?: FetchTransport; minIntervalMs?: number } = {},
): IdentityConnector & SourceConnector {
  const client = createHttpClient({
    transport: opts.transport,
    userAgent: 'HealthspanDashboard/0.2 (rxnorm; local@invalid)',
    minIntervalMs: opts.minIntervalMs ?? 1000,
  });

  async function lookup(args: IdentityLookupQuery) {
    const fetchedAt = new Date().toISOString();
    const recordCap = Math.min(args.recordCap ?? 10, 25);
    const q = args.query.trim();
    if (!q) {
      return identityResult({
        connectorId: 'rxnorm',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: 'identity_unresolved',
        pages: [],
        rawBodies: [],
        warnings: ['Empty RxNorm query'],
      });
    }

    try {
      let rxcuis: string[] = [];
      const rawBodies: ConnectorFetchResult['rawBodies'] = [];

      if (args.mode === 'rxcui' || /^\d+$/.test(q)) {
        rxcuis = [q];
      } else {
        const search = args.mode === 'approximate_name' ? '1' : '2';
        const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(q)}&search=${search}`;
        const res = await client.request(url);
        const json = (await res.json()) as RxcuiResponse;
        rawBodies.push({
          bytes: Buffer.from(JSON.stringify(json), 'utf8'),
          mediaType: 'application/json',
          ext: 'json',
        });
        rxcuis = asIdList(json.idGroup?.rxnormId);
      }

      if (rxcuis.length === 0) {
        return identityResult({
          connectorId: 'rxnorm',
          fetchedAt,
          ok: true,
          query: args,
          matchKind: 'no_exact_match_found',
          pages: [],
          rawBodies,
        });
      }

      const pages: ConnectorPage[] = [];
      for (const rxcui of rxcuis.slice(0, recordCap)) {
        const propUrl = `https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(rxcui)}/properties.json`;
        const propRes = await client.request(propUrl);
        const propJson = (await propRes.json()) as PropertiesResponse;
        rawBodies.push({
          bytes: Buffer.from(JSON.stringify(propJson), 'utf8'),
          mediaType: 'application/json',
          ext: 'json',
        });
        const props = propJson.properties ?? {};
        const normalized = {
          type: 'identity',
          scheme: 'rxcui',
          source: 'rxnorm',
          rxcui: props.rxcui ?? rxcui,
          name: props.name ?? null,
          tty: props.tty ?? null,
          synonym: props.synonym ?? null,
          suppress: props.suppress ?? null,
          approvalInferred: false,
          note: 'RxNorm presence establishes vocabulary identity only, not approval or efficacy.',
        };
        pages.push({
          externalId: String(normalized.rxcui),
          canonicalUrl: `https://rxnav.nlm.nih.gov/REST/rxcui/${normalized.rxcui}/properties`,
          payload: propJson,
          normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
        });
      }

      const matchKind =
        args.mode === 'approximate_name'
          ? 'approximate'
          : pages.length === 1
            ? 'exact'
            : 'ambiguous';

      return identityResult({
        connectorId: 'rxnorm',
        fetchedAt,
        ok: true,
        query: args,
        matchKind,
        pages,
        rawBodies,
        warnings:
          matchKind === 'approximate'
            ? ['Approximate RxNorm matches require human review before mapping.']
            : undefined,
      });
    } catch (err) {
      return identityResult({
        connectorId: 'rxnorm',
        fetchedAt,
        ok: false,
        query: args,
        matchKind: 'source_unavailable',
        pages: [],
        rawBodies: [],
        errorMessage: err instanceof Error ? err.message : 'RxNorm lookup failed',
      });
    }
  }

  return {
    id: 'rxnorm',
    name: 'RxNorm',
    enabled: true,
    lookup,
    async fetchWindow({ cursor, recordCap }): Promise<ConnectorFetchResult> {
      const query = String(cursor.query ?? cursor.name ?? '');
      const mode = (cursor.mode as IdentityLookupQuery['mode']) ?? 'exact_name';
      const result = await lookup({ query, mode, recordCap });
      return {
        connectorId: 'rxnorm',
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
