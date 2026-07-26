import fs from 'node:fs';
import { afterAll } from 'vitest';
import { createD1Shim } from '../../testing/d1-shim.js';
import { seedIntelligenceFixture } from '../../testing/intelligence-fixture.js';
import { runIntelligenceContract } from '../../repositories/intelligence.contract.js';
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
 * The same intelligence contract against the D1 adapter.
 *
 * The `inArray` span fetch is the case to watch here: one bound statement per page rather
 * than one per claim, which means the driver has to bind a variable-length parameter list.
 * The caveats in `testing/d1-shim.ts` still apply in full.
 */
runIntelligenceContract({
  name: 'Sites D1',
  create: () => {
    const seeded = seedIntelligenceFixture();
    dirs.push(seeded.dir);
    handles.push(seeded.sqlite);
    return Promise.resolve(
      createSitesClaimAssessmentRepository(createSitesD1(createD1Shim(seeded.sqlite))),
    );
  },
});
