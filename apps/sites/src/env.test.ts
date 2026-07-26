import { describe, expect, it } from 'vitest';
import { parseHostedOrigin, readSitesEnv, type SitesBindings } from './env.js';

const OK: SitesBindings = {
  DB: {} as never,
  FILES: {} as never,
  HEALTHSPAN_HOSTED_OWNER_EMAIL: 'owner@example.invalid',
  HEALTHSPAN_HOSTED_SESSION_SECRET: 'a'.repeat(48),
  HEALTHSPAN_HOSTED_ALLOWED_ORIGIN: 'https://healthspan.example.invalid',
};

describe('parseHostedOrigin', () => {
  it('accepts an exact https origin', () => {
    expect(parseHostedOrigin('https://healthspan.example.invalid')).toEqual({
      origin: 'https://healthspan.example.invalid',
    });
  });

  it('rejects a wildcard', () => {
    // The one mistake that would turn an owner-only preview into an open one.
    expect(parseHostedOrigin('https://*.example.invalid')).toEqual({
      error: 'wildcard origins are not permitted',
    });
  });

  it.each([
    ['http://healthspan.example.invalid', 'must use https'],
    [
      'https://healthspan.example.invalid/app',
      'must be a bare origin with no path, query, or fragment',
    ],
    ['healthspan.example.invalid', 'not an absolute URL'],
    [undefined, 'not set'],
    ['   ', 'not set'],
  ])('rejects %s', (input, error) => {
    expect(parseHostedOrigin(input)).toEqual({ error });
  });

  it('rejects a trailing slash rather than silently normalising it', () => {
    const result = parseHostedOrigin('https://healthspan.example.invalid/');
    expect(result).toHaveProperty('error');
  });
});

describe('readSitesEnv', () => {
  it('is ok when the required hosted settings are present', () => {
    const env = readSitesEnv(OK);
    expect(env.ok).toBe(true);
    expect(env.problems).toEqual([]);
    expect(env.config.allowedOrigin).toBe('https://healthspan.example.invalid');
    expect(env.config.bindings).toEqual({ DB: true, FILES: true });
  });

  it('fails closed when the owner email and session secret are absent', () => {
    const env = readSitesEnv({
      HEALTHSPAN_HOSTED_ALLOWED_ORIGIN: OK.HEALTHSPAN_HOSTED_ALLOWED_ORIGIN,
    });
    expect(env.ok).toBe(false);
    expect(env.problems.map((p) => p.setting)).toEqual([
      'HEALTHSPAN_HOSTED_OWNER_EMAIL',
      'HEALTHSPAN_HOSTED_SESSION_SECRET',
    ]);
  });

  it('never places a secret value in the config it reports', () => {
    const serialised = JSON.stringify(readSitesEnv(OK).config);
    expect(serialised).not.toContain('owner@example.invalid');
    expect(serialised).not.toContain('a'.repeat(48));
    expect(readSitesEnv(OK).config.secrets).toEqual({ ownerEmail: true, sessionSecret: true });
  });

  it('reports missing bindings without failing closed', () => {
    // An absent binding is a readiness problem, not a configuration error: the owner
    // provisions DB and FILES in Sites Settings after the project exists.
    const env = readSitesEnv({ ...OK, DB: undefined, FILES: undefined });
    expect(env.ok).toBe(true);
    expect(env.config.bindings).toEqual({ DB: false, FILES: false });
  });

  it.each([
    'HEALTHSPAN_HOSTED_EXTERNAL_CONNECTORS',
    'HEALTHSPAN_HOSTED_PLATFORM_MONITORING',
    'HEALTHSPAN_HOSTED_AI_ENABLED',
  ] as const)('refuses to let %s be enabled', (setting) => {
    const env = readSitesEnv({ ...OK, [setting]: 'true' });
    expect(env.ok).toBe(false);
    expect(env.problems).toContainEqual(
      expect.objectContaining({ setting, problem: 'prohibited-value' }),
    );
  });

  it('accepts those settings when explicitly disabled', () => {
    const env = readSitesEnv({
      ...OK,
      HEALTHSPAN_HOSTED_EXTERNAL_CONNECTORS: 'false',
      HEALTHSPAN_HOSTED_PLATFORM_MONITORING: 'false',
      HEALTHSPAN_HOSTED_AI_ENABLED: 'false',
    });
    expect(env.ok).toBe(true);
  });

  it('rejects a scheduler mode other than manual', () => {
    const env = readSitesEnv({ ...OK, HEALTHSPAN_HOSTED_SCHEDULER_MODE: 'interval' });
    expect(env.problems).toContainEqual(
      expect.objectContaining({ setting: 'HEALTHSPAN_HOSTED_SCHEDULER_MODE' }),
    );
  });

  it('refuses to turn off fixture-only mode', () => {
    // §14 permits synthetic hosted data only; real local data is never migrated.
    const env = readSitesEnv({ ...OK, HEALTHSPAN_HOSTED_FIXTURE_ONLY: 'false' });
    expect(env.ok).toBe(false);
    expect(env.problems).toContainEqual(
      expect.objectContaining({ setting: 'HEALTHSPAN_HOSTED_FIXTURE_ONLY' }),
    );
  });
});
