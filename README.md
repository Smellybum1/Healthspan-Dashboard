# Healthspan Dashboard

Longevity intelligence, evidence first.

Local-first research intelligence dashboard for longevity and healthspan.

**Current work:** Milestone 7 — ChatGPT Sites migration readiness and one owner-only saved preview — on `milestone-7/sites-migration-readiness`, based at `a59d202`. Local-first remains primary; hosted D1/R2 is an additional target with a single active adapter, never a mirror. Saving a private Sites version is authorised; **deploying it is not**, and no real local data is migrated. Milestone 6 is accepted and complete. See `docs/milestones/M7_BASELINE_AND_DECISIONS.md`.
**Completed:** Milestone 1–5 (prototype → Live ingestion → evidence/claims → interventions/regulatory → creator/social claim intelligence)

## Requirements

- Node.js 24 LTS (`engines.node`: `>=24 <25`)
- [pnpm](https://pnpm.io/) 11.x (see `packageManager`)

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm dev
```

Production-local single origin (after build):

```bash
pnpm build
pnpm start
```

- Dev web: http://127.0.0.1:5173
- API / production-local: http://127.0.0.1:8787

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
pnpm intelligence:eval
pnpm intelligence:doctor
```

Playwright browsers (once):

```bash
pnpm --filter @healthspan/web exec playwright install chromium
```
