import type { ConnectorFetchResult, ConnectorId, ConnectorPage, FetchTransport } from './types.js';

/** Coverage / match vocabulary for identity and regulatory lookups. */
export type IdentityMatchKind =
  | 'exact'
  | 'approximate'
  | 'ambiguous'
  | 'no_exact_match_found'
  | 'not_checked'
  | 'source_unavailable'
  | 'disabled'
  | 'identity_unresolved'
  | 'parser_contract_failure';

export type IdentityLookupQuery = {
  /** Human-reviewed name, ingredient, product name, or identifier value. */
  query: string;
  mode?:
    | 'exact_name'
    | 'approximate_name'
    | 'rxcui'
    | 'cid'
    | 'inchikey'
    | 'unii'
    | 'artg_id'
    | 'ndc'
    | 'application_number';
  /** Soft cap on result pages retained. */
  recordCap?: number;
  transport?: FetchTransport;
};

export type IdentityLookupResult = {
  connectorId: ConnectorId;
  fetchedAt: string;
  ok: boolean;
  query: IdentityLookupQuery;
  matchKind: IdentityMatchKind;
  pages: ConnectorPage[];
  rawBodies: ConnectorFetchResult['rawBodies'];
  warnings?: string[];
  errorMessage?: string;
  /** Presence never means approval, efficacy, purity, or supply. */
  approvalNeverInferred: true;
};

export interface IdentityConnector {
  readonly id: ConnectorId;
  readonly name: string;
  readonly enabled: boolean;
  lookup(args: IdentityLookupQuery): Promise<IdentityLookupResult>;
}

export function identityResult(base: Omit<IdentityLookupResult, 'approvalNeverInferred'>): IdentityLookupResult {
  return { ...base, approvalNeverInferred: true };
}
