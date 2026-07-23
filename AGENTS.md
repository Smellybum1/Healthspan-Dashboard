# AGENTS.md

## Project

Healthspan Dashboard — local-first longevity research intelligence.

## Operating rules

- Prefer small, focused packets.
- Read `docs/PRODUCT_CHARTER.md`, `docs/ARCHITECTURE.md`, and relevant ADRs before architectural changes.
- Do not begin Milestone 2 work until the project manager issues that brief.
- Never add live external API calls, personal health records, dosing advice, or sourcing recommendations in Milestone 1.
- Keep naming as **Healthspan Dashboard** (not Lifespan Dashboard).

## Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Shared language

See `context.md`.
