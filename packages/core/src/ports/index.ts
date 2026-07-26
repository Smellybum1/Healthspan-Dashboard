/**
 * Async, domain-oriented repository ports.
 *
 * Milestone 7, Amendment I §2. These interfaces are the shared persistence contract
 * between the local SQLite runtime and the hosted Sites/D1 runtime. Exactly one adapter
 * is active at a time — there is no dual-write, replication, or synchronisation.
 *
 * Two rules govern this directory:
 *
 * 1. **Nothing Node-only may be imported here.** These types are reachable from the
 *    edge bundle, so a `node:*` import, a driver type, or a filesystem dependency
 *    anywhere in this graph would defeat the boundary. `@healthspan/core` depends only
 *    on `zod` for exactly this reason.
 * 2. **Every method returns a Promise.** D1 is async-only. The local adapter satisfies
 *    that by wrapping synchronous `better-sqlite3` calls in resolved promises; callers
 *    must await regardless of which adapter is bound.
 *
 * Ports are deliberately narrow and domain-shaped. `HealthspanDb` — and in particular
 * `BetterSQLite3Database` — is never exposed as a shared runtime contract.
 */

export * from './assessment.js';
export * from './content.js';
export * from './creator.js';
export * from './intervention.js';
export * from './review.js';
