import fs from 'node:fs';
import { afterAll } from 'vitest';
import { seedIntelligenceFixture } from '../testing/intelligence-fixture.js';
import { createLocalClaimAssessmentRepository } from './assessment.js';
import { runIntelligenceContract } from './intelligence.contract.js';

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

runIntelligenceContract({
  name: 'local SQLite',
  create: () => {
    const seeded = seedIntelligenceFixture();
    dirs.push(seeded.dir);
    handles.push(seeded.sqlite);
    return Promise.resolve(createLocalClaimAssessmentRepository(seeded.db));
  },
});
