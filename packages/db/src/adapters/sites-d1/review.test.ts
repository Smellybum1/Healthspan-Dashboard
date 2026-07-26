import fs from 'node:fs';
import { afterAll } from 'vitest';
import { createD1Shim } from '../../testing/d1-shim.js';
import { readSeededClaim, seedReviewFixture } from '../../testing/review-fixture.js';
import {
  runReviewContract,
  type ReviewContractFixture,
} from '../../repositories/review.contract.js';
import { createSitesD1 } from './client.js';
import { createSitesReviewRepository } from './review.js';

const dirs: string[] = [];
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
  for (const d of dirs) {
    try {
      fs.rmSync(d, { recursive: true, force: true });
    } catch {
      /* best-effort temp cleanup */
    }
  }
});

/**
 * Binds the *same* review contract to the D1 adapter, over the same seed helper, so any
 * difference in the results is a difference in the adapter rather than in the fixture.
 *
 * See `testing/d1-shim.ts` for what this establishes and what it does not: real adapter,
 * real `drizzle-orm/d1` driver, real migrated schema — and no evidence at all about the
 * D1 service. That matters more for this domain than for content, because the write path
 * here is four statements with no transaction around them.
 */
let current: ReturnType<typeof seedReviewFixture> | null = null;

runReviewContract({
  name: 'Sites D1',
  create: (fixture: ReviewContractFixture) => {
    const seeded = seedReviewFixture(fixture);
    dirs.push(seeded.dir);
    handles.push(seeded.sqlite);
    current = seeded;
    return Promise.resolve(createSitesReviewRepository(createSitesD1(createD1Shim(seeded.sqlite))));
  },
  readClaim: (id: string) => Promise.resolve(current ? readSeededClaim(current.db, id) : null),
});
