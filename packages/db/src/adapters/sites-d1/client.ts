import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import type { D1Database } from '@healthspan/core';
import * as schema from '../../schema.js';

/**
 * The Drizzle handle over a Sites D1 binding.
 *
 * Deliberately *not* exported as a shared runtime contract — Amendment I §2 forbids
 * exposing a driver database type across the boundary, and this type is the D1 mirror of
 * `HealthspanDb`. It stays inside the adapters; services see only the ports.
 *
 * The schema is the same `../../schema.js` the local runtime uses. One schema, two
 * drivers: that is what makes the shared query builders in
 * `repositories/content-query.ts` meaningful rather than a coincidence of two similar
 * table definitions.
 */
export type SitesD1Database = DrizzleD1Database<typeof schema>;

/**
 * `drizzle-orm/d1` types its client against the ambient `D1Database` global from
 * `@cloudflare/workers-types`, which this repository does not install — nothing here
 * needs the full platform surface, and adding it would put a types-only dependency in
 * the hosted graph to satisfy one signature. {@link D1Database} in `@healthspan/core`
 * declares exactly the operations the driver invokes (`prepare`, `bind`, `all`, `raw`,
 * `run`, `batch`), so the cast is narrowing a structural match to a nominal one rather
 * than asserting something unverified. `content.test.ts` exercises every one of those
 * calls through the real driver.
 */
export function createSitesD1(binding: D1Database): SitesD1Database {
  return drizzle(binding as never, { schema });
}
