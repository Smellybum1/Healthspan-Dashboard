import fs from 'node:fs';
import { afterAll } from 'vitest';
import { seedAssessmentFixture } from '../testing/assessment-fixture.js';
import { createLocalClaimAssessmentRepository } from './assessment.js';
import { runAssessmentContract } from './assessment.contract.js';

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

/** Binds the shared assessment contract to the local SQLite adapter. */
runAssessmentContract({
  name: 'local SQLite',
  create: () => {
    const seeded = seedAssessmentFixture();
    dirs.push(seeded.dir);
    handles.push(seeded.sqlite);
    return Promise.resolve(createLocalClaimAssessmentRepository(seeded.db));
  },
});
