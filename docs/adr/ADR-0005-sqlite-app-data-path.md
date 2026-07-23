# ADR-0005: Per-user SQLite application data directory

## Status

Accepted

## Context

Milestone 2 requires durable local persistence that must not live inside the Git repository, while remaining portable toward future Cloudflare D1/R2 hosting.

## Decision

Resolve the SQLite database and raw snapshot store under the OS per-user application-data directory:

- Windows: `%LOCALAPPDATA%\Healthspan Dashboard\healthspan-dashboard.sqlite3`
- macOS: `~/Library/Application Support/Healthspan Dashboard/healthspan-dashboard.sqlite3`
- Linux: `${XDG_DATA_HOME:-~/.local/share}/healthspan-dashboard/healthspan-dashboard.sqlite3`

`HEALTHSPAN_DATA_DIR` may override with an absolute path. Relative overrides are allowed only when `HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR=1` (developer `.local-data/`).

Use `drizzle-orm` + `better-sqlite3` with WAL, foreign keys, busy timeout, and normal synchronous pragmas in the local adapter only.

## Consequences

What gets easier?

- Clear separation of repo code and user data
- Deterministic path helpers for CLI (`pnpm data:path`) and doctor scripts

What gets harder?

- Tests must isolate with temp directories or in-memory SQLite
- Windows path separators must be handled carefully in cross-platform path tests

What future work does this imply?

- Milestone 7 maps the same schema/interfaces to D1 + R2 without rewriting domain IDs

## Alternatives considered

- Option A: SQLite inside the repo (rejected — pollutes git and shares poorly across clones)
- Option B: Only in-memory for M2 (rejected — does not prove persistence/versioning)
