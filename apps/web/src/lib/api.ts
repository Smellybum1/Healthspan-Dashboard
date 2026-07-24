import type { ContentItem, DashboardPayload, EvidenceAssessment } from '@healthspan/core';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

let csrfToken: string | null = null;
let sessionPromise: Promise<void> | null = null;

async function ensureSession() {
  if (csrfToken) return;
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const res = await fetch(`${API_BASE}/api/session`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Session bootstrap failed: ${res.status}`);
      const body = (await res.json()) as { csrfToken: string };
      csrfToken = body.csrfToken;
    })().finally(() => {
      sessionPromise = null;
    });
  }
  await sessionPromise;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    await ensureSession();
    if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    method,
    headers,
    credentials: 'include',
  });
  if (res.status === 403 && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    csrfToken = null;
    await ensureSession();
    if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
    return fetch(`${API_BASE}${path}`, {
      ...init,
      method,
      headers,
      credentials: 'include',
    });
  }
  return res;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

export function fetchDashboard() {
  return getJson<DashboardPayload>('/api/dashboard');
}

export function fetchMode() {
  return getJson<{ dataMode: 'demo' | 'live'; mode: 'demo' | 'live' }>('/api/mode');
}

export function setMode(dataMode: 'demo' | 'live') {
  return postJson<{ dataMode: 'demo' | 'live'; mode: 'demo' | 'live' }>('/api/mode', { dataMode });
}

export function fetchSources() {
  return getJson<{
    dataMode: 'demo' | 'live';
    sources: Array<Record<string, unknown>>;
    feeds: Array<Record<string, unknown>>;
    paths: { dbPath: string; rawDir: string; dataDir: string };
  }>('/api/sources');
}

export function fetchIngestionRuns() {
  return getJson<{
    dataMode: 'demo' | 'live';
    runs: Array<Record<string, unknown>>;
  }>('/api/ingestion/runs');
}

export function runIngestion(body: { sourceId?: string; recordCap?: number } = {}) {
  return postJson<Record<string, unknown>>('/api/ingestion/run', body);
}

export function fetchJob(id: string) {
  return getJson<Record<string, unknown>>(`/api/jobs/${id}`);
}

export function fetchJobs() {
  return getJson<{ jobs: Array<Record<string, unknown>> }>('/api/jobs');
}

export function postIntelligenceRun(body: { limit?: number } = {}) {
  return postJson<Record<string, unknown>>('/api/intelligence/run', body);
}

export function resolveReviewTask(
  taskId: string,
  body: {
    action: 'accept' | 'edit' | 'reject' | 'uncertain' | 'dismiss';
    notes?: string;
    editedClaimText?: string;
    expectedAnalysisId?: string;
  },
) {
  return postJson<Record<string, unknown>>(`/api/review/tasks/${taskId}/resolve`, body);
}

export function resolveEntityResolutionTask(
  taskId: string,
  body: {
    action: 'accept' | 'reject' | 'defer' | 'link_other' | 'create_entity' | 'keep_separate';
    entityId?: string;
    notes?: string;
    newEntityName?: string;
    newEntityType?: string;
  },
) {
  return postJson<Record<string, unknown>>(`/api/entity-resolution/tasks/${taskId}/resolve`, body);
}

export function fetchItems(params: Record<string, string | undefined> = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const suffix = qs.toString() ? `?${qs}` : '';
  return getJson<{
    count: number;
    items: ContentItem[];
    dataMode?: 'demo' | 'live';
    dataOrigin?: 'demo' | 'live';
  }>(`/api/items${suffix}`);
}

export function fetchItem(id: string) {
  return getJson<{
    item: ContentItem & Record<string, unknown>;
    assessment: EvidenceAssessment | null;
    assessmentStatus?: string;
    demoNotice: string | null;
    dataMode?: 'demo' | 'live';
    dataOrigin?: 'demo' | 'live';
    liveAnalysis?: Record<string, unknown> | null;
    liveClaims?: Array<Record<string, unknown>>;
  }>(`/api/items/${id}`);
}

export function searchApi(q: string) {
  return getJson<{ query: string; count: number; items: ContentItem[] }>(
    `/api/search?q=${encodeURIComponent(q)}`,
  );
}
