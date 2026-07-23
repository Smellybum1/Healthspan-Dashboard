# Source policy

## Rules

- Prefer APIs and official feeds to scraping.
- Do not bypass paywalls or access controls.
- Store metadata, short excerpts where permitted, summaries, and links — not full republished content.
- Preserve source timestamps and fetch timestamps.
- Preserve raw structured responses or hashes where permitted.
- Implement source-specific rate limiting, retries, caching, and deletion/update handling (Milestone 2+).
- Label registry data, adverse-event reports, preprints, and social claims accurately.

## Milestone 1

No live connectors. Planned connector IDs are declared in `@healthspan/connectors` and remain disabled:

- pubmed
- clinicaltrials_gov
- crossref
- tga_rss
- anzctr_enrichment

Seeded “source health” stubs illustrate degraded/unknown states in the UI only.
