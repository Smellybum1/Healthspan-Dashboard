# Milestone 2 Completion Report — Healthspan Dashboard

**Branch:** `milestone-2/persistent-data-backbone`  
**Date:** 23 July 2026  
**Status:** Complete for Milestone 2 acceptance (stop before Milestone 3)

## Summary

Healthspan Dashboard now has a durable local SQLite/Drizzle backbone, primary-source connectors (PubMed → ClinicalTrials.gov → Crossref DOI enrichment → TGA RSS), fixture-tested ingestion, and strict Live/Demo separation via `dataOrigin` / `dataMode`.

## Delivered

- Per-user SQLite path resolution (`pnpm data:path`, ADR-0005)
- Drizzle schema + migration `0000_init_m2`
- Raw gzip content-addressed snapshot store
- Connectors with fixture transports + optional `pnpm test:connectors:live`
- Ingestion orchestration in `apps/api` with change events / baseline handling
- CLI: `db:migrate`, `db:status`, `db:doctor`, `ingest`, `ingest:status`
- Live/Demo API routing; Live Today without fabricated Signal Radar scores
- Source Health page, Settings mode toggle + first sync
- Honest Live empty states for interventions/peptides/creators
- ADRs 0005–0007, `docs/milestones/M2.md`, architecture/data-model updates
- `.env.example`, `.local-data/` gitignore

## Quality gates

| Gate             | Result               |
| ---------------- | -------------------- |
| `pnpm lint`      | pass                 |
| `pnpm typecheck` | pass                 |
| `pnpm test`      | 33 passed            |
| `pnpm test:e2e`  | 9 passed / 1 skipped |
| `pnpm build`     | pass                 |

## Verification notes

- Unit tests never require network; connectors use fixtures
- E2E forces `HEALTHSPAN_DATA_MODE=demo` with isolated `.local-data/e2e`
- Live radar intentionally empty with Milestone 3 explanation

## Out of scope (correctly deferred)

AI extraction, evidence scoring, creator monitoring, ANZCTR, D1/R2/Sites, auth, personal health data.

## Next

Milestone 3 — evidence classification for Live records. Do not start until authorised.
