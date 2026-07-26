import fs from 'node:fs';
import { afterAll } from 'vitest';
import { seedOperationsFixture } from '../../testing/operations-fixture.js';
import { createD1Shim } from '../../testing/d1-shim.js';
import { createSitesD1 } from './client.js';
import { createSitesOperationsReadRepository } from './operations.js';
import { runOperationsContract } from '../../repositories/operations.contract.js';

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

runOperationsContract({
  name: 'Sites D1',
  create: () => {
    const seeded = seedOperationsFixture();
    dirs.push(seeded.dir);
    handles.push(seeded.sqlite);
    return Promise.resolve(
      createSitesOperationsReadRepository(createSitesD1(createD1Shim(seeded.sqlite))),
    );
  },
});
