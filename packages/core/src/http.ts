/**
 * Request-integrity primitives shared by the local Node runtime and the hosted Sites
 * edge runtime.
 *
 * These used to live in `@healthspan/operations`, but that package's root imports
 * `node:crypto` and re-exports the filesystem backup format, so nothing in the hosted
 * graph can reach it. The rules are the same in both runtimes and duplicating them would
 * let the two drift, so the pure half moves here — `@healthspan/core` depends only on
 * `zod` and is safe to import from the edge.
 *
 * Everything here takes its policy as an argument. The local runtime reads that policy
 * from `process.env`; the hosted runtime reads it from the Sites environment binding.
 * Neither `process` nor any environment access appears in this file.
 *
 * See `docs/sites/HOSTED_REACHABILITY_AND_ASYNC_PORTING_LEDGER.md` §3.
 */

export const SecurityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'",
  'Cross-Origin-Opener-Policy': 'same-origin',
};

export function parseHostHeader(host: string | undefined): { hostname: string; port?: string } {
  if (!host) return { hostname: '' };
  const h = host.trim();
  if (h.startsWith('[')) {
    const end = h.indexOf(']');
    if (end < 0) return { hostname: h.toLowerCase() };
    const hostname = h.slice(1, end).toLowerCase();
    const rest = h.slice(end + 1);
    const port = rest.startsWith(':') ? rest.slice(1) : undefined;
    return { hostname, port };
  }
  // IPv4 or hostname — only split on the last colon when a single colon exists.
  const first = h.indexOf(':');
  const last = h.lastIndexOf(':');
  if (first !== -1 && first === last) {
    return { hostname: h.slice(0, first).toLowerCase(), port: h.slice(first + 1) };
  }
  return { hostname: h.toLowerCase() };
}

export function isLoopbackHost(host: string | undefined): boolean {
  if (!host) return false;
  const { hostname } = parseHostHeader(host);
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';
}

/**
 * The origin/host policy a runtime enforces.
 *
 * `allowLoopback` is the whole difference between the two runtimes. The local server is
 * bound to loopback and treats any loopback origin as its own; the hosted runtime must
 * accept its one configured Sites origin and nothing else, so it sets this `false`. A
 * hosted policy therefore cannot be satisfied by `http://localhost:5173`.
 */
export type OriginPolicy = {
  allowedOrigins: ReadonlySet<string>;
  allowedHosts: ReadonlySet<string>;
  allowLoopback: boolean;
};

export function hostAllowedIn(
  host: string | undefined,
  allowedHosts: ReadonlySet<string>,
): boolean {
  if (!host) return false;
  const { hostname } = parseHostHeader(host);
  if (!hostname) return false;
  // DNS-rebinding style: reject hosts that aren't exact allowlist entries.
  return allowedHosts.has(hostname);
}

/**
 * Origin policy for browser mutations.
 * - Origin: null is always denied for browser mutations.
 * - Missing Origin is only allowed for classified non-browser callers.
 */
export function originAllowedIn(
  origin: string | undefined,
  host: string | undefined,
  policy: OriginPolicy,
  opts: { allowMissingOrigin?: boolean } = {},
): boolean {
  if (origin === 'null') return false;
  if (!origin) return Boolean(opts.allowMissingOrigin);
  try {
    const u = new URL(origin);
    const listed = policy.allowedOrigins.has(origin);
    if (!listed && !(policy.allowLoopback && isLoopbackHost(u.hostname))) return false;
    if (
      host &&
      !hostAllowedIn(host, policy.allowedHosts) &&
      !(policy.allowLoopback && isLoopbackHost(host))
    ) {
      return false;
    }
    if (listed) return true;
    const reqHost = parseHostHeader(host).hostname;
    return Boolean(reqHost && u.hostname.toLowerCase() === reqHost);
  } catch {
    return false;
  }
}

export function fetchMetadataAllowed(meta: {
  secFetchSite?: string | null;
  secFetchMode?: string | null;
  secFetchDest?: string | null;
}): boolean {
  const site = (meta.secFetchSite ?? '').toLowerCase();
  if (!site) return true;
  if (site === 'cross-site') return false;
  if (site === 'none' || site === 'same-origin' || site === 'same-site') return true;
  return false;
}

export function redactLogLine(line: string): string {
  return line
    .replace(/\bBearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(
      /\b(authorization|api[_-]?key|token|passphrase)\b["'\s:=]+[^\s"',]+(?:\s+[A-Za-z0-9._-]+)?/gi,
      '$1=[REDACTED]',
    )
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]');
}
