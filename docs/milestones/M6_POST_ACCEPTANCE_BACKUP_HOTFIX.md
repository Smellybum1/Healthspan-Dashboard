# M6 Post-Acceptance Backup Correctness Hotfix

**Controlling authority:** `docs/milestones/M7_EXECUTION_BRIEF.md` §5 as amended by
Milestone 7 Pre-Start Amendment I (Decision C1).
**Branch:** `milestone-6/personalisation-production-hardening`
**Accepted M6 historical tip:** `e876231f950d1a134394a0adb50cabd5966bce28`
**Accepted M6 CI run:** https://github.com/Smellybum1/Healthspan-Dashboard/actions/runs/30117787763
**Implementation agent:** Claude (Opus)
**Merge to `main`:** not authorised.

Milestone 6 acceptance at `e876231` remains historical and is **not** rewritten. This
document records a narrow post-acceptance correctness hotfix applied on top of that tip.
Its resulting commit becomes the exact base for `milestone-7/sites-migration-readiness`;
the full resulting SHA is recorded in `docs/milestones/M7_BASELINE_AND_DECISIONS.md` at
branch-creation time, so that no self-referential report-only commit is created here.

---

## 1. Defects

### 1.1 `portable_full` archived no raw snapshots at all

`FileRawSnapshotStore` writes objects to `dataDir/raw/<storage_key>`, where the key is
produced by `rawSnapshotRelativeKey()` as `sha256/<first-2-hex>/<sha256>.<ext>.gz` —
sharded on the first two hex characters and suffixed with the extension and `.gz`
(`packages/db/src/raw-store.ts:27-29`, `packages/db/src/paths.ts:116-123`).

The backup collector selected only `raw_snapshots.sha256` and reconstructed
`dataDir/raw/sha256/<sha256>` — no shard directory, no suffix — then guarded the read
with `if (!fs.existsSync(full)) continue;` (`apps/api/src/backup-service.ts:189-193`
at `e876231`).

That path can never exist for any object the store has written. Every referenced raw
object was therefore skipped, silently, and the backup reported success with zero raw
payloads. The `raw_snapshots.storage_key` column — `notNull`, and holding the correct
key — was present but unused.

### 1.2 Creator documents restored where no reader looks

Documents were read correctly via `creator_documents.storage_key` but archived under a
synthetic path `documents/<documentId>/<basename>` and restored to
`path.join(dataDir, rel)`, i.e. `dataDir/documents/<id>/<filename>`.

Every reader resolves `dataDir/<storage_key>`, which is `creator-docs/<aa>/<sha256>`
(`apps/api/src/creator-service.ts:248-250`). After a restore the bytes existed on disk
at a location nothing consults, so restored documents were effectively missing.

### 1.3 Why the existing gates did not catch either defect

`scripts/backup-eval.ts` constructed its fixtures in the **shape the defect expected**
rather than the shape production writes:

- creator documents were inserted with **absolute** `storage_key` values, which no
  production writer emits;
- raw objects were written flat at `raw/sha256/<hash>` with a `storage_key` of
  `raw/sha256/<hash>`, rather than through `FileRawSnapshotStore`.

Its assertions then matched those same synthetic paths. The restore failure-injection
hooks keyed off the `documents/` and `raw/` path prefixes, so a restore containing zero
real raw entries still exercised the "raw restore succeeded" branch.

---

## 2. Fix

### 2.1 Raw snapshots (`apps/api/src/backup-service.ts`)

- Selects `raw_snapshots.storage_key` alongside `sha256`; the path is no longer derived
  from the digest.
- Validates every key through `toDomainRelKey()` — a safe relative POSIX key check built
  on `assertSafeRelPath`, additionally rejecting trailing separators and normalising
  backslashes.
- Reads from `dataDir/raw/<storage_key>` and archives at `raw/<storage_key>`.
- Restores to `dataDir/raw/<storage_key>`.
- Preserves the compressed object bytes; the archive entry hash is the **file** digest
  while `raw_snapshots.sha256` retains its uncompressed-digest semantics.
- De-duplicates repeated keys and keeps referenced-only inclusion (rows drive the set, so
  unreferenced objects on disk stay out).
- **Reports rather than skips:** any referenced object missing from disk raises
  `missing-referenced-raw-objects:<count>:<keys>` instead of silently producing a
  successful, empty archive.

### 2.2 Creator documents (`apps/api/src/backup-service.ts`)

- Archived under the document's own `storage_key`, so restore lands at
  `dataDir/<storage_key>` through the ordinary destination logic.
- Absolute storage keys are rejected (`unsupported-document-storage-key:absolute:<id>`);
  they are outside the `dataDir/<storage_key>` model and cannot be restored safely.
- Storage-key collisions across distinct document IDs are detected and rejected.
- Missing or hash-mismatched referenced documents raise
  `missing-referenced-documents:...` rather than being skipped.
- On restore, the payload digest is additionally verified against
  `creator_documents.sha256`; a mismatch raises `document-hash-mismatch-vs-database`.
- Rollback operates on the true destination path, because the destination is now the
  authoritative one.

### 2.3 Failure-injection classification

Injection hooks no longer key off archive-path string prefixes. Each payload is
classified as `raw` / `document` / `other` from its resolved destination, with document
identity taken from the restored database. The hooks therefore fire on real raw and
document entries.

### 2.4 Legacy archive compatibility (Amendment §5.3)

Archives written before this hotfix are resolved through the restored database:

| Legacy archive path                 | Resolved via                         | Destination                 |
| ----------------------------------- | ------------------------------------ | --------------------------- |
| `documents/<documentId>/<filename>` | `creator_documents.id → storage_key` | `dataDir/<storage_key>`     |
| `raw/sha256/<sha256>`               | `raw_snapshots.sha256 → storage_key` | `dataDir/raw/<storage_key>` |

The legacy raw form is matched only as exactly three segments with a 64-hex final
segment, so it cannot collide with the current sharded, suffixed keys.

Failure is safe and explicit rather than best-effort:

- `unsupported-archive:unmapped-legacy-document:<id>`
- `unsupported-archive:unmapped-legacy-raw:<sha>`
- `unsupported-archive:ambiguous-legacy-raw:<sha>` when one digest maps to more than one
  storage key.

An unmappable legacy payload is rejected outright rather than restored to a guessed
location.

---

## 3. Files changed

| File                                                  | Change                                                                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/backup-service.ts`                      | `toDomainRelKey()` helper, legacy path patterns, storage-key-driven raw and document archival, destination resolution, payload classification, DB-hash verification |
| `apps/api/src/backup-payload-hotfix.test.ts`          | New — production-path tests for Amendment §5.4 checks 1–12                                                                                                          |
| `scripts/backup-eval.ts`                              | Fixtures rewritten to the production on-disk layout; assertions retargeted to domain storage keys                                                                   |
| `docs/milestones/M6_POST_ACCEPTANCE_BACKUP_HOTFIX.md` | This report                                                                                                                                                         |

No production behaviour outside backup creation and restore was modified. No schema
change, no migration.

---

## 4. Required tests (Amendment §5.4)

All in `apps/api/src/backup-payload-hotfix.test.ts` unless noted.

| #   | Requirement                                             | Test                                                                                              | Result |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------ |
| 1   | `portable_full` contains a real referenced raw snapshot | `1. portable_full contains the real referenced raw snapshot`                                      | PASS   |
| 2   | Unreferenced raw objects excluded                       | `2. unreferenced raw objects remain excluded`                                                     | PASS   |
| 3   | Missing referenced raw fails / non-success              | `3. a missing referenced raw object fails instead of silently succeeding`                         | PASS   |
| 4   | Raw restore lands at exact storage-key path             | `4+5. raw restore lands at the storage-key path…`                                                 | PASS   |
| 5   | Restored raw readable via `FileRawSnapshotStore`        | `4+5.` (asserts `exists()` and `get()` byte equality)                                             | PASS   |
| 6   | Document restore lands at exact storage-key path        | `6+7. document restore lands at the storage-key path…`                                            | PASS   |
| 7   | Restored document readable through the normal path      | `6+7.` (reads `dataDir/<storage_key>`, checks digest)                                             | PASS   |
| 8   | Injection hooks execute with real archive entries       | `8+9. raw failure injection…`, `8. document failure injection…`                                   | PASS   |
| 9   | Rollback restores prior bytes at true destinations      | `8+9.` (sentinel bytes restored after injected failure)                                           | PASS   |
| 10  | Manifest maps every payload to its domain storage key   | `10. archive manifest maps every payload to its domain storage key`                               | PASS   |
| 11  | Unsafe storage keys rejected                            | `11. unsafe storage keys are rejected`                                                            | PASS   |
| 12  | Legacy archives mapped correctly or rejected clearly    | `12a. legacy payload paths are mapped…`, `12b. an unmappable legacy payload is rejected clearly…` | PASS   |

Test 1 carries an explicit regression guard asserting that the pre-hotfix path
`dataDir/raw/sha256/<sha>` does not exist while `dataDir/raw/<storage_key>` does — the
exact condition under which the old `existsSync` guard skipped every object.

---

## 5. Backup-format compatibility decision

The archive format version is **unchanged** (`formatVersion: 1`). Only payload entry
paths change, from synthetic paths to domain storage keys.

- **Forward:** new archives carry storage-key paths and restore through the ordinary
  destination logic.
- **Backward:** legacy archives are accepted and remapped through the restored database
  (§2.4). Where a legacy entry cannot be mapped unambiguously it is rejected with an
  explicit `unsupported-archive:*` error rather than restored to the wrong location,
  per Amendment §5.3.

A format-version bump was rejected as unnecessary: the manifest already enumerates entry
paths, and the resolver distinguishes legacy from current forms structurally.

---

## 6. Why no M6 completion report was rewritten

Amendment §5 directs a narrow correctness hotfix, not an M6 reopening. `M6_COMPLETION_REPORT.md`
records what was accepted at `e876231` and remains a historical document. Pro's acceptance
ruling additionally directs that no self-referential report-only commit be created to chase
a branch-tip hash. This report is therefore additive, and the corrected tip is recorded in
`M7_BASELINE_AND_DECISIONS.md` at M7 branch creation.

---

## 7. Gate results

| Gate                     | Result                                            |
| ------------------------ | ------------------------------------------------- |
| `pnpm format:check`      | PASS — all matched files use Prettier style       |
| `pnpm lint`              | PASS — `eslint . --max-warnings 0`, no findings   |
| `pnpm typecheck`         | PASS — 11 workspace projects                      |
| `pnpm test`              | PASS — 28 files, 177 tests (166 before, 11 added) |
| `pnpm build`             | PASS                                              |
| `pnpm backup:eval`       | PASS — 57 cases, 0 failed                         |
| `pnpm backup:doctor`     | PASS                                              |
| `pnpm operations:doctor` | PASS                                              |
| `pnpm security:check`    | PASS — 20 helper cases, integration exit 0        |
| `pnpm test:e2e`          | PASS — 88 passed, 18 skipped                      |

`test:e2e` was run rather than recorded as `NOT REQUIRED`: `createBackup` is reachable
from `POST /api/backups`, so its new failure behaviour touches an API surface.

---

## 8. Next step

Create the M7 branch from the resulting corrected tip:

```bash
git switch --create milestone-7/sites-migration-readiness <CORRECTED_M6_HOTFIX_SHA>
```

No merge to `main`. Sites deployment remains unauthorised.
