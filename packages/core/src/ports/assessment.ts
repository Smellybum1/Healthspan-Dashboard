/**
 * Claim assessments — the current intelligence analysis for each content item.
 *
 * See `./index.ts` for the rules that govern this directory.
 *
 * The port is shaped around one deliberate constraint: **the adapter returns candidate
 * rows in a single query, not one query per item.** The pre-port local implementation
 * loaded every intelligence state and then issued two more queries per state. On
 * `better-sqlite3` that is slow; on D1 every one of those is a network round trip, so a
 * list of 500 assessments would be 1,001 of them. A port that preserved that shape would
 * be unusable hosted, so the port's job is to make the single-query form the only form
 * an adapter can implement.
 */

export type AssessmentListQuery = {
  page?: number;
  pageSize?: number;
  evidenceMaturity?: string;
  evidenceAvailability?: string;
  studyDesign?: string;
  organism?: string;
  retractionOrCorrection?: string;
  q?: string;
};

/**
 * The filters an adapter pushes into its query.
 *
 * `retractionOrCorrection` is absent by design: it is derived from parsing
 * `methodologicalSignalsJson`, so it cannot be expressed as a column predicate without a
 * schema change. It is applied by the shared service after the rows come back — see
 * `listAssessments` in `@healthspan/runtime`.
 */
export type AssessmentFilters = {
  evidenceMaturity?: string;
  evidenceAvailability?: string;
  studyDesign?: string;
  organism?: string;
  q?: string;
};

/** One joined row: current analysis + its content item + staleness. */
export type AssessmentRow = {
  analysisId: string;
  contentItemId: string;
  title: string;
  contentType: string;
  summary: string | null;
  evidenceMaturity: string;
  evidenceAvailability: string;
  studyDesign: string | null;
  organismLevel: string | null;
  classificationConfidence: string;
  assessmentCompleteness: string;
  resultsPresent: boolean;
  status: string;
  stale: boolean;
  translationGapsJson: string | null;
  methodologicalSignalsJson: string | null;
  whatWouldChangeJson: string | null;
  hallmarksJson: string | null;
  rulesetVersion: string;
  createdAt: number;
};

export type AssessmentDto = {
  analysisId: string;
  contentItemId: string;
  title: string;
  contentType: string;
  evidenceMaturity: string;
  evidenceAvailability: string;
  studyDesign: string | null;
  organismLevel: string | null;
  classificationConfidence: string;
  assessmentCompleteness: string;
  resultsPresent: boolean;
  stale: boolean;
  retractionOrCorrection: boolean;
  translationGaps: unknown[];
  methodologicalSignals: unknown[];
  whatWouldChange: unknown[];
  potentialHallmarks: unknown[];
  rulesetVersion: string;
  createdAt: string;
};

export type AssessmentListResult = {
  items: AssessmentDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AssessmentHistoryEntry = {
  analysisId: string;
  rulesetVersion: string;
  supersededAt: string | null;
  createdAt: string;
  evidenceMaturity: string;
};

export type AssessmentDetail = {
  analysis: {
    id: string;
    contentItemId: string;
    evidenceMaturity: string;
    evidenceAvailability: string;
    studyDesign: string | null;
    organismLevel: string | null;
    classificationConfidence: string;
    assessmentCompleteness: string;
    resultsPresent: boolean;
    translationGaps: unknown[];
    methodologicalSignals: unknown[];
    whatWouldChange: unknown[];
    potentialHallmarks: unknown[];
    rulesetVersion: string;
    createdAt: string;
    supersededAt: string | null;
  };
  item: { id: string; title: string; type: string } | null;
  history: AssessmentHistoryEntry[];
};

export interface ClaimAssessmentRepository {
  /**
   * Every current, non-superseded analysis matching the column-expressible filters,
   * joined to its content item, newest first.
   *
   * One query. See the note at the top of this file for why that is a contract term
   * rather than an implementation preference.
   */
  listCurrent(filters: AssessmentFilters): Promise<AssessmentRow[]>;
  getAnalysis(analysisId: string): Promise<AssessmentDetailRow | null>;
  getItem(contentItemId: string): Promise<{ id: string; title: string; type: string } | null>;
  listAnalysisHistory(contentItemId: string): Promise<AssessmentHistoryEntry[]>;
}

export type AssessmentDetailRow = {
  id: string;
  contentItemId: string;
  evidenceMaturity: string;
  evidenceAvailability: string;
  studyDesign: string | null;
  organismLevel: string | null;
  classificationConfidence: string;
  assessmentCompleteness: string;
  resultsPresent: boolean;
  translationGapsJson: string | null;
  methodologicalSignalsJson: string | null;
  whatWouldChangeJson: string | null;
  hallmarksJson: string | null;
  rulesetVersion: string;
  createdAt: number;
  supersededAt: number | null;
};

export const ASSESSMENT_PAGE_SIZE_MAX = 100;
export const ASSESSMENT_PAGE_SIZE_DEFAULT = 25;

export function normaliseAssessmentPaging(query: AssessmentListQuery): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(
    ASSESSMENT_PAGE_SIZE_MAX,
    Math.max(1, query.pageSize ?? ASSESSMENT_PAGE_SIZE_DEFAULT),
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}

/** Tolerant JSON array parse — a malformed column yields an empty list, never a throw. */
export function safeJsonArray(raw: string | null | undefined): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Whether an analysis carries a retraction or correction.
 *
 * Derived from the methodological signals rather than stored as a column, which is why
 * it cannot be a query predicate. Kept here so both runtimes derive it identically.
 */
export function hasRetractionOrCorrection(signals: unknown[], status: string): boolean {
  return (
    signals.some(
      (s) =>
        typeof s === 'object' &&
        s !== null &&
        'code' in s &&
        String((s as { code?: string }).code) === 'retraction_or_correction',
    ) || status === 'retracted'
  );
}

export function toAssessmentDto(row: AssessmentRow): AssessmentDto {
  const signals = safeJsonArray(row.methodologicalSignalsJson);
  return {
    analysisId: row.analysisId,
    contentItemId: row.contentItemId,
    title: row.title,
    contentType: row.contentType,
    evidenceMaturity: row.evidenceMaturity,
    evidenceAvailability: row.evidenceAvailability,
    studyDesign: row.studyDesign,
    organismLevel: row.organismLevel,
    classificationConfidence: row.classificationConfidence,
    assessmentCompleteness: row.assessmentCompleteness,
    resultsPresent: row.resultsPresent,
    stale: row.stale,
    retractionOrCorrection: hasRetractionOrCorrection(signals, row.status),
    translationGaps: safeJsonArray(row.translationGapsJson),
    methodologicalSignals: signals,
    whatWouldChange: safeJsonArray(row.whatWouldChangeJson),
    potentialHallmarks: safeJsonArray(row.hallmarksJson),
    rulesetVersion: row.rulesetVersion,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

/* ------------------------------------------------------------------------- *
 * Intelligence read models
 *
 * Same port, because these read the same analyses the assessment views do. Three of the
 * four retired implementations were per-item loops:
 *
 * - `listLiveClaims` loaded every claim, filtered in memory, paged, then issued one
 *   query per claim on the page to fetch its spans.
 * - `getLiveClaim` loaded the whole `claim_relationships` table to find one claim's.
 * - `liveRadarPoints` issued two or three queries per intelligence state, up to the
 *   point limit — around 120 statements for a 40-point radar.
 *
 * `intelligenceStatus` loaded two whole tables to count rows in them.
 * ------------------------------------------------------------------------- */

export type IntelligenceCounts = {
  assessedCount: number;
  staleCount: number;
  openReviewTaskCount: number;
};

export type IntelligenceRunRow = {
  id: string;
  trigger: string;
  scope: string;
  status: string;
  rulesetVersion: string;
  requestedCount: number;
  completedCount: number;
  deterministicCount: number;
  aiCount: number;
  reviewTaskCount: number;
  reusedCount: number;
  startedAt: number;
  completedAt: number | null;
  summary: string | null;
};

export type LiveClaimFilters = {
  claimKind?: string;
  assertionRole?: string;
  reviewStatus?: string;
  q?: string;
};

export type LiveClaimRow = {
  id: string;
  analysisId: string;
  contentItemId: string;
  claimKind: string;
  assertionRole: string;
  claimText: string;
  direction: string | null;
  outcomeFamily: string | null;
  extractionMethod: string;
  classificationConfidence: string;
  reviewStatus: string | null;
  active: boolean | null;
  createdAt: number;
};

/**
 * A span row, whole.
 *
 * The two retired readers disagreed about this shape: the claims list projected four
 * fields while the claim detail returned the row as stored. The port returns the full row
 * and `listLiveClaims` narrows it, so one query serves both and neither caller loses a
 * field it used to have.
 */
export type ClaimSpanRow = {
  id: string;
  claimId: string;
  fieldPath: string;
  excerpt: string;
  spanHash: string;
  primarySupport: boolean | null;
  createdAt: number;
};

export type ClaimRelationshipRow = {
  id: string;
  leftClaimId: string;
  rightClaimId: string;
  relationship: string;
  comparabilityJson: string;
  rationale: string;
  rulesetVersion: string;
  createdAt: number;
};

/** One radar row: a current analysis joined to its content item and optional paper. */
export type RadarRow = {
  contentItemId: string;
  title: string;
  itemType: string;
  evidenceMaturity: string;
  researchActivity: number;
  resultsPresent: boolean | null;
  stale: boolean | null;
  isCorrectionOrRetraction: boolean | null;
};

/** Evidence-maturity positions on the radar's x axis. */
export const RADAR_MATURITY_X: Record<string, number> = {
  social_anecdotal: 0.05,
  mechanistic_hypothesis: 0.15,
  in_vitro_ex_vivo: 0.25,
  animal_model: 0.35,
  human_observational: 0.5,
  early_human_interventional: 0.65,
  controlled_clinical_trial: 0.8,
  replicated_controlled_or_synthesis: 0.9,
  regulatory_or_guideline_supported: 0.95,
};

export const INTELLIGENCE_RUN_LIMIT_MAX = 100;
export const INTELLIGENCE_RUN_LIMIT_DEFAULT = 50;

export function normaliseRunLimit(limit: number | undefined): number {
  return Math.min(INTELLIGENCE_RUN_LIMIT_MAX, Math.max(1, limit ?? INTELLIGENCE_RUN_LIMIT_DEFAULT));
}

/**
 * Extends {@link ClaimAssessmentRepository} rather than standing alone: both modules read
 * the same analyses, the porting ledger maps both to one port, and one adapter implements
 * the whole surface. `getItem` is reused here for a claim's content item.
 */
export interface IntelligenceReadRepository extends ClaimAssessmentRepository {
  /** Aggregate counts, as counts — not two whole tables loaded to be measured. */
  intelligenceCounts(): Promise<IntelligenceCounts>;
  listRuns(limit: number): Promise<IntelligenceRunRow[]>;
  getRun(id: string): Promise<IntelligenceRunRow | null>;
  /** Filters pushed into the query; `total` counts the filtered set. */
  listLiveClaims(
    filters: LiveClaimFilters,
    paging: { limit: number; offset: number },
  ): Promise<{ rows: LiveClaimRow[]; total: number }>;
  /** Spans for a whole page of claims in one statement, not one per claim. */
  listSpansForClaims(claimIds: string[]): Promise<ClaimSpanRow[]>;
  getLiveClaim(id: string): Promise<LiveClaimRow | null>;
  listClaimRelationships(claimId: string): Promise<ClaimRelationshipRow[]>;
  /**
   * Radar rows, newest analysis first.
   *
   * The retired loop took whichever rows the driver happened to return first and stopped
   * at the limit, so which points appeared past that limit was unspecified. This imposes
   * a deterministic order instead — see the porting ledger.
   */
  listRadarRows(limit: number): Promise<RadarRow[]>;
}
