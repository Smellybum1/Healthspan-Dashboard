# ADR-0003: localStorage preferences for M1

## Status

Accepted

## Context

Watchlists and theme preferences must survive refresh in the prototype without a database.

## Decision

Persist preferences (theme, followed IDs, topics, denser layout, last visit) in `localStorage` with JSON export/import. Forbid storing medical records in this channel.

## Consequences

- Simple cross-refresh persistence for demos.
- Not multi-device sync; replaced or supplemented in later milestones.

## Alternatives considered

- Cookie-only prefs: worse structure for export/import.
- Immediate authenticated backend: out of scope.
