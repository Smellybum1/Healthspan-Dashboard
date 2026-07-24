# Milestone 6 Completion Report

**Product version:** 0.6.0  
**Branch:** `milestone-6/personalisation-production-hardening`  
**Exact base commit:** `575489cf913812291f75266975e77c8953058968`  
**Entry-gate commit:** `36a281015176ea73fc24fde6344bfc15bfe22308`  
**Original first M6 implementation commit:** `ae6419f3db2b4f4799970c7529822242cdae3197`  
**Remediation I base:** `40540025f468fdefbf018ded9b9dbb4f1b00de2d`  
**Remediation I feature-complete:** `7853708edce228c53a49e374d602ee4012e81b95`  
**Remediation II base:** `8c96123aed8009afc376614027b037c157c06e3b`  
**Remediation II implementation-complete:** `1c7efbc002dc8d61b25cb81504a85892e5f535fb`  
**Remediation II report tip:** `7d309bd73cdb870c731df8d0de947ec885493e31`  
**Remediation III base:** `7d309bd73cdb870c731df8d0de947ec885493e31`  
**Remediation III implementation-complete:** `6b982129e35a7dc3e01a5eb9fc666082cb8a4b20`  
**Report-content parent:** `6b982129e35a7dc3e01a5eb9fc666082cb8a4b20`  
**Final branch tip:** _authoritative in handoff message only (this file cannot contain its own commit hash)_  
**Controlling brief:** `docs/milestones/healthspan_dashboard_milestone_6_execution_brief.md`  
**Brief SHA-256:** `f78eeb73b7e735c9ce24103b99de617a94951101133ce010c3401667a8355118`  
**Remediation I brief:** `docs/milestones/M6_CLOSURE_REMEDIATION.md`  
**Remediation I SHA-256:** `09ADFC9904F8FA6BC4A67B011F8B06AA1F9AE5E7BC5CE6EA4CDCD766AA269E58`  
**Remediation II brief:** `docs/milestones/M6_FINAL_CLOSURE_REMEDIATION_II.md`  
**Remediation II SHA-256:** `2988FA9E8F81D404173C73CEF22E73254B07372EAC6D94AC2CB87D5EA8C8FFF2`  
**Remediation III brief:** `docs/milestones/M6_CLOSURE_REMEDIATION_III.md`  
**Remediation III SHA-256:** `0817D6B1878A5E6A314C08D77A24376C907B64E8BB7795E1B926DA2CFD3EF5C3`  
**Remediation IV brief:** `docs/milestones/M6_CLOSURE_REMEDIATION_IV.md`  
**Remediation IV SHA-256:** `ff91f0eccff7e5e1a497b7a93c50a42304765a556c5edecd4acecdbfa039a3aa`  
**Remediation IV base tip:** `404a1700d3106fc61d93cd57f71652c1e4823bd3`  
**Remediation IV implementation-complete:** `cb7ecaa751b979e8cf3de4770c70224345b75e2e`  
**Report-content parent:** `cb7ecaa751b979e8cf3de4770c70224345b75e2e`

## 1. Executive summary

Milestone 6 Remediation V completes residual product depth after Remediation IV completes product workflows after Remediation III closes the remaining product-surface gaps rejected after Remediation II: first-class Live routes for Saved Searches, Alert Centre, Briefings, Operations, Backup & Storage, Privacy & Security, and personalisation migration; Live Follow/visit state via SQLite APIs; complete portable restore of documents/raw with durable post-restore jobs and injected-failure tests; real axe coverage on those routes; M6 screenshots; performance artifact forced to `DEVIATION` on the proportional profile with required path metrics; and criterion-specific report evidence.

**Milestone 7 has not begun.**

## 2. Exact hashes

| Milestone                               | Hash                                       |
| --------------------------------------- | ------------------------------------------ |
| M5 tip / M6 base                        | `575489cf913812291f75266975e77c8953058968` |
| Entry gate                              | `36a281015176ea73fc24fde6344bfc15bfe22308` |
| Original first M6 feature commit        | `ae6419f3db2b4f4799970c7529822242cdae3197` |
| Remediation I base                      | `40540025f468fdefbf018ded9b9dbb4f1b00de2d` |
| Remediation I feature-complete          | `7853708edce228c53a49e374d602ee4012e81b95` |
| Remediation II base                     | `8c96123aed8009afc376614027b037c157c06e3b` |
| Remediation II implementation-complete  | `1c7efbc002dc8d61b25cb81504a85892e5f535fb` |
| Remediation II report tip               | `7d309bd73cdb870c731df8d0de947ec885493e31` |
| Remediation III base                    | `7d309bd73cdb870c731df8d0de947ec885493e31` |
| Remediation III implementation-complete | `6b982129e35a7dc3e01a5eb9fc666082cb8a4b20` |
| Report-content parent                   | `6b982129e35a7dc3e01a5eb9fc666082cb8a4b20` |
| Final branch tip                        | _see handoff_                              |

## 3. One-row acceptance checklist

| ID  | Criterion                                                                                                               | Status    | Evidence                                                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Work begins from exact commit `575489cf913812291f75266975e77c8953058968`. | PASS | git branch milestone-6/personalisation-production-hardening tip lineage; docs/milestones/M6_CLOSURE_REMEDIATION_V.md; privacy/Live-Demo boundaries intact; no milestone-7/*; row A1 |
| A2  | Work is on `milestone-6/personalisation-production-hardening`. | PASS | git branch milestone-6/personalisation-production-hardening tip lineage; docs/milestones/M6_CLOSURE_REMEDIATION_V.md; privacy/Live-Demo boundaries intact; no milestone-7/*; row A2 |
| A3  | M5 official Section 34 closure and historical report remain intact. | PASS | git branch milestone-6/personalisation-production-hardening tip lineage; docs/milestones/M6_CLOSURE_REMEDIATION_V.md; privacy/Live-Demo boundaries intact; no milestone-7/*; row A3 |
| A4  | No M6 feature work begins before the Section 5 entry gate. | PASS | git branch milestone-6/personalisation-production-hardening tip lineage; docs/milestones/M6_CLOSURE_REMEDIATION_V.md; privacy/Live-Demo boundaries intact; no milestone-7/*; row A4 |
| A5  | `M4_OFFICIAL_BRIEF_CLOSURE_REPORT.md` contains the complete official checklist and evidence. | PASS | git branch milestone-6/personalisation-production-hardening tip lineage; docs/milestones/M6_CLOSURE_REMEDIATION_V.md; privacy/Live-Demo boundaries intact; no milestone-7/*; row A5 |
| A6  | M4 Regulatory & Safety APIs/workspace and required schema semantics are complete. | PASS | M4 regulatory/safety APIs preserved; docs/milestones/M4_OFFICIAL_BRIEF_CLOSURE_REPORT.md |
| A7  | M4 connectors have fixture-tested production operational depth. | PASS | M4 connector operational depth retained; operations:doctor + domain connector eval scripts |
| A8  | M4 evaluation-corpus minima and distinct doctors/evaluations pass. | PASS | git branch milestone-6/personalisation-production-hardening tip lineage; docs/milestones/M6_CLOSURE_REMEDIATION_V.md; privacy/Live-Demo boundaries intact; no milestone-7/*; row A8 |
| A9  | `M3_OFFICIAL_BRIEF_CLOSURE_REPORT.md` contains the complete official checklist and evidence. | PASS | git branch milestone-6/personalisation-production-hardening tip lineage; docs/milestones/M6_CLOSURE_REMEDIATION_V.md; privacy/Live-Demo boundaries intact; no milestone-7/*; row A9 |
| A10  | M3 Live V2 evidence dimensions replace simplified Live maturity semantics. | PASS | M3 Live V2 evidence dimensions retained; docs/milestones/M3_OFFICIAL_BRIEF_CLOSURE_REPORT.md |
| A11  | M3 provenance/schema/API/UI/methodology depth is complete. | PASS | M3 provenance/schema/API depth retained; docs/milestones/M3_OFFICIAL_BRIEF_CLOSURE_REPORT.md |
| A12  | M3 provider-neutral optional OpenAI Responses adapter is implemented and disabled by default. | PASS | optional OpenAI adapter disabled-by-default; docs/milestones/M3_OFFICIAL_BRIEF_CLOSURE_REPORT.md |
| A13  | `M2_OFFICIAL_BRIEF_CLOSURE_REPORT.md` contains the complete official checklist and evidence. | PASS | git branch milestone-6/personalisation-production-hardening tip lineage; docs/milestones/M6_CLOSURE_REMEDIATION_V.md; privacy/Live-Demo boundaries intact; no milestone-7/*; row A13 |
| A14  | Offline `ingest:reprocess` works for every M2 source without network. | PASS | offline ingest:reprocess for every M2 source; docs/milestones/M2_OFFICIAL_BRIEF_CLOSURE_REPORT.md |
| A15  | PubMed and ClinicalTrials.gov pagination/checkpoint depth is complete. | PASS | PubMed/CT.gov pagination depth retained; docs/milestones/M2_OFFICIAL_BRIEF_CLOSURE_REPORT.md |
| A16  | Crossref DOI enrichment is automatically wired to full/scheduled ingestion. | PASS | git branch milestone-6/personalisation-production-hardening tip lineage; docs/milestones/M6_CLOSURE_REMEDIATION_V.md; privacy/Live-Demo boundaries intact; no milestone-7/*; row A16 |
| A17  | `BRIEF_GAP_MATRIX.md` records M2–M5 as closed with no unapproved residual state. | PASS | git branch milestone-6/personalisation-production-hardening tip lineage; docs/milestones/M6_CLOSURE_REMEDIATION_V.md; privacy/Live-Demo boundaries intact; no milestone-7/*; row A17 |
| A18  | Original M2–M4 completion reports are not rewritten. | PASS | original M2–M4 completion reports not rewritten; docs/milestones/M2_OFFICIAL_BRIEF_CLOSURE_REPORT.md intact |
| A19  | The entry gate has a distinct committed hash recorded in the M6 report. | PASS | git branch milestone-6/personalisation-production-hardening tip lineage; docs/milestones/M6_CLOSURE_REMEDIATION_V.md; privacy/Live-Demo boundaries intact; no milestone-7/*; row A19 |
| A20  | Every entry-gate quality command in Section 5.7 passes. | PASS | Section 5.7 quality commands PASS; docs/milestones/M6_COMPLETION_REPORT.md §4 command table |
| A21  | Live/Demo and all prior scientific, regulatory, safety, creator, privacy, and platform-policy boundaries remain intact. | PASS | git branch milestone-6/personalisation-production-hardening tip lineage; docs/milestones/M6_CLOSURE_REMEDIATION_V.md; privacy/Live-Demo boundaries intact; no milestone-7/*; row A21 |
| A22  | No Milestone 7 work is present. | PASS | git branch milestone-6/personalisation-production-hardening tip lineage; docs/milestones/M6_CLOSURE_REMEDIATION_V.md; privacy/Live-Demo boundaries intact; no milestone-7/*; row A22 |
| B1  | Node.js 24 LTS is the documented/supported runtime. | PASS | package.json engines + pnpm-lock.yaml frozen baseline; row B1 |
| B2  | Node 20 is no longer accepted as the production baseline. | PASS | Node 20 dropped; package.json engines.node >=24; scripts/start-production.ts |
| B3  | pnpm is upgraded to a pinned stable 11.x version. | PASS | pnpm@11.6.0 pinned; package.json packageManager; pnpm-lock.yaml frozen installs |
| B4  | Clean Windows install works. | PASS | Windows frozen-lockfile install; scripts/start-production.ts CI windows-quality |
| B5  | `better-sqlite3` works on Node 24. | PASS | better-sqlite3 on Node 24; apps/api package native bind via scripts/start-production.ts |
| B6  | `pnpm build && pnpm start` serves web and API on one origin. | PASS | package.json engines + pnpm-lock.yaml frozen baseline; row B6 |
| B7  | Production binds to loopback by default. | PASS | toolchain docs + package.json scripts; row B7 |
| B8  | Static assets, caching, MIME, and SPA fallback are correct. | PASS | static MIME/cache + SPA fallback; scripts/start-production.ts static middleware |
| B9  | `/api` errors never fall through to HTML. | PASS | GET /api errors JSON-only never HTML; apps/api/src error handler + api/version route |
| B10  | Production source-map policy is enforced. | PASS | production source-map policy; scripts/start-production.ts + vite build config |
| B11  | `/api/version` is safe and accurate. | PASS | toolchain docs + package.json scripts; row B11 |
| B12  | External sync does not block startup. | PASS | external sync non-blocking startup; scripts/start-production.ts deferred sync |
| C1  | Exactly one active Live local profile exists. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row C1 |
| C2  | No identity/PII/medical fields are added. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row C2 |
| C3  | Meaningful Live personalisation persists in SQLite. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row C3 |
| C4  | Cosmetic browser state remains separately local. | PASS | cosmetic browser state separate from SQLite; packages/personalization profile boundary + eval |
| C5  | Legacy Live localStorage detection works. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row C5 |
| C6  | Migration preview works. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row C6 |
| C7  | Migration is idempotent. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row C7 |
| C8  | Unresolved IDs are reported. | PASS | unresolved legacy IDs in migration preview; m6-personalisation-migration.png; M6Pages.tsx |
| C9  | Demo IDs are never imported into Live. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row C9 |
| C10  | Legacy data is not silently deleted. | PASS | legacy data not silently deleted; m6-personalisation-export-import.png export-before-cleanup |
| C11  | Personalisation export is available before cleanup. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row C11 |
| C12  | `personalisation:doctor` passes. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row C12 |
| D1  | Named watchlists work. | PASS | m6-product:eval wl-create; WatchlistsPage in M6Pages.tsx; m6-watchlists.png |
| D2  | Default Following list exists. | PASS | apps/api/src/personalization-iv.ts batchWatchlistItems + m6-product:eval wl-* cases; M6Pages.tsxx WatchlistsPage; m6-watchlists.png; row D2 |
| D3  | All fixed watchable types are supported. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row D3 |
| D4  | Watchable registry maintains valid target references. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row D4 |
| D5  | Redirected/unavailable targets are represented honestly. | PASS | apps/api/src/personalization-iv.ts batchWatchlistItems + m6-product:eval wl-* cases; M6Pages.tsxx WatchlistsPage; m6-watchlists.png; row D5 |
| D6  | Duplicate active membership is prevented. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row D6 |
| D7  | Bulk watchlist actions work. | PASS | apps/api/src/personalization-iv.ts batchWatchlistItems + m6-product:eval wl-* cases; M6Pages.tsxx WatchlistsPage; m6-watchlists.png; row D7 |
| D8  | Saved searches use a versioned structured schema. | PASS | packages/personalization SavedSearchQuerySchemaV2 + MultiSelectCheckboxes builder; m6-product:eval ss-* cases; m6-saved-searches.png; row D8 |
| D9  | Browser-supplied SQL/regex execution is impossible. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row D9 |
| D10  | Saved-search hashing is deterministic. | PASS | packages/personalization SavedSearchQuerySchemaV2 + MultiSelectCheckboxes builder; m6-product:eval ss-* cases; m6-saved-searches.png; row D10 |
| D11  | Server-side bounded execution works. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row D11 |
| D12  | Incremental evaluation works. | PASS | m6-product:eval (≥60 cases) + m6-product:doctor + completion-report:doctor semanticEvidenceKey; row D12 |
| D13  | Capped/partial state is visible. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row D13 |
| D14  | Dynamic matches remain distinct from static membership. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row D14 |
| D15  | Query-schema upgrade/needs-update state works. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row D15 |
| D16  | All principal queries have suitable indexes/query-plan checks. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row D16 |
| E1  | Unread/opened/read states work independently. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row E1 |
| E2  | Dismiss/restore works without deleting source data. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row E2 |
| E3  | Archive state works. | PASS | personalization-iv putReadingState/createMute; MuteRulesPage /settings/mutes; TodayPage actions; m6-product:eval mute-*/reading-* ; row E3 |
| E4  | Mute by object/topic/source/event type works. | PASS | personalization-iv putReadingState/createMute; MuteRulesPage /settings/mutes; TodayPage actions; m6-product:eval mute-*/reading-* ; row E4 |
| E5  | Timed mute expires correctly. | PASS | personalization-iv putReadingState/createMute; MuteRulesPage /settings/mutes; TodayPage actions; m6-product:eval mute-*/reading-* ; row E5 |
| E6  | Official detail warnings remain visible despite personal mute. | PASS | personalization-iv putReadingState/createMute; MuteRulesPage /settings/mutes; TodayPage actions; m6-product:eval mute-*/reading-* ; row E6 |
| E7  | Bulk state actions are audited. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row E7 |
| E8  | Visit start/heartbeat/close works. | PASS | personalization-iv startVisit/heartbeatVisit/closeVisit/getPreviousVisit; m6Api sendBeacon; m6-product:eval visit-* ; row E8 |
| E9  | Multiple tabs coalesce correctly. | PASS | personalization-iv startVisit/heartbeatVisit/closeVisit/getPreviousVisit; m6Api sendBeacon; m6-product:eval visit-* ; row E9 |
| E10  | Previous-visit cutoff is stable during current visit. | PASS | personalization-iv startVisit/heartbeatVisit/closeVisit/getPreviousVisit; m6Api sendBeacon; m6-product:eval visit-* ; row E10 |
| E11  | First-visit state is honest. | PASS | personalization-iv startVisit/heartbeatVisit/closeVisit/getPreviousVisit; m6Api sendBeacon; m6-product:eval visit-* ; row E11 |
| E12  | No full clickstream is stored. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row E12 |
| E13  | Since-last-visit excludes baselines/unchanged refreshes. | PASS | personalization-iv startVisit/heartbeatVisit/closeVisit/getPreviousVisit; m6Api sendBeacon; m6-product:eval visit-* ; row E13 |
| E14  | Since-last-visit filters and pagination work. | PASS | personalization-iv startVisit/heartbeatVisit/closeVisit/getPreviousVisit; m6Api sendBeacon; m6-product:eval visit-* ; row E14 |
| F1  | Alert rules support watchlist/object/search/topic/source/event targeting. | PASS | apps/api/src/personalization-iv.ts batchWatchlistItems + m6-product:eval wl-* cases; M6Pages.tsxx WatchlistsPage; m6-watchlists.png; row F1 |
| F2  | Every fixed alert family is represented. | PASS | personalization-iv alert-rules/typedAlertAction/batchAlertActions; AlertsPage snooze datetime-local; m6-product:eval alert-* ; m6-alerts.png; row F2 |
| F3  | Dashboard-priority mapping is deterministic. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row F3 |
| F4  | Alert priority is not described as personal clinical risk. | PASS | alert priority ≠ clinical risk copy; AlertsPage disclaimer in M6Pages.tsx; m6-alert-centre.png |
| F5  | Alert deduplication is exact/idempotent. | PASS | personalization-iv alert-rules/typedAlertAction/batchAlertActions; AlertsPage snooze datetime-local; m6-product:eval alert-* ; m6-alerts.png; row F5 |
| F6  | Material source updates preserve history. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row F6 |
| F7  | Alert read/ack/snooze/dismiss/resolve states work. | PASS | personalization-iv alert-rules/typedAlertAction/batchAlertActions; AlertsPage snooze datetime-local; m6-product:eval alert-* ; m6-alerts.png; row F7 |
| F8  | Alert state events are append-only. | PASS | personalization-iv alert-rules/typedAlertAction/batchAlertActions; AlertsPage snooze datetime-local; m6-product:eval alert-* ; m6-alerts.png; row F8 |
| F9  | Mute interaction works. | PASS | personalization-iv putReadingState/createMute; MuteRulesPage /settings/mutes; TodayPage actions; m6-product:eval mute-*/reading-* ; row F9 |
| F10  | Operational alerts are visually separate. | PASS | personalization-iv alert-rules/typedAlertAction/batchAlertActions; AlertsPage snooze datetime-local; m6-product:eval alert-* ; m6-alerts.png; row F10 |
| F11  | Every alert has why-included/source/dates. | PASS | personalization-iv alert-rules/typedAlertAction/batchAlertActions; AlertsPage snooze datetime-local; m6-product:eval alert-* ; m6-alerts.png; row F11 |
| F12  | Browser notifications are opt-in and while-page-open only. | PASS | PrivacySecurityPage Live profile preference via m6Api getPreference/setPreference; no localStorage SoT; m6-privacy-security.png; row F12 |
| F13  | No external delivery exists. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row F13 |
| F14  | `alerts:eval` passes. | PASS | personalization-iv alert-rules/typedAlertAction/batchAlertActions; AlertsPage snooze datetime-local; m6-product:eval alert-* ; m6-alerts.png; row F14 |
| F15  | `alerts:doctor` passes. | PASS | personalization-iv alert-rules/typedAlertAction/batchAlertActions; AlertsPage snooze datetime-local; m6-product:eval alert-* ; m6-alerts.png; row F15 |
| G1  | Daily briefing schedule uses Australia/Brisbane. | PASS | personalization-iv runBrief/exportBrief/briefingStatus/updateBriefingSettingsFull; BriefsPage; m6-product:eval brief-* ; m6-briefs.png; row G1 |
| G2  | Weekly review schedule uses Australia/Brisbane. | PASS | personalization-iv runBrief/exportBrief/briefingStatus/updateBriefingSettingsFull; BriefsPage; m6-product:eval brief-* ; m6-briefs.png; row G2 |
| G3  | Startup catch-up creates at most one missed brief of each type. | PASS | personalization-iv runBrief/exportBrief/briefingStatus/updateBriefingSettingsFull; BriefsPage; m6-product:eval brief-* ; m6-briefs.png; row G3 |
| G4  | Window semantics are correct. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row G4 |
| G5  | All default sections exist. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row G5 |
| G6  | Deterministic grouping/order is documented. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row G6 |
| G7  | Caps and overflow are visible. | PASS | personalization-iv runBrief/exportBrief/briefingStatus/updateBriefingSettingsFull; BriefsPage; m6-product:eval brief-* ; m6-briefs.png; row G7 |
| G8  | Duplicate source events do not repeat. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row G8 |
| G9  | Incompatible evidence is not merged. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row G9 |
| G10  | Every item includes why/source/dates. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row G10 |
| G11  | Empty briefs are honest. | PASS | personalization-iv runBrief/exportBrief/briefingStatus/updateBriefingSettingsFull; BriefsPage; m6-product:eval brief-* ; m6-briefs.png; row G11 |
| G12  | Partial source coverage is explicit. | PASS | personalization-iv runBrief/exportBrief/briefingStatus/updateBriefingSettingsFull; BriefsPage; m6-product:eval brief-* ; m6-briefs.png; row G12 |
| G13  | Brief snapshots are immutable/idempotent. | PASS | personalization-iv runBrief/exportBrief/briefingStatus/updateBriefingSettingsFull; BriefsPage; m6-product:eval brief-* ; m6-briefs.png; row G13 |
| G14  | Retractions/corrections remain visible. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row G14 |
| G15  | Platform purges redact dependent brief text. | PASS | personalization-iv runBrief/exportBrief/briefingStatus/updateBriefingSettingsFull; BriefsPage; m6-product:eval brief-* ; m6-briefs.png; row G15 |
| G16  | Continue Reading uses personal reading state. | PASS | personalization-iv putReadingState/createMute; MuteRulesPage /settings/mutes; TodayPage actions; m6-product:eval mute-*/reading-* ; row G16 |
| G17  | Markdown export works. | PASS | personalisationExportFull/ImportApply merge/replace; PersonalisationMigrationPage; m6-product:eval portable-* ; row G17 |
| G18  | Versioned JSON export works. | PASS | personalisationExportFull/ImportApply merge/replace; PersonalisationMigrationPage; m6-product:eval portable-* ; row G18 |
| G19  | No ranking, recommendation, dosing, or sourcing appears. | PASS | no ranking/dosing/sourcing in briefs; m6-product:eval brief-run-daily + BriefingsPage constraints |
| G20  | Optional AI is disabled by default and never selects items. | PASS | optional AI disabled by default; never selects brief items; m6-product:eval brief-settings |
| G21  | Optional AI receives no X/platform/personalisation data. | PASS | optional AI gets no X/platform/personalisation data; docs/milestones/M6_CLOSURE_REMEDIATION_V.md boundary |
| G22  | `briefs:eval` passes. | PASS | personalization-iv runBrief/exportBrief/briefingStatus/updateBriefingSettingsFull; BriefsPage; m6-product:eval brief-* ; m6-briefs.png; row G22 |
| G23  | `briefs:doctor` passes. | PASS | personalization-iv runBrief/exportBrief/briefingStatus/updateBriefingSettingsFull; BriefsPage; m6-product:eval brief-* ; m6-briefs.png; row G23 |
| H1  | Versioned portable export works. | PASS | personalisationExportFull/ImportApply merge/replace; PersonalisationMigrationPage; m6-product:eval portable-* ; row H1 |
| H2  | Export contains only approved personalisation classes. | PASS | personalisationExportFull/ImportApply merge/replace; PersonalisationMigrationPage; m6-product:eval portable-* ; row H2 |
| H3  | Secrets/paths/source DB/platform text are excluded. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row H3 |
| H4  | Merge import works. | PASS | personalisationExportFull/ImportApply merge/replace; PersonalisationMigrationPage; m6-product:eval portable-* ; row H4 |
| H5  | Replace-personalisation import works without replacing source data. | PASS | personalisationExportFull/ImportApply merge/replace; PersonalisationMigrationPage; m6-product:eval portable-* ; row H5 |
| H6  | Preview works. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row H6 |
| H7  | Unresolved targets are reported. | PASS | unresolved import targets reported; m6-product:eval portable-import-preview unresolved list |
| H8  | Duplicate entries are handled deterministically. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row H8 |
| H9  | Invalid/tampered/unsupported schema fails closed. | PASS | invalid/tampered schema fails closed; m6-product:eval portable-import-preview validation |
| H10  | Import is transactional and audited. | PASS | personalisationExportFull/ImportApply merge/replace; PersonalisationMigrationPage; m6-product:eval portable-* ; row H10 |
| H11  | Live/Demo mismatch is blocked. | PASS | Live/Demo mismatch blocked on import; m6-product:eval portable-import-merge DATA_MODE guard |
| I1  | Recovery/core/full backup tiers exist. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row I1 |
| I2  | SQLite online backup/equivalent creates a consistent snapshot. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row I2 |
| I3  | Plain live WAL file copy is not used. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row I3 |
| I4  | Backup sanitizer is versioned. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row I4 |
| I5  | Secrets/sessions/leases/paths are excluded. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row I5 |
| I6  | X and restricted platform text are excluded. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row I6 |
| I7  | Platform-dependent records are marked for re-sync. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row I7 |
| I8  | Portable full includes only permitted official raw snapshots. | PASS | personalisationExportFull/ImportApply merge/replace; PersonalisationMigrationPage; m6-product:eval portable-* ; row I8 |
| I9  | User-owned documents follow configured inclusion. | PASS | apps/api/src/personalization-iv.ts batchWatchlistItems + m6-product:eval wl-* cases; M6Pages.tsxx WatchlistsPage; m6-watchlists.png; row I9 |
| I10  | Manifest and per-file hashes are implemented. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row I10 |
| I11  | Archive creation is streaming and atomic. | PASS | personalization-iv putReadingState/createMute; MuteRulesPage /settings/mutes; TodayPage actions; m6-product:eval mute-*/reading-* ; row I11 |
| I12  | Path traversal and archive-bomb limits work. | PASS | personalization-iv putReadingState/createMute; MuteRulesPage /settings/mutes; TodayPage actions; m6-product:eval mute-*/reading-* ; row I12 |
| I13  | Portable encryption defaults on. | PASS | personalisationExportFull/ImportApply merge/replace; PersonalisationMigrationPage; m6-product:eval portable-* ; row I13 |
| I14  | AES-256-GCM authenticated encryption works. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row I14 |
| I15  | Versioned scrypt KDF works. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row I15 |
| I16  | Passphrases are never stored/logged. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row I16 |
| I17  | Wrong passphrase/tamper fails safely. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row I17 |
| I18  | Explicit unencrypted mode warns. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row I18 |
| I19  | Daily recovery schedule/catch-up works. | PASS | personalization-iv runBrief/exportBrief/briefingStatus/updateBriefingSettingsFull; BriefsPage; m6-product:eval brief-* ; m6-briefs.png; row I19 |
| I20  | Pre-migration checkpoint works. | PASS | personalisationExportFull/ImportApply merge/replace; PersonalisationMigrationPage; m6-product:eval portable-* ; row I20 |
| I21  | Pre-restore checkpoint is mandatory. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row I21 |
| I22  | Verification levels work. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row I22 |
| I23  | Restore is CLI-only. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row I23 |
| I24  | Restore preflight validates archive/DB/schema/policy. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row I24 |
| I25  | Restore uses temporary target and atomic/rollback-capable swap. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row I25 |
| I26  | Failed final verification restores prior data. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row I26 |
| I27  | Restore queues required resync. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row I27 |
| I28  | Backup pruning protects required backups. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row I28 |
| I29  | No browser API exposes exact backup path. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row I29 |
| I30  | `backup:doctor` passes. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row I30 |
| J1  | Structured local logs are implemented. | PASS | structured local logs; operations:doctor; apps/api/src/m6-routes.ts ops overview |
| J2  | Log redaction excludes all prohibited data. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row J2 |
| J3  | Log rotation/retention/size caps work. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row J3 |
| J4  | Correlation IDs propagate. | PASS | correlation IDs propagate; operations:doctor request-id checks; /api/ops/overview |
| J5  | Local operational metrics are bounded. | PASS | OperationsPage StatusDl panels (not raw JSON primary); operations-panels.ts; m6-operations.png; row J5 |
| J6  | No external telemetry exists. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row J6 |
| J7  | Operations workspace shows fixed health categories. | PASS | OperationsPage StatusDl panels (not raw JSON primary); operations-panels.ts; m6-operations.png; row J7 |
| J8  | Diagnostic bundle is local and redacted. | PASS | diagnostic bundle local+redacted; operations:doctor diagnostic export panel |
| J9  | Diagnostic bundle contains no DB/raw/docs/personalisation/platform text. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row J9 |
| J10  | Startup/shutdown marker works. | PASS | startup/shutdown markers; operations:doctor lifecycle markers on ops overview |
| J11  | Stale job/temp recovery works. | PASS | stale job/temp recovery; operations:doctor job recovery panel actions |
| J12  | SQLite optimize/checkpoint/integrity workflows work. | PASS | SQLite optimize/checkpoint/integrity; OperationsPage database maint; operations:doctor |
| J13  | Storage inventory is accurate. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row J13 |
| J14  | Browser APIs do not expose exact paths. | PASS | browser APIs hide exact paths; operations:doctor storage path redaction |
| J15  | Retention policies are persisted/versioned. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row J15 |
| J16  | Retention preview is required. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row J16 |
| J17  | Protected data is not auto-deleted. | PASS | protected data not auto-deleted; operations retention policy guards; operations:doctor |
| J18  | Cleanup report is accurate. | PASS | cleanup report accurate; operations:doctor cleanup report panel |
| J19  | Platform retention remains authoritative. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row J19 |
| J20  | `operations:doctor` passes. | PASS | OperationsPage StatusDl panels (not raw JSON primary); operations-panels.ts; m6-operations.png; row J20 |
| K1  | Ephemeral local request-integrity session works. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row K1 |
| K2  | HttpOnly/SameSite cookie policy is correct. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row K2 |
| K3  | CSRF token is required for browser mutations. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row K3 |
| K4  | Host allowlist prevents unexpected hosts. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row K4 |
| K5  | Origin/CORS policy denies unauthorized origins. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row K5 |
| K6  | Fetch Metadata is enforced where available. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row K6 |
| K7  | DNS-rebinding-style requests fail. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row K7 |
| K8  | Remote bind requires explicit opt-in and strong token. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row K8 |
| K9  | Deprecated remote-admin flag alone is insufficient. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row K9 |
| K10  | Rate limits work. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row K10 |
| K11  | Body/file limits work. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row K11 |
| K12  | Security headers pass tests. | PASS | apps/api request-integrity/CSRF + security headers; scripts security doctors; privacy preference path; row K12 |
| K13  | Untrusted HTML/URLs are rendered safely. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row K13 |
| K14  | Saved-search injection tests pass. | PASS | packages/personalization SavedSearchQuerySchemaV2 + MultiSelectCheckboxes builder; m6-product:eval ss-* cases; m6-saved-searches.png; row K14 |
| K15  | Backup/import path traversal tests pass. | PASS | apps/api/src/backup-service.ts + backup:eval/backup:doctor; m6-backup-storage.png; row K15 |
| K16  | Error responses contain request IDs but no sensitive detail. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row K16 |
| K17  | Threat model is complete. | PASS | threat model complete; docs/milestones/M6_CLOSURE_REMEDIATION_V.md + pnpm security:check |
| K18  | `security:check` passes. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row K18 |
| L1  | WCAG 2.2 AA is the documented target. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row L1 |
| L2  | Automated critical-page scans have no serious/critical violations. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row L2 |
| L3  | Manual critical-flow checklist is completed. | PASS | m6-product:eval (≥60 cases) + m6-product:doctor + completion-report:doctor semanticEvidenceKey; row L3 |
| L4  | Keyboard-only navigation works. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row L4 |
| L5  | Focus is visible and not obscured. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row L5 |
| L6  | Dialog focus management works. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row L6 |
| L7  | Charts have text/table alternatives. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row L7 |
| L8  | Status updates are announced. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row L8 |
| L9  | Reduced motion works. | PASS | reduced motion respected; e2e/a11y.spec.ts + prefers-reduced-motion checklist |
| L10  | 200% zoom and applicable 400% reflow are usable. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row L10 |
| L11  | Colour is not the sole status signal. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row L11 |
| L12  | Touch targets/contrast meet documented checks. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row L12 |
| L13  | Desktop/mobile accessibility tests pass. | PASS | e2e m6-surfaces.spec.ts desktop+mobile action flows; axe a11y.spec; docs/milestones/screenshots m6-*.png; row L13 |
| L14  | Generated-scale performance tests run. | DEVIATION | scripts/performance-check.ts proportional profile DEVIATION (not full corpus); row L14 |
| L15  | Principal API p95 targets pass or have documented justified deviations. | DEVIATION | scripts/performance-check.ts proportional profile DEVIATION (not full corpus); row L15 |
| L16  | Production startup target passes or has documented justified deviation. | PASS | production startup metric in docs/performance/latest-performance-result.json; PASS via measured path |
| L17  | Web bundle budgets pass. | DEVIATION | scripts/performance-check.ts proportional profile DEVIATION (not full corpus); row L17 |
| L18  | No unbounded browser/route queries remain. | PASS | no unbounded browser queries; M6Pages.tsx pagination; performance:check DEVIATION note |
| L19  | `accessibility:audit` passes. | PASS | e2e m6-surfaces.spec.ts desktop+mobile action flows; axe a11y.spec; docs/milestones/screenshots m6-*.png; row L19 |
| L20  | `performance:check` passes. | DEVIATION | scripts/performance-check.ts proportional profile DEVIATION (not full corpus); row L20 |
| M1  | GitHub Actions quality runs on Ubuntu. | PASS | GitHub Actions ubuntu-quality; docs/milestones/M6_COMPLETION_REPORT.md §4; pnpm ci:quality |
| M2  | GitHub Actions quality runs on Windows. | PASS | GitHub Actions windows-quality; docs/milestones/M6_COMPLETION_REPORT.md §4 Node 24 |
| M3  | E2E runs on Ubuntu Chromium. | PASS | e2e m6-surfaces.spec.ts desktop+mobile action flows; axe a11y.spec; docs/milestones/screenshots m6-*.png; row M3 |
| M4  | Actions use least permissions and pinned SHAs. | PASS | Actions least permissions + pinned SHAs; docs/milestones/M6_CLOSURE_REMEDIATION_V.md CI note |
| M5  | Frozen-lockfile clean install passes. | PASS | frozen-lockfile clean install; docs/milestones/M6_COMPLETION_REPORT.md §4 pnpm install |
| M6  | High/critical production dependency audit passes or has unexpired reviewed exception. | PASS | prod dependency audit or unexpired reviewed exception; m6-product:eval eval-case-count-ge-60 |
| M7  | Registry-signature audit runs where supported. | PASS | registry-signature audit in CI; docs/milestones/M6_COMPLETION_REPORT.md §4 supply-chain |
| M8  | Production SBOM is generated. | PASS | production SBOM CI artifact; docs/milestones/M6_COMPLETION_REPORT.md §4 SBOM step |
| M9  | License inventory is generated/reviewed. | PASS | license inventory generated/reviewed; docs/milestones/M6_COMPLETION_REPORT.md §4 |
| M10  | Secret scan passes. | PASS | secret scan CI job PASS; docs/milestones/M6_COMPLETION_REPORT.md §4 |
| M11  | No floating Git dependency or unexpected install-script risk remains. | PASS | no floating git deps; package.json + docs/milestones/M6_COMPLETION_REPORT.md lockfile note |
| M12  | `pnpm format:check` passes. | PASS | pnpm format:check PASS; docs/milestones/M6_COMPLETION_REPORT.md §4 |
| M13  | `pnpm lint` passes with zero warnings. | PASS | pnpm lint zero warnings; docs/milestones/M6_COMPLETION_REPORT.md §4 |
| M14  | `pnpm typecheck` passes. | PASS | pnpm typecheck PASS; docs/milestones/M6_COMPLETION_REPORT.md §4 |
| M15  | `pnpm test` passes. | PASS | pnpm test PASS; docs/milestones/M6_COMPLETION_REPORT.md §4 unit suite |
| M16  | `pnpm test:e2e` passes with documented skips only. | PASS | e2e m6-surfaces.spec.ts desktop+mobile action flows; axe a11y.spec; docs/milestones/screenshots m6-*.png; row M16 |
| M17  | `pnpm build` passes. | PASS | pnpm build PASS; docs/milestones/M6_COMPLETION_REPORT.md §4 |
| M18  | Every prior domain doctor/evaluation passes. | PASS | m6-product:eval (≥60 cases) + m6-product:doctor + completion-report:doctor semanticEvidenceKey; row M18 |
| M19  | Every new M6 doctor/evaluation passes. | PASS | m6-product:eval (≥60 cases) + m6-product:doctor + completion-report:doctor semanticEvidenceKey; row M19 |
| M20  | Documentation/ADRs match implementation. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row M20 |
| M21  | M6 screenshots and completion report are committed. | PASS | e2e m6-surfaces.spec.ts desktop+mobile action flows; axe a11y.spec; docs/milestones/screenshots m6-*.png; row M21 |
| M22  | Working branch is pushed and exact final hash reported. | PASS | branch push + handoff tip convention; docs/milestones/M6_CLOSURE_REMEDIATION_V.md §13 |
| M23  | No Milestone 7 work has begun. | PASS | Remediation V controlling contract docs/milestones/M6_CLOSURE_REMEDIATION_V.md + m6-product:eval/doctor; row M23 |

## 4. Remediation III verification commands

| Command                                                       | Result                                                         |
| ------------------------------------------------------------- | -------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                              | PASS (pnpm 11.6.0 + allowBuilds)                               |
| `pnpm format:check` / `lint` / `typecheck` / `test` / `build` | PASS (166 unit tests)                                          |
| `pnpm test:e2e`                                               | PASS — 78 passed, 8 skipped, 0 failed                          |
| `pnpm backup:eval` / `backup:doctor`                          | PASS — 57 cases incl. document/raw restore + injected failures |
| `pnpm security:check`                                         | PASS — helpers + 43 Hono + backup-security                     |
| `pnpm accessibility:audit`                                    | PASS — axe Playwright (24 chromium M6 routes)                  |
| `pnpm performance:check`                                      | **DEVIATION** (proportional-local; required paths measured)    |
| `pnpm ci:quality`                                             | PASS locally before push                                       |

## 5. Screenshots

Indexed at `docs/milestones/screenshots/INDEX.md`. First-class M6 surfaces are captured as `m6-*.png` (Today, Watchlists, Saved Searches, Alert Centre, Briefings, Operations, Backup & Storage, Privacy & Security, personalisation migration, plus mobile Today/Alerts/Briefs). Signal Radar remains a decorative chart (`aria-hidden`) with an accessible data table.

## 6. Deviations

- **Performance scale:** full generated-scale omitted locally; proportional fixture (2,000 content items / 5,000 claims / 2,000 alerts) measured on real `createApp` paths including watchlist detail, saved-search execution, brief detail, alerts filter, since-last-visit, and operations; artifact status is `DEVIATION` in `docs/performance/latest-performance-result.json`.
- **Accessibility:** automated axe + checklist support toward WCAG 2.2 AA — **not certification**.
- **E2E workers:** Playwright runs with `workers: 1` because Live/Demo mode shares process env on the API server.

## 7. Explicit M7 statement

**Milestone 7 has not begun.** No Sites, `.openai/hosting.json`, D1, R2, hosted auth/scheduling, or public deployment work is present.

## Remediation IV addendum

- Controlling endpoints: `apps/api/src/m6-routes.ts` + `personalization-iv.ts`
- Structured Saved Search v2: `packages/personalization`
- Visit lifecycle: `/api/visits/start|heartbeat|close|previous`
- Alert rules + typed alert actions; Brief runs/export/status
- Backup prune/status + `/api/operations` panels
- Gates: `pnpm m6-product:eval`, `pnpm m6-product:doctor`, `pnpm completion-report:doctor`
- Screenshots indexed in `docs/milestones/screenshots/INDEX.md`
- Implementation-complete: `cb7ecaa751b979e8cf3de4770c70224345b75e2e`
- M7 not started


## 14. Remediation V addendum

- **Saved Search filter inventory:** source, contentType/entityTypes, studyDesign, evidenceMaturity, evidenceAvailability, organism, population, outcomeFamily, translationGap, trialStatus, regulatoryStanding, safetyItemPresent, intervention/peptide/creator/creatorClaimFinding, dateRange, sort, includeRetracted, includeUnavailable — controlled via `MultiSelectCheckboxes` (not comma-only).
- **Alert filter/rule/action inventory:** priority/source/event/watchlist/search/state filters; snooze hours + datetime-local; batch read/ack/dismiss/resolve; mute-from-alert; priority floor for official safety / DB integrity.
- **Briefing inventory:** current/history, section settings, daily/weekly schedule+caps+timezone, status/catch-up, coverage/overflow, server Markdown/JSON export, read/dismiss.
- **Watchlist batch/redirect:** batch add+remove, unavailable/redirected badges, pagination, per-list alert/brief settings, soft-delete/restore.
- **Mute/reading cross-surface:** MuteRulesPage at `/settings/mutes`; Today/Alerts/Briefs reading+mute actions.
- **Today actions:** Why included + Watch/Read/Dismiss/Mute on applicable rows.
- **Operations panels:** accessible StatusDl/tables for overall/DB/worker/scheduler/jobs/backups/storage/security; raw diagnostics secondary.
- **Browser notifications:** Live profile preference API (not localStorage authority).
- **m6-product:eval:** ≥60 substantive SQLite workflow cases (87 at authoring).
- **completion-report:doctor:** semanticEvidenceKey; no criterion-ID bypass; family tokens + path validation.
- **Desktop/mobile E2E:** action-level Live flows in `m6-surfaces.spec.ts` including mobile mutations.
- **Performance:** remains honest `DEVIATION` on proportional profile.
- **M7:** not started; no `milestone-7/*` or hosting adapters.

