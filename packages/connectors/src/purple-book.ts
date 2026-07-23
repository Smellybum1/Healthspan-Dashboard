import { createHash } from 'node:crypto';
import { identityResult, type IdentityConnector, type IdentityLookupQuery } from './identity-types.js';
import type { ConnectorFetchResult, ConnectorPage, FetchTransport, SourceConnector } from './types.js';

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export type PurpleBookRow = {
  blaNumber: string;
  properName: string;
  proprietaryName?: string;
  applicant?: string;
  productCategory?: string;
  referenceProduct?: string;
  biosimilar?: string;
  interchangeable?: string;
  approvalDate?: string;
  marketingStatus?: string;
  sourceReleaseDate?: string;
};

/** Minimal CSV parser for Purple Book full-data style fixtures (header row required). */
export function parsePurpleBookCsv(csv: string): PurpleBookRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const idx = (names: string[]) => headers.findIndex((h) => names.includes(h));
  const blaI = idx(['bla number', 'bla', 'license number', 'licence number']);
  const properI = idx(['proper name', 'proper_name']);
  const propI = idx(['proprietary name', 'proprietary_name', 'trade name']);
  const appI = idx(['applicant', 'applicant name']);
  const catI = idx(['product category', 'category']);
  const refI = idx(['reference product', 'reference_product']);
  const bioI = idx(['biosimilar']);
  const intI = idx(['interchangeable']);
  const dateI = idx(['approval date', 'licensure date']);
  const statusI = idx(['marketing status', 'status']);
  const releaseI = idx(['source release date', 'release date', 'data as of']);

  if (blaI < 0 || properI < 0) {
    throw new Error('Purple Book CSV contract failure: missing BLA/proper name columns');
  }

  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    return {
      blaNumber: cols[blaI] ?? '',
      properName: cols[properI] ?? '',
      proprietaryName: propI >= 0 ? cols[propI] : undefined,
      applicant: appI >= 0 ? cols[appI] : undefined,
      productCategory: catI >= 0 ? cols[catI] : undefined,
      referenceProduct: refI >= 0 ? cols[refI] : undefined,
      biosimilar: bioI >= 0 ? cols[bioI] : undefined,
      interchangeable: intI >= 0 ? cols[intI] : undefined,
      approvalDate: dateI >= 0 ? cols[dateI] : undefined,
      marketingStatus: statusI >= 0 ? cols[statusI] : undefined,
      sourceReleaseDate: releaseI >= 0 ? cols[releaseI] : undefined,
    };
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * FDA Purple Book — licensed biological products authority.
 * Does not infer peptide identity from biologic category or interchangeability unless source-supplied.
 */
export function createPurpleBookConnector(
  opts: {
    transport?: FetchTransport;
    rows?: PurpleBookRow[];
    csvText?: string;
    sourceReleaseDate?: string;
    enabled?: boolean;
  } = {},
): IdentityConnector & SourceConnector {
  const enabled = opts.enabled ?? true;
  let catalog: PurpleBookRow[] = opts.rows ?? [];
  if (opts.csvText) {
    catalog = parsePurpleBookCsv(opts.csvText);
  }

  async function lookup(args: IdentityLookupQuery) {
    const fetchedAt = new Date().toISOString();
    if (!enabled) {
      return identityResult({
        connectorId: 'purple-book',
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
        connectorId: 'purple-book',
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
        connectorId: 'purple-book',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: 'not_checked',
        pages: [],
        rawBodies: [],
        warnings: ['Purple Book catalog not loaded for this run (not_checked).'],
      });
    }

    const hits = catalog.filter((r) => {
      if (args.mode === 'application_number') {
        return r.blaNumber.toLowerCase() === q;
      }
      return (
        r.blaNumber.toLowerCase() === q ||
        r.properName.toLowerCase().includes(q) ||
        (r.proprietaryName ?? '').toLowerCase().includes(q)
      );
    });

    const rawBodies: ConnectorFetchResult['rawBodies'] = [
      {
        bytes: Buffer.from(JSON.stringify({ query: args.query, hits, release: opts.sourceReleaseDate ?? null }), 'utf8'),
        mediaType: 'application/json',
        ext: 'json',
      },
    ];

    if (hits.length === 0) {
      return identityResult({
        connectorId: 'purple-book',
        fetchedAt,
        ok: true,
        query: args,
        matchKind: 'no_exact_match_found',
        pages: [],
        rawBodies,
      });
    }

    const pages: ConnectorPage[] = hits.slice(0, Math.min(args.recordCap ?? 20, 50)).map((r) => {
      const interchangeableExplicit =
        typeof r.interchangeable === 'string' && /^(y|yes|true|interchangeable)$/i.test(r.interchangeable.trim());
      const normalized = {
        type: 'regulated_product',
        authority: 'fda_purple_book',
        jurisdiction: 'US',
        scheme: 'bla_number',
        blaNumber: r.blaNumber,
        properName: r.properName,
        proprietaryName: r.proprietaryName ?? null,
        applicant: r.applicant ?? null,
        productCategory: r.productCategory ?? null,
        referenceProduct: r.referenceProduct ?? null,
        biosimilarSourceWording: r.biosimilar ?? null,
        interchangeableExplicit,
        interchangeableInferred: false,
        approvalDate: r.approvalDate ?? null,
        marketingStatus: r.marketingStatus ?? null,
        sourceReleaseDate: r.sourceReleaseDate ?? opts.sourceReleaseDate ?? null,
        peptideIdentityInferred: false,
        approvalInferred: false,
        productName: r.proprietaryName || r.properName,
        note: 'Purple Book is FDA-licensed biologic register authority. Biologic ≠ verified peptide sequence. Interchangeability is never inferred.',
      };
      return {
        externalId: r.blaNumber,
        payload: r,
        normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
      };
    });

    return identityResult({
      connectorId: 'purple-book',
      fetchedAt,
      ok: true,
      query: args,
      matchKind: pages.length === 1 ? 'exact' : 'ambiguous',
      pages,
      rawBodies,
    });
  }

  return {
    id: 'purple-book',
    name: 'FDA Purple Book',
    enabled,
    lookup,
    async fetchWindow({ cursor, recordCap }): Promise<ConnectorFetchResult> {
      const query = String(cursor.query ?? cursor.blaNumber ?? '');
      const mode =
        (cursor.mode as IdentityLookupQuery['mode']) ??
        (cursor.blaNumber ? 'application_number' : 'exact_name');
      const result = await lookup({ query, mode, recordCap });
      return {
        connectorId: 'purple-book',
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
