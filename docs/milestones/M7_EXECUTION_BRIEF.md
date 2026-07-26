# Healthspan Dashboard — Milestone 7 Execution Brief

**Milestone:** 7 — ChatGPT Sites Migration Readiness & Owner-Only Saved Preview  
**Issued:** 26 July 2026  
**Project manager:** ChatGPT  
**Implementation agent:** Claude (Opus)  
**Repository:** `Smellybum1/Healthspan-Dashboard`  
**Exact base branch:** `milestone-6/personalisation-production-hardening`  
**Exact base commit:** `e876231f950d1a134394a0adb50cabd5966bce28`  
**Working branch:** `milestone-7/sites-migration-readiness`  
**Product version target:** `0.7.0`  
**Status:** **AUTHORISED TO BEGIN — only after Tom downloads this authentic brief**  
**Deployment status:** **NOT AUTHORISED**  
**Stop point:** Complete M7 readiness, provision one owner-only Sites project, save one reviewable version without deploying it, push the branch, submit the completion report, and stop for an explicit production-deployment decision.

---

# 1. Controlling instruction

Start Healthspan Dashboard Milestone 7 from the exact accepted M6 tip:

```text
e876231f950d1a134394a0adb50cabd5966bce28
```

Create:

```text
milestone-7/sites-migration-readiness
```

Recommended start:

```bash
git fetch origin
git switch --create milestone-7/sites-migration-readiness e876231f950d1a134394a0adb50cabd5966bce28
```

The working tree must be clean before implementation begins.

The existing uncommitted `.codex/progress.md` edit may be carried into the first M7 documentation commit only when it accurately records the accepted M6 tip and contains no M7 implementation. Otherwise, discard it and recreate the accepted lineage in the M7 baseline document.

Milestone 7 must:

1. Repair current documentation lineage without rewriting historical completion reports.
2. Preserve local-first Healthspan Dashboard as the primary and reference implementation.
3. Introduce one logical persistence and object-storage contract with environment-selected local and Sites adapters.
4. Add a Cloudflare D1-compatible adapter behind the existing `@healthspan/db` repository contracts.
5. Add an R2-compatible implementation behind the existing raw/document object-store contracts.
6. Produce an edge-safe Hono Sites runtime that does not import Node-only or `better-sqlite3` code.
7. Preserve M6 request-integrity outcomes through a hosted runtime adapter.
8. Implement a single-owner hosted identity model using owner-only Sites access and Sign in with ChatGPT identity when available.
9. Keep live source connectors, YouTube, X, optional AI, and compliance-dependent automation disabled in the hosted M7 candidate.
10. Add bounded D1 migrations, portable search behavior, D1-safe job claiming, and capability-driven feature gating.
11. Add a deterministic local-versus-D1/R2 parity harness.
12. Create a synthetic, rights-safe M7 fixture dataset and migrate only that dataset into hosted storage.
13. Close the M6 full-scale local performance deviation.
14. Prepare owner-controlled Sites provisioning and secret-configuration runbooks.
15. Provision one real owner-only Sites project with D1 and R2 bindings after the code-readiness gate.
16. Save one reviewable Sites version associated with an approved Git commit.
17. **Do not deploy that version.**
18. Complete every acceptance criterion, push the branch, report exact evidence, and stop.

Routine implementation decisions are delegated to Claude. Do not pause for approval over ordinary package layout, type names, fixture construction, adapter internals, migration organization, refactors, or test implementation that stay within this brief.

Do not merge to `main`.

---

# 2. M7 scope boundary

M7 is **not** a public-launch milestone.

M7 includes:

```text
compatibility audit
runtime adapters
D1/R2 parity implementation
synthetic migration tooling
hosted security adaptation
owner-only Sites project provisioning
owner-only D1/R2 resource provisioning
one saved reviewable Sites version
private preview verification
deployment-readiness report
```

M7 does not include:

```text
deploying a Sites version
obtaining or sharing a production URL
broadening access
public publishing
workspace-wide publishing
custom domain
production data migration
local-to-hosted sync
multi-user support
hosted external connectors
hosted X/YouTube
hosted AI
production hosted backup guarantee
personal-health data
```

Every Sites deployment URL is a production deployment. Therefore, the M7 owner step must use **Save a version**, not **Deploy a version**.

If Sites access has not reached Tom’s account, or Sites cannot provision the required D1/R2 shape without deployment, complete the code-readiness work, mark the owner checkpoint `BLOCKED`, and stop. Do not weaken the no-deploy rule.

---

# 3. Fixed project-management decisions — A through J

## A. Scope boundary

**Decision:** M7 is readiness plus a real owner-only saved preview, not production deployment.

Authorized real hosted actions:

- Create one owner-only Sites project.
- Provision one D1 binding named `DB`.
- Provision one R2 binding named `FILES`.
- Configure required hosted environment values and secrets through Sites Settings.
- Save one reviewable version.
- Inspect the private preview.
- Keep access at owner/workspace-admin only.

Not authorized:

- Deploying a saved version.
- Receiving or distributing a production URL.
- Changing access to selected users, workspace, or internet.
- Connecting a custom domain.

**Credentials:** Tom holds the ChatGPT/Sites account and performs all Sites UI actions. Claude does not receive Tom’s login, session, access token, or secret values.

**Secrets:** No secret value may enter Git, prompts, attached files, screenshots, logs, fixture data, or `.openai/hosting.json`.

## B. Storage strategy

**Decision:** Use one logical persistence contract with environment adapters.

```text
shared domain repositories and schemas
    ├─ LocalSqliteAdapter — reference implementation
    └─ SitesD1Adapter — hosted implementation
```

Rules:

- Local SQLite remains the reference implementation.
- The runtime selects exactly one adapter.
- No dual-write.
- No local/hosted replication.
- No automatic sync.
- No second set of domain repositories.
- No “hosted shadow database” beside local SQLite.
- Shared schema and repository contracts remain authoritative.
- Driver-specific transaction, query, migration, and capability behavior stays behind adapter interfaces.
- The local app must remain fully functional when all Sites code is absent or disabled.

This satisfies the standing “extend the Live SQLite stack; do not create parallel stores” constraint.

## C. R2 and documents

**Decision:** Require object integrity and lifecycle parity, but not full local backup/restore parity in M7.

Required hosted parity:

- Content-addressed keys.
- SHA-256 verification.
- Strongly consistent read/write/delete behavior.
- Idempotent writes.
- D1 metadata and R2 object reconciliation.
- Orphan detection and cleanup.
- Deleted/purged lifecycle handling.
- Rights-policy enforcement.
- No X text or prohibited platform content.
- Synthetic document upload/read/delete parity.

Not required in M7:

- Restoring a local `.healthspan-backup` directly into Sites.
- Atomic rollback across D1 and R2 identical to the local filesystem restore.
- A production-grade hosted disaster-recovery guarantee.

Hosted recovery must be explicitly classified:

```text
DEGRADED_HOSTED_RECOVERY
```

Production deployment remains blocked until a later explicit decision proves an acceptable D1/R2 export, recovery, and rollback strategy.

## D. Local-first guarantee

**Decision:** The charter is unchanged.

- Local-first remains the primary supported mode.
- Local SQLite remains the reference behavior.
- Hosted is an additional target.
- No local feature may be removed to make Sites easier.
- Local backup/restore remains canonical.
- No automatic upload of a local Live database.
- No automatic migration of watchlists, documents, platform content, or personalisation.
- All existing local gates remain mandatory.

## E. Hosted authentication

**Decision:** Single owner only.

Use:

```text
Sites access: owner and workspace admins only
app principal: hosted-owner
optional identity transport: Sign in with ChatGPT
```

When Sign in with ChatGPT identity headers are available:

- Compare `oai-authenticated-user-email` with a server-side Sites secret:
  `HEALTHSPAN_HOSTED_OWNER_EMAIL`.
- Ignore the full-name header.
- Do not persist the email.
- Do not log the email.
- Do not return the email to the browser except a redacted authentication state.
- Map the valid identity to the constant application principal `hosted-owner`.

If identity headers are unavailable:

- Keep the Site owner-only through Sites sharing.
- Disable hosted mutation parity.
- Mark the owner-auth gate `BLOCKED`.
- Do not substitute a public shared password.

Do not add multi-user tables, invitations, profiles, roles, collaboration, or public Sign in with ChatGPT.

Must not be stored server-side:

```text
personal medical data
diagnoses
medications
supplement doses
labs
symptoms
wearables
private health notes
full creator transcripts
X post text
YouTube API raw payloads
owner email or full name
ChatGPT access tokens
```

## F. Scheduler

**Decision:** Keep the logical lease-based job model; do not assume Cron Triggers or Queues are available to Sites.

Hosted M7 mode:

```text
scheduler mode: manual/request-triggered
job storage: D1
job claiming: bounded atomic D1 operation
background connector sync: disabled
X compliance: not applicable because X data is not hosted
YouTube retention sync: not applicable because YouTube data is not hosted
```

Do not add raw Cloudflare Cron Triggers, Queues, Workflows, or Durable Objects unless current official Sites documentation explicitly exposes them through Sites during implementation and the project manager separately approves the change.

Required hosted guarantee:

- No X content enters hosted storage.
- No YouTube metadata enters hosted storage.
- No compliance deadline is claimed.
- No hosted connector is shown as healthy when it is disabled.
- Manual owner maintenance may process short bounded jobs.
- Long or recurring automation remains a production-deployment blocker.

## G. Request integrity

**Decision:** Preserve the M6 security outcomes, adapted to the hosted edge runtime.

Required in hosted mode:

- Secure HttpOnly session cookie.
- `SameSite=Strict`.
- CSRF token for mutations.
- Exact configured Origin.
- Exact configured Host.
- Fetch Metadata checks.
- Request IDs.
- Rate and body limits.
- Owner identity gate.
- No wildcard CORS.
- No trust in arbitrary forwarded headers.
- No secret disclosure.
- No mutation when hosted identity or session verification fails.

Implement behind:

```text
RequestIntegrityProvider
    ├─ LocalRequestIntegrityProvider
    └─ SitesRequestIntegrityProvider
```

The hosted implementation may use a signed stateless session or D1 session records, but it must preserve the accepted M6 threat-model guarantees.

## H. Performance deviation

**Decision:** M7 must close the deferred M6 local full-scale capacity verification.

Required:

- Run the controlling full-scale local generated dataset.
- Measure all M6 critical paths.
- Record p50/p95, startup, bundle, DB size, and peak memory.
- Change the M6 proportional-scale deviation to a superseded historical deviation in M7 documentation.

Hosted performance is a separate readiness dimension:

- Test a bounded synthetic D1/R2 preview corpus.
- Record actual Sites preview measurements where observable.
- A hosted scale limitation may remain `DEVIATION`.
- An unproven hosted production scale blocks deployment but does not block M7 readiness when honestly documented.

## I. Branch and merge strategy

**Decision:**

```text
branch directly from e876231f950d1a134394a0adb50cabd5966bce28
branch name: milestone-7/sites-migration-readiness
merge to main: not authorized
```

No merge to `main` is a precondition.

## J. Documentation hygiene

**Decision:** Resolve the listed residuals in M7 starting documentation without rewriting historical reports.

Create:

```text
docs/milestones/M7_BASELINE_AND_DECISIONS.md
```

It must record:

- Accepted M5 tip: `575489cf913812291f75266975e77c8953058968`
- Accepted M6 tip: `e876231f950d1a134394a0adb50cabd5966bce28`
- Accepted M6 CI run: `30117787763`
- M6 Remediation V implementation lineage
- The stale ROADMAP lineage being superseded
- The historical M5 report short hash
- The M6 report placeholder/handoff convention
- That this M7 brief satisfies the missing “Decisions required before M7” requirement
- That historical M5/M6 completion reports remain unchanged

Update current documents:

```text
ROADMAP.md
README.md
AGENTS.md
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/DECISIONS.md
```

Do not edit the historical M5 or M6 completion reports solely to chase accepted tip hashes or placeholder links.

---

# 4. Official platform facts governing M7

Checked on 26 July 2026:

- ChatGPT Sites is in public beta and availability depends on plan, region, and workspace settings.
- Sites management occurs through ChatGPT web or the desktop app, not a standalone CLI or IDE management surface.
- Every deployed Sites URL is a production deployment.
- Sites separates saving a version from deploying a version.
- `.openai/hosting.json` stores the Sites project linkage and optional D1/R2 binding names.
- D1 is the Sites relational storage option.
- R2 is the Sites file/object storage option.
- New Sites are owner/workspace-admin only until access is changed.
- Hosted secrets belong in Sites Settings, not `.openai/hosting.json`.
- Sites may not support every framework, database, background service, or hosting pattern.
- Sites has no data or inference residency at launch.
- Sites must not process Protected Health Information.

Official references:

```text
https://learn.chatgpt.com/docs/sites
https://help.openai.com/en/articles/20001339
https://developers.cloudflare.com/d1/
https://developers.cloudflare.com/d1/platform/limits/
https://developers.cloudflare.com/d1/worker-api/d1-database/
https://developers.cloudflare.com/d1/reference/time-travel/
https://developers.cloudflare.com/r2/reference/consistency/
https://developers.cloudflare.com/r2/platform/limits/
https://orm.drizzle.team/docs/sqlite/connect-cloudflare-d1
```

Recheck these sources at M7 completion because Sites is in public beta.

---

# 5. Product invariants

M7 must preserve:

```text
evidence first
claims not people
protocols are not results
animal evidence is not human evidence
biomarkers are not lifespan
trial registration is not authorization
register miss is not unapproved
report count is not causality or incidence
no composite truth/evidence/safety/longevity score
no dosing
no sourcing
no vendors
no treatment recommendation
no personal-health data
Live/Demo separation
creator/platform policy
local-only observability
no external telemetry
```

Hosted capability gating must never make an unavailable feature look operational.

---

# 6. M7 execution stages

## Stage 0 — Baseline and documentation hygiene

Complete before code migration:

- Clean working tree.
- Create M7 branch from exact base.
- Commit `M7_BASELINE_AND_DECISIONS.md`.
- Update ROADMAP and current architecture docs.
- Record all A–J decisions.
- Record current official Sites documentation check date.
- Confirm no Sites files or resources existed before M7.

Recommended commit:

```text
Establish M7 accepted baseline and Sites decisions
```

## Stage 1 — Compatibility audit and runtime boundary

Produce:

```text
docs/sites/SITES_COMPATIBILITY_AUDIT.md
docs/sites/RUNTIME_CAPABILITY_MATRIX.md
docs/sites/LOCAL_FIRST_GUARANTEE.md
```

Audit every use of:

- Node built-ins
- `better-sqlite3`
- Filesystem paths
- process signals
- long-running timers
- worker threads
- child processes
- native packages
- local log files
- SQLite PRAGMAs
- transactions
- FTS/search
- backup/restore
- background schedulers
- environment variables
- raw/document storage
- platform content
- AI and connector keys

Classify every feature:

```text
FULL_PARITY
HOSTED_MANUAL_ONLY
HOSTED_DISABLED_BY_POLICY
HOSTED_DEGRADED
LOCAL_ONLY
BLOCKED
```

No `UNKNOWN` may remain at M7 completion.

## Stage 2 — Shared contracts and local regression

Refactor without changing behavior:

```text
@healthspan/db
    contracts/
    schema/
    repositories/
    adapters/local-sqlite/
    adapters/sites-d1/

object store
    contracts/
    adapters/local-files/
    adapters/sites-r2/
```

Add `@healthspan/runtime` if useful for:

- Runtime environment
- Capabilities
- Principal
- Scheduler mode
- Request-integrity provider
- Feature gating

Local SQLite remains the reference adapter.

All local tests and doctors must pass before the Sites adapter is enabled.

## Stage 3 — D1/R2 adapters and parity harness

Implement:

- D1 repository adapter.
- D1 migration runner.
- D1 job lease/claim behavior.
- Portable text search.
- R2 object store.
- Object metadata reconciliation.
- Synthetic fixture migration.
- Adapter parity suites.
- Hosted capability APIs and UI.

No real Sites resources are required yet.

## Stage 4 — Edge-safe Sites runtime

Create an edge-safe build and runtime entrypoint.

Recommended shape:

```text
apps/sites/
    src/index.ts
    src/env.ts
    src/runtime.ts
    package.json
    tsconfig.json
```

Reuse the same Hono application factory where possible.

Requirements:

- Fetch-style entrypoint.
- No `@hono/node-server`.
- No `better-sqlite3`.
- No Node filesystem.
- No child process.
- No persistent process timer.
- No local file log sink.
- No local backup/restore routes.
- No connector scheduler.
- Static web build served through the supported Sites shape.
- Build fails if a Node-only import enters the hosted bundle.

## Stage 5 — Owner-controlled provisioning

This stage is owner-mediated.

Claude must first produce:

```text
docs/sites/OWNER_PROVISIONING_RUNBOOK.md
docs/sites/HOSTED_SECRET_REGISTER.md
docs/sites/SAVE_VERSION_CHECKLIST.md
```

Tom then performs the Sites UI actions.

Required owner action:

1. Open Sites in ChatGPT web or desktop.
2. Create/link the project from the approved M7 commit.
3. Keep access restricted to owner/workspace admins.
4. Provision D1 binding `DB`.
5. Provision R2 binding `FILES`.
6. Add Sign in with ChatGPT when needed for identity headers.
7. Add hosted secret/environment values directly in Sites Settings.
8. Confirm `.openai/hosting.json` contains only project linkage and binding names.
9. Save a version.
10. Do **not** deploy it.

If Sites proposes source changes, review every change before accepting it.

## Stage 6 — Private saved-version verification

Using the owner-only private preview:

- Verify authentication.
- Verify D1 reads/writes.
- Verify R2 synthetic object lifecycle.
- Verify CSRF and origin behavior.
- Verify personalisation.
- Verify capability gating.
- Verify disabled connectors.
- Verify no secrets.
- Verify no personal/local data.
- Verify no production URL was created.
- Capture screenshots and evidence.

## Stage 7 — Completion and stop

Commit:

```text
docs/milestones/M7_COMPLETION_REPORT.md
```

Push branch and stop.

Do not deploy.

---

# 7. Target runtime topology

```text
Local — primary/reference
Browser
  → Hono Node runtime
  → LocalSqliteAdapter
  → LocalFileObjectStore
  → local worker + Brisbane scheduler
  → local connectors / policy systems
  → local backup and restore

Sites — additional readiness target
Browser
  → Sites edge runtime / Hono fetch app
  → SitesD1Adapter
  → SitesR2ObjectStore
  → manual/request-triggered bounded jobs
  → synthetic fixture data only
  → owner-only identity
  → no hosted connectors, X, YouTube, AI, or local backup
```

No bridge runs between these topologies.

---

# 8. Runtime capabilities

Define a versioned schema such as:

```ts
type RuntimeKind = 'local' | 'sites';

interface RuntimeCapabilities {
  runtime: RuntimeKind;
  database: 'sqlite' | 'd1';
  objectStore: 'filesystem' | 'r2';
  persistentBackgroundScheduler: boolean;
  externalConnectors: boolean;
  platformMonitoring: boolean;
  optionalAi: boolean;
  localBackupRestore: boolean;
  hostedRecovery: 'full' | 'degraded' | 'none';
  ownerIdentity: 'local-owner' | 'sites-owner';
  publicAccess: false;
}
```

Expose:

```text
GET /api/runtime-capabilities
GET /api/hosted-readiness
```

The UI must show an explicit Hosted Readiness panel.

Do not hide disabled features by returning empty success.

---

# 9. D1 persistence requirements

## 9.1 Driver and schema

Use Drizzle’s D1 adapter behind the shared SQLite schema.

Required:

- Shared table definitions where compatible.
- Separate driver initialization.
- Shared repository contracts.
- No `better-sqlite3` in the edge dependency graph.
- No local path resolution.
- No WAL, journal, busy-timeout, or filesystem PRAGMA in hosted migrations.
- No `ATTACH`.
- No transaction dump containing `BEGIN TRANSACTION` or `COMMIT`.
- No runtime-generated SQL from browser input.

## 9.2 D1 limits and guardrails

Implement and test guardrails for current D1 constraints, including:

```text
row/blob/string <= 2 MB
bound parameters <= 100
SQL statement <= 100 KB
LIKE/GLOB pattern <= 50 bytes
query duration <= 30 seconds
bounded queries per invocation
bounded batch size
database-size policy
```

Project defaults:

```text
max bound parameters used by app query: 80
max D1 batch statements: 50
max JSON/text field written in one row: 512 KiB
max portable search tokens: 24
max one search token: 40 UTF-8 bytes
```

A platform limit change must fail the capability audit rather than silently truncate.

## 9.3 Transactions and atomic operations

Use D1 `batch()` for bounded atomic multi-statement operations where appropriate.

Implement explicit repository primitives:

```text
atomicBatch
compareAndSet
claimJob
renewLease
releaseLease
appendStateEvent
setCurrentProjection
```

Do not pretend an arbitrary callback transaction is portable.

Any local repository method that depends on synchronous callback transactions must be refactored into explicit portable operations.

## 9.4 Consistency

Use D1 sessions/bookmarks where read-after-write or sequential consistency is required.

At minimum:

- Watchlist mutation then read.
- Alert state mutation then read.
- Brief generation then read.
- Job claim/renewal.
- Migration state.
- Review decision/current projection.

Record consistency behavior in the parity report.

## 9.5 Migrations

Create one portable migration source.

Required:

- `schema_migrations` table.
- Idempotent migration checks.
- D1-safe bounded batches.
- Migration lock/lease.
- Owner-only hosted migration action.
- Read-only hosted mode while migrations are pending or failed.
- No automatic concurrent migration race.
- Local migration behavior remains unchanged.
- Migration lint rejects unsupported SQL.

Add:

```text
pnpm sites:db:lint
pnpm sites:db:migrate:fixture
```

No production D1 migration is executed outside the owner-only saved preview.

## 9.6 Search

Do not make hosted correctness depend on FTS5.

Implement a portable search plan:

- Normalize text query.
- Split into bounded UTF-8 tokens.
- Cap token count.
- Use bounded indexed fields and portable SQL.
- Ensure every `LIKE` pattern stays within platform limits.
- Preserve M6 saved-search semantics.
- Optional local or D1 FTS optimization may exist behind a capability flag.
- FTS and non-FTS results must pass the same golden corpus.

## 9.7 Job queue

Reuse the logical job tables.

Hosted job guarantees:

- Conditional claim.
- Unique lease token.
- Lease expiry.
- Bounded attempts.
- Idempotency key.
- No long-running process assumption.
- Manual tick.
- No compliance-sensitive hosted jobs.

Add:

```text
POST /api/hosted/maintenance/tick
GET  /api/hosted/jobs/status
```

Owner-only and rate limited.

---

# 10. R2 object-store requirements

## 10.1 Interface

Use the existing object-store abstraction or define a compatible shared contract:

```ts
interface ObjectStore {
  put(input: ObjectPutInput): Promise<ObjectRef>;
  get(key: string): Promise<Uint8Array | null>;
  head(key: string): Promise<ObjectMetadata | null>;
  delete(key: string): Promise<void>;
  list(input: ObjectListInput): Promise<ObjectListPage>;
}
```

## 10.2 Object identity

Use content-addressed keys:

```text
sha256/<prefix>/<full-hash>.<extension>
```

Metadata in D1:

- Object key
- SHA-256
- Size
- Media type
- Data class
- Source/rights policy
- Created date
- Current/deleted state
- Referencing row count
- Reconciliation state

## 10.3 Write protocol

Required:

1. Validate data class.
2. Compute SHA-256.
3. Check existing object.
4. Write idempotently.
5. Read or head after write.
6. Verify size/hash metadata.
7. Commit D1 reference metadata.
8. Reconcile orphan on failure.

R2 and D1 do not form one atomic transaction. Do not claim that they do.

## 10.4 Delete protocol

- Mark D1 reference deleted/tombstoned.
- Delete R2 object when no allowed references remain.
- Verify deletion.
- Preserve non-content audit metadata.
- Reconcile failed deletes.
- Never retain prohibited platform content.

## 10.5 Allowed M7 objects

Only synthetic fixture objects:

```text
small official-source fixture payload
synthetic creator document
synthetic export artifact
```

Not allowed:

```text
real creator transcript
real X content
real YouTube payload
real local raw snapshot
real personalisation export
real backup archive
secret-bearing file
```

## 10.6 Hosted recovery status

Add a visible capability state:

```text
Hosted recovery: degraded — preview only
```

The local backup UI remains local-only.

---

# 11. Identity and authorization

## 11.1 Principal model

Runtime principals:

```text
local-owner
hosted-owner
```

No additional principal is permitted in M7.

## 11.2 Sites identity

Where supported, use Sign in with ChatGPT:

```text
/signin-with-chatgpt
/signout-with-chatgpt
```

Trusted server headers:

```text
oai-authenticated-user-email
oai-authenticated-user-full-name
```

Rules:

- Use email only for an in-request exact comparison.
- Ignore full name.
- Do not persist either header.
- Redact headers in logs and diagnostics.
- Compare against `HEALTHSPAN_HOSTED_OWNER_EMAIL` from Sites Settings.
- Map success to `hosted-owner`.
- Deny mutation on mismatch.
- Return only:
  - authenticated: true/false
  - principal: hosted-owner when valid

## 11.3 Hosted profile

Create one hosted profile row:

```text
hosted-owner
```

Do not migrate `local-owner` profile data into it.

Seed only synthetic fixture personalisation.

---

# 12. Request integrity in Sites

Implement:

```text
SitesRequestIntegrityProvider
```

Required:

- `Secure; HttpOnly; SameSite=Strict` cookie.
- HMAC-signed or D1-backed session.
- CSRF token.
- Session rotation.
- Exact configured hosted origin.
- Exact Sites host.
- Fetch Metadata.
- No wildcard CORS.
- Rate buckets.
- Body limits.
- Request IDs.
- Platform identity gate.
- No local loopback assumptions.
- No `X-Forwarded-*` trust by default.

Hosted secrets configured only in Sites Settings:

```text
HEALTHSPAN_HOSTED_SESSION_SECRET
HEALTHSPAN_HOSTED_OWNER_EMAIL
HEALTHSPAN_HOSTED_ALLOWED_ORIGIN
```

Do not commit their values.

---

# 13. Hosted scheduler and connectors

Hosted feature policy:

| Feature                         | M7 Sites state       |
| ------------------------------- | -------------------- |
| PubMed ingestion                | Disabled             |
| ClinicalTrials.gov ingestion    | Disabled             |
| Crossref enrichment             | Disabled             |
| TGA/FDA connectors              | Disabled             |
| RxNorm/GSRS/PubChem             | Disabled             |
| YouTube                         | Disabled             |
| X                               | Disabled             |
| External AI                     | Disabled             |
| Automated daily scheduler       | Unavailable/unproven |
| Manual bounded maintenance tick | Enabled              |
| D1 job lease model              | Enabled              |
| Local scheduler                 | Unchanged            |
| Local connectors                | Unchanged            |

The hosted UI must explain:

> This owner-only M7 candidate uses synthetic data. Automated external data refresh and compliance-sensitive platform monitoring are disabled until a supported hosted scheduling guarantee is approved.

No hosted source freshness badge may say “healthy” for a disabled connector.

---

# 14. Data migration and fixture policy

## 14.1 No real local migration

M7 must not inspect, export, upload, or transform Tom’s normal local Live database for Sites.

Do not migrate:

- Local watchlists
- Visits
- Alerts
- Briefs
- Creator documents
- Raw snapshots
- X/YouTube data
- Logs
- Backups
- Secrets
- Local operational history

## 14.2 M7 synthetic dataset

Create a deterministic rights-safe fixture with at least:

```text
100 papers
40 trials
30 intervention entities
10 peptide profiles
20 regulatory/safety records
20 creators
60 scientific claims
60 creator claims
10 watchlists/saved-search fixtures
20 alerts
4 briefs
3 synthetic R2 objects
```

Use fabricated names and source-shaped metadata.

No real person, creator, account, post, or medical record.

## 14.3 Migration manifest

Create a versioned migration manifest:

- Schema version
- Fixture version
- Table counts
- Table hashes
- Object count
- Object hashes
- Excluded data classes
- Created timestamp
- Source Git commit
- Runtime target

## 14.4 Import behavior

- Bounded batches.
- Idempotent.
- Transaction-safe per batch.
- Resume cursor.
- Partial/failure reporting.
- No duplicate rows.
- No duplicate objects.
- Re-run produces identical state.
- Import never runs automatically on arbitrary hosted requests.

Commands:

```text
pnpm sites:fixture:generate
pnpm sites:fixture:validate
pnpm sites:fixture:import
```

The real Sites import requires an owner-only action and synthetic manifest.

---

# 15. Hosted API and UI

## 15.1 API

Add:

```text
GET  /api/runtime-capabilities
GET  /api/hosted-readiness
GET  /api/hosted/storage/status
GET  /api/hosted/migrations/status
GET  /api/hosted/jobs/status

POST /api/hosted/migrations/apply
POST /api/hosted/fixture/import
POST /api/hosted/maintenance/tick
POST /api/hosted/storage/reconcile
```

Mutations require:

- Hosted owner identity
- Session
- CSRF
- Exact Origin/Host
- Rate limit
- Runtime = sites

Local runtime must reject hosted-only mutation routes or expose safe `not_applicable`.

## 15.2 UI

Add:

```text
/settings/runtime
/operations/hosted-readiness
```

Show:

- Runtime kind
- DB adapter
- Object-store adapter
- Owner auth state
- Schema/migration state
- Fixture state
- D1/R2 status
- Scheduler state
- Disabled connector list
- Hosted recovery classification
- Sites project link state
- Saved-version evidence
- No-deployment status
- Data-class restrictions

Local mode shows:

```text
Local-first reference runtime
Sites adapter available/not configured
```

Hosted mode clearly labels:

```text
Owner-only M7 preview
Synthetic data
Not production
Not deployed
```

---

# 16. Edge build requirements

Add:

```text
pnpm sites:build
pnpm sites:bundle:doctor
```

The hosted bundle must fail if it includes:

```text
better-sqlite3
@hono/node-server
node:fs
node:path filesystem use
node:child_process
node:worker_threads
native .node modules
local backup/restore implementation
local log-file sink
```

Permitted Node-compatible APIs must be justified and supported by the Sites runtime.

Use conditional exports so local Node code is never reached by the hosted build.

---

# 17. `.openai/hosting.json`

Before provisioning, do not invent a project ID.

You may commit:

```text
.openai/hosting.example.json
```

with:

```json
{
  "project_id": null,
  "d1": "DB",
  "r2": "FILES"
}
```

After Tom provisions the project, Sites may create/update:

```text
.openai/hosting.json
```

Review it.

Allowed fields:

```text
project_id
d1 binding name
r2 binding name
```

No secrets, URLs containing tokens, owner email, or environment values.

Commit the real file only after review.

---

# 18. Owner provisioning runbook

Claude must prepare an exact owner prompt, such as:

```text
Create an owner-only ChatGPT Sites project from this compatible local project.
Provision durable relational storage with D1 binding DB and file storage with
R2 binding FILES. Keep access restricted to the owner and workspace admins.
Do not deploy any version. Do not broaden sharing. Do not add a custom domain.
Do not place any secret in source files or .openai/hosting.json. Save a version
only after the project builds successfully.
```

Tom must:

- Use ChatGPT web or desktop.
- Review the generated project changes.
- Configure secrets directly in Sites Settings.
- Never paste secret values into the Sites chat.
- Confirm access remains owner-only.
- Confirm no production deployment exists.
- Record the saved version identifier and source commit.
- Provide screenshots for the completion report.

Claude must not claim provisioning occurred without Tom’s evidence.

---

# 19. Parity harness

Add:

```text
pnpm sites:parity
```

Required layers:

## 19.1 Repository parity

Run the same contract suite against:

```text
LocalSqliteAdapter
SitesD1Adapter
```

Cover:

- CRUD
- Pagination
- Filtering
- Search
- Atomic batches
- Claims/current projections
- Review decisions
- Watchlists
- Saved searches
- Alerts
- Briefs
- Job claiming
- Migration state

## 19.2 Object-store parity

Run against:

```text
LocalFileObjectStore
SitesR2ObjectStore
```

Cover:

- Put/get/head/delete/list
- Hash
- Idempotency
- Missing object
- Tombstone
- Orphan reconciliation
- Rights policy
- Path/key safety

## 19.3 API parity

Compare normalized API outputs for fixture data.

Ignore only documented runtime-specific fields:

```text
runtime
storage backend
scheduler capability
hosted recovery capability
```

## 19.4 Security parity

Test:

- Session
- CSRF
- Origin
- Host
- owner identity
- rate/body limits
- request IDs
- error redaction

## 19.5 UI parity

Critical owner workflows:

- Research
- Trials
- Interventions
- Peptides
- Creators
- Watchlists
- Saved Searches
- Alerts
- Briefs
- Review Queue
- Runtime readiness

No screenshot drift requirement for platform-specific capability banners.

---

# 20. Performance

## 20.1 Close the local M6 deviation

Add:

```text
pnpm performance:full
```

Use the controlling full-scale local dataset:

```text
50,000 content items
250,000 scientific claims
25,000 intervention entities/variants
10,000 creators
250,000 creator claims
1,000,000 change/alert candidates
100,000 alerts
10,000 saved-search matches
2 years of briefs
```

Measure:

- Personalised Today
- Alerts
- Watchlists
- Watchlist detail
- Saved-search execution
- Brief detail
- Since-last-visit
- Operations
- Production startup
- DB size
- Peak memory
- Import duration

If the full profile cannot complete on Tom’s supported machine, M7 cannot claim the M6 deviation closed without project-manager review.

## 20.2 Hosted readiness performance

Use a bounded synthetic Sites fixture.

Measure where possible:

- Cold preview load
- API p50/p95
- D1 reads/writes
- Search
- Personalisation mutation
- R2 put/get
- Bundle size
- Migration duration

Mark limitations honestly.

No production-SLA claim.

---

# 21. Schema work

Add only the minimum portable schema required.

## 21.1 Existing profile table

Extend the existing profile model with a runtime scope:

```text
local
sites
```

Current IDs:

```text
local-owner
hosted-owner
```

No multi-user cardinality.

## 21.2 Object metadata

Add or normalize:

```text
object_store_objects
```

Required concepts:

- ID
- Runtime scope
- Backend
- Key
- SHA-256
- Byte size
- Media type
- Data class
- Rights/source policy
- Current/deleted state
- Reference count
- Reconciliation state
- Created/updated timestamp

## 21.3 Migration runs

Add:

```text
runtime_migration_runs
runtime_migration_items
```

Store:

- Runtime target
- Fixture/manifest version
- Status
- Cursor
- Counts
- Input hash
- Started/completed
- Sanitized error

## 21.4 Parity runs

Add:

```text
runtime_parity_runs
runtime_parity_results
```

Store:

- Adapter pair
- Suite version
- Case
- Status
- Normalized diff
- Created timestamp

## 21.5 Capability snapshots

Add:

```text
runtime_capability_snapshots
```

Store the non-secret capability matrix used by the completion report.

All schema changes must pass local and D1 migration lint.

---

# 22. Packages and files

Recommended additions:

```text
apps/sites/
packages/runtime/
packages/db/src/contracts/
packages/db/src/adapters/local-sqlite/
packages/db/src/adapters/sites-d1/
packages/db/src/object-store/
docs/sites/
scripts/sites-*.ts
```

Required conditional package exports:

```text
@healthspan/db/contracts
@healthspan/db/local
@healthspan/db/sites
```

Do not expose local adapter imports through the hosted root bundle.

---

# 23. Environment configuration

Update `.env.example` with names only:

```text
HEALTHSPAN_RUNTIME=local

# Hosted runtime
HEALTHSPAN_HOSTED_OWNER_EMAIL=
HEALTHSPAN_HOSTED_SESSION_SECRET=
HEALTHSPAN_HOSTED_ALLOWED_ORIGIN=
HEALTHSPAN_HOSTED_SCHEDULER_MODE=manual
HEALTHSPAN_HOSTED_EXTERNAL_CONNECTORS=false
HEALTHSPAN_HOSTED_PLATFORM_MONITORING=false
HEALTHSPAN_HOSTED_AI_ENABLED=false
HEALTHSPAN_HOSTED_FIXTURE_ONLY=true

# Sites binding names — not secrets
HEALTHSPAN_SITES_D1_BINDING=DB
HEALTHSPAN_SITES_R2_BINDING=FILES
```

Rules:

- No hosted secret value in `.env.example`.
- Local `.env` remains gitignored.
- Hosted secret values go only into Sites Settings.
- The app fails closed when hosted owner/session secrets are absent.

---

# 24. Commands

Add Windows-safe commands:

```text
pnpm sites:compat
pnpm sites:build
pnpm sites:bundle:doctor
pnpm sites:db:lint
pnpm sites:db:migrate:fixture
pnpm sites:fixture:generate
pnpm sites:fixture:validate
pnpm sites:fixture:import
pnpm sites:parity
pnpm sites:security
pnpm sites:performance
pnpm sites:doctor
pnpm sites:owner:check
pnpm performance:full
```

No `sites:deploy` command.

Sites provisioning and saved-version management remain owner actions in ChatGPT.

---

# 25. Testing requirements

All default tests remain deterministic and require no hosted credential.

## 25.1 D1 adapter tests

At least 80 substantive cases:

- Schema migration
- CRUD
- Batch rollback
- Compare-and-set
- Job claim races
- Lease expiry
- Read-after-write consistency
- Parameter limits
- row-size rejection
- search token limits
- pagination
- saved-search filters
- review decisions
- alert/brief state
- migration lock
- pending-migration read-only mode

## 25.2 R2 adapter tests

At least 40 substantive cases:

- Hash
- Idempotent put
- Get/head
- Delete
- List pagination
- Tombstone
- Orphan
- Reconcile
- rights-policy denial
- restricted platform denial
- key traversal
- metadata mismatch
- partial failure

## 25.3 Parity corpus

At least 100 cross-adapter cases with zero unexplained differences.

## 25.4 Edge bundle tests

- No Node-only imports.
- No native modules.
- No local filesystem.
- No local backup route.
- No connector scheduler.
- Build reproducible.

## 25.5 Security tests

- Owner identity success/failure.
- No email persistence/logging.
- Session/CSRF.
- exact origin.
- exact host.
- preview host configuration.
- no wildcard CORS.
- no mutation without owner.
- secret redaction.

## 25.6 Fixture migration tests

- Manifest.
- Counts/hashes.
- Resume.
- Idempotency.
- rollback per batch.
- no real names/content.
- denylisted data classes.
- R2 objects.
- D1 limits.

## 25.7 Local regression

Every M1–M6 gate remains green.

---

# 26. CI requirements

Add a distinct job:

```text
Sites readiness
```

It must run:

```text
sites:compat
sites:build
sites:bundle:doctor
sites:db:lint
sites:parity
sites:security
sites:performance
sites:doctor
```

Existing five M6 jobs remain green.

No live Sites secret in GitHub Actions.

Use fixture bindings/test doubles only.

---

# 27. Documentation and ADRs

Create/update:

```text
README.md
AGENTS.md
ROADMAP.md
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/DECISIONS.md
docs/PRIVACY_BOUNDARIES.md
docs/SOURCE_POLICY.md

docs/milestones/M7_BASELINE_AND_DECISIONS.md
docs/milestones/M7.md
docs/milestones/M7_EXECUTION_BRIEF.md
docs/milestones/M7_COMPLETION_REPORT.md

docs/sites/SITES_COMPATIBILITY_AUDIT.md
docs/sites/RUNTIME_CAPABILITY_MATRIX.md
docs/sites/LOCAL_FIRST_GUARANTEE.md
docs/sites/D1_ADAPTER.md
docs/sites/R2_ADAPTER.md
docs/sites/HOSTED_AUTH.md
docs/sites/HOSTED_REQUEST_INTEGRITY.md
docs/sites/HOSTED_SCHEDULER_LIMITS.md
docs/sites/HOSTED_RECOVERY_LIMITS.md
docs/sites/FIXTURE_MIGRATION.md
docs/sites/OWNER_PROVISIONING_RUNBOOK.md
docs/sites/HOSTED_SECRET_REGISTER.md
docs/sites/SAVE_VERSION_CHECKLIST.md
docs/sites/NO_DEPLOYMENT_EVIDENCE.md
```

Add ADRs:

1. Local-first remains primary; Sites is additive.
2. One repository contract with local SQLite and D1 runtime adapters.
3. No dual-write or local/hosted sync.
4. Content-addressed local-files/R2 object-store adapters.
5. Hosted recovery is degraded during M7.
6. Single-owner Sites identity with no persisted email.
7. Manual hosted scheduler and disabled compliance-sensitive connectors.
8. Portable search correctness independent of FTS5.
9. Saved-version-only M7; no production deployment.
10. Synthetic-fixture-only hosted migration.
11. Hosted request-integrity adaptation.
12. No PHI or personal-health data in Sites.

---

# 28. What must NOT be done

Do not:

- Merge to `main`.
- Deploy a Sites version.
- Create a production URL.
- Broaden Sites access.
- Publish publicly.
- Add a custom domain.
- Add multi-user support.
- Add public Sign in with ChatGPT.
- Persist owner email/full name.
- Migrate Tom’s local database.
- Migrate local personalisation.
- Migrate creator documents.
- Migrate X or YouTube data.
- Migrate raw live source payloads.
- Upload a backup archive.
- Add live external connectors to Sites.
- Add hosted X compliance.
- Add hosted YouTube retention.
- Add hosted AI.
- Add Cron, Queues, Workflows, or Durable Objects without separate approval.
- Add dual-write.
- Add sync.
- Replace local SQLite.
- Remove local features.
- Claim hosted recovery parity.
- Claim production readiness where scheduler/recovery remains unproven.
- Add PHI.
- Add My Healthspan.
- Add medical recommendations, dosing, sourcing, vendors, or rankings.
- Start M8.

---

# 29. Acceptance checklist

## A. Baseline and documentation

- [ ] A1. Work starts from exact commit `e876231f950d1a134394a0adb50cabd5966bce28`.
- [ ] A2. Branch is `milestone-7/sites-migration-readiness`.
- [ ] A3. The pre-M7 working tree is clean.
- [ ] A4. `M7_BASELINE_AND_DECISIONS.md` records accepted M5/M6 tips and CI.
- [ ] A5. ROADMAP records the accepted M6 lineage.
- [ ] A6. ARCHITECTURE no longer says M3 is in progress.
- [ ] A7. Historical M5/M6 reports remain unchanged.
- [ ] A8. This brief is recorded as satisfying decisions required before M7.
- [ ] A9. Official Sites documentation check date is recorded.
- [ ] A10. No pre-existing M7/Sites work is misrepresented.

## B. Local-first architecture

- [ ] B1. Local SQLite remains the reference implementation.
- [ ] B2. Hosted is an additional runtime.
- [ ] B3. Runtime selects exactly one database adapter.
- [ ] B4. No dual-write exists.
- [ ] B5. No local/hosted sync exists.
- [ ] B6. Shared repository contracts are authoritative.
- [ ] B7. Local features are not removed.
- [ ] B8. Local backup/restore remains canonical.
- [ ] B9. All M1–M6 gates remain green.
- [ ] B10. Local-only runtime can build without Sites configuration.
- [ ] B11. Hosted code can build without `better-sqlite3`.
- [ ] B12. Capability matrix has no unknown state.

## C. D1 adapter

- [ ] C1. Drizzle D1 adapter is implemented.
- [ ] C2. Shared schema is used.
- [ ] C3. Node/local imports are excluded.
- [ ] C4. D1 migration runner is implemented.
- [ ] C5. Migration locking is safe.
- [ ] C6. Pending migration causes hosted read-only mode.
- [ ] C7. Unsupported SQL lint fails.
- [ ] C8. No `ATTACH`.
- [ ] C9. No local WAL/filesystem PRAGMA in hosted migrations.
- [ ] C10. Parameter limit is enforced.
- [ ] C11. Row/text size limit is enforced.
- [ ] C12. Statement/batch limits are enforced.
- [ ] C13. Portable search respects LIKE-pattern limits.
- [ ] C14. Search does not require FTS5.
- [ ] C15. Atomic batch behavior is tested.
- [ ] C16. Compare-and-set behavior is tested.
- [ ] C17. Job claiming is race-safe.
- [ ] C18. Lease expiry/recovery works.
- [ ] C19. Sequential consistency is used where required.
- [ ] C20. D1 adapter corpus passes.

## D. R2 adapter

- [ ] D1. R2 object-store adapter is implemented.
- [ ] D2. Content-addressed keys are used.
- [ ] D3. SHA-256 is verified.
- [ ] D4. Idempotent put works.
- [ ] D5. Read/head/delete/list work.
- [ ] D6. D1 metadata is linked.
- [ ] D7. Orphan reconciliation works.
- [ ] D8. Tombstone lifecycle works.
- [ ] D9. Rights-policy checks work.
- [ ] D10. X/YouTube/restricted content is denied.
- [ ] D11. Only synthetic objects are used.
- [ ] D12. Hosted recovery is labelled degraded.
- [ ] D13. No local-backup parity is claimed.
- [ ] D14. R2 adapter corpus passes.

## E. Edge runtime and API

- [ ] E1. Edge-safe Hono entrypoint exists.
- [ ] E2. Hosted build excludes Node server modules.
- [ ] E3. Hosted build excludes native modules.
- [ ] E4. Hosted build excludes filesystem code.
- [ ] E5. Hosted build excludes local backup routes.
- [ ] E6. Hosted build excludes persistent timers.
- [ ] E7. Runtime capabilities API works.
- [ ] E8. Hosted readiness API works.
- [ ] E9. Hosted migration status works.
- [ ] E10. Hosted storage status works.
- [ ] E11. Manual maintenance tick works.
- [ ] E12. Hosted-only mutations reject local runtime.
- [ ] E13. Local-only operations show not-applicable in hosted.
- [ ] E14. Hosted readiness UI is implemented.
- [ ] E15. Hosted preview is clearly synthetic/not production.
- [ ] E16. Bundle doctor passes.

## F. Identity and request integrity

- [ ] F1. Sites access remains owner/admin only.
- [ ] F2. Single `hosted-owner` principal is used.
- [ ] F3. Owner email is compared only server-side.
- [ ] F4. Owner email is not stored.
- [ ] F5. Full name is ignored.
- [ ] F6. Auth headers are redacted from logs.
- [ ] F7. Hosted session cookie is Secure/HttpOnly/SameSite Strict.
- [ ] F8. CSRF is required.
- [ ] F9. Exact hosted Origin is required.
- [ ] F10. Exact hosted Host is required.
- [ ] F11. Fetch Metadata is enforced.
- [ ] F12. No wildcard CORS exists.
- [ ] F13. Mutation fails closed without valid owner identity.
- [ ] F14. Hosted security parity suite passes.

## G. Scheduler and feature gating

- [ ] G1. Hosted scheduler mode is manual.
- [ ] G2. D1 job lease model works.
- [ ] G3. No Cron/Queues/Workflows/DO dependency is introduced.
- [ ] G4. PubMed is disabled in hosted.
- [ ] G5. ClinicalTrials.gov is disabled in hosted.
- [ ] G6. Regulatory/identity connectors are disabled in hosted.
- [ ] G7. YouTube is disabled in hosted.
- [ ] G8. X is disabled in hosted.
- [ ] G9. External AI is disabled in hosted.
- [ ] G10. Disabled sources are not shown as healthy.
- [ ] G11. No compliance guarantee is falsely claimed.
- [ ] G12. Local scheduler/connectors remain unchanged.

## H. Fixture migration and parity

- [ ] H1. Synthetic fixture meets minimum counts.
- [ ] H2. Fixture contains no real person/account/content.
- [ ] H3. Migration manifest is versioned.
- [ ] H4. Table counts and hashes are verified.
- [ ] H5. Object hashes are verified.
- [ ] H6. Import is bounded.
- [ ] H7. Import is resumable.
- [ ] H8. Import is idempotent.
- [ ] H9. No real local database is read.
- [ ] H10. Denied data classes are tested.
- [ ] H11. Repository parity suite passes.
- [ ] H12. Object-store parity suite passes.
- [ ] H13. API parity suite passes.
- [ ] H14. Zero unexplained parity difference remains.

## I. Sites provisioning and saved version

- [ ] I1. Owner provisioning runbook is complete.
- [ ] I2. Secret register contains names only.
- [ ] I3. Tom performs the Sites actions.
- [ ] I4. One owner-only Sites project is provisioned.
- [ ] I5. D1 binding is `DB`.
- [ ] I6. R2 binding is `FILES`.
- [ ] I7. `.openai/hosting.json` contains no secrets.
- [ ] I8. Access remains owner/admin only.
- [ ] I9. Hosted secrets are entered only in Sites Settings.
- [ ] I10. One version is saved.
- [ ] I11. No version is deployed.
- [ ] I12. No production URL exists.
- [ ] I13. Private preview is tested.
- [ ] I14. Source commit/version evidence is recorded.

## J. Performance

- [ ] J1. Full-scale local fixture is generated.
- [ ] J2. Full-scale local performance command completes.
- [ ] J3. All controlling local paths are measured.
- [ ] J4. p50/p95 are recorded.
- [ ] J5. Startup is measured.
- [ ] J6. DB size and peak memory are recorded.
- [ ] J7. M6 performance deviation is closed or explicitly blocked.
- [ ] J8. Hosted fixture performance is measured.
- [ ] J9. Hosted capacity limitations are explicit.
- [ ] J10. No production SLA is claimed.

## K. CI, security, and documentation

- [ ] K1. Existing M6 CI jobs remain green.
- [ ] K2. Sites readiness CI job is green.
- [ ] K3. No hosted secret enters CI.
- [ ] K4. Secret scan passes.
- [ ] K5. Dependency audit passes.
- [ ] K6. SBOM includes hosted packages.
- [ ] K7. Threat model includes Sites/D1/R2.
- [ ] K8. Privacy boundaries include no PHI and no data residency.
- [ ] K9. Runtime capability docs match code.
- [ ] K10. D1/R2 adapter docs match code.
- [ ] K11. Owner runbook matches actual Sites flow.
- [ ] K12. All new ADRs are committed.

## L. Final completion and stop

- [ ] L1. `pnpm sites:compat` passes.
- [ ] L2. `pnpm sites:build` passes.
- [ ] L3. `pnpm sites:bundle:doctor` passes.
- [ ] L4. `pnpm sites:db:lint` passes.
- [ ] L5. `pnpm sites:parity` passes.
- [ ] L6. `pnpm sites:security` passes.
- [ ] L7. `pnpm sites:performance` passes or records an allowed deviation.
- [ ] L8. `pnpm sites:doctor` passes.
- [ ] L9. All prior local gates pass.
- [ ] L10. M7 screenshots/evidence are committed.
- [ ] L11. M7 completion report is committed.
- [ ] L12. Branch is pushed.
- [ ] L13. Merge to main has not occurred.
- [ ] L14. No deployment has occurred.
- [ ] L15. No M8 work has begun.
- [ ] L16. Exact handoff tip is reported.

---

# 30. Required completion report

Create:

```text
docs/milestones/M7_COMPLETION_REPORT.md
```

It must contain:

1. Executive summary
2. Exact base, branch, implementation-complete commit, report parent, and handoff convention
3. One row for every acceptance criterion
4. A–J decision record
5. Documentation-residual disposition
6. Local-first guarantee
7. Runtime capability matrix
8. Compatibility-audit findings
9. D1 adapter design and limits
10. R2 adapter design and recovery limitation
11. Shared repository/object-store contract
12. Search portability
13. Job/scheduler behavior
14. Hosted identity and privacy behavior
15. Request-integrity parity
16. Fixture policy and migration manifest
17. Repository/object/API parity results
18. Edge bundle results
19. Full-scale local performance results
20. Hosted fixture performance results
21. M6 deviation disposition
22. Sites availability and owner-action record
23. `.openai/hosting.json` review
24. Hosted secret-name inventory; no values
25. D1/R2 provisioning evidence
26. Saved-version identifier and source commit
27. Access-setting evidence
28. Explicit no-deployment evidence
29. Private preview screenshots
30. Local regression results
31. CI results
32. Security/privacy/source-policy observations
33. Known hosted limitations
34. Production-deployment blockers
35. Deviations
36. Genuine decisions required before any deployment
37. Explicit statement that no production URL was created
38. Explicit statement that M8 has not begun

Do not mark the owner provisioning or saved-version criteria as PASS without Tom’s direct evidence.

---

# 31. Required final commands

At minimum:

```text
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build

pnpm db:doctor
pnpm intelligence:eval
pnpm intelligence:doctor
pnpm interventions:eval
pnpm interventions:doctor
pnpm regulatory:eval
pnpm regulatory:doctor
pnpm safety:doctor
pnpm dossiers:doctor
pnpm creators:eval
pnpm creators:doctor
pnpm creator-claims:eval
pnpm creator-claims:doctor
pnpm creator-documents:doctor
pnpm youtube:doctor
pnpm x:doctor
pnpm platform-policy:doctor
pnpm personalisation:eval
pnpm personalisation:doctor
pnpm alerts:eval
pnpm alerts:doctor
pnpm briefs:eval
pnpm briefs:doctor
pnpm backup:eval
pnpm backup:doctor
pnpm operations:doctor
pnpm m6-product:eval
pnpm m6-product:doctor
pnpm completion-report:doctor
pnpm accessibility:audit
pnpm security:check

pnpm sites:compat
pnpm sites:build
pnpm sites:bundle:doctor
pnpm sites:db:lint
pnpm sites:db:migrate:fixture
pnpm sites:fixture:generate
pnpm sites:fixture:validate
pnpm sites:parity
pnpm sites:security
pnpm sites:performance
pnpm sites:doctor
pnpm performance:full
```

Run the real hosted fixture import only after owner provisioning.

---

# 32. Consult the project manager early only when

Consult when:

- Sites is unavailable to Tom’s account after the code-readiness gate.
- Sites cannot provision D1/R2 without deploying.
- Sites modifies the project in a way that breaks local-first support.
- Identity headers cannot be obtained for the owner-only saved preview.
- D1 cannot meet a required repository invariant.
- R2 cannot meet a required rights/deletion invariant.
- Full-scale local performance cannot complete on the supported machine.
- A current official Sites policy conflicts with this brief.
- A proposed solution requires deployment.
- A proposed solution requires real local data migration.
- Two acceptance criteria are genuinely incompatible.

Do not consult for ordinary adapter design, type naming, tests, fixture generation, build configuration, or documentation wording.

---

# 33. Stop rule

After M7 readiness is complete:

1. Commit implementation.
2. Run all local and Sites-readiness gates.
3. Push and obtain green CI.
4. Complete owner provisioning.
5. Save one version.
6. Verify the private preview.
7. Commit report and evidence.
8. Push.
9. Report the exact handoff tip.
10. Stop.

Do not deploy.

A later explicit owner/project-manager decision is required before any production Sites deployment.

---

# 34. AUTHORISED TO BEGIN

> **AUTHORISED TO BEGIN:** After Tom downloads this authentic brief, start Healthspan Dashboard Milestone 7 from exact commit `e876231f950d1a134394a0adb50cabd5966bce28` and create `milestone-7/sites-migration-readiness`. Preserve local SQLite as the primary reference runtime and implement one shared repository/object-store contract with environment-selected Local SQLite/filesystem and Sites D1/R2 adapters—never dual-write, never sync, and never migrate Tom’s real local data. Complete the compatibility audit, edge-safe Hono runtime, D1-safe migrations/search/jobs, R2 integrity/lifecycle adapter, single-owner hosted identity, hosted request-integrity parity, synthetic fixture migration, parity harness, and full-scale local performance verification. Then prepare the owner runbook; Tom alone may provision one owner-only Sites project, configure secrets in Sites Settings, provision bindings `DB` and `FILES`, and save one reviewable version. **Do not deploy it, do not create or share a production URL, do not broaden access, and do not add hosted connectors, X, YouTube, AI, multi-user support, PHI, personal-health data, sync, or M8 work.** Push the completed branch, commit `docs/milestones/M7_COMPLETION_REPORT.md`, report the exact handoff tip and evidence, and stop for an explicit deployment decision.
