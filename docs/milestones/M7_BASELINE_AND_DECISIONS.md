# Milestone 7 — Baseline and Decisions

Starting documentation for `milestone-7/sites-migration-readiness`.

Required by M7 Pre-Start Amendment I §J. This file is the single place where the
accepted lineage, the corrected base, and the resolved pre-start decisions are
recorded. It exists so that no historical completion report has to be rewritten and
no self-referential hash-chasing commit is created.

---

## 1. Controlling documents

| Document                 | Path                                         | Integrity                                                                                                                   |
| ------------------------ | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| M7 execution brief       | `docs/milestones/M7_EXECUTION_BRIEF.md`      | SHA-256 `15bc543fafbc7fa938e804bb6c1a95a29befad4a0c751f5219042bd34957558c` — verified on download and again after placement |
| M7 pre-start amendment I | `docs/milestones/M7_PRESTART_AMENDMENT_I.md` | Controlling over the brief where they differ                                                                                |

Precedence:

```text
M7 Pre-Start Amendment I
    ↓
M7 Execution Brief
    ↓
accepted M1–M6 project invariants
```

---

## 2. Accepted lineage

| Item                                        | Commit                                     |
| ------------------------------------------- | ------------------------------------------ |
| Accepted M5 tip                             | `575489cf913812291f75266975e77c8953058968` |
| M6 base                                     | `575489cf913812291f75266975e77c8953058968` |
| M6 entry gate                               | `36a281015176ea73fc24fde6344bfc15bfe22308` |
| Remediation V authorised base               | `59eb7c51ff9cab82ad3155438912e76b047b8379` |
| Remediation V implementation                | `c492235`                                  |
| **Accepted M6 tip (historical)**            | `e876231f950d1a134394a0adb50cabd5966bce28` |
| **Corrected M6 hotfix tip — exact M7 base** | `a59d202a481f8ef4982ad314f88350024b2373cf` |

**Accepted M6 CI run:** https://github.com/Smellybum1/Healthspan-Dashboard/actions/runs/30117787763 — 5/5 green.

**Hotfix CI run:** https://github.com/Smellybum1/Healthspan-Dashboard/actions/runs/30186705459 — 5/5 green
(Quality Ubuntu, Quality Windows, E2E Ubuntu Chromium, Security & supply chain, Doctors/evaluations).

### Why the base moved

Milestone 6 was accepted at `e876231`. Two payload-path defects were then found in the
backup subsystem and confirmed by the project manager, who directed a narrow
post-acceptance correctness hotfix **before** the M7 branch was created rather than a
further M6 remediation cycle. See `docs/milestones/M6_POST_ACCEPTANCE_BACKUP_HOTFIX.md`.

`a59d202` satisfies the Amendment §5.7 base rule: its ancestry begins at `e876231`, its
diff is limited to the hotfix, its tests, and its documentation, and its required gates
and CI are green. M6 acceptance at `e876231` remains historical and unmodified.

---

## 3. Why the stale ROADMAP lineage is superseded

Before this milestone, `ROADMAP.md` recorded the **Remediation I** lineage: it named
`7323b30` as the M6 "Final tip" (18 commits behind the accepted tip), cited `4054002`
and `7853708` as the controlling remediation pair, and named
`M6_CLOSURE_REMEDIATION.md` as the controlling remediation document when Remediation V
was current. None of `59eb7c5`, `c492235`, or `e876231` appeared anywhere in it.

Those lines are superseded by §2 above. `ROADMAP.md` has been corrected to the accepted
lineage as part of this milestone's starting documentation.

---

## 4. Why historical report hashes remain historical

`M6_COMPLETION_REPORT.md` contains internally inconsistent hash references: §"Report-content
parent" names `cb7ecaa` (Remediation IV) while the §2 table names `6b982129` (Remediation
III), and neither `c492235` nor `e876231` appears in the document.

These are **not** corrected. A completion report records the state at which a milestone
was submitted and accepted; rewriting it after the fact would misrepresent that record.
The project manager additionally directed that no further self-referential report-only
commit be created to chase a branch-tip hash. The authoritative lineage lives here
instead.

The same applies to `M5_COMPLETION_REPORT.md`, which records Final HEAD `f21a553` while
the accepted M5 tip is `575489c`.

---

## 5. The M6 placeholder-link convention

`M6_COMPLETION_REPORT.md` §14 records `Placeholder until push` in place of the five CI
run links. That wording is a **pre-push convention**: the report is written and committed
before the tip exists, so a report cannot cite the CI run of the commit that contains it
without a second, self-referential commit.

The convention is retained, and the actual run links are recorded in §2 above. Future
milestone reports should reference this file for run links rather than embedding a
placeholder.

---

## 6. "Decisions required before Milestone 7" — discharged

`M6_CLOSURE_REMEDIATION.md` §28 and the M6 execution brief §50 both require a
"Decisions required before Milestone 7" section in the M6 completion report. No such
section was written.

Per Amendment §J, that requirement is **satisfied by the M7 brief and Amendment I
themselves**, which resolve every decision that section would have captured. The
resolutions are recorded in §7 below. No amendment to the M6 report is required.

---

## 7. Resolved pre-start decisions

| Ref | Decision                | Resolution                                                                                                                                                                                |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Scope boundary          | Migration readiness **plus one owner-only saved Sites version**. Saving a version is authorised; deploying it is not.                                                                     |
| B1  | Shared repository scope | The **hosted-reachable runtime slice only**, not the whole data layer. Local-only services keep their synchronous `HealthspanDb` path.                                                    |
| B2  | Sync→async conversion   | In scope, but bounded to the hosted-reachable slice. No repository-wide conversion.                                                                                                       |
| C   | R2 / documents          | Content-addressed keys, SHA-256 integrity, idempotent writes, reconciliation protocol. Full local backup parity **not** required; hosted recovery is labelled `DEGRADED_HOSTED_RECOVERY`. |
| D   | Local-first guarantee   | Unchanged. Local SQLite stays the primary reference runtime; hosted is an additional target. No local feature may be removed to accommodate Sites.                                        |
| E   | Hosted authentication   | Single-owner only, principal `hosted-owner`. Owner email compared against a Sites secret, never persisted, logged, or returned. No multi-user tables, no PHI.                             |
| F   | Scheduler               | Logical job and lease model adapted to D1, manual/request-triggered. External refresh disabled. No assumption of Cron Triggers, Queues, Workflows, or Durable Objects.                    |
| G   | Request integrity       | Preserved through a `RequestIntegrityProvider` with local and Sites implementations. No localhost assumptions in the Sites runtime.                                                       |
| H   | Performance deviation   | `pnpm performance:full` is a **measured threshold gate**, classified `PASS` / `DEVIATION` / `BLOCKED`. A latency miss may not be reported as closing the M6 deviation.                    |
| I   | Branch strategy         | Branch from the corrected M6 hotfix tip. **No merge to `main`.**                                                                                                                          |
| J   | Documentation hygiene   | Discharged by this file.                                                                                                                                                                  |

---

## 8. Standing prohibitions

Carried forward from the brief and amendment. None of the following is authorised by
any decision recorded here:

- Deploying the saved Sites version, or creating a public or shared production URL
- A custom domain, or broadening access beyond owner and workspace administrators
- Migrating any real local data — database, personalisation, creator documents, raw
  source snapshots, platform content, backups, or operational history
- Dual-write, replication, or synchronisation between local and hosted stores
- Hosted connectors, X, YouTube, or external AI
- Multi-user support, PHI, or personal-health data in hosted storage
- Merging to `main`
- Any Milestone 8 work

---

## 9. Merged work that is not Sites scope

`design/ui-theme-and-hierarchy` was merged into this branch **at owner direction**, so
that the owner-only Sites preview does not present the light-theme contrast defect. The
two branches touched disjoint files and the merge was clean.

It is recorded here so that the M7 diff is not mistaken for Sites work. None of it is
migration scope, and none of it should be assessed against the M7 acceptance checks:

| Correction                                       | Why it could not wait for a later milestone                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@source` directive for `@healthspan/ui`         | Tailwind v4 skips `node_modules`, and the workspace package resolves through the symlink there, so **none** of the shared package's utility classes were ever emitted. Every evidence, confidence, regulatory and safety badge rendered with no tint, ring, or text colour in either theme. |
| 61 hardcoded palette classes → semantic tokens   | The classes did not swap with the theme. Error text sat at roughly 1.9:1 on white across 16 sites, i.e. effectively invisible in light mode. Tone steps are validated all-pairs against each theme surface; colour is never the only signal.                                                |
| Type scale, single card definition, section rank | 95.7% of typography was `text-sm`/`text-xs`, so thirty `h2` elements rendered at body size and no page established rank.                                                                                                                                                                    |
| Playwright screenshot ownership                  | Both projects wrote the same paths, so the mobile project silently replaced every desktop capture. Milestone evidence held 21 unique images across 48 files; it now holds 39, with desktop captures at 1280px for the first time. A guard test prevents recurrence.                         |

Five screenshot files remain stale and are explicitly allowlisted rather than quietly
accepted: `m6-alert-detail`, `m6-brief-source-coverage` and `m6-weekly-review` are cited
in `M6_COMPLETION_REPORT.md` but have **no generator in the E2E suite at all**;
`m6-prune-preview` and `m6-retention-preview` are captured inside conditional branches
that do not fire in the seeded environment. Resolving those touches an accepted
milestone report and is an owner or project-manager decision, not an implementation one.
