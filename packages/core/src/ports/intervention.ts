/**
 * Intervention and trial read models.
 *
 * See `./index.ts` for the rules that govern this directory.
 *
 * Scope note: the **dossier** reads are deliberately absent. `getDossier` calls
 * `buildDossierSnapshot`, which inserts snapshot rows, rewrites
 * `intervention_dossier_state`, updates the entity, and appends a change event — a write
 * executed on `GET /api/dossiers/:id`. That cannot become a hosted read without deciding
 * whether the hosted runtime rebuilds or serves the stored snapshot, which is a product
 * decision rather than a porting one. See the porting ledger.
 */

export type InterventionSummaryDto = {
  id: string;
  preferredName: string;
  entityType: string;
  identityConfidence: string;
  shortDescription: string | null;
  currentDossierSnapshotId: string | null;
};

export type InterventionListResult = {
  items: InterventionSummaryDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type EntityResolutionTaskRow = {
  id: string;
  mentionId: string | null;
  proposedEntityId: string | null;
  title: string;
  reason: string;
  priority: string;
  status: string;
  stale: boolean | null;
  createdAt: number;
};

/**
 * A trial link joined to its trial.
 *
 * Joined, because the retired implementation issued one trial query per link. The trial
 * fields are nullable: the link may point at a trial row that does not exist, and the
 * retired lookup returning `undefined` still produced an entry with nulls.
 */
export type TrialPortfolioRow = {
  trialId: string;
  sourceTerm: string;
  mappingState: string;
  nctId: string | null;
  overallStatus: string | null;
};

export type TrialPortfolioItem = {
  trialId: string;
  nctId: string | null;
  overallStatus: string | null;
  sourceTerm: string;
  mappingState: string;
  note: string;
};

export type TrialPortfolio = {
  count: number;
  items: TrialPortfolioItem[];
  caveat: string;
};

/**
 * Registry presence is not authorisation, and the API says so on every response.
 *
 * M4 product invariant: a trial being registered says nothing about approval or efficacy,
 * and the caveat travels with the data rather than living in the UI.
 */
export const TRIAL_LINK_NOTE = 'ClinicalTrials.gov registration is not regulatory authorisation.';
export const TRIAL_PORTFOLIO_CAVEAT =
  'Trial portfolio links preserve source intervention terms. Registry presence ≠ approval or efficacy.';

export function toTrialPortfolio(rows: TrialPortfolioRow[]): TrialPortfolio {
  return {
    count: rows.length,
    items: rows.map((r) => ({
      trialId: r.trialId,
      nctId: r.nctId,
      overallStatus: r.overallStatus,
      sourceTerm: r.sourceTerm,
      mappingState: r.mappingState,
      note: TRIAL_LINK_NOTE,
    })),
    caveat: TRIAL_PORTFOLIO_CAVEAT,
  };
}

export const INTERVENTION_PAGE_SIZE_MAX = 100;
export const INTERVENTION_PAGE_SIZE_DEFAULT = 25;

export function normaliseInterventionPaging(query: { page?: number; pageSize?: number }): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(
    INTERVENTION_PAGE_SIZE_MAX,
    Math.max(1, query.pageSize ?? INTERVENTION_PAGE_SIZE_DEFAULT),
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}

/**
 * The entity-type filter's three modes.
 *
 * `peptide` and `intervention` are not two values of one column — `intervention` means
 * *not* a peptide. Encoding that here keeps both adapters from inventing their own
 * reading of it.
 */
export type InterventionTypeFilter =
  | { kind: 'none' }
  | { kind: 'peptide' }
  | { kind: 'not-peptide' }
  | { kind: 'exact'; entityType: string };

export function parseInterventionTypeFilter(
  entityType: string | undefined,
): InterventionTypeFilter {
  if (!entityType || entityType === 'all') return { kind: 'none' };
  if (entityType === 'peptide') return { kind: 'peptide' };
  if (entityType === 'intervention') return { kind: 'not-peptide' };
  return { kind: 'exact', entityType };
}

export interface InterventionReadRepository {
  listEntities(query: {
    typeFilter: InterventionTypeFilter;
    q?: string;
    limit: number;
    offset: number;
  }): Promise<{ rows: InterventionSummaryDto[]; total: number }>;
  listEntityResolutionTasks(limit: number): Promise<EntityResolutionTaskRow[]>;
  /** One query, not one per link — see {@link TrialPortfolioRow}. */
  listTrialPortfolio(entityId: string): Promise<TrialPortfolioRow[]>;

  /* Comparison reads — all batched by id, never one query per entity. */
  listEntitiesByIds(ids: string[]): Promise<ComparisonEntityRow[]>;
  listPeptideProfiles(entityIds: string[]): Promise<PeptideProfileRow[]>;
  listIdentifiersForEntities(entityIds: string[]): Promise<EntityIdRow[]>;
  /** Current assertions only, as the retired in-memory filter did. */
  listCurrentAssertionsForEntities(entityIds: string[]): Promise<EntityIdRow[]>;
  listDossierSnapshots(snapshotIds: string[]): Promise<DossierSnapshotRow[]>;
}

/* ------------------------------------------------------------------------- *
 * Comparison
 *
 * The retired `compareInterventions` issued four queries per entity — entity, peptide
 * profile, identifiers, assertions — plus one per stored dossier snapshot. Bounded at
 * four entities that is up to twenty statements for one comparison. The reads below are
 * batched by id instead, so the count is fixed at five regardless of how many entities
 * are compared.
 *
 * Only the data fetch is here. Which dimensions exist, what makes a dimension comparable,
 * and every rule this product refuses to break live in `@healthspan/runtime`.
 * ------------------------------------------------------------------------- */

export type ComparisonEntityRow = {
  id: string;
  preferredName: string;
  entityType: string;
  identityConfidence: string;
  lifecycleState: string;
  currentDossierSnapshotId: string | null;
};

export type PeptideProfileRow = {
  entityId: string;
  classification: string;
  sequenceState: string;
  warningState: string;
};

export type EntityIdRow = { entityId: string | null };

export type DossierSnapshotRow = {
  id: string;
  summaryJson: string;
  evidenceMapJson: string;
};

export type ComparisonDimension = {
  id: string;
  label: string;
  cells: Array<{
    entityId: string;
    value: string;
    comparable: boolean;
    note?: string;
    detailHref?: string;
  }>;
};

/** 2–4 entities. Fewer is not a comparison; more stops being side-by-side. */
export const COMPARISON_MIN_ENTITIES = 2;
export const COMPARISON_MAX_ENTITIES = 4;

/**
 * The rules a comparison always declares.
 *
 * ADR-0009 and the M4 invariants: side-by-side only, never a ranking. They are part of
 * the response so a client cannot render the table without them.
 */
export const COMPARISON_RULES = {
  noWinner: true,
  noRecommendation: true,
  noRank: true,
  noStacking: true,
  noSpontaneousReportSafetyRanking: true,
} as const;

export const COMPARISON_CAVEAT =
  'Comparison is informational and side-by-side only. Cells link to source-backed dossiers; incomparable dimensions are flagged explicitly.';
