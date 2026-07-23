import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('API contract', () => {
  const app = createApp();

  it('returns health', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe('healthspan-dashboard-api');
  });

  it('returns dashboard payload', async () => {
    const res = await app.request('/api/dashboard');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.demoNotice).toContain('Demo snapshot');
    expect(Array.isArray(body.radar)).toBe(true);
    expect(body.radar.length).toBeGreaterThan(0);
  });

  it('lists and fetches items', async () => {
    const list = await app.request('/api/items?type=paper');
    expect(list.status).toBe(200);
    const listBody = await list.json();
    expect(listBody.count).toBeGreaterThan(0);
    const id = listBody.items[0].id as string;
    const detail = await app.request(`/api/items/${id}`);
    expect(detail.status).toBe(200);
    const detailBody = await detail.json();
    expect(detailBody.item.id).toBe(id);
    expect(detailBody.assessment).toBeTruthy();
  });

  it('searches items', async () => {
    const res = await app.request('/api/search?q=metformin');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBeGreaterThan(0);
  });

  it('returns 404 for missing item', async () => {
    const res = await app.request('/api/items/does-not-exist');
    expect(res.status).toBe(404);
  });
});
