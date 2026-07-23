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
} from '@healthspan/db';
import { runIngestion } from './ingest.js';

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
      dbPath: live.paths.dbPath,
      dataDir: live.paths.dataDir,
      dbDoctor: doctor,
      asOf: new Date().toISOString(),
    });
  });

  app.get('/api/mode', (c) => c.json({ dataMode: currentMode(), mode: currentMode() }));

  app.post('/api/mode', async (c) => {
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
      radar: [],
      radarUnavailableReason:
        'Evidence classification arrives in Milestone 3. Live Signal Radar is unavailable to avoid implying scientific strength.',
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
    const q = (c.req.query('q') ?? '').toLowerCase();
    let items = live.db.select().from(contentItems).all();
    if (type) items = items.filter((i) => i.type === type);
    if (q) {
      items = items.filter(
        (i) => i.title.toLowerCase().includes(q) || (i.summary ?? '').toLowerCase().includes(q),
      );
    }
    return c.json({
      count: items.length,
      items: items.map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        summary: i.summary ?? '',
        tags: [],
        publishedAt: i.sourcePublishedAt ? new Date(i.sourcePublishedAt).toISOString() : null,
        updatedAt: new Date(i.updatedAt).toISOString(),
        officialUrl: i.canonicalUrl ?? undefined,
        dataOrigin: 'live',
      })),
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
      assessmentStatus: 'Not yet assessed',
      demoNotice: null,
      dataMode: 'live',
      dataOrigin: 'live',
    });
  });

  app.get('/api/search', (c) => {
    const q = c.req.query('q') ?? '';
    if (currentMode() === 'demo') {
      const items = demoRepo.searchItems(q);
      return c.json({ query: q, count: items.length, items, dataMode: 'demo', dataOrigin: 'demo' });
    }
    const items = live.db
      .select()
      .from(contentItems)
      .all()
      .filter(
        (i) =>
          i.title.toLowerCase().includes(q.toLowerCase()) ||
          (i.summary ?? '').toLowerCase().includes(q.toLowerCase()),
      )
      .map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        summary: i.summary ?? '',
        tags: [],
        publishedAt: i.sourcePublishedAt ? new Date(i.sourcePublishedAt).toISOString() : null,
        updatedAt: new Date(i.updatedAt).toISOString(),
        dataOrigin: 'live' as const,
      }));
    return c.json({ query: q, count: items.length, items, dataMode: 'live', dataOrigin: 'live' });
  });

  app.get('/api/sources', (c) => {
    const rows = live.db.select().from(sources).all();
    const feeds = live.db.select().from(sourceFeeds).all();
    return c.json({
      dataMode: currentMode(),
      mode: currentMode(),
      sources: rows.map((s) => ({
        ...s,
        health: mapSourceHealth(s.healthState),
        lastSuccessfulFetchAt: s.lastSuccessAt ? new Date(s.lastSuccessAt).toISOString() : null,
      })),
      feeds,
      paths: { dbPath: live.paths.dbPath, rawDir: live.paths.rawDir, dataDir: live.paths.dataDir },
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
    const body = (await c.req.json().catch(() => ({}))) as {
      sourceId?: string;
      recordCap?: number;
    };
    const sourceId =
      (body.sourceId as 'pubmed' | 'clinicaltrials-gov' | 'crossref' | 'tga' | 'all' | undefined) ??
      'all';
    const result = await runIngestion({
      db: live.db,
      rawStore,
      sourceId,
      trigger: 'manual',
      recordCap: body.recordCap ?? Number(process.env.HEALTHSPAN_LIVE_SMOKE_RECORD_CAP ?? 25),
      isBaseline: live.db.select().from(contentItems).all().length === 0,
    });
    return c.json(result);
  });

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

  (app as unknown as { __close?: () => void }).__close = () => closeDatabase(live.sqlite);

  return app;
}

export type AppType = ReturnType<typeof createApp>;
