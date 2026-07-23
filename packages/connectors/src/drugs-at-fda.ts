import { createHash } from 'node:crypto';
import { identityResult, type IdentityConnector, type IdentityLookupQuery } from './identity-types.js';
import type { ConnectorFetchResult, ConnectorPage, FetchTransport, SourceConnector } from './types.js';

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export type DrugsAtFdaProduct = {
  applicationNumber: string;
  productNumber?: string;
  brandName: string;
  activeIngredient: string;
  form?: string;
  strength?: string;
  marketingStatus?: string;
  teCode?: string;
};

/**
 * Drugs@FDA connector — fixture/bulk-extract oriented for M4.
 * Pass pre-parsed product rows (from ZIP extract) via `products` option;
 * live ZIP download can be layered later without changing normalized shape.
 */
export function createDrugsAtFdaConnector(
  opts: {
    transport?: FetchTransport;
    products?: DrugsAtFdaProduct[];
    enabled?: boolean;
  } = {},
): IdentityConnector & SourceConnector {
  const enabled = opts.enabled ?? true;
  const catalog = opts.products ?? [];

  async function lookup(args: IdentityLookupQuery) {
    const fetchedAt = new Date().toISOString();
    if (!enabled) {
      return identityResult({
        connectorId: 'drugs-at-fda',
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
        connectorId: 'drugs-at-fda',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: 'identity_unresolved',
        pages: [],
        rawBodies: [],
      });
    }

    if (catalog.length === 0) {
      return identityResult({
        connectorId: 'drugs-at-fda',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: 'not_checked',
        pages: [],
        rawBodies: [],
        warnings: [
          'Drugs@FDA catalog has not been loaded for this run (not_checked). Absence of rows is not a negative finding.',
        ],
      });
    }

    const hits = catalog.filter((p) => {
      if (args.mode === 'application_number') {
        return p.applicationNumber.toLowerCase() === q;
      }
      return (
        p.brandName.toLowerCase().includes(q) ||
        p.activeIngredient.toLowerCase().includes(q) ||
        p.applicationNumber.toLowerCase() === q
      );
    });

    const rawBodies: ConnectorFetchResult['rawBodies'] = [
      {
        bytes: Buffer.from(JSON.stringify({ query: args.query, hits }), 'utf8'),
        mediaType: 'application/json',
        ext: 'json',
      },
    ];

    if (hits.length === 0) {
      return identityResult({
        connectorId: 'drugs-at-fda',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: 'no_exact_match_found',
        pages: [],
        rawBodies,
      });
    }

    const pages: ConnectorPage[] = hits.slice(0, Math.min(args.recordCap ?? 20, 50)).map((p) => {
      const normalized = {
        type: 'regulated_product',
        authority: 'drugs_at_fda',
        jurisdiction: 'US',
        scheme: 'fda_application_number',
        applicationNumber: p.applicationNumber,
        productNumber: p.productNumber ?? null,
        brandName: p.brandName,
        activeIngredient: p.activeIngredient,
        form: p.form ?? null,
        strength: p.strength ?? null,
        marketingStatus: p.marketingStatus ?? null,
        teCode: p.teCode ?? null,
        approvalInferred: false,
        note: 'Drugs@FDA product rows are register facts for the listed application/product — not longevity authorisation.',
      };
      return {
        externalId: `${p.applicationNumber}:${p.productNumber ?? '1'}`,
        payload: p,
        normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
      };
    });

    return identityResult({
      connectorId: 'drugs-at-fda',
      fetchedAt,
      ok: true,
      query: args,
      matchKind: pages.length === 1 ? 'exact' : 'ambiguous',
      pages,
      rawBodies,
    });
  }

  return {
    id: 'drugs-at-fda',
    name: 'Drugs@FDA',
    enabled,
    lookup,
    async fetchWindow({ cursor, recordCap }): Promise<ConnectorFetchResult> {
      const query = String(cursor.query ?? cursor.applicationNumber ?? '');
      const mode =
        (cursor.mode as IdentityLookupQuery['mode']) ??
        (cursor.applicationNumber ? 'application_number' : 'exact_name');
      const result = await lookup({ query, mode, recordCap });
      return {
        connectorId: 'drugs-at-fda',
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
