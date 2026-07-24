# Milestone brief gap matrix (official Pro briefs)

**Date:** 24 July 2026  
**Purpose:** Compare shipped work against the **official** Pro `.md` attachments (not accessibility scrapes).  
**M6 re-scope:** Pro authorised M6 from M5 tip `575489cf913812291f75266975e77c8953058968` with a mandatory Section 5 entry gate (close M4 → M3 → M2 residuals before any M6 feature work).

## Brief sources (canonical)

| Milestone | Official file | Repo copy |
| --- | --- | --- |
| M2 | `healthspan_dashboard_milestone_2_execution_brief.md` | `docs/milestones/` |
| M3 | `healthspan_dashboard_milestone_3_execution_brief.md` | `docs/milestones/` |
| M4 | `healthspan_dashboard_milestone_4_execution_brief.md` | `docs/milestones/` |
| M5 | `healthspan_dashboard_milestone_5_execution_brief.md` | `docs/milestones/` |
| M6 | `healthspan_dashboard_milestone_6_execution_brief_reissued.md` | `docs/milestones/healthspan_dashboard_milestone_6_execution_brief.md` (SHA-256 `f78eeb73…5118`) |

## Summary counts (entry-gate closed)

| Milestone | DONE | PARTIAL | MISSING | UNKNOWN | BLOCKED | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| **M2** | 34 | 0 | 0 | 0 | 0 | Closed via `M2_OFFICIAL_BRIEF_CLOSURE_REPORT.md` (1 N/A historical stop) |
| **M3** | ~101 | 0 | 0 | 0 | 0 | Closed via `M3_OFFICIAL_BRIEF_CLOSURE_REPORT.md` |
| **M4** | 170 | 0 | 0 | 0 | 0 | Closed via `M4_OFFICIAL_BRIEF_CLOSURE_REPORT.md` (1 N/A) |
| **M5** | §34 closed | 0 | 0 | 0 | 0 | Official M5 Section 34 closure accepted at `575489c` |

Matrix rule: no unapproved `PARTIAL`, `MISSING`, `UNKNOWN`, or `BLOCKED` items remain for M2–M5.

## Entry-gate decision

1. M5 official-brief closure accepted.
2. Remaining M2–M4 residuals closed on `milestone-6/personalisation-production-hardening` before Section 6 features.
3. Distinct entry-gate commit message: `Close M2-M4 official-brief residuals before M6 features`.
4. **Entry-gate commit hash:** _(filled after gate commit)_

## High-signal items (closed)

### M2

| Area | Status | Closure |
| --- | --- | --- |
| Offline `ingest:reprocess` from stored snapshots | DONE | `scripts/ingest-reprocess.ts` + `reprocess-service.ts` |
| PubMed / CT.gov / Crossref DOI auto-queue | DONE | connectors + `enrich_crossref_doi` jobs |
| Completion checklist / live-smoke honesty | DONE | `M2_OFFICIAL_BRIEF_CLOSURE_REPORT.md` |

### M3

| Area | Status | Closure |
| --- | --- | --- |
| Live V2 maturity (no regulatory-as-maturity) | DONE | deterministic + methodology |
| Claims/assessments/history APIs | DONE | `apps/api/src/app.ts` |
| OpenAI Responses adapter (optional) | DONE | `packages/intelligence/src/providers.ts` |
| Methodology + schema mapping | DONE | `docs/methodology/evidence-and-claims.md` |

### M4

| Area | Status | Closure |
| --- | --- | --- |
| Regulatory/safety schema + APIs + workspace | DONE | migration 0010 + services + `/safety` |
| Eval corpora + distinct doctors | DONE | 120/72/48/32 + scripts |
| 171-row checklist | DONE | `M4_OFFICIAL_BRIEF_CLOSURE_REPORT.md` |

### M5

| Area | Status | Closure |
| --- | --- | --- |
| Official Section 34 | DONE | `M5_COMPLETION_REPORT.md` at tip `575489c` |

## Next action

Entry gate complete → continue M6 Section 6+ feature work on the same branch. Do not merge to `main` unless the owner instructs.
