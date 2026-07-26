# Hosted Reachability and Async Porting Ledger

Milestone 7, Amendment I §3. Every module that touches data or the request path is
classified here. **No row may read `UNKNOWN`.**

**Baseline commit:** `a59d202a481f8ef4982ad314f88350024b2373cf`
**Status:** classification complete. Conversion in progress — 1 of 20 convertible rows
`done` (content), and the hosted runtime exists. A row may only be marked `done` once
its module is a declared root in `scripts/sites-bundle-doctor.ts` and that gate is green.

**Ported modules move out of `apps/api/src`.** A hosted-reachable service now lives in
`packages/runtime`, above the ports and below either application, so both runtimes
execute the same code rather than two copies of it. A service still sitting in
`apps/api/src` is one that has not been ported yet — that is the ledger's fastest read.

Legend:

- **Reachability** — `sites` reachable from the hosted runtime, `local` local-only,
  `both` reachable from either (usually a read path hosted, a write path local).
- **Conversion** — `n/a` no conversion required (stays synchronous by decision),
  `pending` inside the hosted-reachable slice and not yet ported, `done` ported.
- **Capability** — how the module must be represented in the hosted runtime capability
  matrix. `operational` serves requests; `disabled` must be reported as unavailable
  rather than silently absent.

---

## 1. Hosted-reachable slice

These move behind async, domain-oriented ports. Local adapters may satisfy the port by
wrapping synchronous `better-sqlite3`; the D1 adapter uses the async driver.

| Module                                                       | Reach | Repository port                                     | Sync/async | Node-only dep                            | Conversion | Test / parity suite                               | Capability                                                        |
| ------------------------------------------------------------ | ----- | --------------------------------------------------- | ---------- | ---------------------------------------- | ---------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| `packages/runtime/src/content.ts` (was `content-service.ts`) | both  | `ContentReadRepository`                             | **async**  | none                                     | **done**   | `content.contract.ts`                             | operational                                                       |
| `apps/sites/src/index.ts`, `app.ts`, `runtime.ts`, `env.ts`  | sites | hosted route layer over the ports below             | **async**  | none                                     | **done**   | `apps/sites/src/*.test.ts`, `sites:bundle:doctor` | operational                                                       |
| `trial-portfolio.ts`                                         | both  | `TrialReadRepository`                               | sync       | none                                     | pending    | `sites:parity` trials                             | operational                                                       |
| `dossier-service.ts`                                         | both  | `InterventionReadRepository`                        | sync       | none                                     | pending    | `sites:parity` interventions                      | operational                                                       |
| `comparison-service.ts`                                      | both  | `InterventionReadRepository`                        | sync       | none                                     | pending    | `sites:parity` interventions                      | operational                                                       |
| `regulatory-safety-service.ts`                               | both  | `InterventionReadRepository`                        | sync       | none                                     | pending    | `sites:parity` regulatory                         | operational                                                       |
| `assessment-service.ts`                                      | both  | `ClaimAssessmentRepository`                         | sync       | none                                     | pending    | `sites:parity` claims                             | operational                                                       |
| `intelligence-service.ts`                                    | both  | `ClaimAssessmentRepository`                         | sync       | none                                     | pending    | `sites:parity` claims                             | operational (read models only; analysis run is local-only)        |
| `creator-evidence-service.ts`                                | both  | `CreatorReadRepository`                             | sync       | none                                     | pending    | `sites:parity` creators                           | operational                                                       |
| `creator-recurrence-service.ts`                              | both  | `CreatorReadRepository`                             | sync       | none                                     | pending    | `sites:parity` creators                           | operational                                                       |
| `creator-service.ts`                                         | both  | `CreatorReadRepository`                             | sync       | `node:fs` (document write/delete)        | pending    | `sites:parity` creators                           | operational for reads; document write/delete `disabled`           |
| `review-service.ts`                                          | both  | `ReviewRepository`                                  | sync       | none                                     | pending    | `sites:parity` review                             | operational                                                       |
| `creator-review-service.ts`                                  | both  | `ReviewRepository`                                  | sync       | none                                     | pending    | `sites:parity` review                             | operational                                                       |
| `entity-resolution-service.ts`                               | both  | `ReviewRepository`                                  | sync       | none                                     | pending    | `sites:parity` review                             | operational                                                       |
| `creator-identity-service.ts`                                | both  | `ReviewRepository`                                  | sync       | none                                     | pending    | `sites:parity` review                             | operational                                                       |
| `personalization-service.ts`                                 | both  | `PersonalisationRepository`                         | sync       | none                                     | pending    | `sites:parity` personalisation                    | operational                                                       |
| `personalization-iv.ts`                                      | both  | `PersonalisationRepository`, `AlertBriefRepository` | sync       | none                                     | pending    | `sites:parity` alerts/briefs                      | operational                                                       |
| `jobs.ts`                                                    | both  | `JobRepository`                                     | sync       | none                                     | pending    | `sites:parity` jobs                               | operational (bounded, request-triggered)                          |
| `operations-panels.ts`                                       | both  | `ObjectMetadataRepository`, readiness status        | sync       | `node:fs` (storage walk), PRAGMA, VACUUM | pending    | `sites:doctor`                                    | readiness `operational`; VACUUM / storage walk / prune `disabled` |
| `app.ts`                                                     | both  | route layer over the ports above                    | sync       | none                                     | pending    | `sites:bundle:doctor`                             | operational                                                       |
| `m6-routes.ts`                                               | both  | route layer over the ports above                    | sync       | none                                     | pending    | `sites:bundle:doctor`                             | operational                                                       |
| `safe-response.ts`                                           | both  | none (pure)                                         | n/a        | none                                     | n/a        | unit                                              | operational                                                       |
| `admin-guard.ts`                                             | both  | none (pure)                                         | n/a        | none                                     | n/a        | unit                                              | operational                                                       |
| `job-priorities.ts`                                          | both  | none (constants)                                    | n/a        | none                                     | n/a        | unit                                              | operational                                                       |
| `packages/db` schema modules                                 | both  | schema shared by both adapters                      | n/a        | none                                     | n/a        | `sites:db:lint`                                   | operational                                                       |

---

## 2. Local-only

These keep their synchronous `HealthspanDb` path and are **not** converted, per
Amendment §2. They must be reported as unavailable in hosted mode, never shown as
operational.

| Module                                  | Reach | Repository port              | Sync/async      | Node-only dep                                 | Conversion | Test / parity suite                          | Capability                            |
| --------------------------------------- | ----- | ---------------------------- | --------------- | --------------------------------------------- | ---------- | -------------------------------------------- | ------------------------------------- |
| `ingest.ts`                             | local | none — direct `HealthspanDb` | sync            | connectors, raw store                         | n/a        | existing `ingest.test.ts`                    | disabled                              |
| `reprocess-service.ts`                  | local | none                         | sync            | raw store                                     | n/a        | existing                                     | disabled                              |
| `x-sync-service.ts`                     | local | none                         | sync            | network, `app_meta` watermark                 | n/a        | existing                                     | disabled                              |
| `youtube-sync-service.ts`               | local | none                         | sync            | network                                       | n/a        | existing                                     | disabled                              |
| `platform-policy-service.ts`            | local | none                         | sync            | none                                          | n/a        | existing                                     | disabled                              |
| `identity-enrichment.ts`                | local | none                         | sync            | none                                          | n/a        | existing                                     | disabled                              |
| `identity-enrich-runner.ts`             | local | none                         | sync            | `node:fs` fixtures                            | n/a        | existing                                     | disabled                              |
| `backup-service.ts`                     | local | none                         | sync + async fs | `node:fs`, `sqlite.backup()`, PRAGMA, WAL/SHM | n/a        | `backup:eval`, `backup:doctor`, hotfix suite | disabled (`DEGRADED_HOSTED_RECOVERY`) |
| `local-scheduler.ts`                    | local | none                         | sync            | `setInterval`                                 | n/a        | existing                                     | disabled                              |
| `platform-scheduler.ts`                 | local | none                         | sync            | `setInterval`, module-local day key           | n/a        | existing                                     | disabled                              |
| `scheduler.ts`                          | local | none                         | sync            | `setInterval`                                 | n/a        | existing                                     | disabled                              |
| `source-schedule.ts`                    | local | none (advisory metadata)     | sync            | none                                          | n/a        | `source-schedule.test.ts`                    | disabled                              |
| `index.ts`                              | local | none (Node server entry)     | sync            | `@hono/node-server`, `node:fs`                | n/a        | n/a — replaced by a Sites entrypoint         | disabled                              |
| `packages/connectors/*`                 | local | none                         | sync            | network                                       | n/a        | `connectors.test.ts`                         | disabled                              |
| `packages/db/raw-store.ts`              | local | superseded hosted-side by R2 | sync            | `node:fs`, gzip                               | n/a        | existing                                     | disabled                              |
| `packages/db/paths.ts`, `client.ts`     | local | none                         | sync            | `node:fs`, `better-sqlite3`                   | n/a        | `paths.test.ts`, `client.test.ts`            | disabled                              |
| `packages/operations/backup-format.ts`  | local | none                         | sync            | `node:fs`, crypto                             | n/a        | `backup-security.test.ts`                    | disabled                              |
| `packages/operations/exclusive-lock.ts` | local | none                         | sync            | `node:fs`, PID liveness                       | n/a        | existing                                     | disabled                              |

---

## 3. Split responsibility

Modules whose request-integrity role spans both runtimes and therefore need a provider
rather than a port.

| Module                                                                                              | Reach | Contract                                                                                       | Conversion | Capability                                   |
| --------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------- |
| `packages/operations/src/index.ts` (integrity sessions, rate limit, headers, origin/fetch-metadata) | both  | `RequestIntegrityProvider` → `LocalRequestIntegrityProvider` / `SitesRequestIntegrityProvider` | pending    | operational in both, different backing state |

The local provider may keep the current in-memory session map. The Sites provider may
not: sessions are currently a module-level `Map`, unsigned and unpersisted, so any
restart or second isolate invalidates every outstanding CSRF token. See
`SITES_COMPATIBILITY_AUDIT.md` §5.

**Partially resolved.** The pure half of this module — `SecurityHeaders`,
`parseHostHeader`, `isLoopbackHost`, `hostAllowedIn`, `originAllowedIn`,
`fetchMetadataAllowed`, `redactLogLine` — moved to `packages/core/src/http.ts` and is now
shared by both runtimes. Every one of those functions takes its policy as an argument, so
neither runtime reads an environment from inside them; the local runtime supplies
`localOriginPolicy()` from `process.env`, and the hosted runtime builds its policy from
the Sites bindings with `allowLoopback: false`. `@healthspan/operations` re-exports them,
so local import sites are unchanged, and the whole package is now on the bundle doctor's
forbidden list because its root still imports `node:crypto`.

What remains open is the stateful half: `createIntegritySession` / `getIntegritySession` /
`validateCsrf` still use the module-level `Map` and `node:crypto`. The hosted app does not
use them at all today because it exposes no mutation — every non-GET request is refused
with `501`. A hosted session provider is required before the first hosted write path.

---

## 4. Coverage check

| Group                      | Modules |
| -------------------------- | ------- |
| Hosted-reachable (§1)      | 25      |
| Local-only (§2)            | 18      |
| Split (§3)                 | 1       |
| **Rows reading `UNKNOWN`** | **0**   |

Every `apps/api/src` non-test module at the baseline commit appears in exactly one
section. The §1 count is one higher than at the baseline because the hosted runtime
(`apps/sites`) is a new module group that did not exist then; `content-service.ts` was
not removed from the count, it moved to `packages/runtime`. Re-run the inventory and
update this ledger whenever a module is added, split, or changes runtime reachability.

---

## 5. Adapters not yet written

Distinct from conversion status, and the reason `/api/hosted-readiness` reports `ready:
false` today. A port can be `done` — contract defined, service converted, local adapter
passing the contract suite — while no hosted adapter exists to bind it to D1.

| Port                    | Local adapter                                       | D1 adapter  | Bound in hosted |
| ----------------------- | --------------------------------------------------- | ----------- | --------------- |
| `ContentReadRepository` | `packages/db/src/repositories/content.ts` — passing | not written | no              |

When the D1 adapter lands it binds `packages/db/src/repositories/content.contract.ts` —
the same suite the local adapter runs, not a parallel one — and
`apps/sites/src/runtime.ts`'s `createSitesRepositories` returns it. No route changes.
