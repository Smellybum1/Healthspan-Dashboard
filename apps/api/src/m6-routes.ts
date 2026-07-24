import type { Hono } from 'hono';
import type { HealthspanDb } from '@healthspan/db';
import { assertAdminMutationAllowed } from './admin-guard.js';
import { createMuteRule, setReadingState, listWatchlists } from './personalization-service.js';
import {
  batchAlertActions,
  batchReadingState,
  batchWatchlistItems,
  briefingStatus,
  closeVisit,
  createAlertRule,
  createMute,
  deleteAlertRule,
  deleteMute,
  deleteSavedSearch,
  deleteWatchlist,
  enrichAlert,
  exportBrief,
  getPreviousVisit,
  getProfilePreference,
  getWatchlist,
  heartbeatVisit,
  listAlertRules,
  listAlertsFiltered,
  listAllWatchlists,
  listMutes,
  listReadingStates,
  listSavedSearchHistory,
  listSavedSearchMatches,
  listWatchlistChanges,
  listWatchlistItemsFiltered,
  migrationStatus,
  personalisationExportFull,
  personalisationImportApply,
  personalisationImportPreview,
  personalisedToday,
  putReadingState,
  restoreSavedSearch,
  restoreWatchlist,
  runBrief,
  setProfilePreference,
  sinceLastVisitStable,
  skipMigration,
  startVisit,
  typedAlertAction,
  updateAlertRule,
  updateBriefingSettingsFull,
  updateBriefItemReading,
  updateMute,
  updateSavedSearch,
  updateWatchlistSettings,
} from './personalization-iv.js';
import {
  backupStatusSimple,
  createDiagnosticBundle,
  databaseCheck,
  databaseOptimize,
  operationsPanels,
  pruneBackups,
  prunePreview,
  retentionApply,
  retentionPreview,
} from './operations-panels.js';
import { storageUsage } from './backup-service.js';
import { listJobs } from './jobs.js';
import { APP_VERSION, SCHEMA_VERSION, getIntegritySession } from '@healthspan/operations';

type LiveCtx = {
  db: HealthspanDb;
  sqlite: {
    pragma: (sql: string, opts?: { simple?: boolean }) => unknown;
    exec: (sql: string) => void;
  };
  paths: { dataDir: string; dbPath: string };
};

export function registerM6RemediationRoutes(
  app: Hono,
  opts: {
    live: LiveCtx;
    currentMode: () => 'live' | 'demo';
    scheduler: { getStatus: () => unknown };
  },
) {
  const { live, currentMode, scheduler } = opts;
  const demoBlock = () => currentMode() === 'demo';

  // —— Watchlists extensions ——
  app.get('/api/watchlists', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', items: [] });
    const includeArchived = c.req.query('includeArchived') === '1';
    return c.json({
      dataMode: 'live',
      items: includeArchived
        ? listAllWatchlists(live.db, { includeArchived: true })
        : listWatchlists(live.db),
    });
  });

  app.get('/api/watchlists/:id', (c) => {
    if (demoBlock()) return c.json({ error: 'Not found in demo mode' }, 404);
    const id = c.req.param('id');
    const wl = getWatchlist(live.db, id) ?? listWatchlists(live.db).find((w) => w.id === id);
    if (!wl) return c.json({ error: 'Not found' }, 404);
    const filtered = listWatchlistItemsFiltered(live.db, id, {
      targetType: c.req.query('targetType') || undefined,
      page: Number(c.req.query('page') || 1),
      pageSize: Number(c.req.query('pageSize') || 50),
    });
    return c.json({ dataMode: 'live', item: wl, ...filtered });
  });

  app.patch('/api/watchlists/:id', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{
      name?: string;
      active?: boolean;
      alertEnabled?: boolean;
      briefEnabled?: boolean;
    }>();
    const item = updateWatchlistSettings(live.db, c.req.param('id'), body);
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', item });
  });

  app.delete('/api/watchlists/:id', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    try {
      const item = deleteWatchlist(live.db, c.req.param('id'));
      if (!item) return c.json({ error: 'Not found' }, 404);
      return c.json({ dataMode: 'live', item, deleted: true });
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'delete failed' }, 400);
    }
  });

  app.post('/api/watchlists/:id/restore', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const item = restoreWatchlist(live.db, c.req.param('id'));
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', item });
  });

  app.post('/api/watchlists/:id/items/batch', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{ actions?: unknown[] }>();
    const result = batchWatchlistItems(
      live.db,
      c.req.param('id'),
      (body.actions ?? []) as Array<{
        op: 'add' | 'remove';
        targetType?: string;
        targetId?: string;
        watchableId?: string;
        displayTitle?: string;
      }>,
    );
    return c.json({ dataMode: 'live', ...result });
  });

  app.get('/api/watchlists/:id/changes', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', items: [], total: 0, page: 1, pageSize: 50 });
    return c.json({
      dataMode: 'live',
      ...listWatchlistChanges(live.db, c.req.param('id'), {
        page: Number(c.req.query('page') || 1),
        pageSize: Number(c.req.query('pageSize') || 50),
      }),
    });
  });

  // —— Saved searches ——
  app.patch('/api/saved-searches/:id', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<Record<string, unknown>>();
    const item = updateSavedSearch(live.db, c.req.param('id'), body);
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', item });
  });

  app.delete('/api/saved-searches/:id', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const item = deleteSavedSearch(live.db, c.req.param('id'));
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', item });
  });

  app.post('/api/saved-searches/:id/restore', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const item = restoreSavedSearch(live.db, c.req.param('id'));
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', item });
  });

  app.get('/api/saved-searches/:id/matches', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', items: [] });
    return c.json({
      dataMode: 'live',
      items: listSavedSearchMatches(live.db, c.req.param('id')),
    });
  });

  app.get('/api/saved-searches/:id/history', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', items: [] });
    return c.json({
      dataMode: 'live',
      items: listSavedSearchHistory(live.db, c.req.param('id')),
    });
  });

  // —— Reading ——
  app.get('/api/reading-state', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', items: [] });
    const watchableId = c.req.query('watchableId') || undefined;
    return c.json({
      dataMode: 'live',
      items: listReadingStates(live.db, { watchableId }),
    });
  });

  app.put('/api/reading-state/:watchableId', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{
      readingState?: 'unread' | 'opened' | 'read' | 'dismissed';
      personalSurfaceState?: 'default' | 'archived' | 'dismissed';
    }>();
    const item = putReadingState(live.db, c.req.param('watchableId'), body);
    return c.json({ dataMode: 'live', item });
  });

  app.post('/api/reading-state/batch', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{ actions?: unknown[] }>();
    const items = batchReadingState(
      live.db,
      (body.actions ?? []) as Array<{
        watchableId: string;
        readingState?: 'unread' | 'opened' | 'read' | 'dismissed';
        personalSurfaceState?: 'default' | 'archived' | 'dismissed';
      }>,
    );
    return c.json({ dataMode: 'live', items });
  });

  // legacy alias
  app.post('/api/reading-states', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{
      watchableId?: string;
      readingState?: 'unread' | 'opened' | 'read' | 'dismissed';
    }>();
    if (!body.watchableId || !body.readingState)
      return c.json({ error: 'watchableId and readingState required' }, 400);
    const id = setReadingState(live.db, body.watchableId, body.readingState);
    return c.json({ dataMode: 'live', id });
  });

  // —— Mutes ——
  app.get('/api/mutes', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', items: [] });
    return c.json({ dataMode: 'live', items: listMutes(live.db) });
  });

  app.post('/api/mutes', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{
      scopeType?: string;
      scopeId?: string;
      scopeEventType?: string;
      reason?: string;
      expiresAt?: number | null;
    }>();
    if (!body.scopeType) return c.json({ error: 'scopeType required' }, 400);
    const item = createMute(live.db, body as { scopeType: string });
    return c.json({ dataMode: 'live', item }, 201);
  });

  app.patch('/api/mutes/:id', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<Record<string, unknown>>();
    const item = updateMute(live.db, c.req.param('id'), body);
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', item });
  });

  app.delete('/api/mutes/:id', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const item = deleteMute(live.db, c.req.param('id'));
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', item });
  });

  // legacy mute create
  app.post('/api/mute-rules', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{ scopeType?: string; scopeId?: string; reason?: string }>();
    if (!body.scopeType) return c.json({ error: 'scopeType required' }, 400);
    const item = createMuteRule(live.db, body.scopeType, body.scopeId, body.reason);
    return c.json({ dataMode: 'live', item }, 201);
  });

  // —— Visits ——
  app.post('/api/visits/start', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ dataMode: 'demo', visit: null });
    const body = await c.req
      .json<{ clientInstallationId?: string; tabSessionId?: string }>()
      .catch(() => ({}));
    const visit = startVisit(
      live.db,
      body as { clientInstallationId?: string; tabSessionId?: string },
    );
    return c.json({ dataMode: 'live', visit }, 201);
  });

  app.post('/api/visits/:id/heartbeat', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ dataMode: 'demo', ok: false });
    const result = heartbeatVisit(live.db, c.req.param('id'));
    if (!result) return c.json({ error: 'Not found or closed' }, 404);
    return c.json({ dataMode: 'live', ...result });
  });

  app.post('/api/visits/:id/close', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ dataMode: 'demo', ok: false });
    const result = closeVisit(live.db, c.req.param('id'));
    if (!result) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', visit: result });
  });

  app.get('/api/visits/previous', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', visit: null });
    return c.json({ dataMode: 'live', visit: getPreviousVisit(live.db) });
  });

  app.get('/api/since-last-visit', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', items: [] });
    return c.json({ dataMode: 'live', ...sinceLastVisitStable(live.db) });
  });

  app.post('/api/visits', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ dataMode: 'demo', visit: null });
    const body = await c.req.json<{ clientInstallationId?: string }>().catch(() => ({}));
    const visit = startVisit(live.db, body as { clientInstallationId?: string });
    return c.json({ dataMode: 'live', visit }, 201);
  });

  // —— Alert rules + typed alerts ——
  app.get('/api/alert-rules', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', items: [] });
    return c.json({ dataMode: 'live', items: listAlertRules(live.db) });
  });

  app.post('/api/alert-rules', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json();
    const item = createAlertRule(live.db, body);
    return c.json({ dataMode: 'live', item }, 201);
  });

  app.patch('/api/alert-rules/:id', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json();
    const item = updateAlertRule(live.db, c.req.param('id'), body);
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', item });
  });

  app.delete('/api/alert-rules/:id', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const item = deleteAlertRule(live.db, c.req.param('id'));
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', item });
  });

  app.get('/api/alerts', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', items: [], total: 0, page: 1, pageSize: 50 });
    return c.json({
      dataMode: 'live',
      ...listAlertsFiltered(live.db, {
        state: c.req.query('state') || undefined,
        family: c.req.query('family') || undefined,
        priority: c.req.query('priority') || undefined,
        source: c.req.query('source') || undefined,
        eventKind: c.req.query('eventKind') || c.req.query('event') || undefined,
        watchlistId: c.req.query('watchlist') || c.req.query('watchlistId') || undefined,
        savedSearchId: c.req.query('savedSearch') || c.req.query('savedSearchId') || undefined,
        page: Number(c.req.query('page') || 1),
        pageSize: Number(c.req.query('pageSize') || 50),
      }),
    });
  });

  app.get('/api/alerts/:id', (c) => {
    if (demoBlock()) return c.json({ error: 'Not found in demo mode' }, 404);
    const enriched = enrichAlert(live.db, c.req.param('id'));
    if (!enriched) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', ...enriched });
  });

  for (const action of ['read', 'acknowledge', 'snooze', 'dismiss', 'resolve'] as const) {
    app.post(`/api/alerts/:id/${action}`, async (c) => {
      assertAdminMutationAllowed();
      if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
      const body = await c.req.json<{ snoozeUntil?: number }>().catch(() => ({}));
      const item = typedAlertAction(
        live.db,
        c.req.param('id'),
        action,
        body as { snoozeUntil?: number },
      );
      if (!item) return c.json({ error: 'Not found' }, 404);
      return c.json({ dataMode: 'live', item });
    });
  }

  app.post('/api/alerts/batch', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{ actions?: unknown[] }>();
    const items = batchAlertActions(
      live.db,
      (body.actions ?? []) as Array<{
        alertId: string;
        action: 'read' | 'acknowledge' | 'snooze' | 'dismiss' | 'resolve';
        snoozeUntil?: number;
      }>,
    );
    return c.json({ dataMode: 'live', items });
  });

  // —— Briefs ——
  app.patch('/api/briefing-settings', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json();
    return c.json({ dataMode: 'live', settings: updateBriefingSettingsFull(live.db, body) });
  });

  app.post('/api/briefs/runs', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req
      .json<{ kind?: 'daily' | 'weekly' | 'manual_brief' }>()
      .catch(() => ({ kind: 'daily' as const }));
    const kind = body.kind ?? 'daily';
    return c.json({ dataMode: 'live', ...runBrief(live.db, kind) }, 201);
  });

  app.post('/api/briefs/:id/export', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req
      .json<{ format?: 'markdown' | 'json' }>()
      .catch(() => ({ format: 'markdown' as const }));
    const exported = exportBrief(live.db, c.req.param('id'), body.format ?? 'markdown');
    if (!exported) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', export: exported });
  });

  app.get('/api/briefings/status', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', status: null });
    return c.json({ dataMode: 'live', status: briefingStatus(live.db) });
  });

  app.post('/api/briefs/:briefId/items/:itemId/reading', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{ readingState?: 'unread' | 'opened' | 'read' | 'dismissed' }>();
    if (!body.readingState) return c.json({ error: 'readingState required' }, 400);
    const result = updateBriefItemReading(
      live.db,
      c.req.param('briefId'),
      c.req.param('itemId'),
      body.readingState,
    );
    if (!result) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', ...result });
  });

  // —— Personalisation import/export ——
  app.post('/api/personalisation/export', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Live only' }, 400);
    return c.json({ dataMode: 'live', export: personalisationExportFull(live.db) });
  });

  app.post('/api/personalisation/import/preview', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Live only' }, 400);
    const body = await c.req.json<{ payload?: unknown; mode?: 'merge' | 'replace' }>();
    return c.json({
      dataMode: 'live',
      ...personalisationImportPreview(live.db, body.payload ?? body, body.mode ?? 'merge'),
    });
  });

  app.post('/api/personalisation/import/apply', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Live only' }, 400);
    const body = await c.req.json<{ payload?: unknown; mode?: 'merge' | 'replace' }>();
    return c.json({
      dataMode: 'live',
      ...personalisationImportApply(live.db, body.payload ?? body, body.mode ?? 'merge'),
    });
  });

  app.get('/api/personalisation/migration/status', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', status: null });
    return c.json({ dataMode: 'live', status: migrationStatus(live.db) });
  });

  app.post('/api/personalisation/migration/skip', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Live only' }, 400);
    const body = await c.req.json<{ browserIdentityHash?: string }>().catch(() => ({}));
    return c.json({
      dataMode: 'live',
      status: skipMigration(
        live.db,
        (body as { browserIdentityHash?: string }).browserIdentityHash ?? 'unknown',
      ),
    });
  });

  // legacy GET export still works
  app.get('/api/personalisation/export', (c) => {
    if (demoBlock()) return c.json({ error: 'Live only' }, 400);
    return c.json({ dataMode: 'live', export: personalisationExportFull(live.db) });
  });

  // —— Preferences (browser notifications) ——
  app.get('/api/preferences/:key', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', preference: null });
    const pref = getProfilePreference(live.db, c.req.param('key'));
    return c.json({
      dataMode: 'live',
      preference: pref ? { key: pref.preferenceKey, value: JSON.parse(pref.valueJson) } : null,
    });
  });

  app.put('/api/preferences/:key', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Demo mode is read-only' }, 400);
    const body = await c.req.json<{ value?: unknown }>();
    const pref = setProfilePreference(live.db, c.req.param('key'), body.value ?? null);
    return c.json({
      dataMode: 'live',
      preference: { key: pref!.preferenceKey, value: JSON.parse(pref!.valueJson) },
    });
  });

  app.get('/api/today/personalised', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', sections: null });
    return c.json({ dataMode: 'live', sections: personalisedToday(live.db) });
  });

  // —— Backups controlling paths ——
  app.post('/api/backups/prune/preview', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Live only' }, 400);
    const body = await c.req.json<{ keepNewest?: number }>().catch(() => ({}));
    return c.json({
      dataMode: 'live',
      ...prunePreview(live.paths.dataDir, (body as { keepNewest?: number }).keepNewest ?? 14),
    });
  });

  app.post('/api/backups/prune/apply', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Live only' }, 400);
    const body = await c.req.json<{ keepNewest?: number }>().catch(() => ({}));
    const preview = prunePreview(
      live.paths.dataDir,
      (body as { keepNewest?: number }).keepNewest ?? 14,
    );
    const result = pruneBackups(
      live.paths.dataDir,
      (body as { keepNewest?: number }).keepNewest ?? 14,
    );
    return c.json({ dataMode: 'live', preview, result });
  });

  app.get('/api/backups/status', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', status: null });
    return c.json({ dataMode: 'live', status: backupStatusSimple(live.paths.dataDir) });
  });

  // —— Operations ——
  app.get('/api/operations', (c) => {
    return c.json({
      dataMode: currentMode(),
      panels: operationsPanels({
        db: live.db,
        sqlite: live.sqlite,
        dataDir: live.paths.dataDir,
        dataMode: currentMode(),
        schedulerStatus: scheduler.getStatus(),
        jobs: listJobs(live.db).slice(0, 20),
      }),
    });
  });

  app.get('/api/operations/events', (c) => {
    const panels = operationsPanels({
      db: live.db,
      sqlite: live.sqlite,
      dataDir: live.paths.dataDir,
      dataMode: currentMode(),
      schedulerStatus: scheduler.getStatus(),
      jobs: [],
    });
    return c.json({ dataMode: currentMode(), events: panels.recentErrors });
  });

  app.get('/api/operations/metrics', (c) => {
    return c.json({
      dataMode: currentMode(),
      metrics: { appVersion: APP_VERSION, schemaVersion: SCHEMA_VERSION },
    });
  });

  app.get('/api/operations/storage', (c) => {
    if (demoBlock()) return c.json({ dataMode: 'demo', categories: [] });
    return c.json({ dataMode: 'live', categories: storageUsage(live.paths.dataDir) });
  });

  app.get('/api/operations/retention', (c) => {
    return c.json({ dataMode: currentMode(), ...retentionPreview() });
  });

  app.post('/api/operations/retention/preview', async (c) => {
    assertAdminMutationAllowed();
    return c.json({ dataMode: currentMode(), ...retentionPreview() });
  });

  app.post('/api/operations/retention/apply', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Live only' }, 400);
    return c.json({ dataMode: 'live', ...retentionApply(live.db) });
  });

  app.post('/api/operations/database/check', async (c) => {
    assertAdminMutationAllowed();
    return c.json({ dataMode: currentMode(), ...databaseCheck(live.sqlite) });
  });

  app.post('/api/operations/database/optimize', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Live only' }, 400);
    return c.json({ dataMode: 'live', ...databaseOptimize(live.sqlite) });
  });

  app.post('/api/operations/diagnostics', async (c) => {
    assertAdminMutationAllowed();
    if (demoBlock()) return c.json({ error: 'Live only' }, 400);
    return c.json({ dataMode: 'live', ...createDiagnosticBundle(live.db) });
  });

  app.get('/api/operations/security', (c) => {
    const sessionId = c.req.header('x-session-id');
    const session = getIntegritySession(sessionId);
    return c.json({
      dataMode: currentMode(),
      requestIntegrity: {
        hasSession: Boolean(session),
        expiresAt: session?.expiresAt ?? null,
      },
      binding: 'local_loopback_default',
      allowedHosts: '127.0.0.1 / localhost',
      backupExclusions: ['passphrases never persisted'],
      diagnosticExclusions: [
        'database',
        'raw',
        'documents',
        'personalisation_payloads',
        'platform_text',
        'secrets',
      ],
      dataRetention: retentionPreview().rules,
    });
  });
}
