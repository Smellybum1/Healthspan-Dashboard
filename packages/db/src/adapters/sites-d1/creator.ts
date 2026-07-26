import { and, eq, sql } from 'drizzle-orm';
import {
  normaliseCreatorPaging,
  type CreatorReadRepository,
  type CreatorVideoRow,
} from '@healthspan/core';
import {
  claimRecurrenceSnapshots,
  creatorClaimOrder,
  creatorClaims,
  creatorClaimsWhere,
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
} from '../../repositories/creator-query.js';
import type { SitesD1Database } from './client.js';

/**
 * Sites/D1 implementation of {@link CreatorReadRepository}.
 *
 * The same predicates, ordering, and video join as the local adapter, from the same
 * `repositories/creator-query.js`; only execution differs.
 *
 * The video join is the reason this domain needed a query rewrite rather than a
 * translation. The retired implementation re-selected the whole
 * `platform_content_current` table once per video and searched it in memory — up to forty
 * full table scans, which on D1 is forty network round trips pulling forty copies of the
 * table, for a single creator page.
 */
export function createSitesCreatorReadRepository(db: SitesD1Database): CreatorReadRepository {
  return {
    async listCreators(query) {
      const { pageSize, offset } = normaliseCreatorPaging(query);
      const where = creatorSearchWhere(query.q);
      const [rows, countRows] = await Promise.all([
        db
          .select(creatorSummarySelection)
          .from(creatorEntities)
          .where(where)
          .limit(pageSize)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(creatorEntities)
          .where(where),
      ]);
      return { rows, total: Number(countRows[0]?.count ?? 0) };
    },

    async getCreator(id) {
      const rows = await db.select().from(creatorEntities).where(eq(creatorEntities.id, id));
      const row = rows[0];
      return row
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
        : null;
    },

    async listClaims({ creatorId, limit }) {
      const rows = await db
        .select()
        .from(creatorClaims)
        .where(creatorClaimsWhere(creatorId))
        .orderBy(creatorClaimOrder)
        .limit(limit ?? 50);
      return rows.map((r) => ({
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
      }));
    },

    listAccounts(creatorId) {
      return db
        .select()
        .from(creatorPlatformAccounts)
        .where(eq(creatorPlatformAccounts.creatorId, creatorId));
    },

    async listDisclosures(creatorId) {
      const rows = await db
        .select()
        .from(creatorDisclosures)
        .where(eq(creatorDisclosures.creatorId, creatorId));
      return rows.map((d) => ({
        id: d.id,
        disclosureText: d.disclosureText,
        source: d.source,
        createdAt: d.createdAt,
      }));
    },

    async listDocuments(creatorId) {
      const rows = await db
        .select()
        .from(creatorDocuments)
        .where(and(eq(creatorDocuments.creatorId, creatorId), documentNotDeleted));
      return rows.map((d) => ({
        id: d.id,
        filename: d.filename,
        documentKind: d.documentKind,
        rightsBasis: d.rightsBasis,
        claimEligible: Boolean(d.claimEligible),
        lifecycleState: d.lifecycleState,
        createdAt: d.createdAt,
      }));
    },

    async listYoutubeVideos(creatorId, limit) {
      const rows = await db
        .select(creatorVideoSelection)
        .from(creatorContentItems)
        .leftJoin(
          platformContentCurrent,
          eq(platformContentCurrent.contentItemId, creatorContentItems.id),
        )
        .where(creatorVideoWhere(creatorId))
        .orderBy(creatorVideoOrder)
        .limit(limit);
      return rows as CreatorVideoRow[];
    },

    async listRoles(creatorId) {
      const rows = await db
        .select()
        .from(creatorRoles)
        .where(eq(creatorRoles.creatorId, creatorId));
      return rows.map((r) => ({
        id: r.id,
        role: r.role,
        provenanceState: r.provenanceState,
        reviewState: r.reviewState,
        createdAt: r.createdAt,
      }));
    },

    async listRecurrenceInputs(creatorId) {
      const base = db.select().from(creatorClaims);
      const rows = await (creatorId ? base.where(eq(creatorClaims.creatorId, creatorId)) : base);
      return rows.map((c) => ({
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
      }));
    },

    async listRecurrenceSnapshots(limit) {
      const rows = await db
        .select()
        .from(claimRecurrenceSnapshots)
        .orderBy(recurrenceSnapshotOrder)
        .limit(limit);
      return rows.map((s) => ({
        id: s.id,
        claimThemeConcept: s.claimThemeConcept,
        distinctMonitoredSourceCount: s.distinctMonitoredSourceCount,
        reviewedClaimCount: s.reviewedClaimCount,
        sourceUnavailableCount: s.sourceUnavailableCount,
        formulaVersion: s.formulaVersion,
        createdAt: s.createdAt,
      }));
    },
  };
}
