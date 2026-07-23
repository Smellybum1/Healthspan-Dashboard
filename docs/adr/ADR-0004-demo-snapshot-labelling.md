# ADR-0004: Demo snapshot labelling

## Status

Accepted

## Context

Convincing seeded data can be mistaken for live scientific facts if unmarked.

## Decision

Mark every seed record with `demo: true`, surface a global demo snapshot notice in the UI, use `example.invalid` URLs for fictional registry links, and keep cornerstone examples explicitly fictionalised.

## Consequences

- Safer demos and reviews.
- Slightly more verbose UI chrome.

## Alternatives considered

- Mix real citations unmarked: rejected for misrepresentation risk.
