import fs from 'node:fs';
import { afterAll } from 'vitest';
import { seedInterventionFixture } from '../../testing/intervention-fixture.js';
import { createD1Shim } from '../../testing/d1-shim.js';
import { createSitesD1 } from './client.js';
import { createSitesInterventionReadRepository } from './intervention.js';
import { runInterventionContract } from '../../repositories/intervention.contract.js';

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

runInterventionContract({
  name: 'Sites D1',
  create: () => {
    const seeded = seedInterventionFixture();
    dirs.push(seeded.dir);
    handles.push(seeded.sqlite);
    return Promise.resolve(
      createSitesInterventionReadRepository(createSitesD1(createD1Shim(seeded.sqlite))),
    );
  },
});
