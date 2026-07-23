# Architecture

## Stack (Milestone 1)

- TypeScript strict mode, pnpm workspace
- React + Vite + React Router
- Tailwind CSS v4
- Lucide icons, Recharts
- Hono API (`apps/api`)
- Zod validation in `@healthspan/core`
- Vitest + React Testing Library + Playwright
- ESLint + Prettier

## Runtime topology

```text
Browser (apps/web)
  -> Vite proxy /api
  -> Hono API (apps/api)
  -> @healthspan/db seed repository
  -> @healthspan/core seed bundle
```

Preferences and watchlists persist in `localStorage` only.

## Package responsibilities

| Package | Role in M1 |
| --- | --- |
| `@healthspan/core` | Domain types, taxonomies, labels, seed data, query helpers |
| `@healthspan/db` | Persistence boundary returning seeded memory repositories |
| `@healthspan/connectors` | Adapter contracts; all connectors disabled |
| `@healthspan/intelligence` | Rule-based assessment descriptors / radar quadrants |
| `@healthspan/ui` | Shared badges, banners, section cards |
| `@healthspan/api` | HTTP contract for dashboard/items/search/health |
| `@healthspan/web` | Product UI |

## Pipeline (future)

Source adapter → raw snapshot → validate/normalise → dedupe/resolve → extract → rule-based assessment → optional AI assist → review queue → indexed record → change detection.

Milestone 1 stops before live adapters and SQLite.

## Non-goals in M1

No live APIs, auth, SQLite, jobs, AI providers, X/YouTube credentials, personal health records, dosing, or purchasing recommendations.
