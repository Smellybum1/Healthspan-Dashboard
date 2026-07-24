# Security baseline (local production)

## Request integrity

- `GET /api/session` sets HttpOnly `SameSite=Strict` cookie and returns a separate CSRF token
- Browser mutations require Host allowlist, Origin policy, Fetch Metadata (when present), CSRF header, admin/local boundary, and rate limit
- `Origin: null` denied; missing Origin only for classified non-browser callers (`HEALTHSPAN_CSRF_ENABLED=false` test/automation path)

## Binding

- Loopback by default
- Remote bind requires `HEALTHSPAN_ALLOW_REMOTE_BIND=true` **and** a strong `HEALTHSPAN_REMOTE_ACCESS_TOKEN` (≥32 chars)

## Headers

CSP with `default-src 'self'`, `frame-ancestors 'none'`, `base-uri 'none'`, `object-src 'none'`, plus nosniff, Referrer-Policy, Permissions-Policy, COOP/CORP. No HSTS on plain localhost HTTP.

## Supply chain

```text
pnpm security:audit
pnpm security:secrets
pnpm security:sbom
pnpm security:check
pnpm security:headers
pnpm security:signatures
```

See also `docs/security/THREAT_MODEL.md`.
