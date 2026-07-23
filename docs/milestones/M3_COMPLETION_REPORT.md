# Milestone 3 Completion Report — Healthspan Dashboard

**Branch:** `milestone-3/evidence-claim-intelligence`  
**Base:** `milestone-2/persistent-data-backbone` @ `4a39a1c`  
**Final commit:** `b835278a6d18ac984d4f470f61ba3013245a61bc (feature complete; HEAD may include report hash fixups)`  
**Date:** 23 July 2026  
**Status:** Complete for Milestone 3 acceptance (stop before Milestone 4)

## Summary

Healthspan Dashboard now has deterministic-first Live evidence/claim intelligence on top of the M2 persistence backbone: versioned analyses, claim provenance spans, research-activity Signal Radar (not a longevity score), append-only review decisions, optional AI providers disabled by default, offline eval (≥72 cases + ≥16 claim pairs), and M2 closure items (path redaction, admin guard, baselines, jobs/202, Brisbane scheduler, pagination).

## Delivered

### M2 closure
- Browser APIs redact exact local paths; `pnpm data:path` remains terminal-only
- Shared `assertAdminMutationAllowed` on admin mutations
- Source/feed `baselineCompletedAt` + migration backfill
- Persisted `background_jobs` with 202 Accepted, leases, dedupe, worker
- Australia/Brisbane 06:00 scheduler + startup catch-up (enqueue-only)
- Server-side pagination for items + search
- Docs: README, ROADMAP, DATA_MODEL, ARCHITECTURE, ADR-0008

### Intelligence
- Package `@healthspan/intelligence` (deterministic profiles, claims, relationships, providers)
- Migrations `0001`–`0003` (closure, intelligence core, review/provenance)
- Tables: runs, analyses, dependencies, content state, claims, spans, relationships, review tasks, decisions
- Post-ingest enqueue of stale intelligence jobs
- Material source version changes mark intelligence + open reviews stale
- APIs: intelligence status/runs, claims list/detail, review resolve, jobs
- UI: Live detail evidence profiles, Claims workspace, interactive Review Queue, radar research-activity labelling
- Scripts: `intelligence:eval`, `intelligence:doctor`

## Quality gates

| Gate | Result |
| --- | --- |
| `pnpm lint` | pass (0 warnings) |
| `pnpm typecheck` | pass |
| `pnpm test` | 58 passed |
| `pnpm test:e2e` | 12 passed / 2 skipped (mobile-only on chromium) |
| `pnpm build` | pass |
| `pnpm intelligence:eval` | 73/73 + 16/16 claim pairs |
| `pnpm intelligence:doctor` | ok |
| `pnpm db:doctor` | ok |

## Screenshots

Committed under `docs/milestones/screenshots/`:

- `m3-claims.png`
- `m3-review.png`
- `m3-mobile-review.png`

## Acceptance checklist (A–H)

### A. Base and M2 closure
- [x] A1 Base `4a39a1c`
- [x] A2 Branch `milestone-3/evidence-claim-intelligence`
- [x] A3 No browser DB/raw paths
- [x] A4 `pnpm data:path`
- [x] A5 Shared admin guard
- [x] A6 Non-loopback blocked unless override
- [x] A7 Source/feed baselines
- [x] A8 Jobs 202 + recovery
- [x] A9 Job dedupe
- [x] A10 Brisbane scheduler + catch-up
- [x] A11 Server-side list/search pagination
- [x] A12 Service boundaries for principal routes
- [x] A13 Docs current

### B. Schema and provenance
- [x] B1 Forward-only migrations
- [x] B2 Required entities implemented or equivalently mapped (see DATA_MODEL)
- [x] B3 Live claims have primary spans
- [x] B4 Analysis source-version dependencies
- [x] B5 Analysis identity versions
- [x] B6 Identical reanalysis reuse
- [x] B7 Stale on material source change
- [x] B8 Historical analyses + append-only review decisions
- [x] B9 No composite Live scientific score
- [x] B10 `intelligence:doctor`

### C. Deterministic evidence model
- [x] C1–C15 Covered by deterministic classifier, claim builder, eval corpus, and UI caveats (protocol≠results, animal/cell≠human, biomarker≠lifespan extension, retraction override, potential hallmarks labelled as potential)

### D. Claims and relationships
- [x] D1–D10 Roles/kinds/directions, spans, fingerprints, `potentially_conflicts` only, interactive review actions, immutable decisions, stale reviews on source update

### E. Optional AI
- [x] E1–E14 Disabled by default; disabled/fixture/openai adapters; caps; no default network in tests; AI cannot write persistence; live path remains deterministic-first (OpenAI network path reserved / not exercised in CI)

### F. API and UI
- [x] F1–F14 Status/runs/claims/review APIs; Live Today/radar; detail claims; claims workspace; review queue desktop+mobile; methodology; demo separation
- [x] F15 New controls covered by e2e smoke + roles/labels

### G. Research activity
- [x] G1–G7 Research-activity axis (not “attention”/truth/efficacy); tooltips expose formula version + raw; retraction/safety markers; reproducible formula version `research_activity.v1`

### H. Evaluation, security, quality
- [x] H1–H19 Eval floors, no new connectors, no personal-health features, gates green, docs/ADRs, screenshots + this report, branch pushed, no M4 work started

## Known limitations (honest)

- OpenAI Responses path is reserved and schema-constrained storage remains disabled; paid AI is not required for M3 acceptance.
- Hallmark tagging is a low-confidence keyword heuristic labelled “potential” only.
- Claim extraction is deterministic/heuristic (single primary claim per record), not full-text NLP.
- Assessment list filters are available via claims/intelligence endpoints; dedicated `/api/assessments` may be expanded in a later milestone if Pro requires a separate surface.

## Out of scope (correctly deferred)

Intervention/peptide dossiers, dosing/sourcing, new connectors, social/creators monitoring, D1/R2/Sites, auth, personal health data, Milestone 4 features.

## Next

Ask ChatGPT Pro for **Milestone 4** execution brief. Do not start M4 until authorised.
