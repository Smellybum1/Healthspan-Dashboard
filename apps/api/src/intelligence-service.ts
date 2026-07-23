import { createHash, randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import {
  claimSourceSpans,
  contentIntelligenceState,
  contentItems,
  intelligenceAnalyses,
  intelligenceRuns,
  liveClaims,
  liveReviewTasks,
  papers,
  regulatoryEvents,
  trials,
  type HealthspanDb,
} from '@healthspan/db';
import { analyzeNormalizedRecord, type NormalizedLiveRecord } from '@healthspan/intelligence';

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

export async function runIntelligenceAnalysis(opts: {
  db: HealthspanDb;
  contentItemIds?: string[];
  trigger?: string;
  limit?: number;
}) {
  const started = Date.now();
  const runId = randomUUID();
  const items = opts.contentItemIds?.length
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

  opts.db
    .insert(intelligenceRuns)
    .values({
      id: runId,
      trigger: opts.trigger ?? 'manual',
      scope: opts.contentItemIds?.length ? 'selected' : 'recent',
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

        if (claim.classificationConfidence === 'low') {
          reviewTasks += 1;
          opts.db
            .insert(liveReviewTasks)
            .values({
              id: randomUUID(),
              contentItemId: item.id,
              claimId,
              analysisId,
              title: `Review claim for ${item.title}`,
              reason: 'Low classification confidence on deterministic claim extraction.',
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
        updatedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: contentIntelligenceState.contentItemId,
        set: {
          currentAnalysisId: analysisId!,
          lastSuccessfulAnalysisAt: Date.now(),
          stale: false,
          updatedAt: Date.now(),
        },
      })
      .run();
    completed += 1;
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
    points.push({
      id: `radar-${item.id}`,
      label: item.title.slice(0, 48),
      itemId: item.id,
      itemType: item.type,
      evidenceMaturity: analysis.evidenceMaturity,
      evidenceX: maturityX[analysis.evidenceMaturity] ?? 0.2,
      attentionY: analysis.researchActivity,
      bubbleSize: analysis.resultsPresent ? 0.7 : 0.4,
      safetyConcern: item.type === 'regulatory_event',
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
