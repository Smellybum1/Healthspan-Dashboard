# Healthspan Dashboard — Milestone 6 Execution Brief

**Milestone:** 6 — Personalisation, Briefings & Production Hardening  
**Issued:** 24 July 2026  
**Project manager:** ChatGPT  
**Execution agent:** Grok 4.5 in Cursor  
**Repository:** `Smellybum1/Healthspan-Dashboard`  
**Base branch:** `milestone-5/creator-social-intelligence`  
**Exact base commit:** `575489cf913812291f75266975e77c8953058968`  
**M5 feature-complete commit:** `f21a55343035c69708fc1349ab4435352147ea48`  
**Working branch:** `milestone-6/personalisation-production-hardening`  
**Status:** **AUTHORISED TO BEGIN — mandatory pre-feature entry gate applies**  
**Stop point:** Complete Milestone 6, push the working branch, submit the required completion report, and **stop before Milestone 7**. Do not merge to `main` unless the project owner separately instructs you to do so. Do not create a Milestone 7 branch.  
**Entry-gate rule:** The M4 → M3 → M2 official-brief residuals in Section 5 must be closed before any M6 feature work begins.

---

# 1. Controlling instruction

Begin Healthspan Dashboard Milestone 6 from the exact final Milestone 5 branch head:

```text
575489cf913812291f75266975e77c8953058968
```

Create and work on:

```text
milestone-6/personalisation-production-hardening
```

Recommended start sequence:

```bash
git fetch origin
git switch --create milestone-6/personalisation-production-hardening 575489cf913812291f75266975e77c8953058968
```

If the branch already exists locally, verify that:

- Its starting tree contains exact commit `575489cf913812291f75266975e77c8953058968`.
- It contains no Milestone 7 deployment, D1, R2, Sites, authentication, or personal-health work.
- The historical M5 completion report and feature-complete commit remain intact.

Milestone 6 must:

1. Complete the mandatory official-brief residual-closure entry gate in Section 5 before implementing any M6 feature work from Section 6 onward.
2. Replace Live-mode prototype watchlist/reading persistence with a durable, single-local-profile SQLite personalisation layer.
3. Add named watchlists, typed saved searches, reading/dismissal state, mute rules, visit tracking, and an explainable “Since your last visit” experience.
4. Add an in-app Alert Centre driven by deterministic source/change events and explicit user rules.
5. Add immutable, source-grounded daily research briefs and weekly reviews.
6. Add safe personalisation export/import.
7. Add consistent, verifiable local backup and restore with platform-policy-aware scrubbing and optional passphrase encryption.
8. Add storage management, retention, local observability, diagnostics, crash recovery, and database maintenance.
9. Harden the local HTTP boundary against cross-origin localhost attacks, DNS rebinding, CSRF, unsafe imports, path traversal, source-content XSS, and accidental secret disclosure.
10. Upgrade the unsupported Node.js 20 baseline to Node.js 24 LTS and the project package manager to a pinned stable pnpm 11 release.
11. Add repeatable Windows/Linux CI quality gates, dependency and signature auditing, SBOM generation, secret scanning, and documented security review.
12. Bring the product to a documented WCAG 2.2 Level AA target through automated and manual accessibility testing.
13. Add performance budgets and generated-data load tests.
14. Preserve every M1–M5 scientific, regulatory, safety, creator-fairness, platform-policy, privacy, no-dosing, no-vendor, no-ranking, Live/Demo, and local-first boundary.
15. Complete every acceptance criterion, push the branch, commit the completion report, report the exact final hash and quality results, and stop before Milestone 7.

Make routine implementation decisions autonomously. Do not pause for approval over ordinary dependencies, internal names, component layout, forward migrations, test fixtures, refactors, recoverable defects, or visual polish that remain within this brief.

The earlier file `docs/milestones/healthspan_dashboard_milestone_6_execution_brief.md` based on `9302d1c...` was provisional and held. Replace its contents with this controlling brief; do not keep two competing M6 specifications.

This brief formally re-scopes the stop rule in `docs/milestones/BRIEF_GAP_MATRIX.md`: M5 official-brief closure is accepted, while the remaining M4 → M3 → M2 residuals become a mandatory M6 entry gate on the M6 branch. This is not a waiver. Grok must finish and evidence that gate before beginning personalisation, alerts, briefings, backup, production-hardening, or other M6 feature work.

Do not start ChatGPT Sites migration, D1/R2 adapters, hosted scheduling, authentication, multi-user support, public deployment, personal-health tracking, or any Milestone 7+ functionality.

---

# 2. Milestone outcome

At completion, the local owner must be able to:

- Launch a production-built Healthspan Dashboard through one local origin.
- Import existing Live watchlist preferences from the earlier browser-local prototype.
- Create several named watchlists.
- Follow papers, trials, interventions, peptides, creators, creator claims, regulatory/safety topics, and saved searches.
- Save a structured search without storing SQL or executable query text.
- See what materially changed since the previous visit.
- Track unread, opened, read, dismissed, and muted states independently from source facts.
- Open an Alert Centre showing watched safety, regulatory, trial, evidence, dossier, and creator changes.
- Understand exactly why each alert or briefing item was included.
- View a deterministic daily research brief and weekly review.
- Export a brief to Markdown or versioned JSON.
- Export and import personalisation data without exporting the scientific database or platform-restricted text.
- Create, verify, list, and prune local backups.
- Restore a backup safely through a documented CLI flow with preflight checks and rollback.
- See storage use, backup status, worker/scheduler health, source freshness, recent redacted errors, and database integrity in an Operations workspace.
- Generate a redacted local diagnostic bundle without uploading anything.
- Use keyboard, screen reader, zoom, reduced motion, and mobile layouts effectively.
- Run all quality, security, accessibility, backup, restore, doctor, and performance checks deterministically.
- Keep using every M1–M5 Live and Demo feature without regression.

The application remains:

```text
single-user
local-first
private by default
unauthenticated on loopback
informational
not medical advice
not a personal-health record
not a hosted service
```

---

# 3. Fixed branch, merge, and stop decisions

| Item                          | Decision                                           |
| ----------------------------- | -------------------------------------------------- |
| Exact M6 base                 | `575489cf913812291f75266975e77c8953058968`         |
| M5 feature-complete reference | `f21a55343035c69708fc1349ab4435352147ea48`         |
| Working branch                | `milestone-6/personalisation-production-hardening` |
| Merge to `main`               | Not authorised                                     |
| Create M7 branch              | Not authorised                                     |
| Hosted deployment             | Prohibited                                         |
| Personal health companion     | Prohibited                                         |
| Final action                  | Push M6 branch, report exact results, stop         |

---

# 4. Non-negotiable product and privacy principles

## 4.1 One local profile, not authentication

M6 creates one Live local profile:

```text
local-owner
```

It is an application preference scope, not an identity account.

Do not add:

- Login
- Password
- OAuth
- Email identity
- User registration
- Sessions representing multiple people
- Cloud sync
- Account recovery
- Sharing or collaboration

The browser/API request-integrity session in Section 17 is a CSRF/local-boundary control, not user authentication.

## 4.2 Personalisation is not scientific evidence

Watch status, reading history, dismissal, brief inclusion, alerts, or saved searches must never change:

- Evidence maturity
- Scientific claim status
- Regulatory standing
- Safety findings
- Trial status
- Creator claim alignment
- Dossier aggregation

## 4.3 Personalisation is not personal health data

Do not add fields for:

- Diagnoses
- Medications
- Supplement doses
- Lab results
- Symptoms
- Blood pressure
- Body composition
- Exercise logs
- Sleep
- Wearables
- Medical appointments
- Personal treatment decisions

M6 personalisation contains research-navigation state only.

Do not add free-form private medical notes. Named lists and saved searches may have short organisational labels/descriptions, but the UI must state that Healthspan Dashboard is not a medical record.

## 4.4 Live and Demo remain separate

- Live personalisation is stored in SQLite.
- Demo personalisation remains in its separately namespaced browser-local demonstration state.
- Never import Demo followed IDs into Live automatically.
- Never mix Live and Demo watchlists, read states, alerts, visits, or briefs.
- Exports state their data mode.
- Live is the default.

## 4.5 No opaque personal relevance score

Do not create a hidden or displayed “relevance score” that blends scientific strength, personal interest, safety, popularity, and recency.

Personalised ordering uses deterministic groups and explainable inclusion reasons.

Internal stable ordinal values may order alert-priority groups, but the UI must display the category and reasons—not an unexplained number.

## 4.6 Dismissal does not delete evidence

Dismissing or muting hides an item from selected personal surfaces. It must not:

- Delete the source record
- Change the source record
- Remove the record from canonical search
- Affect evidence aggregation
- Affect regulatory/safety status
- Hide official warnings from the source detail page

## 4.7 Alert priority is not personal medical severity

Use:

```text
dashboard priority
```

Do not label an alert as the user’s personal clinical risk.

Priority derives from explicit event type, watch status, and official-source class.

## 4.8 Briefs are snapshots, not clinical recommendations

A brief summarizes changes in the local corpus.

It must not:

- Recommend starting or stopping an intervention
- Rank interventions
- Predict lifespan
- Provide dosing or sourcing
- Convert a creator claim into evidence
- Convert a reporting pattern into causality
- Hide source uncertainty

## 4.9 No external delivery in M6

Alerts and briefs are available:

- In the local application
- Through local Markdown/JSON export
- Through optional browser notifications while the page is open and permission is granted

Do not add:

- Email
- SMS
- Push-service integration
- Webhooks
- Slack/Discord/Telegram
- Calendar integration
- Background service worker push
- OS tray application
- Cloud notification service

## 4.10 No telemetry

Do not add:

- Analytics
- Remote crash reporting
- Sentry
- Product telemetry
- Usage tracking
- External log shipping
- Phone-home update checks

All observability remains local.

## 4.11 Backups exclude secrets and restricted platform text

A backup must not contain:

- API keys
- Bearer tokens
- Environment-file contents
- CSRF/session tokens
- Exact current X post text
- Platform content whose export/retention policy prohibits inclusion
- Deleted/withheld content
- Raw operational logs containing source text
- Local absolute paths in portable manifests

## 4.12 Restore is conservative

A restore must not overwrite the active data directory until:

- The archive is authenticated/verified.
- The manifest and file hashes pass.
- The database passes integrity checks.
- The schema is compatible or migratable.
- Platform scrubbing rules pass.
- A pre-restore recovery checkpoint is created.
- The target swap is atomic or safely rollback-capable.

## 4.13 Accessibility is not an automated score

Target WCAG 2.2 Level AA.

Automated tools support, but do not prove, conformance. Complete a manual checklist for critical workflows.

## 4.14 Security hardening must preserve local usability

The default local workflow must remain:

```text
pnpm dev
```

for development and:

```text
pnpm build
pnpm start
```

for daily production-local use.

Do not require a cloud account, certificate, reverse proxy, or external service on default loopback.

---

# 5. Mandatory M6 entry gate — close M4, M3, and M2 official-brief residuals

## 5.1 Gate status and sequencing

The official M5 Section 34 closure at base commit `575489cf913812291f75266975e77c8953058968` is accepted.

The residuals recorded in:

```text
docs/milestones/BRIEF_GAP_MATRIX.md
```

remain substantive. They directly affect the correctness of M6 alerts, briefings, saved-search matches, regulatory/safety watch events, backups, and production-health checks.

This brief therefore uses the gap matrix’s explicit **“or Pro re-scopes”** path:

- M6 is authorised to begin from the current M5 tip.
- The M6 branch must first close M4, then M3, then M2 official-brief residuals.
- No M6 personalisation, alert, briefing, backup, production-runtime, accessibility, security, or operations feature work from Section 6 onward may begin until the entry gate is complete.
- Necessary shared refactors, migrations, tests, documentation, and UI work required to close M2–M4 are permitted.
- When the gate is complete and all gate checks pass, Grok may continue automatically into the remaining M6 work without requesting a new roadmap.

Required sequence:

```text
M4 official-brief residual closure
    ↓
M3 official-brief residual closure
    ↓
M2 official-brief residual closure
    ↓
update and close BRIEF_GAP_MATRIX.md
    ↓
distinct entry-gate completion commit
    ↓
begin M6 feature work
```

Create a distinct commit whose message clearly identifies the completed entry gate. Record its full hash in `M6_COMPLETION_REPORT.md`.

## 5.2 Historical-report rule

Do not rewrite history in the original M2, M3, or M4 completion reports.

Create append-only closure reports:

```text
docs/milestones/M4_OFFICIAL_BRIEF_CLOSURE_REPORT.md
docs/milestones/M3_OFFICIAL_BRIEF_CLOSURE_REPORT.md
docs/milestones/M2_OFFICIAL_BRIEF_CLOSURE_REPORT.md
```

Each closure report must:

- Name the canonical official brief.
- Name the original milestone branch/base/final hashes.
- Name the M6 branch and closure commit(s).
- Reproduce the official acceptance checklist one row per criterion.
- Mark each criterion `DONE`, `NOT APPLICABLE`, or `BLOCKED`.
- Provide code, test, screenshot, or command evidence.
- State any deviation precisely.
- Preserve the original historical completion report unchanged.
- State that later-milestone implementation does not retroactively change the original milestone hash.
- Include exact quality-gate results and counts.

A `BLOCKED` criterion prevents the entry gate from closing unless the project manager explicitly accepts a rescope. Grok cannot self-approve a blocked criterion.

## 5.3 M4 official-brief residual closure

Close the M4 gaps against:

```text
docs/milestones/healthspan_dashboard_milestone_4_execution_brief.md
```

At minimum complete and evidence all of the following.

### Regulatory and safety data model

Implement or complete the original M4 semantics for:

- Regulated products
- Product ingredients
- Regulatory applications
- Regulatory assertions
- Regulatory indications
- Regulatory status history
- Product-label records
- Allowed product-label sections
- Safety items
- Intervention-to-safety links
- FDA AEMS signal records
- Adverse-event aggregate query definitions and snapshots
- Dossier source dependencies and immutable dossier history

Equivalent physical table consolidation is permitted only when every required semantic, provenance, history, query, and doctor invariant is demonstrably represented. Document the mapping in the closure report.

### Regulatory and Safety APIs/workspace

Implement the original M4 server-side, paginated surfaces, including the equivalent of:

```text
GET  /api/regulatory/products
GET  /api/regulatory/assertions
GET  /api/regulatory/history
GET  /api/safety/items
GET  /api/safety/signals
GET  /api/safety/reporting-patterns
POST /api/regulatory/runs
POST /api/safety/runs
```

Complete the Live Regulatory & Safety workspace with:

- Product- and indication-scoped status
- AU/US jurisdiction separation
- Label warning/contraindication/indication sections
- TGA notices
- FDA AEMS potential signals
- Aggregate spontaneous-report patterns with the mandatory caveat
- Match-review state
- Source health and coverage
- History and provenance

Preserve:

```text
miss ≠ unapproved
trial ≠ authorization
label presence ≠ approval
AEMS/report count ≠ causality or incidence
no dosing/vendors/ranking
```

### Connector operational depth

Bring the M4 source adapters to the official-brief operational level:

- TGA ARTG targeted official search/detail behavior
- Drugs@FDA bulk ZIP staging, validation, idempotent atomic projection, and scheduling
- Purple Book bulk staging/projection and scheduling
- openFDA labels behind configuration and exact reviewed identifiers
- FDA AEMS current/archive signal ingestion
- openFDA event aggregates behind configuration and reviewed query definitions
- Existing TGA RSS relinking
- Per-source baselines, health, caps, partial states, history, and queued jobs

Live credentials are not required for deterministic completion. Fixture transports must exercise the real production code paths. Optional live-smoke results must be reported honestly.

### Entity, peptide, dossier, and comparison depth

Complete:

- Exact-first entity/variant/mention resolution
- Append-only resolution decisions
- Peptide sequence/modification provenance
- Trial-portfolio links
- Immutable dossier dependencies/history
- Retracted/protocol/combination safeguards
- No-winner 2–4 entity comparison
- Honest coverage/stale states

### M4 evaluation and doctors

Meet the original minimum corpora:

```text
identity: at least 120 cases
regulatory: at least 72 cases
safety: at least 48 cases
multi-claim additions: at least 32 cases
```

Provide distinct, substantive commands rather than aliases to one thin script:

```text
pnpm interventions:eval
pnpm interventions:doctor
pnpm regulatory:eval
pnpm regulatory:doctor
pnpm safety:doctor
pnpm dossiers:doctor
```

Add a separate `safety:eval` if useful; it is not required when the safety corpus is fully covered by the documented M4 evaluation command set.

The M4 closure report must contain the full official checklist—including all 171 acceptance rows in the canonical brief—and the required screenshots or updated equivalents.

## 5.4 M3 official-brief residual closure

Close the M3 gaps against:

```text
docs/milestones/healthspan_dashboard_milestone_3_execution_brief.md
```

At minimum complete and evidence all of the following.

### Live V2 evidence semantics

Implement the official independent Live V2 dimensions:

- Study design
- Evidence availability
- Evidence maturity
- Organism
- Population context
- Outcome families
- Translation gaps
- Methodological signals
- Assessment completeness
- Extraction/classification confidence
- Retraction/correction state
- Research activity

Remove any Live dependency on the simplified M1-era maturity model.

Regulatory authorization, listing, licensing, or guideline status must not appear as an evidence-maturity stage.

Protocols and planned outcomes remain separate from reported findings.

### Provenance/schema depth

Implement or document a complete equivalent mapping for:

- Evidence text segments
- Immutable intelligence analyses
- Current/stale intelligence state
- Study profiles
- Study-profile outcomes
- Study-profile methodological signals
- Atomic claims
- Claim source spans
- Claim concepts
- Claim relationships
- Evidence assessments
- Translation gaps
- Methodological signals
- Evidence needs
- Assessment source-version dependencies
- Review tasks and immutable decisions
- Model runs
- Research-activity snapshots

Every current Live claim must resolve to a primary source span and source-record version.

### Claims, assessments, filters, and history

Complete:

```text
GET /api/assessments
GET /api/assessments/:id
GET /api/claims
GET /api/claims/:id
GET /api/claim-relationships
GET /api/items/:id/intelligence
GET /api/items/:id/assessment/history
```

with server-side pagination and the official M3 filter dimensions.

Complete the Live Research, Paper, Trial, Claims, Review Queue, Signal Radar, Methodology, provenance, and history surfaces at the official-brief depth.

### Deterministic and optional-AI path

Preserve deterministic-first operation.

Implement the provider-neutral adapter set from the official brief:

```text
DisabledIntelligenceProvider
FixtureIntelligenceProvider
OpenAIResponsesIntelligenceProvider
```

The OpenAI adapter remains optional and disabled by default. It must use the current official Responses API, strict structured output, storage disabled where supported, no tools, minimal public-source segments, full provenance, policy validation, request caps, and deterministic fallback.

Default and CI tests make no OpenAI calls.

### M3 methodology, evaluation, and doctors

Complete the official methodology files and screenshot set.

Preserve or exceed:

```text
at least 72 evidence cases
at least 16 claim-pair cases
```

All official deterministic gates must pass, including:

- Protocol/result separation
- Human/animal/cell separation
- Source-span resolution
- Retraction propagation
- No uncited claims
- No composite score
- Idempotent analysis
- Staleness after source change

Create `M3_OFFICIAL_BRIEF_CLOSURE_REPORT.md` with the complete official A–H checklist and evidence.

## 5.5 M2 official-brief residual closure

Close the M2 gaps against:

```text
docs/milestones/healthspan_dashboard_milestone_2_execution_brief.md
```

At minimum complete and evidence all of the following.

### Offline raw-snapshot reprocessing

Implement:

```text
pnpm ingest:reprocess --source <source-id>
```

Requirements:

- No network
- Reads stored immutable raw snapshots
- Uses the current parser/normalizer version
- Is idempotent
- Preserves source/version history
- Advances no remote checkpoint incorrectly
- Reports inserted, changed, unchanged, partial, and failed counts
- Supports PubMed, ClinicalTrials.gov, Crossref, and each TGA feed
- Uses bounded jobs and temporary-test databases
- Does not expose raw payloads through browser APIs

### PubMed production depth

Complete:

- ESearch plus batched EFetch
- Entrez history/WebEnv where useful
- Correct pagination beyond one page
- Source date filtering/overlap
- Tool/email identification
- Optional key and documented throttling
- Structured abstracts, identifiers, funding, corrections, and retractions
- Page-level transactional checkpoints
- Idempotent crash/replay tests

### ClinicalTrials.gov production depth

Complete:

- API v2 page-token pagination
- Updated-record overlap
- Full required record modules
- Explicit posted-results parsing
- Complete material-change taxonomy
- Australia location add/remove history
- Idempotent checkpoint/replay tests
- Source caps/partial-state reporting

### Crossref automatic enrichment

When PubMed imports or changes a valid DOI:

- Queue exact DOI enrichment automatically.
- Keep Crossref enrichment-only.
- Prevent duplicate paper creation.
- Preserve source precedence and conflicts.
- Refresh after staleness.
- Include enrichment in full/scheduled sync orchestration.
- Test missing/invalid DOI and Crossref failure isolation.

### M2 completion artifacts

Create `M2_OFFICIAL_BRIEF_CLOSURE_REPORT.md` containing:

- The complete official acceptance checklist
- One row per criterion
- Connector/query/window versions
- Offline reprocess results
- Idempotency/change tests
- Source health and scheduler behavior
- Honest dated live-smoke table, including `NOT RUN — no credential/network` where applicable
- Required screenshots or current equivalent screens
- Exact commands and counts
- Known limitations

Do not rewrite `M2_COMPLETION_REPORT.md`.

## 5.6 Gap-matrix closure

Update:

```text
docs/milestones/BRIEF_GAP_MATRIX.md
```

Required changes:

- Record M5 as officially closed.
- Replace old directional counts with current evidence.
- Mark every M4, M3, and M2 item `DONE`, `NOT APPLICABLE`, or `BLOCKED`.
- Link each item to its closure report and evidence.
- Record the M6 re-scope and entry-gate decision.
- State the entry-gate commit hash after it exists.
- Preserve the matrix’s history through Git rather than deleting the document.

The matrix is closed only when there are no unapproved `PARTIAL`, `MISSING`, `UNKNOWN`, or `BLOCKED` items for M2–M5.

## 5.7 Entry-gate quality checks

Before beginning Section 6 feature work, all of the following must pass:

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build

pnpm db:doctor

pnpm ingest:reprocess --source pubmed
pnpm ingest:reprocess --source clinicaltrials-gov
pnpm ingest:reprocess --source crossref
pnpm ingest:reprocess --source tga

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
```

The reprocess commands must use a deterministic fixture/temporary-data mode in the default quality run. They must never modify the user’s normal database during tests.

Also verify:

- All three closure reports are committed.
- The gap matrix is closed.
- Historical completion reports are unchanged.
- No M6 feature migration or user-facing M6 feature has begun.
- Live and Demo remain separate.
- No dosing, vendors, ranking, personal-health, hosted, or M7 work exists.

## 5.8 Entry-gate completion commit

Commit the completed gate separately.

Recommended commit message:

```text
Close M2-M4 official-brief residuals before M6 features
```

The M6 completion report must record:

- Gate commit hash
- Closure-report paths
- Matrix status
- Exact gate commands/results
- Any explicitly accepted project-manager rescope

After this commit exists and the gate passes, continue automatically with Section 6. Do not request routine approval.

# 6. Supported runtime and dependency baseline

## 6.1 Node.js

Node.js 20 is end-of-life and must not remain the supported runtime.

Target:

```text
Node.js 24 LTS
```

Required:

- Update `engines.node`.
- Add/update `.nvmrc`.
- Add/update `.node-version`.
- Document Windows installation.
- Verify all native packages, especially `better-sqlite3`.
- Verify production build/start, migrations, backup, and E2E on Node 24.
- CI uses Node 24.

Default engines policy:

```json
{
  "node": ">=24 <25"
}
```

Do not target Node 26 Current as the production baseline during M6.

## 6.2 pnpm

Upgrade from pnpm 9 to a pinned stable pnpm 11 release.

At brief issue, the checked stable line is pnpm 11. Pin the exact stable 11.x version chosen at implementation start in:

```text
packageManager
```

Minimum required capabilities include:

- Frozen-lockfile CI installs
- `pnpm audit`
- Registry-signature audit where current pnpm supports it
- SBOM generation or an equivalent documented tool
- Windows support

Record the exact selected version in the completion report.

## 6.3 Dependency upgrades

- Run a documented dependency review.
- Update vulnerable or unsupported dependencies.
- Avoid unrelated large framework rewrites.
- Preserve React/Vite/Hono/Drizzle architecture.
- Record major-version changes and compatibility tests.
- Do not use `--force` to hide incompatible peer dependencies.
- Do not introduce a dependency merely to save a few lines of code when Node core is sufficient.

---

# 7. Production-local runtime

## 7.1 One production origin

Add a production-local mode where Hono serves:

- The built React application
- `/api/*`
- `/health`
- Static hashed assets
- SPA route fallback

Default:

```text
http://127.0.0.1:8787
```

Commands:

```text
pnpm build
pnpm start
```

`pnpm start` must:

- Start the API/worker/scheduler.
- Serve the built web app.
- Bind to loopback by default.
- Print the local URL.
- Avoid printing secrets or exact private data paths.
- Refuse startup if the web build is missing, with a clear action.
- Never block on external source refresh.

Development remains:

```text
pnpm dev
```

through the Vite proxy.

## 7.2 Static-file safety

- No directory traversal.
- Correct MIME types.
- `index.html` no-cache.
- Hashed assets immutable cache.
- Source maps excluded from production unless explicitly enabled.
- No accidental directory listing.
- No raw local files.
- No fallback of `/api` errors to HTML.
- CSP-compatible asset loading.

## 7.3 Version endpoint

Add:

```text
GET /api/version
```

Return:

- App semantic version
- Build commit when supplied
- Build timestamp
- Schema version
- Runtime major
- Data mode

Do not return paths, secrets, environment contents, or Git remote credentials.

Use product version:

```text
0.6.0
```

unless the repository has adopted another documented versioning policy.

---

# 8. Local profile and preference architecture

## 8.1 Live profile

Create exactly one active Live profile:

```text
id: local-owner
kind: local_single_user
```

Do not collect name, email, age, medical details, or demographic information.

## 8.2 Persisted versus browser-local preferences

Persist in SQLite:

- Watchlists
- Watchlist entries
- Saved searches
- Saved-search alert settings
- Reading/opened/dismissed states
- Mute rules
- Alert rules/state
- Briefing settings/history
- Visit history
- Content display preferences that should survive browser reset
- Timezone
- Default page/sections
- Personalisation import history

Keep browser-local only:

- Theme
- Density
- Sidebar collapsed state
- Temporary panel/layout state
- Current browser installation ID
- Unsubmitted form drafts

Never store secrets in localStorage.

## 8.3 Legacy localStorage migration

On first Live M6 use:

1. Detect known M1–M5 Live preference keys.
2. Parse through versioned Zod schemas.
3. Show an import preview.
4. Resolve known Live IDs through the watchable-object registry.
5. Report unresolved IDs.
6. Import idempotently.
7. Mark the migration complete.
8. Preserve a local export until the user confirms success.
9. Never import Demo IDs into Live.
10. Do not silently delete legacy data.

Support:

```text
import now
skip
export legacy data
remind later
```

## 8.4 Preference precedence

For meaningful Live state:

```text
SQLite profile value
    ↓
migration candidate
    ↓
product default
```

For cosmetic browser state:

```text
browser-local value
    ↓
profile default
    ↓
product default
```

---

# 9. Watchable-object registry

## 9.1 Purpose

Watchlists must not rely on unchecked polymorphic IDs.

Create a registry of watchable objects with stable internal references.

Supported Live types:

```text
paper
trial
intervention
intervention_variant
peptide
creator
creator_account
creator_claim
scientific_claim
regulatory_product
regulatory_assertion
safety_item
topic
hallmark
source
saved_search
```

## 9.2 Registry behavior

Each watchable object stores:

- Registry ID
- Target type
- Target ID
- Data origin
- Current label
- Canonical route
- Current/deleted/redirected state
- Replacement/redirect ID
- Updated timestamp

Rules:

- Live and Demo registries never mix.
- Deleted source records do not delete the user’s watch history.
- Redirected intervention/creator entities migrate through audited mappings.
- A missing target becomes unavailable, not silently removed.
- Registry updates are transactionally linked to domain changes.

---

# 10. Watchlists and saved searches

## 10.1 Named watchlists

Support:

```text
default watchlist: Following
additional named watchlists
```

Fields:

- Name
- Short organisational description
- Sort order
- Icon from controlled set
- Active/archived
- Created/updated timestamps

Limits:

```text
maximum active watchlists: 50
maximum name length: 80
maximum description length: 240
```

Do not permit HTML.

## 10.2 Watchlist entries

Store:

- Watchlist
- Watchable object
- Added date
- Optional priority: `normal` or `high`
- Optional notification/brief inclusion override
- Current/unavailable/redirected state
- Source of addition: manual, imported, saved-search promotion

No scientific ranking is derived.

## 10.3 Saved-search query format

Store a versioned structured query—not SQL and not executable code.

Required concepts:

```text
searchSchemaVersion
entityTypes
textQuery
filters
dateRange
sort
includeRetracted
includeUnavailable
dataMode
```

Rules:

- Zod validate.
- Compile through server-side query services.
- No raw SQL fragments.
- No regular expressions supplied by the browser.
- Bounded text length and filter counts.
- Stable canonical query hash.
- A schema migration can mark a saved search `needs_update`.
- Invalid searches fail closed.

## 10.4 Saved-search evaluation

Support:

- Manual execution
- Incremental scheduled evaluation
- Last successful cursor
- Last matching count
- New-match count
- Capped/partial state
- Error state
- Alert/brief inclusion

Do not create duplicate matches on identical reruns.

## 10.5 Dynamic watch behavior

A saved search may generate alerts for new matching objects.

It must not automatically add every match to a static watchlist unless the user explicitly enables that behavior.

Static watchlist membership and dynamic saved-search matching remain distinguishable.

---

# 11. Reading, dismissal, and mute state

## 11.1 Reading state

Support:

```text
unread
opened
read
```

Rules:

- Opening a detail page marks `opened`.
- Explicit “Mark read” marks `read`.
- Automatic read-after-dwell is disabled by default.
- Bulk mark-read is supported.
- State is per local profile and watchable object.
- Source facts are unchanged.

## 11.2 Personal surface state

Support separately:

```text
active
dismissed
archived
```

Dismissal applies to the specific event/brief/feed item by default—not the entire source entity.

Provide undo and history.

## 11.3 Mute rules

Support:

- Mute object
- Mute topic
- Mute source
- Mute alert event type
- Until date
- Forever
- Reason from controlled optional set

An official warning remains visible on the canonical detail page even if muted from personalised surfaces.

## 11.4 Bulk actions

Support bounded bulk actions for:

- Mark read
- Mark unread
- Dismiss
- Restore
- Add to watchlist
- Remove from watchlist

All writes are local-admin guarded and audited.

---

# 12. Visit sessions and “Since your last visit”

## 12.1 Visit model

Create visit sessions through:

```text
POST /api/visits/start
POST /api/visits/:id/heartbeat
POST /api/visits/:id/close
```

Use a browser installation ID and tab/session ID that contain no personal identity.

Coalesce active visits from the same browser within a documented inactivity window.

Default inactivity window:

```text
30 minutes
```

## 12.2 Previous-visit cutoff

“Since your last visit” uses the start time of the previous completed/coalesced visit, not a timestamp continually overwritten during the current visit.

First visit uses:

```text
first-use state
```

and explains that no previous cutoff exists.

## 12.3 Activity minimization

Store:

- Visit ID
- Browser installation hash
- Start
- Last heartbeat
- Close/inactivity time
- Data mode
- Coalescing reason

Do not store a full clickstream or URL history.

## 12.4 Since-last-visit content

Include:

- Non-baseline change events
- Alerts
- Dossier changes
- Trial results/status changes
- Retractions/corrections
- Official regulatory/safety changes
- Reviewed creator corrections/alignment changes
- New watched matches

Exclude:

- Baseline imports
- Routine unchanged refreshes
- Raw reporting-count changes
- Old content first indexed during a new source baseline
- Dismissed/muted items unless a critical official source state overrides personalised hiding

---

# 13. Alert Centre

## 13.1 Alert rule targets

Rules may target:

```text
watchlist
watchable object
saved search
topic
source
event type
all official safety/regulatory events
```

## 13.2 Alert event families

Support:

```text
official_market_action
official_suspension_or_withdrawal
explicit_unapproved_warning
official_label_warning_change
regulator_potential_signal
paper_retraction
paper_correction
trial_results_posted
trial_status_changed
trial_australian_site_changed
evidence_assessment_changed
dossier_changed
new_saved_search_match
creator_correction
creator_alignment_changed
creator_source_unavailable
source_health_failure
backup_failure
database_integrity_failure
platform_compliance_overdue
```

Operational alerts remain visually separate from research/safety alerts.

## 13.3 Dashboard priority

Support:

```text
urgent
high
normal
low
```

Fixed default grouping:

**Urgent**

- Official suspension, withdrawal, cancellation, or active market action linked to a watched object
- Explicit official unapproved-product warning linked to a watched object
- Database-integrity failure
- Required platform-compliance purge failure

**High**

- Official label boxed-warning/warning/contraindication change
- Regulator potential signal
- Retraction of watched evidence
- Trial results posted for a watched trial/intervention
- Backup verification failure

**Normal**

- Trial status change
- Paper correction
- Evidence/dossier change
- New watched saved-search match
- Creator correction/alignment change

**Low**

- Routine source-health recovery
- Informational source/indexing change

This is dashboard triage, not personal clinical severity.

Users may adjust rule priority within safe bounds. They cannot downgrade a database-integrity or compliance-purge failure below high.

## 13.4 Alert state

Support:

```text
unread
read
acknowledged
snoozed
dismissed
resolved
source_unavailable
```

Store append-only state events.

## 13.5 Deduplication

Use a unique key including:

```text
profile
rule
source event
watch target
alert kind
material version
```

A repeated identical event must not create a new alert.

A materially changed source version may update/supersede the alert while preserving history.

## 13.6 Alert explanation

Every alert shows:

- What changed
- Why it matched
- Dashboard priority reason
- Source/event date
- Detection date
- Watchlist/saved-search rule
- Source link
- Coverage/uncertainty
- Current/stale/resolved state

## 13.7 Optional browser notifications

- Disabled by default.
- Explicit permission.
- Only while the app page is open.
- No service worker.
- Default only for urgent alerts.
- No medical advice or sensitive free text in notification body.
- Clicking opens the local alert.
- Denial does not degrade the Alert Centre.

---

# 14. Daily research brief and weekly review

## 14.1 Brief types

Support:

```text
daily_research_brief
weekly_review
manual_brief
```

## 14.2 Default schedule

Timezone:

```text
Australia/Brisbane
```

Schedule:

```text
Daily research brief: 07:15 every day
Weekly review: 09:00 Sunday
```

Startup catch-up:

- Enabled.
- Generate at most one missed daily brief.
- Generate at most one missed weekly review.
- Do not generate a backlog of every missed day.
- Wait for already-running due source jobs for up to a bounded coordinator timeout.
- Generate with an explicit partial/freshness section if sources remain incomplete.

## 14.3 Window semantics

Daily:

```text
previous successful daily brief window end → current cutoff
```

Weekly:

```text
previous successful weekly review window end → current cutoff
```

First run uses a configurable bounded lookback:

```text
daily: 24 hours
weekly: 7 days
```

## 14.4 Sections

Default order:

1. **Official Safety & Regulation**
2. **Corrections & Retractions**
3. **Watched Trial Changes**
4. **Watched Evidence & Dossiers**
5. **New Results and Research**
6. **Creator Corrections & Reviewed Claims**
7. **New Saved-Search Matches**
8. **Continue Reading**
9. **Source Coverage & Operations**

Users may enable/disable non-safety sections.

Official safety/regulatory changes remain available in Alert Centre even when the briefing section is hidden.

## 14.5 Selection rules

Use deterministic grouping, not an opaque score.

Selection order inside each section:

1. Dashboard priority group
2. Direct watch match
3. Saved-search match
4. Materiality/event type
5. Source date
6. Detection date
7. Stable ID tie-breaker

Default caps:

```text
daily total: 25 items
weekly total: 60 items
per section daily: 8
per section weekly: 15
```

Overflow is reported and linked.

## 14.6 Deduplication and clustering

- One material source event appears once per brief.
- Related change events may be grouped under one dossier/trial/source heading.
- Grouping retains individual source links.
- Do not merge incompatible populations, variants, jurisdictions, or claims.
- Creator recurrence is not evidence.

## 14.7 Brief item content

Every item shows:

- Deterministic title
- Concise deterministic summary
- Why included
- Watchlist/search/rule match
- Source date
- Detection date
- Evidence/regulatory/safety context
- Source links
- Read/dismiss state
- Stale/retracted/source-unavailable state

## 14.8 Immutable snapshots

A brief snapshot is immutable for:

```text
profile
brief type
window
ruleset version
input dependency hash
```

Identical regeneration reuses the snapshot.

Corrections, retractions, and platform purges do not rewrite history silently. A prior brief item receives a current warning/redaction state.

Platform-policy-required deletion must remove restricted source text from historical brief display and exports.

## 14.9 Empty and partial briefs

If no material changes exist, generate:

> No material changes matched this brief’s rules during the selected window.

Include source coverage and health.

If partial, identify:

- Source not configured
- Source disabled
- Source stale
- Source failed
- Job still running
- Quota/budget blocked
- Platform compliance overdue
- Record cap reached

## 14.10 Optional AI wording

Deterministic briefs are the completion requirement.

Optional AI wording:

- Disabled by default.
- May rewrite already selected official public-source facts only.
- Must preserve citations and deterministic item selection.
- Must not receive X content.
- Must not receive YouTube API metadata.
- Must not receive watchlist names, visit history, reading state, or local profile data.
- Must not receive platform-restricted content.
- Must not create new claims.
- Failure falls back to deterministic text.
- Output is labelled AI-assisted.

---

# 15. Personalisation export and import

## 15.1 Portable personalisation export

Versioned JSON export includes:

- Watchlists
- Watchlist entries
- Saved searches
- Alert rules
- Briefing settings
- Reading/dismissal state
- Mute rules
- Resolvable target identifiers
- Schema version
- Export date
- Data mode
- App version

Exclude:

- Source database records
- Raw snapshots
- Platform content text
- X text
- Creator documents
- API keys
- Local paths
- Logs
- Browser session tokens
- Visit history by default

## 15.2 Import behavior

- Validate manifest/schema.
- Preview changes.
- Support merge and replace-personalisation modes.
- Never replace scientific/source data.
- Resolve targets by stable internal/external identifiers.
- Report unresolved targets.
- Avoid duplicate list/search/rule entries.
- Create an import audit record.
- Roll back fully on validation failure.

## 15.3 Brief export

Support:

```text
Markdown
versioned JSON
```

Requirements:

- Include source links and dates.
- Include app-authored text.
- Bound quotations.
- Exclude restricted platform text.
- Mark source-unavailable/redacted items.
- Include generation/window/ruleset metadata.
- Do not export a medical recommendation.

## 15.4 Diagnostic export is separate

A diagnostic bundle is not a personalisation export or backup.

---

# 16. Backup architecture

## 16.1 Backup tiers

Support:

```text
recovery_checkpoint
portable_core
portable_full
```

### Recovery checkpoint

Purpose:

- Migration safety
- Restore rollback
- Local database corruption recovery

Contents:

- Sanitized consistent database snapshot
- User-owned/authorised creator document files and manifest where configured
- Schema/app manifest
- No official raw snapshot store
- No platform-restricted text
- No secrets

Default automatic retention:

```text
7 daily
3 pre-migration
3 pre-restore
```

### Portable core

Contents:

- Sanitized database snapshot
- Personalisation
- User-owned/authorised local creator documents
- Manifests/checksums
- No official raw source snapshots
- No platform-restricted text
- No secrets

### Portable full

Contents:

- Portable core
- Official immutable raw source snapshots referenced by retained source versions
- Content-addressed raw-store manifest

Exclude:

- YouTube/X raw API payloads
- X text
- Deleted/withheld content
- Credentials
- Operational logs by default

## 16.2 Consistent database snapshot

Use the SQLite Online Backup API or a verified equivalent exposed by the local driver.

Do not copy a live WAL database with ordinary filesystem copy.

The snapshot must represent a consistent database state.

## 16.3 Sanitized backup database

After taking a temporary consistent copy, run a versioned backup-sanitization pass on the copy.

At minimum:

- Remove browser/CSRF sessions.
- Remove transient job leases.
- Remove secrets if any invariant violation placed one in DB.
- Remove X current text and restricted source spans.
- Remove platform raw payloads.
- Redact platform-dependent historical brief/profile text.
- Preserve monitored account IDs/configuration where policy permits.
- Mark platform-dependent claims for re-sync/reassessment.
- Remove absolute paths.
- Normalize storage references to archive-relative paths.
- Record exclusions in manifest.

Run:

```text
PRAGMA integrity_check
foreign-key check
all domain doctors relevant to backup
```

against the sanitized copy.

## 16.4 Backup container

Use a versioned custom extension:

```text
.healthspan-backup
```

The inner archive must contain:

```text
manifest.json
database/healthspan-dashboard.sqlite3
documents/...
raw/sha256/...      # portable_full only
checksums.json
```

Requirements:

- Streaming archive creation.
- Path traversal protection.
- File-count and size caps.
- SHA-256 for every payload.
- Manifest hash.
- Atomic final rename.
- Temporary cleanup after failure.

## 16.5 Encryption

Portable backup default:

```text
encrypted
```

Use:

- Node cryptographic primitives
- AES-256-GCM authenticated encryption
- Random salt
- Random nonce
- Versioned scrypt KDF parameters
- Authenticated header/manifest metadata
- No passphrase storage
- Passphrase confirmation
- Minimum passphrase guidance
- Tamper and wrong-passphrase failure

Unencrypted portable backup is permitted only after an explicit warning and flag.

Automatic local recovery checkpoints may be unencrypted because they remain within the protected application-data directory, but the UI must state this. Apply restrictive filesystem permissions where the OS permits.

Do not use weak ZIP password encryption.

## 16.6 Backup schedule

Default:

```text
daily recovery checkpoint: 02:30 Australia/Brisbane
pre-migration checkpoint: before pending non-empty DB migration
pre-restore checkpoint: mandatory
portable backups: manual
```

Scheduler catch-up creates at most one missed daily recovery checkpoint.

A backup job must not overlap:

- Restore
- Migration
- Another backup
- Destructive retention cleanup

It may coexist with normal reads/writes through the online backup API.

## 16.7 Backup verification

Support:

```text
manifest-only verification
full hash verification
database integrity verification
dry-run restore verification
```

Every automatic backup receives at least:

```text
manifest + hash + database integrity
```

## 16.8 Restore

Restore is CLI-only in M6.

Command:

```text
pnpm backup:restore -- --input <file>
```

Requirements:

1. Require API/worker shutdown or acquire an exclusive application lock.
2. Verify file type/magic/version.
3. Ask for passphrase securely if encrypted.
4. Validate hashes.
5. Validate archive paths/caps.
6. Extract to a temporary directory.
7. Verify database integrity and schema.
8. Run migrations in the temporary target if supported.
9. Run platform-policy scrub/doctor.
10. Run domain doctors.
11. Create pre-restore checkpoint of active data.
12. Atomically swap data.
13. Start/read the restored DB in verification mode.
14. Roll back automatically if final verification fails.
15. Record restore result without storing passphrase.
16. Schedule source/platform re-sync where data was excluded.

No browser restore endpoint.

## 16.9 Backup deletion/pruning

- Preview deletion.
- Protect newest successful recovery backup.
- Protect pre-restore checkpoint until restore verified.
- Never delete a backup with active restore reference.
- Use safe paths under managed backup directory.
- CLI may delete an explicitly supplied external portable backup only with exact confirmation.

---

# 17. Local HTTP and request-integrity security

## 17.1 Loopback default

Default bind:

```text
127.0.0.1
```

Support IPv6 loopback when explicitly configured.

Reject non-loopback startup unless remote binding is explicitly acknowledged.

## 17.2 Same-origin production session

For browser use, implement an ephemeral local request-integrity session:

- Cryptographically random session ID
- HttpOnly cookie
- `SameSite=Strict`
- `Secure` when HTTPS
- Short bounded lifetime
- CSRF token returned through an explicit session bootstrap response
- Token required in a custom header for mutations
- Session rotation after API restart
- No user identity attached
- No persistence in backup/export

## 17.3 Mutation validation

Every browser mutation must pass:

- Allowed Host
- Allowed Origin
- Fetch Metadata policy where available
- Local request-integrity session
- CSRF token
- Existing local-admin guard
- Rate limit
- Zod input validation

CLI operations call services directly rather than bypassing HTTP security through a hidden network endpoint.

## 17.4 DNS rebinding and Host validation

Allow only configured hosts:

```text
127.0.0.1
localhost
[::1]
configured explicit local hostname
```

Reject unexpected Host headers.

Do not trust `X-Forwarded-*` by default.

## 17.5 CORS

- No wildcard origin.
- Production local mode is same-origin.
- Development permits only configured Vite origins.
- Credentials only for allowed origins.
- Preflight responses bounded.
- `null` origin denied for mutation.

## 17.6 Remote binding

A non-loopback bind requires all of:

```text
HEALTHSPAN_ALLOW_REMOTE_BIND=true
HEALTHSPAN_REMOTE_ACCESS_TOKEN=<minimum 32 random bytes>
explicit host allowlist
```

Rules:

- Token required for all API reads and writes.
- Existing `HEALTHSPAN_ALLOW_REMOTE_ADMIN` alone is insufficient and deprecated.
- Startup warns that built-in TLS is not provided.
- Documentation recommends trusted local network plus a TLS reverse proxy.
- Remote binding is not the default supported workflow.
- Never expose secrets through health endpoints.

This is request protection, not multi-user authentication.

## 17.7 Rate limits

Use separate configurable token buckets:

```text
ordinary reads
search/heavy reads
mutations
file uploads
backup/diagnostic creation
session bootstrap
```

Defaults must tolerate normal UI use while blocking abusive local-web loops.

Return standard retry metadata.

## 17.8 Request/body limits

Set explicit limits for:

- JSON
- Search queries
- Multipart documents
- Personalisation imports
- Diagnostic requests
- Backup commands

Reject compressed bombs and unexpected content encodings.

## 17.9 Security headers

Production responses must include an appropriate set of:

```text
Content-Security-Policy
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
frame-ancestors 'none'
base-uri 'none'
object-src 'none'
Permissions-Policy
Cross-Origin-Opener-Policy where compatible
```

Do not set HSTS for plain localhost HTTP.

Use a development CSP separately if Vite requires relaxed directives.

## 17.10 Untrusted content rendering

- Never render source/platform/user import HTML directly.
- Avoid `dangerouslySetInnerHTML`.
- If Markdown is rendered, sanitize with an allowlist.
- External links use safe rel/referrer behavior.
- No `javascript:` URLs.
- No inline event handlers.
- Text excerpts remain text nodes.
- Charts/tooltips escape content.

---

# 18. Observability and Operations workspace

## 18.1 Structured local logging

Use structured logs with fields such as:

```text
timestamp
level
component
event
requestId
jobId
runId
sourceId
durationMs
status
counts
errorCode
```

Never log:

- API keys
- Authorization headers
- Cookies
- CSRF tokens
- Backup passphrases
- Full source text
- X text
- Creator document text
- Personalisation export payloads
- Exact local paths in browser-visible logs
- Raw SQL parameters containing text

## 18.2 Log destinations

- Human-readable console in development.
- Rotating JSONL files in the managed data directory for production local use.
- Recent sanitized operational events in the Operations UI.
- No external sink.

Defaults:

```text
retention: 14 days
maximum total log storage: 256 MiB
maximum file size: 20 MiB
```

## 18.3 Correlation IDs

Generate and propagate:

- Request ID
- Parent/child job IDs
- Ingestion/intelligence/dossier/creator/brief/backup run IDs
- Diagnostic-bundle ID

Return safe request IDs in error responses.

## 18.4 Local metrics

Collect bounded local operational metrics:

- API latency/error counts
- Queue depth
- Job duration/success/failure
- Source freshness
- Brief generation duration
- Alert generation counts
- Backup duration/size/verification
- DB size/WAL size
- Raw/document/log/backup storage
- Platform quota/budget
- Scheduler lag
- Browser/API version mismatch

No user behavior analytics.

## 18.5 Operations workspace

Show:

```text
overall local health
app/runtime/schema versions
database integrity
worker and scheduler
job queues
source health
intelligence/dossier/creator health
briefing status
alert status
backup status
storage usage
retention status
platform compliance
recent redacted errors
security-audit status
```

Use:

```text
healthy
degraded
action_required
disabled
unknown
```

## 18.6 Diagnostic bundle

Create a local bundle containing:

- Manifest
- App/runtime/schema versions
- Sanitized configuration presence/absence
- Source health
- Job/scheduler summaries
- Doctor results
- Recent redacted logs
- Storage summary
- Dependency/SBOM hashes
- Security/a11y/performance gate summaries

Exclude:

- Database
- Raw snapshots
- Creator documents
- Platform text
- Personalisation data
- Secrets
- Exact private paths
- Backup contents

No upload occurs.

---

# 19. Crash recovery and database maintenance

## 19.1 Startup/shutdown marker

Record:

- Startup time
- Clean shutdown
- Previous unclean shutdown
- Recovery actions
- DB quick-check result

An unclean shutdown alone is not a user alarm unless integrity/job recovery fails.

## 19.2 Stale work recovery

On startup:

- Recover expired job leases.
- Resume/replace interrupted brief/backup jobs safely.
- Reconcile scheduler due work.
- Never resume a partially written archive as valid.
- Clean stale temp files.
- Recheck platform compliance.
- Preserve idempotency.

## 19.3 SQLite maintenance

Schedule/document:

```text
PRAGMA optimize
WAL checkpoint
incremental or explicit VACUUM policy
integrity/quick checks
foreign-key checks
```

Rules:

- Do not run blocking full VACUUM automatically on every startup.
- Offer a maintenance job when reclaimable space crosses a threshold.
- Show estimated impact.
- Create a recovery checkpoint before destructive maintenance.
- Keep driver-specific logic in `@healthspan/db`.

## 19.4 Storage inventory

Measure:

- Database
- WAL/SHM
- Official raw snapshots
- User-owned creator documents
- Platform current cache
- Logs
- Backups
- Temporary files
- Rebuildable caches

Do not expose exact path in browser API.

---

# 20. Retention and cleanup

## 20.1 Default policies

Recommended defaults:

| Data class                        | Default                                 |
| --------------------------------- | --------------------------------------- |
| User watchlists/searches/settings | Retain until user deletes               |
| Reading/dismissal state           | Retain while target/history is retained |
| Visit sessions                    | 180 days                                |
| Daily briefs                      | 180 days                                |
| Weekly reviews                    | 730 days                                |
| Alerts resolved/dismissed         | 365 days                                |
| Operational logs                  | 14 days / 256 MiB                       |
| High-resolution metrics           | 90 days                                 |
| Daily metric aggregates           | 365 days                                |
| Completed job detail              | 180 days                                |
| Sanitized job errors              | 365 days                                |
| Unreferenced temp files           | 24 hours                                |
| Unreferenced raw snapshots        | 30 days after proven unreferenced       |
| Platform data                     | Current platform policy                 |
| User-owned creator documents      | Until user deletes                      |
| Recovery backups                  | 7 daily + protected checkpoints         |

## 20.2 Safety rules

Never automatically delete:

- Source-record version metadata
- Claims/assessments needed for audit
- Human review decisions
- Watchlists/saved searches
- User-owned documents
- Current dossier/profile snapshots
- Regulatory/safety history
- The newest valid recovery backup

unless explicitly permitted by the data-class policy and user action.

## 20.3 Cleanup workflow

Support:

```text
preview
apply
verify
report
```

The preview identifies:

- Category
- Count
- Estimated bytes
- Oldest/newest date
- Rebuildability
- Policy basis
- Protected records

Destructive cleanup uses queued jobs and local-admin controls.

---

# 21. Accessibility target

## 21.1 Standard

Target:

```text
WCAG 2.2 Level AA
```

Record the checked W3C recommendation date and URL.

Do not claim formal certification.

## 21.2 Automated testing

Use:

- `axe-core` or equivalent integration
- Playwright accessibility checks
- Component-level semantic checks where useful
- No serious/critical automated violations on tested pages

## 21.3 Manual critical-flow checklist

Test:

- Keyboard-only navigation
- Visible focus
- Focus not obscured
- Skip link
- Landmarks/headings
- Dialog focus trap/restore
- File import
- Backup create flow
- Alert state changes
- Briefing navigation
- Watchlist actions
- Saved-search creation
- Bulk reading actions
- Review queues
- Charts and tables
- Error recovery
- 200% browser zoom
- 400% reflow where applicable
- Reduced motion
- Screen reader labels/status announcements
- Touch target size
- Colour-independent status
- Contrast
- Dark/light themes
- Mobile orientation

## 21.4 Charts

Every chart has:

- Accessible title/description
- Text summary
- Tabular alternative
- Keyboard-accessible data where interactive
- No colour-only encoding
- Reduced-motion support

## 21.5 Time/status

- Toasts and background-job updates use appropriate live regions.
- No critical message disappears before the user can act.
- Snooze/dismiss actions are reversible.
- Loading states expose text status.

---

# 22. Performance and capacity

## 22.1 Generated test scale

Use generated data, not committed databases.

Target scale:

```text
50,000 content items
250,000 scientific claims
25,000 intervention entities/variants
10,000 creators
250,000 creator claims
1,000,000 change/alert candidate events
100,000 alerts
10,000 saved-search matches
2 years of briefs
```

## 22.2 Local API targets

Target p95 on a typical Windows development machine:

```text
Today personalised dashboard: < 1,000 ms
Alerts list: < 600 ms
Watchlists list: < 500 ms
Watchlist detail: < 700 ms
Saved-search execution: < 1,200 ms
Brief detail: < 700 ms
Since-last-visit feed: < 900 ms
Operations overview: < 700 ms
```

Document hardware and dataset for measurements.

## 22.3 Production-local startup

Target:

```text
API ready without external sync: < 5 seconds
web shell first response: < 1 second after API ready
```

Pending backup/migration may legitimately extend startup but must show terminal progress and never silently hang.

## 22.4 Web budgets

Set and test documented budgets.

Recommended starting targets:

```text
initial JS gzip: <= 450 KiB
individual lazy route chunk gzip: <= 300 KiB
initial CSS gzip: <= 80 KiB
```

Use route-level code splitting for heavy operations, charts, and backup pages.

A justified exception requires documented evidence.

## 22.5 Runtime behavior

- Paginate/virtualize bounded lists.
- Do not load all alerts/brief items into browser memory.
- Stream backup/archive work.
- Bound concurrency.
- Keep UI responsive during jobs.
- Abort stale searches.
- Debounce text search.
- Avoid N+1 dossier/watch queries.
- Use indexed incremental saved-search evaluation.

---

# 23. Supply-chain and CI hardening

## 23.1 GitHub Actions

Add CI for:

```text
push to milestone branches
pull requests
manual dispatch
```

Required jobs:

1. **Quality — Ubuntu**
2. **Quality — Windows**
3. **E2E — Ubuntu Chromium**
4. **Security & supply chain**
5. **Doctors/evaluations**

Use:

- Node 24
- Pinned pnpm 11
- Frozen lockfile
- Dependency cache
- Timeouts
- Least permissions
- No repository secrets
- Full commit-SHA pinning for third-party actions

## 23.2 Dependency audit

Add:

```text
pnpm security:audit
```

Requirements:

- Fail on unmitigated high/critical production vulnerabilities.
- Review development-only findings.
- Any allowlist entry has:
  - Advisory ID
  - Rationale
  - Scope
  - Owner
  - Expiry date
- No permanent blanket ignore.

## 23.3 Registry signature audit

Where supported by the selected pnpm 11 version, run registry signature verification.

Document skipped registries and limitations.

## 23.4 SBOM

Generate a machine-readable SBOM for the production dependency graph.

Preferred:

```text
CycloneDX JSON
```

Store CI artifact, not a constantly changing committed artifact unless project policy chooses otherwise.

Record tool/version.

## 23.5 License inventory

Generate a dependency license inventory.

Fail or require review for:

- Unknown license
- Unlicensed package
- Unexpected strong-copyleft production dependency
- Package source mismatch

Do not claim legal advice.

## 23.6 Secret scanning

Add a deterministic tracked-file scan covering:

- API keys
- Bearer tokens
- Private keys
- `.env`
- Common platform token formats
- Database/raw/backup files
- Diagnostic bundles

Use a narrow reviewed allowlist for fixtures.

## 23.7 Reproducibility

- Frozen lockfile.
- Pinned package manager.
- No floating Git dependencies.
- No install scripts from unexpected packages without review.
- Document native-build requirements.
- Verify Windows clean install.
- Verify production build from a clean checkout.

---

# 24. Security verification baseline

## 24.1 Standards

Use as review references:

```text
OWASP ASVS 5.0.0 — applicable Level 1 requirements and selected Level 2 controls
OWASP Top 10 2025
OWASP Web Security Testing Guide 4.2 where relevant
```

Do not claim ASVS certification.

## 24.2 Threat model

Create:

```text
docs/security/THREAT_MODEL.md
```

Cover at minimum:

- Malicious website targeting localhost
- DNS rebinding
- CSRF
- Cross-origin data exfiltration
- Source-content XSS
- Malicious creator document
- Malicious personalisation import
- Malicious backup archive
- Path traversal/zip-slip
- SQL/filter injection
- Secret leakage
- Diagnostic leakage
- Platform-policy retention failure
- Corrupt database
- Interrupted migration/restore
- Dependency compromise
- Denial of service through large queries/files/jobs
- Remote bind misconfiguration
- AI prompt injection
- X-to-AI policy violation

For each:

```text
asset
entry point
trust boundary
mitigation
test
residual risk
```

## 24.3 Security review command

Add:

```text
pnpm security:check
```

It should orchestrate deterministic local checks such as:

- Dependency audit
- Signature audit
- Secret scan
- Header test
- CORS/Host/CSRF tests
- Import/archive adversarial tests
- No-source-text logging checks
- No restricted backup/export data checks

---

# 25. Required database/schema work

Preserve all M1–M5 data. Add forward-only Drizzle migrations after the current M5 migration sequence.

Use:

- Application-generated text UUIDs
- UTC Unix-millisecond timestamps
- Integer-backed booleans
- Text enums validated by Zod
- Explicit foreign keys
- Ordinary indexed tables
- Small validated JSON for typed query payloads/diffs only
- No triggers
- No stored procedures
- No custom SQLite extension
- No vector extension
- No filesystem path as a domain identifier

The exact physical decomposition may be refined, but the following logical entities and semantics are required.

## 25.1 `local_profiles`

Required:

- Stable ID
- Profile kind
- Active state
- Timezone
- Created/updated timestamp
- Schema version

Exactly one active Live local profile.

## 25.2 `profile_preferences`

Required:

- Profile ID
- Preference key
- Versioned validated value
- Updated timestamp
- Source: default, migrated, user
- Unique profile/key

Use controlled keys and per-key Zod schemas.

## 25.3 `preference_migration_runs`

Required:

- Browser migration identity/hash
- Source schema version
- Preview counts
- Imported/skipped/unresolved counts
- Status
- Created/completed timestamps
- Sanitized errors

## 25.4 `watchable_objects`

Required as Section 9.

Unique:

```text
data_origin + target_type + target_id
```

## 25.5 `watchlists`

Required as Section 10.

## 25.6 `watchlist_entries`

Required:

- Watchlist ID
- Watchable object ID
- Added timestamp
- Priority
- Inclusion overrides
- Current state
- Source
- Unique active membership

## 25.7 `saved_searches`

Required:

- Profile ID
- Name
- Description
- Query schema version
- Validated query JSON
- Canonical hash
- Active/needs-update/archived state
- Alert/brief settings
- Created/updated timestamps

## 25.8 `saved_search_evaluations`

Required:

- Saved search
- Window/cursor
- Query version/hash
- Status
- Matched/new/capped counts
- Started/completed timestamps
- Error summary

## 25.9 `saved_search_matches`

Required:

- Saved search
- Watchable object
- First/last matched
- Current match state
- Match version
- Unique search/object

## 25.10 `reading_states`

Required:

- Profile
- Watchable object
- Reading state
- Personal-surface state
- First seen
- Last opened
- Marked read
- Dismissed/archived timestamp
- Current version

## 25.11 `reading_state_events`

Append-only:

- Prior/new state
- Action
- Source surface
- Timestamp
- Batch action ID

## 25.12 `mute_rules`

Required:

- Profile
- Target scope/type/ID
- Event type scope
- Start/end
- Active state
- Reason
- Created/updated

## 25.13 `visit_sessions`

Required as Section 12.

## 25.14 `alert_rules`

Required:

- Profile
- Name
- Target kind/reference
- Event families
- Priority override
- Delivery modes
- Active state
- Query/rule version
- Created/updated

## 25.15 `alerts`

Required:

- Profile
- Rule
- Event/dependency reference
- Watchable object
- Alert kind
- Dashboard priority
- Deterministic title/summary
- Why included
- State
- Source/detection dates
- Current/stale/resolved
- Dedupe key
- Created/updated

## 25.16 `alert_state_events`

Append-only state history.

## 25.17 `alert_deliveries`

Required:

- Alert
- Delivery mode: in_app, browser_while_open
- Status
- Attempt timestamp
- Error
- No external destination

## 25.18 `briefing_settings`

Required:

- Profile
- Daily/weekly enabled
- Timezone
- Schedule
- Section settings
- Caps
- Continue-reading setting
- Optional AI wording setting
- Updated timestamp

## 25.19 `briefing_runs`

Required:

- Profile
- Brief type
- Trigger
- Window
- Status
- Input counts
- Partial/source coverage
- Ruleset version
- Started/completed
- Error summary

## 25.20 `briefs`

Required:

- Profile
- Brief type
- Window start/end
- Input dependency hash
- Ruleset version
- Status
- Item/overflow counts
- Coverage state
- Created timestamp
- Unique immutable identity

## 25.21 `brief_items`

Required:

- Brief
- Section
- Stable order
- Item kind
- Watchable object
- Alert/event reference
- Deterministic title/summary
- Why included
- Current redaction/staleness state
- Created timestamp

## 25.22 `brief_item_dependencies`

Join to:

- Change events
- Alerts
- Claims/assessments
- Dossiers
- Trials
- Regulatory/safety items
- Creator claims
- Source record versions
- Platform content policy state

## 25.23 `personalisation_imports_exports`

May be separate import/export tables.

Store:

- Kind
- Schema version
- Status
- Counts
- File hash
- Created/completed
- No payload or absolute path in browser-visible fields

## 25.24 `backup_records`

Required:

- Backup type
- Backup format version
- Encrypted flag
- Sanitizer version
- Status
- Archive filename/storage key
- Created/completed
- Size
- Manifest hash
- DB integrity result
- Included/excluded categories
- Protected-until
- Verification timestamp
- Error summary

Do not store passphrases.

## 25.25 `restore_records`

Required:

- Input backup hash
- Format/schema/app versions
- Preflight status
- Pre-restore backup ID
- Migration result
- Doctor result
- Swap/rollback result
- Started/completed
- Error summary

## 25.26 `retention_policies`

Required:

- Data class
- Policy version
- Retention value
- Enabled
- User/system source
- Updated timestamp

## 25.27 `retention_runs`

Required:

- Trigger
- Preview/apply
- Policy version
- Candidate/deleted/skipped/protected counts
- Bytes estimate/actual
- Status
- Started/completed

## 25.28 `storage_usage_snapshots`

Required:

- Category
- Bytes
- File/row count
- Measured timestamp
- Measurement version

No exact path in browser API.

## 25.29 `operational_events`

Sanitized bounded events for Operations UI.

Required:

- Level
- Component
- Event code
- Request/job/run IDs
- Sanitized summary
- Created timestamp
- Expiry timestamp

## 25.30 `operational_metric_buckets`

Required:

- Metric
- Dimensions from controlled set
- Window
- Count/sum/min/max
- Created timestamp

No behavioral analytics.

## 25.31 `application_runs`

Required:

- Startup
- Shutdown
- Clean/unclean state
- Version/schema
- Recovery actions
- Integrity state

## 25.32 `diagnostic_bundles`

Required:

- Bundle ID
- Status
- Manifest hash
- Included categories
- Size
- Created/expiry
- No exact path in browser response

## 25.33 `security_audit_runs`

Required:

- Audit kind/version
- Status
- Counts
- Tool versions
- Created/completed
- Sanitized report reference

## 25.34 Existing-table extensions

Extend where required:

- Background jobs
- Scheduler
- Change events
- Platform policy state
- Domain current-state tables
- Source health

Do not duplicate canonical scientific/regulatory/creator data.

## 25.35 Indexes

At minimum index:

- Watchable target type/ID
- Watchlist active/order
- Watchlist membership
- Saved-search active/hash
- Saved-search match/search/object
- Reading state/profile/state/date
- Visit profile/start/end
- Alert profile/state/priority/date
- Alert dedupe
- Brief profile/type/window
- Brief item/section/order
- Backup type/status/date
- Retention data class/status/date
- Operational event level/component/date
- Metric/window
- Storage category/date
- Job kind/status/due time

Add query-plan checks for principal personalisation, alert, brief, Operations, and retention queries.

---

# 26. Package responsibilities

## 26.1 `packages/core`

Add versioned schemas for:

```text
LocalProfile
ProfilePreference
WatchableObject
Watchlist
WatchlistEntry
SavedSearch
SavedSearchQuery
ReadingState
MuteRule
VisitSession
AlertRule
Alert
BriefingSettings
Brief
BriefItem
PersonalisationExport
BackupManifest
BackupRecord
RestoreRecord
RetentionPolicy
StorageUsage
OperationalHealth
DiagnosticBundle
SecurityAuditResult
```

No DB driver, React, or filesystem access.

## 26.2 New `packages/personalization`

Use code package spelling:

```text
@healthspan/personalization
```

UI copy may use Australian spelling “Personalisation”.

Recommended structure:

```text
packages/personalization/src/
├─ profiles/
├─ migration/
├─ watchables/
├─ watchlists/
├─ searches/
├─ reading/
├─ visits/
├─ alerts/
├─ briefings/
├─ export/
├─ rules/
├─ evaluation/
└─ index.ts
```

Responsibilities:

- Pure personalisation domain rules
- Structured saved-search schemas
- Alert matching/deduplication
- Brief selection/deduplication
- Since-last-visit rules
- Export/import schemas
- Evaluation corpus

No network or DB driver.

## 26.3 New `packages/operations`

Create:

```text
@healthspan/operations
```

Recommended structure:

```text
packages/operations/src/
├─ backup/
├─ restore/
├─ retention/
├─ storage/
├─ logging/
├─ metrics/
├─ diagnostics/
├─ security/
├─ maintenance/
└─ index.ts
```

Responsibilities:

- Backup manifest/archive/encryption policy
- Platform-aware backup sanitization
- Restore preflight
- Retention planning
- Storage categorization
- Log redaction
- Diagnostic bundle policy
- Security-header/session policies
- Doctor/evaluation helpers

Filesystem and crypto adapters may live here behind interfaces.

## 26.4 `packages/db`

Add:

- M6 migrations
- Repositories for M6 entities
- SQLite backup adapter
- Atomic restore/swap support
- Retention/storage queries
- Operational metric/event persistence
- Query-plan fixtures
- Integrity/maintenance helpers
- Platform-safe backup scrub projection

Scientific/business rules remain outside DB.

## 26.5 `packages/connectors`

No new source connector.

Permitted work:

- Official-brief residual connector work permitted by Section 5
- M5 YouTube/X regression fixes only when required by the official M5 closure
- Existing connector reliability fixes
- Source-health/observability integration

## 26.6 Existing domain packages

`@healthspan/intelligence`, `@healthspan/interventions`, and `@healthspan/creators` may expose watchable/change/dependency adapters.

They must not absorb personalisation or backup logic.

## 26.7 `packages/ui`

Add reusable components when useful:

```text
WatchButton
WatchlistPicker
ReadingStateControl
DismissControl
MuteControl
AlertPriorityBadge
AlertStateBadge
BriefSection
WhyIncludedPanel
SourceCoveragePanel
OperationsHealthCard
BackupStatusCard
StorageCategoryBar
RetentionPreview
SecurityStatusBanner
AccessibilityStatusText
```

## 26.8 `apps/api`

Add:

- Production static serving
- Session/CSRF/Host/CORS middleware
- Rate limits and size limits
- Local profile service
- Watchlist/search/reading/visit services
- Alert orchestration
- Briefing orchestration
- Backup/retention/diagnostic services
- Operations APIs
- New jobs/schedules
- Safe startup/shutdown/recovery
- Version endpoint
- Redacted logging/metrics

## 26.9 `apps/web`

Add:

- Personalised Today
- Watchlists
- Saved searches
- Alert Centre
- Briefings
- Reading state controls
- Since-last-visit
- Legacy preference migration
- Personalisation settings
- Backup & Storage
- Operations
- Diagnostic bundle flow
- Browser notification opt-in
- Accessibility improvements
- Production single-origin client bootstrap

---

# 27. Background jobs and schedules

Add job kinds:

```text
evaluate_saved_search
evaluate_all_due_saved_searches
generate_alerts_for_event
reconcile_alerts
generate_daily_brief
generate_weekly_review
generate_manual_brief
rebuild_brief_after_redaction

create_recovery_backup
create_portable_backup
verify_backup
prune_backups
restore_preflight

measure_storage
preview_retention
apply_retention
rotate_logs
aggregate_metrics
optimize_database
checkpoint_wal
run_integrity_check
create_diagnostic_bundle
run_security_audit

migrate_legacy_preferences
reconcile_watchable_objects

resolve_youtube_handle
sync_x_production
run_x_compliance
```

Rules:

- Persisted jobs
- `202 Accepted`
- Leases
- Restart recovery
- Deduplication
- Bounded retries
- Parent/child orchestration
- No overlapping restore/migration/backup conflicts
- Compliance jobs outrank analytics
- Integrity failure outranks briefs
- Graceful shutdown
- No unbounded fan-out
- No external delivery

---

# 28. API requirements

Retain the response envelope and strict `dataMode`.

All list endpoints are server-side paginated and validated.

## 28.1 Session/version

```text
GET  /api/session
GET  /api/version
```

`/api/session` returns a CSRF token and safe expiry metadata after setting the request-integrity cookie.

## 28.2 Local profile/preferences

```text
GET   /api/local-profile
GET   /api/preferences
PATCH /api/preferences
POST  /api/preferences/migrate/preview
POST  /api/preferences/migrate/apply
```

## 28.3 Watchlists

```text
GET    /api/watchlists
POST   /api/watchlists
GET    /api/watchlists/:id
PATCH  /api/watchlists/:id
DELETE /api/watchlists/:id

POST   /api/watchlists/:id/items
DELETE /api/watchlists/:id/items/:watchableId
POST   /api/watchlists/:id/items/batch
```

## 28.4 Saved searches

```text
GET    /api/saved-searches
POST   /api/saved-searches
GET    /api/saved-searches/:id
PATCH  /api/saved-searches/:id
DELETE /api/saved-searches/:id
POST   /api/saved-searches/:id/run
GET    /api/saved-searches/:id/matches
GET    /api/saved-searches/:id/history
```

## 28.5 Reading/mute state

```text
GET  /api/reading-state
PUT  /api/reading-state/:watchableId
POST /api/reading-state/batch

GET    /api/mutes
POST   /api/mutes
PATCH  /api/mutes/:id
DELETE /api/mutes/:id
```

## 28.6 Visits

```text
POST /api/visits/start
POST /api/visits/:id/heartbeat
POST /api/visits/:id/close
GET  /api/visits/previous
GET  /api/since-last-visit
```

## 28.7 Alerts

```text
GET    /api/alert-rules
POST   /api/alert-rules
PATCH  /api/alert-rules/:id
DELETE /api/alert-rules/:id

GET  /api/alerts
GET  /api/alerts/:id
POST /api/alerts/:id/read
POST /api/alerts/:id/acknowledge
POST /api/alerts/:id/snooze
POST /api/alerts/:id/dismiss
POST /api/alerts/batch
```

## 28.8 Briefings

```text
GET   /api/briefing-settings
PATCH /api/briefing-settings

GET  /api/briefs
GET  /api/briefs/:id
POST /api/briefs/runs
POST /api/briefs/:id/export
GET  /api/briefings/status
```

## 28.9 Personalisation export/import

```text
POST /api/personalisation/export
POST /api/personalisation/import/preview
POST /api/personalisation/import/apply
```

Use bounded browser file handling.

## 28.10 Backups

```text
GET  /api/backups
GET  /api/backups/:id
POST /api/backups
POST /api/backups/:id/verify
POST /api/backups/prune/preview
POST /api/backups/prune/apply
GET  /api/backups/status
```

No browser restore route.

Do not return exact backup path.

## 28.11 Operations

```text
GET  /api/operations
GET  /api/operations/events
GET  /api/operations/metrics
GET  /api/operations/storage
GET  /api/operations/retention
POST /api/operations/retention/preview
POST /api/operations/retention/apply
POST /api/operations/database/check
POST /api/operations/database/optimize
POST /api/operations/diagnostics
GET  /api/operations/security
```

## 28.12 Response safety

Never return:

- Secrets
- Cookies/CSRF token outside session bootstrap
- Exact local paths
- Raw logs
- Raw SQL
- Full backup manifest paths
- Backup passphrase
- Database/raw snapshot
- Creator document text
- Restricted platform text
- Personalisation export payload in logs
- Hidden AI reasoning

---

# 29. UI requirements

## 29.1 Personalised Today

Add Live sections:

```text
Urgent alerts
Since your last visit
Latest daily brief
Watchlist changes
Continue reading
New saved-search matches
Source coverage
```

Preserve existing research/safety/creator cards where useful.

Every item supports relevant:

- Watch
- Mark read/unread
- Dismiss
- Mute
- Open source
- Why included

## 29.2 Watchlists

Add a first-class page:

- Named lists
- Create/rename/archive
- Add/remove/bulk
- Filter by target type
- Unavailable/redirected state
- Recent changes
- Alert/brief settings
- Stable source links

## 29.3 Saved searches

Add:

- Structured filter builder
- Search preview
- Save/update
- Manual run
- Match history
- New-match count
- Alert toggle
- Brief toggle
- `needs_update` state

Do not expose SQL.

## 29.4 Alert Centre

Show:

- Priority groups
- State filters
- Source/event filters
- Watchlist/search reason
- Source/detection dates
- Read/ack/snooze/dismiss
- Batch actions
- Operational alerts separated
- No personal clinical-risk wording

## 29.5 Briefings

Add:

- Daily/weekly tabs
- Current and history
- Section navigation
- Read state
- Why included
- Source coverage
- Overflow links
- Markdown/JSON export
- Stale/retracted/redacted states
- Manual generate
- Schedule/settings

## 29.6 Since last visit

Show exact cutoff and visit basis.

Support:

- All
- Alerts
- Research
- Trials
- Interventions
- Safety/regulation
- Creators
- Operations

## 29.7 Reading controls

Add consistent controls to:

- Lists
- Detail pages
- Alerts
- Briefs
- Search results
- Creator claims
- Intervention dossiers

## 29.8 Legacy migration

Provide a clear first-run migration panel with:

- Detected keys/counts
- Preview
- Unresolved IDs
- Import/skip/export
- Idempotent completion

## 29.9 Backup & Storage

Add Settings/Operations section:

- Last successful recovery backup
- Next scheduled backup
- Create recovery/core/full backup
- Encryption choice for portable backup
- Verify
- Prune preview
- Storage categories
- Retention preview
- Restore CLI instructions
- No exact path

Passphrases must not be retained in browser state after completion.

## 29.10 Operations

Add:

- Overall health
- App/runtime/schema
- Worker/scheduler
- Sources
- Jobs
- Briefs/alerts
- Backups
- Storage/retention
- Database
- Platform compliance
- Security gate status
- Recent redacted events
- Diagnostic bundle

## 29.11 Browser notifications

Settings:

- Disabled by default
- Explain while-page-open limitation
- Request permission through user gesture
- Test notification without source text
- Revoke in app preference
- Explain browser-level revocation

## 29.12 Settings

Organize:

```text
General
Personalisation
Briefings
Alerts
Sources
Creator platforms
Backup & Storage
Operations
Privacy & Security
About
```

## 29.13 Demo mode

- Preserve all Demo pages.
- Demo personalisation remains separately namespaced.
- Live alerts/briefs/backups do not include Demo records.
- Do not create Live SQLite rows from Demo activity.
- Existing Demo E2E remains green.

## 29.14 Accessibility

All new pages and controls meet Section 21 requirements.

---

# 30. Commands

Add Windows-safe root commands:

```text
pnpm start

pnpm personalisation:migrate
pnpm personalisation:export
pnpm personalisation:import
pnpm personalisation:eval
pnpm personalisation:doctor

pnpm alerts:eval
pnpm alerts:doctor
pnpm briefs:generate
pnpm briefs:eval
pnpm briefs:doctor

pnpm backup:create
pnpm backup:list
pnpm backup:verify
pnpm backup:restore
pnpm backup:prune
pnpm backup:doctor

pnpm retention:preview
pnpm retention:apply
pnpm operations:doctor
pnpm diagnostics:create

pnpm accessibility:audit
pnpm performance:check

pnpm security:audit
pnpm security:signatures
pnpm security:secrets
pnpm security:sbom
pnpm security:headers
pnpm security:check

pnpm ci:quality
```

Existing commands remain functional.

Restore and destructive cleanup require explicit flags/confirmation.

---

# 31. Environment configuration

Update `.env.example` without secrets.

```text
# Runtime
HEALTHSPAN_HOST=127.0.0.1
HEALTHSPAN_PORT=8787
HEALTHSPAN_TIME_ZONE=Australia/Brisbane
HEALTHSPAN_WEB_DIST_DIR=

# Remote binding — unsupported by default
HEALTHSPAN_ALLOW_REMOTE_BIND=false
HEALTHSPAN_REMOTE_ACCESS_TOKEN=
HEALTHSPAN_ALLOWED_HOSTS=127.0.0.1,localhost,[::1]
HEALTHSPAN_ALLOWED_ORIGINS=http://127.0.0.1:8787,http://localhost:8787

# Browser request-integrity session
HEALTHSPAN_LOCAL_SESSION_TTL_MINUTES=720
HEALTHSPAN_CSRF_ENABLED=true

# Rate/body limits
HEALTHSPAN_RATE_LIMIT_READS_PER_MINUTE=600
HEALTHSPAN_RATE_LIMIT_HEAVY_PER_MINUTE=60
HEALTHSPAN_RATE_LIMIT_MUTATIONS_PER_MINUTE=120
HEALTHSPAN_RATE_LIMIT_UPLOADS_PER_HOUR=20
HEALTHSPAN_JSON_MAX_BYTES=1048576
HEALTHSPAN_PERSONALISATION_IMPORT_MAX_BYTES=5242880

# Personalisation
HEALTHSPAN_LOCAL_PROFILE_ID=local-owner
HEALTHSPAN_VISIT_INACTIVITY_MINUTES=30
HEALTHSPAN_MAX_WATCHLISTS=50
HEALTHSPAN_SAVED_SEARCH_MAX_MATCHES_PER_RUN=1000

# Alerts / briefings
HEALTHSPAN_ALERTS_ENABLED=true
HEALTHSPAN_DAILY_BRIEF_ENABLED=true
HEALTHSPAN_DAILY_BRIEF_CRON=15 7 * * *
HEALTHSPAN_WEEKLY_REVIEW_ENABLED=true
HEALTHSPAN_WEEKLY_REVIEW_CRON=0 9 * * 0
HEALTHSPAN_DAILY_BRIEF_MAX_ITEMS=25
HEALTHSPAN_WEEKLY_REVIEW_MAX_ITEMS=60
HEALTHSPAN_BRIEF_AI_ENABLED=false

# Backups
HEALTHSPAN_BACKUPS_ENABLED=true
HEALTHSPAN_RECOVERY_BACKUP_CRON=30 2 * * *
HEALTHSPAN_RECOVERY_BACKUP_RETENTION_DAYS=7
HEALTHSPAN_BACKUP_INCLUDE_USER_DOCUMENTS=true
HEALTHSPAN_PORTABLE_BACKUP_ENCRYPTED_DEFAULT=true
HEALTHSPAN_BACKUP_MAX_ARCHIVE_BYTES=
HEALTHSPAN_BACKUP_KDF_PROFILE=default-v1

# Logs / metrics / retention
HEALTHSPAN_LOG_LEVEL=info
HEALTHSPAN_LOG_RETENTION_DAYS=14
HEALTHSPAN_LOG_MAX_TOTAL_BYTES=268435456
HEALTHSPAN_METRIC_DETAIL_RETENTION_DAYS=90
HEALTHSPAN_METRIC_AGGREGATE_RETENTION_DAYS=365
HEALTHSPAN_VISIT_RETENTION_DAYS=180
HEALTHSPAN_DAILY_BRIEF_RETENTION_DAYS=180
HEALTHSPAN_WEEKLY_REVIEW_RETENTION_DAYS=730
HEALTHSPAN_RESOLVED_ALERT_RETENTION_DAYS=365

# Optional browser notifications
HEALTHSPAN_BROWSER_NOTIFICATIONS_ENABLED=false

# Existing optional AI remains off
HEALTHSPAN_AI_ENABLED=false
OPENAI_API_KEY=
```

Rules:

- Validate all values.
- Reject unsafe relative paths where not explicitly allowed.
- Reject remote bind without token.
- Never print secrets.
- Missing optional provider keys while disabled is healthy.
- No M7/Sites/D1/R2 variables.

---

# 32. Evaluation corpora

## 32.1 Watchlist and saved-search corpus

Create at least **80** deterministic cases covering:

- Every watchable type
- Redirected/unavailable target
- Duplicate add
- Multiple lists
- Import
- Dynamic match
- Query schema migration
- Invalid filter
- Date boundary
- Retraction filter
- Live/Demo separation
- Exact stable hash
- Incremental evaluation
- Capped/partial evaluation
- Mute interaction

## 32.2 Reading/visit corpus

Create at least **48** cases covering:

- First visit
- Previous visit
- Multiple tabs
- Coalescing
- Inactivity
- Clean close
- Unclean close
- Unread/opened/read
- Dismiss/restore
- Bulk action
- Mute expiry
- Since-last-visit boundaries
- Baseline exclusion

## 32.3 Alert corpus

Create at least **80** cases covering:

- Every alert family
- Priority mapping
- Direct watch match
- Saved-search match
- Duplicate event
- Material update
- Snooze
- Dismiss
- Resolve
- Mute
- Source unavailable
- Operational separation
- Browser notification eligibility
- No clinical-risk wording

## 32.4 Briefing corpus

Create at least **80** cases covering:

- Daily window
- Weekly window
- First run
- Catch-up
- Empty brief
- Partial source coverage
- Section caps
- Overflow
- Deduplication
- Grouping
- Source dates
- Retraction/correction
- Platform redaction
- Continue reading
- Muted/dismissed state
- Deterministic idempotency
- No recommendation/ranking

## 32.5 Export/import corpus

Create at least **40** cases covering:

- Valid export/import
- Merge
- Replace personalisation
- Duplicate entries
- Unresolved targets
- Older schema
- Newer unsupported schema
- Tampered file
- Oversized file
- Demo/Live mismatch
- Restricted platform text exclusion
- No secret/path

## 32.6 Backup/restore corpus

Create at least **56** cases covering:

- Recovery/core/full
- Consistent live DB snapshot
- Manifest/hash
- Encrypted backup
- Wrong passphrase
- Tampered ciphertext
- Unencrypted explicit mode
- Path traversal
- Archive bomb caps
- Missing file
- Corrupt DB
- Foreign-key failure
- Schema migration
- Platform scrub
- X text exclusion
- User-document inclusion/deletion
- Interrupted create
- Interrupted restore
- Atomic swap
- Rollback
- Idempotent verify
- Prune protection
- Missing raw-store coverage

## 32.7 Security corpus

Create at least **48** adversarial cases covering:

- Cross-site mutation
- Missing/invalid CSRF
- Unexpected Host
- Disallowed Origin
- `null` Origin
- DNS-rebinding style Host
- Remote bind without token
- Rate limit
- Oversized JSON
- Malicious filename
- XSS payload
- `javascript:` URL
- SQL-like saved-search input
- Path traversal
- Secret redaction
- Backup passphrase redaction
- Log source-text redaction
- Diagnostic privacy
- CSP/header checks

## 32.8 Accessibility states

Cover at least **24** critical page/workflow states with automated checks and a documented manual matrix.

## 32.9 Deterministic gates

Required:

- 100% schema-valid personalisation data
- 100% Live/Demo separation
- 100% saved-search queries compile through validated services
- 0 raw SQL supplied by browser
- 100% alert deduplication on identical input
- 100% baseline exclusion from since-last-visit/briefs
- 100% deterministic brief idempotency
- 0 brief intervention rankings/recommendations
- 0 personal clinical-risk wording
- 100% personalisation export excludes secrets/platform text
- 100% encrypted backup tamper detection
- 100% restore rollback on failed final verification
- 100% X text exclusion from portable backup
- 100% local path/secret redaction in browser diagnostics
- 100% mutation CSRF/Origin/Host protection
- 0 serious/critical automated accessibility violations on covered pages
- 100% platform-policy doctors remain green
- 0 M7 code/configuration

---

# 33. Testing requirements

All default tests are deterministic and network-independent.

## 33.1 Migration tests

- M5 database to M6
- Earlier database through all migrations
- Existing M1–M5 data preserved
- Repeated migration
- Pre-migration checkpoint
- Failed migration recovery
- Foreign-key integrity
- No Demo/Live contamination

## 33.2 Runtime tests

- Production static serving
- SPA fallback
- API 404 remains JSON
- Missing build error
- Asset cache headers
- Source-map policy
- Loopback bind
- Non-loopback refusal/token path
- Clean shutdown

## 33.3 Personalisation tests

Cover all Section 32.1/32.2 cases.

## 33.4 Alert/brief tests

Cover all Section 32.3/32.4 cases.

## 33.5 Backup/restore tests

Use temporary directories and databases.

No test touches the real user data directory.

Cover all Section 32.6 cases.

## 33.6 Security tests

Cover all Section 32.7 cases.

Include browser/API integration tests for cookie + CSRF + Origin.

## 33.7 Operations/retention tests

- Log rotation
- Metrics aggregation
- Storage measurement
- Retention preview
- Protected records
- Cleanup apply
- Temp cleanup
- WAL maintenance
- Integrity failure
- Diagnostic bundle exclusions
- Unclean shutdown recovery

## 33.8 Accessibility tests

- Automated page scans
- Keyboard flows
- Focus
- Dialogs
- Upload
- Charts/table fallback
- Reduced motion
- Mobile
- Zoom/reflow manual evidence

## 33.9 Performance tests

- Generated scale
- Query plans
- API p95
- Initial bundle budgets
- Backup streaming
- Saved-search incremental evaluation
- Alert generation throughput
- Brief generation throughput

Performance tests may be a separate deterministic command and need not run on every unit-test invocation if CI runs them in a dedicated job.

## 33.10 M1–M5 regression

Every existing:

- Ingestion
- Intelligence
- Intervention/peptide
- Regulatory/safety
- Creator/platform
- Demo
- Doctor
- Evaluation

gate remains green.

---

# 34. Doctor requirements

## 34.1 `personalisation:doctor`

Check:

- More than one active Live profile
- Orphan watchlist entry
- Invalid watchable target
- Demo/Live contamination
- Duplicate active saved search
- Invalid query schema
- Stale redirect
- Reading state without target
- Invalid visit range
- Legacy migration inconsistency

## 34.2 `alerts:doctor`

Check:

- Alert without source event/rule
- Duplicate active dedupe key
- Invalid priority
- Resolved alert still delivered
- Muted alert surfaced incorrectly
- Baseline alert
- Personal clinical-risk wording
- Browser delivery without permission eligibility

## 34.3 `briefs:doctor`

Check:

- Duplicate immutable brief identity
- Brief item without dependency
- Baseline item
- Missing why-included
- Platform-restricted text
- Retraction not warned
- Ranking/recommendation wording
- Window overlap/gap inconsistency
- Stale/redacted dependency not marked

## 34.4 `backup:doctor`

Check:

- Backup without manifest/hash
- Backup marked success without integrity result
- Missing archive
- Temp orphan
- Restricted platform text in portable backup
- Secret/path leakage
- Expired unprotected backups
- Restore record without rollback state
- Unsupported format
- Newest recovery backup missing

## 34.5 `operations:doctor`

Check:

- Log retention violation
- Metrics unbounded
- Temp files
- Scheduler lag
- Stale job lease
- Storage category mismatch
- Diagnostic bundle privacy
- Unclean startup unresolved
- DB maintenance overdue
- Browser/API version mismatch

## 34.6 Existing doctors

All prior doctors remain required.

---

# 35. Quality gates

At completion all Section 5.7 entry-gate commands must still pass, together with:

```text
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
pnpm backup:doctor
pnpm operations:doctor

pnpm accessibility:audit
pnpm performance:check
pnpm security:check
```

CI must pass on Windows and Ubuntu for the designated jobs.

Report exact test counts, skips, Node version, pnpm version, and environment.

---

# 36. Documentation and ADR requirements

Create/update:

```text
README.md
AGENTS.md
ROADMAP.md
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/SOURCE_POLICY.md
docs/PRIVACY_BOUNDARIES.md
docs/DESIGN_SYSTEM.md
docs/DECISIONS.md
docs/milestones/M5.md
docs/milestones/BRIEF_GAP_MATRIX.md
docs/milestones/M4_OFFICIAL_BRIEF_CLOSURE_REPORT.md
docs/milestones/M3_OFFICIAL_BRIEF_CLOSURE_REPORT.md
docs/milestones/M2_OFFICIAL_BRIEF_CLOSURE_REPORT.md
docs/milestones/M6.md
docs/milestones/M6_EXECUTION_BRIEF.md
docs/milestones/M6_COMPLETION_REPORT.md
```

Add:

```text
docs/personalisation/LOCAL_PROFILE.md
docs/personalisation/WATCHLISTS_AND_SEARCHES.md
docs/personalisation/ALERTS.md
docs/personalisation/BRIEFINGS.md
docs/personalisation/READING_AND_VISITS.md
docs/operations/BACKUP_AND_RESTORE.md
docs/operations/RETENTION.md
docs/operations/OBSERVABILITY.md
docs/operations/DIAGNOSTICS.md
docs/security/THREAT_MODEL.md
docs/security/SECURITY_BASELINE.md
docs/accessibility/WCAG_2_2_AA_CHECKLIST.md
docs/performance/PERFORMANCE_BUDGETS.md
```

Add ADRs using the next available numbers for:

1. Single local profile without authentication
2. SQLite Live personalisation and localStorage cosmetic preferences
3. Structured saved searches rather than executable queries
4. Deterministic in-app alerts and briefing selection
5. Brief snapshots with source/dependency provenance
6. Platform-aware portable backup scrubbing
7. SQLite Online Backup API and conservative restore
8. Production-local single-origin serving
9. Local request-integrity session, CSRF, Host, and Origin controls
10. Local-only observability with no telemetry
11. Node 24 LTS and pinned pnpm 11 baseline
12. WCAG 2.2 AA target
13. Retention preview before destructive cleanup
14. No external notification delivery in M6

Documentation must state:

- M2–M5 official-brief closure status and links to the gap matrix/closure reports
- M1–M5 complete only after the Section 5 entry gate passes
- M6 current
- M7 not started
- Exact base commit
- No auth/multi-user
- No personal health data
- No email/push/webhook
- How personalisation migration works
- How briefs/alerts are selected
- Alert priority is not clinical severity
- Backup contents/exclusions
- Restore CLI and rollback
- Platform text exclusions
- Security boundaries
- Runtime versions
- Accessibility target and limitations
- Performance test basis
- Known limitations

Save this brief into:

```text
docs/milestones/M6_EXECUTION_BRIEF.md
```

Do not silently remove controlling requirements.

---

# 37. Official technical references

Verify current versions before implementation and record check dates.

Node.js releases:

```text
https://nodejs.org/en/about/previous-releases
```

pnpm installation/audit:

```text
https://pnpm.io/installation
https://pnpm.io/cli/audit
```

WCAG 2.2:

```text
https://www.w3.org/TR/WCAG22/
```

OWASP:

```text
https://owasp.org/www-project-application-security-verification-standard/
https://owasp.org/www-project-top-ten/
https://owasp.org/www-project-web-security-testing-guide/
```

SQLite Online Backup API:

```text
https://www.sqlite.org/backup.html
```

If current official documentation materially conflicts with this brief, document the conflict and consult the project manager before weakening a security, accessibility, backup, or privacy requirement.

---

# 38. What must NOT be done in Milestone 6

Do not implement:

- Milestone 7
- ChatGPT Sites
- `.openai/hosting.json`
- D1
- R2
- Wrangler
- Cloudflare runtime packages
- Hosted scheduler
- Public deployment
- Custom domain
- Production cloud secrets
- Authentication
- User registration
- Passwords
- OAuth
- Multi-user support
- Sharing/collaboration
- Cross-device sync
- Cloud backup
- Email
- SMS
- Webhooks
- Slack/Discord/Telegram notifications
- Service-worker push
- Native desktop wrapper
- Native mobile app
- Auto-update service
- Personal supplement tracking
- Medication tracking
- Labs
- Symptoms
- Sleep
- Wearables
- Exercise/pickleball logs
- Personal-health correlations
- Personal medical notes
- Treatment recommendations
- Dosing, cycling, stacking, reconstitution, injection, sourcing, vendors, prices, or promo codes
- New scientific/regulatory/social source connectors beyond the official M2–M5 closure work expressly required by Section 5
- New social platforms
- Podcast ingestion
- Broad web crawling
- Creator score/ranking
- Intervention ranking
- Composite relevance/evidence/safety/longevity score
- External telemetry or crash reporting
- Individual X text export
- Platform-restricted content in backup
- Full transcript export
- Formal medical alerting
- Any Milestone 7+ implementation

---

# 39. Acceptance criteria checklist

Milestone 6 is complete only when every applicable item is checked and evidenced in the completion report.

## A. Base, branch, and official-brief entry gate

- [ ] A1. Work begins from exact commit `575489cf913812291f75266975e77c8953058968`.
- [ ] A2. Work is on `milestone-6/personalisation-production-hardening`.
- [ ] A3. M5 official Section 34 closure and historical report remain intact.
- [ ] A4. No M6 feature work begins before the Section 5 entry gate.
- [ ] A5. `M4_OFFICIAL_BRIEF_CLOSURE_REPORT.md` contains the complete official checklist and evidence.
- [ ] A6. M4 Regulatory & Safety APIs/workspace and required schema semantics are complete.
- [ ] A7. M4 connectors have fixture-tested production operational depth.
- [ ] A8. M4 evaluation-corpus minima and distinct doctors/evaluations pass.
- [ ] A9. `M3_OFFICIAL_BRIEF_CLOSURE_REPORT.md` contains the complete official checklist and evidence.
- [ ] A10. M3 Live V2 evidence dimensions replace simplified Live maturity semantics.
- [ ] A11. M3 provenance/schema/API/UI/methodology depth is complete.
- [ ] A12. M3 provider-neutral optional OpenAI Responses adapter is implemented and disabled by default.
- [ ] A13. `M2_OFFICIAL_BRIEF_CLOSURE_REPORT.md` contains the complete official checklist and evidence.
- [ ] A14. Offline `ingest:reprocess` works for every M2 source without network.
- [ ] A15. PubMed and ClinicalTrials.gov pagination/checkpoint depth is complete.
- [ ] A16. Crossref DOI enrichment is automatically wired to full/scheduled ingestion.
- [ ] A17. `BRIEF_GAP_MATRIX.md` records M2–M5 as closed with no unapproved residual state.
- [ ] A18. Original M2–M4 completion reports are not rewritten.
- [ ] A19. The entry gate has a distinct committed hash recorded in the M6 report.
- [ ] A20. Every entry-gate quality command in Section 5.7 passes.
- [ ] A21. Live/Demo and all prior scientific, regulatory, safety, creator, privacy, and platform-policy boundaries remain intact.
- [ ] A22. No Milestone 7 work is present.

## B. Runtime and production-local serving

- [ ] B1. Node.js 24 LTS is the documented/supported runtime.
- [ ] B2. Node 20 is no longer accepted as the production baseline.
- [ ] B3. pnpm is upgraded to a pinned stable 11.x version.
- [ ] B4. Clean Windows install works.
- [ ] B5. `better-sqlite3` works on Node 24.
- [ ] B6. `pnpm build && pnpm start` serves web and API on one origin.
- [ ] B7. Production binds to loopback by default.
- [ ] B8. Static assets, caching, MIME, and SPA fallback are correct.
- [ ] B9. `/api` errors never fall through to HTML.
- [ ] B10. Production source-map policy is enforced.
- [ ] B11. `/api/version` is safe and accurate.
- [ ] B12. External sync does not block startup.

## C. Local profile and migration

- [ ] C1. Exactly one active Live local profile exists.
- [ ] C2. No identity/PII/medical fields are added.
- [ ] C3. Meaningful Live personalisation persists in SQLite.
- [ ] C4. Cosmetic browser state remains separately local.
- [ ] C5. Legacy Live localStorage detection works.
- [ ] C6. Migration preview works.
- [ ] C7. Migration is idempotent.
- [ ] C8. Unresolved IDs are reported.
- [ ] C9. Demo IDs are never imported into Live.
- [ ] C10. Legacy data is not silently deleted.
- [ ] C11. Personalisation export is available before cleanup.
- [ ] C12. `personalisation:doctor` passes.

## D. Watchlists and saved searches

- [ ] D1. Named watchlists work.
- [ ] D2. Default Following list exists.
- [ ] D3. All fixed watchable types are supported.
- [ ] D4. Watchable registry maintains valid target references.
- [ ] D5. Redirected/unavailable targets are represented honestly.
- [ ] D6. Duplicate active membership is prevented.
- [ ] D7. Bulk watchlist actions work.
- [ ] D8. Saved searches use a versioned structured schema.
- [ ] D9. Browser-supplied SQL/regex execution is impossible.
- [ ] D10. Saved-search hashing is deterministic.
- [ ] D11. Server-side bounded execution works.
- [ ] D12. Incremental evaluation works.
- [ ] D13. Capped/partial state is visible.
- [ ] D14. Dynamic matches remain distinct from static membership.
- [ ] D15. Query-schema upgrade/needs-update state works.
- [ ] D16. All principal queries have suitable indexes/query-plan checks.

## E. Reading, dismissal, mute, and visits

- [ ] E1. Unread/opened/read states work independently.
- [ ] E2. Dismiss/restore works without deleting source data.
- [ ] E3. Archive state works.
- [ ] E4. Mute by object/topic/source/event type works.
- [ ] E5. Timed mute expires correctly.
- [ ] E6. Official detail warnings remain visible despite personal mute.
- [ ] E7. Bulk state actions are audited.
- [ ] E8. Visit start/heartbeat/close works.
- [ ] E9. Multiple tabs coalesce correctly.
- [ ] E10. Previous-visit cutoff is stable during current visit.
- [ ] E11. First-visit state is honest.
- [ ] E12. No full clickstream is stored.
- [ ] E13. Since-last-visit excludes baselines/unchanged refreshes.
- [ ] E14. Since-last-visit filters and pagination work.

## F. Alert Centre

- [ ] F1. Alert rules support watchlist/object/search/topic/source/event targeting.
- [ ] F2. Every fixed alert family is represented.
- [ ] F3. Dashboard-priority mapping is deterministic.
- [ ] F4. Alert priority is not described as personal clinical risk.
- [ ] F5. Alert deduplication is exact/idempotent.
- [ ] F6. Material source updates preserve history.
- [ ] F7. Alert read/ack/snooze/dismiss/resolve states work.
- [ ] F8. Alert state events are append-only.
- [ ] F9. Mute interaction works.
- [ ] F10. Operational alerts are visually separate.
- [ ] F11. Every alert has why-included/source/dates.
- [ ] F12. Browser notifications are opt-in and while-page-open only.
- [ ] F13. No external delivery exists.
- [ ] F14. `alerts:eval` passes.
- [ ] F15. `alerts:doctor` passes.

## G. Daily and weekly briefings

- [ ] G1. Daily briefing schedule uses Australia/Brisbane.
- [ ] G2. Weekly review schedule uses Australia/Brisbane.
- [ ] G3. Startup catch-up creates at most one missed brief of each type.
- [ ] G4. Window semantics are correct.
- [ ] G5. All default sections exist.
- [ ] G6. Deterministic grouping/order is documented.
- [ ] G7. Caps and overflow are visible.
- [ ] G8. Duplicate source events do not repeat.
- [ ] G9. Incompatible evidence is not merged.
- [ ] G10. Every item includes why/source/dates.
- [ ] G11. Empty briefs are honest.
- [ ] G12. Partial source coverage is explicit.
- [ ] G13. Brief snapshots are immutable/idempotent.
- [ ] G14. Retractions/corrections remain visible.
- [ ] G15. Platform purges redact dependent brief text.
- [ ] G16. Continue Reading uses personal reading state.
- [ ] G17. Markdown export works.
- [ ] G18. Versioned JSON export works.
- [ ] G19. No ranking, recommendation, dosing, or sourcing appears.
- [ ] G20. Optional AI is disabled by default and never selects items.
- [ ] G21. Optional AI receives no X/platform/personalisation data.
- [ ] G22. `briefs:eval` passes.
- [ ] G23. `briefs:doctor` passes.

## H. Personalisation export/import

- [ ] H1. Versioned portable export works.
- [ ] H2. Export contains only approved personalisation classes.
- [ ] H3. Secrets/paths/source DB/platform text are excluded.
- [ ] H4. Merge import works.
- [ ] H5. Replace-personalisation import works without replacing source data.
- [ ] H6. Preview works.
- [ ] H7. Unresolved targets are reported.
- [ ] H8. Duplicate entries are handled deterministically.
- [ ] H9. Invalid/tampered/unsupported schema fails closed.
- [ ] H10. Import is transactional and audited.
- [ ] H11. Live/Demo mismatch is blocked.

## I. Backup and restore

- [ ] I1. Recovery/core/full backup tiers exist.
- [ ] I2. SQLite online backup/equivalent creates a consistent snapshot.
- [ ] I3. Plain live WAL file copy is not used.
- [ ] I4. Backup sanitizer is versioned.
- [ ] I5. Secrets/sessions/leases/paths are excluded.
- [ ] I6. X and restricted platform text are excluded.
- [ ] I7. Platform-dependent records are marked for re-sync.
- [ ] I8. Portable full includes only permitted official raw snapshots.
- [ ] I9. User-owned documents follow configured inclusion.
- [ ] I10. Manifest and per-file hashes are implemented.
- [ ] I11. Archive creation is streaming and atomic.
- [ ] I12. Path traversal and archive-bomb limits work.
- [ ] I13. Portable encryption defaults on.
- [ ] I14. AES-256-GCM authenticated encryption works.
- [ ] I15. Versioned scrypt KDF works.
- [ ] I16. Passphrases are never stored/logged.
- [ ] I17. Wrong passphrase/tamper fails safely.
- [ ] I18. Explicit unencrypted mode warns.
- [ ] I19. Daily recovery schedule/catch-up works.
- [ ] I20. Pre-migration checkpoint works.
- [ ] I21. Pre-restore checkpoint is mandatory.
- [ ] I22. Verification levels work.
- [ ] I23. Restore is CLI-only.
- [ ] I24. Restore preflight validates archive/DB/schema/policy.
- [ ] I25. Restore uses temporary target and atomic/rollback-capable swap.
- [ ] I26. Failed final verification restores prior data.
- [ ] I27. Restore queues required resync.
- [ ] I28. Backup pruning protects required backups.
- [ ] I29. No browser API exposes exact backup path.
- [ ] I30. `backup:doctor` passes.

## J. Operations, observability, retention, and recovery

- [ ] J1. Structured local logs are implemented.
- [ ] J2. Log redaction excludes all prohibited data.
- [ ] J3. Log rotation/retention/size caps work.
- [ ] J4. Correlation IDs propagate.
- [ ] J5. Local operational metrics are bounded.
- [ ] J6. No external telemetry exists.
- [ ] J7. Operations workspace shows fixed health categories.
- [ ] J8. Diagnostic bundle is local and redacted.
- [ ] J9. Diagnostic bundle contains no DB/raw/docs/personalisation/platform text.
- [ ] J10. Startup/shutdown marker works.
- [ ] J11. Stale job/temp recovery works.
- [ ] J12. SQLite optimize/checkpoint/integrity workflows work.
- [ ] J13. Storage inventory is accurate.
- [ ] J14. Browser APIs do not expose exact paths.
- [ ] J15. Retention policies are persisted/versioned.
- [ ] J16. Retention preview is required.
- [ ] J17. Protected data is not auto-deleted.
- [ ] J18. Cleanup report is accurate.
- [ ] J19. Platform retention remains authoritative.
- [ ] J20. `operations:doctor` passes.

## K. HTTP/security hardening

- [ ] K1. Ephemeral local request-integrity session works.
- [ ] K2. HttpOnly/SameSite cookie policy is correct.
- [ ] K3. CSRF token is required for browser mutations.
- [ ] K4. Host allowlist prevents unexpected hosts.
- [ ] K5. Origin/CORS policy denies unauthorized origins.
- [ ] K6. Fetch Metadata is enforced where available.
- [ ] K7. DNS-rebinding-style requests fail.
- [ ] K8. Remote bind requires explicit opt-in and strong token.
- [ ] K9. Deprecated remote-admin flag alone is insufficient.
- [ ] K10. Rate limits work.
- [ ] K11. Body/file limits work.
- [ ] K12. Security headers pass tests.
- [ ] K13. Untrusted HTML/URLs are rendered safely.
- [ ] K14. Saved-search injection tests pass.
- [ ] K15. Backup/import path traversal tests pass.
- [ ] K16. Error responses contain request IDs but no sensitive detail.
- [ ] K17. Threat model is complete.
- [ ] K18. `security:check` passes.

## L. Accessibility and performance

- [ ] L1. WCAG 2.2 AA is the documented target.
- [ ] L2. Automated critical-page scans have no serious/critical violations.
- [ ] L3. Manual critical-flow checklist is completed.
- [ ] L4. Keyboard-only navigation works.
- [ ] L5. Focus is visible and not obscured.
- [ ] L6. Dialog focus management works.
- [ ] L7. Charts have text/table alternatives.
- [ ] L8. Status updates are announced.
- [ ] L9. Reduced motion works.
- [ ] L10. 200% zoom and applicable 400% reflow are usable.
- [ ] L11. Colour is not the sole status signal.
- [ ] L12. Touch targets/contrast meet documented checks.
- [ ] L13. Desktop/mobile accessibility tests pass.
- [ ] L14. Generated-scale performance tests run.
- [ ] L15. Principal API p95 targets pass or have documented justified deviations.
- [ ] L16. Production startup target passes or has documented justified deviation.
- [ ] L17. Web bundle budgets pass.
- [ ] L18. No unbounded browser/route queries remain.
- [ ] L19. `accessibility:audit` passes.
- [ ] L20. `performance:check` passes.

## M. Supply chain, CI, and final quality

- [ ] M1. GitHub Actions quality runs on Ubuntu.
- [ ] M2. GitHub Actions quality runs on Windows.
- [ ] M3. E2E runs on Ubuntu Chromium.
- [ ] M4. Actions use least permissions and pinned SHAs.
- [ ] M5. Frozen-lockfile clean install passes.
- [ ] M6. High/critical production dependency audit passes or has unexpired reviewed exception.
- [ ] M7. Registry-signature audit runs where supported.
- [ ] M8. Production SBOM is generated.
- [ ] M9. License inventory is generated/reviewed.
- [ ] M10. Secret scan passes.
- [ ] M11. No floating Git dependency or unexpected install-script risk remains.
- [ ] M12. `pnpm format:check` passes.
- [ ] M13. `pnpm lint` passes with zero warnings.
- [ ] M14. `pnpm typecheck` passes.
- [ ] M15. `pnpm test` passes.
- [ ] M16. `pnpm test:e2e` passes with documented skips only.
- [ ] M17. `pnpm build` passes.
- [ ] M18. Every prior domain doctor/evaluation passes.
- [ ] M19. Every new M6 doctor/evaluation passes.
- [ ] M20. Documentation/ADRs match implementation.
- [ ] M21. M6 screenshots and completion report are committed.
- [ ] M22. Working branch is pushed and exact final hash reported.
- [ ] M23. No Milestone 7 work has begun.

---

# 40. Required completion report

Create and commit:

```text
docs/milestones/M6_COMPLETION_REPORT.md
```

It must contain:

1. Executive summary
2. Exact base commit, branch, entry-gate commit, feature-complete commit, and final HEAD
3. One-row-per-acceptance-criterion checklist
4. M6 entry-gate decision and sequencing
5. M4 official-brief closure result and report path
6. M3 official-brief closure result and report path
7. M2 official-brief closure result and report path
8. Final `BRIEF_GAP_MATRIX.md` status
9. Exact entry-gate quality commands, counts, and results
10. Any project-manager-approved rescope
11. Significant file-tree changes
12. Migration files and schema summary
13. Runtime upgrade details
14. Exact Node and pnpm versions
15. Production-local serving design
16. Local-profile and migration design
17. Watchlist and saved-search model
18. Reading, visit, and since-last-visit design
19. Alert model, priority, and deduplication
20. Daily/weekly briefing rules and schedules
21. Optional AI briefing boundary
22. Personalisation export/import behavior
23. Backup tiers and contents/exclusions
24. Encryption and KDF format
25. Backup verification results
26. Restore dry-run and rollback results
27. Platform-policy scrub tests
28. Retention and storage design
29. Logging, metrics, and diagnostic design
30. Request-integrity, CSRF, Host, CORS, and rate-limit design
31. Threat-model summary
32. Dependency audit, signature, SBOM, and license results
33. Accessibility automated results
34. Accessibility manual-checklist summary
35. Performance dataset, hardware, and measurements
36. CI job matrix and results
37. Exact commands run and results
38. Format result
39. Lint result
40. Type-check result
41. Unit/integration test counts
42. E2E projects, passes, skips, and failures
43. Production build result
44. Every evaluation and doctor result
45. Backup/restore test counts
46. Security test counts
47. Screenshots:
    - M4 Regulatory & Safety closure surface
    - M3 Live V2 evidence/claims closure surface
    - M2 source/reprocess closure surface
    - Production-local home
    - Legacy preference migration
    - Personalised Today
    - Since last visit
    - Watchlists
    - Saved-search builder/history
    - Alert Centre
    - Alert detail with why included
    - Daily brief
    - Weekly review
    - Brief source coverage
    - Backup & Storage
    - Backup verification
    - Retention preview
    - Operations overview
    - Security/privacy settings
    - Accessibility chart alternative
    - Demo regression
    - Mobile personalised Today
    - Mobile Alert Centre/Briefing
48. Known issues and technical debt
49. Deviations from this brief and rationale
50. Genuine decisions required before Milestone 7
51. Explicit statement that Milestone 7 has not begun

Do not claim an official-brief closure, Windows CI, accessibility, security, backup restore, performance gate, or live connector test passed unless the actual recorded evidence exists.

---

# 41. Consult the project manager early only when

- Exact base commit is unavailable or history materially differs.
- A migration would destroy or silently reinterpret M1–M5 data.
- An M2–M4 official-brief criterion remains blocked after documented attempts and would prevent the Section 5 entry gate from closing.
- Node 24 cannot support a required native dependency after reasonable upgrade work.
- A backup/restore design cannot exclude restricted platform content safely.
- Current platform policy prohibits the planned local backup/export behavior.
- A restore cannot be made atomic or rollback-capable under the supported Windows filesystem.
- A security requirement would make normal loopback use impossible.
- A paid service becomes indispensable for deterministic M6 functionality.
- WCAG 2.2 AA target conflicts with an existing indispensable component that cannot be replaced or fixed.
- A privacy/security boundary would be weakened.
- Two acceptance criteria are genuinely incompatible.
- A required capability remains technically impossible after documented attempts.
- A proposed fix would begin Milestone 7.

Do not consult for:

- Routine dependencies
- Migration organization
- Table/class/component names
- Visual layout
- Fixture wording
- Ordinary accessibility remediation
- Normal dependency upgrades
- Recoverable test failures
- Refactors
- Performance tuning
- Documentation phrasing
- Missing optional platform/AI credentials
- No changes during a brief window

---

# 42. Stop conditions

After all M6 acceptance criteria and quality gates pass:

1. Commit implementation, migrations, fixtures, evaluation corpora, docs, ADRs, screenshots, CI, and completion report.
2. Push:

```text
milestone-6/personalisation-production-hardening
```

3. Report:

```text
final HEAD
feature-complete commit if different
exact Node/pnpm versions
exact quality-gate results
completion-report path
CI results
backup/restore evidence
accessibility/security/performance evidence
known deviations
genuine decisions required before M7
```

4. Stop.

Do not:

- Merge to `main`
- Create a Milestone 7 branch
- Add Sites/D1/R2/hosting configuration
- Add authentication
- Add hosted deployment
- Add personal-health tracking
- Begin any Milestone 7+ work

Wait for the next project-manager brief.

---

# 43. AUTHORISED start message

> **AUTHORISED TO BEGIN:** Start Healthspan Dashboard Milestone 6 from exact commit `575489cf913812291f75266975e77c8953058968` and create `milestone-6/personalisation-production-hardening`. First complete the mandatory Section 5 entry gate by closing the M4, M3, and M2 official-brief residuals in that order, committing the three append-only closure reports, closing `BRIEF_GAP_MATRIX.md`, and recording a distinct gate commit. Do not begin any M6 personalisation, alert, briefing, backup, production-runtime, accessibility, security, or operations feature work until that gate passes. After the gate passes, continue automatically with the single-local-profile SQLite personalisation layer, named watchlists, structured saved searches, reading/dismissal/mute state, visit-based “Since your last visit,” deterministic in-app alerts, daily research briefs, weekly reviews, safe export/import, platform-aware backup/restore, local observability, retention, production-local single-origin serving, Node 24/pnpm 11 upgrade, request-integrity security, WCAG 2.2 AA target, CI/supply-chain checks, and performance budgets defined in this brief. Preserve every M1–M5 scientific, regulatory, safety, creator-fairness, platform-policy, privacy, Live/Demo, no-dosing, no-vendor, no-ranking, and local-first boundary. Do not add email, webhooks, cloud sync, authentication, personal-health data, Sites, D1, R2, hosted deployment, or any Milestone 7 functionality. When every acceptance criterion and quality gate passes, push the branch, commit `docs/milestones/M6_COMPLETION_REPORT.md`, report the exact gate hash, final hash, and results, and stop before Milestone 7. Do not create or begin Milestone 7.
