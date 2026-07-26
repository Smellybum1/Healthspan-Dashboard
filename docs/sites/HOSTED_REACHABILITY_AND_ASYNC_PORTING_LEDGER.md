# Hosted Reachability and Async Porting Ledger

Milestone 7, Amendment I §3. Every module that touches data or the request path is
classified here. **No row may read `UNKNOWN`.**

**Baseline commit:** `a59d202a481f8ef4982ad314f88350024b2373cf`
**Status:** classification complete. Conversion in progress — **11 of 20 convertible rows
`done`**, plus **one blocked**. Done: content, review, assessment, creator reads,
creator-review reads, identity-task reads, evidence-link reads, entity resolution,
intelligence reads, intervention reads, and regulatory/safety reads. **Blocked: `dossier-service.ts` — `getDossier`
writes to the database on a GET (§12), which needs a product decision before it can be a
hosted read.** A row may only be marked `done` once its module is a declared root in
`scripts/sites-bundle-doctor.ts` and that gate is green.

**Remaining convertible rows:** `comparison-service.ts`, `jobs.ts`,
`operations-panels.ts`, the two route layers, and personalisation. The dossier row is
blocked rather than pending.

**A row may split rather than move.** `creator-service.ts` held hosted-reachable reads and
local-only writes in one file, so the reads moved to `@healthspan/runtime` and the writes
stayed behind as their own `local` row. The ledger's rule still holds — what is left in
`apps/api/src` is not ported — but a module name can now appear as a `done` row and a
`local` row at once. See §9.

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

| Module                                                                                                | Reach | Repository port                                       | Sync/async | Node-only dep                            | Conversion  | Test / parity suite                                       | Capability                                                        |
| ----------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------- | ---------- | ---------------------------------------- | ----------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| `packages/runtime/src/content.ts` (was `content-service.ts`)                                          | both  | `ContentReadRepository`                               | **async**  | none                                     | **done**    | `content.contract.ts`                                     | operational                                                       |
| `packages/runtime/src/intervention.ts` (entity + resolution-task + trial reads)                       | both  | `InterventionReadRepository`                          | **async**  | none                                     | **done**    | `intervention.contract.ts`                                | operational                                                       |
| `packages/runtime/src/regulatory.ts` (7 reads, was `regulatory-safety-service.ts`)                    | both  | `RegulatoryReadRepository`                            | **async**  | none                                     | **done**    | `regulatory.contract.ts`                                  | operational                                                       |
| `regulatory-safety-service.ts` (AEMS persistence, refresh runs)                                       | local | none — direct `HealthspanDb`                          | sync       | `node:crypto`, connectors                | n/a         | existing                                                  | `disabled` (connector-backed refresh is local-only)               |
| `dossier-service.ts` (`buildDossierSnapshot`, `getDossier`, bootstrap, mention resolution)            | both  | `InterventionReadRepository`                          | sync       | `node:crypto`                            | **blocked** | —                                                         | **see §12 — `getDossier` writes on a GET**                        |
| `comparison-service.ts`                                                                               | both  | `InterventionReadRepository`                          | sync       | none                                     | pending     | `sites:parity` interventions                              | operational                                                       |
| `regulatory-safety-service.ts` (7 read functions)                                                     | both  | `InterventionReadRepository`                          | sync       | `node:crypto`                            | pending     | `sites:parity` regulatory                                 | operational                                                       |
| `trial-portfolio.ts` (`linkTrialInterventionsToEntities` only)                                        | local | none — direct `HealthspanDb`                          | sync       | `node:crypto`                            | n/a         | existing                                                  | `disabled`                                                        |
| `apps/sites/src/index.ts`, `app.ts`, `runtime.ts`, `env.ts`                                           | sites | hosted route layer over the ports below               | **async**  | none                                     | **done**    | `apps/sites/src/*.test.ts`, `sites:bundle:doctor`         | operational                                                       |
| `packages/db/src/adapters/sites-d1/*`                                                                 | sites | D1 adapters behind the ports (`@healthspan/db/sites`) | **async**  | none                                     | **done**    | `sites-d1/*.test.ts` (shared contracts)                   | operational                                                       |
| `trial-portfolio.ts`                                                                                  | both  | `TrialReadRepository`                                 | sync       | none                                     | pending     | `sites:parity` trials                                     | operational                                                       |
| `dossier-service.ts`                                                                                  | both  | `InterventionReadRepository`                          | sync       | none                                     | pending     | `sites:parity` interventions                              | operational                                                       |
| `comparison-service.ts`                                                                               | both  | `InterventionReadRepository`                          | sync       | none                                     | pending     | `sites:parity` interventions                              | operational                                                       |
| `regulatory-safety-service.ts`                                                                        | both  | `InterventionReadRepository`                          | sync       | none                                     | pending     | `sites:parity` regulatory                                 | operational                                                       |
| `packages/runtime/src/assessment.ts` (was `assessment-service.ts`)                                    | both  | `ClaimAssessmentRepository`                           | **async**  | none                                     | **done**    | `assessment.contract.ts`, `assessment-parity.test.ts`     | operational                                                       |
| `packages/runtime/src/intelligence.ts` (reads, was `intelligence-service.ts`)                         | both  | `IntelligenceReadRepository`                          | **async**  | none                                     | **done**    | `intelligence.contract.ts`, `intelligence-parity.test.ts` | operational                                                       |
| `intelligence-service.ts` (`runIntelligenceAnalysis`, staleness marking)                              | local | none — direct `HealthspanDb`                          | sync       | `node:crypto`                            | n/a         | existing                                                  | `disabled` (analysis run is local-only)                           |
| `packages/runtime/src/creator.ts` (evidence-link reads, was `creator-evidence-service.ts`)            | both  | `CreatorReadRepository`                               | **async**  | none                                     | **done**    | `creator.contract.ts`                                     | operational                                                       |
| `creator-evidence-service.ts` (link creation, staleness marking)                                      | local | none — direct `HealthspanDb`                          | sync       | `node:crypto`                            | n/a         | existing                                                  | `disabled` (no hosted mutation — §6)                              |
| `packages/runtime/src/creator.ts` (reads, was `creator-service.ts` + `creator-recurrence-service.ts`) | both  | `CreatorReadRepository`                               | **async**  | none                                     | **done**    | `creator.contract.ts`, `creator-parity.test.ts`           | operational                                                       |
| `creator-service.ts` (writes: documents, accounts, manual claims, bootstrap)                          | local | none — direct `HealthspanDb`                          | sync       | `node:fs` (document write/delete)        | n/a         | existing                                                  | `disabled`                                                        |
| `creator-recurrence-service.ts` (`rebuildClaimRecurrence` only)                                       | local | none — direct `HealthspanDb`                          | sync       | `node:crypto` (source-scope hash)        | n/a         | existing                                                  | `disabled`                                                        |
| `packages/runtime/src/review.ts` (was `review-service.ts`)                                            | both  | `ReviewRepository`                                    | **async**  | none                                     | **done**    | `review.contract.ts`                                      | reads operational; hosted resolve withheld — see §6               |
| `packages/runtime/src/review.ts` (creator-review reads, was `creator-review-service.ts`)              | both  | `ReviewRepository`                                    | **async**  | none                                     | **done**    | `review.contract.ts` creator-review suite                 | operational                                                       |
| `creator-review-service.ts` (`resolveCreatorReviewTask` only)                                         | local | none — direct `HealthspanDb`                          | sync       | none                                     | n/a         | existing                                                  | `disabled` (no hosted mutation — §6)                              |
| `entity-resolution-service.ts` (`resolveEntityResolutionTask` only — it has no reads)                 | local | none — direct `HealthspanDb`                          | sync       | `node:crypto`                            | n/a         | `entity-resolution-service.test.ts`                       | `disabled` (no hosted mutation — §6)                              |
| `packages/runtime/src/review.ts` (identity-task reads, was `creator-identity-service.ts`)             | both  | `ReviewRepository`                                    | **async**  | none                                     | **done**    | `review.contract.ts` creator-review suite                 | operational                                                       |
| `creator-identity-service.ts` (roles, snapshots, task resolution)                                     | local | none — direct `HealthspanDb`                          | sync       | `node:crypto`                            | n/a         | existing                                                  | `disabled` (no hosted mutation — §6)                              |
| `personalization-service.ts`                                                                          | both  | `PersonalisationRepository`                           | sync       | none                                     | pending     | `sites:parity` personalisation                            | operational                                                       |
| `personalization-iv.ts`                                                                               | both  | `PersonalisationRepository`, `AlertBriefRepository`   | sync       | none                                     | pending     | `sites:parity` alerts/briefs                              | operational                                                       |
| `jobs.ts`                                                                                             | both  | `JobRepository`                                       | sync       | none                                     | pending     | `sites:parity` jobs                                       | operational (bounded, request-triggered)                          |
| `operations-panels.ts`                                                                                | both  | `ObjectMetadataRepository`, readiness status          | sync       | `node:fs` (storage walk), PRAGMA, VACUUM | pending     | `sites:doctor`                                            | readiness `operational`; VACUUM / storage walk / prune `disabled` |
| `app.ts`                                                                                              | both  | route layer over the ports above                      | sync       | none                                     | pending     | `sites:bundle:doctor`                                     | operational                                                       |
| `m6-routes.ts`                                                                                        | both  | route layer over the ports above                      | sync       | none                                     | pending     | `sites:bundle:doctor`                                     | operational                                                       |
| `safe-response.ts`                                                                                    | both  | none (pure)                                           | n/a        | none                                     | n/a         | unit                                                      | operational                                                       |
| `admin-guard.ts`                                                                                      | both  | none (pure)                                           | n/a        | none                                     | n/a         | unit                                                      | operational                                                       |
| `job-priorities.ts`                                                                                   | both  | none (constants)                                      | n/a        | none                                     | n/a         | unit                                                      | operational                                                       |
| `packages/db` schema modules                                                                          | both  | schema shared by both adapters                        | n/a        | none                                     | n/a         | `sites:db:lint`                                           | operational                                                       |

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
| `CreatorReadRepository`     | `packages/db/src/repositories/creator.ts` — passing    | `packages/db/src/adapters/sites-d1/creator.ts` — passing    | yes, when `DB` is bound |

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

---

## 9. The creator port — two structural problems, not one conversion

Recorded separately because neither was an async conversion, and both would have broken
the hosted runtime rather than merely slowed it.

### Every creator read began by writing

`bootstrapCreatorCatalog` seeds curated creator profiles, aliases, and platform policy
rows. It was the first statement of `listCreators`, `listCreatorClaims`,
`getCreatorDetail`, and `creatorWatchItems` — a write executed on every GET.

Hosted, that is wrong twice over: a read path must not write, and §14 permits synthetic
fixture data only, so seeding curated profiles into D1 would put non-fixture data in
hosted storage. No ported function bootstraps. The local runtime preserves its behaviour
exactly by calling `bootstrapCreatorCatalog` from its own routes before the shared
service runs, so a fresh local database still self-seeds on first creator read.

### Creator detail held a nested N+1

For each of up to forty videos it re-selected the _entire_ `platform_content_current`
table and searched it in memory. Forty full table scans per creator page locally; forty
network round trips pulling forty copies of the table on D1.

It is now a **left** join. Left, not inner: the in-memory `.find()` returning `undefined`
still produced a video entry with null metadata, and an inner join would silently drop
those videos. The contract asserts a video with no current row survives, and flipping the
D1 adapter to an inner join fails that assertion plus the ordering one.

`creator-parity.test.ts` runs the retired implementations against the ported ones over
one fixture — eleven list queries, five claim queries, four creator ids — and asserts
identical output. It also asserts the statement-count difference is exactly three, the
three videos in the fixture. **Delete it once the M7 completion report is accepted.**

### Two smaller consequences

`recurrenceSourceScopeHash` moved out of `@healthspan/creators`'s `recurrence.ts` into
`recurrence-hash.ts`. That module is reached from the hosted graph through the new
`@healthspan/creators/recurrence` subpath export, and its `node:crypto` import would have
put the whole package on the wrong side of the boundary. Its only caller is the local-only
`rebuildClaimRecurrence`.

`listMonitoredAccounts` was **not** ported. Its only callers are `ingest.ts`,
`x-sync-service.ts`, and `youtube-sync-service.ts` — all local-only rows — so putting it
on the port would have cascaded async through three services for no hosted benefit. It
stays synchronous in `creator-service.ts`.

`listCreatorRoles` now exists twice: on the port for creator detail, and still in
`creator-identity-service.ts`, where `rebuildCreatorProfileSnapshot` — a synchronous
local-only write — calls it. Awaiting the port there would make that write async and
cascade through its callers, which belongs to that row rather than this one. The
duplication is a five-line select-and-map with no logic in it; it resolves when the
identity writes are ported.

---

## 10. The review surface — reads ported, writes classified `local`

The remaining `ReviewRepository` and evidence rows split the same way
`creator-service.ts` did (§9), but with a sharper line: **every one of these modules had
its reads ported and its writes left behind**, because no hosted mutation exists to serve
and none may exist before the session provider lands (§6).

That is a deliberate stopping point, not an unfinished one. The rows read `n/a` rather
than `pending` because converting a write that the hosted runtime refuses at the
middleware would add async signatures to local-only call paths for no reachable benefit —
the same reasoning that kept `listMonitoredAccounts` synchronous (§9).

`entity-resolution-service.ts` moved from the hosted-reachable slice to `local` outright.
It exports one action list and one write; the `listEntityResolutionTasks` the ledger
implied belonged to it actually lives in `dossier-service.ts` and travels with the
interventions row.

### Another N+1, and a second left join

`listCreatorReviewTasks` loaded every `creator_claim_findings` row, filtered in memory,
then re-selected the whole `creator_claims` table once per surviving finding. It is now
one left join.

Left again, and for the same class of reason as the video join: `claim_id` is nullable,
and a finding with no claim still produced a task — titled by its finding type, with the
default confidence. An inner join drops it silently. Flipping the D1 adapter to
`innerJoin` fails two contract cases, which is how that is held.

### Two rules that stayed out of SQL, on purpose

`isAdverseCreatorFinding` is a prefix match over a list of finding-type names. Pushing it
into a `WHERE` clause would mean encoding that list into both adapters — two copies of one
rule, free to drift. It lives in `@healthspan/core` and runs in the shared service, over
rows the query has already narrowed to candidates requiring review. The local-only
`resolveCreatorReviewTask` now imports the same function rather than keeping its own copy.

`listPublishedCreatorFindings` applies _two_ rules depending on the finding: an adverse
one must be accepted **and** published; a non-adverse one merely must not be rejected. Also
not expressible as one predicate, and also in the service.

**Finding:** `listPublishedCreatorFindings` has no caller anywhere in the repository. It
encodes the rule governing what a creator profile may display, so it was ported rather
than deleted, and the contract pins both branches — but the absence of a caller is worth a
decision. Either the profile-publish path should be using it, or it is dead.

---

## 11. Intelligence reads — four shapes changed, one order was never defined

The reads split from `runIntelligenceAnalysis` cleanly: the analysis run writes, calls
into `@healthspan/intelligence`, and stays a local-only row. Everything the hosted runtime
_reads_ moved. Four query shapes changed, all for cost:

| Retired shape                                                                                      | Ported shape                                      |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `intelligenceStatus` loaded two whole tables to count rows in them                                 | three bounded `count(*)` queries                  |
| `listLiveClaims` loaded every claim, filtered in memory, then one span query per claim on the page | filters in SQL; one `inArray` span query per page |
| `getLiveClaim` loaded the whole `claim_relationships` table                                        | one `or(left, right)` predicate                   |
| `liveRadarPoints` issued two or three queries per intelligence state                               | one three-way join                                |

`intelligence-parity.test.ts` freezes all four retired implementations and compares them
against the ported ones over one fixture — 14 claim queries, four claim ids, plus the
status and radar outputs. It also asserts the statement counts directly: three for a page
of claims, four for status, four for a claim detail. **Delete it once the M7 completion
report is accepted.**

### The radar order was never specified

`liveRadarPoints` consumed intelligence states in whatever order the driver happened to
return them and stopped once it had `limit` points. Which points survived a truncation was
therefore undefined — not a behaviour to be faithful to, because there was no defined
behaviour. The port imposes **newest analysis first**.

Below the limit the set is identical, and the parity test compares order-insensitively to
say exactly that. Above it, the visible effect is that a radar now shows the most recently
assessed items rather than an arbitrary subset. That is an improvement, but it is a
_visible change_, so it is recorded here rather than buried.

### One shape disagreement the port had to resolve

The two retired readers disagreed about span rows: `listLiveClaims` projected four fields,
`getLiveClaim` returned the row as stored, including `spanHash` and `createdAt`. One port
method now returns the full row and the list service narrows it, so neither caller loses a
field it had. The parity test caught this — the first version of the port returned the
narrow shape from both and failed on the detail comparison.

### A contract hole the mutation check found

Breaking the D1 span fetch to load only the _first_ claim's spans initially passed the
whole contract: the suite asserted spans for the first claim on the page and for a claim
that had none, but never for a claim in between. The assertion is now explicit that every
claim on the page gets its own spans. A batched query is only correct if it covers the
whole batch, and only an assertion about a middle element can show that.

---

## 12. BLOCKED — `GET /api/dossiers/:id` writes to the database

This row is **blocked, not pending**. It needs a decision before it can be ported, and the
decision is a product one.

`getDossier` calls `buildDossierSnapshot`, which:

- inserts a row into `dossier_snapshots`,
- inserts one `dossier_source_dependencies` row per linked analysis and claim,
- upserts `intervention_dossier_state`,
- updates `intervention_entities.current_dossier_snapshot_id`,
- and appends a `dossier_change_events` row when a prior snapshot existed.

All of that runs on `GET /api/dossiers/:id` (`apps/api/src/app.ts`). There is an
input-hash reuse check, so a repeat request with unchanged inputs returns
`reused: true` without writing — but the _first_ request after any upstream change
rebuilds and persists. It also hashes with `node:crypto`.

A hosted read may not write, and hosted storage is synthetic-fixture-only, so this cannot
be ported as it stands.

### The two options, and why neither is an implementation detail

**Split build from read.** Extract the snapshot computation as a pure function over read
data; hosted computes and returns without persisting, local keeps persisting. Faithful,
but it means the hosted runtime does the full dossier computation on every request, and
the computation is the expensive part.

**Serve the stored snapshot.** Hosted reads `intervention_dossier_state.current_snapshot_id`
and returns it; the snapshot is built only by a local job or a hosted maintenance tick.
Cheap and arguably the intended design — snapshots exist precisely so a read need not
recompute — but the two runtimes then answer differently when a snapshot is stale, which
is a real product difference rather than a porting artefact.

**This needs an owner or project-manager ruling.** Recorded here rather than decided in
implementation, per the standing split.

### What was ported around it

The intervention reads that do _not_ depend on the dossier build are done:
`listInterventionEntities`, `listEntityResolutionTasks` (which lives in
`dossier-service.ts` but touches none of the build), and `trialPortfolioForEntity`.

Two shapes changed. The entity list's active/type/name filters became column predicates
instead of three in-memory passes over the whole table — and the `intervention` type
filter is worth naming, because it means _not a peptide_ rather than a value of
`entity_type`. `parseInterventionTypeFilter` in `@healthspan/core` encodes that once so
neither adapter can invent its own reading. The trial portfolio became a **left** join
instead of one trial query per link; left, because a link pointing at an absent trial row
still produced an entry with nulls, and the portfolio should show that a link exists even
when the trial is missing. Flipping the D1 adapter to an inner join fails two contract
cases.

`trialPortfolioForEntity` has no hosted caller yet — its only consumer is the dossier
build. It is ported because the port is its right home and the contract exercises it, and
it is recorded here so that is a stated fact rather than an oversight.

---

## 13. Regulatory and safety reads — batching, and two merges that cannot move

All seven reads loaded a whole table and filtered it in memory. Two then issued a query
per row _on the page_: ingredients per product, adverse-event terms per snapshot. At the
default page size of fifty that is fifty extra statements — fifty network round trips on
D1 — for one list. Both are now single `inArray` reads, grouped in the shared service.

`workspaceSummary` was already six bounded counts and needed no reshaping; the D1 adapter
issues them concurrently rather than in sequence.

### What stayed in the service, and why it had to

Two of these lists combine rows from several tables:

- `listSafetyItems` merges curated safety items with TGA regulatory notices drawn from
  `content_items` joined to `regulatory_events`, capped at 100.
- `listRegulatoryHistory` merges status history, assertions, and dossier change events
  into one timeline.

In both cases the merge happens **before** the sort and the page. An adapter that paged
its own slice would produce different page boundaries, so the adapters return filtered
rows and the shared service merges, orders, and paginates. That is also why
`paginateRegulatory` lives in `@healthspan/core` rather than in either app — the retired
`paginate` helper's exact clamping (default 50, max 200, non-numeric offset to 0) is part
of the contract, and the contract asserts each bound.

### The jurisdiction filter's one divergence

The retired reads compared jurisdiction and authority by lower-casing both sides in
JavaScript; the port uses SQLite's `lower()`. That is the same ASCII-folding divergence
accepted for content and assessment search. Jurisdiction and authority are short codes
(`AU`, `US`, `TGA`, `FDA`), so the practical risk is nil, but it is recorded rather than
assumed away.

`listSafetyItems` filters twice on purpose: the jurisdiction predicate reaches the safety
items in SQL, but the notices carry a defaulted jurisdiction from a joined table, so the
combined list is filtered again in the service exactly as the retired implementation did.

### The mutation check fired correctly this time

Breaking the D1 ingredient batch to fetch only the first product's ingredients failed the
contract immediately — because the assertion checks a product in the middle of the page
and a product with no ingredients, not just the first. That is the lesson from the
intelligence port applied before it could bite again.
