import { createHash } from 'node:crypto';
import { z } from 'zod';

export const APP_VERSION = '0.6.0';
export const SCHEMA_VERSION = 11;

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

export function sha256Hex(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function assertSafeRelPath(rel: string) {
  if (!rel || rel.includes('..') || rel.startsWith('/') || rel.startsWith('\\')) {
    throw new Error(`Unsafe path rejected: ${rel}`);
  }
}

export const SecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Resource-Policy': 'same-origin',
} as const;

export function isLoopbackHost(host: string | undefined): boolean {
  if (!host) return false;
  const h = host.split(':')[0]?.toLowerCase() ?? '';
  return h === '127.0.0.1' || h === 'localhost' || h === '::1' || h === '[::1]';
}

export function originAllowed(origin: string | undefined, host: string | undefined): boolean {
  if (!origin || origin === 'null') return true; // same-origin / non-browser
  try {
    const u = new URL(origin);
    if (!isLoopbackHost(u.hostname)) return false;
    if (host && !isLoopbackHost(host.split(':')[0])) return false;
    return true;
  } catch {
    return false;
  }
}

export function redactLogLine(line: string): string {
  return line
    .replace(/(api[_-]?key|token|bearer|authorization)["'\s:=]+[^\s"',]+/gi, '$1=[REDACTED]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]');
}

export const DEFAULT_RETENTION_RULES = {
  operational_events_days: 90,
  diagnostic_bundles_days: 30,
  alert_state_events_days: 180,
  raw_snapshot_policy: 'content_addressed_keep_referenced',
} as const;
