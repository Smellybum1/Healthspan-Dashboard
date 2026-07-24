# Milestone 5 Completion Report — Healthspan Dashboard (official-brief audit)

**Branch:** `milestone-5/creator-social-intelligence`  
**Exact base:** `f809ffbbcb39a5d2fd50a9a2beb18a329f488233`  
**Official brief:** `docs/milestones/healthspan_dashboard_milestone_5_execution_brief.md`  
**Gap matrix:** `docs/milestones/BRIEF_GAP_MATRIX.md`  
**Date:** 24 July 2026  

**Status: Official-brief closure advanced — §26 corpora + document lifecycle + Review Queue landed; not every Section 34 row is DONE.**  
This report replaces the earlier overclaim that treated a chat-scrape execution as brief-complete. Pro has held M6 until official-brief closure. Remaining gaps are mostly job leases, export polish, dedicated doctors, and a full quality-gate re-cert.

| Hash role | Commit |
| --- | --- |
| Base (M4 final) | `f809ffbbcb39a5d2fd50a9a2beb18a329f488233` |
| First M5 feature skeleton | `d09209e4d7791d40dbe5140cb5330f9e19373936` |
| Schema depth (0007) | `d68ca76282b5de8d853920e0b6b7c294d42a3dc4` |
| YouTube sync/quota | `59c303e…` |
| X timeline/compliance | `f9b19b3…` |
| §11 alignment dims | `9569ee0…` |
| Doctor/eval hardening | `53edae1…` |
| Alignment corpus + honest §34 report | `0636c363c6114f9666622fe31d1147c2b180693b` |
| Final HEAD | `eca1165` (includes hash-wording commits after the report package) |

## 1. Executive summary

M5 now has a real creator-intelligence backbone aligned to the **official** brief’s hard boundaries (claims not people; YouTube metadata ≠ evidence; X optional/budget-capped/no external AI; no dosing/vendors/M6). Depth packets closed several large gaps (migration 0007 schema, document segments/spans + UI, YouTube playlist/video/quota, X timeline/compliance purge, all 15 §11 dimensions, **77/77 alignment-pair corpus**).

It is still **not** Section 34 complete: several corpora, review-queue UX, document versioning/deletion, scheduled X compliance reconciliation, and full doctor aliases remain PARTIAL/MISSING. Do **not** authorise Milestone 6 from this report.

## 2. Checklist summary (official §34)

| Section | DONE | PARTIAL | MISSING | Notes |
| --- | ---: | ---: | ---: | --- |
| A Base / M4 | 7 | 2 | 0 | Docs currency PARTIAL; M4 doctors aliased thin |
| B Identity | 6 | 5 | 1 | Roles/commercial/concurrency thinner than brief |
| C Platform policy | 6 | 4 | 1 | Audit queue / export redaction incomplete |
| D YouTube | 12 | 6 | 1 | Search UI + dedicated youtube:doctor thin |
| E X | 12 | 7 | 2 | No scheduled compliance stream; export exclusion thin |
| F Documents | 8 | 5 | 3 | Version/delete/orphan lifecycle incomplete |
| G Claims | 8 | 5 | 1 | Kind/direction/certainty taxonomies partial |
| H Alignment | 12 | 6 | 1 | Deep M3/M4 pairing + stale-on-evidence-update thin |
| I Corrections/recurrence | 4 | 7 | 3 | Recurrence formula/UI incomplete |
| J Optional AI | 8 | 2 | 1 | Disabled path strong; reserved AI path not built |
| K Jobs/API/UI | 10 | 10 | 3 | Review queue / pagination / job leases incomplete |
| L Eval/quality | 8 | 8 | 18 | Alignment corpus DONE (77); other corpora + some doctors MISSING |
| **Total (approx)** | **~101** | **~67** | **~35** | Against ~203 checklist rows |

## 3. One-row-per-criterion checklist

Legend: **DONE** / **PARTIAL** / **MISSING**. Evidence is code path or test name where short.

### A. Base, branch, and M4 closure

| ID | Status | Evidence / gap |
| --- | --- | --- |
| A1 | DONE | Branch created from `f809ffb…` |
| A2 | DONE | `milestone-5/creator-social-intelligence` |
| A3 | DONE | M4 report/history not rewritten |
| A4 | DONE | FDA/Purple Book Brisbane due + ZIP content hash |
| A5 | PARTIAL | ZIP fingerprint regressions pass; not full M4 §5 matrix re-run logged here |
| A6 | PARTIAL | `dossiers:doctor` alias; dedicated regulatory/safety doctors still thin |
| A7 | DONE | No dosing/vendor/rank regressions introduced |
| A8 | PARTIAL | ROADMAP/README updated earlier; needs refresh to “M5 closing, M6 held” |
| A9 | DONE | No M6 implementation; Pro hold acknowledged |

### B. Creator identity and profiles

| ID | Status | Evidence / gap |
| --- | --- | --- |
| B1 | DONE | `creator_entities` ≠ `creator_platform_accounts` |
| B2 | PARTIAL | kinds/confidence present; full role/lifecycle taxonomies thin |
| B3 | DONE | Bootstrap is example catalog only, not real celebrity seeds |
| B4 | DONE | Multiple accounts per creatorId supported |
| B5 | PARTIAL | Identity candidate/task tables exist; queue UX thin |
| B6 | DONE | No biometric inference |
| B7 | PARTIAL | `creator_roles` table; provenance UI thin |
| B8 | PARTIAL | Disclosures require source text; commercial graph thin |
| B9 | DONE | No auto sponsorship inference |
| B10 | PARTIAL | Profile snapshots table; redaction workflow thin |
| B11 | DONE | Prohibited scores enforced in package + UI copy |
| B12 | MISSING | Append-only concurrency checks not fully implemented |

### C. Platform-policy storage

| ID | Status | Evidence / gap |
| --- | --- | --- |
| C1 | DONE | Creator platform tables; YT/X ingest skips RawSnapshotStore |
| C2 | PARTIAL | retention/policy fields present; not universal on every row |
| C3 | DONE | refresh/display deadlines on YT content |
| C4 | DONE | X purge + compliance events |
| C5 | DONE | `displayEligible` + retention hold |
| C6 | DONE | Current text purged on X delete/withhold |
| C7 | PARTIAL | Snapshot redaction incomplete |
| C8 | DONE | Tombstones without deleted text |
| C9 | MISSING | Policy audit queue UI/API incomplete |
| C10 | PARTIAL | Safe response rules partial; export exclusion incomplete |
| C11 | DONE | `platform-policy:doctor` passes disabled-healthy checks |

### D. YouTube

| ID | Status | Evidence / gap |
| --- | --- | --- |
| D1 | DONE | `createYoutubeClient` / connector |
| D2 | DONE | UC id + forHandle resolve |
| D3 | PARTIAL | search.list helper exists; confirm UI thin |
| D4 | DONE | uploads playlist walk |
| D5 | DONE | videos.list batching |
| D6 | DONE | 180d / 200 video caps |
| D7 | DONE | baseline flag suppresses “new” counting |
| D8 | PARTIAL | knownVideoIds incremental path present; event bus thin |
| D9 | DONE | `platform_quota_ledgers` by method/day |
| D10 | DONE | app daily cap stop + near-limit |
| D11 | PARTIAL | deadlines set; scheduled refresh job thin |
| D12 | DONE | private/unavailable purge path |
| D13 | DONE | no comments parts requested |
| D14 | DONE | no engagement stats |
| D15 | DONE | scrape/media/STT prohibited in code/docs |
| D16 | DONE | claimEvidence false; policy notes |
| D17 | DONE | rawBodies empty for YT fetch |
| D18 | PARTIAL | profile lists metadata + note; attribution polish thin |
| D19 | PARTIAL | aliased via platform-policy doctor |

### E. X

| ID | Status | Evidence / gap |
| --- | --- | --- |
| E1 | DONE | disabled by default |
| E2 | DONE | token + ack + cap gate |
| E3 | DONE | auto-recharge rejected in tests |
| E4 | DONE | username → user id resolve |
| E5 | DONE | monitored accounts only |
| E6 | DONE | replies/reposts excluded by default |
| E7 | DONE | 90d / 200 caps |
| E8 | DONE | spend ledger micros |
| E9 | DONE | budget_blocked before job |
| E10 | PARTIAL | API returns status; Source Health polish thin |
| E11 | DONE | not on Sync-all; opt-in sourceId=x |
| E12 | MISSING | startup/daily compliance reconciliation job |
| E13 | DONE | delete/withhold/protected handling |
| E14 | PARTIAL | edit fields stored; full edit policy thin |
| E15 | PARTIAL | overdue display rules partial |
| E16 | DONE | dependent claims invalidated on purge |
| E17 | DONE | x-ai-policy + connector fence |
| E18 | PARTIAL | export exclusion not fully audited |
| E19 | DONE | no search/trends/DMs |
| E20 | DONE | no engagement metrics |
| E21 | PARTIAL | aliased doctor |

### F. Documents and rights

| ID | Status | Evidence / gap |
| --- | --- | --- |
| F1–F4 | DONE | VTT/SRT/TXT/JSON parse |
| F5 | DONE | size/type validation |
| F6 | DONE | no HTML execution path |
| F7 | DONE | rightsBasis required in API/UI |
| F8 | PARTIAL | claimEligible flag; hard block path thin |
| F9 | DONE | segments + claim source spans |
| F10 | PARTIAL | excerpt caps; full export guard incomplete |
| F11 | PARTIAL | manual claim length bounds; quote UI polish thin |
| F12 | DONE | `replacesDocumentId` supersedes prior doc |
| F13 | DONE | delete removes bytes/segments |
| F14 | DONE | dependent claims `stale_source_deleted` |
| F15 | DONE | no orphan segments after delete |
| F16 | PARTIAL | covered via creators:doctor/eval; dedicated alias optional |

### G. Creator claims

| ID | Status | Evidence / gap |
| --- | --- | --- |
| G1 | DONE | separate `creator_claims` |
| G2 | PARTIAL | assertionRole strong; kind/direction/certainty columns underused |
| G3 | PARTIAL | deterministic split heuristics |
| G4 | PARTIAL | document imports write spans; manual claims optional URL |
| G5 | DONE | questions not converted |
| G6 | PARTIAL | quotation role exists; endorsement rules thin |
| G7 | PARTIAL | hypothetical/uncertainty roles |
| G8 | PARTIAL | dosing not reproduced as advice; redaction incomplete |
| G9 | DONE | claimFingerprint / recurrenceKey |
| G10 | PARTIAL | candidate findings marked review; task queue thin |
| G11 | PARTIAL | source_unavailable finding; claim lifecycle UI thin |
| G12 | DONE | no YT metadata → claim extraction |
| G13 | DONE | X→AI blocked |
| G14 | PARTIAL | creators:doctor covers claims policy |

### H. Evidence alignment

| ID | Status | Evidence / gap |
| --- | --- | --- |
| H1 | DONE | all 15 §11.1 dimensions |
| H2 | DONE | multi-valued findings, no numeric total |
| H3 | PARTIAL | link tables exist; deep provenance pairing thin |
| H4 | PARTIAL | intervention link flag |
| H5 | DONE | species mismatch / animal_to_human_overreach |
| H6 | DONE | population not_comparable |
| H7 | DONE | protocol_as_result |
| H8 | DONE | biomarker overreach |
| H9 | DONE | causality overreach |
| H10 | DONE | regulatory scope overreach |
| H11 | DONE | safety scope overreach |
| H12 | DONE | not_comparable |
| H13 | DONE | local-corpus wording |
| H14 | DONE | potential conflict ≠ definitive |
| H15 | PARTIAL | candidate reviewState; profile gate incomplete |
| H16 | PARTIAL | evidenceUpdated → unresolved; auto-stale wiring thin |
| H17 | PARTIAL | assessments append; history UI thin |
| H18 | DONE | claims never mutate M3/M4 maturity |
| H19 | DONE | no overall score |

### I. Corrections, disclosures, recurrence

| ID | Status | Evidence / gap |
| --- | --- | --- |
| I1 | PARTIAL | corrections table; workflow thin |
| I2 | DONE | deletion ≠ correction in model |
| I3 | PARTIAL | disclosures from text; review thin |
| I4 | DONE | no undisclosed-conflict inference |
| I5–I14 | PARTIAL/MISSING | recurrence key counts only; formula/UI incomplete |

### J. Optional AI

| ID | Status | Evidence / gap |
| --- | --- | --- |
| J1–J2 | DONE | AI not required |
| J3–J5 | DONE | X/YT metadata blocked from external AI |
| J6–J10 | PARTIAL/MISSING | reserved path not implemented |
| J11 | DONE | default tests make no model calls |

### K. Jobs, APIs, source health, and UI

| ID | Status | Evidence / gap |
| --- | --- | --- |
| K1–K4 | PARTIAL/MISSING | some jobs; not full lease/priority model for M5 |
| K5–K6 | PARTIAL | limits exist; not all list endpoints paginated |
| K7 | DONE | admin guard on mutations |
| K8 | PARTIAL | core APIs present; alignment/review/recurrence incomplete |
| K9 | PARTIAL | safe response rules partial |
| K10–K11 | DONE | Creators list/detail |
| K12 | PARTIAL | accounts via API; Source Management polish thin |
| K13–K14 | DONE | document import + manual claim UI |
| K15 | DONE | Creator Claims workspace |
| K16 | PARTIAL | dimensions shown on claims list; dedicated Alignment detail thin |
| K17 | DONE | Creator alignment findings on Review Queue; accept required before profile publish |
| K18 | PARTIAL | Today creator watch present |
| K19 | PARTIAL | quota/budget APIs; Source Health incomplete |
| K20 | DONE | disabled/empty states |
| K21 | DONE | Demo/Live separation |
| K22 | PARTIAL | e2e mobile coverage earlier; a11y not re-certified here |
| K23 | DONE | no trust/rank/engagement UI |

### L. Evaluation, security, and quality

| ID | Status | Evidence / gap |
| --- | --- | --- |
| L1 | DONE | identity corpus 52 |
| L2 | DONE | document corpus 68 |
| L3 | DONE | claim corpus 185 with required subsets |
| L4 | DONE | **77 alignment pairs, 77/77 pass** (`evaluateAlignmentPairCorpus`) |
| L5 | DONE | recurrence corpus 24 |
| L6 | DONE | compliance/retention corpus 41 |
| L7 | PARTIAL | subset of 26.7 gates covered in creators:eval |
| L8–L10 | DONE | policy prohibitions held |
| L11–L15 | PARTIAL | last full green set was pre-closure packets; re-run required at final close |
| L16–L22 | PARTIAL | doctors exist/aliased; not all dedicated |
| L23–L24 | DONE | creators:eval / creators:doctor |
| L25–L29 | PARTIAL | aliases to creators/platform-policy doctors |
| L30 | DONE | platform-policy:doctor |
| L31 | PARTIAL | ADR-0010 + DATA_MODEL; docs refresh needed |
| L32 | PARTIAL | screenshots earlier; report rewritten here |
| L33 | DONE | branch pushed continuously during closure |
| L34 | DONE | M6 held; no M6 code |

## 4. Alignment-pair corpus composition (L4)

| Category | Cases |
| --- | ---: |
| fully_aligned | 6 |
| partially_aligned | 6 |
| species_mismatch | 6 |
| population_mismatch | 5 |
| protocol_as_result | 5 |
| biomarker_overreach | 5 |
| effect_magnitude_overreach | 5 |
| causality_overreach | 5 |
| regulatory_indication_mismatch | 5 |
| safety_scope_overreach | 5 |
| not_comparable | 5 |
| potential_conflict | 4 |
| evidence_update | 4 |
| retraction | 3 |
| source_unavailable | 3 |
| no_linked_local_evidence | 5 |
| **Total** | **77** |

Source: `packages/creators/src/alignment-corpus.ts`  
Gate: `pnpm creators:eval` / vitest `alignment-corpus.test.ts`

## 5. Migrations / packages (high level)

- `0006_m5_creators`, `0007_m5_creator_schema_depth`
- `@healthspan/creators` — documents, claims, §11 alignment, alignment corpus, X AI policy
- `@healthspan/connectors` — YouTube client/sync depth, X client/budget/compliance helpers
- API — `youtube-sync-service`, `x-sync-service`, document import, claim APIs
- Web — creator profile import/sync/manual claim; claims dimension grid

## 6. Known limitations (blocking official “complete”)

1. Remaining §26 corpora (identity/document/claim/recurrence/compliance) below brief minima  
2. Review Queue + adverse-finding publish gate  
3. Document version/delete lifecycle  
4. Scheduled X compliance reconciliation  
5. Dedicated youtube/x/creator-documents doctors (mostly aliases)  
6. Honest re-run of full lint/typecheck/test/e2e/build matrix at final close  

## 7. Stop point / next

- **Do not start M6.**  
- Continue M5 official-brief packets, then M4→M3→M2 residuals per `BRIEF_GAP_MATRIX.md`.  
- When Section 34 is actually all DONE (or Pro re-scopes), publish a new completion report with final HEAD + green gate table and only then request M6 authorisation.
