import fs from 'node:fs';
import { afterAll } from 'vitest';
import { seedCreatorFixture } from '../testing/creator-fixture.js';
import { createLocalCreatorReadRepository } from './creator.js';
import { runCreatorContract } from './creator.contract.js';

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

/** Binds the shared creator contract to the local SQLite adapter. */
runCreatorContract({
  name: 'local SQLite',
  create: () => {
    const seeded = seedCreatorFixture();
    dirs.push(seeded.dir);
    handles.push(seeded.sqlite);
    return Promise.resolve(createLocalCreatorReadRepository(seeded.db));
  },
});
