# Healthspan Dashboard — M6 Closure Remediation IV

**Status:** **M6 CLOSURE REJECTED — FINAL PRODUCT-COMPLETENESS REMEDIATION AUTHORISED**  
**Milestone 7 status:** **WITHHELD / NOT AUTHORISED**  
**Repository:** `Smellybum1/Healthspan-Dashboard`  
**Branch:** `milestone-6/personalisation-production-hardening`  
**Exact remediation base:** `404a1700d3106fc61d93cd57f71652c1e4823bd3`  
**Remediation III implementation-complete commit:** `6b982129e35a7dc3e01a5eb9fc666082cb8a4b20`  
**Controlling M6 brief SHA-256:** `f78eeb73b7e735c9ce24103b99de617a94951101133ce010c3401667a8355118`  
**Remediation III brief SHA-256:** `0817d6b1878a5e6a314c08d77a24376c907b64e8bb7795e1b926da2cfd3ef5c3`  
**Execution agent:** Grok in Cursor  
**Stop point:** Complete the outstanding M6 product contract, push the branch, submit exact evidence, and stop. Do not create or begin Milestone 7.

---

# 1. Controlling decision

Continue on:

```text
milestone-6/personalisation-production-hardening
```

from exact tip:

```text
404a1700d3106fc61d93cd57f71652c1e4823bd3
```

Do not create another project branch.

Do not create:

```text
milestone-7/*
.openai/hosting.json
D1 or R2 adapters
Wrangler
Sites deployment configuration
hosted authentication
hosted scheduling
public deployment
```

This remediation contains only unfulfilled M6 requirements already present in the controlling M6 brief and Remediation III. It introduces no new M6 or M7 scope.

---

# 2. Accepted work that must not regress

The following Remediation II/III work is accepted:

- Exact M6 branch and history are correct.
- Frozen-lockfile installation works on the supported Node 24 / pnpm 11 baseline.
- All five required GitHub Actions jobs are green at the current report tip.
- Final-tip E2E ran with 78 passed, 8 documented skips, and 0 failures.
- The local request-integrity session, CSRF, Host, Origin, Fetch Metadata, rate-limit, and security-header framework exists.
- SQLite Online Backup, bounded archive controls, AES-256-GCM, scrypt, exclusive restore locking, creator-document/raw restoration, durable post-restore jobs, and failure-injection hooks exist.
- Backup evaluation reports 57 cases.
- Playwright + axe scans actual M6 routes.
- Performance checks measure real application paths and report the proportional profile as `DEVIATION`.
- Required M6 routes and screenshots now exist.
- M7 has not begun.

Do not rewrite, remove, or weaken this accepted work.

---

# 3. Why M6 remains open

The remaining blockers are product-completeness and report-integrity defects.

## 3.1 Watchlists are not complete

The current Live Watchlists workflow supports:

```text
create
rename
archive
manual add by target ID
remove one item
```

It does not complete the controlling M6 workflow for:

```text
restore archived list
delete list with confirmation
bulk add/remove/state actions
target-type filtering
unavailable/redirected target handling in the UI
recent changes
per-list alert settings
per-list briefing inclusion settings
stable selection/deep-link behavior
```

The controlling brief requires CRUD and bulk management, not only heading-level route coverage.

## 3.2 Saved Searches are a text-only prototype

The current builder exposes name and free-text fields only.

It lacks the required structured, versioned filter builder and workflow for:

```text
entity types
source
evidence maturity
results availability
study design
organism
population
outcome
translation gap
regulatory/safety state
creator claim state
date range
sort
retraction/unavailable options
preview
update
delete
archive/restore
persisted evaluation history
persisted match history
new-match count
capped/partial/error state
alert toggle
brief toggle
needs_update state
```

Displaying the stored query JSON is not a usable saved-search detail/history page.

## 3.3 Alert rules and Alert Centre are incomplete

The current Alert Centre supports a small state filter and per-row state buttons.

It lacks:

```text
alert-rule CRUD
target selection
event-family selection
priority override within safe bounds
priority groups
source/event filters
watchlist/saved-search reason filters
batch actions
snooze-until behavior
mute interaction
operational/research separation
resolved/superseded history
clear structured Why included data
source links and source/detection dates
browser-notification eligibility controls
```

The current Alert Settings page explicitly says configuration comes later. M6 requires it now.

## 3.4 Briefings are incomplete

The current Briefings UI provides:

```text
daily/weekly tabs
manual generation
a flat list
browser-generated Markdown/JSON downloads
two enable/disable toggles
```

It lacks:

```text
current versus history
section navigation
default section controls
daily/weekly schedule display and editing
timezone display
item caps
source coverage detail
partial-source reasons
why-included display
read/dismiss actions
overflow links
stale/retracted/redacted state
Continue Reading
server-generated versioned exports
catch-up status
last/next run status
briefing job status
```

The required schedule and catch-up logic must be exercised through the real scheduler, not only represented by database defaults.

## 3.5 Visit sessions are not implemented to the controlling API contract

The controlling M6 brief requires:

```text
POST /api/visits/start
POST /api/visits/:id/heartbeat
POST /api/visits/:id/close
GET  /api/visits/previous
GET  /api/since-last-visit
```

The current web client calls a single `POST /api/visits`.

Complete:

- Browser-installation hash
- Tab/session ID
- Heartbeats
- Inactivity coalescing
- Clean close
- Previous completed/coalesced visit
- Stable previous-visit cutoff during the current visit
- First-visit state
- No clickstream

Use `sendBeacon` or a safe equivalent for close where appropriate.

## 3.6 Reading, dismissal, archive, and mute workflows are incomplete

The current API/UI provides only a narrow reading-state POST and mute creation.

Complete:

```text
GET reading state
PUT one reading state
bounded batch reading-state actions
mark unread/opened/read
dismiss/restore
archive/restore
list mute rules
create timed/permanent mute
edit/disable/delete mute
mute expiry
object/topic/source/event-type scopes
undo/history
```

Add consistent controls to the surfaces named in the controlling brief.

## 3.7 Personalisation import/export is incomplete

The migration page currently reads one browser key into a JSON text area.

Complete the first-use workflow:

```text
automatic detection of all known Live legacy keys
versioned validation
preview with meaningful counts
resolved/unresolved identifiers
Demo-ID exclusion
import now
skip
remind later
export legacy data
idempotent completion
migration status
no silent deletion
```

Complete portable personalisation import/export:

```text
watchlists and entries
saved searches
alert rules
briefing settings
reading/dismissal state
mute rules
stable target identifiers
merge preview/apply
replace-personalisation preview/apply
transactional rollback
unresolved-target report
schema-version handling
Live/Demo mismatch block
```

Do not include source records, platform text, secrets, paths, documents, or visit history by default.

## 3.8 Backup & Storage UI is incomplete

The current page supports create, list, verify, and a storage list.

Complete:

```text
last successful recovery backup
next scheduled recovery backup
backup tier explanation
portable encryption confirmation
verification level/result
prune preview
prune apply
protected-backup explanation
retention preview
retention apply
storage category drilldown
managed-size totals
restore CLI instructions
last restore result
no exact local path
no passphrase persistence
```

Restore remains CLI-only.

## 3.9 Operations is a raw JSON dump

Replace the raw JSON block with usable, accessible health panels for:

```text
overall health
app/runtime/schema versions
database integrity
worker
scheduler
jobs
sources
intelligence/dossiers/creators
alerts/briefs
backups
storage/retention
platform compliance
security gate status
recent redacted errors
diagnostic bundle creation
database check/optimize actions
```

Preserve the raw structured API for diagnostics, but do not make JSON the primary user interface.

## 3.10 Privacy & Security is informational rather than operational

Complete:

```text
request-integrity session status
local/remote binding status
allowed-host/origin summary
data retention summary
backup exclusions
diagnostic exclusions
browser-notification preference
permission request
test notification
preference revocation
browser-level revocation guidance
while-page-open limitation
no source text in notification
```

Persist the app notification preference in the correct Live profile preference store rather than making localStorage the authoritative Live state.

## 3.11 Today is not fully actionable

Complete the fixed personalised sections:

```text
Urgent alerts
Since your last visit
Latest daily brief
Watchlist changes
Continue reading
New saved-search matches
Source coverage
```

Every applicable row must support:

```text
watch/unwatch
mark read/unread
dismiss/restore
mute/unmute
open source
why included
```

Do not use browser-local Live preference state.

## 3.12 E2E tests are largely reachability checks

The current M6 surface E2E verifies route headings and one watchlist creation.

Add action-level desktop and mobile coverage for the complete workflows in this packet.

## 3.13 The 236-row report still contains mismatched evidence

Many checklist rows cite unrelated evidence.

Examples observed in the current report include:

- Personalisation export/import criteria citing Today visit APIs.
- Several accessibility criteria citing one grouped axe/performance sentence.
- Supply-chain criteria citing a generic all-gates sentence.
- Detailed alert/briefing criteria citing only the page route and one service function.

The final report must provide criterion-specific evidence.

One command may support several criteria, but each row must identify the exact relevant:

```text
file/function
test name
route/API
screenshot
workflow run
measured result
```

---

# 4. Fixed implementation requirements

## 4.1 API contract

Implement or complete the controlling endpoints.

### Watchlists

```text
GET    /api/watchlists
POST   /api/watchlists
GET    /api/watchlists/:id
PATCH  /api/watchlists/:id
DELETE /api/watchlists/:id
POST   /api/watchlists/:id/items
DELETE /api/watchlists/:id/items/:watchableId
POST   /api/watchlists/:id/items/batch
GET    /api/watchlists/:id/changes
```

Delete may be a soft delete/archival state internally, but the user-facing action and audit semantics must be explicit.

### Saved searches

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

### Reading and mutes

```text
GET  /api/reading-state
PUT  /api/reading-state/:watchableId
POST /api/reading-state/batch

GET    /api/mutes
POST   /api/mutes
PATCH  /api/mutes/:id
DELETE /api/mutes/:id
```

### Visits

```text
POST /api/visits/start
POST /api/visits/:id/heartbeat
POST /api/visits/:id/close
GET  /api/visits/previous
GET  /api/since-last-visit
```

A temporary backwards-compatible `/api/visits` alias may remain, but the web application must use the controlling lifecycle endpoints.

### Alert rules and alerts

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
POST /api/alerts/:id/resolve
POST /api/alerts/batch
```

A generic state endpoint may remain internally, but typed endpoints and validated state-specific payloads are required.

### Briefings

```text
GET   /api/briefing-settings
PATCH /api/briefing-settings

GET  /api/briefs
GET  /api/briefs/:id
POST /api/briefs/runs
POST /api/briefs/:id/export
GET  /api/briefings/status
```

### Personalisation import/export

```text
POST /api/personalisation/export
POST /api/personalisation/import/preview
POST /api/personalisation/import/apply
GET  /api/personalisation/migration/status
POST /api/personalisation/migration/skip
```

### Backups and Operations

Complete the controlling API routes, including:

```text
POST /api/backups/prune/preview
POST /api/backups/prune/apply
GET  /api/backups/status

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

Existing `/api/ops/*` paths may remain as compatibility aliases.

All mutations use the existing session/CSRF/local-admin controls.

## 4.2 Server-side behavior

- Server-side pagination for all lists.
- Validated filters and sorts.
- Bounded batch sizes.
- No route-level broad in-memory scans.
- Append-only state history.
- Stable dedupe keys.
- Transactional imports and bulk actions.
- Explicit stale/unavailable/redirected states.
- No Live/Demo mixing.

## 4.3 Web client

Create typed client methods for every workflow.

Requirements:

- Session/CSRF bootstrap and retry
- Safe request-ID errors
- Optimistic update rollback
- Deterministic cache invalidation
- No Live source-of-truth in localStorage
- Accessible loading/error/empty states
- No raw JSON as the main experience

---

# 5. Structured Saved Search schema

Implement the controlling schema concepts:

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

At minimum support filters appropriate to available M6 domains:

```text
source
content type
study design
evidence maturity
evidence availability
organism
population
outcome family
translation gap
trial status
regulatory standing
safety item present
intervention/peptide
creator
creator claim finding
date range
```

Rules:

- Zod validated.
- No SQL.
- No user regular-expression execution.
- Canonical hash.
- Version migration.
- `needs_update`.
- Bounded filter counts.
- Incremental evaluation.
- Persisted history and matches.

---

# 6. Alert-rule model

Implement usable rule creation/editing for:

```text
watchlist
watchable object
saved search
topic
source
event type
all official safety/regulatory events
```

Support the fixed alert families and dashboard priorities from the controlling brief.

Rules:

- Explain why matched.
- Preserve source/detection dates.
- Mute interaction.
- Duplicate prevention.
- Material update/supersession.
- Operational alerts visually separated.
- No personal clinical-risk language.
- Critical integrity/compliance alerts cannot be downgraded below the controlling floor.

---

# 7. Briefing model

Complete:

```text
daily_research_brief
weekly_review
manual_brief
```

Required schedule defaults:

```text
Daily: 07:15 Australia/Brisbane
Weekly: Sunday 09:00 Australia/Brisbane
```

Required:

- Startup catch-up
- At most one missed brief of each type
- Previous successful window semantics
- First-run lookback
- Section caps
- Total caps
- Overflow
- Deterministic order
- Source coverage
- Partial reasons
- Immutable/idempotent snapshot
- Redaction after platform purge
- Continue Reading
- Server-generated Markdown/JSON export
- No ranking/recommendation/dosing/sourcing

---

# 8. E2E and screenshot requirements

## 8.1 Desktop action coverage

Add tests for:

- Watchlist create/rename/archive/restore/delete
- Add/remove/batch entries
- Saved search create/update/run/history/delete
- Alert-rule create/edit/delete
- Alert read/ack/snooze/dismiss/resolve/batch
- Brief generate/history/detail/export/settings
- Visit start/heartbeat/close/previous cutoff
- Reading/dismiss/restore/mute
- Legacy migration import/skip/remind/export
- Personalisation export/import preview/apply
- Backup create/verify/prune preview/apply
- Retention preview/apply
- Operations DB check/diagnostic creation
- Browser notification preference

## 8.2 Mobile coverage

At minimum test action-level mobile flows for:

```text
Personalised Today
Watchlists
Saved Searches
Alert Centre
Briefings
Backup & Storage
```

## 8.3 Screenshots

Commit and index distinct screenshots for:

```text
saved-search builder
saved-search history
alert-rule settings
Alert Centre
alert detail
daily brief
weekly review
brief source coverage
Since your last visit
reading/mute actions
legacy migration preview
personalisation export/import
backup verification
prune preview
retention preview
Operations health panels
Privacy & Security status
mobile saved search
mobile alert detail
mobile weekly review
```

Existing valid screenshots may be retained.

---

# 9. Accessibility and performance

## 9.1 Accessibility

Scan the final functional states, including forms, dialogs, filters, batch controls, and validation errors.

Manual evidence must cover the final workflows—not route headings only.

## 9.2 Performance

The proportional local profile remains an accepted `DEVIATION`.

Update measurements after completing the workflows:

```text
personalised Today
Alert Centre filtered list
watchlists list
watchlist detail
saved-search execution
brief detail
since-last-visit
Operations
production-local startup
```

Record actual p50/p95 and gzip sizes.

Do not change the deviation to `PASS` unless the controlling full profile is actually run.

---

# 10. Report-integrity requirements

Rebuild:

```text
docs/milestones/M6_COMPLETION_REPORT.md
```

Rules:

- Keep all 236 controlling criteria.
- Preserve remediation history.
- Each row has criterion-specific evidence.
- Use:
  - `PASS`
  - `DEVIATION`
  - `NOT APPLICABLE`
  - `NOT RUN`
  - `BLOCKED`
- No required criterion may remain `NOT RUN` or `BLOCKED`.
- Missing features/screenshots cannot be marked `PASS`.
- Link exact tests, files, routes, screenshots, workflow runs, or measurements.
- The performance proportional profile remains `DEVIATION`.
- State the implementation-complete commit and report-parent commit.
- The handoff message remains authoritative for the pushed tip.

Add a report-evidence audit script that fails when:

- An evidence cell is blank.
- A large group of unrelated criteria share an identical generic evidence string.
- A cited file/command/test/screenshot does not exist.
- A `PASS` row cites only a broad milestone statement.
- A required screenshot is absent.
- A required criterion is `NOT RUN` or `BLOCKED`.

Command:

```text
pnpm completion-report:doctor
```

---

# 11. Required commands

All prior commands remain required.

Add or complete:

```text
pnpm completion-report:doctor
pnpm m6-product:eval
pnpm m6-product:doctor
```

`m6-product:eval` must exercise the outstanding workflows with substantive cases.

`m6-product:doctor` must check:

- Missing controlling endpoints
- Missing first-class routes
- Live localStorage source-of-truth violations
- Missing alert rules
- Missing saved-search history/matches
- Missing visit lifecycle
- Missing batch reading/watchlist actions
- Missing retention/prune UI endpoints
- Raw JSON as the only Operations presentation
- Missing screenshots
- Completion-report evidence mismatch

---

# 12. Required final gates

Run on the final implementation-complete commit:

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
pnpm reading:eval
pnpm alerts:eval
pnpm alerts:doctor
pnpm briefs:eval
pnpm briefs:doctor
pnpm export-import:eval
pnpm backup:eval
pnpm backup:doctor
pnpm operations:doctor

pnpm m6-product:eval
pnpm m6-product:doctor
pnpm completion-report:doctor

pnpm accessibility:audit
pnpm performance:check
pnpm security:check
pnpm ci:quality
```

Push the implementation commit and obtain five green CI jobs.

Commit the report and screenshots, push again, and obtain five green CI jobs at the report tip.

---

# 13. Remediation IV acceptance checklist

## A. Branch and accepted work

- [ ] A1. Work continues from exact tip `404a1700d3106fc61d93cd57f71652c1e4823bd3`.
- [ ] A2. Accepted Remediation II/III backup, security, CI, E2E, accessibility, and performance work does not regress.
- [ ] A3. Historical reports and commits remain intact.
- [ ] A4. No M7 work exists.

## B. Watchlists and Saved Searches

- [ ] B1. Watchlist create/rename/archive/restore/delete works.
- [ ] B2. Watchlist add/remove/batch works.
- [ ] B3. Target-type filters and unavailable/redirected states work.
- [ ] B4. Per-list alert and brief settings work.
- [ ] B5. Saved-search builder uses the structured schema.
- [ ] B6. Saved-search update/delete/archive/restore works.
- [ ] B7. Persisted match/evaluation history works.
- [ ] B8. New-match/capped/partial/error state works.
- [ ] B9. Saved-search alert/brief toggles work.
- [ ] B10. `needs_update` behavior works.

## C. Reading, mutes, and visits

- [ ] C1. Reading state supports unread/opened/read.
- [ ] C2. Dismiss/restore and archive/restore work.
- [ ] C3. Bounded batch actions work.
- [ ] C4. Mute CRUD, expiry, and scopes work.
- [ ] C5. Visit start/heartbeat/close lifecycle works.
- [ ] C6. Previous completed/coalesced visit semantics work.
- [ ] C7. First-visit and stable cutoff states work.
- [ ] C8. Live browser preference state is not authoritative.

## D. Alerts and Briefings

- [ ] D1. Alert-rule CRUD works.
- [ ] D2. All target/event families can be configured.
- [ ] D3. Priority groups, filters, batch actions, and history work.
- [ ] D4. Why-included/source/date data is structured.
- [ ] D5. Snooze and mute behavior work.
- [ ] D6. Daily/weekly current and history work.
- [ ] D7. Scheduling, timezone, caps, sections, catch-up, and status are visible/configurable.
- [ ] D8. Source coverage/partial reasons/overflow work.
- [ ] D9. Read/dismiss/Continue Reading work.
- [ ] D10. Server-generated Markdown/JSON export works.

## E. Import, Backup, Operations, Privacy

- [ ] E1. Automatic legacy-key detection and complete migration actions work.
- [ ] E2. Portable personalisation export/import merge/replace works.
- [ ] E3. Backup page provides verify/prune/status/protected states.
- [ ] E4. Retention preview/apply works.
- [ ] E5. Operations uses accessible health panels and actions.
- [ ] E6. Diagnostic bundle creation works.
- [ ] E7. Privacy/Security exposes operational status.
- [ ] E8. Browser-notification preference is stored in the Live profile and works while-page-open.

## F. Today and cross-surface actions

- [ ] F1. Personalised Today contains all fixed sections.
- [ ] F2. Required watch/read/dismiss/mute/why actions are available.
- [ ] F3. Controls are consistent on required lists/details/alerts/briefs/claims/dossiers.
- [ ] F4. Demo remains isolated and functional.

## G. Verification and report

- [ ] G1. Desktop action-level E2E covers all major M6 workflows.
- [ ] G2. Mobile action-level E2E covers the required workflows.
- [ ] G3. Required screenshots are committed and indexed.
- [ ] G4. Axe/manual accessibility covers final functional states.
- [ ] G5. Performance measurements are updated and proportional status remains `DEVIATION`.
- [ ] G6. All 236 report rows contain criterion-specific evidence.
- [ ] G7. `completion-report:doctor` passes.
- [ ] G8. `m6-product:eval` passes.
- [ ] G9. `m6-product:doctor` passes.
- [ ] G10. All local final gates pass.
- [ ] G11. Five CI jobs are green at the report tip.
- [ ] G12. Exact handoff tip is reported.
- [ ] G13. M7 remains explicitly unstarted.

---

# 14. Completion-report addendum

Add:

- Endpoint inventory versus controlling API contract
- Route/page inventory
- Live state ownership table
- Watchlist workflow evidence
- Saved-search schema/history evidence
- Alert-rule workflow evidence
- Briefing schedule/status evidence
- Visit lifecycle evidence
- Reading/mute evidence
- Legacy and portable import/export evidence
- Backup/retention/operations evidence
- Screenshot index
- Criterion-evidence audit result
- Final desktop/mobile E2E counts
- Performance deviation artifact
- Five CI run links
- Exact implementation-complete commit
- Report-parent commit
- Authoritative-handoff convention
- Explicit M7-not-started statement

---

# 15. Consult the project manager only when

Consult early only if:

- A controlling M6 workflow requires a genuine product decision not defined in the brief.
- Existing schema cannot support a required workflow without destructive migration.
- Current platform policy prevents a required personalisation, alert, briefing, or backup action.
- A genuine accessibility conflict needs a design decision.
- Two controlling requirements are incompatible.
- A proposed solution requires M7 work.

Do not consult for:

- Route names
- Form layout
- Component selection
- API client functions
- CRUD implementation
- E2E fixture setup
- Screenshot capture
- Report evidence repair
- Ordinary UI refactoring

---

# 16. Stop rule

After all gates pass:

1. Commit implementation.
2. Run all local gates.
3. Push and obtain five green CI jobs.
4. Commit report and screenshots.
5. Push and confirm CI is green.
6. Report the authoritative pushed tip.
7. Stop.

Do not create or begin Milestone 7.

---

# 17. Authorised remediation instruction

> **M6 REMEDIATION IV AUTHORISED; M7 WITHHELD:** Continue Healthspan Dashboard Milestone 6 from exact tip `404a1700d3106fc61d93cd57f71652c1e4823bd3` on `milestone-6/personalisation-production-hardening`. Preserve the accepted backup, restore, request-integrity, CI, E2E, accessibility, and performance work, then finish the controlling M6 product contract: complete Watchlists CRUD and bulk actions, the structured Saved Search workflow and history, visit lifecycle, reading/dismissal/mute actions, alert-rule configuration and full Alert Centre, complete daily/weekly briefing workflows and settings, legacy and portable personalisation import/export, Backup & Storage retention/prune workflows, accessible Operations panels, operational Privacy & Security settings, and all fixed Personalised Today actions. Add action-level desktop/mobile E2E, required screenshots, `m6-product` evaluation/doctor gates, and a completion-report doctor that enforces criterion-specific evidence across all 236 rows. Push the branch, report the exact handoff tip and results, and stop. Do not create or begin Milestone 7.
