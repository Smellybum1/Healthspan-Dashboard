/**
 * Regulatory and safety read models.
 *
 * See `./index.ts` for the rules that govern this directory.
 *
 * Every retired read here loaded a whole table and filtered it in memory, and two of them
 * then issued a query per row on the page — ingredients per product, adverse-event terms
 * per snapshot. Both are batched into one statement, the same way claim spans are.
 *
 * Merging stays in the shared service. `listSafetyItems` combines curated safety items
 * with TGA regulatory notices, and `listRegulatoryHistory` combines status history,
 * assertions, and dossier change events. In both cases the merge must happen *before*
 * pagination, so an adapter cannot page and neither runtime may decide the order alone.
 */

export type RegulatoryPageQuery = { limit?: string; offset?: string };

export type RegulatoryPage<T> = {
  items: T[];
  limit: number;
  offset: number;
  total: number;
};

export const REGULATORY_LIMIT_MAX = 200;
export const REGULATORY_LIMIT_DEFAULT = 50;

/** The retired `paginate` helper's bounds, preserved exactly. */
export function normaliseRegulatoryPaging(query: RegulatoryPageQuery): {
  limit: number;
  offset: number;
} {
  const limit = Math.min(
    Math.max(Number(query.limit ?? REGULATORY_LIMIT_DEFAULT) || REGULATORY_LIMIT_DEFAULT, 1),
    REGULATORY_LIMIT_MAX,
  );
  const offset = Math.max(Number(query.offset ?? 0) || 0, 0);
  return { limit, offset };
}

export function paginateRegulatory<T>(rows: T[], query: RegulatoryPageQuery): RegulatoryPage<T> {
  const { limit, offset } = normaliseRegulatoryPaging(query);
  return { items: rows.slice(offset, offset + limit), limit, offset, total: rows.length };
}

export const SPONTANEOUS_CAVEAT =
  'Spontaneous-report counts are not incidence, causality, or ranking. Zero reports ≠ safe.';
export const SIGNAL_CAVEAT = 'AEMS potential signals are not proven causality or incidence.';
export const NOTICE_CAVEAT = 'Notice presence is not a dosing or treatment recommendation.';

/**
 * The caveats the workspace summary always carries.
 *
 * M4 invariants, ADR-0009. They are part of the response rather than the UI so a client
 * cannot present the counts without them.
 */
export const REGULATORY_WORKSPACE_CAVEATS = [
  'Miss ≠ unapproved',
  'Trial ≠ authorization',
  'Label presence ≠ approval',
  'AEMS/report count ≠ causality or incidence',
  'No dosing, vendors, or ranking',
] as const;

export type RegulatoryWorkspaceCounts = {
  productCount: number;
  assertionCount: number;
  signalCount: number;
  labelCount: number;
  reportingPatternCount: number;
  safetyLinkCount: number;
};

export type RegulatedProductRow = Record<string, unknown> & { id: string };
export type ProductIngredientRow = Record<string, unknown> & { productId: string };
export type RegulatoryAssertionRow = Record<string, unknown> & {
  id: string;
  entityId: string | null;
  scopeJson: string;
  createdAt: number;
};
export type RegulatoryStatusHistoryRow = Record<string, unknown> & {
  id: string;
  productId: string | null;
  createdAt: number;
};
export type DossierChangeEventRow = {
  id: string;
  entityId: string;
  fromSnapshotId: string | null;
  toSnapshotId: string;
  changeSummary: string;
  createdAt: number;
};
export type SafetyItemRow = Record<string, unknown> & { id: string; jurisdiction: string };
export type RegulatoryNoticeRow = {
  id: string;
  title: string;
  summary: string | null;
  jurisdiction: string | null;
  authority: string | null;
  category: string | null;
  officialUrl: string | null;
  canonicalUrl: string | null;
  publishedAt: number | null;
  sourcePublishedAt: number | null;
  createdAt: number;
  updatedAt: number;
};
export type SignalRecordRow = Record<string, unknown> & { id: string; entityId: string | null };
export type ReportingSnapshotRow = Record<string, unknown> & {
  id: string;
  entityId: string | null;
  caveat: string | null;
};
export type TermCountRow = Record<string, unknown> & { snapshotId: string };

/** How many TGA notices the safety list folds in, matching the retired cap. */
export const SAFETY_NOTICE_CAP = 100;

export interface RegulatoryReadRepository {
  listProducts(filters: {
    jurisdiction?: string;
    authority?: string;
  }): Promise<RegulatedProductRow[]>;
  /** Ingredients for a whole page of products in one statement, not one per product. */
  listIngredientsForProducts(productIds: string[]): Promise<ProductIngredientRow[]>;
  listAssertions(filters: {
    jurisdiction?: string;
    entityId?: string;
  }): Promise<RegulatoryAssertionRow[]>;
  listStatusHistory(filters: { productId?: string }): Promise<RegulatoryStatusHistoryRow[]>;
  listDossierChangeEvents(filters: { entityId?: string }): Promise<DossierChangeEventRow[]>;
  listSafetyItems(filters: { jurisdiction?: string }): Promise<SafetyItemRow[]>;
  /** Newest first, capped at {@link SAFETY_NOTICE_CAP}. */
  listRegulatoryNotices(cap: number): Promise<RegulatoryNoticeRow[]>;
  listSignals(filters: { entityId?: string }): Promise<SignalRecordRow[]>;
  listReportingSnapshots(filters: { entityId?: string }): Promise<ReportingSnapshotRow[]>;
  /** Term counts for a whole page of snapshots in one statement. */
  listTermsForSnapshots(snapshotIds: string[]): Promise<TermCountRow[]>;
  workspaceCounts(): Promise<RegulatoryWorkspaceCounts>;
}
