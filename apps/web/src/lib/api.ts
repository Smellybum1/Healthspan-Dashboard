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

export function fetchDashboard() {
  return getJson<DashboardPayload>('/api/dashboard');
}

export function fetchItems(params: Record<string, string | undefined> = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const suffix = qs.toString() ? `?${qs}` : '';
  return getJson<{ count: number; items: ContentItem[] }>(`/api/items${suffix}`);
}

export function fetchItem(id: string) {
  return getJson<{
    item: ContentItem & Record<string, unknown>;
    assessment: EvidenceAssessment | null;
    demoNotice: string;
  }>(`/api/items/${id}`);
}

export function searchApi(q: string) {
  return getJson<{ query: string; count: number; items: ContentItem[] }>(
    `/api/search?q=${encodeURIComponent(q)}`,
  );
}
