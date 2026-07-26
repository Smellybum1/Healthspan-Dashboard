# Healthspan Dashboard — Milestone 7 Pre-Start Amendment I

**Applies to:** `docs/milestones/M7_EXECUTION_BRIEF.md`  
**Original brief SHA-256:** `15bc543fafbc7fa938e804bb6c1a95a29befad4a0c751f5219042bd34957558c`  
**Original authorised base:** `e876231f950d1a134394a0adb50cabd5966bce28`  
**Status:** **CONTROLLING AMENDMENT — M7 REMAINS AUTHORISED SUBJECT TO THE PRE-BRANCH HOTFIX GATE**  
**Implementation agent:** Claude (Opus)  
**Branch after gate:** `milestone-7/sites-migration-readiness`  
**Merge to `main`:** Not authorised  
**Sites deployment:** Not authorised

---

# 1. Purpose and precedence

This amendment resolves the two pre-start findings raised after the authentic M7 brief was downloaded.

The original M7 brief remains controlling except where this amendment expressly changes or clarifies it.

Precedence:

```text
M7 Pre-Start Amendment I
    ↓
M7 Execution Brief
    ↓
accepted M1–M6 project invariants
```

No M7 branch may be created until the Section 5 M6 backup hotfix gate is complete.

---

# 2. Decision B1 — shared repository scope

## Decision

The shared asynchronous repository contract is scoped to the **hosted-reachable runtime slice**, not the entire local data layer.

The M7 hosted-reachable slice includes:

```text
research/content read models
trial read models
intervention and peptide read models
creator and creator-claim read models
scientific claims and assessments
review tasks and review decisions needed by hosted preview
watchlists
saved searches
reading, dismissal, and mute state
visit sessions
alerts and alert rules
briefs and briefing settings
runtime capability state
synthetic fixture import
D1 migrations
bounded D1 jobs and leases
object metadata
hosted readiness and Operations status
```

The following remain **local-only** in M7 and do not require conversion to D1 repository contracts:

```text
PubMed ingestion
ClinicalTrials.gov ingestion
Crossref enrichment
TGA/FDA connectors
RxNorm/GSRS/PubChem connectors
YouTube
X and compliance reconciliation
external AI
raw connector orchestration
local source scheduler
local operational log files
SQLite PRAGMA health/maintenance
VACUUM
WAL checkpoint operations
SQLite Online Backup
local restore and WAL/SHM replacement
portable backup creation/pruning
filesystem retention and storage maintenance
```

Hosted mode already disables those local-only features. They must be represented accurately in the runtime capability matrix and must never be shown as operational in Sites mode.

## Required architecture

Introduce async, domain-oriented ports for hosted-reachable behavior, for example:

```text
ContentReadRepository
TrialReadRepository
InterventionReadRepository
CreatorReadRepository
ClaimAssessmentRepository
ReviewRepository
PersonalisationRepository
AlertBriefRepository
JobRepository
MigrationRepository
ObjectMetadataRepository
```

Do not define one enormous interface that exposes the complete local `HealthspanDb`.

Do not expose `BetterSQLite3Database` as a shared runtime contract.

Local-only services may retain their current synchronous `HealthspanDb` path.

---

# 3. Decision B2 — sync-to-async conversion

## Decision

The sync-to-async conversion is explicitly inside M7 scope, but only for the hosted-reachable slice defined in Section 2.

M7 does **not** require a repository-wide conversion of every Drizzle call, every connector, every script, or every local-only route.

## Required conversion boundary

For every service reachable from the Sites runtime:

- Repository methods return `Promise`.
- Services await repository operations.
- Hono handlers await the services.
- No direct `HealthspanDb` or `BetterSQLite3Database` dependency remains in the hosted service graph.
- No `.all()`, `.run()`, local PRAGMA, `sqlite.backup()`, filesystem, or local-driver call is reachable from the edge bundle.
- Local adapters may satisfy the async port by wrapping synchronous `better-sqlite3` operations.
- D1 adapters use the async D1/Drizzle driver.
- Shared domain logic is not duplicated between local and Sites services.

Local-only ingestion, backup, restore, source maintenance, connector, and compliance services may remain synchronous.

## Porting ledger

Create:

```text
docs/sites/HOSTED_REACHABILITY_AND_ASYNC_PORTING_LEDGER.md
```

For each service/module record:

```text
module
runtime reachability: local | sites | both
repository port
sync/async status
Node-only dependency
conversion status
test/parity suite
capability state
```

No `UNKNOWN` may remain.

## Edge bundle gate

`pnpm sites:bundle:doctor` must prove:

- Sites entrypoint imports only async ports.
- No local DB type crosses the edge boundary.
- No `better-sqlite3`, local client, PRAGMA, backup, restore, filesystem, or connector service is in the hosted bundle.
- Every hosted API route uses the async service graph.

## Revised parity scope

`pnpm sites:parity` covers the hosted-reachable ports only.

It does not need to compare local ingestion, connector, backup, restore, VACUUM, PRAGMA, or filesystem-maintenance behavior with D1.

---

# 4. Accepted repository survey findings

Record the pre-start survey in:

```text
docs/sites/SITES_COMPATIBILITY_AUDIT.md
```

Include the measured baseline:

```text
657 synchronous terminal executions
366 Drizzle query entrypoints across 42 files
204 export function vs 10 export async function in apps/api/src
393 HealthspanDb references
60 openDatabase() call sites
114 route handlers in app.ts
63 route handlers in m6-routes.ts
12 PRAGMA sites
no application db.transaction()
no SAVEPOINT
no ATTACH
no FTS5 or virtual tables
search currently LIKE-based
```

The exact counts are a dated migration baseline, not permanent acceptance thresholds.

The absence of application transactions and FTS5 reduces risk, but does not remove the async service conversion required for the hosted-reachable slice.

---

# 5. Decision C1 — mandatory pre-M7 M6 backup hotfix

## Decision

The two verified defects do not trigger another full M6 reopening.

They require a **narrow post-acceptance M6 correctness hotfix before the M7 branch is created**.

Historical status:

```text
M6 accepted tip: e876231f950d1a134394a0adb50cabd5966bce28
M6 acceptance remains historical
M7 base e876231 is superseded by the corrected M6 hotfix tip
```

The resulting pushed M6 hotfix tip becomes the exact M7 branch base.

No further project-manager approval is required after the hotfix gates pass, but the full resulting SHA must be recorded in `M7_BASELINE_AND_DECISIONS.md`.

## 5.1 Raw snapshot defect

The authoritative raw path is:

```text
dataDir/raw/<raw_snapshots.storage_key>
```

The hotfix must:

- Select `raw_snapshots.storage_key`, not reconstruct a path from SHA alone.
- Validate the storage key as a safe relative POSIX key.
- Read the object from `dataDir/raw/<storage_key>`.
- Preserve the compressed object bytes and file hash in the archive.
- Preserve the source raw SHA-256 semantics from the database.
- Archive with an unambiguous path such as `raw/<storage_key>`.
- Restore to `dataDir/raw/<storage_key>`.
- Verify that `FileRawSnapshotStore` can read and validate the restored object.
- Report a missing referenced raw object rather than silently skipping it.
- Preserve referenced-only raw inclusion.

## 5.2 Creator-document defect

The authoritative creator document path is:

```text
dataDir/<creator_documents.storage_key>
```

The hotfix must:

- Preserve the storage key in the archive manifest or archive path.
- Restore bytes to `dataDir/<storage_key>`, not `dataDir/documents/<id>/<filename>`.
- Verify the restored file hash against `creator_documents.sha256`.
- Verify the normal creator-document reader can open the restored file.
- Detect storage-key collisions.
- Preserve rights and lifecycle inclusion policy.
- Preserve rollback for the true destination path.

## 5.3 Backward compatibility

Support existing M6 archive paths where practical:

```text
documents/<document-id>/<filename>
raw/sha256/<hash>
```

Resolve legacy entries through the restored database:

- Document ID → `creator_documents.storage_key`
- Raw SHA-256 → `raw_snapshots.storage_key`

Fail safely on missing or ambiguous mapping.

If backward compatibility would materially weaken path safety, reject the legacy payload with a clear unsupported-archive result rather than restoring it to the wrong location.

## 5.4 Required hotfix tests

Add substantive production-path tests:

1. `portable_full` contains a real referenced raw snapshot.
2. Unreferenced raw objects remain excluded.
3. A missing referenced raw object fails or reports a non-success state.
4. Raw restore lands at the exact expected storage-key path.
5. Restored raw bytes are readable through `FileRawSnapshotStore`.
6. Creator document restore lands at the exact expected storage-key path.
7. Restored creator document is readable through the normal document path.
8. Document and raw failure-injection hooks execute with real archive entries.
9. Rollback restores prior bytes at the true destination paths.
10. Archive manifest maps every payload to its domain storage key.
11. Unsafe storage keys are rejected.
12. Existing eligible legacy archives are mapped correctly or rejected clearly.

## 5.5 Hotfix documentation

Create:

```text
docs/milestones/M6_POST_ACCEPTANCE_BACKUP_HOTFIX.md
```

Record:

- Defect description
- Accepted M6 historical tip
- Corrected M6 hotfix tip
- Files changed
- Test names/results
- Backup-format compatibility decision
- Why no M6 completion report was rewritten
- New exact M7 base

## 5.6 Hotfix quality gates

Before creating the M7 branch run:

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm backup:eval
pnpm backup:doctor
pnpm operations:doctor
pnpm security:check
```

Run `pnpm test:e2e` only when the hotfix changes a browser/API surface. Otherwise record `NOT REQUIRED — no browser/API contract change`.

Push the M6 branch and require the normal CI suite to be green.

## 5.7 Exact M7 base rule

The original M7 exact base is superseded.

The exact M7 base is:

> The final pushed commit on `milestone-6/personalisation-production-hardening` whose ancestry begins at `e876231f950d1a134394a0adb50cabd5966bce28`, whose diff is limited to this backup hotfix, its tests, and its documentation, and whose required gates are green.

Record the full resulting SHA before branch creation.

Then create:

```bash
git switch --create milestone-7/sites-migration-readiness <CORRECTED_M6_HOTFIX_SHA>
```

No merge to `main`.

---

# 6. Decision H — full-scale performance threshold intent

## Decision

`pnpm performance:full` is a measured threshold gate, not record-only reporting.

Use the M6 local p95 targets:

```text
Personalised Today:       < 1000 ms
Alerts list:              <  600 ms
Watchlists list:          <  500 ms
Watchlist detail:         <  700 ms
Saved-search execution:   < 1200 ms
Brief detail:             <  700 ms
Since-last-visit:         <  900 ms
Operations overview:      <  700 ms
Production-local startup: < 5000 ms
```

Measurement requirements:

- Generate the full controlling dataset.
- Use the production query/service paths.
- Warm up before measurement.
- Record at least 30 measured iterations per read path where practical.
- Record p50 and p95.
- Record fixture generation/import duration.
- Record database size.
- Record peak resident memory.
- Record query plans for the critical paths.
- Do not weaken limits to obtain a pass.
- No hard dependency on FTS5 for correctness.

## Classification

### PASS — closes the M6 deviation

- Full fixture completes.
- No OOM or timeout.
- All required paths meet their p95 targets.
- Query plans are bounded and indexed.
- Startup meets target.

### DEVIATION — M7 readiness may continue, deployment remains blocked

- Full fixture completes.
- No OOM, corruption, or functional failure.
- One or more latency targets miss.
- Actual numbers and query plans are reported.
- The M6 capacity deviation remains open.
- The saved owner-only synthetic Sites preview may proceed.
- Production deployment remains blocked.

### BLOCKED — stop for project-manager review

- Full fixture cannot be generated.
- OOM occurs.
- A required query times out or fails.
- Query behavior is unbounded.
- Database corruption or nondeterminism occurs.
- The supported local machine cannot complete the test.

Do not perform a large unrelated redesign merely to hide a latency miss.

Portable indexes, materialized helper tables, or a capability-gated local optimization are permitted when they preserve result parity. Hosted correctness must remain independent of FTS5.

---

# 7. Amendment acceptance checks

Add these checks to the M7 completion report.

## Async boundary

- [ ] AM1. Hosted-reachable repository scope is documented.
- [ ] AM2. Local-only repository scope is documented.
- [ ] AM3. Async ports exist for every hosted-reachable service.
- [ ] AM4. Hosted routes contain no direct `HealthspanDb` dependency.
- [ ] AM5. Local-only ingestion/connectors remain outside the D1 parity requirement.
- [ ] AM6. Local-only backup/restore/PRAGMA/VACUUM remain outside the D1 adapter.
- [ ] AM7. Porting ledger contains no `UNKNOWN`.
- [ ] AM8. Edge bundle uses only async ports.

## Backup hotfix

- [ ] AM9. M6 post-acceptance hotfix report is committed.
- [ ] AM10. Raw backup uses `raw_snapshots.storage_key`.
- [ ] AM11. Raw archive includes a real referenced object.
- [ ] AM12. Raw restore is readable through the normal raw-store implementation.
- [ ] AM13. Creator-document archive preserves its storage key.
- [ ] AM14. Creator-document restore is readable through the normal reader.
- [ ] AM15. Failure injection and rollback operate on real raw/document entries.
- [ ] AM16. Missing referenced payloads cannot silently produce a successful complete backup.
- [ ] AM17. Hotfix CI is green.
- [ ] AM18. M7 branch starts from the corrected M6 hotfix SHA.

## Performance

- [ ] AM19. Full-scale fixture is generated.
- [ ] AM20. Every required path has measured p50/p95.
- [ ] AM21. Database size and peak memory are recorded.
- [ ] AM22. Query plans are recorded.
- [ ] AM23. Result is classified `PASS`, `DEVIATION`, or `BLOCKED` under Section 6.
- [ ] AM24. A latency miss is not misreported as closing the M6 deviation.
- [ ] AM25. Production deployment remains blocked while the deviation is open.

---

# 8. Revised authorised sequence

The M7 authorization remains valid, but the sequence is now:

```text
1. Verify this amendment.
2. On the existing M6 branch, implement only the Section 5 hotfix.
3. Run and pass the hotfix gates.
4. Push and obtain green CI.
5. Record the corrected M6 hotfix SHA.
6. Create milestone-7/sites-migration-readiness from that SHA.
7. Place the authentic M7 brief and this amendment in the repo.
8. Execute M7 under the amended hosted-reachable async scope.
9. Stop after the owner-only saved version; do not deploy.
```

---

# 9. AUTHORISED TO PROCEED

> **AUTHORISED PRE-START HOTFIX AND M7 CONTINUATION:** Do not create the M7 branch from `e876231f950d1a134394a0adb50cabd5966bce28`. First apply the narrow M6 backup correctness hotfix defined in this amendment on `milestone-6/personalisation-production-hardening`, using `raw_snapshots.storage_key` and `creator_documents.storage_key` as the authoritative payload destinations, add production-path archive/restore/rollback tests, run the required gates, push, and record the corrected M6 tip. Then create `milestone-7/sites-migration-readiness` from that exact corrected tip without merging to `main`. In M7, convert only the hosted-reachable repository and service slice to shared asynchronous ports; keep ingestion, connectors, local backup/restore, PRAGMA/VACUUM, local scheduling, and platform compliance local-only. Run the full-scale performance gate using the stated p95 thresholds and classify it honestly as PASS, DEVIATION, or BLOCKED. All other M7 boundaries remain unchanged: synthetic hosted data only, owner-only Sites project, bindings `DB` and `FILES`, no real local migration, no dual-write or sync, save one private version, and do not deploy.
