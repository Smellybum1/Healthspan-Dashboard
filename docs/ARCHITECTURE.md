# Architecture

## Stack (Milestone 2)

- TypeScript strict mode, pnpm workspace
- React + Vite + React Router
- Tailwind CSS v4
- Lucide icons, Recharts
- Hono API (`apps/api`)
- Zod validation in `@healthspan/core`
- SQLite + Drizzle + better-sqlite3 in `@healthspan/db`
- Primary-source connectors in `@healthspan/connectors`
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
                          + raw/sha256 store
                          + ingestion orchestration (apps/api)
```

Local preferences/watchlists remain in `localStorage`, namespaced by data mode where applicable.

Application data (not in git):

`<os-app-data>/Healthspan Dashboard/healthspan-dashboard.sqlite3`
`<os-app-data>/Healthspan Dashboard/raw/sha256/...`

## Package responsibilities

| Package | Role |
| --- | --- |
| `@healthspan/core` | Domain types, `dataOrigin`/`dataMode`, taxonomies, seed showcase |
| `@healthspan/db` | Path resolution, Drizzle schema/migrations, raw store, operational sources |
| `@healthspan/connectors` | PubMed, ClinicalTrials.gov, Crossref (DOI), TGA RSS |
| `@healthspan/intelligence` | Rule-based assessment descriptors (Demo); Live scoring deferred to M3 |
| `@healthspan/ui` | Shared badges, banners, section cards |
| `@healthspan/api` | HTTP + ingestion orchestration + Live/Demo routing |
| `@healthspan/web` | Product UI including Source Health and mode controls |

## Pipeline (M2 implemented core)

Source connector → raw snapshot (gzip, content-addressed) → normalised version → content upsert → change events (baseline vs non-baseline) → API/UI.

Evidence classification / Signal Radar scoring for Live remains Milestone 3.

## Hosted future (M7)

D1/R2/Sites are intentionally out of scope for M2. Schema and interfaces stay portable (text UUIDs, integer UTC ms, RawSnapshotStore, no local-only SQL features as domain requirements).
