# AGENTS.md

## Project

Healthspan Dashboard — local-first longevity research intelligence.

## Operating rules

- Prefer small, focused packets.
- Read `docs/PRODUCT_CHARTER.md`, `docs/ARCHITECTURE.md`, and relevant ADRs before architectural changes.
- Never begin a milestone until the project manager issues that brief. The current
  milestone is 7 — see `docs/milestones/M7_BASELINE_AND_DECISIONS.md` for the
  controlling documents, the exact base, and the resolved decisions.
- Never add live external API calls, personal health records, dosing advice, or sourcing recommendations.
- Keep naming as **Healthspan Dashboard** (not Lifespan Dashboard).
- Local-first is primary. Prefer extending the Live SQLite stack over adding a parallel
  store; never dual-write, replicate, or synchronise between local and hosted.
- Do not merge to `main` unless the owner explicitly asks.

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
