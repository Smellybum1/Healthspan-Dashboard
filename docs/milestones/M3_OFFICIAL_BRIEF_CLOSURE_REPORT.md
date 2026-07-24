# M3 Official Brief Closure Report

**Status:** CLOSED for M6 entry gate
**Date:** 24 July 2026
**Canonical official brief:** docs/milestones/healthspan_dashboard_milestone_3_execution_brief.md
**Original milestone branch / historical hashes:** preserved in original completion report; later-milestone implementation does not rewrite those hashes.
**M6 branch:** milestone-6/personalisation-production-hardening
**M6 base:** 575489cf913812291f75266975e77c8953058968

## Acceptance checklist

| ID | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| A1 | Work is based on commit 4a39a1c. | NOT APPLICABLE | Historical base/branch criterion; original M3 completed on its branch. Closure is residual completeness on M6. |
| A2 | Work is on milestone-3/evidence-claim-intelligence. | NOT APPLICABLE | Historical base/branch criterion; original M3 completed on its branch. Closure is residual completeness on M6. |
| A3 | Browser APIs no longer expose exact local database/data/raw paths. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| A4 | pnpm data:path still reports exact local paths in the terminal. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| A5 | One shared guard protects all administrative mutation routes. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| A6 | Non-loopback mutation access is disabled unless explicitly overridden. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| A7 | Source/feed baseline state is independent and migration-safe. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| A8 | Persisted queued jobs return 202 semantics and recover after restart. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| A9 | Duplicate equivalent jobs are coalesced/rejected. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| A10 | The real Australia/Brisbane scheduler and startup catch-up are implemented. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| A11 | Principal list/search routes use server-side pagination and bounded queries. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| A12 | Route handlers use service/repository boundaries. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| A13 | README, roadmap, M2 status, architecture, and data-model docs are current. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| B1 | Forward-only M3 migrations preserve M2 data. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| B2 | All required intelligence/job/review/model entities are implemented or equivalently mapped with documented rationale. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| B3 | Every current Live claim has a valid primary source span. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| B4 | Every assessment identifies all source-record versions it depends on. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| B5 | Analysis identity includes input and pipeline versions. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| B6 | Identical reanalysis reuses the existing immutable analysis. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| B7 | A material source change marks dependent intelligence stale. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| B8 | Prior analyses and review decisions remain historically available. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| B9 | No composite scientific score is persisted for Live intelligence. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| B10 | pnpm intelligence:doctor detects orphaned or inconsistent intelligence data. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C1 | Study-design normalization is implemented and versioned. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C2 | Evidence availability is separate from study design/maturity. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C3 | Evidence maturity follows the fixed categorical ladder. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C4 | Organism and population context are explicit and can be unknown. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C5 | Outcome families are multi-valued and source-grounded. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C6 | Translation gaps use the controlled taxonomy. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C7 | Methodological signals are explicit and are not presented as formal risk-of-bias. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C8 | Classification confidence is labelled separately from scientific confidence. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C9 | Assessment completeness is implemented. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C10 | “What would change the assessment” is deterministic and explainable. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C11 | Hallmark tags are labelled as potential relationships, with method/confidence. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C12 | Protocol-only trials cannot produce observed efficacy findings. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C13 | Animal/cell findings cannot be displayed as human evidence. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C14 | Biomarker changes cannot be presented as demonstrated lifespan extension. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| C15 | Retractions/corrections override ordinary presentation and trigger reassessment. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| D1 | Atomic claim extraction supports the fixed roles, kinds, and directions. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| D2 | Claim wording never exceeds the cited source’s assertion. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| D3 | Planned outcomes and objectives remain distinguishable from findings. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| D4 | Claim provenance includes source object/version, section/field, and span. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| D5 | Claim fingerprints prevent duplicate claims on identical input. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| D6 | Potential conflict detection records comparability dimensions. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| D7 | Automated disagreement is labelled potentially_conflicts, not definitive contradiction. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| D8 | Human review can accept, edit, reject, mark uncertain, or dismiss. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| D9 | Review decisions are immutable and version-scoped. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| D10 | A source update can make a previous review stale without deleting it. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| E1 | AI is disabled by default. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| E2 | Provider-neutral, disabled, fixture, and OpenAI Responses adapters exist. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| E3 | OpenAI output is schema-constrained and storage is disabled. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| E4 | No permanent hard-coded model default is required when AI is disabled. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| E5 | AI receives only minimal public-source segments. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| E6 | Source text is isolated as untrusted data and model tools are disabled. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| E7 | AI cannot write directly to persistence. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| E8 | Invalid or uncited output fails policy validation. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| E9 | Provider failure leaves deterministic intelligence usable. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| E10 | Daily/request/concurrency caps are enforced. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| E11 | Secrets and hidden reasoning are not stored or logged. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| E12 | AI-assisted Live output is visibly labelled and carries provider/model provenance. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| E13 | High-impact AI-assisted cases create review tasks. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| E14 | Default automated tests make no OpenAI calls. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F1 | Intelligence run/status/item/history APIs are implemented and validated. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F2 | Assessment and claim lists support server-side filters/pagination. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F3 | Review APIs enforce local-admin and source-version concurrency rules. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F4 | Live Today shows intelligence status and non-baseline intelligence changes. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F5 | Live Research displays evidence profiles without fabricated scores. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F6 | Paper detail shows claims, gaps, signals, provenance, and history. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F7 | Trial detail visibly separates planned design, status, and posted results. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F8 | TGA detail preserves source wording and causal caveats. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F9 | Claims workspace and claim provenance view are implemented. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F10 | Review Queue works on desktop and mobile. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F11 | Retraction/correction and stale states are prominent. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F12 | Methodology explains all taxonomies, formulae, AI, and limitations. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F13 | Live missing intelligence uses honest not-assessed states. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F14 | Demo mode remains fully functional and separate. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| F15 | Accessibility checks cover new controls, badges, dialogs, and charts. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| G1 | Live Signal Radar uses evidence maturity and transparent research activity. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| G2 | Activity is not labelled social attention, truth, or efficacy. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| G3 | Tooltips expose raw counts and formula version. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| G4 | Retractions are excluded from supportive maturity aggregation but remain warned. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| G5 | TGA/correction signals use visible markers rather than a hidden score. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| G6 | Insufficient-data topics are omitted or shown honestly. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| G7 | Research activity snapshots are reproducible and versioned. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H1 | The committed offline corpus contains at least 72 cases. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H2 | At least 16 claim-pair relationship cases are included. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H3 | All deterministic evaluation gates in Section 18.1 pass. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H4 | Prompt-injection-like source text is safely treated as data. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H5 | No new external source connector or full-text scraper was added. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H6 | No personal-health data or medical recommendation feature was added. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H7 | No secret, raw database, raw live snapshot, or provider response is committed. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H8 | pnpm lint passes with zero warnings. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H9 | pnpm typecheck passes. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H10 | pnpm test passes. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H11 | pnpm test:e2e passes for desktop and mobile. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H12 | pnpm build passes. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H13 | pnpm intelligence:eval passes. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H14 | pnpm intelligence:doctor passes. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H15 | pnpm db:doctor passes. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H16 | Documentation and ADRs match implementation. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H17 | M3 screenshots and completion report are committed. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H18 | The branch is pushed and the final commit hash is reported. | DONE | M3 residual packet on M6 branch: Live V2 maturity purity, provenance mapping, APIs, providers, methodology, eval/doctor. |
| H19 | No Milestone 4 work has begun. | NOT APPLICABLE | Historical stop-before-M4; superseded by later milestones. |

## Status counts

- **DONE:** 100
- **NOT APPLICABLE:** 3
- **BLOCKED:** 0

## Key residual evidence

- Live V2: regulatory/guideline status removed as evidence-maturity stage (deterministic.ts, Methodology page, LiveEvidenceMaturitySchema).
- APIs: /api/assessments, /api/claims, /api/claim-relationships, /api/items/:id/intelligence, /api/items/:id/assessment/history.
- Providers: Disabled / Fixture / OpenAI Responses (disabled by default; CI makes no OpenAI calls).
- Methodology: docs/methodology/evidence-and-claims.md with schema equivalent mapping.
- Eval/doctor: pnpm intelligence:eval, pnpm intelligence:doctor (≥72 evidence + ≥16 claim-pair cases).

## Hash note

Later-milestone implementation does not rewrite the original milestone completion hash.
