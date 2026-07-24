import type { FetchTransport } from './types.js';

export type HttpClientOptions = {
  transport?: FetchTransport;
  userAgent?: string;
  maxRetries?: number;
  timeoutMs?: number;
  minIntervalMs?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const key of [...u.searchParams.keys()]) {
      if (/key|token|secret|auth|password/i.test(key)) u.searchParams.set(key, 'REDACTED');
    }
    return u.toString();
  } catch {
    return '[unparseable-url]';
  }
}

export function createHttpClient(options: HttpClientOptions = {}) {
  const transport = options.transport ?? fetch;
  const maxRetries = options.maxRetries ?? 3;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const minIntervalMs = options.minIntervalMs ?? 350;
  let lastAt = 0;

  async function request(url: string, init: RequestInit = {}): Promise<Response> {
    const now = Date.now();
    const wait = lastAt + minIntervalMs - now;
    if (wait > 0) await sleep(wait);

    let attempt = 0;
    // retry loop
    while (true) {
      attempt += 1;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const headers = new Headers(init.headers);
        if (options.userAgent && !headers.has('user-agent')) {
          headers.set('user-agent', options.userAgent);
        }
        lastAt = Date.now();
        const res = await transport(url, { ...init, headers, signal: controller.signal });
        clearTimeout(timer);

        if (res.status === 304) return res;
        if (res.ok) return res;

        const retryable = res.status === 429 || res.status >= 500;
        if (!retryable || attempt > maxRetries) {
          throw new Error(`HTTP ${res.status} for ${redactUrl(url)}`);
        }

        const retryAfter = Number(res.headers.get('retry-after') ?? '0');
        const backoff = Math.min(
          10_000,
          250 * 2 ** (attempt - 1) + Math.floor(Math.random() * 100),
        );
        await sleep(Math.max(backoff, retryAfter * 1000));
      } catch (err) {
        clearTimeout(timer);
        if (attempt > maxRetries) {
          const message = err instanceof Error ? err.message : 'request failed';
          throw new Error(`${message} (${redactUrl(url)})`);
        }
        await sleep(250 * 2 ** (attempt - 1));
      }
    }
  }

  return { request, redactUrl };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
