/**
 * Sites environment bindings and fail-closed configuration.
 *
 * The hosted runtime has no `process.env`. Everything arrives on the `env` argument of
 * the fetch handler: the `DB` and `FILES` bindings the owner provisions in Sites
 * Settings, plus the hosted configuration values from Milestone 7 §23.
 *
 * Two rules shape this file:
 *
 * 1. **Fail closed.** §23: "The app fails closed when hosted owner/session secrets are
 *    absent." A missing owner email, session secret, or allowed origin makes the
 *    configuration invalid, and the app serves nothing but its readiness report.
 * 2. **No secret value enters a serialisable object.** {@link SitesConfig} records only
 *    whether each secret is *present*. The values stay on the raw bindings, reachable
 *    only by code that needs to compare them server-side. This makes the readiness and
 *    capability responses structurally incapable of leaking one.
 */

import type { D1Database, R2Bucket } from '@healthspan/core';

export type { D1Database, R2Bucket };

/** Everything the Sites runtime receives. Every field is optional: absence is a state the app must report, not crash on. */
export type SitesBindings = {
  /** D1 binding. Provisioned by the owner in Sites Settings under the name `DB`. */
  DB?: D1Database;
  /** R2 binding. Provisioned by the owner in Sites Settings under the name `FILES`. */
  FILES?: R2Bucket;

  HEALTHSPAN_HOSTED_OWNER_EMAIL?: string;
  HEALTHSPAN_HOSTED_SESSION_SECRET?: string;
  HEALTHSPAN_HOSTED_ALLOWED_ORIGIN?: string;
  /** Comma-separated additional hosts, for the owner-only saved-version preview host. */
  HEALTHSPAN_HOSTED_PREVIEW_HOSTS?: string;
  HEALTHSPAN_HOSTED_SCHEDULER_MODE?: string;
  HEALTHSPAN_HOSTED_EXTERNAL_CONNECTORS?: string;
  HEALTHSPAN_HOSTED_PLATFORM_MONITORING?: string;
  HEALTHSPAN_HOSTED_AI_ENABLED?: string;
  HEALTHSPAN_HOSTED_FIXTURE_ONLY?: string;
};

/**
 * Non-secret hosted configuration.
 *
 * Safe to serialise in full — see the second rule at the top of this file.
 */
export type SitesConfig = {
  /** The single origin the hosted app answers for. `null` when unconfigured. */
  allowedOrigin: string | null;
  bindings: { DB: boolean; FILES: boolean };
  secrets: { ownerEmail: boolean; sessionSecret: boolean };
};

/** A named reason the hosted runtime is not ready to serve. */
export type ConfigProblem = {
  setting: string;
  problem: 'missing' | 'prohibited-value' | 'invalid';
  detail: string;
};

export type SitesEnv = {
  config: SitesConfig;
  /** Empty when the runtime may serve requests. Non-empty means fail closed. */
  problems: ConfigProblem[];
  ok: boolean;
};

/**
 * Settings M7 pins off in the hosted runtime.
 *
 * These are not defaults that an operator may override. §2 prohibits hosted connectors,
 * platform monitoring, and AI outright, so an environment that tries to enable one is a
 * misconfiguration the runtime must report — not a preference it should quietly ignore.
 */
const PROHIBITED_WHEN_ENABLED = [
  'HEALTHSPAN_HOSTED_EXTERNAL_CONNECTORS',
  'HEALTHSPAN_HOSTED_PLATFORM_MONITORING',
  'HEALTHSPAN_HOSTED_AI_ENABLED',
] as const;

function isTruthy(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true' || value?.trim() === '1';
}

function present(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate an exact hosted origin.
 *
 * Exact means exact: an absolute `https://` URL with no path, no wildcard, and no
 * trailing slash. A wildcard entry would be the one mistake that turns an owner-only
 * preview into an open one, so it is rejected here rather than at the CORS layer — the
 * hosted app has no CORS layer at all.
 */
export function parseHostedOrigin(raw: string | undefined): { origin: string } | { error: string } {
  if (!present(raw)) return { error: 'not set' };
  const value = raw!.trim();
  if (value.includes('*')) return { error: 'wildcard origins are not permitted' };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { error: 'not an absolute URL' };
  }
  if (url.protocol !== 'https:') return { error: 'must use https' };
  if (url.pathname !== '/' || url.search || url.hash) {
    return { error: 'must be a bare origin with no path, query, or fragment' };
  }
  if (value !== url.origin) return { error: `must be written exactly as "${url.origin}"` };
  return { origin: url.origin };
}

export function readSitesEnv(bindings: SitesBindings): SitesEnv {
  const problems: ConfigProblem[] = [];

  const origin = parseHostedOrigin(bindings.HEALTHSPAN_HOSTED_ALLOWED_ORIGIN);
  if ('error' in origin) {
    problems.push({
      setting: 'HEALTHSPAN_HOSTED_ALLOWED_ORIGIN',
      problem: origin.error === 'not set' ? 'missing' : 'invalid',
      detail: origin.error,
    });
  }

  for (const secret of [
    'HEALTHSPAN_HOSTED_OWNER_EMAIL',
    'HEALTHSPAN_HOSTED_SESSION_SECRET',
  ] as const) {
    if (!present(bindings[secret])) {
      problems.push({
        setting: secret,
        problem: 'missing',
        detail: 'set this value in Sites Settings; it is never committed',
      });
    }
  }

  for (const setting of PROHIBITED_WHEN_ENABLED) {
    if (isTruthy(bindings[setting])) {
      problems.push({
        setting,
        problem: 'prohibited-value',
        detail: 'this capability is prohibited in the hosted runtime and cannot be enabled',
      });
    }
  }

  const schedulerMode = bindings.HEALTHSPAN_HOSTED_SCHEDULER_MODE?.trim() ?? 'manual';
  if (schedulerMode !== 'manual') {
    problems.push({
      setting: 'HEALTHSPAN_HOSTED_SCHEDULER_MODE',
      problem: 'prohibited-value',
      detail: 'the hosted runtime has no persistent scheduler; only "manual" is supported',
    });
  }

  // Fixture-only defaults to true and may not be turned off: §14 permits synthetic
  // hosted data only, and never a migration of real local data.
  if (
    present(bindings.HEALTHSPAN_HOSTED_FIXTURE_ONLY) &&
    !isTruthy(bindings.HEALTHSPAN_HOSTED_FIXTURE_ONLY)
  ) {
    problems.push({
      setting: 'HEALTHSPAN_HOSTED_FIXTURE_ONLY',
      problem: 'prohibited-value',
      detail: 'hosted data is synthetic-only; this cannot be set false',
    });
  }

  return {
    config: {
      allowedOrigin: 'origin' in origin ? origin.origin : null,
      bindings: { DB: Boolean(bindings.DB), FILES: Boolean(bindings.FILES) },
      secrets: {
        ownerEmail: present(bindings.HEALTHSPAN_HOSTED_OWNER_EMAIL),
        sessionSecret: present(bindings.HEALTHSPAN_HOSTED_SESSION_SECRET),
      },
    },
    problems,
    ok: problems.length === 0,
  };
}
