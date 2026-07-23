# Progress log

## 2026-07-24 — M4 packet: resolution, compare, Purple Book, AEMS

- Entity-resolution accept/reject/defer/create_entity/keep_separate with append-only decisions
- Live comparison screen (2–4 entities, no winner/rank/spontaneous-report ranking)
- Purple Book CSV + FDA AEMS potential-signal connectors (fixture-first)
- ADR-0009 identity/regulatory scope; methodology sections expanded
- Gates: lint, typecheck, test (72), build

### Next recommended work

Drugs@FDA bulk ZIP staging, openFDA event aggregates when keyed, trial↔intervention mappings, Today regulatory events, e2e, full checklist + M4_COMPLETION_REPORT. Do not start M5.

## 2026-07-24 — Milestone 4 in progress (dossier + identity connectors)

- Branch: `milestone-4/interventions-peptides-regulation` (base M3 `4d985d3`).
- Landed `@healthspan/interventions`, intervention DB schema/migration `0004`, Live dossiers, entity-resolution queue.
- Fixture-first identity/regulatory connectors: RxNorm, PubChem, GSRS, ARTG (exact/none/ambiguous/parser-break), Drugs@FDA, openFDA (key-disabled healthy).
- Coverage cells (`not_checked` / miss ≠ unapproved) on dossier regulatory matrix; enrich-identity admin route.
- Gates checked this packet: lint, typecheck, test (68), build green. `intelligence:eval` still 73/16.

### Next recommended work

Purple Book + Drugs@FDA bulk ZIP path, AEMS/FAERS caveats, comparison views, entity-resolution mutations, docs/ADRs, e2e, full M4 checklist + completion report. Do not start M5.

## 2026-07-23 — Milestone 1 complete

- Built Healthspan Dashboard monorepo (apps/web, apps/api, packages/*).
- Seeded 89 demo content records with diversity required by M1 brief.
- Quality gates: lint, typecheck, test (14), test:e2e (9 pass / 1 skip), build — all green.
- Docs + ADRs + screenshots landed under `docs/`.
- Stopped before Milestone 2.

### Next recommended work

Await Milestone 2 brief: SQLite/Drizzle, adapter framework, job runner, PubMed/CTG/Crossref/TGA connectors.
