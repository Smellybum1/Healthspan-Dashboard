import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import {
  APP_VERSION,
  SCHEMA_VERSION,
  hostAllowedIn,
  originAllowedIn,
  parseHostHeader,
  type OriginPolicy,
} from '@healthspan/core';

export * from './backup-format.js';
export * from './exclusive-lock.js';

/**
 * Request-integrity primitives now live in `@healthspan/core` so the hosted Sites
 * runtime can reach them — this package's root imports `node:crypto` and the filesystem
 * backup format, which the edge bundle must never see. They are re-exported here so
 * local callers keep their existing import site.
 */
export {
  APP_VERSION,
  DEFAULT_RETENTION_RULES,
  SCHEMA_VERSION,
  SecurityHeaders,
  fetchMetadataAllowed,
  hostAllowedIn,
  isLoopbackHost,
  originAllowedIn,
  parseHostHeader,
  redactLogLine,
  type OriginPolicy,
} from '@healthspan/core';

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

/**
 * The local runtime's origin policy, read from `process.env`.
 *
 * `allowLoopback` is `true` because the local server binds to loopback and treats any
 * loopback origin as its own. The hosted runtime builds its own policy with
 * `allowLoopback: false` from the Sites environment, so an exact configured origin is
 * the only thing it accepts.
 */
export function localOriginPolicy(): OriginPolicy {
  return {
    allowedOrigins: configuredAllowedOrigins(),
    allowedHosts: configuredAllowedHosts(),
    allowLoopback: true,
  };
}

export function hostAllowed(host: string | undefined): boolean {
  return hostAllowedIn(host, configuredAllowedHosts());
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
  return originAllowedIn(origin, host, localOriginPolicy(), opts);
}

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
