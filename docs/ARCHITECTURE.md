# Architecture

## Stack (Milestone 3 in progress)

- TypeScript strict mode, pnpm workspace
- React + Vite + React Router
- Tailwind CSS v4
- Lucide icons, Recharts
- Hono API (`apps/api`)
- Zod validation in `@healthspan/core`
- SQLite + Drizzle + better-sqlite3 in `@healthspan/db`
- Primary-source connectors in `@healthspan/connectors`
- Deterministic-first Live intelligence in `@healthspan/intelligence`
- Vitest + React Testing Library + Playwright
- ESLint + Prettier

## Runtime topology

```text
Browser (apps/web)
  -> Vite proxy /api + /health
  -> Hono API (apps/api)
       ├─ dataMode=demo -> seed repository (@healthspan/core)
       └─ dataMode=live -> SQLite (@healthspan/db)
                          + connectors (@healthspan/connectors)
                          + jobs worker + Brisbane scheduler
                          + deterministic intelligence (@healthspan/intelligence)
                          + raw/sha256 store
```

Exact filesystem paths are terminal-only (`pnpm data:path`); browser health/source APIs return redacted diagnostics.

## Package responsibilities

| Package | Role |
| --- | --- |
| `@healthspan/core` | Domain types, `dataOrigin`/`dataMode`, taxonomies, seed showcase |
| `@healthspan/db` | Path resolution, Drizzle schema/migrations, raw store, operational sources, intelligence tables |
| `@healthspan/connectors` | PubMed, ClinicalTrials.gov, Crossref (DOI), TGA RSS |
| `@healthspan/intelligence` | Deterministic study profiles, claims, relationships, optional AI providers |
| `@healthspan/ui` | Shared badges, banners, section cards |
| `@healthspan/api` | HTTP + ingestion/intelligence orchestration + jobs/scheduler |
| `@healthspan/web` | Product UI including Source Health, Review Queue, Live radar |

## Pipeline

Source connector → raw snapshot → normalised version → content upsert → change events → deterministic intelligence analysis → claims + provenance spans → research-activity Signal Radar / Review Queue.

Optional AI remains disabled by default (ADR-0008). Hosted D1/R2/Sites remain Milestone 7.
