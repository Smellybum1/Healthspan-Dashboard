import { createHash } from 'node:crypto';
import { createHttpClient } from './http.js';
import { identityResult, type IdentityConnector, type IdentityLookupQuery } from './identity-types.js';
import type { ConnectorFetchResult, ConnectorPage, FetchTransport, SourceConnector } from './types.js';

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

type OpenFdaLabelResponse = {
  meta?: { results?: { total?: number } };
  results?: Array<{
    id?: string;
    set_id?: string;
    effective_time?: string;
    openfda?: {
      brand_name?: string[];
      generic_name?: string[];
      application_number?: string[];
      substance_name?: string[];
    };
    indications_and_usage?: string[];
    warnings?: string[];
    contraindications?: string[];
    adverse_reactions?: string[];
  }>;
};

/**
 * openFDA drug labels — optional API key required before regular enrichment.
 * Label presence alone is never treated as approval.
 * Dosage-and-administration sections are intentionally not ingested in M4.
 */
export function createOpenFdaLabelConnector(
  opts: {
    transport?: FetchTransport;
    apiKey?: string | null;
    minIntervalMs?: number;
    enableWithoutKey?: boolean;
  } = {},
): IdentityConnector & SourceConnector {
  const apiKey = opts.apiKey ?? process.env.OPENFDA_API_KEY ?? null;
  const enabled = Boolean(apiKey) || opts.enableWithoutKey === true;
  const client = createHttpClient({
    transport: opts.transport,
    userAgent: 'HealthspanDashboard/0.2 (openfda; local@invalid)',
    minIntervalMs: opts.minIntervalMs ?? 1000,
  });

  async function lookup(args: IdentityLookupQuery) {
    const fetchedAt = new Date().toISOString();
    if (!enabled) {
      return identityResult({
        connectorId: 'openfda',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: 'disabled',
        pages: [],
        rawBodies: [],
        warnings: [
          'openFDA label enrichment is disabled until OPENFDA_API_KEY is configured. This is a healthy visible state, not a failure.',
        ],
      });
    }

    const q = args.query.trim();
    if (!q) {
      return identityResult({
        connectorId: 'openfda',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: 'identity_unresolved',
        pages: [],
        rawBodies: [],
      });
    }

    try {
      const field =
        args.mode === 'ndc'
          ? 'openfda.package_ndc'
          : args.mode === 'application_number'
            ? 'openfda.application_number'
            : 'openfda.generic_name';
      const search = `${field}:"${q.replace(/"/g, '')}"`;
      const params = new URLSearchParams({
        search,
        limit: String(Math.min(args.recordCap ?? 5, 10)),
      });
      if (apiKey) params.set('api_key', apiKey);
      const url = `https://api.fda.gov/drug/label.json?${params}`;
      const res = await client.request(url);
      const json = (await res.json()) as OpenFdaLabelResponse;
      const rawBodies: ConnectorFetchResult['rawBodies'] = [
        { bytes: Buffer.from(JSON.stringify(json), 'utf8'), mediaType: 'application/json', ext: 'json' },
      ];
      const results = json.results ?? [];
      if (results.length === 0) {
        return identityResult({
          connectorId: 'openfda',
          fetchedAt,
          ok: true,
          query: args,
          matchKind: 'no_exact_match_found',
          pages: [],
          rawBodies,
        });
      }

      const pages: ConnectorPage[] = results.map((row) => {
        const normalized = {
          type: 'label_excerpt',
          authority: 'fda_openfda',
          jurisdiction: 'US',
          scheme: 'spl_set_id',
          setId: row.set_id ?? null,
          labelId: row.id ?? null,
          effectiveTime: row.effective_time ?? null,
          brandNames: row.openfda?.brand_name ?? [],
          genericNames: row.openfda?.generic_name ?? [],
          applicationNumbers: row.openfda?.application_number ?? [],
          substanceNames: row.openfda?.substance_name ?? [],
          indicationsAndUsage: row.indications_and_usage ?? [],
          warnings: row.warnings ?? [],
          contraindications: row.contraindications ?? [],
          adverseReactions: row.adverse_reactions ?? [],
          dosageAndAdministrationIngested: false,
          approvalInferred: false,
          note: 'openFDA label text is a source statement, not prescribing advice. Label presence is not approval by itself.',
        };
        return {
          externalId: row.set_id ?? row.id ?? 'unknown',
          payload: {
            // Omit dosage fields even if present in raw — M4 policy.
            id: row.id,
            set_id: row.set_id,
            effective_time: row.effective_time,
            openfda: row.openfda,
            indications_and_usage: row.indications_and_usage,
            warnings: row.warnings,
            contraindications: row.contraindications,
            adverse_reactions: row.adverse_reactions,
          },
          normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
        };
      });

      return identityResult({
        connectorId: 'openfda',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: pages.length === 1 ? 'exact' : 'ambiguous',
        pages,
        rawBodies,
      });
    } catch (err) {
      return identityResult({
        connectorId: 'openfda',
        fetchedAt,
        ok: false,
        query: args,
        matchKind: 'source_unavailable',
        pages: [],
        rawBodies: [],
        errorMessage: err instanceof Error ? err.message : 'openFDA lookup failed',
      });
    }
  }

  return {
    id: 'openfda',
    name: 'openFDA Labels',
    enabled,
    lookup,
    async fetchWindow({ cursor, recordCap }): Promise<ConnectorFetchResult> {
      const query = String(cursor.query ?? '');
      const mode = (cursor.mode as IdentityLookupQuery['mode']) ?? 'exact_name';
      const result = await lookup({ query, mode, recordCap });
      return {
        connectorId: 'openfda',
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
