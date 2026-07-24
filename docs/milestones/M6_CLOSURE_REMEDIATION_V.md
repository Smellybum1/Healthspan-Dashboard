# Healthspan Dashboard — M6 Closure Remediation V

**Status:** **M6 CLOSURE REJECTED — FINAL CONTRACT-CLOSURE REMEDIATION AUTHORISED**  
**Milestone 7 status:** **WITHHELD / NOT AUTHORISED**  
**Repository:** `Smellybum1/Healthspan-Dashboard`  
**Branch:** `milestone-6/personalisation-production-hardening`  
**Exact remediation base:** `59eb7c51ff9cab82ad3155438912e76b047b8379`  
**Remediation IV implementation-complete commit:** `cb7ecaa751b979e8cf3de4770c70224345b75e2e`  
**Remediation IV report commit:** `e10dacd`  
**Controlling M6 brief SHA-256:** `f78eeb73b7e735c9ce24103b99de617a94951101133ce010c3401667a8355118`  
**Remediation IV brief SHA-256:** `ff91f0eccff7e5e1a497b7a93c50a42304765a556c5edecd4acecdbfa039a3aa`  
**Execution agent:** Grok in Cursor  
**Stop point:** Complete only the remaining M6 contract, push the branch, submit exact evidence, and stop. Do not create or begin Milestone 7.

---

# 1. Controlling decision

Continue on:

```text
milestone-6/personalisation-production-hardening
```

from exact tip:

```text
59eb7c51ff9cab82ad3155438912e76b047b8379
```

Do not create another branch.

Do not create or modify:

```text
milestone-7/*
.openai/hosting.json
D1
R2
Wrangler
Sites deployment configuration
hosted authentication
hosted scheduling
public deployment
```

This packet contains only residual requirements already stated in the controlling M6 brief and Remediation IV. It adds no M7 scope.

---

# 2. Accepted work that must not regress

The following work is accepted:

- Node 24 / pnpm 11 frozen-lockfile baseline
- Five required CI jobs green at the current tip
- Request-integrity session and CSRF controls
- Host, Origin, Fetch Metadata, rate-limit, and security-header protections
- Online SQLite backup
- Encrypted `.healthspan-backup` format
- Restore locking and rollback framework
- Creator-document and referenced-raw restoration
- Durable post-restore jobs
- Backup failure-injection tests
- Live SQLite Follow behavior
- Visit lifecycle API endpoints
- First-class M6 routes
- Watchlist, Saved Search, Alert, Briefing, Operations, Backup, Privacy, and migration pages
- Playwright + axe coverage
- Measured proportional performance profile marked `DEVIATION`
- Required screenshot family
- Final-tip E2E and green CI
- Live/Demo separation
- M7-not-started boundary

Do not rewrite or weaken this accepted work.

---

# 3. Why M6 remains open

## 3.1 The saved-search builder is not yet the controlling structured builder

The current UI exposes:

```text
text
entity types
source
evidence maturity
study design
include retracted
```

Complete the structured builder for the fields supported by the current domain and controlling M6 brief:

```text
source
content type
study design
evidence maturity
evidence availability
organism
population context
outcome family
translation gap
trial status
regulatory standing
official safety item state
intervention or peptide
creator
creator-claim finding
date range
sort
include retracted
include unavailable
```

Requirements:

- Controlled selects/multiselects where the taxonomy is known
- No comma-separated raw taxonomy entry as the only UI
- Preview before save/update
- Edit an existing query
- Persisted match history
- Persisted evaluation history
- New-match count
- Capped, partial, and error status
- `needs_update` repair flow
- Alert and brief toggles
- Archive, restore, and delete
- Server-side validation and bounded execution

## 3.2 Alert Centre and alert rules are still incomplete

Complete:

```text
dashboard-priority groups
priority filter
event-family filter
source filter
watchlist/saved-search reason filter
state filter
batch read/acknowledge/dismiss/resolve
snooze-until input
mute from alert
operational versus research/safety separation
resolved and superseded history
structured Why included
official source links
source date
detection date
browser-notification eligibility
```

Alert-rule editing must include:

```text
target
event families
family
priority override within safe bounds
enabled state
```

Do not allow database-integrity or required platform-compliance alerts to be downgraded below the controlling floor.

## 3.3 Briefing workflows are not complete

Complete:

```text
current and history
section navigation
section enable/disable settings
daily and weekly schedule
timezone
daily and weekly item caps
per-section caps
last run
next run
catch-up state
job state
source coverage
partial-source reasons
overflow links
Why included
read and dismiss
Continue Reading
stale
retracted
redacted
source unavailable
server-generated Markdown export
server-generated versioned JSON export
```

Exercise actual scheduled and startup-catch-up behavior in deterministic tests.

## 3.4 Watchlist and watchable-state handling needs completion

Complete:

- Batch add as well as batch remove
- Bulk read/dismiss/restore where applicable
- Clear unavailable and redirected badges
- Redirect/replacement navigation
- Stable deep link to the selected list
- Recent-change pagination
- Per-list alert and briefing settings in list detail
- Confirmation and audit behavior for delete
- Default Following-list protections

## 3.5 Mute and reading controls are not complete across the product

Create a usable Mute Rules interface:

```text
list
create
edit
disable
delete
until date
forever
object
topic
source
event type
reason
expiry state
```

Add consistent:

```text
mark unread
mark opened
mark read
dismiss
restore
archive
restore archive
mute
unmute
```

controls to the controlling surfaces:

```text
Today
Watchlists
Search results
Alert Centre
Brief details
Creator claims
Intervention dossiers
```

Official safety/regulatory warnings remain visible on canonical detail pages.

## 3.6 Personalised Today lacks all required per-row actions

For applicable rows provide:

```text
watch or unwatch
mark read or unread
dismiss or restore
mute or unmute
open canonical source
Why included
```

Use structured inclusion data rather than only a title and action buttons.

## 3.7 Operations still exposes raw diagnostic JSON as a principal panel

Keep raw diagnostics downloadable or expandable, but make the primary Operations UI accessible panels for:

```text
overall health
runtime and schema
database integrity
worker
scheduler
jobs
sources
intelligence
dossiers
creators
alerts and briefs
backups
storage and retention
platform compliance
security gates
recent redacted errors
```

Use accessible tables/cards and status labels.

## 3.8 Mobile E2E is still route-reachability rather than action-level coverage

Add mobile action tests for:

```text
watchlist create/add/remove
saved-search create/run/history
alert state action
brief navigation and export
reading or mute action
backup verification or prune preview
```

Do not count page navigation and screenshots alone as action-level mobile coverage.

## 3.9 The product evaluation and doctors remain too shallow

`m6-product:eval` must test real domain behavior rather than a small set of helper assertions.

Add substantive cases for:

- Watchlist restore/delete/batch add/batch remove
- Saved-search validation, migration, edit, match history, cap, partial, error
- Alert rule priority floor, dedupe, mute, batch actions
- Brief schedule/catch-up/sections/caps/coverage/overflow
- Visit coalescing and stable previous cutoff
- Reading/dismiss/restore/archive/mute expiry
- Portable import merge/replace and unresolved targets
- Live/Demo isolation
- Browser-notification Live preference

`m6-product:doctor` must validate actual route/API/schema/UI contracts—not only source-string presence.

## 3.10 The completion-report doctor deliberately permits generic evidence

The current doctor skips duplicate-evidence analysis when an evidence string merely ends in:

```text
criterion <ID>
```

Remove that bypass.

The report currently contains unrelated evidence examples such as Saved Search evidence for timed mutes and visit coalescing.

The final doctor must:

- Detect semantically identical evidence with appended criterion IDs
- Require evidence tokens appropriate to each criterion family
- Validate cited file paths
- Validate cited script names
- Validate cited test names where a manifest is supplied
- Validate screenshot existence
- Reject broad evidence such as only a page route for a behavioral criterion
- Reject `PASS` when the cited evidence is unrelated
- Permit shared evidence only when it is genuinely applicable and names the criterion-specific test/assertion

---

# 4. Required API and UI completion

## 4.1 Saved-search API

Ensure the following are fully functional:

```text
GET    /api/saved-searches
POST   /api/saved-searches
GET    /api/saved-searches/:id
PATCH  /api/saved-searches/:id
DELETE /api/saved-searches/:id
POST   /api/saved-searches/:id/restore
POST   /api/saved-searches/:id/run
GET    /api/saved-searches/:id/matches
GET    /api/saved-searches/:id/history
```

Add a direct detail endpoint if the UI currently fetches all searches to locate one item.

## 4.2 Alert API

Ensure filters support:

```text
state
family
priority
event kind
source
watchlist
saved search
page
page size
```

Batch actions must support every safe alert state transition.

## 4.3 Briefing API

Expose and use:

```text
briefing settings
briefing status
next run
last run
catch-up state
job state
source coverage
partial reasons
overflow count
section settings
item caps
```

## 4.4 Mute API

All CRUD operations and expiry state must be visible through typed client methods.

## 4.5 Watchlist API

Batch actions support both add and remove and return an audited bounded result.

---

# 5. Required E2E coverage

## 5.1 Desktop

Add action-level tests for:

- Watchlist create, rename, archive, restore, delete
- Watchlist batch add/remove
- Redirected/unavailable item rendering
- Saved-search full structured builder
- Saved-search edit
- Saved-search run, history, matches, archive, restore, delete
- Alert-rule priority and event configuration
- Alert filters
- Alert snooze with a selected time
- Alert mute
- Alert batch actions
- Brief current/history
- Brief settings and section toggles
- Brief export
- Brief read/dismiss
- Since-last-visit actions
- Mute-rule CRUD and expiry
- Personalised Today Why-included and watch/read/dismiss/mute actions
- Operations accessible health panels
- Browser-notification preference and test path

## 5.2 Mobile

Add action-level tests for:

- Watchlist mutation
- Saved-search mutation/run
- Alert action
- Brief navigation/export
- Reading/mute
- Backup verify/prune preview

## 5.3 Skip policy

Every skip must identify:

- Reason
- Scope
- Why it does not invalidate the requirement

Do not use a global “shared API races” skip to avoid all mobile mutation testing; use isolated data or serial project configuration.

---

# 6. Accessibility and screenshots

Run axe against all final functional states, including:

- Open dialogs
- Validation errors
- Filter panels
- Batch-action state
- Empty state
- Error state
- Mobile state

Update screenshot evidence for:

```text
full structured saved-search builder
saved-search history/matches
alert priority filters
alert snooze/mute
brief source coverage/overflow
brief settings
mute-rule management
Today Why included/actions
accessible Operations panels
mobile action results
```

---

# 7. Completion-report requirements

Retain all 236 controlling rows.

Every evidence cell must identify specific evidence, for example:

```text
apps/api/src/personalization-iv.test.ts — "coalesces multiple tabs within 30 minutes"
apps/web/e2e/m6-surfaces.spec.ts — "mobile alert dismiss persists after reload"
scripts/briefs-eval.ts — case "weekly-catch-up-at-most-one"
docs/milestones/screenshots/m6-alert-snooze.png
GitHub Actions run <URL>, job <name>
```

Do not use:

```text
M6Pages + API; criterion X
all gates pass
see above
route exists
```

as sole behavioral evidence.

Add:

```text
pnpm completion-report:doctor
```

with semantic family checks and no criterion-ID bypass.

---

# 8. Required new gates

Add or strengthen:

```text
pnpm m6-product:eval
pnpm m6-product:doctor
pnpm completion-report:doctor
```

Minimum substantive `m6-product:eval` cases:

```text
60
```

They must cover the feature families in Section 3.9.

Do not pad the count with repeated constant or type checks.

---

# 9. Acceptance checklist

## A. Saved Searches

- [ ] A1. Full structured builder exposes all supported controlling filters.
- [ ] A2. Controlled taxonomy inputs replace raw comma text where appropriate.
- [ ] A3. Preview works.
- [ ] A4. Edit/update works.
- [ ] A5. Run, matches, and evaluation history work.
- [ ] A6. New/capped/partial/error states work.
- [ ] A7. Archive, restore, and delete work.
- [ ] A8. Alert and brief toggles work.
- [ ] A9. `needs_update` repair works.
- [ ] A10. Desktop/mobile action tests pass.

## B. Alerts

- [ ] B1. Alert-rule priority and event-family configuration work.
- [ ] B2. Priority/source/event/watchlist/search filters work.
- [ ] B3. Batch actions cover required transitions.
- [ ] B4. Snooze-until selection works.
- [ ] B5. Mute from alert works.
- [ ] B6. Operational and research/safety alerts are separated.
- [ ] B7. Structured Why-included, source link, source date, and detection date are shown.
- [ ] B8. Desktop/mobile action tests pass.

## C. Briefings

- [ ] C1. Current and history views work.
- [ ] C2. Sections and section settings work.
- [ ] C3. Daily/weekly schedule, timezone, caps, and next/last run work.
- [ ] C4. Catch-up/job status works.
- [ ] C5. Source coverage, partial reasons, and overflow work.
- [ ] C6. Why-included and stale/retracted/redacted states work.
- [ ] C7. Read/dismiss/Continue Reading works.
- [ ] C8. Server Markdown/JSON exports work.
- [ ] C9. Desktop/mobile action tests pass.

## D. Watchlists, reading, and mutes

- [ ] D1. Batch add and remove work.
- [ ] D2. Unavailable/redirected state is visible and navigable.
- [ ] D3. Per-list alert/brief settings work.
- [ ] D4. Reading/dismiss/archive restore actions work.
- [ ] D5. Mute CRUD, expiry, and scopes work.
- [ ] D6. Actions are consistent on the required cross-product surfaces.
- [ ] D7. Today supports every required per-row action and Why included.

## E. Operations and notifications

- [ ] E1. Operations primary UI is accessible panels, not raw JSON.
- [ ] E2. All controlling operational categories are represented.
- [ ] E3. Browser-notification Live preference, permission, test, and revoke paths work.
- [ ] E4. No source text appears in notifications.

## F. Verification

- [ ] F1. `m6-product:eval` contains at least 60 substantive cases.
- [ ] F2. `m6-product:doctor` validates real contracts.
- [ ] F3. Mobile action E2E is no longer route-only.
- [ ] F4. Final E2E pass/skip/fail counts are recorded.
- [ ] F5. Axe scans final action/error/dialog states.
- [ ] F6. Updated screenshots are committed.
- [ ] F7. The performance profile remains honestly `DEVIATION`.
- [ ] F8. `completion-report:doctor` has no criterion-ID bypass.
- [ ] F9. All 236 rows have criterion-specific evidence.
- [ ] F10. Five CI jobs are green at the report tip.
- [ ] F11. Exact handoff tip is reported.
- [ ] F12. M7 remains unstarted.

---

# 10. Required final gates

Run at the final implementation-complete commit:

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

Commit the updated report/screenshots, push again, and confirm five green jobs at the report tip.

---

# 11. Completion report addendum

Add:

- Full Saved Search filter inventory
- Alert filter/rule/action inventory
- Briefing section/schedule/status inventory
- Watchlist batch and redirect evidence
- Mute and reading cross-surface evidence
- Today action inventory
- Operations panel inventory
- Browser-notification evidence
- `m6-product:eval` case manifest
- Criterion-specific evidence audit summary
- Desktop/mobile E2E counts
- Axe result
- Performance deviation
- Five CI run links
- Exact implementation-complete commit
- Report-parent commit
- Authoritative handoff tip convention
- Explicit M7-not-started statement

---

# 12. Consult the project manager only when

Consult early only if:

- A controlling taxonomy cannot be exposed safely in the Saved Search builder.
- A required cross-surface reading/mute action conflicts with an existing domain invariant.
- A required alert or briefing behavior is genuinely incompatible with the current schema.
- A platform policy blocks a required display action.
- A genuine accessibility conflict needs a product decision.
- A proposed solution requires M7 work.

Do not consult for:

- UI layout
- Select/multiselect choice
- Route naming
- API-client implementation
- E2E fixture isolation
- Report evidence repair
- Mobile test setup
- Screenshot capture

---

# 13. Stop rule

After all gates pass:

1. Commit implementation.
2. Run all local gates.
3. Push and obtain five green CI jobs.
4. Commit report and screenshots.
5. Push and confirm CI remains green.
6. Report the authoritative pushed tip.
7. Stop.

Do not create or begin Milestone 7.

---

# 14. Authorised remediation instruction

> **M6 REMEDIATION V AUTHORISED; M7 WITHHELD:** Continue Healthspan Dashboard Milestone 6 from exact tip `59eb7c51ff9cab82ad3155438912e76b047b8379` on `milestone-6/personalisation-production-hardening`. Preserve all accepted Remediation II–IV work, then complete the remaining controlling M6 product depth: the full structured Saved Search builder and histories, complete Alert Centre filters/rules/batch/snooze/mute behavior, complete Briefing sections/schedule/coverage/overflow/status workflows, watchlist batch and redirected/unavailable handling, cross-surface reading/dismiss/archive/mute controls, all required Personalised Today actions, and accessible Operations panels. Replace the shallow `m6-product` checks with at least 60 substantive cases, add action-level mobile E2E, and repair `completion-report:doctor` so criterion-ID suffixes cannot disguise generic or unrelated evidence. Rebuild the 236-row report with criterion-specific evidence, push the branch, report the exact handoff tip and results, and stop. Do not create or begin Milestone 7.
