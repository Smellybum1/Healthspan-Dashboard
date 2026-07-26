import fs from 'node:fs';
import { afterAll } from 'vitest';
import { createD1Shim } from '../../testing/d1-shim.js';
import { seedCreatorFixture } from '../../testing/creator-fixture.js';
import { runCreatorContract } from '../../repositories/creator.contract.js';
import { createSitesD1 } from './client.js';
import { createSitesCreatorReadRepository } from './creator.js';

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
 * Binds the *same* creator contract to the D1 adapter, over the same seed helper.
 *
 * The video left join is the case to watch here: an inner join would drop the video with
 * no `platform_content_current` row, which the contract asserts must survive. The caveats
 * in `testing/d1-shim.ts` still apply in full.
 */
runCreatorContract({
  name: 'Sites D1',
  create: () => {
    const seeded = seedCreatorFixture();
    dirs.push(seeded.dir);
    handles.push(seeded.sqlite);
    return Promise.resolve(
      createSitesCreatorReadRepository(createSitesD1(createD1Shim(seeded.sqlite))),
    );
  },
});
