# Threat model — Healthspan Dashboard M6

Local-first research intelligence on loopback. Not a hosted multi-tenant service.

## Assets

- Local SQLite database and raw snapshots
- Personalisation (watchlists, reading, alerts, briefs)
- Optional platform credentials (YouTube/X/OpenAI) in environment only
- Built web assets served from a single local origin

## Entry points

- Browser UI on Vite (dev) or single-origin `pnpm start` (prod-local)
- Local Hono API `/api/*`
- Background jobs / Brisbane scheduler
- Backup/restore CLI and archives
- Optional external source connectors and optional AI provider

## Trust boundaries

| Boundary                     | Trust                                                           |
| ---------------------------- | --------------------------------------------------------------- |
| Loopback browser ↔ local API | Same operator; CSRF/Origin/Host checks still apply              |
| Local API ↔ filesystem/DB    | Trusted operator machine                                        |
| Local API ↔ internet sources | Untrusted content; never execute                                |
| Optional AI provider         | Untrusted; minimal public segments only; no personalisation/PHI |

## Threats and mitigations

| Threat                                | Mitigation                                                           | Test                   |
| ------------------------------------- | -------------------------------------------------------------------- | ---------------------- |
| Malicious website targeting localhost | Loopback bind default; Origin/Host allowlists; CORS limited          | `operations:doctor`    |
| DNS rebinding                         | Host header loopback enforcement                                     | Host middleware        |
| CSRF                                  | Reject non-loopback Origin on mutations                              | Origin middleware      |
| Cross-origin exfiltration             | CORP/same-origin headers; no remote bind by default                  | Security headers       |
| Source-content XSS                    | React text rendering; no `dangerouslySetInnerHTML` for source bodies | UI review              |
| Malicious creator document            | Segment sanitisation; review queue before publish                    | creator doctors        |
| Malicious personalisation import      | Zod schemas; Demo IDs blocked from Live                              | import preview         |
| Malicious backup / zip-slip           | Basename path asserts; JSON envelope restore preflight               | `backup:doctor`        |
| SQL/filter injection                  | Drizzle parameterised queries; Zod query schemas                     | typecheck/tests        |
| Secret leakage                        | No secrets in localStorage; secrets scan; log redaction              | `secrets:scan`         |
| Diagnostic leakage                    | Sanitised summaries only; no absolute paths in browser JSON          | API responses          |
| Platform retention failure            | X compliance jobs + doctors                                          | `x:doctor`             |
| Corrupt DB                            | `db:doctor` integrity/FK checks                                      | `db:doctor`            |
| Interrupted migration/restore         | Forward-only migrations; restore preflight                           | migrate scripts        |
| Dependency compromise                 | pinned packageManager; audit; SBOM lite                              | CI                     |
| DoS via large queries/files           | Pagination caps; rate limit; record caps                             | rate middleware        |
| Remote bind misconfiguration          | Default 127.0.0.1; explicit override env                             | start script           |
| AI prompt injection                   | Segments treated as data; deterministic fallback                     | intelligence eval      |
| X-to-AI policy violation              | Hard block in creator AI policy                                      | platform-policy doctor |

## Residual risk

A local operator with filesystem access can read the database. Network attackers without loopback access are out of scope for the default bind. Hosted multi-user deployment is M7+ and not claimed here.
