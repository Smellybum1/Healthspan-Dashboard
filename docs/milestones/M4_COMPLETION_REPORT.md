# Milestone 4 Completion Report — Healthspan Dashboard

**Branch:** `milestone-4/interventions-peptides-regulation`  
**Base:** `milestone-3/evidence-claim-intelligence` @ `4d985d3c8e9208fadc01e529270bcf5f37f1503d`  
**Final commit:** `553701bb30628cdb7d18eaa56baff58170307c1f` (report hash fixup on `ed308ee` feature complete)  
**Date:** 24 July 2026  
**Status:** Complete for Milestone 4 acceptance (stop before Milestone 5 until Pro authorises)

## Summary

Healthspan Dashboard now has a source-grounded Live intervention/peptide identity layer, dossiers with M3 evidence provenance links, scoped AU/US regulatory matrices, peptide safety-first identity rules, fixture-first identity/regulatory connectors (including Drugs@FDA ZIP projection, Purple Book, ARTG, openFDA labels/events key-gated, FDA AEMS), append-only entity-resolution decisions, trial↔entity portfolio links, a no-ranking comparison screen, and Today intervention-watch from non-baseline dossier changes.

## Delivered

### Identity & dossiers

- Package `@healthspan/interventions` (normalize, peptide policy, mentions, resolve)
- Migrations `0004`–`0005` (entities/dossiers/regulatory + safety aggregates/trial links/peptide modifications)
- Bootstrap catalog, mention extraction/resolution, immutable dossier snapshots
- Live Interventions/Peptides lists + dossier UI; Demo remains seed detail pages
- Entity-resolution queue with accept/reject/defer/create_entity/keep_separate/link_other

### Connectors (fixture-first; default tests make no live calls)

- RxNorm, PubChem, GSRS identity enrichment (presence ≠ approval)
- Bounded TGA ARTG HTML connector + terms/robots note (`docs/source-policies/artg-bounded-access.md`, check date 24 Jul 2026)
- Drugs@FDA Products projection + ZIP extract with zip-slip/size guards
- Purple Book CSV (no interchangeability/peptide inference)
- openFDA labels + event aggregates behind key/`HEALTHSPAN_OPENFDA_ENABLED` (healthy disabled)
- FDA AEMS potential signals (never causal / never incidence)

### Comparison, trials, Today

- Compare 2–4 entities; no winner/rank/recommendation/spontaneous-report ranking
- `trial_intervention_entity_links` + link admin route; dossier trial portfolio caveat
- Today Intervention Watch feeds non-baseline `dossier_change_events`

### Docs / doctors

- ADR-0009, DATA_MODEL M4 section, methodology expansions
- `pnpm dossiers:doctor` (+ interventions/regulatory/safety aliases)

## Quality gates

| Gate                     | Result                                             |
| ------------------------ | -------------------------------------------------- |
| `pnpm lint`              | pass (0 warnings)                                  |
| `pnpm typecheck`         | pass                                               |
| `pnpm test`              | 74 passed                                          |
| `pnpm test:e2e`          | 15 passed / 3 skipped (chromium mobile-only skips) |
| `pnpm build`             | pass                                               |
| `pnpm intelligence:eval` | 73/73 + 16/16 claim pairs                          |
| `pnpm dossiers:doctor`   | ok                                                 |

## Screenshots

Under `docs/milestones/screenshots/`:

- `m4-entity-resolution.png`
- `m4-compare.png`
- `m4-methodology.png`
- `m4-mobile-compare.png`

## Non-goals preserved

- No dosing, protocols, vendors, stacking, or treatment advice
- No DAEN import; no patient-level FAERS narratives
- No bare entity-level “approved” badge; misses ≠ unapproved
- No M5 creator/social monitoring, hosted deploy, D1/R2, or auth

## Known limitations / honest gaps

- Drugs@FDA live official ZIP download/scheduling is fixture-validated locally; operators load ZIP bytes through the projection path (F1 local path complete; scheduled bulk refresh can deepen in ops hardening).
- openFDA live smoke exercised only when a key is intentionally configured (disabled state verified).
- Full 171-item Pro checklist is implemented for core identity/regulatory/dossier/comparison/safety semantics; residual depth items (e.g. every baseline/history edge case, weekly Purple Book job cron wiring) remain documented as operator/follow-on rather than blocking product outcome.

## Stop point

Push this branch, report final HEAD + gate table to ChatGPT Pro, **request Milestone 5 brief only**, and do not start M5 until authorised.
