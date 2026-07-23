# ADR-0001: Seeded API boundary before persistence

## Status

Accepted

## Context

Milestone 1 needs an end-to-end prototype without SQLite or live connectors, while keeping a clean seam for Milestone 2.

## Decision

Serve seeded data through a Hono API (`/health`, `/api/dashboard`, `/api/items`, `/api/items/:id`, `/api/search`) and a `@healthspan/db` repository facade that currently reads in-memory seed data.

## Consequences

- Web app does not import seed records directly into page modules.
- Milestone 2 can swap the repository implementation to Drizzle/SQLite without redesigning routes.

## Alternatives considered

- Import seed JSON directly in the React app: faster short-term, worse portability.
- Introduce SQLite immediately: out of M1 scope.
