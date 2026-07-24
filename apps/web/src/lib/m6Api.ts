import { apiFetch } from './api';

async function getJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

async function sendJson<T>(path: string, method: string, body: unknown = {}): Promise<T> {
  const res = await apiFetch(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

const postJson = <T>(path: string, body: unknown = {}) => sendJson<T>(path, 'POST', body);
const patchJson = <T>(path: string, body: unknown) => sendJson<T>(path, 'PATCH', body);
const putJson = <T>(path: string, body: unknown) => sendJson<T>(path, 'PUT', body);
const deleteJson = <T>(path: string) =>
  apiFetch(path, { method: 'DELETE' }).then(async (res) => {
    if (!res.ok) throw new Error(`Request failed: ${res.status} ${path}`);
    return res.json() as Promise<T>;
  });

function installationId(): string {
  const key = 'healthspan.installationId';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function tabSessionId(): string {
  const key = 'healthspan.tabSessionId';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

let activeVisitId: string | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

export const m6Api = {
  listWatchlists: (includeArchived = false) =>
    getJson<{ dataMode: string; items: Array<Record<string, unknown>> }>(
      `/api/watchlists${includeArchived ? '?includeArchived=1' : ''}`,
    ),
  getWatchlist: (id: string, opts?: { targetType?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (opts?.targetType) q.set('targetType', opts.targetType);
    if (opts?.page) q.set('page', String(opts.page));
    if (opts?.pageSize) q.set('pageSize', String(opts.pageSize));
    const qs = q.toString();
    return getJson<{
      dataMode: string;
      item: Record<string, unknown>;
      items: Array<Record<string, unknown>>;
      entries?: Array<Record<string, unknown>>;
      total?: number;
      page?: number;
      pageSize?: number;
    }>(`/api/watchlists/${id}${qs ? `?${qs}` : ''}`);
  },
  createWatchlist: (name: string, description?: string) =>
    postJson('/api/watchlists', { name, description }),
  renameWatchlist: (id: string, name: string) => patchJson(`/api/watchlists/${id}`, { name }),
  archiveWatchlist: (id: string) => patchJson(`/api/watchlists/${id}`, { active: false }),
  restoreWatchlist: (id: string) => postJson(`/api/watchlists/${id}/restore`, {}),
  deleteWatchlist: (id: string) => deleteJson(`/api/watchlists/${id}`),
  updateWatchlistSettings: (
    id: string,
    patch: { alertEnabled?: boolean; briefEnabled?: boolean; name?: string; active?: boolean },
  ) => patchJson(`/api/watchlists/${id}`, patch),
  addWatchlistItem: (
    id: string,
    body: { targetType: string; targetId: string; displayTitle?: string },
  ) => postJson(`/api/watchlists/${id}/items`, body),
  removeWatchlistItem: (id: string, watchableId: string) =>
    deleteJson(`/api/watchlists/${id}/items/${watchableId}`),
  batchWatchlistItems: (id: string, actions: unknown[]) =>
    postJson(`/api/watchlists/${id}/items/batch`, { actions }),
  watchlistChanges: (id: string, opts?: { page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (opts?.page) q.set('page', String(opts.page));
    if (opts?.pageSize) q.set('pageSize', String(opts.pageSize));
    const qs = q.toString();
    return getJson<{
      items: Array<Record<string, unknown>>;
      total?: number;
      page?: number;
      pageSize?: number;
    }>(`/api/watchlists/${id}/changes${qs ? `?${qs}` : ''}`);
  },
  follow: (body: {
    targetType: string;
    targetId: string;
    displayTitle?: string;
    unfollow?: boolean;
  }) => postJson('/api/follow', body),
  followStatus: (targetType: string, targetId: string) =>
    getJson<{ following: boolean }>(
      `/api/follow?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`,
    ),
  listSavedSearches: () =>
    getJson<{ items: Array<Record<string, unknown>> }>('/api/saved-searches'),
  getSavedSearch: (id: string) =>
    getJson<{ dataMode: string; item: Record<string, unknown> }>(`/api/saved-searches/${id}`),
  createSavedSearch: (name: string, query: unknown) =>
    postJson('/api/saved-searches', { name, query }),
  updateSavedSearch: (id: string, patch: Record<string, unknown>) =>
    patchJson(`/api/saved-searches/${id}`, patch),
  deleteSavedSearch: (id: string) => deleteJson(`/api/saved-searches/${id}`),
  restoreSavedSearch: (id: string) => postJson(`/api/saved-searches/${id}/restore`, {}),
  runSavedSearch: (id: string) => postJson(`/api/saved-searches/${id}/run`, {}),
  archiveSavedSearch: (id: string) => postJson(`/api/saved-searches/${id}/archive`, {}),
  savedSearchMatches: (id: string) =>
    getJson<{ items: Array<Record<string, unknown>> }>(`/api/saved-searches/${id}/matches`),
  savedSearchHistory: (id: string) =>
    getJson<{ items: Array<Record<string, unknown>> }>(`/api/saved-searches/${id}/history`),
  listAlertRules: () => getJson<{ items: Array<Record<string, unknown>> }>('/api/alert-rules'),
  createAlertRule: (body: Record<string, unknown>) => postJson('/api/alert-rules', body),
  updateAlertRule: (id: string, body: Record<string, unknown>) =>
    patchJson(`/api/alert-rules/${id}`, body),
  deleteAlertRule: (id: string) => deleteJson(`/api/alert-rules/${id}`),
  listAlerts: (opts?: {
    state?: string;
    family?: string;
    priority?: string;
    source?: string;
    eventKind?: string;
    watchlistId?: string;
    savedSearchId?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const q = new URLSearchParams();
    if (opts?.state) q.set('state', opts.state);
    if (opts?.family) q.set('family', opts.family);
    if (opts?.priority) q.set('priority', opts.priority);
    if (opts?.source) q.set('source', opts.source);
    if (opts?.eventKind) q.set('eventKind', opts.eventKind);
    if (opts?.watchlistId) q.set('watchlist', opts.watchlistId);
    if (opts?.savedSearchId) q.set('savedSearch', opts.savedSearchId);
    if (opts?.page) q.set('page', String(opts.page));
    if (opts?.pageSize) q.set('pageSize', String(opts.pageSize));
    const qs = q.toString();
    return getJson<{
      items: Array<Record<string, unknown>>;
      total?: number;
      page?: number;
      pageSize?: number;
    }>(`/api/alerts${qs ? `?${qs}` : ''}`);
  },
  getAlert: (id: string) =>
    getJson<{ item: Record<string, unknown>; history?: Array<Record<string, unknown>> }>(
      `/api/alerts/${id}`,
    ),
  setAlertState: (id: string, state: string) => postJson(`/api/alerts/${id}/state`, { state }),
  alertAction: (
    id: string,
    action: 'read' | 'acknowledge' | 'snooze' | 'dismiss' | 'resolve',
    body: Record<string, unknown> = {},
  ) => postJson(`/api/alerts/${id}/${action}`, body),
  batchAlerts: (actions: unknown[]) => postJson('/api/alerts/batch', { actions }),
  evaluateAlerts: () => postJson('/api/alerts/evaluate', {}),
  listBriefs: () => getJson<{ items: Array<Record<string, unknown>> }>('/api/briefs'),
  getBrief: (id: string) =>
    getJson<{ brief: Record<string, unknown>; items: Array<Record<string, unknown>> }>(
      `/api/briefs/${id}`,
    ),
  generateBrief: (kind: 'daily' | 'weekly' | 'manual_brief') =>
    postJson('/api/briefs/runs', { kind }),
  exportBrief: (id: string, format: 'markdown' | 'json' = 'markdown') =>
    postJson(`/api/briefs/${id}/export`, { format }),
  briefingStatus: () => getJson<{ status: Record<string, unknown> }>('/api/briefings/status'),
  briefingSettings: () => getJson<{ settings: Record<string, unknown> }>('/api/briefing-settings'),
  updateBriefingSettings: (patch: Record<string, unknown>) =>
    patchJson('/api/briefing-settings', patch),
  async startVisit() {
    const visit = await postJson<{ visit: { id: string } }>('/api/visits/start', {
      clientInstallationId: installationId(),
      tabSessionId: tabSessionId(),
    });
    activeVisitId = visit.visit?.id ?? null;
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (activeVisitId) {
      const id = activeVisitId;
      heartbeatTimer = setInterval(() => {
        void postJson(`/api/visits/${id}/heartbeat`, {}).catch(() => undefined);
      }, 60_000);
      const close = () => {
        if (!activeVisitId) return;
        const url = `/api/visits/${activeVisitId}/close`;
        const payload = JSON.stringify({});
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon(url, blob);
        } else {
          void postJson(url, {}).catch(() => undefined);
        }
        activeVisitId = null;
      };
      window.addEventListener('pagehide', close);
    }
    return visit;
  },
  recordVisit: () => m6Api.startVisit(),
  sinceLastVisit: () =>
    getJson<{
      items: Array<Record<string, unknown>>;
      previousVisitAt?: number | null;
      firstVisit?: boolean;
    }>('/api/since-last-visit'),
  previousVisit: () => getJson<{ visit: Record<string, unknown> | null }>('/api/visits/previous'),
  listReadingState: (watchableId?: string) =>
    getJson<{ items: Array<Record<string, unknown>> }>(
      `/api/reading-state${watchableId ? `?watchableId=${encodeURIComponent(watchableId)}` : ''}`,
    ),
  putReadingState: (
    watchableId: string,
    patch: { readingState?: string; personalSurfaceState?: string },
  ) => putJson(`/api/reading-state/${watchableId}`, patch),
  batchReadingState: (actions: unknown[]) => postJson('/api/reading-state/batch', { actions }),
  setReadingState: (
    watchableId: string,
    readingState: 'unread' | 'opened' | 'read' | 'dismissed',
  ) => putJson(`/api/reading-state/${watchableId}`, { readingState }),
  listMutes: () => getJson<{ items: Array<Record<string, unknown>> }>('/api/mutes'),
  createMute: (body: {
    scopeType: string;
    scopeId?: string;
    reason?: string;
    expiresAt?: number | null;
    scopeEventType?: string;
  }) => postJson('/api/mutes', body),
  updateMute: (id: string, patch: Record<string, unknown>) => patchJson(`/api/mutes/${id}`, patch),
  deleteMute: (id: string) => deleteJson(`/api/mutes/${id}`),
  importPreview: (preferences: unknown) =>
    postJson('/api/personalisation/import-preview', { preferences }),
  importApply: (preferences: unknown) => postJson('/api/personalisation/import', { preferences }),
  portableExport: () => postJson('/api/personalisation/export', {}),
  portableImportPreview: (payload: unknown, mode: 'merge' | 'replace' = 'merge') =>
    postJson('/api/personalisation/import/preview', { payload, mode }),
  portableImportApply: (payload: unknown, mode: 'merge' | 'replace' = 'merge') =>
    postJson('/api/personalisation/import/apply', { payload, mode }),
  migrationStatus: () =>
    getJson<{ status: Record<string, unknown> }>('/api/personalisation/migration/status'),
  migrationSkip: () => postJson('/api/personalisation/migration/skip', {}),
  exportPersonalisation: () => getJson('/api/personalisation/export'),
  getPreference: (key: string) =>
    getJson<{ preference: { key: string; value: unknown } | null }>(`/api/preferences/${key}`),
  setPreference: (key: string, value: unknown) => putJson(`/api/preferences/${key}`, { value }),
  personalisedToday: () =>
    getJson<{ sections: Record<string, unknown> }>('/api/today/personalised'),
  opsOverview: () => getJson<Record<string, unknown>>('/api/operations'),
  opsEvents: () => getJson<Record<string, unknown>>('/api/operations/events'),
  opsSecurity: () => getJson<Record<string, unknown>>('/api/operations/security'),
  opsDbCheck: () => postJson('/api/operations/database/check', {}),
  opsDbOptimize: () => postJson('/api/operations/database/optimize', {}),
  opsDiagnostics: () => postJson('/api/operations/diagnostics', {}),
  retentionPreview: () => postJson('/api/operations/retention/preview', {}),
  retentionApply: () => postJson('/api/operations/retention/apply', {}),
  listBackups: () => getJson<{ items: Array<Record<string, unknown>> }>('/api/ops/backups'),
  createBackup: (body: Record<string, unknown>) => postJson('/api/ops/backup', body),
  verifyBackup: (body: Record<string, unknown>) => postJson('/api/ops/backup/verify', body),
  backupStatus: () => getJson<{ status: Record<string, unknown> }>('/api/backups/status'),
  prunePreview: (keepNewest = 14) => postJson('/api/backups/prune/preview', { keepNewest }),
  pruneApply: (keepNewest = 14) => postJson('/api/backups/prune/apply', { keepNewest }),
  storage: () => getJson<{ categories: Array<Record<string, unknown>> }>('/api/ops/storage'),
};
