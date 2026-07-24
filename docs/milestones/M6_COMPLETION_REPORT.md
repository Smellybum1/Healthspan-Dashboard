# Milestone 6 Completion Report

**Product version:** 0.6.0  
**Branch:** `milestone-6/personalisation-production-hardening`  
**Exact base commit:** `575489cf913812291f75266975e77c8953058968`  
**Entry-gate commit:** `36a281015176ea73fc24fde6344bfc15bfe22308`  
**Controlling brief:** `docs/milestones/healthspan_dashboard_milestone_6_execution_brief.md`  
**Brief SHA-256:** `f78eeb73b7e735c9ce24103b99de617a94951101133ce010c3401667a8355118`

## Executive summary

Milestone 6 delivers the mandatory M2–M4 official-brief entry gate, then the single-local-profile SQLite personalisation layer, deterministic in-app alerts, daily/weekly briefs, backup/restore preflight, production-local single-origin serving, Node 24 / pnpm 11 baseline, security headers/Host/Origin/rate limits, CI, threat model, SBOM/secrets scan, and M6 doctors.

## Exact hashes

| Milestone | Hash |
| --- | --- |
| M5 tip / M6 base | `575489cf913812291f75266975e77c8953058968` |
| Entry gate | `36a281015176ea73fc24fde6344bfc15bfe22308` |
| Feature-complete / Final HEAD | `2fe629fb682d7bb53503b10195c98caa0c65edc6` |

## Entry-gate decision and sequencing

1. M5 Section 34 closure accepted.
2. M4 → M3 → M2 residuals closed with append-only reports.
3. `BRIEF_GAP_MATRIX.md` closed (no unapproved PARTIAL/MISSING/UNKNOWN/BLOCKED for M2–M5).
4. Distinct gate commit before Section 6 feature work.

### Closure reports

- `docs/milestones/M4_OFFICIAL_BRIEF_CLOSURE_REPORT.md`
- `docs/milestones/M3_OFFICIAL_BRIEF_CLOSURE_REPORT.md`
- `docs/milestones/M2_OFFICIAL_BRIEF_CLOSURE_REPORT.md`
- `docs/milestones/BRIEF_GAP_MATRIX.md`

## Runtime baseline

- Node.js 24 LTS (`engines.node`: `>=24 <25`); `.nvmrc` / `.node-version` = `24`
- `packageManager`: `pnpm@11.6.0` (CI uses pnpm 11; local verification also ran under Node 24)
- App version `0.6.0`; schema version `11` (migration `0011_m6_personalisation_ops`)

## Personalisation / alerts / briefs

- Single Live profile `local-owner`
- Named watchlists (default **Following**), watchable objects, saved searches, reading/mute/visit state
- Since-last-visit projection over non-baseline change events
- Deterministic in-app alerts with dedupe keys
- Daily research brief + weekly review generators
- Legacy preference import preview (Demo IDs not imported into Live)
- Packages: `@healthspan/personalization`, `@healthspan/operations`

## Backup / operations / security

- Backup JSON envelope + restore preflight (`pnpm backup:create`)
- Storage usage categories; retention defaults; log redaction
- Security headers, loopback Host enforcement, Origin checks on mutations, soft rate limit
- `docs/security/THREAT_MODEL.md`
- `pnpm secrets:scan`, `pnpm sbom`
- CI: `.github/workflows/ci.yml` (Windows + Ubuntu, Node 24, pnpm 11)

## Production-local runtime

```text
pnpm build
pnpm start
```

Serves built React + `/api/*` + `/health` on `http://127.0.0.1:8787` by default. Refuses start if web build is missing.

## Quality gates (verification)

| Command | Result |
| --- | --- |
| `pnpm format:check` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (116) |
| `pnpm build` | PASS |
| `pnpm db:doctor` | PASS |
| `pnpm ingest:reprocess --source pubmed` | PASS (temp DB) |
| `pnpm ingest:reprocess --source clinicaltrials-gov` | PASS |
| `pnpm ingest:reprocess --source crossref` | PASS |
| `pnpm ingest:reprocess --source tga` | PASS |
| `pnpm intelligence:eval` | PASS (73 + 16 pairs) |
| `pnpm intelligence:doctor` | PASS |
| `pnpm interventions:eval` / `:doctor` | PASS |
| `pnpm regulatory:eval` / `:doctor` | PASS |
| `pnpm safety:doctor` / `dossiers:doctor` | PASS |
| `pnpm creators:*` / youtube/x/platform-policy/documents doctors | PASS |
| `pnpm personalisation:doctor` | PASS |
| `pnpm alerts:doctor` | PASS |
| `pnpm briefs:doctor` | PASS |
| `pnpm backup:doctor` | PASS |
| `pnpm operations:doctor` | PASS |
| `pnpm secrets:scan` | PASS |
| `pnpm test:e2e` | PASS (18 passed, 4 skipped) |

## Stop rules observed

- No merge to `main` unless owner instructs
- No M7 ChatGPT Sites work
- No dosing / vendors / ranking / personal-health / hosted multi-user claims
- Live and Demo remain separate

## Known limitations

- Drugs@FDA / Purple Book / openFDA event paths remain fixture-first for deterministic completion
- Full CycloneDX SBOM tooling may be substituted by the lite `pnpm sbom` inventory in CI
- Opt-in live connector smoke remains `NOT RUN — no credential/network` in default gates
