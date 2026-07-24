import { apiFetch } from './api';

async function getJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown = {}): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

async function deleteJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export const m6Api = {
  listWatchlists: () =>
    getJson<{ dataMode: string; items: Array<Record<string, unknown>> }>('/api/watchlists'),
  getWatchlist: (id: string) =>
    getJson<{
      dataMode: string;
      item: Record<string, unknown>;
      entries: Array<Record<string, unknown>>;
    }>(`/api/watchlists/${id}`),
  createWatchlist: (name: string, description?: string) =>
    postJson('/api/watchlists', { name, description }),
  renameWatchlist: (id: string, name: string) => patchJson(`/api/watchlists/${id}`, { name }),
  archiveWatchlist: (id: string) => patchJson(`/api/watchlists/${id}`, { active: false }),
  addWatchlistItem: (
    id: string,
    body: { targetType: string; targetId: string; displayTitle?: string },
  ) => postJson(`/api/watchlists/${id}/items`, body),
  removeWatchlistItem: (id: string, watchableId: string) =>
    deleteJson(`/api/watchlists/${id}/items/${watchableId}`),
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
  createSavedSearch: (name: string, query: unknown) =>
    postJson('/api/saved-searches', { name, query }),
  runSavedSearch: (id: string) => postJson(`/api/saved-searches/${id}/run`, {}),
  archiveSavedSearch: (id: string) => postJson(`/api/saved-searches/${id}/archive`, {}),
  listAlerts: () => getJson<{ items: Array<Record<string, unknown>> }>('/api/alerts'),
  getAlert: (id: string) => getJson<{ item: Record<string, unknown> }>(`/api/alerts/${id}`),
  setAlertState: (id: string, state: string) => postJson(`/api/alerts/${id}/state`, { state }),
  evaluateAlerts: () => postJson('/api/alerts/evaluate', {}),
  listBriefs: () => getJson<{ items: Array<Record<string, unknown>> }>('/api/briefs'),
  getBrief: (id: string) =>
    getJson<{ brief: Record<string, unknown>; items: Array<Record<string, unknown>> }>(
      `/api/briefs/${id}`,
    ),
  generateBrief: (kind: 'daily' | 'weekly') => postJson('/api/briefs/generate', { kind }),
  briefingSettings: () => getJson<{ settings: Record<string, unknown> }>('/api/briefing-settings'),
  updateBriefingSettings: (patch: Record<string, unknown>) =>
    postJson('/api/briefing-settings', patch),
  recordVisit: () => postJson('/api/visits', {}),
  sinceLastVisit: () =>
    getJson<{ items: Array<Record<string, unknown>>; previousVisitAt?: number | null }>(
      '/api/since-last-visit',
    ),
  setReadingState: (watchableId: string, readingState: 'unread' | 'opened' | 'dismissed') =>
    postJson('/api/reading-states', { watchableId, readingState }),
  createMute: (scopeType: string, scopeId?: string, reason?: string) =>
    postJson('/api/mute-rules', { scopeType, scopeId, reason }),
  importPreview: (preferences: unknown) =>
    postJson('/api/personalisation/import-preview', { preferences }),
  importApply: (preferences: unknown) => postJson('/api/personalisation/import', { preferences }),
  exportPersonalisation: () => getJson('/api/personalisation/export'),
  opsOverview: () => getJson<Record<string, unknown>>('/api/ops/overview'),
  listBackups: () => getJson<{ items: Array<Record<string, unknown>> }>('/api/ops/backups'),
  createBackup: (body: Record<string, unknown>) => postJson('/api/ops/backup', body),
  verifyBackup: (body: Record<string, unknown>) => postJson('/api/ops/backup/verify', body),
  storage: () => getJson<{ categories: Array<Record<string, unknown>> }>('/api/ops/storage'),
};
