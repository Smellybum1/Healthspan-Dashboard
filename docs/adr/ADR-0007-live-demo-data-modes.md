# ADR-0007: Live and Demo data modes

## Status

Accepted

## Context

Milestone 1 shipped a rich seeded showcase. Milestone 2 adds live SQLite ingestion. Mixing the two in one screen would mislead users about evidence strength and provenance.

## Decision

Canonical domain field is `dataOrigin: "demo" | "live"`.

Application/API selection is `dataMode: "demo" | "live"` (default `live` for ordinary local use).

Rules:

- A response or screen never combines origins
- Demo retains conspicuous labelling
- Live must not inherit seeded evidence/attention/safety scores
- Live Signal Radar is unavailable until Milestone 3, with an honest explanation
- Unsupported Live sections (interventions, peptides, creators) show empty states and may invite a deliberate Demo switch

## Consequences

What gets easier?

- Clear provenance language in UI and API
- Safer demos without contaminating live analytics

What gets harder?

- UI must branch on mode for lists/details/empty states
- Watchlist identifiers should be namespaced by mode over time

What future work does this imply?

- Later milestones deepen Live dossiers without resurrecting `demo: true`

## Alternatives considered

- Option A: Keep `demo: true` boolean (rejected — ambiguous and not origin-aware)
- Option B: Always show Demo fallback when Live empty (rejected — silent substitution)
