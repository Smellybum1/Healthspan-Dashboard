import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll } from 'vitest';
import { openDatabase } from '../client.js';
import { contentItems } from '../schema.js';
import { createLocalContentReadRepository } from './content.js';
import { runContentReadContract, type ContentContractFixture } from './content.contract.js';

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
 * Binds the shared contract to the local SQLite adapter. When the D1 adapter lands it
 * binds the same suite, which is what makes `sites:parity` meaningful rather than two
 * independently-written sets of expectations.
 */
runContentReadContract({
  name: 'local SQLite',
  create: (items: ContentContractFixture[]) => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-content-port-'));
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
    return Promise.resolve(createLocalContentReadRepository(live.db));
  },
});
