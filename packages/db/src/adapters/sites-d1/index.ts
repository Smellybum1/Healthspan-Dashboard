/**
 * Sites/D1 adapters — the hosted half of the shared repository ports.
 *
 * Reached as `@healthspan/db/sites`, never as `@healthspan/db`. That distinction is the
 * point of the conditional export: the package root exposes `HealthspanDb`,
 * `openDatabase`, and the `better-sqlite3` driver, and is forbidden outright in the
 * hosted graph. Everything reachable from *this* file is edge-safe, and
 * `pnpm sites:bundle:doctor` walks it from `apps/sites/src/index.ts` to prove it.
 *
 * Grows one domain at a time alongside the porting ledger. A port with no adapter here
 * is reported by `/api/hosted-readiness` as ported-but-unbound; it is never served as an
 * empty success.
 */
import type {
  IntelligenceReadRepository,
  ContentReadRepository,
  CreatorReadRepository,
  InterventionReadRepository,
  JobRepository,
  RegulatoryReadRepository,
  D1Database,
  ReviewRepository,
} from '@healthspan/core';
import { createSitesD1 } from './client.js';
import { createSitesClaimAssessmentRepository } from './assessment.js';
import { createSitesContentReadRepository } from './content.js';
import { createSitesCreatorReadRepository } from './creator.js';
import { createSitesInterventionReadRepository } from './intervention.js';
import { createSitesJobRepository } from './job.js';
import { createSitesRegulatoryReadRepository } from './regulatory.js';
import { createSitesReviewRepository } from './review.js';

export * from './assessment.js';
export * from './client.js';
export * from './content.js';
export * from './creator.js';
export * from './intervention.js';
export * from './job.js';
export * from './regulatory.js';
export * from './review.js';

/**
 * The set of ports the hosted runtime binds, built from the `DB` binding.
 *
 * Mirrors `createLocalRepositories` in `../../repositories/index.ts`. The two must offer
 * the same port names, because the services above them take ports and cannot tell which
 * runtime they are in.
 */
export type SitesRepositories = {
  assessment: IntelligenceReadRepository;
  content: ContentReadRepository;
  creator: CreatorReadRepository;
  intervention: InterventionReadRepository;
  job: JobRepository;
  regulatory: RegulatoryReadRepository;
  review: ReviewRepository;
};

export function createSitesRepositories(binding: D1Database): SitesRepositories {
  const db = createSitesD1(binding);
  return {
    assessment: createSitesClaimAssessmentRepository(db),
    content: createSitesContentReadRepository(db),
    creator: createSitesCreatorReadRepository(db),
    intervention: createSitesInterventionReadRepository(db),
    job: createSitesJobRepository(db),
    regulatory: createSitesRegulatoryReadRepository(db),
    review: createSitesReviewRepository(db),
  };
}
