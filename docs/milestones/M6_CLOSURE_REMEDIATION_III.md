# Healthspan Dashboard — M6 Closure Remediation III

**Status:** **M6 CLOSURE REJECTED — REMEDIATION III AUTHORISED**  
**Milestone 7 status:** **WITHHELD / NOT AUTHORISED**  
**Repository:** `Smellybum1/Healthspan-Dashboard`  
**Branch:** `milestone-6/personalisation-production-hardening`  
**Exact remediation base:** `7d309bd73cdb870c731df8d0de947ec885493e31`  
**Remediation II implementation-complete commit:** `1c7efbc002dc8d61b25cb81504a85892e5f535fb`  
**Controlling M6 brief SHA-256:** `f78eeb73b7e735c9ce24103b99de617a94951101133ce010c3401667a8355118`  
**Remediation II brief SHA-256:** `2988fa9e8f81d404173c73cef22e73254b07372eac6d94ac2cb87d5ea8c8fff2`  
**Execution agent:** Grok in Cursor  
**Stop point:** Close M6 honestly, push the branch, report the exact handoff tip and evidence, and stop. Do not create or begin Milestone 7.

---

# 1. Controlling decision

Continue on:

```text
milestone-6/personalisation-production-hardening
```

from exact commit:

```text
7d309bd73cdb870c731df8d0de947ec885493e31
```

Do not create:

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

This packet contains only residual M6 work already required by the controlling M6 brief and Remediation II. It adds no M7 scope.

---

# 2. What is accepted from Remediation II

The following improvements are accepted and must not regress:

- Frozen-lockfile installation is repaired.
- The five required GitHub Actions jobs are green on both the implementation commit and report commit.
- Local E2E passed with 69 passed, 5 documented skips, and 0 failures.
- The request-integrity session, CSRF, Host, Origin, Fetch Metadata, rate-limit, and security-header infrastructure exists.
- The backup format now uses SQLite Online Backup, bounded archive limits, AES-256-GCM, scrypt, manifests, checksums, an exclusive lock, and CLI create/list/verify/restore/prune commands.
- Creator-document and referenced-raw inclusion policies are represented in archive creation.
- Playwright with axe-core runs.
- Performance checks measure real `createApp()` paths and gzip bundle sizes.
- All five CI jobs are green at the report tip.
- M7 has not begun.

Do not rewrite or discard this work.

---

# 3. Why M6 remains open

M6 is not accepted because the implementation and completion report still materially diverge from the controlling product requirements.

## 3.1 Required M6 user-facing workflows are missing

The current router and navigation do not expose first-class Live routes for:

```text
Saved Searches
Alert Centre
Briefings
Brief detail/history
Operations
Backup & Storage
Personalisation migration
Privacy & Security
```

The current Settings page remains the earlier Data mode / Appearance / browser-preference import-export page.

The current Watchlists page:

- Primarily reads `prefs.followedIds` from browser storage.
- Displays named watchlist names but does not provide the required CRUD workflow.
- Does not provide a structured saved-search builder or match history.
- Does not provide alert/brief settings.

The current Today page:

- Uses browser-local `lastVisitAt`.
- Does not implement the required personalised sections at the controlling depth.
- Does not provide the required alert, brief, reading, mute, and why-included actions.

The completion report explicitly states that dedicated Alert Centre, Daily brief, and Backup pages are absent. That is not an acceptable substitute for the controlling UI specification.

## 3.2 Live personalisation still uses the legacy browser preference path

Live Follow controls and visit tracking still use `PreferencesContext`, `followedIds`, and `lastVisitAt` persisted through the old browser-preference implementation.

Required M6 behavior is:

- Meaningful Live personalisation in SQLite.
- Browser-local state only for cosmetic/transient settings.
- Demo browser state separately namespaced.
- Live Follow, visit, read, dismiss, mute, alert, and brief state through authenticated local API mutations.

The legacy browser state may remain only as a migration source and Demo/cosmetic store.

## 3.3 Completion-report evidence is not criterion-specific

The report contains all 236 rows, but many evidence cells are generic or mismatched.

Examples include:

- Daily and weekly schedule criteria citing export/import evaluation.
- Operations/logging/retention criteria citing an accessibility scan.
- HTTP-security criteria citing a proportional performance profile.
- Browser-notification criteria citing brief evaluation only.

Remediation II requires criterion-specific evidence. A passing command may support several related criteria, but the report must identify the actual file, test, command, screenshot, route, or measured result for each criterion.

## 3.4 Required screenshots are missing

The screenshot index contains mostly M1–M5 surfaces. It does not contain the required M6 evidence for:

```text
legacy migration
personalised Today
Since your last visit
saved-search builder/history
Alert Centre
alert detail
daily brief
weekly review
brief source coverage
Backup & Storage
backup verification
retention preview
Operations
Privacy & Security
mobile Alert Centre / brief
```

Axe scans and E2E tests do not replace required visual evidence.

## 3.5 Backup restore does not restore the complete portable payload

Archive creation includes eligible documents and referenced raw objects, but `restoreBackup()` currently restores the SQLite database only.

Complete restore must:

- Restore eligible archived creator-document files.
- Restore permitted referenced official raw objects for `portable_full`.
- Validate every restored file against the manifest.
- Use archive-relative paths under managed storage roots.
- Roll back filesystem payloads as well as the database on failure.
- Mark missing/excluded dependencies correctly.
- Queue actual source/platform re-sync and reassessment jobs.

Recording `resyncScheduled: true` in history is not equivalent to enqueueing work.

## 3.6 Several backup tests do not exercise the claimed production path

Replace simulated checks with injected-failure integration tests.

At minimum:

- `post-swap-failure-rollback` must force the real restore code to fail after swap and verify automatic rollback.
- `older-schema-migrated-in-temp` must execute the temporary migration path, not only inspect a lower manifest number.
- `source-resync-scheduled` must assert actual durable jobs.
- `pre-restore-checkpoint` must verify the checkpoint created by the real restore path.
- Document/raw restoration must verify bytes and DB references after restore.
- Interrupted create/restore tests must interrupt the production code path rather than manually create/delete temporary files.

## 3.7 Accessibility coverage uses adjacent duplicate pages

The accessibility suite runs a real axe engine, but several required states are represented by “adjacent” existing pages because the actual M6 workflows do not exist.

After implementing the missing UI, scan the real:

```text
Saved Searches
Alert Centre
Alert detail
Daily brief
Weekly review
Backup & Storage
Operations
Privacy & Security
Legacy migration
```

workflows.

## 3.8 Performance coverage is incomplete and the deviation status is inconsistent

The current performance profile is proportional:

```text
2,000 content items
5,000 claims
2,000 alerts
```

That is an acceptable documented deviation only when clearly reported as such.

Required corrections:

- The artifact status must be `DEVIATION`, not `PASS`, when using the proportional profile.
- The completion checklist must use `DEVIATION` for the generated-scale criterion.
- Measure all required paths:
  - Watchlist detail
  - Saved-search execution
  - Brief detail
  - Alert detail or filtered list
  - Since-last-visit
  - Operations
  - Full production-local startup, not only `openDatabase`
- Keep actual p50/p95 and gzip measurements.
- State the hardware and exact profile.
- Do not attach performance evidence to unrelated security or operations criteria.

---

# 4. Required product-surface implementation

## 4.1 Routes and navigation

Add first-class Live routes or an equally explicit nested route structure:

```text
/saved-searches
/saved-searches/:id
/alerts
/alerts/:id
/briefs
/briefs/:id
/operations
/settings/personalisation
/settings/briefings
/settings/alerts
/settings/backup
/settings/privacy-security
```

The exact route naming may differ, but every workflow must be directly navigable, deep-linkable, and testable.

Add navigation entries or clear Settings subnavigation.

## 4.2 Personalised Today

Implement the required sections:

```text
Urgent alerts
Since your last visit
Latest daily brief
Watchlist changes
Continue reading
New saved-search matches
Source coverage
```

Every applicable item supports:

```text
Watch / Unwatch
Mark read / unread
Dismiss / restore
Mute / unmute
Open source
Why included
```

Use SQLite Live state through the API.

## 4.3 Watchlists

Implement:

- Create
- Rename
- Archive/restore
- Delete with confirmation
- Add/remove
- Bulk actions
- Target-type filters
- Unavailable/redirected states
- Recent changes
- Alert settings
- Brief inclusion settings
- Stable source links

The default Following list must be fully usable.

## 4.4 Saved searches

Implement:

- Structured filter builder
- Preview
- Save/update/archive/delete
- Manual run
- Match history
- New-match count
- Capped/partial/error state
- Alert toggle
- Brief toggle
- `needs_update` state
- No SQL or browser-supplied regular-expression execution

## 4.5 Alert Centre

Implement:

- Priority groups
- Read/acknowledge/snooze/dismiss/resolve
- Batch actions
- State/source/event filters
- Watchlist/search match reason
- Source and detection dates
- Operational alerts separated
- Why-included panel
- No personal clinical-risk wording

## 4.6 Briefings

Implement:

- Daily and weekly tabs
- Current and history
- Section navigation
- Source coverage
- Why included
- Read/dismiss state
- Overflow links
- Markdown export
- Versioned JSON export
- Stale/retracted/redacted state
- Manual generation
- Schedule/settings

## 4.7 Since your last visit

Implement:

- Exact previous-visit cutoff
- Visit basis explanation
- Filters for all fixed domains
- Pagination
- Read/dismiss/mute actions
- First-visit state

Use SQLite visit sessions—not browser `lastVisitAt`.

## 4.8 Reading controls

Replace Live `FollowButton` and browser follow state with Live API-backed controls.

Add consistent read/watch/dismiss/mute controls to:

- Lists
- Detail pages
- Search results
- Alerts
- Briefs
- Creator claims
- Intervention dossiers

Demo may continue using isolated browser-local fixtures.

## 4.9 Legacy preference migration

Implement the real first-use flow:

- Detect known Live legacy keys
- Preview
- Counts
- Unresolved IDs
- Import
- Skip
- Export legacy data
- Remind later
- Idempotent completion
- No Demo-to-Live import
- No silent deletion

## 4.10 Backup & Storage

Implement a browser page/section for:

- Last successful recovery backup
- Next scheduled backup
- Create recovery/core/full
- Portable encryption choice
- Verify
- Prune preview/apply
- Storage categories
- Retention preview/apply
- Restore CLI instructions
- No exact paths
- No persisted passphrase

Restore remains CLI-only.

## 4.11 Operations

Implement:

- Overall health
- App/runtime/schema
- Worker/scheduler
- Jobs
- Sources
- Alerts/briefs
- Backups
- Storage/retention
- Database integrity/maintenance
- Platform compliance
- Security gate status
- Recent redacted events
- Diagnostic bundle creation

## 4.12 Privacy, security, and browser notifications

Implement Settings for:

- Local-only profile explanation
- Request-integrity status
- Remote-bind status
- Data retention
- Backup exclusions
- Browser notification opt-in
- While-page-open limitation
- Permission request through user gesture
- Test notification without source text
- Revoke app preference
- Browser-level revocation explanation

---

# 5. API-client and state integration

Add typed web-client functions for all M6 endpoints.

Requirements:

- All mutations use the session/CSRF client.
- Handle session rotation/retry.
- Server errors show safe request IDs.
- No browser state becomes the Live source of truth.
- Optimistic UI must roll back on failed mutation.
- Query invalidation/refetch is deterministic.
- Demo and Live state remain isolated.

The existing `PreferencesContext` may retain:

```text
theme
density
sidebar state
temporary UI state
Demo fixture state
legacy migration source
```

It must not remain the current Live store for:

```text
following
watchlists
visits
reading
dismissals
mutes
alerts
briefs
saved searches
```

---

# 6. Backup restore completion

## 6.1 Restore archived files

For `portable_core` and `portable_full`, restore eligible archived documents.

For `portable_full`, restore permitted official raw objects.

Requirements:

- Manifest-driven path mapping
- Managed-root validation
- Hash verification
- Temporary staging
- Atomic or rollback-capable file replacement
- DB/file consistency checks
- Missing/excluded dependency state
- No restricted platform content

## 6.2 Durable re-sync jobs

After a successful restore, enqueue actual durable jobs for excluded/rebuildable data, including as applicable:

```text
platform policy reconciliation
YouTube metadata refresh
X compliance before display
source refresh
stale intelligence reassessment
dossier rebuild
creator-profile rebuild
brief/alert reconciliation
```

Do not claim scheduling based only on a JSON history flag.

## 6.3 Failure-injection tests

Add test hooks that are active only in tests.

Exercise:

- Failure after live DB move
- Failure after restored DB placement
- Failure while restoring documents
- Failure while restoring raw objects
- Failure before final verification
- Rollback of DB, WAL/SHM, documents, and raw payload changes

---

# 7. Accessibility and visual evidence

## 7.1 Real accessibility states

Run Playwright + axe against the newly implemented actual M6 workflows.

At least 24 substantive states remain required; duplicate “adjacent” pages do not count as separate M6 workflows.

## 7.2 Manual checklist

Update evidence for:

- Keyboard navigation
- Focus
- Dialogs
- Watchlist management
- Saved-search builder
- Alert actions
- Brief navigation/export
- Legacy migration
- Backup create/verify/prune
- Operations
- Browser notification controls
- Zoom/reflow
- Reduced motion
- Screen-reader status
- Mobile

## 7.3 Screenshots

Commit and index at minimum:

```text
production-local home
legacy preference migration
personalised Today
Since your last visit
Watchlists CRUD
saved-search builder
saved-search history
Alert Centre
alert detail
daily brief
weekly review
brief source coverage
Backup & Storage
backup verification
retention preview
Operations
Privacy & Security
accessible chart alternative
Demo regression
mobile personalised Today
mobile Alert Centre
mobile brief
```

Do not mark a screenshot criterion PASS when the screenshot is absent.

---

# 8. Performance closure

Update `performance:check` to measure:

```text
personalised Today
alerts list/filter
watchlists list
watchlist detail
saved-search execution
brief detail
since-last-visit
Operations
full production-local startup
```

Requirements:

- Real code paths
- p50/p95
- Build before bundle checks
- Actual gzip sizes
- Machine-readable artifact
- Profile/hardware recorded
- Proportional profile explicitly yields `DEVIATION`
- Full profile yields `PASS` only when actually run
- No unrelated criterion cites performance as its evidence

A proportional-profile deviation is accepted for M6 closure if:

- It is clearly marked `DEVIATION`.
- Every required path is measured.
- No measured target regresses materially.
- The full-scale profile remains documented for future verification.

---

# 9. Completion-report integrity

Rebuild:

```text
docs/milestones/M6_COMPLETION_REPORT.md
```

Requirements:

- Retain all 236 controlling criteria.
- Use criterion-specific evidence.
- Use statuses:
  - `PASS`
  - `DEVIATION`
  - `NOT APPLICABLE`
  - `NOT RUN`
  - `BLOCKED`
- Required criteria cannot close as `NOT RUN` or `BLOCKED`.
- Do not mark a missing UI/screenshot PASS.
- Do not cite an unrelated command.
- Link exact test names, files, routes, screenshots, workflow runs, and measurements.
- Preserve prior remediation history.
- State the report-parent commit.
- The handoff remains authoritative for the pushed report-tip hash.

Add a concise deviations section covering only genuine deviations.

---

# 10. Required E2E coverage

Add desktop and mobile tests for:

```text
Live legacy migration
watchlist create/rename/archive
add/remove watched item
saved-search create/run/history
alert filter and state transitions
brief current/history/export
since-last-visit filters
reading/dismiss/mute controls
backup create/verify/prune UI
Operations and diagnostic bundle
privacy/security settings
browser notification preference
session/CSRF retry
Demo regression
```

Run on the final implementation commit:

```text
pnpm test:e2e
```

Report pass/skip/fail counts and reasons.

---

# 11. Required final gates

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

pnpm accessibility:audit
pnpm performance:check
pnpm security:check
pnpm ci:quality
```

Then push and obtain all five green CI jobs at the report tip.

---

# 12. Acceptance checklist

## A. Branch and boundaries

- [ ] A1. Work continues from exact tip `7d309bd73cdb870c731df8d0de947ec885493e31`.
- [ ] A2. Historical M6 commits/reports remain intact.
- [ ] A3. No M7 branch, config, binding, or deployment exists.
- [ ] A4. Live/Demo and all M1–M5 boundaries remain intact.

## B. Live personalisation integration

- [ ] B1. Live Follow/Unfollow no longer uses browser `followedIds` as source of truth.
- [ ] B2. Live visits no longer use browser `lastVisitAt` as source of truth.
- [ ] B3. Meaningful Live personalisation uses SQLite APIs.
- [ ] B4. Cosmetic/Demo/legacy browser state remains correctly isolated.
- [ ] B5. Legacy migration UI is complete and idempotent.

## C. User-facing M6 surfaces

- [ ] C1. Personalised Today contains all required sections.
- [ ] C2. Watchlist CRUD and bulk actions work.
- [ ] C3. Saved-search builder, run, history, and settings work.
- [ ] C4. Alert Centre and alert detail work.
- [ ] C5. Daily/weekly briefing current/history/export work.
- [ ] C6. Since-last-visit detail and filters work.
- [ ] C7. Reading/dismiss/mute controls work across required surfaces.
- [ ] C8. Backup & Storage workflow works.
- [ ] C9. Operations workflow works.
- [ ] C10. Privacy/Security and browser-notification settings work.
- [ ] C11. All workflows are directly navigable and deep-linkable.
- [ ] C12. Desktop/mobile E2E covers the workflows.

## D. Restore completeness

- [ ] D1. Restore stages and restores eligible creator documents.
- [ ] D2. `portable_full` restores permitted referenced official raw objects.
- [ ] D3. DB and filesystem payloads are consistency checked.
- [ ] D4. Filesystem rollback works on injected failure.
- [ ] D5. Actual durable re-sync/rebuild jobs are enqueued.
- [ ] D6. Restore tests exercise production failure paths.
- [ ] D7. Older-schema migration is executed in the temporary target.
- [ ] D8. Pre-restore checkpoint is verified through the real path.

## E. Accessibility, screenshots, and performance

- [ ] E1. Axe scans actual M6 pages rather than adjacent substitutes.
- [ ] E2. Manual accessibility evidence covers actual M6 workflows.
- [ ] E3. All required M6 screenshots are committed and indexed.
- [ ] E4. Every required performance path is measured.
- [ ] E5. Full production startup is measured.
- [ ] E6. Gzip bundle budgets are measured.
- [ ] E7. Proportional scale is reported as `DEVIATION`, not `PASS`.
- [ ] E8. `accessibility:audit` and `performance:check` pass with honest status.

## F. Report and CI

- [ ] F1. All 236 criteria remain in the report.
- [ ] F2. Evidence is criterion-specific.
- [ ] F3. Missing evidence is not marked PASS.
- [ ] F4. Genuine deviations are marked `DEVIATION`.
- [ ] F5. Final local gates pass.
- [ ] F6. All five CI jobs are green at the report tip.
- [ ] F7. Exact handoff tip is reported without a self-reference loop.
- [ ] F8. M7 remains explicitly unstarted.

---

# 13. Completion report addendum

The final report must additionally include:

- UI route/page inventory
- Live-versus-browser state migration table
- M6 screenshot index
- Restore document/raw test results
- Durable re-sync job evidence
- Actual performance measurements and deviation
- Criterion-evidence audit summary
- Final E2E counts
- Five CI run links
- Exact implementation-complete commit
- Report parent commit
- Handoff-tip convention
- Explicit M7-not-started statement

---

# 14. Consult the project manager only when

Consult early only if:

- A required M6 workflow cannot be made user-facing without a material product decision.
- Restoring user documents/raw objects cannot be made rollback-capable after documented attempts.
- Current platform policy prevents a required archive/restore action.
- A real accessibility conflict needs a product-design decision.
- Two controlling M6 requirements are genuinely incompatible.
- A proposed solution requires M7 work.

Do not consult for:

- Route names
- Component layout
- API client functions
- E2E fixtures
- Screenshot capture
- Report evidence wording
- Normal UI refactors
- Backup test injection
- Performance instrumentation

---

# 15. Stop rule

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

# 16. Authorised remediation instruction

> **M6 REMEDIATION III AUTHORISED; M7 WITHHELD:** Continue Healthspan Dashboard Milestone 6 from exact tip `7d309bd73cdb870c731df8d0de947ec885493e31` on `milestone-6/personalisation-production-hardening`. Preserve the accepted Remediation II backup, security, CI, E2E, accessibility, and performance work, then complete the missing user-facing M6 product surfaces and connect all meaningful Live personalisation to SQLite rather than legacy browser state. Implement first-class Watchlists, Saved Searches, Alert Centre, Briefings, Since Your Last Visit, reading/mute controls, legacy migration, Backup & Storage, Operations, Privacy/Security, and browser-notification workflows; complete document/raw restoration and durable post-restore re-sync jobs; replace simulated restore checks with production-path failure injection; scan and capture the actual M6 workflows; measure every required performance path; and rebuild the 236-row report with criterion-specific evidence. Push the remediated M6 branch, report the exact handoff tip and results, and stop. Do not create or begin Milestone 7.
