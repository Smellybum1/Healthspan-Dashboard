import { beforeAll, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-api-test-'));
process.env.HEALTHSPAN_DATA_DIR = dataDir;
process.env.HEALTHSPAN_DATA_MODE = 'demo';

const { createApp } = await import('./app.js');

describe('API contract', () => {
  const app = createApp();

  beforeAll(() => {
    process.env.HEALTHSPAN_DATA_MODE = 'demo';
  });

  it('returns health', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe('healthspan-dashboard-api');
  });

  it('returns dashboard payload', async () => {
    process.env.HEALTHSPAN_DATA_MODE = 'demo';
    const res = await app.request('/api/dashboard');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dataMode).toBe('demo');
    expect(body.demoNotice).toContain('Demo snapshot');
    expect(Array.isArray(body.radar)).toBe(true);
    expect(body.radar.length).toBeGreaterThan(0);
  });

  it('lists and fetches items', async () => {
    process.env.HEALTHSPAN_DATA_MODE = 'demo';
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
    process.env.HEALTHSPAN_DATA_MODE = 'demo';
    const res = await app.request('/api/search?q=metformin');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBeGreaterThan(0);
  });

  it('returns 404 for missing item', async () => {
    process.env.HEALTHSPAN_DATA_MODE = 'demo';
    const res = await app.request('/api/items/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('can switch to live mode and return empty-safe dashboard', async () => {
    const switched = await app.request('/api/mode', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ dataMode: 'live' }),
    });
    expect(switched.status).toBe(200);
    const res = await app.request('/api/dashboard');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dataMode).toBe('live');
    expect(body.radar).toEqual([]);
    expect(body.radarUnavailableReason).toBeTruthy();
    process.env.HEALTHSPAN_DATA_MODE = 'demo';
  });
});
