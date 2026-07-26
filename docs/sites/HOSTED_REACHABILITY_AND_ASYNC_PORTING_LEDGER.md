# Hosted Reachability and Async Porting Ledger

Milestone 7, Amendment I §3. Every module that touches data or the request path is
classified here. **No row may read `UNKNOWN`.**

**Baseline commit:** `a59d202a481f8ef4982ad314f88350024b2373cf`
**Status:** classification complete. Conversion in progress — **3 of 20 convertible rows
`done`** (content, review, assessment). The hosted runtime exists and all three domains
are served end to end in hosted mode by D1 adapters, with the review _write_ path ported
but deliberately not exposed (§6). A row may only be marked `done` once its module is a
declared root in `scripts/sites-bundle-doctor.ts` and that gate is green.

**Ported modules move out of `apps/api/src`.** A hosted-reachable service now lives in
`packages/runtime`, above the ports and below either application, so both runtimes
execute the same code rather than two copies of it. A service still sitting in
`apps/api/src` is one that has not been ported yet — that is the ledger's fastest read.

When a module is ported, any local-only helper it happened to contain travels to the
module that actually uses it rather than being left behind in an empty file.
`markOpenReviewsStaleForContent` moved from `review-service.ts` into
`intelligence-service.ts`, its only caller: it belongs to the reassessment flow, not to
the review surface, and it stays synchronous with that still-`pending` row.

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

| Module                                                             | Reach | Repository port                                       | Sync/async | Node-only dep                            | Conversion | Test / parity suite                                   | Capability                                                        |
| ------------------------------------------------------------------ | ----- | ----------------------------------------------------- | ---------- | ---------------------------------------- | ---------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `packages/runtime/src/content.ts` (was `content-service.ts`)       | both  | `ContentReadRepository`                               | **async**  | none                                     | **done**   | `content.contract.ts`                                 | operational                                                       |
| `apps/sites/src/index.ts`, `app.ts`, `runtime.ts`, `env.ts`        | sites | hosted route layer over the ports below               | **async**  | none                                     | **done**   | `apps/sites/src/*.test.ts`, `sites:bundle:doctor`     | operational                                                       |
| `packages/db/src/adapters/sites-d1/*`                              | sites | D1 adapters behind the ports (`@healthspan/db/sites`) | **async**  | none                                     | **done**   | `sites-d1/*.test.ts` (shared contracts)               | operational                                                       |
| `trial-portfolio.ts`                                               | both  | `TrialReadRepository`                                 | sync       | none                                     | pending    | `sites:parity` trials                                 | operational                                                       |
| `dossier-service.ts`                                               | both  | `InterventionReadRepository`                          | sync       | none                                     | pending    | `sites:parity` interventions                          | operational                                                       |
| `comparison-service.ts`                                            | both  | `InterventionReadRepository`                          | sync       | none                                     | pending    | `sites:parity` interventions                          | operational                                                       |
| `regulatory-safety-service.ts`                                     | both  | `InterventionReadRepository`                          | sync       | none                                     | pending    | `sites:parity` regulatory                             | operational                                                       |
| `packages/runtime/src/assessment.ts` (was `assessment-service.ts`) | both  | `ClaimAssessmentRepository`                           | **async**  | none                                     | **done**   | `assessment.contract.ts`, `assessment-parity.test.ts` | operational                                                       |
| `intelligence-service.ts`                                          | both  | `ClaimAssessmentRepository`                           | sync       | none                                     | pending    | `sites:parity` claims                                 | operational (read models only; analysis run is local-only)        |
| `creator-evidence-service.ts`                                      | both  | `CreatorReadRepository`                               | sync       | none                                     | pending    | `sites:parity` creators                               | operational                                                       |
| `creator-recurrence-service.ts`                                    | both  | `CreatorReadRepository`                               | sync       | none                                     | pending    | `sites:parity` creators                               | operational                                                       |
| `creator-service.ts`                                               | both  | `CreatorReadRepository`                               | sync       | `node:fs` (document write/delete)        | pending    | `sites:parity` creators                               | operational for reads; document write/delete `disabled`           |
| `packages/runtime/src/review.ts` (was `review-service.ts`)         | both  | `ReviewRepository`                                    | **async**  | none                                     | **done**   | `review.contract.ts`                                  | reads operational; hosted resolve withheld — see §6               |
| `creator-review-service.ts`                                        | both  | `ReviewRepository`                                    | sync       | none                                     | pending    | `sites:parity` review                                 | operational                                                       |
| `entity-resolution-service.ts`                                     | both  | `ReviewRepository`                                    | sync       | none                                     | pending    | `sites:parity` review                                 | operational                                                       |
| `creator-identity-service.ts`                                      | both  | `ReviewRepository`                                    | sync       | none                                     | pending    | `sites:parity` review                                 | operational                                                       |
| `personalization-service.ts`                                       | both  | `PersonalisationRepository`                           | sync       | none                                     | pending    | `sites:parity` personalisation                        | operational                                                       |
| `personalization-iv.ts`                                            | both  | `PersonalisationRepository`, `AlertBriefRepository`   | sync       | none                                     | pending    | `sites:parity` alerts/briefs                          | operational                                                       |
| `jobs.ts`                                                          | both  | `JobRepository`                                       | sync       | none                                     | pending    | `sites:parity` jobs                                   | operational (bounded, request-triggered)                          |
| `operations-panels.ts`                                             | both  | `ObjectMetadataRepository`, readiness status          | sync       | `node:fs` (storage walk), PRAGMA, VACUUM | pending    | `sites:doctor`                                        | readiness `operational`; VACUUM / storage walk / prune `disabled` |
| `app.ts`                                                           | both  | route layer over the ports above                      | sync       | none                                     | pending    | `sites:bundle:doctor`                                 | operational                                                       |
| `m6-routes.ts`                                                     | both  | route layer over the ports above                      | sync       | none                                     | pending    | `sites:bundle:doctor`                                 | operational                                                       |
| `safe-response.ts`                                                 | both  | none (pure)                                           | n/a        | none                                     | n/a        | unit                                                  | operational                                                       |
| `admin-guard.ts`                                                   | both  | none (pure)                                           | n/a        | none                                     | n/a        | unit                                                  | operational                                                       |
| `job-priorities.ts`                                                | both  | none (constants)                                      | n/a        | none                                     | n/a        | unit                                                  | operational                                                       |
| `packages/db` schema modules                                       | both  | schema shared by both adapters                        | n/a        | none                                     | n/a        | `sites:db:lint`                                       | operational                                                       |

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
| Hosted-reachable (§1)      | 26      |
| Local-only (§2)            | 18      |
| Split (§3)                 | 1       |
| **Rows reading `UNKNOWN`** | **0**   |

Every `apps/api/src` non-test module at the baseline commit appears in exactly one
section. The §1 count is two higher than at the baseline because the hosted runtime
(`apps/sites`) and the D1 adapters (`packages/db/src/adapters/sites-d1`) are new module
groups that did not exist then; `content-service.ts` was not removed from the count, it
moved to `packages/runtime`. Re-run the inventory and update this ledger whenever a
module is added, split, or changes runtime reachability.

---

## 5. Adapter status

Distinct from conversion status. A port can be `done` — contract defined, service
converted — while no hosted adapter exists to bind it to D1. `/api/hosted-readiness`
reports the two separately, as `ported` and `bound`.

| Port                        | Local adapter                                          | D1 adapter                                                  | Bound in hosted         |
| --------------------------- | ------------------------------------------------------ | ----------------------------------------------------------- | ----------------------- |
| `ContentReadRepository`     | `packages/db/src/repositories/content.ts` — passing    | `packages/db/src/adapters/sites-d1/content.ts` — passing    | yes, when `DB` is bound |
| `ReviewRepository`          | `packages/db/src/repositories/review.ts` — passing     | `packages/db/src/adapters/sites-d1/review.ts` — passing     | yes, when `DB` is bound |
| `ClaimAssessmentRepository` | `packages/db/src/repositories/assessment.ts` — passing | `packages/db/src/adapters/sites-d1/assessment.ts` — passing | yes, when `DB` is bound |

Both adapters bind `repositories/content.contract.ts` — the same eleven cases, not a
parallel suite — and both build their predicate, ordering, and count projection from
`repositories/content-query.ts`, so they cannot drift on search or sort semantics. They
differ only in execution: synchronous `.all()` against `better-sqlite3`, awaited against
the D1 driver.

**Reached as `@healthspan/db/sites`, never `@healthspan/db`.** The package root exposes
`HealthspanDb`, `openDatabase`, and the native driver and is on the bundle doctor's
forbidden list; the conditional export reaches only the adapter subtree. The doctor
resolves and walks that subtree from `apps/sites/src/index.ts` and now lists every module
it visited, because a bare count cannot distinguish a clean walk from a specifier that
failed to resolve.

### What the D1 contract run does and does not establish

The suite runs the real adapter through the real `drizzle-orm/d1` driver — SQL
construction, `prepare`, `bind`, and the async `all`/`raw` paths — against a database
created by the project's own migrations, so schema drift is excluded. The binding beneath
it is `src/testing/d1-shim.ts`, a `better-sqlite3`-backed implementation of the D1
surface.

It is therefore **not evidence about the D1 service**: not network behaviour, statement
timeouts, result-set limits, real `meta` fields, `batch` atomicity (the shim's batch is a
sequential loop, not a transaction), or migrations applied to a real D1 instance. Closing
that gap is the `sites:parity` row — a corpus run against a provisioned D1. No row may
claim hosted verification on the strength of the shim.

---

## 6. Ported but deliberately not exposed hosted

A domain can be fully ported — port defined, service converted, both adapters passing the
same contract — and still not be reachable from the hosted app. The distinction matters:
the migration work is complete, and the withholding is a security decision, not a gap.

| Route                                | Status              | Why                                                                                                  |
| ------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------- |
| `POST /api/review/tasks/:id/resolve` | ported, not exposed | Needs the hosted session/CSRF provider (§3, audit §5) and an owner principal to record as the actor. |

The hosted app currently refuses **every** non-GET with `501` and a named capability, so
this is enforced by the middleware rather than by remembering not to add a route.
`resolveReviewTask` takes an `actor` parameter with a `local_admin` default precisely so
that wiring the hosted path later cannot silently record a hosted owner's decision as a
local admin's; the contract asserts the supplied actor is what gets stored.

---

## 7. Behaviour preserved rather than fixed

Ports are behaviour-neutral by policy. Where the local implementation had a defect, it
was carried across unchanged and recorded here rather than quietly corrected — a
migration that also changes behaviour cannot be reviewed as a migration.

**`listReviewTasks` filters status after applying the limit.** `{ status: 'open', limit:
100 }` returns the open tasks _among the newest 100 tasks_, which can be far fewer than
100 open tasks, and zero once enough resolved tasks accumulate. Pushing the predicate into
SQL would be more useful and is a one-line change.

The oddity now lives in exactly one place — `listReviewTasks` in `@healthspan/runtime` —
rather than being duplicated into two adapters, and the contract asserts it explicitly so
the two runtimes cannot diverge on it. **This needs an owner or project-manager decision**
before it is changed, since it alters a local API response.

---

## 8. Query shapes a port had to change

Distinct from §7. Those were behaviours preserved unchanged; these are cases where the
local implementation _could not_ be ported as written, because the hosted runtime makes
its cost categorically different.

**`listAssessments` was a per-item loop.** It selected every row of
`content_intelligence_state`, then issued one query for the analysis and one for the
content item per state. On `better-sqlite3` that is merely slow. On D1 each statement is a
network round trip, so listing 500 assessments would have been 1,001 of them — before any
filtering, on every request. The port replaces it with a single join expressing the same
three conditions the loop enforced.

A change of query shape is only safe if it is not also a change of results, and the
contract tests could not establish that: they were written against the new implementation
and would agree with it about a wrong answer. So the retired algorithm is frozen verbatim
in `assessment-parity.test.ts` and both are run over one fixture for 24 query
combinations, asserting identical output. The fixture is built to hit every branch the
loop had: no current analysis, superseded analysis, missing content item, retraction by
status, retraction by signal, and a malformed JSON column. That file also asserts the
statement counts directly — 1 for the port, more than 10 for the loop.

**Delete `assessment-parity.test.ts` once the M7 completion report is accepted.** Until
then it is the evidence for this row.

### One accepted divergence

Search now uses SQLite's `lower()` where the loop used JavaScript's `toLowerCase()`.
`lower()` folds ASCII only, so a non-ASCII title could match under one and not the other.
This was accepted rather than worked around: it makes assessment search behave exactly
like content search, instead of shipping two search semantics in one product. The parity
fixtures are ASCII, so the parity test does not cover this case — it is a known,
deliberate difference, not an untested one.

### Still unbounded, and why

The result set is whole-table for the filters that reach SQL. The service must count every
row surviving the retraction filter to report `total`, and retraction is derived from
parsing `methodological_signals_json` rather than stored as a column. Bounding it needs
that flag denormalised into a column — schema work, tracked separately. The query _count_
is now bounded at one, which is what made the domain hosted-viable; the row count is not.
