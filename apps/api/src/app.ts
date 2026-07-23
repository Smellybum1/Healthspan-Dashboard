import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { desc, eq } from 'drizzle-orm';
import {
  createSeedRepository,
  openDatabase,
  seedOperationalSources,
  FileRawSnapshotStore,
  databaseDoctor,
  closeDatabase,
  sources,
  sourceFeeds,
  ingestionRuns,
  changeEvents,
  contentItems,
  papers,
  trials,
  regulatoryEvents,
  contentIntelligenceState,
  intelligenceAnalyses,
  liveClaims,
  claimSourceSpans,
} from '@healthspan/db';
import { runIngestion } from './ingest.js';
import { assertAdminMutationAllowed, warnIfRemoteAdminEnabled } from './admin-guard.js';
import {
  enqueueJob,
  getJob,
  listJobs,
  startJobWorker,
  stableDedupeKey,
} from './jobs.js';
import { createLocalScheduler } from './local-scheduler.js';
import { liveRadarPoints, runIntelligenceAnalysis, intelligenceStatus, listIntelligenceRuns, getIntelligenceRun, listLiveClaims, getLiveClaim } from './intelligence-service.js';
import { listContentItems } from './content-service.js';
import {
  listReviewTasks,
  listReviewDecisions,
  resolveReviewTask,
  REVIEW_ACTIONS,
  type ReviewAction,
} from './review-service.js';
import { getAssessment, listAssessments } from './assessment-service.js';
import {
  bootstrapInterventionCatalog,
  buildDossierSnapshot,
  getDossier,
  listEntityResolutionTasks,
  listInterventionEntities,
  runMentionExtractionAndResolution,
} from './dossier-service.js';
import { enrichEntityIdentity } from './identity-enrich-runner.js';

type DataMode = 'demo' | 'live';

function currentMode(): DataMode {
  const mode = (process.env.HEALTHSPAN_DATA_MODE ?? 'live').toLowerCase();
  return mode === 'demo' ? 'demo' : 'live';
}

function mapSourceHealth(
  state: string,
): 'healthy' | 'degraded' | 'error' | 'unknown' | 'never_run' | 'failed' | 'disabled' | 'running' {
  if (
    state === 'healthy' ||
    state === 'degraded' ||
    state === 'error' ||
    state === 'unknown' ||
    state === 'never_run' ||
    state === 'failed' ||
    state === 'disabled' ||
    state === 'running'
  ) {
    return state;
  }
  return 'unknown';
}

function toBrief(
  item: {
    id: string;
    type: string;
    title: string;
    summary: string | null;
    canonicalUrl?: string | null;
  },
  meta?: string,
) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    summary: item.summary ?? '',
    meta,
    officialUrl: item.canonicalUrl ?? undefined,
    dataOrigin: 'live' as const,
  };
}

export function createApp() {
  const demoRepo = createSeedRepository();
  const allowRelative = process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1';
  const live = openDatabase({
    allowRelativeOverride: allowRelative,
    migrateOnOpen: true,
  });
  seedOperationalSources(live.db);
  const rawStore = new FileRawSnapshotStore(live.paths.rawDir);
  warnIfRemoteAdminEnabled();

  const scheduler = createLocalScheduler({
    db: live.db,
    enabled: process.env.HEALTHSPAN_SCHEDULER_ENABLED === 'true',
  });
  void scheduler.onStartupCatchup();

  const worker = startJobWorker({
    db: live.db,
    enabled: process.env.HEALTHSPAN_JOB_WORKER_ENABLED !== 'false',
    handler: async (job) => {
      if (job.kind === 'ingestion') {
        const sourceId =
          (job.payload.sourceId as
            | 'pubmed'
            | 'clinicaltrials-gov'
            | 'crossref'
            | 'tga'
            | 'all'
            | undefined) ?? 'all';
        const result = await runIngestion({
          db: live.db,
          rawStore,
          sourceId,
          trigger: (job.payload.trigger as 'manual' | 'scheduled' | 'cli' | 'test') ?? 'manual',
          recordCap: Number(job.payload.recordCap ?? 25),
        });
        const status =
          result && typeof result === 'object' && 'status' in result
            ? String((result as { status?: string }).status)
            : 'succeeded';
        if (status !== 'failed') {
          enqueueJob(live.db, {
            kind: 'intelligence',
            payload: { limit: 50, trigger: 'post_ingest', staleOnly: true },
            dedupeKey: stableDedupeKey('intelligence-post-ingest', {
              window: Math.floor(Date.now() / 60_000),
            }),
            priority: 30,
          });
        }
        return {
          status: status === 'failed' ? 'failed' : status === 'partial' ? 'partial' : 'succeeded',
          relatedRunId:
            result && typeof result === 'object' && 'parentRunId' in result
              ? String((result as { parentRunId?: string }).parentRunId)
              : undefined,
        };
      }
      if (job.kind === 'intelligence') {
        const result = await runIntelligenceAnalysis({
          db: live.db,
          limit: Number(job.payload.limit ?? 50),
          trigger: String(job.payload.trigger ?? 'manual'),
          staleOnly: Boolean(job.payload.staleOnly),
          contentItemIds: Array.isArray(job.payload.contentItemIds)
            ? (job.payload.contentItemIds as string[])
            : undefined,
        });
        return { status: result.status, relatedRunId: result.runId };
      }
      return { status: 'failed', error: `unsupported job kind: ${job.kind}` };
    },
  });

  const app = new Hono();

  app.use(
    '*',
    cors({
      origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
    }),
  );

  app.get('/health', (c) => {
    const doctor = databaseDoctor(live.sqlite);
    return c.json({
      ok: true,
      service: 'healthspan-dashboard-api',
      dataMode: currentMode(),
      mode: currentMode(),
      persistence: currentMode() === 'demo' ? demoRepo.mode : 'sqlite',
      database: {
        status: doctor.ok ? 'healthy' : 'degraded',
        integrity: doctor.integrity,
        journalMode: doctor.journalMode,
        migrationVersion: '0004_m4_interventions',
      },
      scheduler: scheduler.getStatus(),
      asOf: new Date().toISOString(),
    });
  });

  app.get('/api/mode', (c) => c.json({ dataMode: currentMode(), mode: currentMode() }));

  app.post('/api/mode', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    const body = (await c.req.json().catch(() => ({}))) as { mode?: string; dataMode?: string };
    const requested = body.dataMode ?? body.mode;
    const mode = requested === 'live' ? 'live' : requested === 'demo' ? 'demo' : null;
    if (!mode) return c.json({ error: 'mode must be demo|live' }, 400);
    process.env.HEALTHSPAN_DATA_MODE = mode;
    return c.json({ dataMode: mode, mode });
  });

  app.get('/api/dashboard', (c) => {
    if (currentMode() === 'demo') return c.json(demoRepo.getDashboardPayload());

    const contentCount = live.db.select().from(contentItems).all().length;
    const radar = liveRadarPoints(live.db, 40);
    const recentChanges = live.db
      .select()
      .from(changeEvents)
      .where(eq(changeEvents.isBaseline, false))
      .orderBy(desc(changeEvents.detectedAt))
      .limit(20)
      .all();
    const sourceRows = live.db.select().from(sources).all();
    const recentPapers = live.db
      .select()
      .from(contentItems)
      .where(eq(contentItems.type, 'paper'))
      .orderBy(desc(contentItems.lastSeenAt))
      .limit(8)
      .all();
    const recentTrials = live.db
      .select()
      .from(contentItems)
      .where(eq(contentItems.type, 'trial'))
      .orderBy(desc(contentItems.lastSeenAt))
      .limit(8)
      .all();
    const safety = live.db
      .select()
      .from(contentItems)
      .where(eq(contentItems.type, 'regulatory_event'))
      .orderBy(desc(contentItems.lastSeenAt))
      .limit(8)
      .all();

    const paperMeta = new Map(
      live.db
        .select()
        .from(papers)
        .all()
        .map((p) => [p.contentItemId, p] as const),
    );
    const trialMeta = new Map(
      live.db
        .select()
        .from(trials)
        .all()
        .map((t) => [t.contentItemId, t] as const),
    );
    const safetyMeta = new Map(
      live.db
        .select()
        .from(regulatoryEvents)
        .all()
        .map((r) => [r.contentItemId, r] as const),
    );

    return c.json({
      asOf: new Date().toISOString(),
      dataMode: 'live',
      dataOrigin: 'live',
      demoNotice: null,
      lastVisitAt: null,
      firstSyncRequired: contentCount === 0,
      liveEmptySections: ['interventions', 'peptides', 'creators', 'radar', 'needs_review'],
      sources: sourceRows.map((s) => ({
        id: s.id,
        name: s.displayName,
        kind: s.kind,
        homepageUrl: s.officialBaseUrl,
        health: mapSourceHealth(s.healthState),
        lastSuccessfulFetchAt: s.lastSuccessAt ? new Date(s.lastSuccessAt).toISOString() : null,
        lastError: s.lastError,
        dataOrigin: 'live',
      })),
      changes: recentChanges.map((ch) => ({
        id: ch.id,
        kind: ch.kind,
        title: ch.title,
        summary: ch.summary ?? '',
        occurredAt: new Date(ch.occurredAt).toISOString(),
        relatedItemIds: ch.contentItemId ? [ch.contentItemId] : [],
        importance: (ch.importance as 'low' | 'medium' | 'high') ?? 'medium',
        dataOrigin: 'live',
      })),
      radar,
      radarUnavailableReason:
        radar.length === 0
          ? 'No Live evidence analyses yet. Run intelligence analysis after ingestion. Research-activity Signal Radar uses deterministic evidence dimensions — never a composite longevity score.'
          : null,
      trialPulse: recentTrials.map((item) => {
        const t = trialMeta.get(item.id);
        return toBrief(
          item,
          t ? `${t.overallStatus}${t.nctId ? ` · ${t.nctId}` : ''}` : undefined,
        );
      }),
      interventionWatch: [],
      safetyEvents: safety.map((item) => {
        const r = safetyMeta.get(item.id);
        return toBrief(item, r?.category ?? r?.authority ?? undefined);
      }),
      researchBrief: recentPapers.map((item) => {
        const p = paperMeta.get(item.id);
        return toBrief(
          item,
          [p?.journal, p?.pmid ? `PMID ${p.pmid}` : null].filter(Boolean).join(' · ') || undefined,
        );
      }),
      creatorClaims: [],
      needsReview: [],
    });
  });

  app.get('/api/items', (c) => {
    if (currentMode() === 'demo') {
      const q = c.req.query('q') ?? undefined;
      const type = c.req.query('type') ?? undefined;
      const peerReviewStatus = c.req.query('peerReviewStatus') ?? undefined;
      const trialStatus = c.req.query('trialStatus') ?? undefined;
      const jurisdiction = c.req.query('jurisdiction') ?? undefined;
      const items = demoRepo.filterItems({ q, type, peerReviewStatus, trialStatus, jurisdiction });
      return c.json({ count: items.length, items, dataMode: 'demo', dataOrigin: 'demo' });
    }

    const type = c.req.query('type');
    if (type === 'intervention' || type === 'peptide') {
      bootstrapInterventionCatalog(live.db);
      const listed = listInterventionEntities(live.db, {
        entityType: type === 'peptide' ? 'peptide' : 'intervention',
        page: Number(c.req.query('page') ?? 1),
        pageSize: Number(c.req.query('pageSize') ?? 25),
        q: c.req.query('q') ?? undefined,
      });
      return c.json({
        dataMode: 'live',
        dataOrigin: 'live',
        count: listed.items.length,
        items: listed.items.map((e) => ({
          id: e.id,
          type: type === 'peptide' ? 'peptide' : 'intervention',
          title: e.preferredName,
          summary: e.shortDescription ?? '',
          tags: [e.entityType, e.identityConfidence],
          updatedAt: new Date().toISOString(),
          dataOrigin: 'live' as const,
        })),
      });
    }

    const q = c.req.query('q') ?? undefined;
    const page = Number(c.req.query('page') ?? 1);
    const pageSize = Number(c.req.query('pageSize') ?? 25);
    const sort = (c.req.query('sort') as 'updated' | 'title' | 'published' | undefined) ?? 'updated';
    const result = listContentItems(live.db, { type, q, page, pageSize, sort });
    return c.json({
      count: result.total,
      page: result.page,
      pageSize: result.pageSize,
      items: result.items,
      dataMode: 'live',
      dataOrigin: 'live',
    });
  });

  app.get('/api/items/:id', (c) => {
    if (currentMode() === 'demo') {
      const found = demoRepo.getItemById(c.req.param('id'));
      if (!found) return c.json({ error: 'Not found' }, 404);
      return c.json({ ...found, dataMode: 'demo', dataOrigin: 'demo' });
    }
    const id = c.req.param('id');
    const item = live.db.select().from(contentItems).where(eq(contentItems.id, id)).all()[0];
    if (!item) return c.json({ error: 'Not found' }, 404);
    const paper = live.db.select().from(papers).where(eq(papers.contentItemId, id)).all()[0];
    const trial = live.db.select().from(trials).where(eq(trials.contentItemId, id)).all()[0];
    const regulatory = live.db
      .select()
      .from(regulatoryEvents)
      .where(eq(regulatoryEvents.contentItemId, id))
      .all()[0];
    const state = live.db
      .select()
      .from(contentIntelligenceState)
      .where(eq(contentIntelligenceState.contentItemId, id))
      .all()[0];
    const analysis = state?.currentAnalysisId
      ? live.db
          .select()
          .from(intelligenceAnalyses)
          .where(eq(intelligenceAnalyses.id, state.currentAnalysisId))
          .all()[0]
      : null;
    const claims = analysis
      ? live.db.select().from(liveClaims).where(eq(liveClaims.analysisId, analysis.id)).all()
      : [];
    const spans = claims.flatMap((claim) =>
      live.db
        .select()
        .from(claimSourceSpans)
        .where(eq(claimSourceSpans.claimId, claim.id))
        .all()
        .map((span) => ({ ...span, claimId: claim.id })),
    );
    return c.json({
      item: {
        id: item.id,
        type: item.type,
        title: item.title,
        summary: item.summary ?? '',
        tags: [],
        publishedAt: item.sourcePublishedAt ? new Date(item.sourcePublishedAt).toISOString() : null,
        updatedAt: new Date(item.updatedAt).toISOString(),
        firstSeenAt: new Date(item.firstSeenAt).toISOString(),
        lastSeenAt: new Date(item.lastSeenAt).toISOString(),
        officialUrl: item.canonicalUrl ?? undefined,
        dataOrigin: 'live',
        paper,
        trial,
        regulatory,
      },
      assessment: null,
      liveAnalysis: analysis
        ? {
            id: analysis.id,
            evidenceMaturity: analysis.evidenceMaturity,
            evidenceAvailability: analysis.evidenceAvailability,
            classificationConfidence: analysis.classificationConfidence,
            assessmentCompleteness: analysis.assessmentCompleteness,
            studyDesign: analysis.studyDesign,
            organismLevel: analysis.organismLevel,
            resultsPresent: analysis.resultsPresent,
            researchActivity: analysis.researchActivity,
            translationGaps: JSON.parse(analysis.translationGapsJson),
            methodologicalSignals: JSON.parse(analysis.methodologicalSignalsJson),
            whatWouldChange: JSON.parse(analysis.whatWouldChangeJson),
            rulesetVersion: analysis.rulesetVersion,
          }
        : null,
      liveClaims: claims.map((claim) => ({
        id: claim.id,
        claimText: claim.claimText,
        assertionRole: claim.assertionRole,
        claimKind: claim.claimKind,
        direction: claim.direction,
        classificationConfidence: claim.classificationConfidence,
        reviewStatus: claim.reviewStatus,
        spans: spans
          .filter((s) => s.claimId === claim.id)
          .map((s) => ({
            fieldPath: s.fieldPath,
            excerpt: s.excerpt,
            primarySupport: s.primarySupport,
          })),
      })),
      assessmentStatus: analysis
        ? `Live deterministic analysis (${analysis.rulesetVersion})`
        : 'Not yet assessed',
      demoNotice: null,
      dataMode: 'live',
      dataOrigin: 'live',
    });
  });

  app.get('/api/search', (c) => {
    const q = c.req.query('q') ?? '';
    const page = Math.max(1, Number(c.req.query('page') ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(c.req.query('pageSize') ?? 25)));
    if (currentMode() === 'demo') {
      const all = demoRepo.searchItems(q);
      const start = (page - 1) * pageSize;
      const items = all.slice(start, start + pageSize);
      return c.json({
        query: q,
        count: items.length,
        total: all.length,
        page,
        pageSize,
        items,
        dataMode: 'demo',
        dataOrigin: 'demo',
      });
    }
    const all = live.db
      .select()
      .from(contentItems)
      .all()
      .filter(
        (i) =>
          i.title.toLowerCase().includes(q.toLowerCase()) ||
          (i.summary ?? '').toLowerCase().includes(q.toLowerCase()),
      );
    const items = all.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize).map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      summary: i.summary ?? '',
      tags: [],
      publishedAt: i.sourcePublishedAt ? new Date(i.sourcePublishedAt).toISOString() : null,
      updatedAt: new Date(i.updatedAt).toISOString(),
      dataOrigin: 'live' as const,
    }));
    return c.json({
      query: q,
      count: items.length,
      total: all.length,
      page,
      pageSize,
      items,
      dataMode: 'live',
      dataOrigin: 'live',
    });
  });

  app.get('/api/sources', (c) => {
    const rows = live.db.select().from(sources).all();
    const feeds = live.db.select().from(sourceFeeds).all();
    return c.json({
      dataMode: currentMode(),
      mode: currentMode(),
      sources: rows.map((s) => ({
        id: s.id,
        displayName: s.displayName,
        kind: s.kind,
        officialBaseUrl: s.officialBaseUrl,
        enabled: s.enabled,
        health: mapSourceHealth(s.healthState),
        healthState: s.healthState,
        consecutiveFailures: s.consecutiveFailures,
        lastSuccessfulFetchAt: s.lastSuccessAt ? new Date(s.lastSuccessAt).toISOString() : null,
        lastError: s.lastError,
        baselineCompletedAt: s.baselineCompletedAt
          ? new Date(s.baselineCompletedAt).toISOString()
          : null,
      })),
      feeds: feeds.map((f) => ({
        id: f.id,
        sourceId: f.sourceId,
        feedKey: f.feedKey,
        category: f.category,
        enabled: f.enabled,
        baselineCompletedAt: f.baselineCompletedAt
          ? new Date(f.baselineCompletedAt).toISOString()
          : null,
        lastSuccessAt: f.lastSuccessAt ? new Date(f.lastSuccessAt).toISOString() : null,
        // URL retained intentionally for Source Health diagnostics of official endpoints
        url: f.url,
      })),
    });
  });

  app.get('/api/ingestion/runs', (c) => {
    const rows = live.db
      .select()
      .from(ingestionRuns)
      .orderBy(desc(ingestionRuns.startedAt))
      .limit(50)
      .all();
    return c.json({
      dataMode: currentMode(),
      runs: rows.map((r) => ({
        ...r,
        startedAt: new Date(r.startedAt).toISOString(),
        completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : null,
      })),
    });
  });

  app.post('/api/ingestion/run', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    const body = (await c.req.json().catch(() => ({}))) as {
      sourceId?: string;
      recordCap?: number;
    };
    const sourceId =
      (body.sourceId as 'pubmed' | 'clinicaltrials-gov' | 'crossref' | 'tga' | 'all' | undefined) ??
      'all';
    const payload = {
      sourceId,
      recordCap: body.recordCap ?? Number(process.env.HEALTHSPAN_LIVE_SMOKE_RECORD_CAP ?? 25),
      trigger: 'manual',
    };
    const { job, created } = enqueueJob(live.db, {
      kind: 'ingestion',
      payload,
      dedupeKey: stableDedupeKey('ingestion-manual', {
        sourceId,
        // coalesce identical in-flight manual requests
        window: Math.floor(Date.now() / 30_000),
      }),
      priority: 10,
    });
    return c.json(
      {
        accepted: true,
        created,
        jobId: job.id,
        status: job.status,
        kind: job.kind,
      },
      202,
    );
  });

  app.get('/api/jobs', (c) => {
    return c.json({
      jobs: listJobs(live.db).map((j) => ({
        id: j.id,
        kind: j.kind,
        status: j.status,
        attemptCount: j.attemptCount,
        lastError: j.lastError,
        relatedRunId: j.relatedRunId,
        createdAt: new Date(j.createdAt).toISOString(),
        startedAt: j.startedAt ? new Date(j.startedAt).toISOString() : null,
        completedAt: j.completedAt ? new Date(j.completedAt).toISOString() : null,
      })),
    });
  });

  app.get('/api/jobs/:id', (c) => {
    const job = getJob(live.db, c.req.param('id'));
    if (!job) return c.json({ error: 'Not found' }, 404);
    return c.json({
      id: job.id,
      kind: job.kind,
      status: job.status,
      attemptCount: job.attemptCount,
      lastError: job.lastError,
      relatedRunId: job.relatedRunId,
      payload: JSON.parse(job.payloadJson),
      createdAt: new Date(job.createdAt).toISOString(),
      startedAt: job.startedAt ? new Date(job.startedAt).toISOString() : null,
      completedAt: job.completedAt ? new Date(job.completedAt).toISOString() : null,
    });
  });

  app.post('/api/intelligence/run', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    const body = (await c.req.json().catch(() => ({}))) as {
      limit?: number;
      maxItems?: number;
      scope?: string;
      itemIds?: string[];
      staleOnly?: boolean;
    };
    const payload = {
      limit: body.maxItems ?? body.limit ?? 50,
      trigger: 'manual',
      staleOnly: body.staleOnly || body.scope === 'stale',
      contentItemIds: body.itemIds,
    };
    const { job, created } = enqueueJob(live.db, {
      kind: 'intelligence',
      payload,
      dedupeKey: stableDedupeKey('intelligence-manual', {
        window: Math.floor(Date.now() / 30_000),
      }),
      priority: 20,
    });
    return c.json(
      { accepted: true, created, jobId: job.id, status: job.status, kind: job.kind },
      202,
    );
  });

  app.get('/api/intelligence/status', (c) => {
    if (currentMode() === 'demo') {
      return c.json({
        dataMode: 'demo',
        rulesetVersion: 'demo',
        assessedCount: 0,
        staleCount: 0,
        openReviewTaskCount: 0,
        recentRuns: [],
        note: 'Demo mode uses seed assessments, not Live intelligence runs.',
      });
    }
    return c.json(intelligenceStatus(live.db));
  });

  app.get('/api/intelligence/runs', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', runs: [] });
    const runs = listIntelligenceRuns(live.db).map((r) => ({
      id: r.id,
      status: r.status,
      trigger: r.trigger,
      scope: r.scope,
      completedCount: r.completedCount,
      reusedCount: r.reusedCount,
      reviewTaskCount: r.reviewTaskCount,
      summary: r.summary,
      startedAt: new Date(r.startedAt).toISOString(),
      completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : null,
    }));
    return c.json({ dataMode: 'live', runs });
  });

  app.get('/api/intelligence/runs/:id', (c) => {
    if (currentMode() === 'demo') return c.json({ error: 'Not found in demo mode' }, 404);
    const run = getIntelligenceRun(live.db, c.req.param('id'));
    if (!run) return c.json({ error: 'Not found' }, 404);
    return c.json({
      dataMode: 'live',
      run: {
        ...run,
        startedAt: new Date(run.startedAt).toISOString(),
        completedAt: run.completedAt ? new Date(run.completedAt).toISOString() : null,
      },
    });
  });

  app.get('/api/claims', (c) => {
    if (currentMode() === 'demo') {
      return c.json({
        dataMode: 'demo',
        items: [],
        page: 1,
        pageSize: 25,
        total: 0,
        totalPages: 1,
        note: 'Live claims workspace is empty in Demo mode.',
      });
    }
    return c.json({
      dataMode: 'live',
      ...listLiveClaims(live.db, {
        page: Number(c.req.query('page') ?? 1),
        pageSize: Number(c.req.query('pageSize') ?? 25),
        claimKind: c.req.query('claimKind') ?? undefined,
        assertionRole: c.req.query('assertionRole') ?? undefined,
        reviewStatus: c.req.query('reviewStatus') ?? undefined,
        q: c.req.query('q') ?? undefined,
      }),
    });
  });

  app.get('/api/claims/:id', (c) => {
    if (currentMode() === 'demo') return c.json({ error: 'Not found in demo mode' }, 404);
    const detail = getLiveClaim(live.db, c.req.param('id'));
    if (!detail) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', ...detail });
  });

  app.get('/api/assessments', (c) => {
    if (currentMode() === 'demo') {
      return c.json({
        dataMode: 'demo',
        items: [],
        page: 1,
        pageSize: 25,
        total: 0,
        totalPages: 1,
        note: 'Live assessments list is empty in Demo mode.',
      });
    }
    return c.json({
      dataMode: 'live',
      ...listAssessments(live.db, {
        page: Number(c.req.query('page') ?? 1),
        pageSize: Number(c.req.query('pageSize') ?? 25),
        evidenceMaturity: c.req.query('evidenceMaturity') ?? undefined,
        evidenceAvailability: c.req.query('evidenceAvailability') ?? undefined,
        studyDesign: c.req.query('studyDesign') ?? undefined,
        organism: c.req.query('organism') ?? undefined,
        retractionOrCorrection: c.req.query('retractionOrCorrection') ?? undefined,
        q: c.req.query('q') ?? undefined,
      }),
    });
  });

  app.get('/api/assessments/:id', (c) => {
    if (currentMode() === 'demo') return c.json({ error: 'Not found in demo mode' }, 404);
    const detail = getAssessment(live.db, c.req.param('id'));
    if (!detail) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', ...detail });
  });

  app.get('/api/interventions', (c) => {
    if (currentMode() === 'demo') {
      const items = demoRepo.filterItems({ type: 'intervention' });
      return c.json({ dataMode: 'demo', dataOrigin: 'demo', count: items.length, items });
    }
    bootstrapInterventionCatalog(live.db);
    const listed = listInterventionEntities(live.db, {
      entityType: c.req.query('entityType') ?? 'intervention',
      page: Number(c.req.query('page') ?? 1),
      pageSize: Number(c.req.query('pageSize') ?? 50),
      q: c.req.query('q') ?? undefined,
    });
    return c.json({
      dataMode: 'live',
      dataOrigin: 'live',
      count: listed.items.length,
      page: listed.page,
      pageSize: listed.pageSize,
      total: listed.total,
      totalPages: listed.totalPages,
      items: listed.items.map((e) => ({
        id: e.id,
        type: e.entityType === 'peptide' ? 'peptide' : 'intervention',
        title: e.preferredName,
        summary: e.shortDescription ?? '',
        tags: [e.entityType, e.identityConfidence],
        updatedAt: new Date().toISOString(),
        dataOrigin: 'live' as const,
      })),
    });
  });

  app.get('/api/peptides', (c) => {
    if (currentMode() === 'demo') {
      const items = demoRepo.filterItems({ type: 'peptide' });
      return c.json({ dataMode: 'demo', dataOrigin: 'demo', count: items.length, items });
    }
    const listed = listInterventionEntities(live.db, {
      entityType: 'peptide',
      page: Number(c.req.query('page') ?? 1),
      pageSize: Number(c.req.query('pageSize') ?? 50),
      q: c.req.query('q') ?? undefined,
    });
    return c.json({
      dataMode: 'live',
      dataOrigin: 'live',
      count: listed.items.length,
      page: listed.page,
      pageSize: listed.pageSize,
      total: listed.total,
      totalPages: listed.totalPages,
      items: listed.items.map((e) => ({
        id: e.id,
        type: 'peptide',
        title: e.preferredName,
        summary: e.shortDescription ?? '',
        tags: [e.entityType, e.identityConfidence],
        updatedAt: new Date().toISOString(),
        dataOrigin: 'live' as const,
      })),
    });
  });

  app.get('/api/interventions/:id/dossier', (c) => {
    if (currentMode() === 'demo') {
      return c.json({ error: 'Live dossiers are Live-only; use Demo detail pages for seed dossiers.' }, 400);
    }
    const dossier = getDossier(live.db, c.req.param('id'));
    if (!dossier) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', ...dossier });
  });

  app.post('/api/interventions/resolve-mentions', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as { limit?: number };
    const result = runMentionExtractionAndResolution(live.db, body.limit ?? 100);
    return c.json({ accepted: true, ...result });
  });

  app.post('/api/interventions/:id/rebuild-dossier', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const built = buildDossierSnapshot(live.db, c.req.param('id'));
    if (!built) return c.json({ error: 'Not found' }, 404);
    return c.json({ ok: true, ...built });
  });

  app.post('/api/interventions/:id/enrich-identity', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as {
      useNetwork?: boolean;
      query?: string;
    };
    const result = await enrichEntityIdentity(live.db, c.req.param('id'), body);
    if (!result) return c.json({ error: 'Not found' }, 404);
    return c.json({ accepted: true, ...result });
  });

  app.get('/api/entity-resolution/tasks', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', tasks: [] });
    const tasks = listEntityResolutionTasks(live.db).map((t) => ({
      id: t.id,
      title: t.title,
      reason: t.reason,
      status: t.status,
      priority: t.priority,
      mentionId: t.mentionId,
      proposedEntityId: t.proposedEntityId,
      stale: t.stale,
      createdAt: new Date(t.createdAt).toISOString(),
    }));
    return c.json({ dataMode: 'live', tasks });
  });

  app.get('/api/review/tasks', (c) => {
    if (currentMode() === 'demo') {
      const seed = demoRepo.getDashboardPayload();
      return c.json({
        dataMode: 'demo',
        tasks: seed.needsReview,
      });
    }
    const tasks = listReviewTasks(live.db, {
      status: c.req.query('status') ?? undefined,
      limit: Number(c.req.query('limit') ?? 100),
    });
    return c.json({
      dataMode: 'live',
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        reason: t.reason,
        status: t.status,
        confidence: t.confidence,
        contentItemId: t.contentItemId,
        claimId: t.claimId,
        analysisId: t.analysisId,
        expectedAnalysisId: t.expectedAnalysisId,
        createdAt: new Date(t.createdAt).toISOString(),
      })),
    });
  });

  app.get('/api/review/decisions', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', decisions: [] });
    const decisions = listReviewDecisions(live.db).map((d) => ({
      id: d.id,
      taskId: d.taskId,
      action: d.action,
      claimId: d.claimId,
      notes: d.notes,
      editedClaimText: d.editedClaimText,
      createdAt: new Date(d.createdAt).toISOString(),
    }));
    return c.json({ dataMode: 'live', decisions });
  });

  app.post('/api/review/tasks/:id/resolve', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') {
      return c.json({ error: 'Review resolution is Live-only' }, 400);
    }
    const body = (await c.req.json().catch(() => ({}))) as {
      action?: string;
      notes?: string;
      editedClaimText?: string;
      expectedAnalysisId?: string;
    };
    if (!body.action || !(REVIEW_ACTIONS as readonly string[]).includes(body.action)) {
      return c.json({ error: 'Invalid action' }, 400);
    }
    const result = resolveReviewTask(live.db, {
      taskId: c.req.param('id'),
      action: body.action as ReviewAction,
      notes: body.notes,
      editedClaimText: body.editedClaimText,
      expectedAnalysisId: body.expectedAnalysisId,
    });
    if (!result.ok) return c.json({ error: result.error }, result.status);
    return c.json(result);
  });

  app.get('/api/scheduler', (c) => c.json(scheduler.getStatus()));

  app.get('/api/meta/seed', (c) => {
    const seed = demoRepo.getSeedBundle();
    return c.json({
      demoNotice: seed.demoNotice,
      generatedAt: seed.generatedAt,
      dataMode: currentMode(),
      mode: currentMode(),
      counts: {
        papers: seed.papers.length,
        trials: seed.trials.length,
        interventions: seed.interventions.length,
        peptides: seed.peptides.length,
        creators: seed.creators.length,
        claims: seed.claims.length,
        regulatoryEvents: seed.regulatoryEvents.length,
        organisations: seed.organisations.length,
        watchlists: seed.watchlists.length,
        changeEvents: seed.changeEvents.length,
        reviewTasks: seed.reviewTasks.length,
      },
    });
  });

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: err instanceof Error ? err.message : 'Server error' }, 500);
  });

  (app as unknown as { __close?: () => void }).__close = () => {
    worker.stop();
    scheduler.stop();
    closeDatabase(live.sqlite);
  };

  return app;
}

export type AppType = ReturnType<typeof createApp>;
