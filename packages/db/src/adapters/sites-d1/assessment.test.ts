import fs from 'node:fs';
import { afterAll } from 'vitest';
import { createD1Shim } from '../../testing/d1-shim.js';
import { seedAssessmentFixture } from '../../testing/assessment-fixture.js';
import { runAssessmentContract } from '../../repositories/assessment.contract.js';
import { createSitesD1 } from './client.js';
import { createSitesClaimAssessmentRepository } from './assessment.js';

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
 * Binds the *same* assessment contract to the D1 adapter, over the same seed helper.
 *
 * This domain is the one where the join matters most — see the adapter's docblock. The
 * caveats in `testing/d1-shim.ts` still apply in full: real adapter, real
 * `drizzle-orm/d1` driver, real migrated schema, and no evidence about the D1 service.
 */
runAssessmentContract({
  name: 'Sites D1',
  create: () => {
    const seeded = seedAssessmentFixture();
    dirs.push(seeded.dir);
    handles.push(seeded.sqlite);
    return Promise.resolve(
      createSitesClaimAssessmentRepository(createSitesD1(createD1Shim(seeded.sqlite))),
    );
  },
});
