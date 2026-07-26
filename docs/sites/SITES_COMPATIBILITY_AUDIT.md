# Sites Compatibility Audit

Milestone 7, Amendment I §4. Records the measured migration baseline and the specific
constraints a ChatGPT Sites / Cloudflare D1 + R2 runtime imposes on this codebase.

**Measured at:** `a59d202a481f8ef4982ad314f88350024b2373cf` (exact M7 base), 2026-07-26.

These counts are a **dated migration baseline**, not permanent acceptance thresholds.
They exist so that scope is argued from measurement rather than impression.

---

## 1. Measured baseline

| Metric                                                                 | Count |
| ---------------------------------------------------------------------- | ----- |
| Synchronous terminal executions (`.all()` / `.run()`)                  | 661   |
| Drizzle query entrypoints (`db.select\|insert\|update\|delete\|query`) | 365   |
| Files containing Drizzle entrypoints                                   | 42    |
| `export function` in `apps/api/src`                                    | 205   |
| `export async function` in `apps/api/src`                              | 10    |
| `HealthspanDb` type references                                         | 447   |
| `openDatabase()` call sites                                            | 62    |
| Route handlers in `app.ts`                                             | 114   |
| Route handlers in `m6-routes.ts`                                       | 63    |
| `PRAGMA` sites                                                         | 20    |
| `VACUUM` sites                                                         | 2     |
| `sqlite.backup()` sites                                                | 1     |
| Migration files                                                        | 13    |
| Application `db.transaction()`                                         | **0** |
| `SAVEPOINT`                                                            | **0** |
| `ATTACH`                                                               | **0** |
| FTS5 / virtual tables                                                  | **0** |

Search is `LIKE`-based (`apps/api/src/content-service.ts`).

The M7 brief cited slightly lower figures (657 / 366 / 204 / 393 / 60) measured at
`e876231`. The differences are the backup hotfix landing between those commits, plus a
wider file scope in this re-measurement. The direction and magnitude are unchanged.

---

## 2. What the zero rows mean

Three of the hardest D1 migration problems **do not exist here**, and this materially
reduces risk:

- **No application transactions.** D1 offers `batch()` with constrained semantics rather
  than interactive transactions. With zero `db.transaction()`, `SAVEPOINT`, or nested
  transaction usage, there is no transactional behaviour to reproduce. (It is also a
  latent correctness gap in the current local code — multi-statement writes are not
  atomic today — but that is pre-existing and out of M7 scope.)
- **No `ATTACH`.** Nothing depends on cross-database queries.
- **No FTS5 or virtual tables.** There is no full-text engine to replace; hosted
  correctness therefore does not depend on FTS5, as Amendment §6 requires.

---

## 3. What does not port

| Surface                                             | Sites/D1 constraint                                                                     |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `better-sqlite3`                                    | Native addon; unavailable in a Workers-style runtime                                    |
| Synchronous driver                                  | D1 is async-only, so hosted-reachable call sites must be awaited                        |
| `PRAGMA` (20 sites)                                 | Not available; `databaseDoctor()` is entirely PRAGMA-based and is served on live routes |
| `VACUUM` (2 sites)                                  | Not available; one is exposed on a live route via `m6-routes.ts`                        |
| `sqlite.backup()`                                   | Online Backup API has no D1 equivalent                                                  |
| WAL / `-wal` / `-shm` handling                      | Restore manipulates sidecar files directly; no analogue                                 |
| Filesystem (`node:fs`)                              | No filesystem; object storage only                                                      |
| PID-file exclusive lock                             | Assumes one host, one filesystem, real PIDs                                             |
| `setInterval` schedulers and job worker             | No always-on process; hosted scheduling is request-triggered                            |
| In-memory integrity sessions and rate-limit buckets | Process-local state does not survive a stateless runtime                                |

Per Amendment §2, every row above except the driver and session/rate-limit concerns is
**local-only** and stays synchronous. They must be represented accurately in the runtime
capability matrix and never shown as operational in Sites mode.

---

## 4. Hosted-reachable slice

Converted to async ports (Amendment §2):

```text
research/content read models      watchlists
trial read models                 saved searches
intervention and peptide reads    reading, dismissal, mute state
creator and creator-claim reads   visit sessions
scientific claims and assessments alerts and alert rules
review tasks and decisions        briefs and briefing settings
runtime capability state          synthetic fixture import
D1 migrations                     bounded D1 jobs and leases
object metadata                   hosted readiness / Operations status
```

Remaining local-only and synchronous:

```text
PubMed / ClinicalTrials.gov / Crossref ingestion
TGA / FDA / RxNorm / GSRS / PubChem connectors
YouTube, X, and X compliance reconciliation
external AI
raw connector orchestration, local source scheduler
SQLite PRAGMA health/maintenance, VACUUM, WAL checkpoint
SQLite Online Backup, local restore, WAL/SHM replacement
portable backup creation/pruning, filesystem retention
```

---

## 5. Known blockers to resolve during M7

1. **Integrity sessions are process-local.** `packages/operations/src/index.ts` holds
   sessions in a module-level `Map`, unsigned and unpersisted, so any restart or second
   instance invalidates every outstanding CSRF token. A `SitesRequestIntegrityProvider`
   needs durable or signed session state.
2. **Rate limiting is process-local** and keyed on the `Host` header rather than a client
   identity, so it is effectively one global bucket per request class.
3. **Job claim is not atomic.** `claimNextJob` is a select-then-update pair with no
   transaction or conditional update, relying on there being exactly one in-process
   worker. A bounded atomic claim is required on D1.
4. **Leases are never renewed during execution.** `renewLease` is called once before the
   handler runs against a 60s lease, so any job exceeding 60s can be reclaimed while
   still executing.
5. **`databaseDoctor()` is PRAGMA-only** and is served on live HTTP routes, so hosted
   mode needs a capability-gated equivalent rather than the same handler.

Items 3 and 4 are pre-existing local defects surfaced by this audit. They are recorded
here because the hosted job model must not inherit them; whether the local path is also
corrected is a scope decision, not an assumption.

---

## 6. Method

Counts produced by repository-wide pattern search over `apps/`, `packages/`, and
`scripts/` at the stated commit, excluding `node_modules` and `dist`. They are
reproducible from the same commit and intended to be re-measured, not trusted
indefinitely.
