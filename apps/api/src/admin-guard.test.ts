import { describe, expect, it } from 'vitest';
import { adminMutationsAllowed, isLoopbackHost } from './admin-guard.js';

describe('admin mutation guard', () => {
  it('treats common loopback hosts as loopback', () => {
    expect(isLoopbackHost('127.0.0.1')).toBe(true);
    expect(isLoopbackHost('::1')).toBe(true);
    expect(isLoopbackHost('[::1]')).toBe(true);
    expect(isLoopbackHost('localhost')).toBe(true);
  });

  it('rejects non-loopback hosts without override', () => {
    expect(adminMutationsAllowed({ bindHost: '0.0.0.0', allowRemoteAdmin: false }).allowed).toBe(
      false,
    );
    expect(adminMutationsAllowed({ bindHost: '192.168.1.10' }).allowed).toBe(false);
  });

  it('allows non-loopback when override is true', () => {
    expect(
      adminMutationsAllowed({ bindHost: '0.0.0.0', allowRemoteAdmin: true }).allowed,
    ).toBe(true);
  });
});
