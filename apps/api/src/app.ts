import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { desc, eq } from 'drizzle-orm';
import {
  APP_VERSION,
  SCHEMA_VERSION,
  SecurityHeaders,
  hostAllowed,
  isLoopbackHost,
  originAllowed,
  fetchMetadataAllowed,
  createIntegritySession,
  getIntegritySession,
  validateCsrf,
} from '@healthspan/operations';
import {
  createSeedRepository,
  createLocalRepositories,
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
  claimRelationships,
  dossierChangeEvents,
  interventionEntities,
  creatorContentItems,
} from '@healthspan/db';
import { runIngestion } from './ingest.js';
import { assertAdminMutationAllowed, warnIfRemoteAdminEnabled } from './admin-guard.js';
import {
  enqueueJob,
  getJob,
  listJobs,
  startJobWorker,
  stableDedupeKey,
  JOB_PRIORITY,
} from './jobs.js';
import { createLocalScheduler } from './local-scheduler.js';
import { createPlatformScheduler } from './platform-scheduler.js';
import { buildSafeCreatorExportBundle, stripForbiddenExportFields } from './safe-response.js';
import {
  liveRadarPoints,
  runIntelligenceAnalysis,
  intelligenceStatus,
  listIntelligenceRuns,
  getIntelligenceRun,
  listLiveClaims,
  getLiveClaim,
} from './intelligence-service.js';
import {
  creatorWatchItems,
  getAssessment,
  listClaimEvidenceLinks,
  listCreatorReviewTasks,
  listIdentityTasks,
  getCreatorDetail,
  listAssessments,
  listContentItems,
  listCreatorClaims,
  listCreators,
  listRecurrenceSnapshots,
  listReviewDecisions,
  listReviewTasks,
  parseContentListQuery,
  resolveReviewTask,
} from '@healthspan/runtime';
import {
  addWatchlistItem,
  applyLegacyPreferenceImport,
  archiveSavedSearch,
  createMuteRule,
  createSavedSearch,
  createWatchlist,
  ensureLocalOwnerProfile,
  evaluateDeterministicAlerts,
  followTarget,
  generateBrief,
  getAlert,
  getBrief,
  getBriefingSettings,
  getSavedSearch,
  importLegacyPreferencesPreview,
  isFollowing,
  listAlerts,
  listBriefs,
  listSavedSearches,
  listWatchlistItems,
  listWatchlists,
  personalisationExport,
  recordVisit,
  removeWatchlistItem,
  renameWatchlist,
  runSavedSearch,
  setReadingState,
  setWatchlistActive,
  sinceLastVisit,
  unfollowTarget,
  updateAlertState,
  updateBriefingSettings,
} from './personalization-service.js';
import {
  createBackup,
  listBackups,
  recordRestoreAttempt,
  restorePreflight,
  storageUsage,
  verifyBackup,
} from './backup-service.js';
import { registerM6RemediationRoutes } from './m6-routes.js';
import { REVIEW_ACTIONS, type ReviewAction } from '@healthspan/core';
import {
  bootstrapInterventionCatalog,
  buildDossierSnapshot,
  getDossier,
  listEntityResolutionTasks,
  listInterventionEntities,
  runMentionExtractionAndResolution,
} from './dossier-service.js';
import { enrichEntityIdentity } from './identity-enrich-runner.js';
import {
  ENTITY_RESOLUTION_ACTIONS,
  resolveEntityResolutionTask,
  type EntityResolutionAction,
} from './entity-resolution-service.js';
import { compareInterventions } from './comparison-service.js';
import { linkTrialInterventionsToEntities } from './trial-portfolio.js';
import {
  listRegulatoryAssertions,
  listRegulatoryHistory,
  listRegulatoryProducts,
  listReportingPatterns,
  listSafetyItems,
  listSafetySignals,
  runRegulatoryRefresh,
  runSafetyRefresh,
  workspaceSummary,
} from './regulatory-safety-service.js';
import {
  bootstrapCreatorCatalog,
  importCreatorDocument,
  deleteCreatorDocument,
  ensureXBudgetRow,
  addYoutubeAccount,
  addXAccount,
  createManualCreatorClaim,
} from './creator-service.js';
import {
  resolveCreatorReviewTask,
  CREATOR_REVIEW_ACTIONS,
  type CreatorReviewAction,
} from './creator-review-service.js';
import {
  getYoutubeQuotaLedger,
  syncYoutubeMonitoredAccounts,
  applyYoutubeRetentionHold,
} from './youtube-sync-service.js';
import {
  getXBudgetStatus,
  syncXMonitoredAccounts,
  applyXComplianceBatch,
  getXComplianceStatus,
  runXComplianceReconciliation,
} from './x-sync-service.js';
import {
  addCreatorRole,
  addCommercialStatement,
  resolveIdentityTask,
  rebuildCreatorProfileSnapshot,
  redactProfileSnapshot,
} from './creator-identity-service.js';
import { rebuildClaimRecurrence } from './creator-recurrence-service.js';
import { linkCreatorClaimEvidence } from './creator-evidence-service.js';
import { runPlatformPolicyAudit, getPlatformSourceHealth } from './platform-policy-service.js';
import {
  creatorAiPolicyNotes,
  gateCreatorAiSegment,
  isCreatorAiEnabled,
} from '@healthspan/creators';
import { fdaBulkSourceSchedules, scheduleForSource } from './source-schedule.js';

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
  // Hosted-reachable services resolve through these ports rather than `live.db`, so the
  // same handlers run against the D1 adapter with no branch at the call site. One
  // adapter is bound per runtime — never both.
  const repositories = createLocalRepositories(live.db);
  warnIfRemoteAdminEnabled();

  const scheduler = createLocalScheduler({
    db: live.db,
    enabled: process.env.HEALTHSPAN_SCHEDULER_ENABLED === 'true',
  });
  void scheduler.onStartupCatchup();

  const platformScheduler = createPlatformScheduler({
    db: live.db,
    enabled: process.env.HEALTHSPAN_SCHEDULER_ENABLED === 'true',
  });
  void platformScheduler.onStartupCatchup();

  const worker = startJobWorker({
    db: live.db,
    enabled: process.env.HEALTHSPAN_JOB_WORKER_ENABLED !== 'false',
    handler: async (job) => {
      if (job.kind === 'ingestion') {
        const sourceId =
          (job.payload.sourceId as
            'pubmed' | 'clinicaltrials-gov' | 'crossref' | 'tga' | 'all' | undefined) ?? 'all';
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
            priority: JOB_PRIORITY.POST_INGEST_INTELLIGENCE,
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
      if (job.kind === 'enrich_crossref_doi') {
        const doi = typeof job.payload.doi === 'string' ? job.payload.doi : null;
        if (!doi) return { status: 'failed' as const };
        const result = await runIngestion({
          db: live.db,
          rawStore,
          sourceId: 'crossref',
          trigger: 'manual',
          recordCap: 1,
          crossrefDois: [doi],
        });
        const status =
          result && typeof result === 'object' && 'status' in result
            ? String((result as { status?: string }).status)
            : 'succeeded';
        return {
          status: status === 'failed' ? 'failed' : status === 'partial' ? 'partial' : 'succeeded',
        };
      }
      if (job.kind === 'sync_youtube_channel') {
        applyYoutubeRetentionHold(live.db);
        const result = await syncYoutubeMonitoredAccounts(live.db, {
          creatorId: typeof job.payload.creatorId === 'string' ? job.payload.creatorId : undefined,
          baseline: Boolean(job.payload.baseline),
          lookbackDays:
            typeof job.payload.lookbackDays === 'number' ? job.payload.lookbackDays : undefined,
        });
        if (!result.ok) {
          const failStatus = String((result as { status?: string }).status ?? 'failed');
          return {
            status: failStatus === 'quota_exhausted' ? 'partial' : 'failed',
            error: String((result as { error?: string }).error ?? failStatus),
          };
        }
        return { status: 'succeeded' };
      }
      if (job.kind === 'sync_x_account') {
        const result = await syncXMonitoredAccounts(live.db, {
          creatorId: typeof job.payload.creatorId === 'string' ? job.payload.creatorId : undefined,
          baseline: Boolean(job.payload.baseline),
          lookbackDays:
            typeof job.payload.lookbackDays === 'number' ? job.payload.lookbackDays : undefined,
        });
        if (!result.ok) {
          const failStatus = String((result as { status?: string }).status ?? 'failed');
          return {
            status: failStatus === 'budget_blocked' ? 'partial' : 'failed',
            error: String((result as { error?: string }).error ?? failStatus),
          };
        }
        return { status: 'succeeded' };
      }
      if (job.kind === 'run_x_batch_compliance' || job.kind === 'purge_x_content') {
        const actions = Array.isArray(job.payload.actions)
          ? (job.payload.actions as Array<{
              postId: string;
              action: 'delete' | 'withhold' | 'edit' | 'account_unavailable';
              reason: string;
            }>)
          : undefined;
        const result = runXComplianceReconciliation(live.db, {
          actions,
          backgroundJobId: job.id,
          trigger: String(job.payload.trigger ?? job.kind),
        });
        return {
          status: result.ok ? 'succeeded' : 'failed',
          relatedRunId: result.jobResultId,
        };
      }
      return { status: 'failed', error: `unsupported job kind: ${job.kind}` };
    },
  });

  const app = new Hono();
  const rateBuckets = new Map<string, { count: number; resetAt: number }>();
  const csrfEnabled = process.env.HEALTHSPAN_CSRF_ENABLED !== 'false';
  const SESSION_COOKIE = 'healthspan_ri';

  function parseCookie(header: string | undefined): Record<string, string> {
    const out: Record<string, string> = {};
    if (!header) return out;
    for (const part of header.split(';')) {
      const [k, ...rest] = part.trim().split('=');
      if (!k) continue;
      out[k] = decodeURIComponent(rest.join('=') ?? '');
    }
    return out;
  }

  app.use('*', async (c, next) => {
    for (const [k, v] of Object.entries(SecurityHeaders)) {
      c.header(k, v);
    }
    const host = c.req.header('host');
    if (host && !hostAllowed(host) && process.env.HEALTHSPAN_ALLOW_REMOTE_BIND !== 'true') {
      return c.json({ error: 'Host not allowed' }, 403);
    }
    if (process.env.HEALTHSPAN_ALLOW_REMOTE_BIND === 'true' && host && !isLoopbackHost(host)) {
      const token = c.req.header('x-healthspan-remote-token');
      const expected = process.env.HEALTHSPAN_REMOTE_ACCESS_TOKEN ?? '';
      if (!expected || expected.length < 32 || token !== expected) {
        return c.json({ error: 'Remote access token required' }, 403);
      }
    }

    const method = c.req.method;
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const pathName = new URL(c.req.url).pathname;
    const isSessionBootstrap = pathName === '/api/session';
    const origin = c.req.header('origin');

    if (isMutation && !isSessionBootstrap) {
      const allowMissing = !csrfEnabled;
      if (!originAllowed(origin, host, { allowMissingOrigin: allowMissing })) {
        return c.json({ error: 'Origin not allowed' }, 403);
      }
      if (
        !fetchMetadataAllowed({
          secFetchSite: c.req.header('sec-fetch-site'),
          secFetchMode: c.req.header('sec-fetch-mode'),
          secFetchDest: c.req.header('sec-fetch-dest'),
        })
      ) {
        return c.json({ error: 'Fetch metadata rejected' }, 403);
      }
      if (csrfEnabled) {
        const cookies = parseCookie(c.req.header('cookie'));
        const session = getIntegritySession(cookies[SESSION_COOKIE]);
        const csrf = c.req.header('x-csrf-token') ?? c.req.header('x-healthspan-csrf');
        if (!validateCsrf(session, csrf ?? undefined)) {
          return c.json({ error: 'CSRF validation failed' }, 403);
        }
      }
    }

    const encoding = c.req.header('content-encoding');
    if (encoding && encoding.toLowerCase() !== 'identity') {
      return c.json({ error: 'Unsupported content encoding' }, 415);
    }

    const contentLength = Number(c.req.header('content-length') ?? 0);
    const jsonMax = Number(process.env.HEALTHSPAN_MAX_JSON_BYTES ?? 1_048_576);
    const importMax = Number(process.env.HEALTHSPAN_MAX_IMPORT_BYTES ?? 2_097_152);
    const uploadMax = Number(process.env.HEALTHSPAN_MAX_UPLOAD_BYTES ?? 10_485_760);
    if (contentLength > 0) {
      let limit = jsonMax;
      if (pathName.includes('/documents') || pathName.includes('/upload')) limit = uploadMax;
      else if (pathName.includes('/import') || pathName.includes('/preferences')) limit = importMax;
      if (contentLength > limit) {
        return c.json({ error: 'Request body too large', limit }, 413);
      }
    }

    const kind = isSessionBootstrap
      ? 'session'
      : pathName.includes('/backup') || pathName.includes('/diagnostics')
        ? pathName.includes('/backup')
          ? 'backup'
          : 'diagnostic'
        : isMutation
          ? 'mutation'
          : pathName.includes('search')
            ? 'heavy'
            : 'read';
    const bucketKey = `${kind}:${host ?? 'local'}`;
    const limits: Record<string, number> = {
      read: Number(process.env.HEALTHSPAN_RATE_READ_PER_MIN ?? 600),
      heavy: Number(process.env.HEALTHSPAN_RATE_HEAVY_PER_MIN ?? 120),
      mutation: Number(process.env.HEALTHSPAN_RATE_MUTATION_PER_MIN ?? 120),
      session: Number(process.env.HEALTHSPAN_RATE_SESSION_PER_MIN ?? 30),
      backup: Number(process.env.HEALTHSPAN_RATE_BACKUP_PER_MIN ?? 10),
      diagnostic: Number(process.env.HEALTHSPAN_RATE_DIAGNOSTIC_PER_MIN ?? 20),
    };
    const bucket = rateBuckets.get(bucketKey) ?? { count: 0, resetAt: Date.now() + 60_000 };
    if (Date.now() > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = Date.now() + 60_000;
    }
    bucket.count += 1;
    rateBuckets.set(bucketKey, bucket);
    if (bucket.count > (limits[kind] ?? 600)) {
      c.header('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - Date.now()) / 1000))));
      return c.json({ error: 'Rate limit exceeded', bucket: kind, retryAfterSec: 60 }, 429);
    }
    await next();
  });

  app.use(
    '*',
    cors({
      origin: [
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'http://127.0.0.1:8787',
        'http://localhost:8787',
      ],
      credentials: true,
      allowHeaders: [
        'Content-Type',
        'X-CSRF-Token',
        'X-Healthspan-CSRF',
        'X-Healthspan-Remote-Token',
      ],
    }),
  );

  ensureLocalOwnerProfile(live.db);

  app.get('/api/session', (c) => {
    const session = createIntegritySession();
    const secure = c.req.url.startsWith('https:');
    c.header(
      'Set-Cookie',
      `${SESSION_COOKIE}=${session.id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${secure ? '; Secure' : ''}`,
    );
    return c.json({
      csrfToken: session.csrfToken,
      expiresAt: new Date(session.expiresAt).toISOString(),
      cookie: SESSION_COOKIE,
    });
  });

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
        migrationVersion: `00${SCHEMA_VERSION}_m6_personalisation_ops`,
      },
      scheduler: scheduler.getStatus(),
      asOf: new Date().toISOString(),
    });
  });

  app.get('/api/version', (c) =>
    c.json({
      version: APP_VERSION,
      commit: process.env.HEALTHSPAN_BUILD_COMMIT ?? null,
      builtAt: process.env.HEALTHSPAN_BUILD_TIME ?? null,
      schemaVersion: SCHEMA_VERSION,
      runtimeMajor: Number(process.versions.node.split('.')[0]),
      dataMode: currentMode(),
    }),
  );

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

  app.get('/api/dashboard', async (c) => {
    if (currentMode() === 'demo') return c.json(demoRepo.getDashboardPayload());

    // The creator reads used to seed this catalog themselves on every call. Seeding is a
    // write, so it cannot live on a hosted read path; the local runtime keeps the same
    // behaviour by doing it here, before the shared service runs.
    bootstrapCreatorCatalog(live.db);
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
        return toBrief(item, t ? `${t.overallStatus}${t.nctId ? ` · ${t.nctId}` : ''}` : undefined);
      }),
      interventionWatch: (() => {
        bootstrapInterventionCatalog(live.db);
        const events = live.db
          .select()
          .from(dossierChangeEvents)
          .orderBy(desc(dossierChangeEvents.createdAt))
          .limit(12)
          .all();
        return events.map((ev) => {
          const entity = live.db
            .select()
            .from(interventionEntities)
            .where(eq(interventionEntities.id, ev.entityId))
            .all()[0];
          return {
            id: ev.id,
            type: 'intervention',
            title: entity?.preferredName ?? ev.entityId,
            summary: ev.changeSummary,
            meta: 'Dossier change (non-baseline)',
            dataOrigin: 'live' as const,
            href: `/interventions/${ev.entityId}`,
          };
        });
      })(),
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
      creatorClaims: await creatorWatchItems(repositories.creator, 8),
      needsReview: [],
    });
  });

  app.get('/api/items', async (c) => {
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
    if (type === 'creator') {
      bootstrapCreatorCatalog(live.db);
      const listed = await listCreators(repositories.creator, {
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
          type: 'creator' as const,
          title: e.preferredName,
          summary: e.neutralDescription ?? '',
          tags: [e.creatorKind, e.identityConfidence],
          updatedAt: new Date().toISOString(),
          dataOrigin: 'live' as const,
        })),
      });
    }

    // Shared with the hosted route so the two runtimes cannot disagree about what an
    // out-of-range page or an unrecognised sort means.
    const result = await listContentItems(
      repositories.content,
      parseContentListQuery({
        type,
        q: c.req.query('q'),
        page: c.req.query('page'),
        pageSize: c.req.query('pageSize'),
        sort: c.req.query('sort'),
      }),
    );
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
        nextRunAt: scheduleForSource(s.id)?.nextRunAt ?? null,
        scheduleCadence: scheduleForSource(s.id)?.cadence ?? null,
        scheduleNotes: scheduleForSource(s.id)?.notes ?? null,
      })),
      fdaBulkSchedules: fdaBulkSourceSchedules(),
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
      priority: JOB_PRIORITY.MANUAL_INGESTION,
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

  app.get('/api/claim-relationships', (c) => {
    if (currentMode() === 'demo') {
      return c.json({
        dataMode: 'demo',
        items: [],
        page: 1,
        pageSize: 50,
        total: 0,
        totalPages: 1,
      });
    }
    const page = Math.max(1, Number(c.req.query('page') ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(c.req.query('pageSize') ?? 50) || 50));
    const claimId = c.req.query('claimId') ?? undefined;
    const all = live.db
      .select()
      .from(claimRelationships)
      .all()
      .filter((r) => !claimId || r.leftClaimId === claimId || r.rightClaimId === claimId)
      .sort((a, b) => b.createdAt - a.createdAt);
    const total = all.length;
    const items = all.slice((page - 1) * pageSize, page * pageSize).map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt).toISOString(),
    }));
    return c.json({
      dataMode: 'live',
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  });

  app.get('/api/items/:id/intelligence', (c) => {
    if (currentMode() === 'demo') return c.json({ error: 'Not found in demo mode' }, 404);
    const itemId = c.req.param('id');
    const state = live.db
      .select()
      .from(contentIntelligenceState)
      .where(eq(contentIntelligenceState.contentItemId, itemId))
      .all()[0];
    const analyses = live.db
      .select()
      .from(intelligenceAnalyses)
      .where(eq(intelligenceAnalyses.contentItemId, itemId))
      .all()
      .sort((a, b) => b.createdAt - a.createdAt);
    return c.json({
      dataMode: 'live',
      contentItemId: itemId,
      state: state
        ? {
            ...state,
            updatedAt: state.updatedAt ? new Date(state.updatedAt).toISOString() : null,
          }
        : null,
      analyses: analyses.map((a) => ({
        id: a.id,
        rulesetVersion: a.rulesetVersion,
        createdAt: new Date(a.createdAt).toISOString(),
        evidenceMaturity: a.evidenceMaturity,
        evidenceAvailability: a.evidenceAvailability,
        studyDesign: a.studyDesign,
        organismLevel: a.organismLevel,
        classificationConfidence: a.classificationConfidence,
        assessmentCompleteness: a.assessmentCompleteness,
        researchActivity: a.researchActivity,
        translationGaps: JSON.parse(a.translationGapsJson || '[]'),
        methodologicalSignals: JSON.parse(a.methodologicalSignalsJson || '[]'),
        whatWouldChange: JSON.parse(a.whatWouldChangeJson || '[]'),
      })),
    });
  });

  app.get('/api/items/:id/assessment/history', (c) => {
    if (currentMode() === 'demo') return c.json({ error: 'Not found in demo mode' }, 404);
    const itemId = c.req.param('id');
    const analyses = live.db
      .select()
      .from(intelligenceAnalyses)
      .where(eq(intelligenceAnalyses.contentItemId, itemId))
      .all()
      .sort((a, b) => b.createdAt - a.createdAt);
    return c.json({
      dataMode: 'live',
      contentItemId: itemId,
      history: analyses.map((a) => ({
        analysisId: a.id,
        rulesetVersion: a.rulesetVersion,
        createdAt: new Date(a.createdAt).toISOString(),
        summary: {
          evidenceMaturity: a.evidenceMaturity,
          evidenceAvailability: a.evidenceAvailability,
          studyDesign: a.studyDesign,
          organismLevel: a.organismLevel,
          classificationConfidence: a.classificationConfidence,
          assessmentCompleteness: a.assessmentCompleteness,
          researchActivity: a.researchActivity,
          translationGaps: JSON.parse(a.translationGapsJson || '[]'),
          methodologicalSignals: JSON.parse(a.methodologicalSignalsJson || '[]'),
          whatWouldChange: JSON.parse(a.whatWouldChangeJson || '[]'),
          hallmarks: JSON.parse(a.hallmarksJson || '[]'),
        },
      })),
    });
  });

  app.get('/api/assessments', async (c) => {
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
      ...(await listAssessments(repositories.assessment, {
        page: Number(c.req.query('page') ?? 1),
        pageSize: Number(c.req.query('pageSize') ?? 25),
        evidenceMaturity: c.req.query('evidenceMaturity') ?? undefined,
        evidenceAvailability: c.req.query('evidenceAvailability') ?? undefined,
        studyDesign: c.req.query('studyDesign') ?? undefined,
        organism: c.req.query('organism') ?? undefined,
        retractionOrCorrection: c.req.query('retractionOrCorrection') ?? undefined,
        q: c.req.query('q') ?? undefined,
      })),
    });
  });

  app.get('/api/assessments/:id', async (c) => {
    if (currentMode() === 'demo') return c.json({ error: 'Not found in demo mode' }, 404);
    const detail = await getAssessment(repositories.assessment, c.req.param('id'));
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

  app.get('/api/interventions/compare', (c) => {
    if (currentMode() === 'demo') {
      return c.json(
        {
          error: 'Live comparison uses Live dossiers; switch to Live mode.',
        },
        400,
      );
    }
    const ids = (c.req.query('ids') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const result = compareInterventions(live.db, ids);
    if (!result.ok) return c.json({ error: result.error }, result.status);
    return c.json({ dataMode: 'live', ...result });
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

  app.get('/api/creators', async (c) => {
    if (currentMode() === 'demo') {
      const items = demoRepo.filterItems({ type: 'creator' });
      return c.json({ dataMode: 'demo', dataOrigin: 'demo', count: items.length, items });
    }
    bootstrapCreatorCatalog(live.db);
    const listed = await listCreators(repositories.creator, {
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
        type: 'creator',
        title: e.preferredName,
        summary: e.neutralDescription ?? '',
        tags: [e.creatorKind, e.identityConfidence],
        updatedAt: new Date().toISOString(),
        dataOrigin: 'live' as const,
      })),
    });
  });

  app.get('/api/creators/:id', async (c) => {
    if (currentMode() === 'demo') {
      const found = demoRepo.getItemById(c.req.param('id'));
      if (!found || found.item.type !== 'creator') return c.json({ error: 'Not found' }, 404);
      return c.json({
        ...found.item,
        assessment: found.assessment,
        dataMode: 'demo',
        dataOrigin: 'demo',
      });
    }
    bootstrapCreatorCatalog(live.db);
    const detail = await getCreatorDetail(repositories.creator, c.req.param('id'));
    if (!detail) return c.json({ error: 'Not found' }, 404);
    return c.json({
      dataMode: 'live',
      dataOrigin: 'live',
      type: 'creator',
      title: detail.preferredName,
      summary: detail.neutralDescription ?? '',
      ...detail,
    });
  });

  app.post('/api/creators/:id/youtube-accounts', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as { channelRef?: string };
    if (!body.channelRef) return c.json({ error: 'channelRef required' }, 400);
    const result = addYoutubeAccount(live.db, {
      creatorId: c.req.param('id'),
      channelRef: body.channelRef,
    });
    if (!result.ok) return c.json({ error: result.error }, result.status);
    return c.json({
      accepted: true,
      ...result,
      note: 'YouTube API metadata is never claim evidence. No unofficial captions, media download, or STT.',
    });
  });

  app.post('/api/creators/:id/youtube-sync', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as {
      baseline?: boolean;
      lookbackDays?: number;
    };
    const payload = {
      creatorId: c.req.param('id'),
      baseline: body.baseline ?? false,
      lookbackDays: body.lookbackDays,
      trigger: 'manual',
    };
    const { job, created } = enqueueJob(live.db, {
      kind: 'sync_youtube_channel',
      payload,
      dedupeKey: stableDedupeKey('sync_youtube_channel', {
        creatorId: payload.creatorId,
        window: Math.floor(Date.now() / 30_000),
      }),
      priority: JOB_PRIORITY.PLATFORM_SYNC,
    });
    return c.json(
      {
        accepted: true,
        created,
        jobId: job.id,
        status: job.status,
        kind: job.kind,
        note: 'YouTube API metadata is never claim evidence. Sync runs as a leased background job.',
      },
      202,
    );
  });

  app.get('/api/platforms/youtube/quota', (c) => {
    applyYoutubeRetentionHold(live.db);
    return c.json({ dataMode: currentMode(), ...getYoutubeQuotaLedger(live.db) });
  });

  app.post('/api/creators/:id/x-accounts', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as { username?: string };
    if (!body.username) return c.json({ error: 'username required' }, 400);
    const result = addXAccount(live.db, { creatorId: c.req.param('id'), username: body.username });
    if (!result.ok) return c.json({ error: result.error }, result.status);
    return c.json({ accepted: true, ...result });
  });

  app.post('/api/creators/:id/x-sync', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as {
      baseline?: boolean;
      lookbackDays?: number;
    };
    const payload = {
      creatorId: c.req.param('id'),
      baseline: body.baseline ?? false,
      lookbackDays: body.lookbackDays,
      trigger: 'manual',
    };
    const { job, created } = enqueueJob(live.db, {
      kind: 'sync_x_account',
      payload,
      dedupeKey: stableDedupeKey('sync_x_account', {
        creatorId: payload.creatorId,
        window: Math.floor(Date.now() / 30_000),
      }),
      priority: JOB_PRIORITY.PLATFORM_SYNC,
    });
    return c.json(
      {
        accepted: true,
        created,
        jobId: job.id,
        status: job.status,
        kind: job.kind,
        note: 'X sync is budget-gated and never sent to external AI.',
      },
      202,
    );
  });

  app.get('/api/platforms/x/budget', (c) => {
    ensureXBudgetRow(live.db);
    return c.json({ dataMode: currentMode(), ...getXBudgetStatus(live.db) });
  });

  app.get('/api/platforms/x/compliance', (c) => {
    return c.json({
      dataMode: currentMode(),
      ...getXComplianceStatus(live.db),
      scheduler: platformScheduler.getStatus(),
    });
  });

  app.post('/api/platforms/x/compliance', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as {
      actions?: Array<{
        postId: string;
        action: 'delete' | 'withhold' | 'edit' | 'account_unavailable';
        reason: string;
      }>;
      sync?: boolean;
    };
    // Immediate apply path for explicit action batches (tests + operators).
    if (
      body.sync === true ||
      (body.actions?.length && body.sync !== false && body.actions.length <= 50)
    ) {
      if (body.actions?.length) {
        const applied = applyXComplianceBatch(live.db, body.actions);
        const reconciled = runXComplianceReconciliation(live.db, {
          trigger: 'api_sync',
        });
        return c.json({
          accepted: true,
          mode: 'sync',
          ...applied,
          compliance: reconciled.compliance,
          externalAiAllowed: false,
        });
      }
    }
    const payload = {
      actions: body.actions ?? [],
      trigger: 'api',
      platform: 'x',
    };
    const { job, created } = enqueueJob(live.db, {
      kind: 'run_x_batch_compliance',
      payload,
      dedupeKey: stableDedupeKey('run_x_batch_compliance', {
        window: Math.floor(Date.now() / 15_000),
        hasActions: Boolean(body.actions?.length),
      }),
      priority: JOB_PRIORITY.COMPLIANCE,
    });
    return c.json(
      {
        accepted: true,
        created,
        jobId: job.id,
        status: job.status,
        kind: job.kind,
        externalAiAllowed: false,
      },
      202,
    );
  });

  app.get('/api/creators/:id/export', async (c) => {
    if (currentMode() === 'demo') {
      return c.json({
        dataMode: 'demo',
        export: buildSafeCreatorExportBundle({ creatorId: c.req.param('id') }),
      });
    }
    bootstrapCreatorCatalog(live.db);
    const detail = await getCreatorDetail(repositories.creator, c.req.param('id'));
    if (!detail) return c.json({ error: 'Not found' }, 404);
    const xPosts = live.db
      .select()
      .from(creatorContentItems)
      .all()
      .filter((item) => item.creatorId === detail.id && item.platform === 'x')
      .map((item) => ({
        postId: item.externalId,
        canonicalUrl: item.canonicalUrl,
        complianceState: item.currentState,
      }));
    const exportBundle = buildSafeCreatorExportBundle({
      creatorId: detail.id,
      preferredName: detail.preferredName,
      accounts: detail.accounts as unknown as Array<Record<string, unknown>>,
      documents: detail.documents as unknown as Array<Record<string, unknown>>,
      claims: detail.claims as unknown as Array<Record<string, unknown>>,
      youtubeVideos: detail.youtubeVideos as unknown as Array<Record<string, unknown>>,
      xPosts,
    });
    return c.json({
      dataMode: 'live',
      export: stripForbiddenExportFields(exportBundle),
    });
  });

  app.post('/api/creators/:id/claims', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as {
      claimText?: string;
      sourceUrl?: string;
      timestampOrPostId?: string;
      assertionRole?: string;
    };
    if (!body.claimText) return c.json({ error: 'claimText required' }, 400);
    const result = createManualCreatorClaim(live.db, {
      creatorId: c.req.param('id'),
      claimText: body.claimText,
      sourceUrl: body.sourceUrl,
      timestampOrPostId: body.timestampOrPostId,
      assertionRole: body.assertionRole,
    });
    if (!result.ok) return c.json({ error: result.error }, result.status);
    return c.json({ accepted: true, ...result });
  });

  app.get('/api/creator-claims', async (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', claims: [] });
    bootstrapCreatorCatalog(live.db);
    const claims = await listCreatorClaims(repositories.creator, {
      creatorId: c.req.query('creatorId') ?? undefined,
      limit: Number(c.req.query('limit') ?? 50),
    });
    return c.json({ dataMode: 'live', claims });
  });

  app.post('/api/creators/:id/documents', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as {
      filename?: string;
      contentBase64?: string;
      rightsBasis?: string;
      mediaType?: string;
      replacesDocumentId?: string;
      claimEligible?: boolean;
    };
    if (!body.filename || !body.contentBase64 || !body.rightsBasis) {
      return c.json({ error: 'filename, contentBase64, and rightsBasis are required' }, 400);
    }
    const bytes = Buffer.from(body.contentBase64, 'base64');
    const result = importCreatorDocument(live.db, {
      creatorId: c.req.param('id'),
      filename: body.filename,
      bytes,
      rightsBasis: body.rightsBasis as
        | 'user_owned'
        | 'authorised_caption_export'
        | 'public_domain_or_licence'
        | 'fair_dealing_research_notes'
        | 'other_declared',
      mediaType: body.mediaType,
      replacesDocumentId: body.replacesDocumentId,
      claimEligible: body.claimEligible,
      dataDir: live.paths.dataDir,
    });
    if (!result.ok) return c.json({ error: result.error }, result.status);
    return c.json({ accepted: true, ...result });
  });

  app.delete('/api/creators/:creatorId/documents/:documentId', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const result = deleteCreatorDocument(live.db, {
      documentId: c.req.param('documentId'),
      dataDir: live.paths.dataDir,
    });
    if (!result.ok) return c.json({ error: result.error }, result.status);
    return c.json({ accepted: true, ...result });
  });

  app.get('/api/creator-review/tasks', async (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', tasks: [] });
    const tasks = await listCreatorReviewTasks(repositories.review, {
      limit: Number(c.req.query('limit') ?? 100),
    });
    return c.json({ dataMode: 'live', tasks });
  });

  app.post('/api/creator-review/tasks/:id/resolve', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as { action?: string; notes?: string };
    if (!body.action || !CREATOR_REVIEW_ACTIONS.includes(body.action as CreatorReviewAction)) {
      return c.json({ error: 'action must be accept|reject|dismiss' }, 400);
    }
    const result = resolveCreatorReviewTask(live.db, {
      findingId: c.req.param('id'),
      action: body.action as CreatorReviewAction,
      notes: body.notes,
    });
    if (!result.ok) return c.json({ error: result.error }, result.status);
    return c.json({ accepted: true, ...result });
  });

  app.get('/api/platform-policy', (c) => {
    return c.json({
      dataMode: currentMode(),
      ...getPlatformSourceHealth(live.db),
      creatorAi: {
        enabled: isCreatorAiEnabled(),
        notes: creatorAiPolicyNotes(),
        sampleGate: gateCreatorAiSegment({
          rightsEligible: true,
          sourceKind: 'user_document_segment',
          segmentCharCount: 100,
        }),
      },
    });
  });

  app.post('/api/platform-policy/audit', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const result = runPlatformPolicyAudit(live.db);
    return c.json({ accepted: true, ...result });
  });

  app.get('/api/creator-identity/tasks', async (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', tasks: [] });
    return c.json({ dataMode: 'live', tasks: await listIdentityTasks(repositories.review) });
  });

  app.post('/api/creator-identity/tasks/:id/resolve', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as {
      decision?: string;
      expectedRevision?: number;
      notes?: string;
    };
    const allowed = ['accept_link', 'reject', 'keep_separate', 'create_entity'] as const;
    if (!body.decision || !allowed.includes(body.decision as (typeof allowed)[number])) {
      return c.json({ error: 'decision required' }, 400);
    }
    const result = resolveIdentityTask(live.db, {
      taskId: c.req.param('id'),
      decision: body.decision as (typeof allowed)[number],
      expectedRevision: body.expectedRevision,
      notes: body.notes,
    });
    if (!result.ok)
      return c.json(
        {
          error: result.error,
          currentRevision: (result as { currentRevision?: number }).currentRevision,
        },
        result.status,
      );
    return c.json({ accepted: true, ...result });
  });

  app.post('/api/creators/:id/roles', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as {
      role?: string;
      provenanceState?: string;
      expectedRevision?: number;
    };
    if (!body.role) return c.json({ error: 'role required' }, 400);
    const result = addCreatorRole(live.db, {
      creatorId: c.req.param('id'),
      role: body.role,
      provenanceState: body.provenanceState,
      expectedRevision: body.expectedRevision,
    });
    if (!result.ok)
      return c.json(
        {
          error: result.error,
          currentRevision: (result as { currentRevision?: number }).currentRevision,
        },
        result.status,
      );
    rebuildCreatorProfileSnapshot(live.db, c.req.param('id'));
    return c.json({ accepted: true, ...result });
  });

  app.post('/api/creators/:id/commercial-statements', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as {
      subject?: string;
      text?: string;
      sourceUrl?: string;
    };
    if (!body.subject || !body.text) return c.json({ error: 'subject and text required' }, 400);
    const result = addCommercialStatement(live.db, {
      creatorId: c.req.param('id'),
      subject: body.subject,
      text: body.text,
      sourceUrl: body.sourceUrl,
    });
    if (!result.ok) return c.json({ error: result.error }, result.status);
    return c.json({ accepted: true, ...result });
  });

  app.post('/api/creators/:id/profile/rebuild', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const snap = rebuildCreatorProfileSnapshot(live.db, c.req.param('id'));
    if (!snap) return c.json({ error: 'Not found' }, 404);
    return c.json({ accepted: true, ...snap });
  });

  app.post('/api/creator-profile-snapshots/:id/redact', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const result = redactProfileSnapshot(live.db, c.req.param('id'));
    if (!result.ok) return c.json({ error: result.error }, result.status);
    return c.json({ accepted: true, ...result });
  });

  app.get('/api/creators/:id/recurrence', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', groups: [] });
    return c.json({
      dataMode: 'live',
      ...rebuildClaimRecurrence(live.db, { creatorId: c.req.param('id') }),
    });
  });

  app.get('/api/claim-recurrence', async (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', snapshots: [] });
    return c.json({
      dataMode: 'live',
      snapshots: await listRecurrenceSnapshots(repositories.creator),
    });
  });

  app.get('/api/creator-claims/:id/evidence', async (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', links: [] });
    return c.json({
      dataMode: 'live',
      links: await listClaimEvidenceLinks(repositories.creator, c.req.param('id')),
    });
  });

  app.post('/api/creator-claims/:id/evidence/link', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const result = linkCreatorClaimEvidence(live.db, c.req.param('id'));
    if (!result.ok) return c.json({ error: result.error }, result.status);
    return c.json({ accepted: true, ...result });
  });

  app.get('/api/interventions/:id/dossier', (c) => {
    if (currentMode() === 'demo') {
      return c.json(
        { error: 'Live dossiers are Live-only; use Demo detail pages for seed dossiers.' },
        400,
      );
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

  app.post('/api/interventions/link-trial-interventions', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as { limit?: number };
    const result = linkTrialInterventionsToEntities(live.db, body.limit ?? 500);
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

  app.get('/api/regulatory/products', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', items: [], total: 0 });
    return c.json({
      dataMode: 'live',
      ...listRegulatoryProducts(live.db, {
        jurisdiction: c.req.query('jurisdiction') ?? undefined,
        authority: c.req.query('authority') ?? undefined,
        limit: c.req.query('limit') ?? undefined,
        offset: c.req.query('offset') ?? undefined,
      }),
    });
  });

  app.get('/api/regulatory/assertions', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', items: [], total: 0 });
    return c.json({
      dataMode: 'live',
      ...listRegulatoryAssertions(live.db, {
        jurisdiction: c.req.query('jurisdiction') ?? undefined,
        entityId: c.req.query('entityId') ?? undefined,
        limit: c.req.query('limit') ?? undefined,
        offset: c.req.query('offset') ?? undefined,
      }),
    });
  });

  app.get('/api/regulatory/history', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', items: [], total: 0 });
    return c.json({
      dataMode: 'live',
      ...listRegulatoryHistory(live.db, {
        productId: c.req.query('productId') ?? undefined,
        entityId: c.req.query('entityId') ?? undefined,
        limit: c.req.query('limit') ?? undefined,
        offset: c.req.query('offset') ?? undefined,
      }),
    });
  });

  app.get('/api/safety/items', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', items: [], total: 0 });
    return c.json({
      dataMode: 'live',
      ...listSafetyItems(live.db, {
        jurisdiction: c.req.query('jurisdiction') ?? undefined,
        limit: c.req.query('limit') ?? undefined,
        offset: c.req.query('offset') ?? undefined,
      }),
    });
  });

  app.get('/api/safety/signals', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', items: [], total: 0 });
    return c.json({
      dataMode: 'live',
      ...listSafetySignals(live.db, {
        entityId: c.req.query('entityId') ?? undefined,
        limit: c.req.query('limit') ?? undefined,
        offset: c.req.query('offset') ?? undefined,
      }),
    });
  });

  app.get('/api/safety/reporting-patterns', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', items: [], total: 0 });
    return c.json({
      dataMode: 'live',
      ...listReportingPatterns(live.db, {
        entityId: c.req.query('entityId') ?? undefined,
        limit: c.req.query('limit') ?? undefined,
        offset: c.req.query('offset') ?? undefined,
      }),
    });
  });

  app.get('/api/regulatory-safety/summary', (c) => {
    if (currentMode() === 'demo') {
      return c.json({ dataMode: 'demo', productCount: 0, assertionCount: 0, signalCount: 0 });
    }
    return c.json({ dataMode: 'live', ...workspaceSummary(live.db) });
  });

  app.post('/api/regulatory/runs', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as {
      entityId?: string;
      useNetwork?: boolean;
    };
    const result = await runRegulatoryRefresh(live.db, {
      entityId: body.entityId,
      useNetwork: body.useNetwork === true,
    });
    return c.json({ accepted: true, ...result }, 202);
  });

  app.post('/api/safety/runs', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as {
      entityId?: string;
      useNetwork?: boolean;
    };
    const result = await runSafetyRefresh(live.db, {
      entityId: body.entityId,
      useNetwork: body.useNetwork === true,
    });
    return c.json({ accepted: true, ...result }, 202);
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

  app.post('/api/entity-resolution/tasks/:id/resolve', async (c) => {
    try {
      assertAdminMutationAllowed();
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Forbidden' }, 403);
    }
    if (currentMode() === 'demo') return c.json({ error: 'Live-only' }, 400);
    const body = (await c.req.json().catch(() => ({}))) as {
      action?: EntityResolutionAction;
      entityId?: string;
      notes?: string;
      newEntityName?: string;
      newEntityType?: string;
    };
    if (!body.action || !(ENTITY_RESOLUTION_ACTIONS as readonly string[]).includes(body.action)) {
      return c.json(
        { error: `action must be one of: ${ENTITY_RESOLUTION_ACTIONS.join(', ')}` },
        400,
      );
    }
    const result = resolveEntityResolutionTask(live.db, {
      taskId: c.req.param('id'),
      action: body.action,
      entityId: body.entityId,
      notes: body.notes,
      newEntityName: body.newEntityName,
      newEntityType: body.newEntityType,
    });
    if (!result.ok) return c.json({ error: result.error }, result.status);
    return c.json({ accepted: true, ...result });
  });

  app.get('/api/review/tasks', async (c) => {
    if (currentMode() === 'demo') {
      const seed = demoRepo.getDashboardPayload();
      return c.json({
        dataMode: 'demo',
        tasks: seed.needsReview,
      });
    }
    const tasks = await listReviewTasks(repositories.review, {
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

  app.get('/api/review/decisions', async (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', decisions: [] });
    const decisions = (await listReviewDecisions(repositories.review)).map((d) => ({
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
    const result = await resolveReviewTask(repositories.review, {
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

  // —— M6 personalisation / ops (Live SQLite only) ——
  registerM6RemediationRoutes(app, { live, currentMode, scheduler });

  app.get('/api/profile', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', profile: null });
    return c.json({ dataMode: 'live', profile: ensureLocalOwnerProfile(live.db) });
  });

  app.get('/api/watchlists', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', items: [] });
    return c.json({ dataMode: 'live', items: listWatchlists(live.db) });
  });

  app.post('/api/watchlists', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo')
      return c.json({ error: 'Demo mode is read-only for watchlists' }, 400);
    const body = await c.req.json<{ name?: string; description?: string }>();
    if (!body.name?.trim()) return c.json({ error: 'name required' }, 400);
    const item = createWatchlist(live.db, body.name.trim(), body.description);
    return c.json({ dataMode: 'live', item }, 201);
  });

  app.get('/api/watchlists/:id', (c) => {
    if (currentMode() === 'demo') return c.json({ error: 'Not found in demo mode' }, 404);
    const id = c.req.param('id');
    const wl = listWatchlists(live.db).find((w) => w.id === id);
    if (!wl) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', item: wl, entries: listWatchlistItems(live.db, id) });
  });

  app.post('/api/watchlists/:id/items', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{
      targetType?: string;
      targetId?: string;
      displayTitle?: string;
    }>();
    if (!body.targetType || !body.targetId)
      return c.json({ error: 'targetType and targetId required' }, 400);
    const watchable = addWatchlistItem(live.db, c.req.param('id'), {
      targetType: body.targetType,
      targetId: body.targetId,
      displayTitle: body.displayTitle,
    });
    return c.json({ dataMode: 'live', watchable }, 201);
  });

  app.patch('/api/watchlists/:id', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{ name?: string; active?: boolean }>();
    const id = c.req.param('id');
    let item = null;
    if (typeof body.name === 'string' && body.name.trim()) {
      item = renameWatchlist(live.db, id, body.name.trim());
    }
    if (typeof body.active === 'boolean') {
      item = setWatchlistActive(live.db, id, body.active);
    }
    if (!item) return c.json({ error: 'Nothing to update' }, 400);
    return c.json({ dataMode: 'live', item });
  });

  app.delete('/api/watchlists/:id/items/:watchableId', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ error: 'Demo mode is read-only' }, 400);
    removeWatchlistItem(live.db, c.req.param('id'), c.req.param('watchableId'));
    return c.json({ dataMode: 'live', ok: true });
  });

  app.post('/api/follow', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo')
      return c.json({ error: 'Demo mode uses browser follow state' }, 400);
    const body = await c.req.json<{
      targetType?: string;
      targetId?: string;
      displayTitle?: string;
      unfollow?: boolean;
    }>();
    if (!body.targetType || !body.targetId)
      return c.json({ error: 'targetType and targetId required' }, 400);
    if (body.unfollow) {
      unfollowTarget(live.db, body.targetType, body.targetId);
      return c.json({ dataMode: 'live', following: false });
    }
    const watchable = followTarget(live.db, {
      targetType: body.targetType,
      targetId: body.targetId,
      displayTitle: body.displayTitle,
    });
    return c.json({ dataMode: 'live', following: true, watchable });
  });

  app.get('/api/follow', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', following: false });
    const targetType = c.req.query('targetType');
    const targetId = c.req.query('targetId');
    if (!targetType || !targetId) return c.json({ error: 'targetType and targetId required' }, 400);
    return c.json({
      dataMode: 'live',
      following: isFollowing(live.db, targetType, targetId),
    });
  });

  app.get('/api/saved-searches', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', items: [] });
    return c.json({ dataMode: 'live', items: listSavedSearches(live.db) });
  });

  app.post('/api/saved-searches', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{ name?: string; query?: unknown }>();
    if (!body.name || !body.query) return c.json({ error: 'name and query required' }, 400);
    const item = createSavedSearch(live.db, body.name, body.query);
    return c.json({ dataMode: 'live', item }, 201);
  });

  app.get('/api/saved-searches/:id', (c) => {
    if (currentMode() === 'demo') return c.json({ error: 'Not found in demo mode' }, 404);
    const item = getSavedSearch(live.db, c.req.param('id'));
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', item });
  });

  app.post('/api/saved-searches/:id/run', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ error: 'Demo mode is read-only' }, 400);
    const result = runSavedSearch(live.db, c.req.param('id'));
    if (!result) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', ...result });
  });

  app.post('/api/saved-searches/:id/archive', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ error: 'Demo mode is read-only' }, 400);
    const item = archiveSavedSearch(live.db, c.req.param('id'));
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', item });
  });

  app.post('/api/reading-states', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{
      watchableId?: string;
      readingState?: 'unread' | 'opened' | 'dismissed';
    }>();
    if (!body.watchableId || !body.readingState)
      return c.json({ error: 'watchableId and readingState required' }, 400);
    const id = setReadingState(live.db, body.watchableId, body.readingState);
    return c.json({ dataMode: 'live', id });
  });

  app.post('/api/mute-rules', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{ scopeType?: string; scopeId?: string; reason?: string }>();
    if (!body.scopeType) return c.json({ error: 'scopeType required' }, 400);
    const item = createMuteRule(live.db, body.scopeType, body.scopeId, body.reason);
    return c.json({ dataMode: 'live', item }, 201);
  });

  app.post('/api/visits', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', visit: null });
    const body = await c.req.json<{ clientInstallationId?: string }>().catch(() => ({}));
    const visit = recordVisit(
      live.db,
      (body as { clientInstallationId?: string }).clientInstallationId,
    );
    return c.json({ dataMode: 'live', visit }, 201);
  });

  app.get('/api/since-last-visit', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', items: [] });
    return c.json({ dataMode: 'live', ...sinceLastVisit(live.db) });
  });

  app.get('/api/alerts', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', items: [] });
    return c.json({ dataMode: 'live', items: listAlerts(live.db) });
  });

  app.get('/api/alerts/:id', (c) => {
    if (currentMode() === 'demo') return c.json({ error: 'Not found in demo mode' }, 404);
    const item = getAlert(live.db, c.req.param('id'));
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', item });
  });

  app.post('/api/alerts/:id/state', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{
      state?: 'new' | 'unread' | 'read' | 'acknowledged' | 'snoozed' | 'dismissed' | 'resolved';
    }>();
    if (!body.state) return c.json({ error: 'state required' }, 400);
    const item = updateAlertState(live.db, c.req.param('id'), body.state);
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', item });
  });

  app.post('/api/alerts/evaluate', (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ error: 'Demo mode is read-only' }, 400);
    return c.json({ dataMode: 'live', ...evaluateDeterministicAlerts(live.db) });
  });

  app.get('/api/briefs', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', items: [] });
    return c.json({ dataMode: 'live', items: listBriefs(live.db) });
  });

  app.get('/api/briefs/:id', (c) => {
    if (currentMode() === 'demo') return c.json({ error: 'Not found in demo mode' }, 404);
    const item = getBrief(live.db, c.req.param('id'));
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', ...item });
  });

  app.post('/api/briefs/generate', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req
      .json<{ kind?: 'daily' | 'weekly' }>()
      .catch(() => ({ kind: 'daily' as const }));
    const kind = body.kind === 'weekly' ? 'weekly' : 'daily';
    return c.json({ dataMode: 'live', ...generateBrief(live.db, kind) }, 201);
  });

  app.get('/api/briefing-settings', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', settings: null });
    return c.json({ dataMode: 'live', settings: getBriefingSettings(live.db) });
  });

  app.post('/api/briefing-settings', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{
      dailyEnabled?: boolean;
      weeklyEnabled?: boolean;
      maxDailyItems?: number;
      maxWeeklyItems?: number;
    }>();
    return c.json({ dataMode: 'live', settings: updateBriefingSettings(live.db, body) });
  });

  app.get('/api/personalisation/export', (c) => {
    if (currentMode() === 'demo') return c.json({ error: 'Live only' }, 400);
    return c.json({ dataMode: 'live', export: personalisationExport(live.db) });
  });

  app.post('/api/personalisation/import-preview', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ error: 'Live only' }, 400);
    const body = await c.req.json<{ preferences?: unknown; browserIdentityHash?: string }>();
    const result = importLegacyPreferencesPreview(
      live.db,
      body.preferences ?? body,
      body.browserIdentityHash ?? 'unknown',
    );
    return c.json({ dataMode: 'live', ...result });
  });

  app.post('/api/personalisation/import', async (c) => {
    assertAdminMutationAllowed();
    if (currentMode() === 'demo') return c.json({ error: 'Live only' }, 400);
    const body = await c.req.json<{ preferences?: unknown; browserIdentityHash?: string }>();
    const result = applyLegacyPreferenceImport(
      live.db,
      body.preferences ?? body,
      body.browserIdentityHash ?? 'unknown',
    );
    return c.json({ dataMode: 'live', ...result });
  });

  app.get('/api/ops/overview', (c) => {
    const doctor = databaseDoctor(live.sqlite);
    return c.json({
      dataMode: currentMode(),
      appVersion: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
      runtime: process.versions.node,
      database: {
        status: doctor.ok ? 'healthy' : 'degraded',
        integrity: doctor.integrity,
        foreignKeys: doctor.foreignKeys,
        journalMode: doctor.journalMode,
      },
      scheduler: scheduler.getStatus(),
      backups: currentMode() === 'live' ? listBackups(live.paths.dataDir).slice(0, 5) : [],
      storage: currentMode() === 'live' ? storageUsage(live.paths.dataDir) : [],
    });
  });

  app.post('/api/ops/backup', async (c) => {
    assertAdminMutationAllowed();
    const body = (await c.req
      .json<{
        tier?: 'recovery_checkpoint' | 'portable_core' | 'portable_full';
        passphrase?: string;
      }>()
      .catch(() => ({}))) as {
      tier?: 'recovery_checkpoint' | 'portable_core' | 'portable_full';
      passphrase?: string;
    };
    const tier = body.tier ?? 'recovery_checkpoint';
    const result = await createBackup({
      db: live.db,
      sqlite: live.sqlite,
      dataDir: live.paths.dataDir,
      dbPath: live.paths.dbPath,
      tier,
      passphrase: body.passphrase,
      allowUnencrypted: tier === 'recovery_checkpoint' || !body.passphrase,
    });
    return c.json({
      dataMode: 'live',
      id: result.id,
      byteLength: result.byteLength,
      manifest: result.manifest,
      archiveName: result.archiveName,
    });
  });

  app.get('/api/ops/backups', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', items: [] });
    return c.json({ dataMode: 'live', items: listBackups(live.paths.dataDir) });
  });

  app.post('/api/ops/backup/verify', async (c) => {
    assertAdminMutationAllowed();
    const body = await c.req.json<{ archiveName?: string; passphrase?: string }>();
    if (!body.archiveName) return c.json({ error: 'archiveName required' }, 400);
    const archivePath = `${live.paths.dataDir}/backups/${body.archiveName}`.replace(/\\/g, '/');
    try {
      const verified = verifyBackup({ archivePath, passphrase: body.passphrase });
      return c.json({
        dataMode: 'live',
        verified: { ok: verified.ok, mismatches: verified.mismatches },
      });
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'verify failed' }, 400);
    }
  });

  app.post('/api/ops/restore/preflight', async (c) => {
    assertAdminMutationAllowed();
    const body = await c.req.json<{ archiveName?: string }>();
    if (!body.archiveName) return c.json({ error: 'archiveName required' }, 400);
    const archivePath = `${live.paths.dataDir}/backups/${body.archiveName}`.replace(/\\/g, '/');
    const preflight = restorePreflight({ archivePath });
    recordRestoreAttempt(live.db, null, preflight, preflight.ok);
    return c.json({ dataMode: 'live', preflight });
  });

  app.get('/api/ops/storage', (c) => {
    if (currentMode() === 'demo') return c.json({ dataMode: 'demo', categories: [] });
    return c.json({ dataMode: 'live', categories: storageUsage(live.paths.dataDir) });
  });

  app.notFound((c) => {
    const requestId = c.req.header('x-request-id') ?? crypto.randomUUID();
    if (new URL(c.req.url).pathname.startsWith('/api')) {
      return c.json({ error: 'Not found', requestId }, 404);
    }
    return c.text('Not found', 404);
  });

  app.onError((err, c) => {
    console.error(err);
    const requestId = c.req.header('x-request-id') ?? crypto.randomUUID();
    return c.json({ error: err instanceof Error ? err.message : 'Server error', requestId }, 500);
  });

  (app as unknown as { __close?: () => void }).__close = () => {
    worker.stop();
    scheduler.stop();
    platformScheduler.stop();
    closeDatabase(live.sqlite);
  };

  return app;
}

export type AppType = ReturnType<typeof createApp>;
