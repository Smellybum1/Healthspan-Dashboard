# ADR-0011: A separate hosted application, not a flag inside the local one

## Status

Accepted

## Context

Milestone 7 requires an edge-safe Sites runtime: a fetch-style Hono entrypoint with no
Node server adapter, no `better-sqlite3`, no filesystem, and no persistent timer. The
brief suggests reusing "the same Hono application factory where possible".

The local application cannot be that factory. `apps/api/src/app.ts` opens a SQLite
database at construction time, seeds operational sources, starts a job worker and two
schedulers, and imports the connector, backup, and platform-policy services. Those are
not incidental — they are what the local runtime is for. Making them conditional would
not help: an import is reachable whether or not a branch executes it, so a shared
factory would drag `better-sqlite3` and `node:fs` into the hosted module graph no matter
how carefully the code guarded them.

The alternative risk is duplication. Two applications answering the same URLs can drift
into two different response shapes, which is exactly the failure the parity requirement
exists to prevent.

## Decision

1. `apps/sites` is a separate application with a fetch-style default export. It shares
   no factory with `apps/api`.
2. What the two share is the layer beneath them: the async ports and DTO mapping in
   `@healthspan/core`, and the services in `@healthspan/runtime`. Both are edge-safe by
   construction — `types: []` and no Node lib in their `tsconfig`, so a `node:*` import
   or a `process.env` read fails to compile there.
3. A hosted-reachable service **moves** from `apps/api/src` into `@healthspan/runtime`
   when it is ported. It is not copied. A service still in `apps/api/src` has not been
   ported yet, which makes the porting ledger checkable against the file tree.
4. Request shaping is shared too, not just business logic. Both runtimes call
   `parseContentListQuery`, so they cannot disagree about what `?page=abc` means.
5. `scripts/sites-bundle-doctor.ts` treats `apps/sites/src/index.ts` as a declared root
   and walks its whole import graph. Adding a forbidden import to the hosted app fails
   the gate by construction rather than by review.

## Consequences

What gets easier?

- The edge boundary is a compile-time and gate-time property, not a convention. Two
  independent mechanisms catch a violation: the bundle doctor names the offending import
  edge, and the missing Node type definitions reject it at `tsc`.
- The hosted app can be honest about what it does not have. It answers a local-only
  route with `501` and a named capability, and an unbound port with `503` and a reason,
  rather than a `404` or an empty success that would read as "no data".
- Porting a domain has one obvious shape: move the service, add the port, bind the local
  adapter, declare the module as a hosted root.

What gets harder?

- Two route tables exist, and a route ported to hosted must be added in both places. The
  shared service layer bounds the damage — the divergence can only be in routing and
  response envelope, not in behaviour — but it is real, and the parity harness is what
  must catch it.
- `@healthspan/operations` is now split across two packages: the pure request-integrity
  functions in `@healthspan/core/http`, and the stateful session and backup code left
  behind. The package re-exports the moved functions so local import sites are unchanged,
  but the seam has to be understood by anyone adding to it.

## Alternatives considered

**One factory with a runtime flag.** Rejected: reachability, not execution, is what puts
a module in the bundle. A flag cannot make `better-sqlite3` unreachable from a file that
imports it.

**Conditional package exports on `apps/api`.** The brief permits conditional exports and
they are still the right mechanism for `@healthspan/db`'s local and D1 adapters. They do
not solve this case, because the local app's route table itself depends on local-only
services; there is no export condition that yields an edge-safe `app.ts`.
