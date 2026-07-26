import { and, eq, sql } from 'drizzle-orm';
import {
  normaliseCreatorPaging,
  type CreatorReadRepository,
  type CreatorVideoRow,
} from '@healthspan/core';
import type { HealthspanDb } from '../client.js';
import {
  claimRecurrenceSnapshots,
  creatorClaimOrder,
  creatorClaims,
  creatorClaimsWhere,
  creatorClaimEvidenceLinks,
  creatorContentItems,
  creatorDisclosures,
  creatorDocuments,
  creatorEntities,
  creatorPlatformAccounts,
  creatorRoles,
  creatorSearchWhere,
  creatorSummarySelection,
  creatorVideoOrder,
  creatorVideoSelection,
  creatorVideoWhere,
  documentNotDeleted,
  platformContentCurrent,
  recurrenceSnapshotOrder,
} from './creator-query.js';

/**
 * Local SQLite implementation of {@link CreatorReadRepository}.
 *
 * Predicates, ordering, and the video join come from `./creator-query.js`, shared with
 * the D1 adapter; only execution differs.
 *
 * Nothing here bootstraps the creator catalog. The retired implementation began every
 * read with a seeding write; the local routes now do that before calling the service, so
 * local behaviour is unchanged and no hosted read can write.
 */
export function createLocalCreatorReadRepository(db: HealthspanDb): CreatorReadRepository {
  return {
    listCreators(query) {
      const { pageSize, offset } = normaliseCreatorPaging(query);
      const where = creatorSearchWhere(query.q);
      const rows = db
        .select(creatorSummarySelection)
        .from(creatorEntities)
        .where(where)
        .limit(pageSize)
        .offset(offset)
        .all();
      const countRow = db
        .select({ count: sql<number>`count(*)` })
        .from(creatorEntities)
        .where(where)
        .all()[0];
      return Promise.resolve({ rows, total: Number(countRow?.count ?? 0) });
    },

    getCreator(id) {
      const row = db.select().from(creatorEntities).where(eq(creatorEntities.id, id)).all()[0];
      return Promise.resolve(
        row
          ? {
              id: row.id,
              preferredName: row.preferredName,
              creatorKind: row.creatorKind,
              identityConfidence: row.identityConfidence,
              identityRevision: row.identityRevision,
              currentProfileSnapshotId: row.currentProfileSnapshotId,
              neutralDescription: row.neutralDescription,
              lifecycleState: row.lifecycleState,
            }
          : null,
      );
    },

    listClaims({ creatorId, limit }) {
      const rows = db
        .select()
        .from(creatorClaims)
        .where(creatorClaimsWhere(creatorId))
        .orderBy(creatorClaimOrder)
        .limit(limit ?? 50)
        .all();
      return Promise.resolve(
        rows.map((r) => ({
          id: r.id,
          creatorId: r.creatorId,
          claimText: r.claimText,
          assertionRole: r.assertionRole,
          claimKind: r.claimKind,
          direction: r.direction,
          certaintyLanguage: r.certaintyLanguage,
          confidence: r.confidence,
          reviewStatus: r.reviewStatus,
          recurrenceKey: r.recurrenceKey,
          alignmentJson: r.alignmentJson,
          createdAt: r.createdAt,
        })),
      );
    },

    listAccounts(creatorId) {
      return Promise.resolve(
        db
          .select()
          .from(creatorPlatformAccounts)
          .where(eq(creatorPlatformAccounts.creatorId, creatorId))
          .all(),
      );
    },

    listDisclosures(creatorId) {
      const rows = db
        .select()
        .from(creatorDisclosures)
        .where(eq(creatorDisclosures.creatorId, creatorId))
        .all();
      return Promise.resolve(
        rows.map((d) => ({
          id: d.id,
          disclosureText: d.disclosureText,
          source: d.source,
          createdAt: d.createdAt,
        })),
      );
    },

    listDocuments(creatorId) {
      const rows = db
        .select()
        .from(creatorDocuments)
        .where(and(eq(creatorDocuments.creatorId, creatorId), documentNotDeleted))
        .all();
      return Promise.resolve(
        rows.map((d) => ({
          id: d.id,
          filename: d.filename,
          documentKind: d.documentKind,
          rightsBasis: d.rightsBasis,
          claimEligible: Boolean(d.claimEligible),
          lifecycleState: d.lifecycleState,
          createdAt: d.createdAt,
        })),
      );
    },

    listYoutubeVideos(creatorId, limit) {
      const rows = db
        .select(creatorVideoSelection)
        .from(creatorContentItems)
        .leftJoin(
          platformContentCurrent,
          eq(platformContentCurrent.contentItemId, creatorContentItems.id),
        )
        .where(creatorVideoWhere(creatorId))
        .orderBy(creatorVideoOrder)
        .limit(limit)
        .all();
      return Promise.resolve(rows as CreatorVideoRow[]);
    },

    listRoles(creatorId) {
      const rows = db
        .select()
        .from(creatorRoles)
        .where(eq(creatorRoles.creatorId, creatorId))
        .all();
      return Promise.resolve(
        rows.map((r) => ({
          id: r.id,
          role: r.role,
          provenanceState: r.provenanceState,
          reviewState: r.reviewState,
          createdAt: r.createdAt,
        })),
      );
    },

    listRecurrenceInputs(creatorId) {
      const rows = creatorId
        ? db.select().from(creatorClaims).where(eq(creatorClaims.creatorId, creatorId)).all()
        : db.select().from(creatorClaims).all();
      return Promise.resolve(
        rows.map((c) => ({
          id: c.id,
          recurrenceKey: c.recurrenceKey,
          claimText: c.claimText,
          reviewStatus: c.reviewStatus ?? 'unreviewed',
          active: Boolean(c.active),
          lifecycleState: c.lifecycleState,
          sourceKey: c.accountId ?? c.contentItemId ?? c.documentId ?? null,
          firstObservedAt: c.createdAt,
          sourceUnavailable:
            c.lifecycleState === 'source_unavailable' || c.reviewStatus === 'source_unavailable',
        })),
      );
    },

    listRecurrenceSnapshots(limit) {
      const rows = db
        .select()
        .from(claimRecurrenceSnapshots)
        .orderBy(recurrenceSnapshotOrder)
        .limit(limit)
        .all();
      return Promise.resolve(
        rows.map((s) => ({
          id: s.id,
          claimThemeConcept: s.claimThemeConcept,
          distinctMonitoredSourceCount: s.distinctMonitoredSourceCount,
          reviewedClaimCount: s.reviewedClaimCount,
          sourceUnavailableCount: s.sourceUnavailableCount,
          formulaVersion: s.formulaVersion,
          createdAt: s.createdAt,
        })),
      );
    },

    listClaimEvidenceLinks(claimId) {
      const rows = db
        .select()
        .from(creatorClaimEvidenceLinks)
        .where(eq(creatorClaimEvidenceLinks.creatorClaimId, claimId))
        .all();
      return Promise.resolve(
        rows.map((l) => ({
          id: l.id,
          targetType: l.targetType,
          targetId: l.targetId,
          linkRole: l.linkRole,
          detectionMethod: l.detectionMethod,
          linkState: l.linkState,
          rationale: l.rationale,
          compatibilityDimensionsJson: l.compatibilityDimensionsJson,
          createdAt: l.createdAt,
        })),
      );
    },
  };
}
