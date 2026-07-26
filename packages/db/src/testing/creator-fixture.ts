import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase } from '../client.js';
import {
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
} from '../creator-schema.js';

/**
 * Seeds a migrated database with creator fixtures. **Test support only.**
 *
 * Shared by the local contract binding, the D1 contract binding, and the parity test
 * against the retired implementation, so all three measure the same starting state.
 *
 * Built to hit the branches the retired code had: an inactive creator that must not be
 * listed, an inactive claim that must not be listed, a deleted document that must not be
 * listed, a video with no `platform_content_current` row (the retired in-memory `.find()`
 * returned `undefined` and still produced an entry), a video whose metadata has expired,
 * and a non-YouTube content item that must be excluded.
 */
const BASE = Date.UTC(2026, 0, 1);
const FUTURE = Date.UTC(2027, 0, 1);
const PAST = Date.UTC(2025, 0, 1);

export type SeededCreatorDatabase = {
  db: ReturnType<typeof openDatabase>['db'];
  sqlite: ReturnType<typeof openDatabase>['sqlite'];
  dir: string;
};

export function seedCreatorFixture(): SeededCreatorDatabase {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-creator-'));
  const live = openDatabase({
    dbPath: path.join(dir, 'healthspan-dashboard.sqlite3'),
    migrateOnOpen: true,
  });
  const db = live.db;

  const creators = [
    { id: 'creator-a', preferredName: 'Ada Longevity', lifecycleState: 'active' },
    { id: 'creator-b', preferredName: 'Bruno Metabolic', lifecycleState: 'active' },
    // Merged away: must never appear in a list.
    { id: 'creator-c', preferredName: 'Cara Retired', lifecycleState: 'merged' },
  ];
  for (const c of creators) {
    db.insert(creatorEntities)
      .values({
        id: c.id,
        preferredName: c.preferredName,
        normalizedName: c.preferredName.toLowerCase(),
        creatorKind: 'individual',
        lifecycleState: c.lifecycleState,
        identityConfidence: 'medium',
        neutralDescription: `Synthetic profile for ${c.preferredName}.`,
        identityRevision: 1,
        dataOrigin: 'live',
        createdAt: BASE,
        updatedAt: BASE,
      })
      .run();
  }

  db.insert(creatorPlatformAccounts)
    .values({
      id: 'account-a-yt',
      creatorId: 'creator-a',
      platform: 'youtube',
      externalAccountId: 'UCsynthetic',
      handle: '@ada',
      displayName: 'Ada Longevity',
      canonicalUrl: 'https://example.invalid/ada',
      monitored: true,
      enabled: true,
      createdAt: BASE,
    })
    .run();

  db.insert(creatorPlatformAccounts)
    .values({
      id: 'account-a-x',
      creatorId: 'creator-a',
      platform: 'x',
      externalAccountId: 'x-synthetic',
      handle: '@ada_x',
      monitored: true,
      enabled: true,
      createdAt: BASE,
    })
    .run();

  // `reviewStatus: 'accepted'` is what makes a claim eligible for recurrence — see
  // `computeClaimRecurrence`. The two theme-1 claims sit on *different* monitored
  // accounts so the group has a distinct-source count above one, which is the whole
  // point of the measure: repetition by one source is not recurrence.
  const claims = [
    {
      id: 'claim-a1',
      creatorId: 'creator-a',
      active: true,
      createdAt: BASE + 3_000,
      key: 'theme-1',
      accountId: 'account-a-yt',
    },
    {
      id: 'claim-a2',
      creatorId: 'creator-a',
      active: true,
      createdAt: BASE + 2_000,
      key: 'theme-1',
      accountId: 'account-a-x',
    },
    // Inactive: excluded from claim lists, and ineligible for recurrence.
    {
      id: 'claim-a3',
      creatorId: 'creator-a',
      active: false,
      createdAt: BASE + 1_000,
      key: 'theme-2',
      accountId: 'account-a-yt',
    },
    {
      id: 'claim-b1',
      creatorId: 'creator-b',
      active: true,
      createdAt: BASE + 4_000,
      key: 'theme-3',
      accountId: 'account-a-yt',
    },
  ];
  for (const c of claims) {
    db.insert(creatorClaims)
      .values({
        id: c.id,
        creatorId: c.creatorId,
        accountId: c.accountId,
        claimText: `Synthetic claim ${c.id}`,
        assertionRole: 'reported_finding',
        claimKind: 'efficacy',
        direction: 'positive',
        confidence: 'low',
        recurrenceKey: c.key,
        reviewStatus: 'accepted',
        active: c.active,
        lifecycleState: 'current',
        alignmentJson: JSON.stringify({ dimension: 'directional' }),
        fieldPath: 'transcript',
        excerpt: `Excerpt for ${c.id}`,
        extractionVersion: 'v1',
        createdAt: c.createdAt,
      })
      .run();
  }

  db.insert(creatorDisclosures)
    .values({
      id: 'disclosure-a',
      creatorId: 'creator-a',
      disclosureText: 'Receives supplement sponsorship.',
      source: 'document',
      createdAt: BASE,
    })
    .run();

  for (const doc of [
    { id: 'doc-a', lifecycleState: 'current' },
    // Deleted documents must not be listed.
    { id: 'doc-a-deleted', lifecycleState: 'deleted' },
  ]) {
    db.insert(creatorDocuments)
      .values({
        id: doc.id,
        creatorId: 'creator-a',
        filename: `${doc.id}.txt`,
        documentKind: 'transcript',
        rightsBasis: 'creator_supplied',
        claimEligible: true,
        storageKey: `documents/${doc.id}.txt`,
        sha256: 'x'.repeat(64),
        byteLength: 128,
        lifecycleState: doc.lifecycleState,
        createdAt: BASE,
      })
      .run();
  }

  db.insert(creatorRoles)
    .values({
      id: 'role-a',
      creatorId: 'creator-a',
      role: 'researcher',
      provenanceState: 'declared',
      reviewState: 'accepted',
      createdAt: BASE,
    })
    .run();

  const videos = [
    {
      id: 'video-1',
      publishedAt: BASE + 5_000,
      platform: 'youtube',
      state: 'current',
      current: 'fresh',
    },
    {
      id: 'video-2',
      publishedAt: BASE + 4_000,
      platform: 'youtube',
      state: 'current',
      current: 'expired',
    },
    // No platform_content_current row at all.
    {
      id: 'video-3',
      publishedAt: BASE + 3_000,
      platform: 'youtube',
      state: 'current',
      current: 'none',
    },
    // Not YouTube, and not current: both must be excluded.
    { id: 'post-1', publishedAt: BASE + 6_000, platform: 'x', state: 'current', current: 'none' },
    {
      id: 'video-old',
      publishedAt: BASE + 1_000,
      platform: 'youtube',
      state: 'removed',
      current: 'none',
    },
  ];
  for (const v of videos) {
    db.insert(creatorContentItems)
      .values({
        id: v.id,
        creatorId: 'creator-a',
        platformAccountId: 'account-a-yt',
        platform: v.platform,
        externalId: `ext-${v.id}`,
        title: `Video ${v.id}`,
        publishedAt: v.publishedAt,
        canonicalUrl: `https://example.invalid/${v.id}`,
        currentState: v.state,
        createdAt: BASE,
        updatedAt: BASE,
      })
      .run();
    if (v.current !== 'none') {
      db.insert(platformContentCurrent)
        .values({
          id: `current-${v.id}`,
          contentItemId: v.id,
          title: `Video ${v.id}`,
          thumbnailUrl: `https://example.invalid/${v.id}.jpg`,
          captionAvailable: true,
          paidPlacementDeclared: v.current === 'fresh',
          displayEligible: true,
          retrievedAt: BASE,
          expiryAt: v.current === 'expired' ? PAST : FUTURE,
          createdAt: BASE,
          updatedAt: BASE,
        })
        .run();
    }
  }

  db.insert(claimRecurrenceSnapshots)
    .values({
      id: 'snapshot-1',
      claimThemeConcept: 'theme-1',
      distinctMonitoredSourceCount: 1,
      reviewedClaimCount: 2,
      sourceUnavailableCount: 0,
      formulaVersion: 'm5.recurrence.1',
      sourceScopeHash: 'abc123',
      windowStart: BASE,
      windowEnd: BASE + 9_000,
      createdAt: BASE + 9_000,
    })
    .run();
  db.insert(claimRecurrenceSnapshots)
    .values({
      id: 'snapshot-0',
      claimThemeConcept: 'theme-3',
      distinctMonitoredSourceCount: 1,
      reviewedClaimCount: 1,
      sourceUnavailableCount: 0,
      formulaVersion: 'm5.recurrence.1',
      sourceScopeHash: 'def456',
      windowStart: BASE,
      windowEnd: BASE + 8_000,
      createdAt: BASE + 8_000,
    })
    .run();

  db.insert(creatorClaimEvidenceLinks)
    .values({
      id: 'evidence-a1',
      creatorClaimId: 'claim-a1',
      targetType: 'live_claim',
      targetId: 'live-claim-1',
      linkRole: 'supports',
      detectionMethod: 'deterministic',
      compatibilityDimensionsJson: JSON.stringify(['direction']),
      linkState: 'candidate',
      rationale: 'Directionally compatible.',
      createdAt: BASE,
    })
    .run();

  return { db, sqlite: live.sqlite, dir };
}
