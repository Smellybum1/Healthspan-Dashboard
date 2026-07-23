# ARTG bounded connector — terms / robots assumptions

**Check date:** 24 July 2026  
**Connector:** `packages/connectors/src/artg.ts` (`artg`)  
**Official base:** https://www.tga.gov.au/resources/artg

## Intended access model

- Feature-specific, **bounded** lookups only (reviewed entity names, active ingredients, known product names, known ARTG IDs).
- **No full-register crawl.**
- Rate limit default: 0.5 req/s (`minIntervalMs: 2000`).
- Store raw HTML snapshots; parse search/detail contract markers.
- PI/CMI links may be retained when exposed; **PI/CMI PDF contents are not parsed in M4.**
- Search misses → `no_exact_match_found` (never automatic `unapproved`).

## Assumptions at check date

1. Public ARTG search/detail HTML remains reachable without authenticated sessions for targeted queries.
2. robots/terms do not prohibit non-bulk, low-rate research tooling that mirrors a user looking up a single product or ingredient.
3. If the official site prohibits or technically blocks this bounded access, **stop only this connector**, mark it `source_unavailable` / disabled, and consult the project manager — do not substitute a third-party ARTG dump.

## Operator controls

- Disable via connector `enabled: false` or source health disable in Live ops.
- Prefer fixture transport in unit tests; live smoke is opt-in only.

## Related

- ADR-0009 (identity + scoped regulatory facts)
- M4 execution brief §16.4
