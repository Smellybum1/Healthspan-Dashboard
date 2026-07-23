# ADR-0006: Primary-source connectors and raw snapshot store

## Status

Accepted

## Context

Milestone 2 must ingest real primary sources without inventing evidence scores, and must preserve raw payloads for auditability and reprocessing.

## Decision

Implement connectors in `@healthspan/connectors` for, in order:

1. PubMed (E-utilities)
2. ClinicalTrials.gov API v2
3. Crossref exact-DOI enrichment only
4. TGA RSS (four official feeds; no general news)

Store raw bodies content-addressed under `raw/sha256/<aa>/<hash>.<ext>.gz` behind `RawSnapshotStore`.

Orchestrate ingestion in `apps/api` (not in `@healthspan/db`) so HTTP and package boundaries stay clean.

Default unit tests use fixture transports; live network smoke is opt-in via `pnpm test:connectors:live`.

ANZCTR is deferred and must not be scraped in M2.

## Consequences

What gets easier?

- Deterministic fixture tests without network flakiness
- Later R2 swap for raw storage without changing domain tables

What gets harder?

- Connectors must tolerate partial failure and record run diagnostics
- Crossref depends on DOIs discovered by other connectors

What future work does this imply?

- Milestone 3 evidence classification consumes normalised live records
- Additional registries (e.g. ANZCTR) become separate connectors later

## Alternatives considered

- Option A: Broad Crossref discovery stream (rejected — duplicates PubMed and violates enrichment-only scope)
- Option B: Store only normalised rows (rejected — loses audit/reprocess ability)
