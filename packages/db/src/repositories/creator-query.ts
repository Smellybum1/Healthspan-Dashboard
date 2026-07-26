import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import {
  creatorClaimEvidenceLinks,
  creatorClaims,
  creatorContentItems,
  creatorDisclosures,
  creatorDocuments,
  creatorEntities,
  creatorPlatformAccounts,
  creatorRoles,
  platformContentCurrent,
  claimRecurrenceSnapshots,
} from '../creator-schema.js';

/**
 * Query semantics shared by the local SQLite and Sites D1 creator adapters.
 *
 * Three shapes here replace in-memory filtering that the retired implementation did after
 * loading whole tables:
 *
 * - Active-creator and name search became column predicates instead of `.all().filter()`.
 * - Active-claim and creator scoping became predicates instead of a post-filter, so the
 *   `limit` applies to the rows that actually match.
 * - The video list is a left join onto `platform_content_current`. The retired code
 *   re-selected that entire table once per video — up to forty full scans per creator
 *   detail request — and searched it in memory.
 *
 * `creator-parity.test.ts` runs the retired implementations against these and asserts
 * identical output.
 */

export const creatorActive = eq(creatorEntities.lifecycleState, 'active');

export function creatorSearchWhere(q: string | undefined): SQL | undefined {
  const predicates: SQL[] = [creatorActive];
  if (q?.trim()) {
    predicates.push(sql`lower(${creatorEntities.preferredName}) like ${`%${q.toLowerCase()}%`}`);
  }
  return and(...predicates);
}

export const creatorSummarySelection = {
  id: creatorEntities.id,
  preferredName: creatorEntities.preferredName,
  creatorKind: creatorEntities.creatorKind,
  identityConfidence: creatorEntities.identityConfidence,
  neutralDescription: creatorEntities.neutralDescription,
};

export function creatorClaimsWhere(creatorId: string | undefined): SQL | undefined {
  const predicates: SQL[] = [eq(creatorClaims.active, true)];
  if (creatorId) predicates.push(eq(creatorClaims.creatorId, creatorId));
  return and(...predicates);
}

export const creatorClaimOrder = desc(creatorClaims.createdAt);

/**
 * Videos joined to their current platform metadata.
 *
 * A **left** join, because the retired in-memory `.find()` returning `undefined` still
 * produced a video entry with null metadata. An inner join would silently drop those.
 */
export const creatorVideoSelection = {
  id: creatorContentItems.id,
  externalId: creatorContentItems.externalId,
  title: creatorContentItems.title,
  publishedAt: creatorContentItems.publishedAt,
  canonicalUrl: creatorContentItems.canonicalUrl,
  currentThumbnailUrl: platformContentCurrent.thumbnailUrl,
  currentCaptionAvailable: platformContentCurrent.captionAvailable,
  currentPaidPlacementDeclared: platformContentCurrent.paidPlacementDeclared,
  currentDisplayEligible: platformContentCurrent.displayEligible,
  currentExpiryAt: platformContentCurrent.expiryAt,
};

export function creatorVideoWhere(creatorId: string): SQL | undefined {
  return and(
    eq(creatorContentItems.creatorId, creatorId),
    eq(creatorContentItems.platform, 'youtube'),
    eq(creatorContentItems.currentState, 'current'),
  );
}

export const creatorVideoOrder = desc(creatorContentItems.publishedAt);

export const documentNotDeleted = sql`${creatorDocuments.lifecycleState} != 'deleted'`;

export const recurrenceSnapshotOrder = desc(claimRecurrenceSnapshots.createdAt);

export {
  claimRecurrenceSnapshots,
  creatorClaimEvidenceLinks,
  creatorClaims,
  creatorContentItems,
  creatorDisclosures,
  creatorDocuments,
  creatorEntities,
  creatorPlatformAccounts,
  creatorRoles,
  platformContentCurrent,
};
