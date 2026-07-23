# ADR-0002: Independent evidence dimensions

## Status

Accepted

## Context

Collapsing evidence into one score hides tradeoffs and invites false precision.

## Decision

Store and display evidence maturity, confidence rationale, translation gaps, attention, safety notes, and regulatory statuses as independent fields. Signal Radar uses maturity × attention explicitly.

## Consequences

- UI is denser but more honest.
- Downstream AI summaries (later) must not erase these axes.

## Alternatives considered

- Single composite “truth score”: rejected by product principles.
