import { describe, expect, it } from 'vitest';
import {
  normaliseContentPaging,
  toContentItemDto,
  type ContentItemRow,
  type ContentListQuery,
  type ContentReadRepository,
} from '@healthspan/core';
import { createSitesApp } from './app.js';
import type { SitesBindings } from './env.js';

const ORIGIN = 'https://healthspan.example.invalid';
const HOST = 'healthspan.example.invalid';

const CONFIGURED: SitesBindings = {
  DB: {} as never,
  FILES: {} as never,
  HEALTHSPAN_HOSTED_OWNER_EMAIL: 'owner@example.invalid',
  HEALTHSPAN_HOSTED_SESSION_SECRET: 'a'.repeat(48),
  HEALTHSPAN_HOSTED_ALLOWED_ORIGIN: ORIGIN,
};

const ROWS: ContentItemRow[] = [
  {
    id: 'c-alpha',
    type: 'paper',
    title: 'Alpha metformin cohort',
    summary: 'A synthetic paper.',
    sourcePublishedAt: Date.UTC(2026, 0, 1),
    updatedAt: Date.UTC(2026, 0, 3),
    canonicalUrl: 'https://example.invalid/alpha',
  },
  {
    id: 'c-bravo',
    type: 'trial',
    title: 'Bravo senolytic trial',
    summary: null,
    sourcePublishedAt: null,
    updatedAt: Date.UTC(2026, 0, 2),
    canonicalUrl: null,
  },
];

/**
 * An in-memory adapter for the shared port.
 *
 * It reuses `normaliseContentPaging` and `toContentItemDto` rather than reimplementing
 * them, so it cannot be a more permissive stand-in than a real adapter on the two things
 * the route depends on: paging bounds and DTO shape.
 */
function memoryContentRepository(rows = ROWS): ContentReadRepository {
  return {
    list(query: ContentListQuery) {
      const { page, pageSize, offset } = normaliseContentPaging(query);
      const filtered = rows.filter((r) => !query.type || r.type === query.type);
      return Promise.resolve({
        page,
        pageSize,
        total: filtered.length,
        items: filtered.slice(offset, offset + pageSize).map(toContentItemDto),
      });
    },
  };
}

function bound() {
  return createSitesApp({ createRepositories: () => ({ content: memoryContentRepository() }) });
}

function get(path: string, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}${path}`, { headers: { host: HOST, ...headers } });
}

describe('sites entrypoint — configuration gate', () => {
  it('fails closed on a data route when hosted settings are absent', async () => {
    const res = await createSitesApp().fetch(get('/api/items'), {} as SitesBindings);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.capability).toBe('configuration');
    expect(body.problems.map((p: { setting: string }) => p.setting)).toContain(
      'HEALTHSPAN_HOSTED_OWNER_EMAIL',
    );
  });

  it('still answers readiness so the owner can see why it failed closed', async () => {
    const res = await createSitesApp().fetch(get('/api/hosted-readiness'), {} as SitesBindings);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.configured).toBe(false);
    expect(body.ready).toBe(false);
    expect(body.problems.length).toBeGreaterThan(0);
  });
});

describe('sites entrypoint — request integrity', () => {
  it('sets the shared security headers on every response', async () => {
    const res = await bound().fetch(get('/api/runtime-capabilities'), CONFIGURED);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
  });

  it('never emits a CORS allow-origin header', async () => {
    // The hosted app mounts no CORS middleware at all, so there is nothing that could
    // emit a wildcard.
    for (const path of ['/api/items', '/api/runtime-capabilities', '/api/hosted-readiness']) {
      const res = await bound().fetch(get(path, { origin: ORIGIN }), CONFIGURED);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    }
  });

  it('accepts the exact configured origin', async () => {
    const res = await bound().fetch(get('/api/items', { origin: ORIGIN }), CONFIGURED);
    expect(res.status).toBe(200);
  });

  it('rejects any other origin', async () => {
    for (const origin of ['https://evil.example.invalid', 'http://localhost:5173', 'null']) {
      const res = await bound().fetch(get('/api/items', { origin }), CONFIGURED);
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe('Origin not allowed');
    }
  });

  it('rejects a host that is not the configured one', async () => {
    const req = new Request(`${ORIGIN}/api/items`, { headers: { host: 'rebind.example.invalid' } });
    const res = await bound().fetch(req, CONFIGURED);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Host not allowed');
  });

  it('accepts a configured preview host', async () => {
    const req = new Request(`${ORIGIN}/api/items`, {
      headers: { host: 'preview.example.invalid' },
    });
    const res = await bound().fetch(req, {
      ...CONFIGURED,
      HEALTHSPAN_HOSTED_PREVIEW_HOSTS: 'preview.example.invalid',
    });
    expect(res.status).toBe(200);
  });

  it('rejects a cross-site fetch', async () => {
    const res = await bound().fetch(
      get('/api/items', { origin: ORIGIN, 'sec-fetch-site': 'cross-site' }),
      CONFIGURED,
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Fetch metadata rejected');
  });

  it('allows a read with no Origin, as a top-level navigation has none', async () => {
    const res = await bound().fetch(get('/api/items'), CONFIGURED);
    expect(res.status).toBe(200);
  });

  it('refuses every mutation, explicitly', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const req = new Request(`${ORIGIN}/api/items`, {
        method,
        headers: { host: HOST, origin: ORIGIN },
      });
      const res = await bound().fetch(req, CONFIGURED);
      expect(res.status).toBe(501);
      expect((await res.json()).capability).toBe('mutations');
    }
  });
});

describe('sites entrypoint — capabilities and readiness', () => {
  it('reports the hosted capability matrix', async () => {
    const res = await bound().fetch(get('/api/runtime-capabilities'), CONFIGURED);
    expect(await res.json()).toMatchObject({
      runtime: 'sites',
      database: 'd1',
      objectStore: 'r2',
      persistentBackgroundScheduler: false,
      externalConnectors: false,
      platformMonitoring: false,
      optionalAi: false,
      localBackupRestore: false,
      hostedRecovery: 'degraded',
      ownerIdentity: 'sites-owner',
      publicAccess: false,
    });
  });

  it('reports readiness without disclosing a secret value', async () => {
    const res = await bound().fetch(get('/api/hosted-readiness'), CONFIGURED);
    const text = await res.text();
    expect(text).not.toContain('owner@example.invalid');
    expect(text).not.toContain('a'.repeat(48));
    const body = JSON.parse(text);
    expect(body.secrets).toEqual({ ownerEmail: true, sessionSecret: true });
    expect(body.dataOrigin).toBe('synthetic');
    expect(body.allowedOrigin).toBe(ORIGIN);
  });

  it('reports content as ported but unbound when the DB binding is absent', async () => {
    // Readiness must say so rather than let the route look like an empty database.
    const res = await createSitesApp().fetch(get('/api/hosted-readiness'), {
      ...CONFIGURED,
      DB: undefined,
    });
    const body = await res.json();
    expect(body.ready).toBe(false);
    expect(body.bindings.DB).toBe(false);
    expect(body.domains).toContainEqual(
      expect.objectContaining({
        domain: 'content',
        ported: true,
        bound: false,
        reason: 'D1 binding "DB" is not provisioned',
      }),
    );
  });

  it('binds content through the real D1 factory when DB is provisioned', async () => {
    // No factory override: this exercises the default path, so a broken wiring between
    // apps/sites and @healthspan/db/sites fails here rather than only in production.
    const res = await createSitesApp().fetch(get('/api/hosted-readiness'), CONFIGURED);
    const body = await res.json();
    expect(body.domains).toContainEqual(
      expect.objectContaining({ domain: 'content', ported: true, bound: true }),
    );
    expect(body.ready).toBe(true);
  });

  it('reports ready once every ported domain is bound', async () => {
    const res = await bound().fetch(get('/api/hosted-readiness'), CONFIGURED);
    const body = await res.json();
    expect(body.ready).toBe(true);
    expect(body.domains).toContainEqual(
      expect.objectContaining({ domain: 'content', bound: true }),
    );
  });
});

describe('sites entrypoint — content through the shared port', () => {
  it('serves the same response shape as the local runtime', async () => {
    const res = await bound().fetch(get('/api/items'), CONFIGURED);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      count: 2,
      page: 1,
      pageSize: 25,
      dataMode: 'live',
      dataOrigin: 'live',
      items: [
        expect.objectContaining({
          id: 'c-alpha',
          type: 'paper',
          tags: [],
          officialUrl: 'https://example.invalid/alpha',
        }),
        // The null-summary and null-published normalisations come from the shared DTO
        // mapper, so the hosted response cannot drift from the local one.
        expect.objectContaining({ id: 'c-bravo', summary: '', publishedAt: null }),
      ],
    });
  });

  it('passes query parameters through the shared coercion', async () => {
    const res = await bound().fetch(get('/api/items?type=trial&pageSize=9999'), CONFIGURED);
    const body = await res.json();
    expect(body.count).toBe(1);
    expect(body.items[0].id).toBe('c-bravo');
    // Clamped by the shared paging bounds, not by anything this app decides.
    expect(body.pageSize).toBe(100);
  });

  it('refuses rather than returning an empty page when no adapter is bound', async () => {
    const res = await createSitesApp().fetch(get('/api/items'), { ...CONFIGURED, DB: undefined });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.capability).toBe('content');
    expect(body.reason).toContain('"DB" is not provisioned');
    expect(body.items).toBeUndefined();
  });
});

describe('sites entrypoint — honesty about what is not here', () => {
  it.each([
    ['/api/backup/create', 'localBackupRestore'],
    ['/api/ingest/run', 'externalConnectors'],
    ['/api/x/compliance', 'platformMonitoring'],
    ['/api/scheduler/status', 'persistentBackgroundScheduler'],
  ])('answers %s with an explicit not-applicable', async (path, capability) => {
    const res = await bound().fetch(get(path), CONFIGURED);
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.capability).toBe(capability);
    expect(body.reason.length).toBeGreaterThan(0);
  });

  it('answers an unported route as unported rather than missing', async () => {
    const res = await bound().fetch(get('/api/watchlists'), CONFIGURED);
    expect(res.status).toBe(501);
    expect((await res.json()).capability).toBe('unported');
  });
});
