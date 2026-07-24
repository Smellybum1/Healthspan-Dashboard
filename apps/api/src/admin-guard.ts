/**
 * Local administrative mutation boundary (M3 / M2 closure).
 * Mutations are allowed on loopback by default.
 * Non-loopback hosts require HEALTHSPAN_ALLOW_REMOTE_ADMIN=true.
 */
export function isLoopbackHost(host: string | undefined): boolean {
  if (!host) return true;
  const h = host
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '');
  return (
    h === '127.0.0.1' ||
    h === '::1' ||
    h === 'localhost' ||
    h === '0:0:0:0:0:0:0:1' ||
    h.endsWith('.localhost')
  );
}

export function adminMutationsAllowed(
  opts: {
    bindHost?: string;
    allowRemoteAdmin?: boolean | string;
  } = {},
): { allowed: boolean; reason: string } {
  const bindHost = opts.bindHost ?? process.env.API_HOST ?? '127.0.0.1';
  const allowRemote =
    String(
      opts.allowRemoteAdmin ?? process.env.HEALTHSPAN_ALLOW_REMOTE_ADMIN ?? '',
    ).toLowerCase() === 'true';

  if (isLoopbackHost(bindHost)) {
    return { allowed: true, reason: 'loopback_bind' };
  }
  if (allowRemote) {
    return { allowed: true, reason: 'remote_admin_override' };
  }
  return { allowed: false, reason: 'non_loopback_without_override' };
}

export function assertAdminMutationAllowed(): void {
  const result = adminMutationsAllowed();
  if (!result.allowed) {
    throw new Error(
      'Administrative mutations are disabled for non-loopback binds. Set HEALTHSPAN_ALLOW_REMOTE_ADMIN=true to override (local development only).',
    );
  }
}

export function warnIfRemoteAdminEnabled() {
  const bindHost = process.env.API_HOST ?? '127.0.0.1';
  const result = adminMutationsAllowed({ bindHost });
  if (result.reason === 'remote_admin_override') {
    console.warn(
      '[SECURITY] HEALTHSPAN_ALLOW_REMOTE_ADMIN=true with non-loopback bind. Administrative mutations are exposed on the configured host. Do not use this on untrusted networks.',
    );
  }
}
