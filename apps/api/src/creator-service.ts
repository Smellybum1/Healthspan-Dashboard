import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { desc, eq } from 'drizzle-orm';
import {
  creatorAliases,
  creatorClaims,
  creatorClaimAlignmentAssessments,
  creatorClaimAlignmentDimensions,
  creatorClaimFindings,
  creatorClaimSourceSpans,
  creatorContentItems,
  creatorDisclosures,
  creatorDocuments,
  creatorDocumentSegments,
  creatorEntities,
  creatorPlatformAccounts,
  creatorProfileSnapshots,
  platformContentCurrent,
  platformPolicyState,
  xBudgetLedger,
  type HealthspanDb,
} from '@healthspan/db';
import {
  alignCreatorClaim,
  claimRecurrenceKey,
  ALIGNMENT_RULES_VERSION,
  CLAIM_EXTRACT_VERSION,
  extractCreatorClaimsFromText,
  classifyCreatorClaimTaxonomy,
  redactActionableDosing,
  normalizeCreatorName,
  parseTranscriptDocument,
  type RightsBasis,
} from '@healthspan/creators';
import { getCreatorRecurrence } from './creator-recurrence-service.js';
import { listCreatorRoles, queueAmbiguousIdentityIfNeeded } from './creator-identity-service.js';

const BOOTSTRAP = [
  {
    id: 'creator-example-longevity',
    name: 'Example Longevity Communicator',
    kind: 'individual',
    aliases: ['Example Longevity Channel'],
  },
];

function persistClaimAlignment(
  db: HealthspanDb,
  opts: {
    claimId: string;
    claimText: string;
    assertionRole: string;
    confidence: string;
    at: number;
  },
) {
  const alignment = alignCreatorClaim({
    claimText: opts.claimText,
    assertionRole: opts.assertionRole,
    linkedEvidenceCount: 0,
    hasRegulatoryLink: false,
    hasInterventionLink: false,
  });
  const assessmentId = randomUUID();
  const analysisIdentity = createHash('sha256')
    .update(`${opts.claimId}:${ALIGNMENT_RULES_VERSION}:${opts.claimText}`)
    .digest('hex');
  db.insert(creatorClaimAlignmentAssessments)
    .values({
      id: assessmentId,
      creatorClaimId: opts.claimId,
      inputDependencyHash: analysisIdentity.slice(0, 32),
      rulesetVersion: ALIGNMENT_RULES_VERSION,
      status: 'ready',
      completeness: `${alignment.dimensions.length}/15`,
      extractionConfidence: opts.confidence,
      lifecycleState: 'current',
      deterministicSummary: alignment.overallLabel,
      analysisIdentity,
      createdAt: opts.at,
    })
    .run();
  for (const dimension of alignment.dimensions) {
    db.insert(creatorClaimAlignmentDimensions)
      .values({
        id: randomUUID(),
        assessmentId,
        dimension: dimension.id,
        state: dimension.state,
        creatorClaimValue: opts.claimText.slice(0, 240),
        explanation: dimension.note,
        method: 'deterministic_rules',
        reviewState: dimension.requiresHumanReview ? 'candidate' : 'accepted',
        createdAt: opts.at,
      })
      .run();
  }
  for (const finding of alignment.findings) {
    db.insert(creatorClaimFindings)
      .values({
        id: randomUUID(),
        assessmentId,
        claimId: opts.claimId,
        findingType: finding,
        findingState: 'candidate',
        explanation: `Candidate finding from ${ALIGNMENT_RULES_VERSION}; adverse Live prominence requires human review.`,
        reviewRequired: true,
        publishedToProfile: false,
        createdAt: opts.at,
      })
      .run();
  }
  return alignment;
}

export function bootstrapCreatorCatalog(db: HealthspanDb) {
  const now = Date.now();
  for (const row of BOOTSTRAP) {
    const existing = db
      .select()
      .from(creatorEntities)
      .where(eq(creatorEntities.id, row.id))
      .all()[0];
    if (existing) continue;
    db.insert(creatorEntities)
      .values({
        id: row.id,
        preferredName: row.name,
        normalizedName: normalizeCreatorName(row.name),
        creatorKind: row.kind,
        lifecycleState: 'active',
        identityConfidence: 'medium',
        neutralDescription:
          'Bootstrap curated creator profile for M5 Live demos (claims assessed, not people).',
        dataOrigin: 'live',
        createdAt: now,
        updatedAt: now,
      })
      .run();
    for (const alias of [row.name, ...(row.aliases ?? [])]) {
      db.insert(creatorAliases)
        .values({
          id: randomUUID(),
          creatorId: row.id,
          aliasText: alias,
          normalizedAlias: normalizeCreatorName(alias),
          reviewState: 'accepted',
          createdAt: now,
        })
        .run();
    }
  }

  const policies = [
    {
      id: 'policy-youtube-metadata',
      platform: 'youtube',
      policyKey: 'metadata_not_claim_evidence',
      status: 'enforced',
    },
    {
      id: 'policy-youtube-no-scrape',
      platform: 'youtube',
      policyKey: 'no_unofficial_captions_or_media',
      status: 'enforced',
    },
    {
      id: 'policy-x-optional',
      platform: 'x',
      policyKey: 'disabled_by_default_budget_cap',
      status: 'disabled',
    },
    {
      id: 'policy-x-no-external-ai',
      platform: 'x',
      policyKey: 'no_external_ai',
      status: 'enforced',
    },
  ];
  for (const p of policies) {
    if (db.select().from(platformPolicyState).where(eq(platformPolicyState.id, p.id)).all()[0])
      continue;
    db.insert(platformPolicyState)
      .values({ ...p, detailJson: '{}', updatedAt: now })
      .run();
  }
}

export function listCreators(
  db: HealthspanDb,
  opts?: { page?: number; pageSize?: number; q?: string },
) {
  bootstrapCreatorCatalog(db);
  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts?.pageSize ?? 25));
  let rows = db
    .select()
    .from(creatorEntities)
    .all()
    .filter((c) => c.lifecycleState === 'active');
  if (opts?.q) {
    const q = opts.q.toLowerCase();
    rows = rows.filter((c) => c.preferredName.toLowerCase().includes(q));
  }
  const total = rows.length;
  const items = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize).map((c) => ({
    id: c.id,
    preferredName: c.preferredName,
    creatorKind: c.creatorKind,
    identityConfidence: c.identityConfidence,
    neutralDescription: c.neutralDescription,
  }));
  return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function importCreatorDocument(
  db: HealthspanDb,
  opts: {
    creatorId: string;
    filename: string;
    bytes: Buffer;
    rightsBasis: RightsBasis;
    mediaType?: string;
    replacesDocumentId?: string;
    dataDir?: string;
    /** When false, store document but do not extract claims. */
    claimEligible?: boolean;
  },
) {
  bootstrapCreatorCatalog(db);
  const creator = db
    .select()
    .from(creatorEntities)
    .where(eq(creatorEntities.id, opts.creatorId))
    .all()[0];
  if (!creator) return { ok: false as const, status: 404 as const, error: 'Creator not found' };

  const claimEligible = opts.claimEligible ?? true;
  const parsed = parseTranscriptDocument({
    filename: opts.filename,
    bytes: opts.bytes,
    mediaType: opts.mediaType,
  });
  const sha256 = createHash('sha256').update(opts.bytes).digest('hex');
  const docId = randomUUID();
  const now = Date.now();
  const storageKey = `creator-docs/${sha256.slice(0, 2)}/${sha256}`;
  if (opts.dataDir) {
    const abs = path.join(opts.dataDir, storageKey);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, opts.bytes);
  }

  if (opts.replacesDocumentId) {
    const prior = db
      .select()
      .from(creatorDocuments)
      .all()
      .find((d) => d.id === opts.replacesDocumentId && d.creatorId === opts.creatorId);
    if (!prior)
      return { ok: false as const, status: 404 as const, error: 'Document to replace not found' };
    db.update(creatorDocuments)
      .set({ lifecycleState: 'superseded' })
      .where(eq(creatorDocuments.id, prior.id))
      .run();
    for (const claim of db
      .select()
      .from(creatorClaims)
      .all()
      .filter((c) => c.documentId === prior.id)) {
      db.update(creatorClaims)
        .set({ lifecycleState: 'stale_replaced', reviewStatus: 'stale' })
        .where(eq(creatorClaims.id, claim.id))
        .run();
    }
  }

  db.insert(creatorDocuments)
    .values({
      id: docId,
      creatorId: opts.creatorId,
      filename: opts.filename,
      documentKind: parsed.kind,
      rightsBasis: opts.rightsBasis,
      storageKey,
      byteLength: opts.bytes.length,
      sha256,
      parsedTextExcerpt: parsed.text.slice(0, 2000),
      reviewState: 'accepted',
      claimEligible,
      rightsDeclaredAt: now,
      lifecycleState: 'current',
      mimeType: opts.mediaType ?? null,
      replacesDocumentId: opts.replacesDocumentId ?? null,
      createdAt: now,
    })
    .run();

  const segmentIds: string[] = [];
  for (const seg of parsed.segments) {
    const segId = randomUUID();
    segmentIds.push(segId);
    db.insert(creatorDocumentSegments)
      .values({
        id: segId,
        documentId: docId,
        segmentKind: seg.segmentKind,
        charStart: seg.charStart,
        charEnd: seg.charEnd,
        text: seg.text,
        textHash: createHash('sha256').update(seg.text).digest('hex'),
        sourceLineOrCueIds: seg.sourceLineOrCueIds ?? null,
        claimEligible,
        createdAt: now,
      })
      .run();
  }

  let claimsCreated = 0;
  let disclosures = 0;
  if (claimEligible) {
    const drafts = extractCreatorClaimsFromText(parsed.text);
    for (const draft of drafts) {
      const claimId = randomUUID();
      const fingerprint = claimRecurrenceKey(draft.claimText);
      const matchingIdx = parsed.segments.findIndex((s) =>
        s.text.includes(draft.excerpt.slice(0, Math.min(40, draft.excerpt.length))),
      );
      const segIdx = matchingIdx >= 0 ? matchingIdx : 0;
      const matchingSeg = parsed.segments[segIdx];
      const matchingSegId = segmentIds[segIdx] ?? null;
      const taxonomy = classifyCreatorClaimTaxonomy(draft.claimText, draft.assertionRole);
      const claimText = redactActionableDosing(draft.claimText);
      db.insert(creatorClaims)
        .values({
          id: claimId,
          creatorId: opts.creatorId,
          documentId: docId,
          claimFingerprint: fingerprint,
          claimText,
          assertionRole: draft.assertionRole,
          claimKind: taxonomy.claimKind,
          direction: taxonomy.direction,
          certaintyLanguage: taxonomy.certaintyLanguage,
          excerpt: draft.excerpt,
          fieldPath: draft.fieldPath,
          confidence: draft.confidence,
          recurrenceKey: fingerprint,
          active: true,
          reviewStatus: 'unreviewed',
          lifecycleState: 'current',
          alignmentJson: JSON.stringify({ pending: true }),
          extractionVersion: CLAIM_EXTRACT_VERSION,
          createdAt: now,
        })
        .run();
      const alignment = persistClaimAlignment(db, {
        claimId,
        claimText,
        assertionRole: draft.assertionRole,
        confidence: draft.confidence,
        at: now,
      });
      db.update(creatorClaims)
        .set({ alignmentJson: JSON.stringify(alignment) })
        .where(eq(creatorClaims.id, claimId))
        .run();
      db.insert(creatorClaimSourceSpans)
        .values({
          id: randomUUID(),
          claimId,
          documentId: docId,
          segmentId: matchingSegId,
          charStart: matchingSeg?.charStart ?? null,
          charEnd: matchingSeg?.charEnd ?? null,
          boundedExcerpt: draft.excerpt.slice(0, 240),
          excerptWordCount: draft.excerpt.split(/\s+/).filter(Boolean).length,
          spanHash: createHash('sha256').update(draft.excerpt).digest('hex'),
          primarySupport: true,
          displayEligible: true,
          createdAt: now,
        })
        .run();
      claimsCreated += 1;
      if (draft.assertionRole === 'disclosure') {
        db.insert(creatorDisclosures)
          .values({
            id: randomUUID(),
            creatorId: opts.creatorId,
            creatorClaimId: claimId,
            disclosureText: claimText,
            source: 'document',
            createdAt: now,
          })
          .run();
        disclosures += 1;
      }
    }
  }

  const snapshotId = randomUUID();
  db.insert(creatorProfileSnapshots)
    .values({
      id: snapshotId,
      creatorId: opts.creatorId,
      summaryJson: JSON.stringify({
        documentId: docId,
        claimsCreated,
        disclosures,
        note: 'Claims assessed — no creator trust/worth score.',
      }),
      rulesetVersion: 'm5.profile.1',
      createdAt: now,
    })
    .run();
  db.update(creatorEntities)
    .set({ currentProfileSnapshotId: snapshotId, updatedAt: now })
    .where(eq(creatorEntities.id, opts.creatorId))
    .run();

  return {
    ok: true as const,
    documentId: docId,
    claimsCreated,
    disclosures,
    warnings: parsed.warnings,
    cueCount: parsed.cueCount,
    claimEligible,
    replaced: Boolean(opts.replacesDocumentId),
  };
}

/** Delete document bytes/segments and mark dependent claims stale. */
export function deleteCreatorDocument(
  db: HealthspanDb,
  opts: { documentId: string; dataDir?: string },
) {
  const doc = db
    .select()
    .from(creatorDocuments)
    .all()
    .find((d) => d.id === opts.documentId);
  if (!doc) return { ok: false as const, status: 404 as const, error: 'Document not found' };
  if (doc.lifecycleState === 'deleted') {
    return { ok: true as const, alreadyDeleted: true, staleClaims: 0 };
  }
  const now = Date.now();
  let bytesRemoved = false;
  if (opts.dataDir && doc.storageKey && !doc.storagePurged) {
    const abs = path.join(opts.dataDir, doc.storageKey);
    try {
      if (fs.existsSync(abs)) {
        fs.unlinkSync(abs);
        bytesRemoved = true;
      }
    } catch {
      // continue with DB purge even if file missing
    }
  }
  const segments = db
    .select()
    .from(creatorDocumentSegments)
    .all()
    .filter((s) => s.documentId === doc.id);
  for (const seg of segments) {
    db.delete(creatorDocumentSegments).where(eq(creatorDocumentSegments.id, seg.id)).run();
  }
  db.update(creatorDocuments)
    .set({
      lifecycleState: 'deleted',
      deletedAt: now,
      purgedAt: now,
      storagePurged: true,
      parsedTextExcerpt: null,
      claimEligible: false,
      byteLength: 0,
    })
    .where(eq(creatorDocuments.id, doc.id))
    .run();

  let staleClaims = 0;
  for (const claim of db
    .select()
    .from(creatorClaims)
    .all()
    .filter((c) => c.documentId === doc.id)) {
    db.update(creatorClaims)
      .set({
        active: false,
        lifecycleState: 'stale_source_deleted',
        reviewStatus: 'source_unavailable',
      })
      .where(eq(creatorClaims.id, claim.id))
      .run();
    for (const span of db
      .select()
      .from(creatorClaimSourceSpans)
      .all()
      .filter((s) => s.claimId === claim.id)) {
      db.update(creatorClaimSourceSpans)
        .set({ displayEligible: false, boundedExcerpt: '[source deleted]' })
        .where(eq(creatorClaimSourceSpans.id, span.id))
        .run();
    }
    staleClaims += 1;
  }
  return {
    ok: true as const,
    alreadyDeleted: false,
    bytesRemoved,
    segmentsRemoved: segments.length,
    staleClaims,
  };
}

export function listCreatorClaims(db: HealthspanDb, opts?: { creatorId?: string; limit?: number }) {
  bootstrapCreatorCatalog(db);
  const limit = Math.min(200, Math.max(1, opts?.limit ?? 50));
  let rows = db
    .select()
    .from(creatorClaims)
    .orderBy(desc(creatorClaims.createdAt))
    .all()
    .filter((r) => r.active && (!opts?.creatorId || r.creatorId === opts.creatorId));
  rows = rows.slice(0, limit);
  return rows.map((r) => ({
    id: r.id,
    creatorId: r.creatorId,
    claimText: r.claimText,
    assertionRole: r.assertionRole,
    claimKind: r.claimKind,
    direction: r.direction,
    certaintyLanguage: r.certaintyLanguage,
    confidence: r.confidence,
    reviewStatus: r.reviewStatus ?? 'unreviewed',
    recurrenceKey: r.recurrenceKey,
    alignment: JSON.parse(r.alignmentJson) as Record<string, unknown>,
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}

export function getCreatorDetail(db: HealthspanDb, id: string) {
  bootstrapCreatorCatalog(db);
  const creator = db.select().from(creatorEntities).where(eq(creatorEntities.id, id)).all()[0];
  if (!creator) return null;
  const accounts = db
    .select()
    .from(creatorPlatformAccounts)
    .all()
    .filter((a) => a.creatorId === id);
  const claims = listCreatorClaims(db, { creatorId: id, limit: 100 });
  const disclosures = db
    .select()
    .from(creatorDisclosures)
    .all()
    .filter((d) => d.creatorId === id);
  const documents = db
    .select()
    .from(creatorDocuments)
    .all()
    .filter((d) => d.creatorId === id && d.lifecycleState !== 'deleted')
    .map((d) => ({
      id: d.id,
      filename: d.filename,
      documentKind: d.documentKind,
      rightsBasis: d.rightsBasis,
      claimEligible: Boolean(d.claimEligible),
      lifecycleState: d.lifecycleState,
      createdAt: new Date(d.createdAt).toISOString(),
    }));
  const now = Date.now();
  const youtubeVideos = db
    .select()
    .from(creatorContentItems)
    .all()
    .filter((c) => c.creatorId === id && c.platform === 'youtube' && c.currentState === 'current')
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
    .slice(0, 40)
    .map((item) => {
      const current = db
        .select()
        .from(platformContentCurrent)
        .all()
        .find((r) => r.contentItemId === item.id);
      const expired = current?.expiryAt != null && current.expiryAt < now;
      return {
        id: item.id,
        videoId: item.externalId,
        title: item.title,
        publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString() : null,
        canonicalUrl: item.canonicalUrl,
        thumbnailUrl: current?.thumbnailUrl ?? null,
        captionAvailable: Boolean(current?.captionAvailable),
        paidPlacementDeclared: Boolean(current?.paidPlacementDeclared),
        displayEligible: Boolean(current?.displayEligible) && !expired,
        claimEvidence: false as const,
        metadataOnly: true as const,
        note: 'YouTube API metadata is operational context only — not claim evidence',
      };
    });
  const recurrence = getCreatorRecurrence(db, id).groups.map((g) => ({
    recurrenceKey: g.recurrenceKey,
    reviewedClaimCount: g.reviewedClaimCount,
    distinctMonitoredSourceCount: g.distinctMonitoredSourceCount,
    formulaVersion: g.formulaVersion,
    firstObservedAt: g.firstObservedAt ? new Date(g.firstObservedAt).toISOString() : null,
    firstObservedScope: g.firstObservedScope,
    notPopularity: true as const,
  }));

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
    documents,
    youtubeVideos,
    roles: listCreatorRoles(db, id),
    recurrence,
    prohibitedScores: [
      'trust_score',
      'credibility_score',
      'misinformation_rank',
      'influence_score',
      'attention_score',
      'engagement_score',
      'popularity_score',
    ],
  };
}

/** Parse YouTube channel URL, @handle, or UC… channel id. */
export function parseYoutubeChannelRef(input: string): {
  externalAccountId: string;
  handle: string | null;
  canonicalUrl: string;
} {
  const raw = input.trim();
  const channelMatch = raw.match(/(UC[\w-]{22})/);
  if (channelMatch) {
    const id = channelMatch[1]!;
    return {
      externalAccountId: id,
      handle: null,
      canonicalUrl: `https://www.youtube.com/channel/${id}`,
    };
  }
  const handleMatch = raw.match(/@([\w.-]+)/) ?? raw.match(/^([\w.-]+)$/);
  if (handleMatch) {
    const handle = handleMatch[1]!;
    return {
      externalAccountId: `handle:${handle.toLowerCase()}`,
      handle: `@${handle}`,
      canonicalUrl: `https://www.youtube.com/@${handle}`,
    };
  }
  throw new Error('Provide a YouTube channel URL, @handle, or channel ID (UC…)');
}

export function addYoutubeAccount(
  db: HealthspanDb,
  opts: { creatorId: string; channelRef: string; monitored?: boolean },
) {
  bootstrapCreatorCatalog(db);
  const creator = db
    .select()
    .from(creatorEntities)
    .where(eq(creatorEntities.id, opts.creatorId))
    .all()[0];
  if (!creator) return { ok: false as const, status: 404 as const, error: 'Creator not found' };
  let parsed: ReturnType<typeof parseYoutubeChannelRef>;
  try {
    parsed = parseYoutubeChannelRef(opts.channelRef);
  } catch (err) {
    return {
      ok: false as const,
      status: 400 as const,
      error: err instanceof Error ? err.message : 'Invalid channel',
    };
  }
  const existing = db
    .select()
    .from(creatorPlatformAccounts)
    .all()
    .find((a) => a.platform === 'youtube' && a.externalAccountId === parsed.externalAccountId);
  if (existing) return { ok: true as const, accountId: existing.id, created: false };
  const id = randomUUID();
  db.insert(creatorPlatformAccounts)
    .values({
      id,
      creatorId: opts.creatorId,
      platform: 'youtube',
      externalAccountId: parsed.externalAccountId,
      handle: parsed.handle,
      canonicalUrl: parsed.canonicalUrl,
      monitored: opts.monitored ?? true,
      enabled: true,
      createdAt: Date.now(),
    })
    .run();
  queueAmbiguousIdentityIfNeeded(db, {
    accountId: id,
    handle: parsed.handle,
    creatorId: opts.creatorId,
  });
  return { ok: true as const, accountId: id, created: true };
}

export function addXAccount(
  db: HealthspanDb,
  opts: { creatorId: string; username: string; monitored?: boolean },
) {
  bootstrapCreatorCatalog(db);
  const creator = db
    .select()
    .from(creatorEntities)
    .where(eq(creatorEntities.id, opts.creatorId))
    .all()[0];
  if (!creator) return { ok: false as const, status: 404 as const, error: 'Creator not found' };
  const handle = opts.username.replace(/^@/, '').trim();
  if (!handle) return { ok: false as const, status: 400 as const, error: 'Username required' };
  const externalAccountId = handle.toLowerCase();
  const existing = db
    .select()
    .from(creatorPlatformAccounts)
    .all()
    .find((a) => a.platform === 'x' && a.externalAccountId === externalAccountId);
  if (existing) return { ok: true as const, accountId: existing.id, created: false };
  const id = randomUUID();
  db.insert(creatorPlatformAccounts)
    .values({
      id,
      creatorId: opts.creatorId,
      platform: 'x',
      externalAccountId,
      handle: `@${handle}`,
      canonicalUrl: `https://x.com/${handle}`,
      monitored: opts.monitored ?? true,
      enabled: process.env.HEALTHSPAN_X_ENABLED === 'true',
      createdAt: Date.now(),
    })
    .run();
  queueAmbiguousIdentityIfNeeded(db, {
    accountId: id,
    handle: `@${handle}`,
    creatorId: opts.creatorId,
  });
  return {
    ok: true as const,
    accountId: id,
    created: true,
    note: 'X remains optional and budget-capped. Configure spending limit in the X Developer Console; automatic recharge is unsupported.',
  };
}

export function createManualCreatorClaim(
  db: HealthspanDb,
  opts: {
    creatorId: string;
    claimText: string;
    sourceUrl?: string;
    timestampOrPostId?: string;
    assertionRole?: string;
  },
) {
  bootstrapCreatorCatalog(db);
  const creator = db
    .select()
    .from(creatorEntities)
    .where(eq(creatorEntities.id, opts.creatorId))
    .all()[0];
  if (!creator) return { ok: false as const, status: 404 as const, error: 'Creator not found' };
  const text = redactActionableDosing(opts.claimText.trim());
  if (text.length < 12 || text.length > 500) {
    return {
      ok: false as const,
      status: 400 as const,
      error: 'claimText must be 12–500 characters',
    };
  }
  const role =
    (opts.assertionRole as
      | 'assertion'
      | 'question'
      | 'hypothetical'
      | 'quotation'
      | 'correction'
      | 'disclosure'
      | undefined) ?? 'assertion';
  const taxonomy = classifyCreatorClaimTaxonomy(text, role);
  const id = randomUUID();
  const now = Date.now();
  db.insert(creatorClaims)
    .values({
      id,
      creatorId: opts.creatorId,
      claimText: text,
      assertionRole: role,
      claimKind: taxonomy.claimKind,
      direction: taxonomy.direction,
      certaintyLanguage: taxonomy.certaintyLanguage,
      excerpt: text.slice(0, 240),
      fieldPath: `manual:${opts.sourceUrl ?? 'user'}:${opts.timestampOrPostId ?? 'none'}`,
      confidence: 'medium',
      recurrenceKey: claimRecurrenceKey(text),
      active: true,
      reviewStatus: 'unreviewed',
      alignmentJson: JSON.stringify({ pending: true }),
      extractionVersion: CLAIM_EXTRACT_VERSION,
      createdAt: now,
    })
    .run();
  const alignment = persistClaimAlignment(db, {
    claimId: id,
    claimText: text,
    assertionRole: role,
    confidence: 'medium',
    at: now,
  });
  db.update(creatorClaims)
    .set({ alignmentJson: JSON.stringify(alignment) })
    .where(eq(creatorClaims.id, id))
    .run();
  return { ok: true as const, claimId: id };
}

export function creatorWatchItems(db: HealthspanDb, limit = 12) {
  bootstrapCreatorCatalog(db);
  return listCreatorClaims(db, { limit }).map((c) => ({
    id: c.id,
    type: 'claim',
    title: c.claimText.slice(0, 120),
    summary: `${c.assertionRole} · confidence ${c.confidence}`,
    meta: 'Creator claim (not a person score)',
    dataOrigin: 'live' as const,
    href: `/creator-claims/${c.id}`,
  }));
}

export function ensureXBudgetRow(db: HealthspanDb) {
  const periodKey = new Date().toISOString().slice(0, 7);
  const existing = db
    .select()
    .from(xBudgetLedger)
    .all()
    .find((r) => r.periodKey === periodKey);
  if (existing) return existing;
  const cap = Number(process.env.HEALTHSPAN_X_BUDGET_CAP_MICROS ?? 0);
  const id = randomUUID();
  db.insert(xBudgetLedger)
    .values({
      id,
      periodKey,
      spentMicros: 0,
      capMicros: cap,
      acknowledged: process.env.HEALTHSPAN_X_BUDGET_ACKNOWLEDGED === 'true',
      updatedAt: Date.now(),
    })
    .run();
  return db.select().from(xBudgetLedger).where(eq(xBudgetLedger.id, id)).all()[0]!;
}

export function listMonitoredAccounts(db: HealthspanDb) {
  return db
    .select()
    .from(creatorPlatformAccounts)
    .all()
    .filter((a) => a.monitored && a.enabled);
}
