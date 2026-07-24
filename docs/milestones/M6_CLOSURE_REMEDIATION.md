# Healthspan Dashboard — Milestone 6 Official-Brief Closure Remediation

**Status:** **M6 CLOSURE CHALLENGED — REMEDIATION AUTHORISED**  
**Milestone 7 status:** **WITHHELD / NOT AUTHORISED**  
**Repository:** `Smellybum1/Healthspan-Dashboard`  
**Branch:** `milestone-6/personalisation-production-hardening`  
**Exact remediation base:** `40540025f468fdefbf018ded9b9dbb4f1b00de2d`  
**Controlling M6 brief:** `docs/milestones/healthspan_dashboard_milestone_6_execution_brief.md`  
**Controlling brief SHA-256:** `f78eeb73b7e735c9ce24103b99de617a94951101133ce010c3401667a8355118`  
**Execution agent:** Grok in Cursor  
**Stop point:** Close M6 honestly, push the branch, report the final hash and exact evidence, and stop. Do not create or begin Milestone 7.

---

## 1. Controlling decision

The delivery at `40540025f468fdefbf018ded9b9dbb4f1b00de2d` is not accepted as complete against the controlling M6 brief.

Continue on:

```text
milestone-6/personalisation-production-hardening
```

from exact tip:

```text
40540025f468fdefbf018ded9b9dbb4f1b00de2d
```

Do not create a new M7 branch.

Do not add Sites, `.openai/hosting.json`, D1, R2, hosted authentication, hosted scheduling, public deployment, or any other M7 work.

This remediation is limited to satisfying the existing M6 brief. It does not add new M6 scope.

---

## 2. Why closure is challenged

The committed M6 completion report does not contain the required one-row-per-acceptance-criterion checklist, full command evidence, backup/restore evidence, accessibility evidence, performance evidence, security evidence, CI evidence, or required screenshots.

The repository also contains material implementation gaps against the brief:

1. The backup implementation creates a JSON metadata envelope rather than a restorable `.healthspan-backup` containing a consistent SQLite snapshot.
2. Portable backup encryption, scrypt KDF, authenticated archive format, full verification, pruning, and conservative restore are absent.
3. There is no `backup:restore` command.
4. The local HTTP boundary has no implemented request-integrity session and CSRF token flow.
5. `null` or missing Origin is accepted by the shared origin helper, contrary to the mutation policy.
6. Required M6 evaluation/security/accessibility/performance commands are absent from root scripts.
7. CI does not implement the required job separation, E2E job, complete security/supply-chain job, doctor/evaluation job, or full-SHA action pinning.
8. SBOM is allowed to fail in CI.
9. The completion-report hashes do not consistently identify the feature-complete commit and final branch tip.
10. The report records the backup as a “JSON envelope + restore preflight,” which is materially below the controlling brief’s backup and restore contract.

These are release blockers, not optional technical debt.

---

# 3. Required remediation order

Complete work in this order:

```text
A. Correct report and branch-hash truth
B. Backup, verification, restore, and retention
C. Browser request-integrity and local HTTP security
D. Missing M6 domain commands, evaluations, and doctors
E. Accessibility and performance gates
F. CI and supply-chain gates
G. Operations, retention, diagnostics, and production-runtime evidence
H. Full official acceptance checklist and final report
```

Use a distinct feature-complete remediation commit before any report-only wording commit.

---

# 4. Report and hash integrity

Update:

```text
docs/milestones/M6_COMPLETION_REPORT.md
ROADMAP.md
README.md
```

Required:

- Exact M6 base: `575489cf913812291f75266975e77c8953058968`
- Exact entry gate: `36a281015176ea73fc24fde6344bfc15bfe22308`
- Original first M6 implementation commit: `ae6419f3db2b4f4799970c7529822242cdae3197`
- Remediation feature-complete commit: fill only after implementation is committed
- Final branch tip: fill only after the final report commit exists

Do not call a parent commit the final branch tip.

Do not combine “Feature-complete / Final HEAD” in one field when they differ.

Preserve all historical reports and commits.

---

# 5. Backup architecture must meet the controlling brief

## 5.1 Backup tiers

Implement:

```text
recovery_checkpoint
portable_core
portable_full
```

## 5.2 Consistent SQLite snapshot

Use SQLite Online Backup API or a verified driver equivalent.

Prohibited:

```text
fs.readFileSync(liveDatabasePath)
ordinary copy of a live WAL database
hash-only metadata envelope
```

The backup must contain a restorable SQLite database snapshot.

## 5.3 Archive format

Use:

```text
*.healthspan-backup
```

Required inner structure:

```text
manifest.json
database/healthspan-dashboard.sqlite3
documents/...              # when included and permitted
raw/sha256/...             # portable_full, official immutable source objects only
checksums.json
```

Requirements:

- Streaming or bounded archive creation
- Atomic temporary-file rename
- Per-file SHA-256
- Manifest hash
- File-count cap
- Compressed/uncompressed byte caps
- Path traversal prevention
- Temporary cleanup
- Versioned format

## 5.4 Platform-aware sanitization

Sanitize the temporary SQLite copy, not the active database.

At minimum remove or redact:

- Browser request-integrity sessions
- CSRF/session tokens
- Transient job leases
- X current text
- Deleted/withheld platform text
- Restricted platform excerpts
- Platform raw API payloads
- Absolute paths
- Secret-like values
- Ineligible diagnostic/log payloads

Mark affected platform projections for re-sync and reassessment.

## 5.5 Encryption

Portable backups default to encrypted.

Implement:

```text
AES-256-GCM
random salt
random nonce
versioned scrypt parameters
authenticated header/metadata
```

Requirements:

- Passphrase confirmation
- No passphrase persistence
- No passphrase in logs or process arguments where avoidable
- Wrong-passphrase failure
- Tamper failure
- Explicit warning/flag for unencrypted portable backup
- No weak ZIP encryption

## 5.6 Verification

Implement:

```text
pnpm backup:verify -- --input <file>
```

Support:

- Manifest verification
- Full hash verification
- Decryption/authentication
- Database integrity
- Foreign-key checks
- Schema compatibility
- Platform-policy scrub checks
- Dry-run restore verification

## 5.7 Restore

Implement:

```text
pnpm backup:restore -- --input <file>
```

Required:

1. Require API/worker shutdown or exclusive lock.
2. Verify magic/version.
3. Obtain passphrase safely.
4. Validate archive paths and limits.
5. Validate hashes and authentication tag.
6. Extract to a temporary target.
7. Verify SQLite integrity and foreign keys.
8. Verify/migrate schema in the temporary target.
9. Run domain/platform doctors.
10. Create mandatory pre-restore recovery checkpoint.
11. Atomically swap or use a rollback-capable filesystem strategy.
12. Open and verify the restored database.
13. Restore the original data automatically if final verification fails.
14. Schedule source/platform re-sync for excluded data.
15. Record restore status without secrets.

No browser restore endpoint.

## 5.8 Backup schedule and pruning

Implement:

```text
daily recovery checkpoint: 02:30 Australia/Brisbane
pre-migration checkpoint
pre-restore checkpoint
portable backups: manual
```

Implement:

```text
pnpm backup:list
pnpm backup:prune
```

Protect:

- Newest successful recovery checkpoint
- Pre-restore checkpoint until restore succeeds
- Backups referenced by an active restore

## 5.9 Backup tests

Add at least the controlling brief’s 56-case backup/restore corpus, including:

- Live-WAL consistency
- Recovery/core/full
- Encryption
- Wrong passphrase
- Tamper
- Zip/path traversal
- Size caps
- Corrupt DB
- Foreign-key failure
- Interrupted creation
- Interrupted restore
- Atomic swap
- Rollback
- X/restricted content exclusion
- User-document inclusion/deletion
- Pruning protection
- Missing raw dependency

`backup:doctor` must inspect real backup invariants, not only manifest constants.

---

# 6. Request-integrity and local HTTP security

## 6.1 Session bootstrap

Implement:

```text
GET /api/session
```

It must:

- Set a cryptographically random HttpOnly cookie
- Use `SameSite=Strict`
- Use `Secure` when HTTPS
- Return a separate CSRF token
- Set a bounded expiry
- Rotate after API restart
- Contain no user identity
- Be excluded from backup/export

## 6.2 Mutation checks

Every browser mutation must require:

- Allowed Host
- Allowed Origin
- Fetch Metadata check where available
- Valid local request-integrity session
- Valid CSRF header
- Existing admin/local boundary
- Appropriate rate limit
- Zod input validation

## 6.3 Origin policy

Fix the origin helper:

- Missing Origin is permitted only for explicitly classified non-browser/direct service paths.
- `Origin: null` is denied for browser mutations.
- Disallowed cross-origin requests are denied.
- Development origins are explicit.
- Production is same-origin.
- No wildcard CORS.

## 6.4 Host and remote binding

- Enforce an exact configured Host allowlist.
- Reject DNS-rebinding-style Host values.
- Do not trust `X-Forwarded-*` by default.
- Remote bind requires:
  - `HEALTHSPAN_ALLOW_REMOTE_BIND=true`
  - strong remote access token
  - explicit host allowlist
- The old remote-admin flag alone is insufficient.
- Protect both reads and mutations when remote-bound.

## 6.5 Rate/body limits

Implement separate buckets for:

```text
ordinary reads
heavy reads/search
mutations
file uploads
diagnostic/backup creation
session bootstrap
```

Add explicit JSON, multipart, import, and archive limits.

## 6.6 Security headers

Implement and test an appropriate production policy including:

```text
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
frame-ancestors 'none'
base-uri 'none'
object-src 'none'
Permissions-Policy
Cross-Origin-Opener-Policy where compatible
```

Do not add HSTS to plain localhost HTTP.

## 6.7 Adversarial tests

Meet the controlling 48-case security corpus.

At minimum test:

- Missing/invalid CSRF
- Cross-site mutation
- `Origin: null`
- Unexpected Host
- DNS-rebinding Host
- Disallowed origin
- Remote bind without token
- Rate limit
- Oversized JSON/file
- `javascript:` URL
- Source/user-content XSS
- Saved-search injection
- Backup/import path traversal
- Secret and passphrase redaction
- Diagnostic privacy
- CSP/header policy

---

# 7. Missing commands and evaluations

Add every command required by the controlling brief:

```text
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

These commands must be substantive.

Do not implement several required evaluations as aliases to one shallow doctor.

Required corpora:

```text
watchlists/saved searches: at least 80 cases
reading/visits: at least 48 cases
alerts: at least 80 cases
briefings: at least 80 cases
export/import: at least 40 cases
backup/restore: at least 56 cases
security: at least 48 cases
accessibility states: at least 24
```

---

# 8. Accessibility closure

Target:

```text
WCAG 2.2 Level AA
```

Implement:

- Automated axe/Playwright checks
- No serious/critical violations on critical pages
- Keyboard-only critical workflows
- Visible, unobscured focus
- Dialog focus trap/restore
- Skip link and landmarks
- Screen-reader status announcements
- Chart text/table alternatives
- Colour-independent statuses
- Reduced motion
- 200% zoom
- Applicable 400% reflow
- Mobile orientation
- Touch target and contrast checks

Create/update:

```text
docs/accessibility/WCAG_2_2_AA_CHECKLIST.md
```

Run:

```text
pnpm accessibility:audit
```

Do not claim certification.

---

# 9. Performance closure

Create/update:

```text
docs/performance/PERFORMANCE_BUDGETS.md
```

Use generated local data at the controlling scale.

Measure and report:

- Personalised Today p95
- Alerts p95
- Watchlist/list p95
- Saved-search p95
- Brief detail p95
- Since-last-visit p95
- Operations p95
- Production startup
- Initial JS/CSS and lazy chunk sizes
- Backup streaming behavior

Run:

```text
pnpm performance:check
```

Document hardware, dataset, commands, and justified deviations.

---

# 10. CI and supply-chain closure

## 10.1 Required CI jobs

Create distinct jobs:

```text
Quality — Ubuntu
Quality — Windows
E2E — Ubuntu Chromium
Security & supply chain
Doctors/evaluations
```

## 10.2 Action pinning

Pin third-party GitHub Actions to full commit SHAs.

Do not use only:

```text
actions/checkout@v4
actions/setup-node@v4
pnpm/action-setup@v4
```

without a full SHA.

Use least permissions and job timeouts.

## 10.3 E2E

Run the supported Playwright Chromium E2E suite in CI.

Install the required browser deterministically.

## 10.4 Security and supply chain

Run:

- Frozen lockfile install
- Production dependency audit
- Registry signature audit where supported
- Secret scan
- SBOM
- Licence inventory
- Security tests

SBOM generation must not be `continue-on-error` when it is a required gate.

## 10.5 Doctors/evaluations

Run all prior and M6 doctors/evaluations in CI, with deterministic temp data and no live credentials.

---

# 11. Operations, retention, and diagnostics

Complete the controlling M6 requirements for:

- Rotating JSONL local logs
- Redaction
- Correlation IDs
- Bounded operational metrics
- Application startup/shutdown markers
- Unclean-shutdown recovery
- Storage inventory
- Retention preview/apply/report
- Protected-record rules
- SQLite optimize/checkpoint/integrity workflows
- Redacted local diagnostic bundle
- Operations workspace
- No external telemetry

Required documentation:

```text
docs/operations/BACKUP_AND_RESTORE.md
docs/operations/RETENTION.md
docs/operations/OBSERVABILITY.md
docs/operations/DIAGNOSTICS.md
docs/security/SECURITY_BASELINE.md
```

---

# 12. Completion report requirements

Replace the abbreviated completion report with the complete report required by the controlling brief.

It must include:

1. Executive summary
2. Exact base, entry-gate, remediation feature-complete, and final hashes
3. One row for every M6 acceptance criterion
4. Entry-gate evidence
5. Significant files/migrations
6. Runtime versions
7. Production-local design
8. Personalisation model
9. Alerts and briefs
10. Export/import
11. Backup tiers and exclusions
12. Encryption/KDF
13. Backup verification
14. Restore/rollback evidence
15. Platform scrub
16. Retention/operations
17. Request-integrity/security
18. Threat model
19. Dependency audit/signature/SBOM/licence
20. Accessibility automated and manual evidence
21. Performance dataset/hardware/results
22. CI matrix and actual results
23. Exact commands and counts
24. Every doctor/evaluation
25. Required screenshots
26. Known limitations
27. Deviations
28. Decisions required before M7
29. Explicit statement that M7 has not begun

The report must distinguish:

```text
PASS
NOT RUN
NOT APPLICABLE
BLOCKED
```

Do not mark an unrun gate as PASS.

---

# 13. Remediation acceptance checklist

## A. Truth and report

- [ ] A1. Work continues from exact tip `40540025f468fdefbf018ded9b9dbb4f1b00de2d`.
- [ ] A2. Historical commits/reports remain intact.
- [ ] A3. Feature-complete and final hashes are accurate and separate.
- [ ] A4. Full one-row M6 checklist is committed.
- [ ] A5. Required screenshots and exact command evidence are committed.

## B. Backup and restore

- [ ] B1. Real consistent SQLite snapshot is included.
- [ ] B2. No ordinary live-WAL file copy is used.
- [ ] B3. Recovery/core/full tiers work.
- [ ] B4. Platform-aware sanitizer works.
- [ ] B5. `.healthspan-backup` archive is versioned and bounded.
- [ ] B6. Per-file checksums and manifest hash work.
- [ ] B7. AES-256-GCM and versioned scrypt work.
- [ ] B8. Wrong passphrase and tamper fail.
- [ ] B9. Verification modes work.
- [ ] B10. CLI restore works.
- [ ] B11. Pre-restore checkpoint works.
- [ ] B12. Atomic swap/rollback works.
- [ ] B13. Pruning protects required backups.
- [ ] B14. Restricted platform content is absent.
- [ ] B15. Backup/restore corpus minimum passes.
- [ ] B16. `backup:doctor` validates real invariants.

## C. HTTP security

- [ ] C1. `/api/session` exists.
- [ ] C2. HttpOnly/SameSite session cookie works.
- [ ] C3. CSRF token is required for mutations.
- [ ] C4. `Origin: null` is denied for browser mutations.
- [ ] C5. Host allowlist and DNS-rebinding tests pass.
- [ ] C6. Fetch Metadata checks work.
- [ ] C7. Remote bind requires explicit token.
- [ ] C8. CORS has no wildcard.
- [ ] C9. Separate rate limits and body caps work.
- [ ] C10. CSP and required headers pass.
- [ ] C11. Security corpus minimum passes.
- [ ] C12. `security:check` passes.

## D. Commands/evaluations

- [ ] D1. All controlling M6 commands exist.
- [ ] D2. Personalisation evaluation corpus passes.
- [ ] D3. Alerts evaluation corpus passes.
- [ ] D4. Briefs evaluation corpus passes.
- [ ] D5. Export/import corpus passes.
- [ ] D6. Operations and retention commands work.
- [ ] D7. Diagnostics command produces a redacted bundle.

## E. Accessibility/performance

- [ ] E1. WCAG checklist exists.
- [ ] E2. Automated critical-page audit passes.
- [ ] E3. Manual critical-flow evidence is recorded.
- [ ] E4. Chart alternatives and keyboard flows pass.
- [ ] E5. Performance budgets document exists.
- [ ] E6. Generated-scale API tests run.
- [ ] E7. Bundle/startup budgets pass or have justified deviations.
- [ ] E8. `accessibility:audit` passes.
- [ ] E9. `performance:check` passes.

## F. CI/supply chain

- [ ] F1. Ubuntu quality job passes.
- [ ] F2. Windows quality job passes.
- [ ] F3. Ubuntu Chromium E2E job passes.
- [ ] F4. Security/supply-chain job passes.
- [ ] F5. Doctors/evaluations job passes.
- [ ] F6. Actions are pinned to full SHAs.
- [ ] F7. SBOM is not allowed to fail silently.
- [ ] F8. Dependency/signature/secret/licence checks pass.
- [ ] F9. `ci:quality` passes.

## G. Final regression and stop

- [ ] G1. Format/lint/typecheck/unit/E2E/build pass.
- [ ] G2. Every M1–M5 doctor/evaluation passes.
- [ ] G3. Every M6 doctor/evaluation passes.
- [ ] G4. Live/Demo remain separate.
- [ ] G5. No personal-health, dosing, vendor, ranking, or hosted feature exists.
- [ ] G6. No M7 file, branch, binding, or deployment work exists.
- [ ] G7. Branch is pushed and final hash reported.
- [ ] G8. M7 remains explicitly unstarted.

---

# 14. Required final command set

At minimum run and report:

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

pnpm backup:create
pnpm backup:verify -- --input <test-backup>
pnpm backup:restore -- --input <test-backup> --dry-run
pnpm accessibility:audit
pnpm performance:check
pnpm security:check
pnpm ci:quality
```

Use temporary isolated data for destructive and restore tests.

---

# 15. Stop rule

After closure:

- Push `milestone-6/personalisation-production-hardening`.
- Report remediation feature-complete and final hashes.
- Report every gate honestly.
- Stop.

Do not create:

```text
milestone-7/*
.openai/hosting.json
D1/R2 adapters
Sites deployment files
hosted authentication
hosted scheduler
public deployment
```

Milestone 7 remains withheld until the project manager accepts the remediated M6 closure and issues an authentic M7 execution brief.

---

# 16. Authorised remediation message

> **M6 REMEDIATION AUTHORISED; M7 WITHHELD:** Continue Healthspan Dashboard Milestone 6 from exact tip `40540025f468fdefbf018ded9b9dbb4f1b00de2d` on `milestone-6/personalisation-production-hardening`. Close the material gaps between the implementation and the controlling M6 brief, especially complete encrypted restorable backups, conservative CLI restore with rollback, request-integrity sessions and CSRF, strict Host/Origin/CORS controls, all missing evaluation/security/accessibility/performance commands, complete CI and supply-chain gates, operations/retention evidence, and the full one-row acceptance checklist. Preserve all M1–M5 boundaries and historical reports. Push the remediated M6 branch, report exact results, and stop. Do not create or begin Milestone 7.
