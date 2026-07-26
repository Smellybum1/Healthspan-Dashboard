import fs from 'node:fs';
import { afterAll } from 'vitest';
import { seedJobFixture } from '../../testing/job-fixture.js';
import { createD1Shim } from '../../testing/d1-shim.js';
import { createSitesD1 } from './client.js';
import { createSitesJobRepository } from './job.js';
import { runJobContract } from '../../repositories/job.contract.js';

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

runJobContract({
  name: 'Sites D1',
  create: () => {
    const seeded = seedJobFixture();
    dirs.push(seeded.dir);
    handles.push(seeded.sqlite);
    return Promise.resolve(createSitesJobRepository(createSitesD1(createD1Shim(seeded.sqlite))));
  },
});
