# Healthspan Dashboard

Longevity intelligence, evidence first.

Local-first research intelligence dashboard for longevity and healthspan. Milestone 1 is a high-fidelity prototype with seeded demonstration data — no live external APIs.

## Requirements

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm dev
```

- Web: http://127.0.0.1:5173
- API: http://127.0.0.1:8787/health

The Vite dev server proxies `/api` and `/health` to the API.

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Playwright browsers (once):

```bash
pnpm --filter @healthspan/web exec playwright install chromium
```

## Repository shape

```text
apps/
  web/          React + Vite UI
  api/          Hono API serving seeded data
packages/
  core/         Zod domain model, taxonomies, seed data
  db/           Persistence boundary (seeded memory in M1)
  connectors/   Source adapter contracts (disabled in M1)
  intelligence/ Rule-based assessment helpers
  ui/           Shared badges and section primitives
docs/           Product, architecture, ADRs, milestones
scripts/        Seed generator
```

## Demo data notice

All Milestone 1 records are a **demo snapshot** — fictionalised demonstration data. They must not be treated as live scientific facts.

## Privacy boundary

This dashboard holds public research intelligence and prototype preferences only. Personal labs, diagnoses, medications, and supplement doses belong in a separate optional **My Healthspan** companion (not in Milestone 1).

## Documentation

- [Product charter](docs/PRODUCT_CHARTER.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Source policy](docs/SOURCE_POLICY.md)
- [Privacy boundaries](docs/PRIVACY_BOUNDARIES.md)
- [Decisions](docs/DECISIONS.md)
- [Milestone 1](docs/milestones/M1.md)

## License

Private project repository unless otherwise stated.
