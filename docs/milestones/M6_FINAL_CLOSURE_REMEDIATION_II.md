# Healthspan Dashboard — M6 Final Closure Remediation II

**Status:** **M6 CLOSURE REJECTED — FINAL REMEDIATION AUTHORISED**  
**Milestone 7 status:** **WITHHELD / NOT AUTHORISED**  
**Repository:** `Smellybum1/Healthspan-Dashboard`  
**Branch:** `milestone-6/personalisation-production-hardening`  
**Exact remediation base:** `8c96123aed8009afc376614027b037c157c06e3b`  
**Prior remediation feature-complete commit:** `7853708edce228c53a49e374d602ee4012e81b95`  
**Controlling M6 brief:** `docs/milestones/healthspan_dashboard_milestone_6_execution_brief.md`  
**Controlling M6 brief SHA-256:** `f78eeb73b7e735c9ce24103b99de617a94951101133ce010c3401667a8355118`  
**First remediation brief:** `docs/milestones/M6_CLOSURE_REMEDIATION.md`  
**First remediation brief SHA-256:** `09adfc9904f8fa6bc4a67b011f8b06aa1f9ae5e7bc5ce6ea4cdcd766aa269e58`  
**Execution agent:** Grok in Cursor  
**Stop point:** Close M6 honestly, push the branch, provide the exact handoff tip and evidence, and stop. Do not create or begin Milestone 7.

---

# 1. Controlling decision

Continue on:

```text
milestone-6/personalisation-production-hardening
```

from exact commit:

```text
8c96123aed8009afc376614027b037c157c06e3b
```

Do not create a new branch unless Git repair makes continuation technically impossible.

Do not add:

```text
milestone-7/*
.openai/hosting.json
D1
R2
Wrangler
Sites deployment
hosted authentication
hosted scheduling
public deployment
personal-health functionality
```

This packet contains only closure work already required by the controlling M6 brief and the first remediation brief. It adds no M7 scope.

---

# 2. Why M6 remains open

The second closure submission cannot be accepted because:

1. The exact-tip GitHub Actions run failed in all five jobs.
2. The committed completion report marks `pnpm test:e2e` as `NOT RUN`.
3. The report marks required screenshots as passed while stating they were deferred.
4. The report names an earlier commit as the final branch tip; the handoff identifies a later tip.
5. The backup archive builder reads the database and all included files into memory rather than using a streaming or bounded archive path.
6. The archive reader does not enforce the controlling file-count, compressed-size, or uncompressed-size limits.
7. Portable backups do not include eligible user-owned creator document files.
8. `portable_full` walks the entire raw directory instead of including only permitted referenced official immutable raw objects.
9. The manifest is not independently checksum-covered in unencrypted recovery archives.
10. Restore accepts a command-line passphrase and the CLI asserts an exclusive lock without acquiring/verifying one.
11. Temporary restore schema migration and compatibility handling are incomplete.
12. The backup evaluation reaches its numeric minimum by adding forty trivial SHA-length cases rather than exercising the required restore, rollback, archive-limit, document, and policy cases.
13. The security evaluation consists mainly of helper checks and repeated synthetic cases rather than end-to-end requests against the real Hono middleware.
14. The accessibility command is a static source scan with always-true padded cases; it does not run axe/Playwright against critical pages.
15. The performance command reports hard-coded proxy p95 values rather than measuring the generated-scale application.
16. The performance budgets differ materially from the controlling M6 targets without a measured, documented exception.
17. The completion report provides generic repeated evidence text rather than criterion-specific evidence for many rows.

These are release blockers, not optional M7 work.

---

# 3. Required remediation sequence

Complete in this order:

```text
A. Repair frozen-lockfile CI installation
B. Make all five CI jobs green at one implementation commit
C. Complete backup/archive/restore correctness
D. Replace padded evaluations with substantive cases
E. Complete real HTTP integration security tests
F. Complete real accessibility and performance gates
G. Run local E2E on the final implementation
H. Commit required screenshot evidence
I. Rebuild the criterion-specific completion report
J. Push one report commit and provide the exact branch tip in the handoff
```

Use a distinct implementation-complete commit before the report-only commit.

Recommended implementation commit message:

```text
Complete M6 final closure gates
```

Recommended report commit message:

```text
Record verified M6 official closure
```

---

# 4. CI and lockfile closure

## 4.1 Frozen lockfile

The exact-tip CI currently fails during:

```text
pnpm install --frozen-lockfile
```

Required:

- Regenerate `pnpm-lock.yaml` using the pinned `pnpm@11.6.0`.
- Verify a clean install from a fresh checkout on Node 24.
- Do not use `--no-frozen-lockfile` in CI.
- Do not weaken workspace/package integrity.
- Ensure all workspace package manifests and the lockfile agree.
- Do not commit generated `node_modules`, caches, backups, databases, or Playwright browser binaries.

## 4.2 Required CI jobs

At one implementation commit, all must be green:

```text
Quality — Ubuntu
Quality — Windows
E2E — Ubuntu Chromium
Security & supply chain
Doctors/evaluations
```

Required:

- Full-SHA-pinned third-party actions
- Least permissions
- Timeouts
- Node 24
- pnpm 11.6.0
- Frozen lockfile
- E2E browser installation
- No live credentials
- No `continue-on-error` on a required gate
- SBOM required, not advisory
- All prior and M6 evaluations/doctors

Record workflow-run links and commit SHA in the completion report.

Warnings about the JavaScript runtime used internally by a pinned GitHub Action may be documented, but the application/test runtime must remain Node 24.

---

# 5. Local E2E gate

Run on the final implementation commit:

```text
pnpm test:e2e
```

Requirements:

- Execute the supported desktop and mobile projects.
- Record passed, skipped, and failed counts.
- Explain every skip.
- Add coverage for the remediated browser-security bootstrap:
  - session bootstrap
  - CSRF-bearing mutation
  - expired/restarted session recovery
  - Origin rejection
- Add coverage for backup/operations UI where browser-facing controls exist.
- Add accessibility assertions to critical new workflows.
- Do not reuse an earlier-tip result as the final-tip gate.

A final M6 report cannot mark M6 complete while this command is `NOT RUN`.

---

# 6. Backup archive and restore closure

## 6.1 Bounded/streaming creation

Replace the all-files-in-memory ZIP path with a streaming or explicitly bounded archive implementation.

Required:

- Stream the SQLite snapshot into the archive or enforce a strict per-entry and total-memory bound.
- Stream optional documents/raw objects.
- Atomic temporary output and rename.
- File-count cap.
- Maximum individual uncompressed size.
- Maximum total uncompressed size.
- Maximum compressed archive size.
- Compression-ratio/bomb guard.
- Configurable safe defaults.
- Clear capped/failure result.
- Temporary cleanup after interruption.

Do not accept a design that passes only because the current development database is small.

## 6.2 Archive format integrity

The archive must authenticate or verify:

```text
header
manifest
checksums file
every payload
```

For encrypted portable backups, AES-GCM must authenticate the full encoded archive and versioned header metadata.

For unencrypted recovery checkpoints:

- Include the manifest hash in an independently verified location.
- Include `manifest.json` in checksum validation or use an equivalent authenticated envelope.
- Detect manifest tampering.

Validate:

- Duplicate archive paths
- Unknown required paths
- Missing database
- Invalid UTF-8 path
- Central/local ZIP inconsistencies
- CRC/hash mismatch
- Truncated entries
- Unsupported compression/method
- Unsupported format version

## 6.3 Creator documents

For `portable_core` and `portable_full`, include eligible current user-owned/authorised creator document files when:

```text
HEALTHSPAN_BACKUP_INCLUDE_USER_DOCUMENTS=true
```

Requirements:

- Include only documents whose rights/lifecycle policy permits backup.
- Preserve archive-relative storage keys.
- Exclude deleted/purged/ineligible documents.
- Verify file hashes against DB metadata.
- Report missing document files.
- Restore included files.
- Mark excluded documents and dependent claims appropriately.
- Test replacement and deletion states.

## 6.4 Official raw snapshots

`portable_full` may include only:

- Official immutable raw source snapshots
- Referenced by retained source-record versions
- Allowed by source policy

Do not include:

- Unreferenced entire raw directory
- YouTube/X raw payloads
- Restricted platform text
- Temp files
- Unknown files

Build a dependency manifest and test missing referenced raw objects.

## 6.5 Passphrase handling

Do not require or recommend passing a portable-backup passphrase as a visible command-line argument.

Support secure acquisition through one or more of:

```text
interactive hidden prompt
stdin
short-lived inherited file descriptor
explicit test-only environment variable
```

Requirements:

- Confirmation during backup creation.
- No echo.
- No persistence.
- No log/diagnostic inclusion.
- Test-only input path is clearly isolated.
- Backward-compatible `--passphrase` may be removed or explicitly deprecated; it cannot be the documented normal path.

## 6.6 Exclusive restore lock

The restore CLI must not set a force flag and then claim an exclusive lock without proving it.

Implement one of:

- An application-wide filesystem lock with stale-lock recovery, or
- A verified server/worker shutdown protocol plus an exclusive DB lock.

Required:

- Refuse when the API/worker owns the active lock.
- Refuse concurrent backup/migration/restore.
- Windows-safe lock behavior.
- Test stale lock.
- Test concurrent restore refusal.
- Do not rely only on a Boolean function argument.

## 6.7 Schema compatibility and temporary migration

Before swapping:

- Read source schema version.
- Reject unsupported future schema.
- Migrate an older supported snapshot in the temporary target.
- Create a recovery checkpoint before migration/swap.
- Run DB integrity and foreign-key checks.
- Run applicable domain doctors on the temporary target.
- Record migration result.
- Leave the active database untouched on preflight/migration failure.

## 6.8 Swap and rollback

Implement a Windows-safe rollback-capable replacement covering:

```text
.sqlite3
-wal
-shm
```

Requirements:

- Close all active handles.
- Preserve the active DB in a protected pre-restore location.
- Move/copy temporary target under a documented strategy.
- Verify restored DB.
- Roll back automatically on failure.
- Clean obsolete WAL/SHM safely.
- Preserve the pre-restore checkpoint.
- Record successful and failed restore history.

## 6.9 Backup evaluation corpus

The minimum 56 cases must be substantive.

Required named cases include at least:

```text
online-backup-with-active-wal
recovery-checkpoint
portable-core
portable-full
creator-document-included
creator-document-excluded
deleted-document-excluded
referenced-raw-included
unreferenced-raw-excluded
x-text-excluded
platform-tombstone-safe
manifest-tamper
checksums-tamper
ciphertext-tamper
wrong-passphrase
truncated-header
truncated-entry
duplicate-path
path-traversal
absolute-path
drive-letter-path
file-count-limit
entry-size-limit
total-size-limit
compression-ratio-limit
missing-database
missing-manifest
unsupported-version
unknown-compression
corrupt-sqlite
foreign-key-failure
future-schema-rejected
older-schema-migrated-in-temp
exclusive-lock-required
concurrent-restore-refused
stale-lock-recovery
pre-restore-checkpoint
restore-success
post-swap-failure-rollback
interrupted-create-cleanup
interrupted-restore-cleanup
prune-protects-newest
prune-protects-pre-restore
dry-run-restore
idempotent-verify
secret-exclusion
absolute-path-redaction
diagnostic-exclusion
source-resync-scheduled
document-resync-state
portable-unencrypted-warning
secure-passphrase-input
recovery-manifest-integrity
archive-sha-recorded
restore-history-recorded
temporary-files-removed
```

Do not pad the corpus with repeated hash-length assertions.

Required commands:

```text
pnpm backup:eval
pnpm backup:doctor
pnpm backup:create
pnpm backup:verify -- --input <fixture-archive>
pnpm backup:restore -- --input <fixture-archive> --dry-run
```

Use isolated temporary data.

---

# 7. Real HTTP security integration

## 7.1 Test the Hono application, not only helpers

Create integration tests against `createApp()` or a security-focused test harness using the same middleware.

Required cases:

- Session cookie attributes
- Valid CSRF mutation
- Missing CSRF
- Wrong CSRF
- Unknown session
- Expired session
- Session rotation after restart
- `Origin: null`
- Missing Origin for browser mutation
- Allowed production origin
- Allowed configured development origin
- Evil origin
- DNS-rebinding Host
- IPv4 loopback Host
- `localhost`
- IPv6 loopback `[::1]`
- Disallowed Host
- Remote bind without token
- Remote bind with short token
- Remote bind with valid token
- Read protection in remote mode
- Mutation protection in remote mode
- Fetch Metadata cross-site
- Fetch Metadata same-origin
- CORS preflight
- No wildcard origin
- JSON body limit
- upload body limit
- diagnostic/backup rate bucket
- session rate bucket
- mutation rate bucket
- heavy-read bucket
- ordinary-read bucket
- retry metadata
- CSP
- `nosniff`
- frame prevention
- referrer policy
- `javascript:` URL rejection
- source-text XSS rendering
- saved-search injection
- import path traversal
- backup path traversal
- secret redaction
- passphrase redaction
- diagnostic privacy
- API error request ID
- `/api` error stays JSON
- no local path in health/operations

The corpus must have at least 48 materially distinct cases; repeated hostname loops do not satisfy the corpus by themselves.

## 7.2 Host parsing

Use a URL/authority parser that correctly handles:

```text
127.0.0.1:8787
localhost:8787
[::1]:8787
```

Do not parse IPv6 with a naïve `split(':')[0]`.

## 7.3 Configured allowlists

Use validated environment configuration for:

```text
HEALTHSPAN_ALLOWED_HOSTS
HEALTHSPAN_ALLOWED_ORIGINS
```

Do not rely only on hard-coded values.

Development and production policies remain distinct.

## 7.4 Body and upload controls

Enforce before material allocation where practical:

- JSON maximum
- personalisation import maximum
- creator document maximum
- diagnostic creation rate
- backup creation rate
- unsupported content encoding rejection

## 7.5 Security command

`pnpm security:check` must run:

- Helper unit tests
- Hono integration tests
- Header tests
- import/archive adversarial tests
- secret/log/diagnostic checks

It must not pass solely through a short standalone script.

---

# 8. Accessibility closure

## 8.1 Automated browser audit

Use Playwright plus axe-core or an equivalent browser accessibility engine.

Run against at least 24 substantive states covering:

```text
Live Today
Demo Today
Watchlists
Watchlist detail
Saved-search builder
Saved-search history
Alert Centre
Alert detail
Daily brief
Weekly review
Since last visit
Settings
Backup & Storage
Operations
Security/Privacy
Interventions
Peptides
Trials
Research
Creators
Creator Claims
Review Queue
Regulatory & Safety
Mobile navigation
```

Requirements:

- No serious or critical violations.
- Record page/state and violations.
- Do not replace browser scans with source-regex hints.
- Do not add always-true padding cases.

## 8.2 Manual evidence

Complete and commit evidence for:

- Keyboard-only navigation
- Skip link
- Focus visible/not obscured
- Dialog focus trap/restore
- Upload flow
- Watchlist flow
- Saved-search flow
- Alert state flow
- Brief navigation
- Backup creation/verification
- Charts with table/text alternatives
- 200% zoom
- Applicable 400% reflow
- Reduced motion
- Screen-reader names/live regions
- Touch targets
- Contrast
- Dark/light themes
- Mobile orientation

Do not claim formal WCAG certification.

## 8.3 Final command

```text
pnpm accessibility:audit
```

The command must run actual browser scans or invoke the tested suite; it cannot be a static source linter only.

---

# 9. Performance closure

## 9.1 Generated-scale data

Generate the controlling M6 scale in a temporary database:

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

A documented proportional profile may be used only when local resource limits prevent the full profile, and the report must mark the deviation rather than claim full-scale PASS.

## 9.2 Actual measurement

Measure real code paths repeatedly and report p50/p95:

```text
personalised Today
alerts list
watchlists list
watchlist detail
saved-search execution
brief detail
since-last-visit
Operations overview
production startup
```

Do not use hard-coded placeholder values.

## 9.3 Bundle budgets

Measure gzip sizes, not uncompressed largest-file proxies.

Controlling starting targets:

```text
initial JS gzip <= 450 KiB
individual lazy route chunk gzip <= 300 KiB
initial CSS gzip <= 80 KiB
```

A deviation requires:

- Actual measured number
- User impact
- Reason
- Mitigation
- Explicit status `DEVIATION`, not silent PASS

Do not skip bundle checks when `dist` is missing; build first or fail.

## 9.4 Final command

```text
pnpm performance:check
```

It must generate/load fixtures, run measurements, enforce budgets, and write a machine-readable result artifact.

---

# 10. Completion-report and screenshot closure

## 10.1 Criterion evidence

Retain all 236 controlling M6 criteria.

Every row must use criterion-specific evidence such as:

```text
file/path
test name
command/result
screenshot
workflow run
measured value
```

Do not reuse one generic sentence for nearly every criterion.

Permitted statuses:

```text
PASS
NOT APPLICABLE
NOT RUN
BLOCKED
DEVIATION
```

M6 cannot close with `NOT RUN` or `BLOCKED` on a required criterion.

## 10.2 Screenshots

Commit the required M6 screenshots or a clearly indexed equivalent evidence set for every required surface.

At minimum include:

- Production-local home
- Legacy preference migration
- Personalised Today
- Since last visit
- Watchlists
- Saved-search builder/history
- Alert Centre
- Alert detail
- Daily brief
- Weekly review
- Source coverage
- Backup & Storage
- Backup verification
- Retention preview
- Operations
- Security/Privacy
- Accessible chart alternative
- Demo regression
- Mobile Today
- Mobile Alert Centre/brief

Do not mark screenshots PASS while saying they were deferred.

## 10.3 Hash reporting without self-reference

The committed report must contain:

- Exact base
- Entry gate
- Original implementation commit
- Remediation I base/feature commit
- Remediation II base
- Final implementation-complete commit
- Report-content parent commit where known

The handoff message—not the file itself—is authoritative for the exact pushed report commit/branch tip, because a commit cannot contain its own hash.

State this explicitly to prevent another self-referential pointer loop.

Do not add repeated “point final HEAD” commits solely to place a parent hash into the report.

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

Then push and require the five GitHub Actions jobs to complete successfully on that commit or the report commit without implementation changes.

If the report commit changes only Markdown/screenshots, a green run on the report commit is still required because the frozen-lockfile installation and documentation integrity checks are repository-tip gates.

---

# 12. Acceptance checklist

## A. Branch and truth

- [ ] A1. Work continues from exact tip `8c96123aed8009afc376614027b037c157c06e3b`.
- [ ] A2. No M7 branch or implementation exists.
- [ ] A3. Historical M6 reports/commits are preserved.
- [ ] A4. Final implementation and report hashes are distinguished.
- [ ] A5. The handoff reports the exact pushed tip without a self-referential pointer loop.

## B. CI and E2E

- [ ] B1. Frozen-lockfile install passes on Ubuntu.
- [ ] B2. Frozen-lockfile install passes on Windows.
- [ ] B3. Quality — Ubuntu is green.
- [ ] B4. Quality — Windows is green.
- [ ] B5. E2E — Ubuntu Chromium is green.
- [ ] B6. Security & supply chain is green.
- [ ] B7. Doctors/evaluations is green.
- [ ] B8. Local final-tip E2E passes with counts/skips reported.
- [ ] B9. Required E2E security-bootstrap cases pass.
- [ ] B10. No required CI step uses `continue-on-error`.

## C. Backup and restore

- [ ] C1. Archive creation is streaming or strictly bounded.
- [ ] C2. File-count and byte limits are enforced.
- [ ] C3. Compression-bomb protection works.
- [ ] C4. Manifest integrity is verified, including unencrypted recovery checkpoints.
- [ ] C5. Duplicate/unsafe/unknown archive structures fail closed.
- [ ] C6. Eligible user-owned documents are included and restored.
- [ ] C7. Deleted/ineligible documents are excluded.
- [ ] C8. Only referenced permitted official raw objects enter `portable_full`.
- [ ] C9. X/restricted platform content remains excluded.
- [ ] C10. Passphrase normal flow is not exposed through process arguments.
- [ ] C11. A real exclusive restore lock is acquired/verified.
- [ ] C12. Concurrent restore is refused.
- [ ] C13. Older supported schema migrates in the temporary target.
- [ ] C14. Future schema is rejected.
- [ ] C15. SQLite/WAL/SHM replacement is Windows-safe.
- [ ] C16. Post-swap failure rolls back automatically.
- [ ] C17. Pre-restore checkpoint is protected.
- [ ] C18. Restore schedules required re-sync.
- [ ] C19. Backup evaluation contains at least 56 substantive cases.
- [ ] C20. No trivial padding is used to meet the corpus number.
- [ ] C21. `backup:eval` passes.
- [ ] C22. `backup:doctor` passes.
- [ ] C23. Create/verify/dry-run restore commands pass on isolated data.

## D. Security

- [ ] D1. Security tests exercise the actual Hono middleware.
- [ ] D2. CSRF/session lifecycle integration passes.
- [ ] D3. `Origin: null` and cross-site mutations fail.
- [ ] D4. Missing browser Origin fails while classified direct service use remains supported.
- [ ] D5. IPv4/localhost/IPv6 Host parsing is correct.
- [ ] D6. DNS-rebinding Host values fail.
- [ ] D7. Environment Host/Origin allowlists are validated and used.
- [ ] D8. Remote mode protects reads and writes with a strong token.
- [ ] D9. Fetch Metadata integration passes.
- [ ] D10. Separate rate buckets are enforced.
- [ ] D11. JSON/upload/import/backup limits are enforced.
- [ ] D12. CSP and other security headers pass.
- [ ] D13. Error responses include safe request IDs.
- [ ] D14. At least 48 materially distinct security cases pass.
- [ ] D15. `security:check` passes.

## E. Accessibility

- [ ] E1. Playwright/axe or equivalent runs on critical pages.
- [ ] E2. At least 24 substantive page/workflow states are scanned.
- [ ] E3. No serious/critical automated violations remain.
- [ ] E4. Manual keyboard/focus/dialog evidence is recorded.
- [ ] E5. Zoom/reflow/reduced-motion evidence is recorded.
- [ ] E6. Chart text/table alternatives are verified.
- [ ] E7. Mobile and screen-reader status behavior is verified.
- [ ] E8. No always-true padding cases remain.
- [ ] E9. `accessibility:audit` passes.

## F. Performance

- [ ] F1. Generated-scale dataset is created and documented.
- [ ] F2. Real application code paths are measured.
- [ ] F3. p50/p95 values are measured, not hard-coded.
- [ ] F4. Production startup is measured.
- [ ] F5. Gzip bundle sizes are measured.
- [ ] F6. Controlling budgets pass or each exception is marked `DEVIATION`.
- [ ] F7. Missing build output fails the gate.
- [ ] F8. `performance:check` passes.

## G. Report and evidence

- [ ] G1. All 236 controlling criteria remain present.
- [ ] G2. Required criteria contain no `NOT RUN` or `BLOCKED`.
- [ ] G3. Evidence is criterion-specific.
- [ ] G4. Required screenshots are committed and indexed.
- [ ] G5. CI run links are recorded.
- [ ] G6. Exact local command outputs/counts are recorded.
- [ ] G7. Known limitations are honest.
- [ ] G8. M7 is explicitly unstarted.

## H. Final regression

- [ ] H1. Format/lint/typecheck/unit/E2E/build pass.
- [ ] H2. Every prior doctor/evaluation passes.
- [ ] H3. Every M6 doctor/evaluation passes.
- [ ] H4. Live/Demo remain separate.
- [ ] H5. No personal-health, dosing, vendor, ranking, or hosted feature is added.
- [ ] H6. Branch is pushed and exact handoff tip is reported.
- [ ] H7. M7 remains withheld.

---

# 13. Completion report update

Update:

```text
docs/milestones/M6_COMPLETION_REPORT.md
```

Add a remediation-II section containing:

- Exact base `8c96123aed8009afc376614027b037c157c06e3b`
- Final remediation-II implementation commit
- Report commit parent
- Exact local E2E result
- Five green CI run links
- Backup architecture changes
- Real backup corpus results
- Security integration results
- Accessibility browser/manual results
- Performance measurements
- Screenshot index
- Corrected criterion-specific evidence
- Any explicit deviations
- Statement that the exact pushed tip is supplied in the handoff because the report cannot contain its own commit hash

Do not delete the previous challenge/remediation history.

---

# 14. Consult the project manager only when

Consult early only when:

- A Windows-safe rollback-capable restore cannot be implemented after documented attempts.
- Current platform policy prevents a required backup inclusion/exclusion rule.
- A required GitHub Action cannot run on Node 24 without replacing it.
- A genuine accessibility conflict requires a product-design decision.
- Full-scale performance fixtures cannot run on supported hardware and a proportional profile needs approval.
- Two controlling M6 requirements are genuinely incompatible.
- A proposed fix would require M7 work.

Do not consult for:

- Lockfile regeneration
- Routine package additions
- Archive library choice
- Test-fixture construction
- CI YAML repairs
- E2E debugging
- Accessibility fixes
- Performance optimization
- Report wording
- Screenshot capture

---

# 15. Stop rule

After all gates pass:

1. Commit implementation.
2. Run every required local gate.
3. Push and obtain green GitHub Actions.
4. Commit the final report/screenshots.
5. Push again and ensure required CI remains green.
6. Report the exact pushed tip in the handoff.
7. Stop.

Do not create or begin Milestone 7.

---

# 16. Authorised remediation instruction

> **M6 FINAL REMEDIATION AUTHORISED; M7 WITHHELD:** Continue Healthspan Dashboard Milestone 6 from exact tip `8c96123aed8009afc376614027b037c157c06e3b` on `milestone-6/personalisation-production-hardening`. Repair the frozen-lockfile CI failure and make all five required GitHub Actions jobs green; run E2E on the final implementation; complete bounded/streaming, manifest-authenticated, document-aware backup archives and a genuinely locked, schema-aware, rollback-capable restore; replace padded backup, security, accessibility, and performance checks with substantive integration/browser/generated-scale evidence; commit the required screenshots; and rebuild the 236-row completion report with criterion-specific evidence. Preserve every M1–M5 boundary and all historical reports. Push the remediated M6 branch, report the exact handoff tip and results, and stop. Do not create or begin Milestone 7.
