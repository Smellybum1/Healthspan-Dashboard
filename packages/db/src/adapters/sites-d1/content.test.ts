import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { openDatabase } from '../../client.js';
import { contentItems } from '../../schema.js';
import { createD1Shim } from '../../testing/d1-shim.js';
import {
  CONTENT_CONTRACT_FIXTURES,
  runContentReadContract,
  type ContentContractFixture,
} from '../../repositories/content.contract.js';
import { createSitesContentReadRepository } from './content.js';
import { createSitesD1 } from './client.js';

const temps: string[] = [];
const handles: Array<{ close(): void }> = [];

afterAll(() => {
  // Windows holds the SQLite file open until the handle is closed, so closing must
  // precede removal or cleanup fails with EPERM.
  for (const h of handles) {
    try {
      h.close();
    } catch {
      /* already closed */
    }
  }
  for (const t of temps) {
    try {
      fs.rmSync(t, { recursive: true, force: true });
    } catch {
      /* best-effort temp cleanup */
    }
  }
});

/**
 * Seed a migrated database and return the D1 adapter over a shim binding.
 *
 * The rows are inserted through the local driver because writing is not this adapter's
 * job; the read path under test is entirely the D1 one. See `testing/d1-shim.ts` for
 * exactly what a green run here does and does not establish — in short, it exercises the
 * real adapter and the real `drizzle-orm/d1` driver against the real migrated schema,
 * and it is not evidence about the D1 service itself.
 */
function seed(items: ContentContractFixture[]) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-content-d1-'));
  temps.push(temp);
  const live = openDatabase({
    dbPath: path.join(temp, 'healthspan-dashboard.sqlite3'),
    migrateOnOpen: true,
  });
  handles.push(live.sqlite);
  const now = Date.now();
  for (const item of items) {
    live.db
      .insert(contentItems)
      .values({
        id: item.id,
        type: item.type,
        dataOrigin: 'live',
        title: item.title,
        summary: item.summary,
        sourcePublishedAt: item.sourcePublishedAt,
        canonicalUrl: item.canonicalUrl,
        firstSeenAt: now,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: item.updatedAt,
      })
      .run();
  }
  return createSitesD1(createD1Shim(live.sqlite));
}

/**
 * The same suite `repositories/content.test.ts` runs against the local adapter — not a
 * copy of it, and not a parallel set of expectations written against D1's assumptions.
 * Two separately-authored test files would be two opinions; one suite bound twice is
 * parity.
 */
runContentReadContract({
  name: 'Sites D1',
  create: (items: ContentContractFixture[]) =>
    Promise.resolve(createSitesContentReadRepository(seed(items))),
});

describe('Sites D1 content adapter — driver path', () => {
  it('resolves rather than returning synchronously', async () => {
    // The distinction the whole port exists for. A local adapter can accidentally
    // satisfy an async contract by returning a value; this one cannot.
    const repo = createSitesContentReadRepository(seed(CONTENT_CONTRACT_FIXTURES));
    const pending = repo.list({});
    expect(pending).toBeInstanceOf(Promise);
    expect(await pending).toMatchObject({ total: 3 });
  });

  it('drives the async driver, not the synchronous one', async () => {
    // `.all()` on the D1 query builder would be the better-sqlite3 shape. If this
    // adapter were accidentally handed a sync driver, awaiting a non-promise would
    // still pass, so assert the driver identity directly.
    const db = seed(CONTENT_CONTRACT_FIXTURES);
    const rows = db.select().from(contentItems);
    expect(typeof (rows as unknown as { then?: unknown }).then).toBe('function');
  });

  it('reads through the shim binding rather than the local handle', async () => {
    const live = openDatabase({
      dbPath: path.join(
        (() => {
          const t = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-content-d1-bind-'));
          temps.push(t);
          return t;
        })(),
        'healthspan-dashboard.sqlite3',
      ),
      migrateOnOpen: true,
    });
    handles.push(live.sqlite);

    const calls: string[] = [];
    const shim = createD1Shim(live.sqlite);
    const spy = {
      prepare(sql: string) {
        calls.push(sql);
        return shim.prepare(sql);
      },
      batch: shim.batch.bind(shim),
    };

    const repo = createSitesContentReadRepository(createSitesD1(spy));
    await repo.list({ q: 'anything' });

    // Two statements — rows and filtered count — and both went through the binding.
    expect(calls).toHaveLength(2);
    expect(calls.some((sql) => sql.includes('count(*)'))).toBe(true);
    expect(calls.every((sql) => sql.includes('content_items'))).toBe(true);
  });
});
