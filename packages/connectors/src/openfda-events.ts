import { createHash } from 'node:crypto';
import { createHttpClient } from './http.js';
import { identityResult, type IdentityConnector, type IdentityLookupQuery } from './identity-types.js';
import type { ConnectorFetchResult, ConnectorPage, FetchTransport, SourceConnector } from './types.js';

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

const MANDATORY_CAVEAT =
  'Spontaneous report aggregates are not incidence, relative risk, or proof of causality. Zero reports is not “safe”. Alias totals are not combined as deduplicated totals.';

type EventResponse = {
  meta?: { results?: { total?: number } };
  results?: Array<{ term?: string; count?: number }>;
};

/**
 * openFDA drug/event aggregates — key-gated, aggregate counts only.
 * Never stores patient-level narratives.
 */
export function createOpenFdaEventAggregateConnector(
  opts: {
    transport?: FetchTransport;
    apiKey?: string | null;
    minIntervalMs?: number;
    enableWithoutKey?: boolean;
  } = {},
): IdentityConnector & SourceConnector {
  const apiKey = opts.apiKey ?? process.env.OPENFDA_API_KEY ?? null;
  const enabled =
    (process.env.HEALTHSPAN_OPENFDA_ENABLED === 'true' && Boolean(apiKey)) || opts.enableWithoutKey === true;

  const client = createHttpClient({
    transport: opts.transport,
    userAgent: 'HealthspanDashboard/0.2 (openfda-events; local@invalid)',
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
          'openFDA event aggregates disabled until HEALTHSPAN_OPENFDA_ENABLED=true and OPENFDA_API_KEY are configured (healthy state).',
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
        args.mode === 'application_number'
          ? 'patient.drug.openfda.application_number'
          : 'patient.drug.openfda.generic_name';
      const search = `${field}:"${q.replace(/"/g, '')}"`;
      const params = new URLSearchParams({
        search,
        count: 'patient.reaction.reactionmeddrapt.exact',
        limit: String(Math.min(args.recordCap ?? 20, 50)),
      });
      if (apiKey) params.set('api_key', apiKey);
      const url = `https://api.fda.gov/drug/event.json?${params}`;
      const res = await client.request(url);
      const json = (await res.json()) as EventResponse;
      const rawBodies: ConnectorFetchResult['rawBodies'] = [
        { bytes: Buffer.from(JSON.stringify(json), 'utf8'), mediaType: 'application/json', ext: 'json' },
      ];

      const terms = (json.results ?? [])
        .filter((r) => typeof r.term === 'string' && typeof r.count === 'number')
        .map((r) => ({ term: r.term!, count: r.count! }));

      const total = terms.reduce((n, t) => n + t.count, 0);
      const normalized = {
        type: 'adverse_event_aggregate',
        authority: 'fda_openfda_events',
        jurisdiction: 'US',
        query: q,
        termCounts: terms,
        totalCount: total,
        patientLevelStored: false,
        narrativesStored: false,
        aliasTotalsCombined: false,
        zeroIsNotSafe: true,
        incidenceInferred: false,
        causalityInferred: false,
        comparativeSafetyInferred: false,
        caveat: MANDATORY_CAVEAT,
        approvalInferred: false,
      };

      const pages: ConnectorPage[] =
        terms.length === 0
          ? []
          : [
              {
                externalId: `openfda-event:${q}`.slice(0, 180),
                payload: { meta: json.meta, results: terms },
                normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
              },
            ];

      return identityResult({
        connectorId: 'openfda',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: pages.length === 0 ? 'no_exact_match_found' : 'exact',
        pages,
        rawBodies,
        warnings: [MANDATORY_CAVEAT],
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
        errorMessage: err instanceof Error ? err.message : 'openFDA event lookup failed',
      });
    }
  }

  return {
    id: 'openfda',
    name: 'openFDA Event Aggregates',
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

export const OPENFDA_EVENT_CAVEAT = MANDATORY_CAVEAT;
