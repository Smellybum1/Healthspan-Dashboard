import type {
  ContentItem,
  DashboardPayload,
  EvidenceAssessment,
} from '@healthspan/core';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
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
  }>(`/api/items/${id}`);
}

export function searchApi(q: string) {
  return getJson<{ query: string; count: number; items: ContentItem[] }>(
    `/api/search?q=${encodeURIComponent(q)}`,
  );
}
