import { createHash, randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import {
  analysisSourceDependencies,
  claimRelationships,
  claimSourceSpans,
  contentIntelligenceState,
  contentItemSources,
  contentItems,
  intelligenceAnalyses,
  intelligenceRuns,
  liveClaims,
  liveReviewTasks,
  papers,
  regulatoryEvents,
  sourceObjects,
  trials,
  type HealthspanDb,
} from '@healthspan/db';
import {
  analyzeNormalizedRecord,
  detectClaimRelationship,
  type NormalizedLiveRecord,
} from '@healthspan/intelligence';
import { markOpenReviewsStaleForContent } from './review-service.js';

function inputHash(record: NormalizedLiveRecord, rulesetVersion: string) {
  return createHash('sha256')
    .update(JSON.stringify({ record, rulesetVersion }))
    .digest('hex');
}

function recordFromContent(
  db: HealthspanDb,
  item: typeof contentItems.$inferSelect,
): NormalizedLiveRecord {
  if (item.type === 'paper') {
    const paper = db.select().from(papers).where(eq(papers.contentItemId, item.id)).all()[0];
    return {
      type: 'paper',
      title: item.title,
      summary: item.summary,
      journal: paper?.journal,
      pmid: paper?.pmid,
      doi: paper?.doi,
      studyDesign: null,
      canonicalUrl: item.canonicalUrl,
      retractionOrCorrection: Boolean(paper?.isCorrectionOrRetraction),
    };
  }
  if (item.type === 'trial') {
    const trial = db.select().from(trials).where(eq(trials.contentItemId, item.id)).all()[0];
    return {
      type: 'trial',
      title: item.title,
      summary: item.summary,
      overallStatus: trial?.overallStatus,
      resultsPosted: trial?.resultsPosted ?? false,
      nctId: trial?.nctId,
      phases: trial?.phasesJson ? (JSON.parse(trial.phasesJson) as string[]) : [],
      canonicalUrl: item.canonicalUrl,
    };
  }
  if (item.type === 'regulatory_event') {
    const reg = db
      .select()
      .from(regulatoryEvents)
      .where(eq(regulatoryEvents.contentItemId, item.id))
      .all()[0];
    return {
      type: 'regulatory_event',
      title: item.title,
      summary: item.summary,
      canonicalUrl: item.canonicalUrl ?? reg?.officialUrl,
      relevanceMatched: reg?.relevanceMatched ?? false,
    };
  }
  return {
    type: item.type,
    title: item.title,
    summary: item.summary,
    canonicalUrl: item.canonicalUrl,
  };
}

function currentSourceVersionId(db: HealthspanDb, contentItemId: string): string | null {
  const link = db
    .select()
    .from(contentItemSources)
    .where(eq(contentItemSources.contentItemId, contentItemId))
    .all()[0];
  if (!link) return null;
  const obj = db.select().from(sourceObjects).where(eq(sourceObjects.id, link.sourceObjectId)).all()[0];
  return obj?.currentVersionId ?? null;
}

export function markIntelligenceStale(
  db: HealthspanDb,
  contentItemId: string,
  reason = 'source_version_changed',
) {
  const now = Date.now();
  const existing = db
    .select()
    .from(contentIntelligenceState)
    .where(eq(contentIntelligenceState.contentItemId, contentItemId))
    .all()[0];
  if (!existing) {
    db.insert(contentIntelligenceState)
      .values({
        contentItemId,
        currentAnalysisId: null,
        stale: true,
        staleReason: reason,
        updatedAt: now,
      })
      .run();
  } else {
    db.update(contentIntelligenceState)
      .set({ stale: true, staleReason: reason, updatedAt: now })
      .where(eq(contentIntelligenceState.contentItemId, contentItemId))
      .run();
  }
  markOpenReviewsStaleForContent(db, contentItemId, reason);
}

export function intelligenceStatus(db: HealthspanDb) {
  const runs = db.select().from(intelligenceRuns).orderBy(desc(intelligenceRuns.startedAt)).limit(5).all();
  const states = db.select().from(contentIntelligenceState).all();
  const staleCount = states.filter((s) => s.stale).length;
  const assessed = states.filter((s) => s.currentAnalysisId).length;
  const openReviews = db
    .select()
    .from(liveReviewTasks)
    .all()
    .filter((t) => t.status === 'open').length;
  return {
    dataMode: 'live' as const,
    rulesetVersion: 'm3.deterministic.1',
    assessedCount: assessed,
    staleCount,
    openReviewTaskCount: openReviews,
    recentRuns: runs.map((r) => ({
      id: r.id,
      status: r.status,
      trigger: r.trigger,
      completedCount: r.completedCount,
      startedAt: new Date(r.startedAt).toISOString(),
      completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : null,
      summary: r.summary,
    })),
  };
}

export function listIntelligenceRuns(db: HealthspanDb, limit = 50) {
  return db
    .select()
    .from(intelligenceRuns)
    .orderBy(desc(intelligenceRuns.startedAt))
    .limit(Math.min(100, Math.max(1, limit)))
    .all();
}

export function getIntelligenceRun(db: HealthspanDb, id: string) {
  return db.select().from(intelligenceRuns).where(eq(intelligenceRuns.id, id)).all()[0] ?? null;
}

export function listLiveClaims(
  db: HealthspanDb,
  query: {
    page?: number;
    pageSize?: number;
    claimKind?: string;
    assertionRole?: string;
    reviewStatus?: string;
    q?: string;
  },
) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  const offset = (page - 1) * pageSize;
  let rows = db.select().from(liveClaims).orderBy(desc(liveClaims.createdAt)).all();
  if (query.claimKind) rows = rows.filter((r) => r.claimKind === query.claimKind);
  if (query.assertionRole) rows = rows.filter((r) => r.assertionRole === query.assertionRole);
  if (query.reviewStatus) rows = rows.filter((r) => r.reviewStatus === query.reviewStatus);
  if (query.q) {
    const q = query.q.toLowerCase();
    rows = rows.filter((r) => r.claimText.toLowerCase().includes(q));
  }
  const total = rows.length;
  const pageRows = rows.slice(offset, offset + pageSize);
  return {
    items: pageRows.map((claim) => {
      const spans = db
        .select()
        .from(claimSourceSpans)
        .where(eq(claimSourceSpans.claimId, claim.id))
        .all();
      return {
        id: claim.id,
        analysisId: claim.analysisId,
        contentItemId: claim.contentItemId,
        claimKind: claim.claimKind,
        assertionRole: claim.assertionRole,
        claimText: claim.claimText,
        direction: claim.direction,
        outcomeFamily: claim.outcomeFamily,
        extractionMethod: claim.extractionMethod,
        classificationConfidence: claim.classificationConfidence,
        reviewStatus: claim.reviewStatus,
        active: claim.active,
        createdAt: new Date(claim.createdAt).toISOString(),
        spans: spans.map((s) => ({
          id: s.id,
          fieldPath: s.fieldPath,
          excerpt: s.excerpt,
          primarySupport: s.primarySupport,
        })),
      };
    }),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function getLiveClaim(db: HealthspanDb, id: string) {
  const claim = db.select().from(liveClaims).where(eq(liveClaims.id, id)).all()[0];
  if (!claim) return null;
  const spans = db.select().from(claimSourceSpans).where(eq(claimSourceSpans.claimId, id)).all();
  const item = db.select().from(contentItems).where(eq(contentItems.id, claim.contentItemId)).all()[0];
  const relationships = db
    .select()
    .from(claimRelationships)
    .all()
    .filter((r) => r.leftClaimId === id || r.rightClaimId === id);
  return {
    claim: {
      ...claim,
      createdAt: new Date(claim.createdAt).toISOString(),
    },
    item: item ? { id: item.id, title: item.title, type: item.type } : null,
    spans,
    relationships,
  };
}

export async function runIntelligenceAnalysis(opts: {
  db: HealthspanDb;
  contentItemIds?: string[];
  trigger?: string;
  limit?: number;
  staleOnly?: boolean;
}) {
  const started = Date.now();
  const runId = randomUUID();
  let items = opts.contentItemIds?.length
    ? opts.db
        .select()
        .from(contentItems)
        .all()
        .filter((i) => opts.contentItemIds!.includes(i.id))
    : opts.db
        .select()
        .from(contentItems)
        .orderBy(desc(contentItems.lastSeenAt))
        .limit(opts.limit ?? 50)
        .all();

  if (opts.staleOnly) {
    const staleIds = new Set(
      opts.db
        .select()
        .from(contentIntelligenceState)
        .all()
        .filter((s) => s.stale)
        .map((s) => s.contentItemId),
    );
    items = items.filter((i) => staleIds.has(i.id));
  }

  opts.db
    .insert(intelligenceRuns)
    .values({
      id: runId,
      trigger: opts.trigger ?? 'manual',
      scope: opts.contentItemIds?.length ? 'selected' : opts.staleOnly ? 'stale' : 'recent',
      status: 'running',
      rulesetVersion: 'm3.deterministic.1',
      aiEnabled: false,
      requestedCount: items.length,
      startedAt: started,
    })
    .run();

  let completed = 0;
  let reviewTasks = 0;
  let reused = 0;

  for (const item of items) {
    const record = recordFromContent(opts.db, item);
    const analysis = analyzeNormalizedRecord(record);
    const hash = inputHash(record, analysis.rulesetVersion);
    const existing = opts.db
      .select()
      .from(intelligenceAnalyses)
      .where(eq(intelligenceAnalyses.contentItemId, item.id))
      .all()
      .find((a) => a.inputHash === hash && a.rulesetVersion === analysis.rulesetVersion);

    let analysisId = existing?.id;
    if (existing) {
      reused += 1;
    } else {
      const prior = opts.db
        .select()
        .from(intelligenceAnalyses)
        .where(eq(intelligenceAnalyses.contentItemId, item.id))
        .all()
        .filter((a) => !a.supersededAt);
      for (const old of prior) {
        opts.db
          .update(intelligenceAnalyses)
          .set({ supersededAt: Date.now() })
          .where(eq(intelligenceAnalyses.id, old.id))
          .run();
      }

      analysisId = randomUUID();
      opts.db
        .insert(intelligenceAnalyses)
        .values({
          id: analysisId,
          contentItemId: item.id,
          analysisMode: analysis.mode,
          inputHash: hash,
          rulesetVersion: analysis.rulesetVersion,
          segmentBuilderVersion: analysis.segmentBuilderVersion,
          claimSchemaVersion: analysis.claimSchemaVersion,
          status: 'complete',
          classificationConfidence: analysis.profile.classificationConfidence,
          assessmentCompleteness: analysis.claims.length ? 'claims_present' : 'profile_only',
          evidenceMaturity: analysis.profile.evidenceMaturity,
          evidenceAvailability: analysis.profile.evidenceAvailability,
          studyDesign: analysis.profile.studyDesign,
          organismLevel: analysis.profile.organismLevel,
          resultsPresent: analysis.profile.resultsPresent,
          researchActivity: analysis.researchActivity,
          translationGapsJson: JSON.stringify(analysis.profile.translationGaps),
          methodologicalSignalsJson: JSON.stringify(analysis.profile.methodologicalSignals),
          whatWouldChangeJson: JSON.stringify(analysis.profile.whatWouldChange),
          hallmarksJson: JSON.stringify(analysis.profile.potentialHallmarks),
          createdAt: Date.now(),
        })
        .run();

      const versionId = currentSourceVersionId(opts.db, item.id);
      opts.db
        .insert(analysisSourceDependencies)
        .values({
          id: randomUUID(),
          analysisId,
          contentItemId: item.id,
          sourceRecordVersionId: versionId,
          role: 'primary',
          createdAt: Date.now(),
        })
        .run();

      for (const claim of analysis.claims) {
        const claimId = randomUUID();
        opts.db
          .insert(liveClaims)
          .values({
            id: claimId,
            analysisId,
            contentItemId: item.id,
            fingerprint: claim.fingerprint,
            claimKind: claim.claimKind,
            assertionRole: claim.assertionRole,
            claimText: claim.claimText,
            direction: claim.direction,
            outcomeFamily: claim.outcomeFamily,
            extractionMethod: 'deterministic',
            classificationConfidence: claim.classificationConfidence,
            reviewStatus: claim.classificationConfidence === 'low' ? 'needs_review' : 'unreviewed',
            active: true,
            createdAt: Date.now(),
          })
          .run();
        opts.db
          .insert(claimSourceSpans)
          .values({
            id: randomUUID(),
            claimId,
            fieldPath: claim.fieldPath,
            excerpt: claim.primaryExcerpt,
            spanHash: createHash('sha256').update(claim.primaryExcerpt).digest('hex'),
            primarySupport: true,
            createdAt: Date.now(),
          })
          .run();

        if (claim.classificationConfidence === 'low' || record.retractionOrCorrection) {
          reviewTasks += 1;
          opts.db
            .insert(liveReviewTasks)
            .values({
              id: randomUUID(),
              contentItemId: item.id,
              claimId,
              analysisId,
              sourceRecordVersionId: versionId,
              expectedAnalysisId: analysisId,
              title: record.retractionOrCorrection
                ? `Retraction/correction review: ${item.title}`
                : `Review claim for ${item.title}`,
              reason: record.retractionOrCorrection
                ? 'Correction or retraction signal requires human confirmation.'
                : 'Low classification confidence on deterministic claim extraction.',
              status: 'open',
              confidence: 'low',
              createdAt: Date.now(),
            })
            .run();
        }
      }
    }

    opts.db
      .insert(contentIntelligenceState)
      .values({
        contentItemId: item.id,
        currentAnalysisId: analysisId!,
        lastSuccessfulAnalysisAt: Date.now(),
        stale: false,
        staleReason: null,
        updatedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: contentIntelligenceState.contentItemId,
        set: {
          currentAnalysisId: analysisId!,
          lastSuccessfulAnalysisAt: Date.now(),
          stale: false,
          staleReason: null,
          updatedAt: Date.now(),
        },
      })
      .run();
    completed += 1;
  }

  const activeClaims = opts.db
    .select()
    .from(liveClaims)
    .all()
    .filter((c) => c.active)
    .slice(0, 80);
  for (let i = 0; i < activeClaims.length; i += 1) {
    for (let j = i + 1; j < activeClaims.length; j += 1) {
      const left = activeClaims[i]!;
      const right = activeClaims[j]!;
      const detected = detectClaimRelationship(
        {
          fingerprint: left.fingerprint,
          assertionRole: left.assertionRole,
          claimText: left.claimText,
          direction: left.direction,
          outcomeFamily: left.outcomeFamily,
        },
        {
          fingerprint: right.fingerprint,
          assertionRole: right.assertionRole,
          claimText: right.claimText,
          direction: right.direction,
          outcomeFamily: right.outcomeFamily,
        },
      );
      if (!detected || detected.kind !== 'potentially_conflicts') continue;
      opts.db
        .insert(claimRelationships)
        .values({
          id: randomUUID(),
          leftClaimId: left.id,
          rightClaimId: right.id,
          relationship: detected.kind,
          comparabilityJson: JSON.stringify({
            populationCompatible: detected.populationCompatible,
            interventionCompatible: detected.interventionCompatible,
            outcomeCompatible: detected.outcomeCompatible,
          }),
          rationale: detected.rationale,
          rulesetVersion: 'm3.relationships.1',
          createdAt: Date.now(),
        })
        .onConflictDoNothing()
        .run();
    }
  }

  opts.db
    .update(intelligenceRuns)
    .set({
      status: 'succeeded',
      completedAt: Date.now(),
      completedCount: completed,
      deterministicCount: completed - reused,
      reusedCount: reused,
      reviewTaskCount: reviewTasks,
      summary: `Analysed ${completed} items (${reused} reused)`,
    })
    .where(eq(intelligenceRuns.id, runId))
    .run();

  return {
    runId,
    status: 'succeeded' as const,
    completed,
    reused,
    reviewTasks,
  };
}

export function liveRadarPoints(db: HealthspanDb, limit = 40) {
  const states = db.select().from(contentIntelligenceState).all();
  const points = [];
  for (const state of states) {
    if (!state.currentAnalysisId) continue;
    const analysis = db
      .select()
      .from(intelligenceAnalyses)
      .where(eq(intelligenceAnalyses.id, state.currentAnalysisId))
      .all()[0];
    const item = db.select().from(contentItems).where(eq(contentItems.id, state.contentItemId)).all()[0];
    if (!analysis || !item) continue;
    const maturityX: Record<string, number> = {
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
    const paper =
      item.type === 'paper'
        ? db.select().from(papers).where(eq(papers.contentItemId, item.id)).all()[0]
        : null;
    points.push({
      id: `radar-${item.id}`,
      label: item.title.slice(0, 48),
      itemId: item.id,
      itemType: item.type,
      evidenceMaturity: analysis.evidenceMaturity,
      evidenceX: maturityX[analysis.evidenceMaturity] ?? 0.2,
      attentionY: analysis.researchActivity,
      bubbleSize: analysis.resultsPresent ? 0.7 : 0.4,
      safetyConcern: item.type === 'regulatory_event' || Boolean(paper?.isCorrectionOrRetraction),
      formulaVersion: 'research_activity.v1',
      researchActivityRaw: analysis.researchActivity,
      stale: Boolean(state.stale),
      shape:
        item.type === 'paper'
          ? 'paper'
          : item.type === 'trial'
            ? 'trial'
            : item.type === 'regulatory_event'
              ? 'regulatory_event'
              : 'paper',
    });
    if (points.length >= limit) break;
  }
  return points;
}
