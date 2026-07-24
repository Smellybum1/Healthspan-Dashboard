# Methodology — Evidence & claim intelligence (M3 residual closure)

Healthspan Dashboard Live assessments use independent Live V2 dimensions. Regulatory authorization, listing, licensing, or guideline status is **never** treated as an evidence-maturity stage.

## Live V2 dimensions

| Dimension                            | Meaning                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------ |
| Study design                         | Stated or inferred design of the source record                           |
| Evidence availability                | Protocol-only, results posted, peer-reviewed, regulatory statement, etc. |
| Evidence maturity                    | Scientific maturity of the evidence (not regulator listing status)       |
| Organism                             | Cell / animal / human / mixed / unknown                                  |
| Population context                   | Population descriptors when present                                      |
| Outcome families                     | Outcome groupings extracted from source text                             |
| Translation gaps                     | e.g. animal→human, observational→interventional                          |
| Methodological signals               | Explicit present/absent/uncertain signals                                |
| Assessment completeness              | How complete the assessment package is                                   |
| Extraction/classification confidence | Deterministic confidence band                                            |
| Retraction/correction state          | Flagged when source indicates retraction/correction                      |
| Research activity                    | Activity snapshots for followed objects                                  |

## Protocols vs findings

Protocols and planned outcomes remain separate from reported findings. Trials without posted results are `protocol_only` and claims use `protocol_intent` assertion roles.

## Optional AI

Deterministic extraction is the default. Optional providers:

- `DisabledIntelligenceProvider` (default)
- `FixtureIntelligenceProvider` (tests only)
- `OpenAIResponsesIntelligenceProvider` (disabled by default; no CI network calls)

AI paths never receive local paths, secrets, preferences, watchlists, or personal-health data.

## Provenance

Every Live claim must resolve to a primary source span and source-record version. Assessment history is available via `GET /api/items/:id/assessment/history`.

## Schema equivalent mapping (M3 official brief)

Physical consolidation into `intelligence_analyses.summary_json` / related tables is permitted when semantics are preserved:

| Official brief entity                                      | Implementation                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Evidence text segments                                     | Extracted into analysis summary + claim source spans                           |
| Immutable intelligence analyses                            | `intelligence_analyses` (identity unique on content/inputHash/ruleset)         |
| Current/stale intelligence state                           | `content_intelligence_state`                                                   |
| Study profiles + outcomes + methodological signals         | Folded into analysis summary JSON with Live V2 dimension keys                  |
| Atomic claims                                              | `live_claims`                                                                  |
| Claim source spans                                         | `claim_source_spans`                                                           |
| Claim concepts / relationships                             | `claim_relationships` (+ concept tags in summary)                              |
| Evidence assessments                                       | `/api/assessments` projection over analyses                                    |
| Translation gaps / methodological signals / evidence needs | Live V2 summary fields                                                         |
| Assessment source-version dependencies                     | Analysis linked via content item → source record versions                      |
| Review tasks and immutable decisions                       | `intelligence_review_tasks` (+ decision rows)                                  |
| Model runs                                                 | Optional provider result metadata on analyses; OpenAI path disabled by default |
| Research-activity snapshots                                | Activity fields on assessments / radar projection                              |

Demo retains historical `regulatory_or_guideline_supported` maturity labels for seed continuity. Live never assigns that value as evidence maturity.
