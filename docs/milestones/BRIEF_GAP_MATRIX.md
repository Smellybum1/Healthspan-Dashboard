# Milestone brief gap matrix (official Pro briefs)

**Date:** 24 July 2026  
**Purpose:** Compare shipped work against the **official** Pro `.md` attachments (not accessibility scrapes).  
**Stop rule:** Do not start Milestone 6 until this matrix is closed (or Pro re-scopes) and Pro authorises M6.

## Brief sources (canonical)

| Milestone | Official file in `C:\Tools\Downloads\` | Also copied to `docs/milestones/` |
| --- | --- | --- |
| M1 | `lifespan_dashboard_project_charter_and_milestone_1.md` | (charter already in repo) |
| M2 | `healthspan_dashboard_milestone_2_execution_brief.md` | yes |
| M3 | `healthspan_dashboard_milestone_3_execution_brief.md` | yes (extracted from Pro artifact panel) |
| M4 | `healthspan_dashboard_milestone_4_execution_brief.md` | yes (extracted from Pro artifact panel) |
| M5 | `healthspan_dashboard_milestone_5_execution_brief.md` | yes (user download) |

**Process note:** M4/M5 (and largely M3) were previously executed from chat/a11y scrapes. Treat the Downloads copies above as source of truth going forward. Prefer the named `healthspan_dashboard_milestone_*_execution_brief.md` files over `M*_EXECUTION_BRIEF.md` scrapes.

## Summary counts

| Milestone | DONE | PARTIAL | MISSING | UNKNOWN | Verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| **M2** (§23, 35 items) | 18 | 12 | 2 | 3 | Backbone real; connector depth + report artifacts incomplete |
| **M3** (A–H ~104 items*) | ~67 | ~37 | 0 | 0 | Credible MVP; schema/taxonomy/UI thinner than brief |
| **M4** (grouped ~40) | 8 | 22 | 9 | 1 | Core scaffold; not 171-row brief-complete |
| **M5** (A–L ~203) | ~55 | ~66 | ~68 | ~14 | Policy-aligned skeleton; not brief-complete |

\*M3 agent rolled checklist items; treat as directional.

## Recommended close-out order

1. **M5 first (current branch)** — largest honest overclaim; already on `milestone-5/creator-social-intelligence`.
2. **M4 residual** — regulatory/safety surfaces, eval corpora, doctors, completion checklist depth (can be M5 §5-style hardening packets or dedicated follow-up commits on M5 branch if Pro allows).
3. **M3 residual** — Live V2 taxonomies, multi-claim depth, methodology docs, OpenAI reserved path honesty.
4. **M2 residual** — `ingest:reprocess`, PubMed/CT.gov pagination depth, Crossref DOI auto-wiring, §24 completion-report format.

Do **not** rewrite history hashes in M2–M4 completion reports; append gap-closure notes or new “closure” reports.

---

## M2 (high-signal gaps)

| Area | Status | Gap |
| --- | --- | --- |
| SQLite path / Demo-Live / raw snapshots / Brisbane scheduler | DONE | — |
| PubMed / CT.gov / Crossref / TGA | PARTIAL | Pagination/WebEnv, CT change taxonomy, Crossref DOI auto-enrich on sync-all |
| `pnpm ingest:reprocess` | MISSING | Offline reprocess from snapshots |
| Completion report §24 | PARTIAL | Missing one-row checklist, live-smoke table, screenshots |
| Stop-before-M3 (historical) | — | Expected superseded once M3 started |

## M3 (high-signal gaps)

| Area | Status | Gap |
| --- | --- | --- |
| Jobs, review queue, deterministic pipeline, eval 73+16 | DONE | — |
| Schema vs brief entities | PARTIAL | Segments/study profiles/model runs/activity snapshots folded or missing |
| Live V2 taxonomies / maturity | PARTIAL | Still uses simplified / M1-era maturity including regulatory |
| Claims workspace filters / API completeness | PARTIAL | Thin vs brief |
| OpenAI path | PARTIAL | Reserved stub; not full Responses integration |
| `docs/methodology/*` + screenshot set | PARTIAL/MISSING | Incomplete vs brief |

## M4 (high-signal gaps)

| Area | Status | Gap |
| --- | --- | --- |
| Exact-first identity, no-rank compare, no dosing/vendors | DONE | Strong |
| Connectors (ARTG/Drugs@FDA/Purple Book/openFDA/AEMS) | PARTIAL | Fixture-first; ops depth thin |
| Regulatory/Safety workspace + APIs | MISSING | No `/api/regulatory/*`, `/api/safety/*`, label tables |
| Eval corpora + real doctors | MISSING/PARTIAL | Aliased thin `dossiers-doctor` |
| Completion report 171-row checklist | MISSING | Executive summary only |
| Package layout depth | PARTIAL | Flat `@healthspan/interventions` vs brief modules |

## M5 (high-signal gaps)

| Area | Status | Gap |
| --- | --- | --- |
| No person scores; YT metadata ≠ claims; X optional; no X→AI | DONE | Policy correct |
| Schema §14 (~31 groups) | PARTIAL | Migration `0007_m5_creator_schema_depth` + Drizzle tables landed; import now writes segments + claim source spans; many tables still unused by services/UI |
| Document import | PARTIAL | Segments/spans + profile UI import/manual claim; delete/lifecycle UI still thin |
| YouTube | PARTIAL | Playlist/video sync + quota ledger + retention hold + profile UI; search onboarding UI and full fixture corpus still thin |
| X | PARTIAL | Timeline sync + budget gate + compliance purge APIs; stream/reconciliation depth and UI still thin |
| Alignment §11 | PARTIAL | All 15 dimensions + candidate findings persisted; deep M3/M4 evidence pairing and 72-case corpus still thin |
| Doctors/evals | PARTIAL | creators:doctor/eval cover §11 dims, YT/X policy gates; full corpora (72 alignment pairs etc.) still thin |
| Screenshots | PARTIAL | Report claims; PNGs not committed |

---

## Next action (for Pro / owner)

Confirm close-out order above. Default proposal:

1. Replace scraped `M5_EXECUTION_BRIEF.md` usage with official Downloads M5 brief.
2. Continue on `milestone-5/creator-social-intelligence` closing **M5 Section 34** in packets (schema → YouTube → documents/UI → alignment → X/compliance → corpora/doctors → report).
3. Then M4 residual packets, then M3/M2 residuals.
4. Only then request M6 brief.

**Do not merge to main** unless the owner instructs.
