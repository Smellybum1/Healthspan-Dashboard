import { createHash } from 'node:crypto';
import { createHttpClient } from './http.js';
import { identityResult, type IdentityConnector, type IdentityLookupQuery } from './identity-types.js';
import type { ConnectorFetchResult, ConnectorPage, FetchTransport, SourceConnector } from './types.js';

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

type CidResponse = { IdentifierList?: { CID?: number[] } };
type PropertyResponse = {
  PropertyTable?: {
    Properties?: Array<{
      CID?: number;
      Title?: string;
      MolecularFormula?: string;
      MolecularWeight?: string | number;
      InChIKey?: string;
    }>;
  };
};

/**
 * PubChem chemical identity enrichment — exact CID/InChIKey trusted;
 * name-only matches need compatibility/review. Never approval evidence.
 */
export function createPubChemConnector(
  opts: { transport?: FetchTransport; minIntervalMs?: number } = {},
): IdentityConnector & SourceConnector {
  const client = createHttpClient({
    transport: opts.transport,
    userAgent: 'HealthspanDashboard/0.2 (pubchem; local@invalid)',
    minIntervalMs: opts.minIntervalMs ?? 1000,
  });

  async function lookup(args: IdentityLookupQuery) {
    const fetchedAt = new Date().toISOString();
    const q = args.query.trim();
    if (!q) {
      return identityResult({
        connectorId: 'pubchem',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: 'identity_unresolved',
        pages: [],
        rawBodies: [],
      });
    }

    try {
      const rawBodies: ConnectorFetchResult['rawBodies'] = [];
      let cids: number[] = [];

      if (args.mode === 'cid' || /^\d+$/.test(q)) {
        cids = [Number(q)];
      } else if (args.mode === 'inchikey') {
        const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/inchikey/${encodeURIComponent(q)}/cids/JSON`;
        const res = await client.request(url);
        const json = (await res.json()) as CidResponse;
        rawBodies.push({
          bytes: Buffer.from(JSON.stringify(json), 'utf8'),
          mediaType: 'application/json',
          ext: 'json',
        });
        cids = json.IdentifierList?.CID ?? [];
      } else {
        const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(q)}/cids/JSON`;
        const res = await client.request(url);
        const json = (await res.json()) as CidResponse;
        rawBodies.push({
          bytes: Buffer.from(JSON.stringify(json), 'utf8'),
          mediaType: 'application/json',
          ext: 'json',
        });
        cids = json.IdentifierList?.CID ?? [];
      }

      if (cids.length === 0) {
        return identityResult({
          connectorId: 'pubchem',
          fetchedAt,
          ok: true,
          query: args,
          matchKind: 'no_exact_match_found',
          pages: [],
          rawBodies,
        });
      }

      const pages: ConnectorPage[] = [];
      for (const cid of cids.slice(0, Math.min(args.recordCap ?? 5, 10))) {
        const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/Title,MolecularFormula,MolecularWeight,InChIKey/JSON`;
        const propRes = await client.request(propUrl);
        const propJson = (await propRes.json()) as PropertyResponse;
        rawBodies.push({
          bytes: Buffer.from(JSON.stringify(propJson), 'utf8'),
          mediaType: 'application/json',
          ext: 'json',
        });
        const props = propJson.PropertyTable?.Properties?.[0] ?? {};
        const normalized = {
          type: 'identity',
          scheme: 'pubchem_cid',
          source: 'pubchem',
          cid: props.CID ?? cid,
          title: props.Title ?? null,
          molecularFormula: props.MolecularFormula ?? null,
          molecularWeight: props.MolecularWeight != null ? String(props.MolecularWeight) : null,
          inchikey: props.InChIKey ?? null,
          approvalInferred: false,
          note: 'PubChem presence is chemical identity only — not approval or efficacy.',
        };
        pages.push({
          externalId: String(normalized.cid),
          canonicalUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${normalized.cid}`,
          payload: propJson,
          normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
        });
      }

      const trustedExact = args.mode === 'cid' || args.mode === 'inchikey';
      const matchKind = trustedExact
        ? pages.length === 1
          ? 'exact'
          : 'ambiguous'
        : pages.length === 1
          ? 'exact'
          : pages.length > 1
            ? 'ambiguous'
            : 'no_exact_match_found';

      return identityResult({
        connectorId: 'pubchem',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: trustedExact ? matchKind : matchKind === 'exact' ? 'exact' : matchKind,
        pages,
        rawBodies,
        warnings: !trustedExact
          ? ['Name-only PubChem matches require type compatibility review before auto-mapping.']
          : undefined,
      });
    } catch (err) {
      return identityResult({
        connectorId: 'pubchem',
        fetchedAt,
        ok: false,
        query: args,
        matchKind: 'source_unavailable',
        pages: [],
        rawBodies: [],
        errorMessage: err instanceof Error ? err.message : 'PubChem lookup failed',
      });
    }
  }

  return {
    id: 'pubchem',
    name: 'PubChem',
    enabled: true,
    lookup,
    async fetchWindow({ cursor, recordCap }): Promise<ConnectorFetchResult> {
      const query = String(cursor.query ?? cursor.name ?? '');
      const mode = (cursor.mode as IdentityLookupQuery['mode']) ?? 'exact_name';
      const result = await lookup({ query, mode, recordCap });
      return {
        connectorId: 'pubchem',
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
