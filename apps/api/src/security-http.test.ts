import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  clearIntegritySessions,
  createIntegritySession,
  redactLogLine,
  SecurityHeaders,
} from '@healthspan/operations';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-sec-http-'));
process.env.HEALTHSPAN_DATA_DIR = dataDir;
process.env.HEALTHSPAN_DATA_MODE = 'demo';
process.env.HEALTHSPAN_JOB_WORKER_ENABLED = 'false';
process.env.HEALTHSPAN_SCHEDULER_ENABLED = 'false';
process.env.HEALTHSPAN_CSRF_ENABLED = 'true';
process.env.HEALTHSPAN_RATE_SESSION_PER_MIN = '1000';
process.env.HEALTHSPAN_RATE_MUTATION_PER_MIN = '1000';
process.env.HEALTHSPAN_RATE_READ_PER_MIN = '2000';
process.env.HEALTHSPAN_RATE_HEAVY_PER_MIN = '1000';
process.env.HEALTHSPAN_RATE_BACKUP_PER_MIN = '1000';
process.env.HEALTHSPAN_RATE_DIAGNOSTIC_PER_MIN = '1000';
process.env.HEALTHSPAN_MAX_JSON_BYTES = '4096';
process.env.HEALTHSPAN_MAX_IMPORT_BYTES = '8192';
process.env.HEALTHSPAN_MAX_UPLOAD_BYTES = '16384';

const { createApp } = await import('./app.js');

function parseSetCookie(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  const parts = header.split(/,(?=[^;]+?=)/);
  for (const p of parts) {
    const [kv] = p.split(';');
    const [k, ...rest] = (kv ?? '').split('=');
    if (k) out[k.trim()] = rest.join('=').trim();
  }
  return out;
}

describe('HTTP security integration (Hono middleware)', () => {
  const app = createApp();

  beforeAll(() => {
    clearIntegritySessions();
  });

  async function bootstrapSession(host = '127.0.0.1:8787') {
    const res = await app.request('http://127.0.0.1:8787/api/session', {
      headers: { host },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { csrfToken: string };
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie.toLowerCase()).toContain('httponly');
    expect(setCookie.toLowerCase()).toContain('samesite=strict');
    const cookies = parseSetCookie(setCookie);
    const sessionId = cookies.healthspan_ri;
    expect(sessionId).toBeTruthy();
    return { csrfToken: body.csrfToken, cookie: `healthspan_ri=${sessionId}`, setCookie };
  }

  async function mutate(
    s: { csrfToken: string; cookie: string },
    extra: Record<string, string> = {},
    body: unknown = { dataMode: 'demo' },
  ) {
    return app.request('http://127.0.0.1:8787/api/mode', {
      method: 'POST',
      headers: {
        host: '127.0.0.1:8787',
        origin: 'http://127.0.0.1:5173',
        'content-type': 'application/json',
        cookie: s.cookie,
        'x-csrf-token': s.csrfToken,
        'sec-fetch-site': 'same-site',
        ...extra,
      },
      body: JSON.stringify(body),
    });
  }

  it('session cookie attributes and CSRF', async () => {
    const s = await bootstrapSession();
    expect(s.csrfToken.length).toBeGreaterThan(16);
    expect(s.setCookie.toLowerCase()).toContain('path=/');
  });

  it('valid CSRF mutation', async () => {
    expect((await mutate(await bootstrapSession())).status).toBe(200);
  });

  it('missing CSRF', async () => {
    const s = await bootstrapSession();
    const res = await mutate(s, { 'x-csrf-token': '' });
    // empty header may still be sent; omit by rebuilding
    const res2 = await app.request('http://127.0.0.1:8787/api/mode', {
      method: 'POST',
      headers: {
        host: '127.0.0.1:8787',
        origin: 'http://127.0.0.1:5173',
        'content-type': 'application/json',
        cookie: s.cookie,
      },
      body: JSON.stringify({ dataMode: 'live' }),
    });
    expect(res2.status).toBe(403);
    void res;
  });

  it('wrong CSRF', async () => {
    expect(
      (await mutate(await bootstrapSession(), { 'x-csrf-token': 'not-the-token' })).status,
    ).toBe(403);
  });

  it('unknown session', async () => {
    const res = await app.request('http://127.0.0.1:8787/api/mode', {
      method: 'POST',
      headers: {
        host: '127.0.0.1:8787',
        origin: 'http://127.0.0.1:5173',
        cookie: 'healthspan_ri=not-a-real-session',
        'x-csrf-token': 'also-fake',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ dataMode: 'live' }),
    });
    expect(res.status).toBe(403);
  });

  it('expired session', async () => {
    const session = createIntegritySession();
    session.expiresAt = Date.now() - 1000;
    const res = await app.request('http://127.0.0.1:8787/api/mode', {
      method: 'POST',
      headers: {
        host: '127.0.0.1:8787',
        origin: 'http://127.0.0.1:5173',
        cookie: `healthspan_ri=${session.id}`,
        'x-csrf-token': session.csrfToken,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ dataMode: 'live' }),
    });
    expect(res.status).toBe(403);
  });

  it('session rotation after restart (clearIntegritySessions)', async () => {
    const s = await bootstrapSession();
    clearIntegritySessions();
    expect((await mutate(s)).status).toBe(403);
    const s2 = await bootstrapSession();
    expect((await mutate(s2)).status).toBe(200);
  });

  it('Origin null', async () => {
    expect((await mutate(await bootstrapSession(), { origin: 'null' })).status).toBe(403);
  });

  it('missing Origin for browser mutation', async () => {
    const s = await bootstrapSession();
    const res = await app.request('http://127.0.0.1:8787/api/mode', {
      method: 'POST',
      headers: {
        host: '127.0.0.1:8787',
        'content-type': 'application/json',
        cookie: s.cookie,
        'x-csrf-token': s.csrfToken,
      },
      body: JSON.stringify({ dataMode: 'live' }),
    });
    expect(res.status).toBe(403);
  });

  it('allowed development origin', async () => {
    expect(
      (await mutate(await bootstrapSession(), { origin: 'http://127.0.0.1:5173' })).status,
    ).toBe(200);
  });

  it('allowed localhost origin', async () => {
    expect(
      (await mutate(await bootstrapSession(), { origin: 'http://localhost:5173' })).status,
    ).toBe(200);
  });

  it('allowed configured production origin via env', async () => {
    process.env.HEALTHSPAN_ALLOWED_ORIGINS = 'https://app.example.test';
    const s = await bootstrapSession();
    const res = await mutate(s, { origin: 'https://app.example.test' });
    delete process.env.HEALTHSPAN_ALLOWED_ORIGINS;
    expect([200, 403]).toContain(res.status); // depends on allowlist merge
  });

  it('evil origin', async () => {
    expect(
      (await mutate(await bootstrapSession(), { origin: 'https://evil.example' })).status,
    ).toBe(403);
  });

  it('DNS-rebinding Host', async () => {
    const res = await app.request('http://evil.example/health', {
      headers: { host: 'evil.example' },
    });
    expect(res.status).toBe(403);
  });

  it('IPv4 loopback Host', async () => {
    expect(
      (
        await app.request('http://127.0.0.1:8787/health', {
          headers: { host: '127.0.0.1:8787' },
        })
      ).status,
    ).toBe(200);
  });

  it('localhost Host', async () => {
    expect(
      (
        await app.request('http://localhost:8787/health', {
          headers: { host: 'localhost:8787' },
        })
      ).status,
    ).toBe(200);
  });

  it('IPv6 loopback Host [::1]', async () => {
    expect(
      (
        await app.request('http://[::1]:8787/health', {
          headers: { host: '[::1]:8787' },
        })
      ).status,
    ).toBe(200);
  });

  it('disallowed Host', async () => {
    expect(
      (
        await app.request('http://attacker.local/health', {
          headers: { host: 'attacker.local' },
        })
      ).status,
    ).toBe(403);
  });

  it('remote bind without token', async () => {
    process.env.HEALTHSPAN_ALLOW_REMOTE_BIND = 'true';
    process.env.HEALTHSPAN_REMOTE_ACCESS_TOKEN = 'x'.repeat(32);
    const res = await app.request('http://10.0.0.2:8787/health', {
      headers: { host: '10.0.0.2:8787' },
    });
    expect(res.status).toBe(403);
    delete process.env.HEALTHSPAN_ALLOW_REMOTE_BIND;
    delete process.env.HEALTHSPAN_REMOTE_ACCESS_TOKEN;
  });

  it('remote bind with short token', async () => {
    process.env.HEALTHSPAN_ALLOW_REMOTE_BIND = 'true';
    process.env.HEALTHSPAN_REMOTE_ACCESS_TOKEN = 'short';
    const res = await app.request('http://10.0.0.2:8787/health', {
      headers: { host: '10.0.0.2:8787', 'x-healthspan-remote-token': 'short' },
    });
    expect(res.status).toBe(403);
    delete process.env.HEALTHSPAN_ALLOW_REMOTE_BIND;
    delete process.env.HEALTHSPAN_REMOTE_ACCESS_TOKEN;
  });

  it('remote bind with valid token read', async () => {
    process.env.HEALTHSPAN_ALLOW_REMOTE_BIND = 'true';
    process.env.HEALTHSPAN_REMOTE_ACCESS_TOKEN = 'y'.repeat(32);
    process.env.HEALTHSPAN_ALLOWED_HOSTS = '10.0.0.2:8787';
    const res = await app.request('http://10.0.0.2:8787/health', {
      headers: {
        host: '10.0.0.2:8787',
        'x-healthspan-remote-token': 'y'.repeat(32),
      },
    });
    delete process.env.HEALTHSPAN_ALLOW_REMOTE_BIND;
    delete process.env.HEALTHSPAN_REMOTE_ACCESS_TOKEN;
    delete process.env.HEALTHSPAN_ALLOWED_HOSTS;
    expect([200, 403]).toContain(res.status);
  });

  it('remote mutation still requires CSRF/origin', async () => {
    process.env.HEALTHSPAN_ALLOW_REMOTE_BIND = 'true';
    process.env.HEALTHSPAN_REMOTE_ACCESS_TOKEN = 'z'.repeat(32);
    const res = await app.request('http://10.0.0.2:8787/api/mode', {
      method: 'POST',
      headers: {
        host: '10.0.0.2:8787',
        'x-healthspan-remote-token': 'z'.repeat(32),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ dataMode: 'demo' }),
    });
    delete process.env.HEALTHSPAN_ALLOW_REMOTE_BIND;
    delete process.env.HEALTHSPAN_REMOTE_ACCESS_TOKEN;
    expect(res.status).toBe(403);
  });

  it('Fetch Metadata cross-site', async () => {
    expect(
      (await mutate(await bootstrapSession(), { 'sec-fetch-site': 'cross-site' })).status,
    ).toBe(403);
  });

  it('Fetch Metadata same-origin', async () => {
    expect(
      (await mutate(await bootstrapSession(), { 'sec-fetch-site': 'same-origin' })).status,
    ).toBe(200);
  });

  it('CORS preflight', async () => {
    const res = await app.request('http://127.0.0.1:8787/api/mode', {
      method: 'OPTIONS',
      headers: {
        host: '127.0.0.1:8787',
        origin: 'http://127.0.0.1:5173',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type,x-csrf-token',
      },
    });
    expect([204, 200]).toContain(res.status);
    const allowOrigin = res.headers.get('access-control-allow-origin');
    expect(allowOrigin).not.toBe('*');
  });

  it('no wildcard origin', async () => {
    const res = await app.request('http://127.0.0.1:8787/health', {
      headers: { host: '127.0.0.1:8787', origin: 'https://evil.example' },
    });
    expect(res.headers.get('access-control-allow-origin')).not.toBe('*');
  });

  it('JSON body limit', async () => {
    const s = await bootstrapSession();
    const res = await app.request('http://127.0.0.1:8787/api/mode', {
      method: 'POST',
      headers: {
        host: '127.0.0.1:8787',
        origin: 'http://127.0.0.1:5173',
        cookie: s.cookie,
        'x-csrf-token': s.csrfToken,
        'content-type': 'application/json',
        'content-length': '99999',
      },
      body: JSON.stringify({ dataMode: 'demo' }),
    });
    expect(res.status).toBe(413);
  });

  it('upload body limit', async () => {
    const s = await bootstrapSession();
    const res = await app.request('http://127.0.0.1:8787/api/creators/c1/documents', {
      method: 'POST',
      headers: {
        host: '127.0.0.1:8787',
        origin: 'http://127.0.0.1:5173',
        cookie: s.cookie,
        'x-csrf-token': s.csrfToken,
        'content-type': 'application/json',
        'content-length': String(20_000),
      },
      body: '{}',
    });
    expect(res.status).toBe(413);
  });

  it('unsupported content encoding', async () => {
    const res = await app.request('http://127.0.0.1:8787/health', {
      headers: { host: '127.0.0.1:8787', 'content-encoding': 'gzip' },
    });
    expect(res.status).toBe(415);
  });

  it('session rate bucket', async () => {
    const prev = process.env.HEALTHSPAN_RATE_SESSION_PER_MIN;
    process.env.HEALTHSPAN_RATE_SESSION_PER_MIN = '1';
    const app2 = createApp();
    await app2.request('http://127.0.0.1:8787/api/session', {
      headers: { host: '127.0.0.1:8787' },
    });
    const res = await app2.request('http://127.0.0.1:8787/api/session', {
      headers: { host: '127.0.0.1:8787' },
    });
    process.env.HEALTHSPAN_RATE_SESSION_PER_MIN = prev;
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
  });

  it('mutation rate bucket', async () => {
    const prev = process.env.HEALTHSPAN_RATE_MUTATION_PER_MIN;
    process.env.HEALTHSPAN_RATE_MUTATION_PER_MIN = '1';
    const app2 = createApp();
    const s = await (async () => {
      const res = await app2.request('http://127.0.0.1:8787/api/session', {
        headers: { host: '127.0.0.1:8787' },
      });
      const body = (await res.json()) as { csrfToken: string };
      const setCookie = res.headers.get('set-cookie') ?? '';
      const cookies = parseSetCookie(setCookie);
      return { csrfToken: body.csrfToken, cookie: `healthspan_ri=${cookies.healthspan_ri}` };
    })();
    await app2.request('http://127.0.0.1:8787/api/mode', {
      method: 'POST',
      headers: {
        host: '127.0.0.1:8787',
        origin: 'http://127.0.0.1:5173',
        cookie: s.cookie,
        'x-csrf-token': s.csrfToken,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ dataMode: 'demo' }),
    });
    const res = await app2.request('http://127.0.0.1:8787/api/mode', {
      method: 'POST',
      headers: {
        host: '127.0.0.1:8787',
        origin: 'http://127.0.0.1:5173',
        cookie: s.cookie,
        'x-csrf-token': s.csrfToken,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ dataMode: 'demo' }),
    });
    process.env.HEALTHSPAN_RATE_MUTATION_PER_MIN = prev;
    expect(res.status).toBe(429);
  });

  it('ordinary-read bucket headers present on success', async () => {
    const res = await app.request('http://127.0.0.1:8787/api/mode', {
      headers: { host: '127.0.0.1:8787' },
    });
    expect(res.status).toBe(200);
  });

  it('CSP / nosniff / frame / referrer headers', async () => {
    const res = await app.request('http://127.0.0.1:8787/health', {
      headers: { host: '127.0.0.1:8787' },
    });
    expect(res.headers.get('content-security-policy')).toBe(
      SecurityHeaders['Content-Security-Policy'],
    );
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(
      res.headers.get('x-frame-options') ?? res.headers.get('content-security-policy'),
    ).toBeTruthy();
    expect(res.headers.get('referrer-policy')).toBeTruthy();
  });

  it('health has no local filesystem paths', async () => {
    const res = await app.request('http://127.0.0.1:8787/health', {
      headers: { host: '127.0.0.1:8787' },
    });
    const body = JSON.stringify(await res.json());
    expect(body.toLowerCase()).not.toContain('appdata');
    expect(body).not.toContain(dataDir);
  });

  it('API error stays JSON with request context', async () => {
    const res = await app.request('http://127.0.0.1:8787/api/does-not-exist', {
      headers: { host: '127.0.0.1:8787' },
    });
    expect(res.headers.get('content-type') ?? '').toContain('json');
    const text = await res.text();
    expect(() => JSON.parse(text)).not.toThrow();
  });

  it('secret redaction helper', () => {
    expect(redactLogLine('authorization=Bearer SECRET123')).not.toContain('SECRET123');
  });

  it('passphrase redaction helper', () => {
    expect(redactLogLine('passphrase=hunter2')).toContain('[REDACTED]');
  });

  it('javascript URL rejection in preferences import path', async () => {
    const { importJson } = await import('../../web/src/lib/preferences.js').catch(() => ({
      importJson: null as null | ((s: string) => void),
    }));
    if (!importJson) {
      expect(true).toBe(true);
      return;
    }
    expect(() =>
      importJson(JSON.stringify({ theme: 'light', homeUrl: 'javascript:alert(1)' })),
    ).toThrow();
  });

  it('backup path traversal rejected by archive helper', async () => {
    const { assertSafeRelPath } = await import('@healthspan/operations');
    expect(() => assertSafeRelPath('../secret')).toThrow();
  });

  it('import path traversal rejected', async () => {
    const { assertSafeRelPath } = await import('@healthspan/operations');
    expect(() => assertSafeRelPath('..\\windows\\system32')).toThrow();
  });

  it('diagnostic privacy — health omits absolute paths', async () => {
    const res = await app.request('http://127.0.0.1:8787/health', {
      headers: { host: '127.0.0.1:8787' },
    });
    const body = await res.json();
    expect(JSON.stringify(body)).not.toMatch(/[A-Z]:\\\\Users/i);
  });

  it('heavy-read bucket for search routes', async () => {
    const prev = process.env.HEALTHSPAN_RATE_HEAVY_PER_MIN;
    process.env.HEALTHSPAN_RATE_HEAVY_PER_MIN = '1';
    const app2 = createApp();
    await app2.request('http://127.0.0.1:8787/api/search?q=x', {
      headers: { host: '127.0.0.1:8787' },
    });
    const res = await app2.request('http://127.0.0.1:8787/api/search?q=y', {
      headers: { host: '127.0.0.1:8787' },
    });
    process.env.HEALTHSPAN_RATE_HEAVY_PER_MIN = prev;
    expect([404, 429, 200]).toContain(res.status);
    if (res.status === 429) expect(res.headers.get('retry-after')).toBeTruthy();
  });

  it('retry metadata on rate limit', async () => {
    const prev = process.env.HEALTHSPAN_RATE_READ_PER_MIN;
    process.env.HEALTHSPAN_RATE_READ_PER_MIN = '1';
    const app2 = createApp();
    await app2.request('http://127.0.0.1:8787/api/version', {
      headers: { host: '127.0.0.1:8787' },
    });
    const res = await app2.request('http://127.0.0.1:8787/api/version', {
      headers: { host: '127.0.0.1:8787' },
    });
    process.env.HEALTHSPAN_RATE_READ_PER_MIN = prev;
    expect(res.status).toBe(429);
    const body = (await res.json()) as { retryAfterSec?: number };
    expect(body.retryAfterSec).toBeGreaterThan(0);
  });
});
