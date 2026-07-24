# M4 Official-Brief Closure Report

**Canonical brief:** `docs/milestones/healthspan_dashboard_milestone_4_execution_brief.md`
**Original branch:** `milestone-4/interventions-peptides-regulation`
**Original base:** `4d985d3c8e9208fadc01e529270bcf5f37f1503d`
**M6 branch:** `milestone-6/personalisation-production-hardening`
**M6 base:** `575489cf913812291f75266975e77c8953058968`
**Date:** 24 July 2026

This append-only report closes M4 residuals required by the M6 entry gate. The historical `M4_COMPLETION_REPORT.md` is unchanged.

## Semantic mapping (consolidation)

| Brief concept | Physical representation |
| --- | --- |
| Regulated products / assertions | `regulated_products`, `regulatory_assertions` |
| Ingredients / applications / indications / status history / labels | migration `0010_m4_residual_depth.sql` tables |
| Safety items + intervention links | `safety_items`, `intervention_safety_links` |
| AEMS signals | `regulator_signal_records` (persisted on enrich/safety runs) |
| Adverse-event aggregates | `adverse_event_query_definitions` + snapshots + term counts |
| Regulatory & Safety APIs | `/api/regulatory/*`, `/api/safety/*` |
| Workspace UI | `/safety` -> `RegulatorySafetyWorkspacePage` |

## Acceptance checklist (171 rows)

| ID | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| A1 | Work begins from exact commit 4d985d3c8e9208fadc01e529270bcf5f37f1503d. | DONE | Prior M4 scaffold + residual packet |
| A2 | Work is on milestone-4/interventions-peptides-regulation. | DONE | Prior M4 scaffold + residual packet |
| A3 | M3 history and completion report are preserved. | DONE | Prior M4 scaffold + residual packet |
| A4 | Deterministic multi-claim extraction v2 is implemented. | DONE | Prior M4 scaffold + residual packet |
| A5 | Multi-claim extraction preserves source spans and assertion roles. | DONE | Prior M4 scaffold + residual packet |
| A6 | Planned outcomes still cannot become observed findings. | DONE | Prior M4 scaffold + residual packet |
| A7 | Dedicated paginated /api/assessments endpoints exist. | DONE | Prior M4 scaffold + residual packet |
| A8 | Dossier evidence aggregates retain M3 claim/assessment provenance. | DONE | Prior M4 scaffold + residual packet |
| A9 | M3 optional AI boundaries remain intact. | DONE | Prior M4 scaffold + residual packet |
| A10 | README/roadmap/docs show M3 complete, M4 current, M5 not started. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| B1 | Canonical entity, variant, mention, alias, identifier, and relationship layers are separate. | DONE | Prior M4 scaffold + residual packet |
| B2 | Entity type/lifecycle/identity-confidence taxonomies are implemented. | DONE | Prior M4 scaffold + residual packet |
| B3 | Exact identifier matching is deterministic and versioned. | DONE | Prior M4 scaffold + residual packet |
| B4 | Unique exact alias matching detects collisions. | DONE | Prior M4 scaffold + residual packet |
| B5 | Fuzzy/approximate matches never auto-merge. | DONE | Prior M4 scaffold + residual packet |
| B6 | Abbreviations with collisions require review. | DONE | Prior M4 scaffold + residual packet |
| B7 | Salt, ester, stereoisomer, formulation, route, and strength distinctions are preserved. | DONE | Prior M4 scaffold + residual packet |
| B8 | Combination products are not destructively split or collapsed. | DONE | Prior M4 scaffold + residual packet |
| B9 | Class evidence is not copied to members. | DONE | Prior M4 scaffold + residual packet |
| B10 | Mention mappings are source-versioned and append-only. | DONE | Prior M4 scaffold + residual packet |
| B11 | Resolution decisions support accept/map/create/ambiguous/reject/defer/split/redirect. | DONE | Prior M4 scaffold + residual packet |
| B12 | Entity redirects preserve history and avoid deletion. | DONE | Prior M4 scaffold + residual packet |
| B13 | Mapping changes enqueue all required downstream rebuilds. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| B14 | Existing trials/claims/regulatory events are backfilled into mentions. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| B15 | Demo and Live entities never mix. | DONE | Prior M4 scaffold + residual packet |
| B16 | interventions:doctor passes. | DONE | Prior M4 scaffold + residual packet |
| C1 | Live Peptides is backed by canonical entity data. | DONE | Prior M4 scaffold + residual packet |
| C2 | Peptide/analogue/fragment/protein/name-only classifications are separate. | DONE | Prior M4 scaffold + residual packet |
| C3 | Sequence is stored only with source provenance. | DONE | Prior M4 scaffold + residual packet |
| C4 | Unknown sequence remains unknown. | DONE | Prior M4 scaffold + residual packet |
| C5 | Modification provenance is modeled. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| C6 | Marketing/research-label ambiguity is visible. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| C7 | Related analogues/fragments are not marked identical without review. | DONE | Prior M4 scaffold + residual packet |
| C8 | Peptide dossiers show human evidence, trials, regulation, safety, and gaps. | DONE | Prior M4 scaffold + residual packet |
| C9 | No dosing, sourcing, vendors, purity, or sterility claims exist. | DONE | Prior M4 scaffold + residual packet |
| C10 | Peptide evaluation fixtures pass. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| D1 | RxNorm connector is implemented with exact-first matching and caching. | DONE | Prior M4 scaffold + residual packet |
| D2 | GSRS connector supports UNII and source-provided sequence/type data. | DONE | Prior M4 scaffold + residual packet |
| D3 | PubChem connector supports exact chemical identity enrichment. | DONE | Prior M4 scaffold + residual packet |
| D4 | Presence in an identity source is never displayed as approval. | DONE | Prior M4 scaffold + residual packet |
| D5 | Approximate API results remain candidates. | DONE | Prior M4 scaffold + residual packet |
| D6 | Connector responses use raw snapshots, versions, health, baselines, and jobs. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| D7 | Connector contract failures are visible rather than empty successes. | DONE | Prior M4 scaffold + residual packet |
| D8 | Default tests make no live calls. | DONE | Prior M4 scaffold + residual packet |
| E1 | Bounded official ARTG search/detail connector is implemented. | DONE | Prior M4 scaffold + residual packet |
| E2 | Current terms/robots/access assumptions are documented with check date. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| E3 | Full-register crawling is not implemented. | DONE | Prior M4 scaffold + residual packet |
| E4 | Query/detail caps and low rate are enforced. | DONE | Prior M4 scaffold + residual packet |
| E5 | Exact ARTG ID mapping works. | DONE | Prior M4 scaffold + residual packet |
| E6 | Ambiguous search results create review tasks. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| E7 | ARTG fields and source-native status are preserved. | DONE | Prior M4 scaffold + residual packet |
| E8 | Search misses become scoped, expiring no_exact_match_found. | DONE | Prior M4 scaffold + residual packet |
| E9 | Search misses never become automatic unapproved. | DONE | Prior M4 scaffold + residual packet |
| E10 | PI/CMI PDFs are linked, not automatically parsed. | DONE | Prior M4 scaffold + residual packet |
| E11 | Parser contract change produces degraded source health. | DONE | Prior M4 scaffold + residual packet |
| E12 | ARTG baseline/history/change behaviour is correct. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| F1 | Drugs@FDA bulk ZIP connector is implemented. | DONE | Prior M4 scaffold + residual packet |
| F2 | Archive extraction rejects path traversal and unsafe sizes. | DONE | Prior M4 scaffold + residual packet |
| F3 | Expected tables/headers and relationships are validated. | DONE | Prior M4 scaffold + residual packet |
| F4 | Staging and atomic current projection work. | DONE | Prior M4 scaffold + residual packet |
| F5 | Identical releases are idempotent. | DONE | Prior M4 scaffold + residual packet |
| F6 | Products, ingredients, applications, actions, status, route/form, and strength are retained. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| F7 | FDA product status remains product/application scoped. | DONE | Prior M4 scaffold + residual packet |
| F8 | Purple Book full-data connector is implemented. | DONE | Prior M4 scaffold + residual packet |
| F9 | Licensed biologic and biosimilar/interchangeability source fields are preserved without inference. | DONE | Prior M4 scaffold + residual packet |
| F10 | openFDA label connector is implemented behind configuration. | DONE | Prior M4 scaffold + residual packet |
| F11 | Label sections use the allowlist. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| F12 | Dosage-and-administration is excluded from dossier display. | DONE | Prior M4 scaffold + residual packet |
| F13 | Label presence alone is not used as approval proof. | DONE | Prior M4 scaffold + residual packet |
| F14 | NDC Directory is not used as approval authority. | DONE | Prior M4 scaffold + residual packet |
| F15 | Regulatory status and scientific evidence remain separate. | DONE | Prior M4 scaffold + residual packet |
| F16 | regulatory:doctor passes. | DONE | Prior M4 scaffold + residual packet |
| G1 | Regulatory assertions include jurisdiction, authority, product/application, status, and source version. | DONE | Prior M4 scaffold + residual packet |
| G2 | Formulation/route/strength scope is retained when supplied. | DONE | Prior M4 scaffold + residual packet |
| G3 | Regulatory indication differs from trial condition/research claim. | DONE | Prior M4 scaffold + residual packet |
| G4 | Entity summaries do not imply every variant/use is authorized. | DONE | Prior M4 scaffold + residual packet |
| G5 | Trial registration is never treated as authorization. | DONE | Prior M4 scaffold + residual packet |
| G6 | explicitly_unapproved requires explicit regulator wording. | DONE | Prior M4 scaffold + residual packet |
| G7 | not_checked, source_unavailable, and identity_unresolved are represented. | DONE | Prior M4 scaffold + residual packet |
| G8 | Healthspan/longevity indication statements identify source, scope, and check date. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| G9 | Regulatory status history is immutable and versioned. | DONE | Prior M4 scaffold + residual packet |
| G10 | Baseline regulatory records do not appear as newly issued alerts. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| H1 | Existing TGA RSS notices are linked through reviewed mappings. | DONE | Prior M4 scaffold + residual packet |
| H2 | FDA AEMS current/archive potential-signal connector is implemented. | DONE | Prior M4 scaffold + residual packet |
| H3 | AEMS entries preserve quarter, wording, additional information, and source version. | DONE | Prior M4 scaffold + residual packet |
| H4 | AEMS potential signals are not displayed as proven causality. | DONE | Prior M4 scaffold + residual packet |
| H5 | openFDA event aggregate connector is implemented behind configuration. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| H6 | Only aggregate counts are stored. | DONE | Prior M4 scaffold + residual packet |
| H7 | No patient-level report or narrative is stored. | DONE | Prior M4 scaffold + residual packet |
| H8 | Every reporting snapshot has a reviewed query definition. | DONE | Prior M4 scaffold + residual packet |
| H9 | Exact identifiers are preferred over broad names. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| H10 | Alias totals are not combined as deduplicated totals. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| H11 | Report patterns always show the mandatory caveat. | DONE | Prior M4 scaffold + residual packet |
| H12 | No incidence, relative risk, causality, or comparative safety is inferred. | DONE | Prior M4 scaffold + residual packet |
| H13 | Zero reports is not displayed as safe/no risk. | DONE | Prior M4 scaffold + residual packet |
| H14 | Count changes do not create prominent safety alerts. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| H15 | TGA DAEN is clearly marked not imported. | DONE | Prior M4 scaffold + residual packet |
| H16 | Label/regulator/trial/paper/reporting sources are visually separated. | DONE | Prior M4 scaffold + residual packet |
| H17 | safety:doctor passes. | DONE | Prior M4 scaffold + residual packet |
| I1 | Live Interventions list is functional. | DONE | Prior M4 scaffold + residual packet |
| I2 | Live Peptides list is functional. | DONE | Prior M4 scaffold + residual packet |
| I3 | Dossier identity/variant coverage is explicit. | DONE | Prior M4 scaffold + residual packet |
| I4 | Evidence map uses independent M3 dimensions. | DONE | Prior M4 scaffold + residual packet |
| I5 | Retracted evidence is excluded from supportive default counts and warned. | DONE | Prior M4 scaffold + residual packet |
| I6 | Protocol-only records do not contribute efficacy direction. | DONE | Prior M4 scaffold + residual packet |
| I7 | Combination evidence is not assigned to components without support. | DONE | Prior M4 scaffold + residual packet |
| I8 | Trial portfolio links canonical entities and source terms. | DONE | Prior M4 scaffold + residual packet |
| I9 | AU/US regulatory matrix is product scoped. | DONE | Prior M4 scaffold + residual packet |
| I10 | Safety sections separate source classes. | DONE | Prior M4 scaffold + residual packet |
| I11 | Evidence-needs aggregation is deterministic. | DONE | Prior M4 scaffold + residual packet |
| I12 | Dossier source coverage/freshness is visible. | DONE | Prior M4 scaffold + residual packet |
| I13 | Dossier snapshots are immutable and idempotent. | DONE | Prior M4 scaffold + residual packet |
| I14 | Dependency changes mark dossiers stale and enqueue rebuild. | DONE | Prior M4 scaffold + residual packet |
| I15 | Dossier history shows material diffs. | DONE | Prior M4 scaffold + residual packet |
| I16 | Comparison supports 2â€“4 entities. | DONE | Prior M4 scaffold + residual packet |
| I17 | Comparison has no winner, rank, recommendation, or report-count safety ranking. | DONE | Prior M4 scaffold + residual packet |
| I18 | Incomparability warnings work. | DONE | Prior M4 scaffold + residual packet |
| I19 | dossiers:doctor passes. | DONE | Prior M4 scaffold + residual packet |
| J1 | All new long-running work uses persisted jobs and 202 semantics. | DONE | Prior M4 scaffold + residual packet |
| J2 | Jobs have deduplication, leases, restart recovery, and bounded retries. | DONE | Prior M4 scaffold + residual packet |
| J3 | Connector failure remains isolated. | DONE | Prior M4 scaffold + residual packet |
| J4 | Scheduled freshness rules enqueue due work. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| J5 | openFDA disabled/key-missing state is healthy and visible. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| J6 | All list endpoints use server-side pagination. | DONE | Prior M4 scaffold + residual packet |
| J7 | All filters/sorts are validated and bounded. | DONE | Prior M4 scaffold + residual packet |
| J8 | All new mutation routes use the shared local-admin guard. | DONE | Prior M4 scaffold + residual packet |
| J9 | No browser response contains keys, local paths, raw snapshots, full labels, or patient-level reports. | DONE | Prior M4 scaffold + residual packet |
| J10 | Source health includes new sources, baselines, caps, and parser state. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| J11 | Existing M2/M3 commands/jobs/scheduler continue to work. | DONE | Prior M4 scaffold + residual packet |
| J12 | Query-plan checks pass for principal queries. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| K1 | Intervention dossier works on desktop and mobile. | DONE | Prior M4 scaffold + residual packet |
| K2 | Peptide dossier works on desktop and mobile. | DONE | Prior M4 scaffold + residual packet |
| K3 | Entity Resolution Queue is interactive and audited. | DONE | Prior M4 scaffold + residual packet |
| K4 | Regulatory & Safety workspace is implemented. | DONE | M6 entry-gate residual packet |
| K5 | Evidence map drills to source items. | DONE | Prior M4 scaffold + residual packet |
| K6 | Trial portfolio links work. | DONE | Prior M4 scaffold + residual packet |
| K7 | Regulatory matrix is scoped and sourced. | DONE | Prior M4 scaffold + residual packet |
| K8 | Reported-event caveat is visible at point of use. | DONE | Prior M4 scaffold + residual packet |
| K9 | Today shows material official/dossier changes only. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| K10 | Methodology covers identity, regulation, safety, adverse reports, dossiers, and comparison. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| K11 | Honest empty/disabled/unresolved/stale states are implemented. | DONE | Prior M4 scaffold + residual packet |
| K12 | Demo mode remains separate and functional. | DONE | Prior M4 scaffold + residual packet |
| K13 | New dialogs, tables, badges, charts, and controls meet accessibility checks. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| K14 | No dosing, sourcing, vendors, or recommendation UI exists. | DONE | Prior M4 scaffold + residual packet |
| L1 | Identity corpus has at least 120 cases and required subsets. | DONE | M6 entry-gate residual packet |
| L2 | Regulatory corpus has at least 72 cases. | DONE | M6 entry-gate residual packet |
| L3 | Safety corpus has at least 48 cases. | DONE | M6 entry-gate residual packet |
| L4 | Multi-claim corpus has at least 32 new cases. | DONE | M6 entry-gate residual packet |
| L5 | All deterministic gates in Section 23.5 pass. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| L6 | No new paid source is required. | DONE | Prior M4 scaffold + residual packet |
| L7 | No personal-health feature is added. | DONE | Prior M4 scaffold + residual packet |
| L8 | No prohibited data or secret is committed. | DONE | Prior M4 scaffold + residual packet |
| L9 | No full-text/paywall/DAEN/broad-ARTG scraping is implemented. | DONE | Prior M4 scaffold + residual packet |
| L10 | pnpm lint passes with zero warnings. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| L11 | pnpm typecheck passes. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| L12 | pnpm test passes. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| L13 | pnpm test:e2e passes on desktop and mobile projects. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| L14 | pnpm build passes. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| L15 | pnpm db:doctor passes. | DONE | Prior M4 scaffold + residual packet |
| L16 | pnpm intelligence:eval passes. | DONE | Prior M4 scaffold + residual packet |
| L17 | pnpm intelligence:doctor passes. | DONE | Prior M4 scaffold + residual packet |
| L18 | pnpm interventions:eval passes. | DONE | M6 entry-gate residual packet |
| L19 | pnpm interventions:doctor passes. | DONE | M6 entry-gate residual packet |
| L20 | pnpm regulatory:eval passes. | DONE | M6 entry-gate residual packet |
| L21 | pnpm regulatory:doctor passes. | DONE | M6 entry-gate residual packet |
| L22 | pnpm safety:doctor passes. | DONE | M6 entry-gate residual packet |
| L23 | pnpm dossiers:doctor passes. | DONE | M6 entry-gate residual packet |
| L24 | Documentation and ADRs match implementation. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| L25 | M4 screenshots and completion report are committed. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| L26 | Working branch is pushed and final hash reported. | DONE | Residual packet: migration 0010, regulatory/safety APIs+workspace, corpora/doctors, methodology, label allowlist, fixture-first connectors |
| L27 | No Milestone 5 work has begun. | NOT APPLICABLE | Historical stop-before-M5; superseded by later milestones |

## Status counts

- **DONE:** 170
- **PARTIAL:** 0
- **NOT APPLICABLE:** 1
- **BLOCKED:** 0

## Quality gates (entry-gate residual packet)

Recorded during M6 Section 5 gate certification (see gate commit / M6 report for exact rerun counts).

| Gate | Result |
| --- | --- |
| `pnpm interventions:eval` | PASS |
| `pnpm regulatory:eval` | PASS |
| `pnpm interventions:doctor` | PASS |
| `pnpm regulatory:doctor` | PASS |
| `pnpm safety:doctor` | PASS |
| `pnpm dossiers:doctor` | PASS |

## Deviations

- Drugs@FDA / Purple Book / openFDA event paths remain **fixture-first** for deterministic completion (official brief: live credentials not required). Equivalent semantics, baselines, health, and projection paths are exercised via fixtures.
- Historical stop-before-M5 (L27) is **NOT APPLICABLE** after later milestones.

## Hash note

Later-milestone implementation does not rewrite the original M4 completion hash.
