# Healthspan Dashboard

Longevity intelligence, evidence first.

Local-first research intelligence dashboard for longevity and healthspan.

**Current work:** Milestone 3 — Evidence & Claim Intelligence (`milestone-3/evidence-claim-intelligence`)  
**Completed:** Milestone 1 (seeded prototype), Milestone 2 (SQLite + primary-source ingestion)

## Requirements

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm dev
```

- Web: http://127.0.0.1:5173
- API: http://127.0.0.1:8787/health

The Vite dev server proxies `/api` and `/health` to the API.

Default data mode is **Live** (SQLite). Switch to **Demo** in Settings for the Milestone 1 showcase. Modes never mix.

Local database path (not exposed to the browser):

```bash
pnpm data:path
```

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm db:doctor
```

Playwright browsers (once):

```bash
pnpm --filter @healthspan/web exec playwright install chromium
```
