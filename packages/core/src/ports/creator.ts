/**
 * Creator read models.
 *
 * See `./index.ts` for the rules that govern this directory.
 *
 * Two properties of the retired implementation shaped this port, both of them cost
 * problems rather than correctness ones:
 *
 * 1. **Every read began by writing.** `bootstrapCreatorCatalog` seeded curated creators,
 *    aliases, and platform policy rows, and it was the first statement of `listCreators`,
 *    `listCreatorClaims`, `getCreatorDetail`, and `creatorWatchItems`. A hosted read may
 *    not write, and hosted data is synthetic-fixture-only, so no port method bootstraps.
 *    The local runtime keeps the behaviour by calling it from its own routes.
 * 2. **Creator detail held a nested N+1.** For each of up to forty videos it re-selected
 *    the whole `platform_content_current` table and searched it in memory — forty full
 *    scans per request. `listYoutubeVideos` returns the join instead.
 *
 * The port is a set of narrow reads; the assembly of the detail document lives in
 * `@healthspan/runtime` so the two adapters cannot produce different shapes.
 */

export type CreatorSummaryDto = {
  id: string;
  preferredName: string;
  creatorKind: string;
  identityConfidence: string;
  neutralDescription: string | null;
};

export type CreatorListResult = {
  items: CreatorSummaryDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type CreatorClaimDto = {
  id: string;
  creatorId: string;
  claimText: string;
  assertionRole: string;
  claimKind: string | null;
  direction: string | null;
  certaintyLanguage: string | null;
  confidence: string;
  reviewStatus: string;
  recurrenceKey: string | null;
  alignment: Record<string, unknown>;
  createdAt: string;
};

/** The claim row an adapter returns before the shared mapper runs. */
export type CreatorClaimRow = {
  id: string;
  creatorId: string;
  claimText: string;
  assertionRole: string;
  claimKind: string | null;
  direction: string | null;
  certaintyLanguage: string | null;
  confidence: string;
  reviewStatus: string | null;
  recurrenceKey: string;
  alignmentJson: string;
  createdAt: number;
};

export type CreatorEntityRow = {
  id: string;
  preferredName: string;
  creatorKind: string;
  identityConfidence: string;
  identityRevision: number;
  currentProfileSnapshotId: string | null;
  neutralDescription: string | null;
  lifecycleState: string;
};

export type CreatorAccountRow = {
  id: string;
  creatorId: string;
  platform: string;
  externalAccountId: string;
  handle: string | null;
  displayName: string | null;
  canonicalUrl: string | null;
  accountState: string | null;
  monitored: boolean | null;
  enabled: boolean | null;
  identityConfidence: string | null;
  lastCheckedAt: number | null;
  platformDataExpiryAt: number | null;
  complianceState: string | null;
  sourcePolicyVersion: string | null;
  createdAt: number;
};

export type CreatorDisclosureRow = {
  id: string;
  disclosureText: string;
  source: string;
  createdAt: number;
};

export type CreatorDocumentRow = {
  id: string;
  filename: string;
  documentKind: string;
  rightsBasis: string;
  claimEligible: boolean;
  lifecycleState: string | null;
  createdAt: number;
};

/**
 * A video joined to its current platform metadata.
 *
 * `current*` fields are nullable because the join is a left one: a content item with no
 * `platform_content_current` row is still listed, exactly as the retired in-memory
 * `.find()` returning `undefined` produced.
 */
export type CreatorVideoRow = {
  id: string;
  externalId: string;
  title: string;
  publishedAt: number | null;
  canonicalUrl: string | null;
  currentThumbnailUrl: string | null;
  currentCaptionAvailable: boolean | null;
  currentPaidPlacementDeclared: boolean | null;
  currentDisplayEligible: boolean | null;
  currentExpiryAt: number | null;
};

export type CreatorRoleRow = {
  id: string;
  role: string;
  provenanceState: string;
  reviewState: string;
  createdAt: number;
};

/** The claim shape the recurrence computation consumes. */
export type RecurrenceInputRow = {
  id: string;
  recurrenceKey: string;
  claimText: string;
  reviewStatus: string;
  active: boolean;
  lifecycleState: string | null;
  sourceKey: string | null;
  firstObservedAt: number;
  sourceUnavailable: boolean;
};

export type RecurrenceSnapshotRow = {
  id: string;
  claimThemeConcept: string;
  distinctMonitoredSourceCount: number;
  reviewedClaimCount: number;
  sourceUnavailableCount: number;
  formulaVersion: string;
  createdAt: number;
};

export interface CreatorReadRepository {
  listCreators(query: {
    page?: number;
    pageSize?: number;
    q?: string;
  }): Promise<{ rows: CreatorSummaryDto[]; total: number }>;
  getCreator(id: string): Promise<CreatorEntityRow | null>;
  listClaims(query: { creatorId?: string; limit?: number }): Promise<CreatorClaimRow[]>;
  listAccounts(creatorId: string): Promise<CreatorAccountRow[]>;
  listDisclosures(creatorId: string): Promise<CreatorDisclosureRow[]>;
  listDocuments(creatorId: string): Promise<CreatorDocumentRow[]>;
  /** Newest first, capped. One query — see the note at the top of this file. */
  listYoutubeVideos(creatorId: string, limit: number): Promise<CreatorVideoRow[]>;
  listRoles(creatorId: string): Promise<CreatorRoleRow[]>;
  listRecurrenceInputs(creatorId?: string): Promise<RecurrenceInputRow[]>;
  listRecurrenceSnapshots(limit: number): Promise<RecurrenceSnapshotRow[]>;
}

export const CREATOR_PAGE_SIZE_MAX = 100;
export const CREATOR_PAGE_SIZE_DEFAULT = 25;
export const CREATOR_CLAIM_LIMIT_MAX = 200;
export const CREATOR_CLAIM_LIMIT_DEFAULT = 50;
/** Creator detail lists at most this many videos, as the retired implementation did. */
export const CREATOR_VIDEO_LIMIT = 40;
/** Creator detail lists at most this many claims, as the retired implementation did. */
export const CREATOR_DETAIL_CLAIM_LIMIT = 100;

export function normaliseCreatorPaging(query: { page?: number; pageSize?: number }): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(
    CREATOR_PAGE_SIZE_MAX,
    Math.max(1, query.pageSize ?? CREATOR_PAGE_SIZE_DEFAULT),
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function normaliseCreatorClaimLimit(limit: number | undefined): number {
  return Math.min(CREATOR_CLAIM_LIMIT_MAX, Math.max(1, limit ?? CREATOR_CLAIM_LIMIT_DEFAULT));
}

export function toCreatorClaimDto(row: CreatorClaimRow): CreatorClaimDto {
  return {
    id: row.id,
    creatorId: row.creatorId,
    claimText: row.claimText,
    assertionRole: row.assertionRole,
    claimKind: row.claimKind,
    direction: row.direction,
    certaintyLanguage: row.certaintyLanguage,
    confidence: row.confidence,
    reviewStatus: row.reviewStatus ?? 'unreviewed',
    recurrenceKey: row.recurrenceKey,
    alignment: JSON.parse(row.alignmentJson) as Record<string, unknown>,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

/**
 * Scores this product must never compute, echoed on every creator detail.
 *
 * ADR-0010: claims are assessed, people are not ranked. The list is returned to the
 * client as an explicit statement of what is absent.
 */
export const PROHIBITED_CREATOR_SCORES = [
  'trust_score',
  'credibility_score',
  'misinformation_rank',
  'influence_score',
  'attention_score',
  'engagement_score',
  'popularity_score',
] as const;
