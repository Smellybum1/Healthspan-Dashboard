import { randomBytes } from 'node:crypto';
import { z } from 'zod';

export * from './backup-format.js';
export * from './exclusive-lock.js';

export const APP_VERSION = '0.6.0';
export const SCHEMA_VERSION = 12;

export const BackupManifestSchema = z.object({
  formatVersion: z.literal(1),
  appVersion: z.string(),
  schemaVersion: z.number().int(),
  createdAt: z.string(),
  includes: z.array(z.string()),
  excludes: z.array(z.string()),
  platform: z.string(),
  notes: z.array(z.string()).default([]),
});
export type BackupManifest = z.infer<typeof BackupManifestSchema>;

export function buildBackupManifest(input: {
  platform: string;
  includes: string[];
}): BackupManifest {
  return BackupManifestSchema.parse({
    formatVersion: 1,
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    includes: input.includes,
    excludes: ['raw_payload_browser_apis', 'secrets', 'env_files', 'x_post_bodies'],
    platform: input.platform,
    notes: ['Backup is local-only. Do not upload to untrusted hosts.'],
  });
}

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

export function configuredAllowedHosts(): Set<string> {
  const raw = process.env.HEALTHSPAN_ALLOWED_HOSTS;
  if (!raw) {
    return new Set(['127.0.0.1', 'localhost', '::1']);
  }
  return new Set(
    raw
      .split(',')
      .map((s) => parseHostHeader(s.trim()).hostname)
      .filter(Boolean),
  );
}

export function configuredAllowedOrigins(): Set<string> {
  const raw = process.env.HEALTHSPAN_ALLOWED_ORIGINS;
  if (!raw) {
    return new Set([
      'http://127.0.0.1:5173',
      'http://localhost:5173',
      'http://127.0.0.1:8787',
      'http://localhost:8787',
    ]);
  }
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function hostAllowed(host: string | undefined): boolean {
  if (!host) return false;
  const { hostname } = parseHostHeader(host);
  if (!hostname) return false;
  // DNS-rebinding style: reject hosts that aren't exact allowlist entries.
  return configuredAllowedHosts().has(hostname);
}

/**
 * Origin policy for browser mutations.
 * - Origin: null is always denied for browser mutations.
 * - Missing Origin is only allowed for classified non-browser callers.
 */
export function originAllowed(
  origin: string | undefined,
  host: string | undefined,
  opts: { allowMissingOrigin?: boolean } = {},
): boolean {
  if (origin === 'null') return false;
  if (!origin) return Boolean(opts.allowMissingOrigin);
  try {
    const u = new URL(origin);
    if (!isLoopbackHost(u.hostname) && !configuredAllowedOrigins().has(origin)) return false;
    if (host && !hostAllowed(host) && !isLoopbackHost(host)) return false;
    if (configuredAllowedOrigins().has(origin)) return true;
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

export const DEFAULT_RETENTION_RULES = {
  operational_events_days: 90,
  diagnostic_bundles_days: 30,
  alert_state_events_days: 180,
  raw_snapshot_policy: 'content_addressed_keep_referenced',
} as const;

export type IntegritySession = {
  id: string;
  csrfToken: string;
  createdAt: number;
  expiresAt: number;
};

const sessions = new Map<string, IntegritySession>();

export function createIntegritySession(ttlMs = 12 * 60 * 60 * 1000): IntegritySession {
  const session: IntegritySession = {
    id: randomBytes(24).toString('base64url'),
    csrfToken: randomBytes(24).toString('base64url'),
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };
  sessions.set(session.id, session);
  return session;
}

export function getIntegritySession(id: string | undefined): IntegritySession | null {
  if (!id) return null;
  const s = sessions.get(id);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    sessions.delete(id);
    return null;
  }
  return s;
}

export function clearIntegritySessions() {
  sessions.clear();
}

export function validateCsrf(
  session: IntegritySession | null,
  headerToken: string | undefined,
): boolean {
  if (!session || !headerToken) return false;
  return session.csrfToken === headerToken;
}
