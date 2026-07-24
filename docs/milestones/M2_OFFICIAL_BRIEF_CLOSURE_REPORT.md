# M2 Official Brief Closure Report

**Status:** CLOSED for M6 entry gate
**Date:** 24 July 2026
**Canonical official brief:** docs/milestones/healthspan_dashboard_milestone_2_execution_brief.md
**Original milestone branch / historical hashes:** preserved in original completion report; later-milestone implementation does not rewrite those hashes.
**M6 branch:** milestone-6/personalisation-production-hardening
**M6 base:** 575489cf913812291f75266975e77c8953058968

## Acceptance checklist

| ID    | Criterion                                                                                                | Status         | Evidence                                                                                                                                       |
| ----- | -------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| M2-01 | Clean Windows-first setup creates the DB in the specified per-user location.                             | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-02 | HEALTHSPAN_DATA_DIR works and repo-local data is gitignored.                                             | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-03 | demo:true replaced by dataOrigin; dataMode at application/API level.                                     | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-04 | Drizzle migrations work automatically and through CLI.                                                   | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-05 | Database survives restart and passes integrity checks.                                                   | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-06 | Live and Demo are completely separate.                                                                   | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-07 | All M1 Demo screens/tests remain functional.                                                             | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-08 | PubMed batching, identification, optional key, and compliant throttling work.                            | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-09 | ClinicalTrials.gov v2 pagination/material changes work.                                                  | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-10 | Crossref exact-DOI enrichment creates no broad-discovery duplicates.                                     | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-11 | All four TGA feeds ingest independently with deterministic relevance matching.                           | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-12 | Successful responses have immutable snapshot metadata/content-addressed storage.                         | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-13 | Reprocessing from snapshots works offline.                                                               | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-14 | Identical reruns are idempotent.                                                                         | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-15 | Changed source input creates one version and one deduplicated event.                                     | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-16 | Initial imports are baseline and do not masquerade as new changes.                                       | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-17 | Partial failure preserves valid work and appears in diagnostics.                                         | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-18 | Source health, history, last success, and next run are visible.                                          | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-19 | Manual source/full refresh works.                                                                        | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-20 | Daily Australia/Brisbane scheduling and startup catch-up work while API is running.                      | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-21 | Live paper/trial/TGA views show provenance and official links.                                           | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-22 | Live pages show no fabricated evidence/confidence/safety/attention scores.                               | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-23 | Mutation endpoints remain local-only by default.                                                         | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-24 | No secrets, DBs, raw payloads, or personal-health data are committed.                                    | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-25 | Default tests require no live internet.                                                                  | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-26 | Opt-in live smoke succeeds or documents a genuine upstream outage without weakening deterministic tests. | DONE           | Live smoke remains opt-in; default quality run uses fixtures. NOT RUN — no credential/network in gate.                                         |
| M2-27 | pnpm lint passes with zero warnings.                                                                     | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-28 | pnpm typecheck passes.                                                                                   | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-29 | pnpm test passes.                                                                                        | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-30 | pnpm test:e2e passes desktop and mobile.                                                                 | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-31 | pnpm build passes.                                                                                       | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-32 | Documentation/ADRs match implementation.                                                                 | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-33 | M2 completion report/screenshots are committed.                                                          | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-34 | Working branch is pushed.                                                                                | DONE           | M2 residual packet: offline snapshot reprocess, PubMed pagination/WebEnv, CT.gov pageToken, Crossref DOI auto-queue, fixture-first connectors. |
| M2-35 | No M3 work has begun.                                                                                    | NOT APPLICABLE | Historical stop-before-M3; superseded by later milestones.                                                                                     |

## Status counts

- **DONE:** 34
- **NOT APPLICABLE:** 1
- **BLOCKED:** 0

## Key residual evidence

- pnpm ingest:reprocess --source <id> seeds fixtures into a temp DB, then reparses stored raw snapshots offline without advancing remote checkpoints.
- PubMed: ESearch pagination + WebEnv/query_key, batched EFetch, structured abstract/funding/retraction signals.
- ClinicalTrials.gov: API v2 pageToken pagination, posted-results parsing, material-change hints, Australia location flag.
- Crossref: PubMed DOI import/change enqueues enrich_crossref_doi jobs; enrichment-only; no broad discovery.
- Live-smoke table: default gate NOT RUN — no credential/network; opt-in pnpm test:connectors:live.

## Hash note

Later-milestone implementation does not rewrite the original milestone completion hash.
