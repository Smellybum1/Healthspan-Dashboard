# ADR-0010: Curated creator claims without person scores

## Status

Accepted

## Context

Milestone 5 adds YouTube/X monitoring and creator claims. Platform metadata, engagement metrics, and social graphs are easy to misuse as scientific evidence or as rankings of people.

## Decision

1. Assess **claims**, not creator worth. Never compute trust, credibility, misinformation, influence, attention, engagement, or popularity scores.
2. YouTube Data API metadata is operational context only and is never claim evidence. No unofficial caption scraping, media download, or speech-to-text.
3. X monitoring is optional, disabled by default, budget-capped, acknowledgement-gated, with no automatic recharge; X content is never sent to external AI.
4. Claim-eligible text comes from user-supplied or authorised documents (VTT/SRT/TXT/JSON) with an explicit rights basis.
5. Creator claim alignment is multi-dimensional and links to M3/M4 evidence objects when available — never a single creator score.
6. Keep creators logic in `@healthspan/creators`; do not overload `@healthspan/intelligence` with platform policy.

## Consequences

What gets easier?

- Clear separation of social monitoring from scientific evidence
- Fixture-first platform connectors with healthy disabled states

What gets harder?

- Operators must supply authorised transcripts for claim extraction
- X enablement requires explicit budget controls

What future work does this imply?

- Monitored-account timeline sync with compliance deletion handlers when credentials exist
- Richer claim↔dossier linking and recurrence UI

## Alternatives considered

- Option A: Derive claims from YouTube titles/descriptions (rejected — metadata is not claim evidence)
- Option B: Scrape captions (rejected — policy and rights risk)
- Option C: Creator trust scores (rejected — unfair and out of product scope)
