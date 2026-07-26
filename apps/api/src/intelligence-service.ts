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

/**
 * Mark every open review task for a content item stale.
 *
 * Lives here rather than in a review module because this is the only caller: it is part
 * of the reassessment flow, not of the review surface. The review reads and the resolve
 * path moved to `@healthspan/runtime` when that domain was ported; this one stayed
 * behind with `intelligence-service.ts`, which is still a `pending` ledger row and still
 * synchronous.
 */
export function markOpenReviewsStaleForContent(
  db: HealthspanDb,
  contentItemId: string,
  reason: string,
) {
  const open = db
    .select()
    .from(liveReviewTasks)
    .where(eq(liveReviewTasks.contentItemId, contentItemId))
    .all()
    .filter((t) => t.status === 'open');
  for (const task of open) {
    db.update(liveReviewTasks)
      .set({
        status: 'stale',
        resolutionJson: JSON.stringify({ reason, markedAt: Date.now() }),
      })
      .where(eq(liveReviewTasks.id, task.id))
      .run();
  }
  return open.length;
}

function inputHash(record: NormalizedLiveRecord, rulesetVersion: string) {
  return createHash('sha256').update(JSON.stringify({ record, rulesetVersion })).digest('hex');
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
  const obj = db
    .select()
    .from(sourceObjects)
    .where(eq(sourceObjects.id, link.sourceObjectId))
    .all()[0];
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
