# ADR-0009: Canonical intervention identity and scoped regulatory facts

## Status

Accepted

## Context

Milestone 4 must support Live intervention and peptide dossiers without collapsing ambiguous names, without treating register inclusion as longevity evidence, and without presenting spontaneous adverse-event patterns as causality or incidence.

## Decision

1. Keep canonical identity, aliases, identifiers, variants, mentions, mapping candidates, and append-only resolution decisions in dedicated intervention tables (`0004_m4_interventions`).
2. Auto-accept only exact trusted identifiers or unique exact aliases; ambiguous/fuzzy/AI candidates require human entity-resolution decisions.
3. Store regulatory assertions as product-, formulation-, route-, jurisdiction-, and indication-scoped facts when known. Never show a bare entity-level “approved” badge.
4. Represent connector coverage explicitly with `not_checked`, `no_exact_match_found`, `source_unavailable`, `disabled`, and `identity_unresolved`. An ARTG/Drugs@FDA miss is not `unapproved`.
5. Implement identity/regulatory connectors fixture-first in `@healthspan/connectors` (RxNorm, PubChem, GSRS, ARTG, Drugs@FDA, Purple Book, openFDA, FDA AEMS). openFDA remains healthy-disabled without a key.
6. Peptide sequences are stored only when a recognized source supplies them; marketing names never invent sequences.
7. Comparison of 2–4 entities is side-by-side only: no winner, rank, recommendation, stacking, or spontaneous-report safety ranking.
8. Keep identity/regulatory logic out of `@healthspan/intelligence`.

## Consequences

What gets easier?

- Transparent provenance from mention → mapping decision → dossier cell
- Safe local enrichment without network in tests
- Clear UI language for absence vs unapproved vs not checked

What gets harder?

- More tables and connector states to maintain
- Reviewers must resolve ambiguous aliases instead of silent merges

What future work does this imply?

- Drugs@FDA bulk ZIP staging and Purple Book monthly refresh jobs
- Optional openFDA scheduled enrichment when configured
- Trial portfolio and Today-screen regulatory change events

## Alternatives considered

- Option A: Collapse similar strings into one entity (rejected — salts/analogues/fragments collide)
- Option B: Entity-level approved/unapproved flag (rejected — jurisdiction/product scope is lost)
- Option C: Rank interventions by FAERS/AEMS counts (rejected — not incidence and not causality)
