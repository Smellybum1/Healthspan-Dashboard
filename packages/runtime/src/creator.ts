import {
  CREATOR_DETAIL_CLAIM_LIMIT,
  CREATOR_VIDEO_LIMIT,
  PROHIBITED_CREATOR_SCORES,
  normaliseCreatorClaimLimit,
  normaliseCreatorPaging,
  toClaimEvidenceLinkDto,
  toCreatorClaimDto,
  type CreatorClaimDto,
  type CreatorListResult,
  type CreatorReadRepository,
  type RecurrenceSnapshotRow,
} from '@healthspan/core';
import {
  RECURRENCE_FORMULA_VERSION,
  computeClaimRecurrence,
} from '@healthspan/creators/recurrence';

export type { CreatorClaimDto, CreatorListResult };

/**
 * Creator read models.
 *
 * `@healthspan/creators/recurrence` rather than `@healthspan/creators`: the package root
 * re-exports a `node:crypto` hash helper used by the local-only rebuild path, and the
 * subpath export reaches only the pure computation. The bundle doctor walks it.
 *
 * No function here bootstraps the creator catalog. The retired implementation began
 * every one of these reads by seeding curated creators and platform policy rows — a
 * write on a GET, and one that would put non-synthetic data into hosted storage. The
 * local runtime preserves the behaviour by calling `bootstrapCreatorCatalog` from its own
 * routes before it calls these functions.
 */

export async function listCreators(
  repo: CreatorReadRepository,
  opts: { page?: number; pageSize?: number; q?: string } = {},
): Promise<CreatorListResult> {
  const { page, pageSize } = normaliseCreatorPaging(opts);
  const { rows, total } = await repo.listCreators({ page, pageSize, q: opts.q });
  return {
    items: rows,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listCreatorClaims(
  repo: CreatorReadRepository,
  opts: { creatorId?: string; limit?: number } = {},
): Promise<CreatorClaimDto[]> {
  const rows = await repo.listClaims({
    creatorId: opts.creatorId,
    limit: normaliseCreatorClaimLimit(opts.limit),
  });
  return rows.map(toCreatorClaimDto);
}

export async function creatorWatchItems(repo: CreatorReadRepository, limit = 12) {
  const claims = await listCreatorClaims(repo, { limit });
  return claims.map((c) => ({
    id: c.id,
    type: 'claim',
    title: c.claimText.slice(0, 120),
    summary: `${c.assertionRole} · confidence ${c.confidence}`,
    meta: 'Creator claim (not a person score)',
    dataOrigin: 'live' as const,
    href: `/creator-claims/${c.id}`,
  }));
}

export async function getCreatorRecurrence(repo: CreatorReadRepository, creatorId: string) {
  const inputs = await repo.listRecurrenceInputs(creatorId);
  const groups = computeClaimRecurrence(inputs);
  return {
    formulaVersion: RECURRENCE_FORMULA_VERSION,
    groupCount: groups.length,
    groups,
    note: 'Recurrence is not popularity, influence, attention, engagement, or truth.',
  };
}

export async function listRecurrenceSnapshots(repo: CreatorReadRepository, limit = 50) {
  const rows: RecurrenceSnapshotRow[] = await repo.listRecurrenceSnapshots(limit);
  return rows.map((s) => ({
    id: s.id,
    claimThemeConcept: s.claimThemeConcept,
    distinctMonitoredSourceCount: s.distinctMonitoredSourceCount,
    reviewedClaimCount: s.reviewedClaimCount,
    sourceUnavailableCount: s.sourceUnavailableCount,
    formulaVersion: s.formulaVersion,
    firstObservedScope: 'monitored_sources' as const,
    notPopularity: true,
    createdAt: new Date(s.createdAt).toISOString(),
  }));
}

/**
 * Assemble the creator detail document.
 *
 * The reads run concurrently because none depends on another's result. Under the local
 * adapter that changes nothing — `better-sqlite3` is synchronous and they resolve in
 * order — but on D1 it turns eight sequential round trips into one batch of parallel
 * ones.
 */
export async function getCreatorDetail(repo: CreatorReadRepository, id: string) {
  const creator = await repo.getCreator(id);
  if (!creator) return null;

  const [accounts, claims, disclosures, documents, videos, roles, recurrence] = await Promise.all([
    repo.listAccounts(id),
    listCreatorClaims(repo, { creatorId: id, limit: CREATOR_DETAIL_CLAIM_LIMIT }),
    repo.listDisclosures(id),
    repo.listDocuments(id),
    repo.listYoutubeVideos(id, CREATOR_VIDEO_LIMIT),
    repo.listRoles(id),
    getCreatorRecurrence(repo, id),
  ]);

  const now = Date.now();

  return {
    id: creator.id,
    preferredName: creator.preferredName,
    creatorKind: creator.creatorKind,
    identityConfidence: creator.identityConfidence,
    identityRevision: creator.identityRevision,
    currentProfileSnapshotId: creator.currentProfileSnapshotId,
    neutralDescription: creator.neutralDescription,
    lifecycleState: creator.lifecycleState,
    accounts,
    claims,
    disclosures: disclosures.map((d) => ({
      id: d.id,
      disclosureText: d.disclosureText,
      source: d.source,
      createdAt: new Date(d.createdAt).toISOString(),
    })),
    documents: documents.map((d) => ({
      id: d.id,
      filename: d.filename,
      documentKind: d.documentKind,
      rightsBasis: d.rightsBasis,
      claimEligible: Boolean(d.claimEligible),
      lifecycleState: d.lifecycleState,
      createdAt: new Date(d.createdAt).toISOString(),
    })),
    youtubeVideos: videos.map((item) => {
      const expired = item.currentExpiryAt != null && item.currentExpiryAt < now;
      return {
        id: item.id,
        videoId: item.externalId,
        title: item.title,
        publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString() : null,
        canonicalUrl: item.canonicalUrl,
        thumbnailUrl: item.currentThumbnailUrl ?? null,
        captionAvailable: Boolean(item.currentCaptionAvailable),
        paidPlacementDeclared: Boolean(item.currentPaidPlacementDeclared),
        displayEligible: Boolean(item.currentDisplayEligible) && !expired,
        claimEvidence: false as const,
        metadataOnly: true as const,
        note: 'YouTube API metadata is operational context only — not claim evidence',
      };
    }),
    roles: roles.map((r) => ({
      id: r.id,
      role: r.role,
      provenanceState: r.provenanceState,
      reviewState: r.reviewState,
      createdAt: new Date(r.createdAt).toISOString(),
    })),
    recurrence: recurrence.groups.map((g) => ({
      recurrenceKey: g.recurrenceKey,
      reviewedClaimCount: g.reviewedClaimCount,
      distinctMonitoredSourceCount: g.distinctMonitoredSourceCount,
      formulaVersion: g.formulaVersion,
      firstObservedAt: g.firstObservedAt ? new Date(g.firstObservedAt).toISOString() : null,
      firstObservedScope: g.firstObservedScope,
      notPopularity: true as const,
    })),
    // ADR-0010: stated explicitly so a client can see what this product refuses to compute.
    prohibitedScores: [...PROHIBITED_CREATOR_SCORES],
  };
}

export async function listClaimEvidenceLinks(repo: CreatorReadRepository, claimId: string) {
  const rows = await repo.listClaimEvidenceLinks(claimId);
  return rows.map(toClaimEvidenceLinkDto);
}
