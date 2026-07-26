/**
 * Local SQLite adapters for the shared repository ports.
 *
 * These live in `@healthspan/db` because they depend on the driver and schema. The
 * ports themselves live in `@healthspan/core`, which has no Node-only dependency, so
 * hosted services can import the contract without pulling `better-sqlite3` into the
 * edge bundle.
 */

import type {
  ClaimAssessmentRepository,
  ContentReadRepository,
  CreatorReadRepository,
  ReviewRepository,
} from '@healthspan/core';
import type { HealthspanDb } from '../client.js';
import { createLocalClaimAssessmentRepository } from './assessment.js';
import { createLocalContentReadRepository } from './content.js';
import { createLocalCreatorReadRepository } from './creator.js';
import { createLocalReviewRepository } from './review.js';

export * from './assessment.js';
export * from './content.js';
export * from './creator.js';
export * from './review.js';

/**
 * The set of ports a runtime binds. Grows one domain at a time as the porting ledger
 * moves rows from `pending` to `done`; see
 * `docs/sites/HOSTED_REACHABILITY_AND_ASYNC_PORTING_LEDGER.md`.
 */
export type HealthspanRepositories = {
  assessment: ClaimAssessmentRepository;
  content: ContentReadRepository;
  creator: CreatorReadRepository;
  review: ReviewRepository;
};

export function createLocalRepositories(db: HealthspanDb): HealthspanRepositories {
  return {
    assessment: createLocalClaimAssessmentRepository(db),
    content: createLocalContentReadRepository(db),
    creator: createLocalCreatorReadRepository(db),
    review: createLocalReviewRepository(db),
  };
}
