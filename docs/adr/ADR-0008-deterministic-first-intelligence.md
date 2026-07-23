# ADR-0008: Deterministic-first Live evidence intelligence

## Status

Accepted

## Context

Milestone 3 must assess Live primary-source records without inventing an opaque longevity score, and without requiring AI for the product to function.

## Decision

Live evidence intelligence is deterministic-first:

- Independent dimensions (maturity, availability, translation gaps, methodological signals, classification confidence, research activity) are never collapsed into a single truth score.
- Protocols without results are plans, not efficacy findings.
- Every Live claim requires source provenance spans.
- AI providers (`disabled`, `fixture`, `openai`) are optional and disabled by default.
- AI cannot write directly to the database or override explicit source metadata.

## Consequences

What gets easier?

- Offline evaluation and reproducibility
- Safe Demo/Live separation with honest uncertainty

What gets harder?

- Richer extraction requires carefully versioned rulesets and segment builders

What future work does this imply?

- Milestone 4 dossiers consume these assessments without inventing dosing/sourcing advice

## Alternatives considered

- Option A: AI-first extraction (rejected — non-deterministic default and provenance risk)
- Option B: Single composite evidence score (rejected — conflicts with ADR-0002)
