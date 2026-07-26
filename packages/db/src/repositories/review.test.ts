import fs from 'node:fs';
import { afterAll } from 'vitest';
import { readSeededClaim, seedReviewFixture } from '../testing/review-fixture.js';
import { createLocalReviewRepository } from './review.js';
import { runReviewContract, type ReviewContractFixture } from './review.contract.js';

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

/** Binds the shared review contract to the local SQLite adapter. */
let current: ReturnType<typeof seedReviewFixture> | null = null;

runReviewContract({
  name: 'local SQLite',
  create: (fixture: ReviewContractFixture) => {
    const seeded = seedReviewFixture(fixture);
    dirs.push(seeded.dir);
    handles.push(seeded.sqlite);
    current = seeded;
    return Promise.resolve(createLocalReviewRepository(seeded.db));
  },
  readClaim: (id: string) => Promise.resolve(current ? readSeededClaim(current.db, id) : null),
});
