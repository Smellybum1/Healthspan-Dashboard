/**
 * The hosted-reachable service layer.
 *
 * Milestone 7 §22. Services that both runtimes execute live here, above the async
 * repository ports and below either application. The rule that keeps this package
 * edge-safe is the same one that governs `@healthspan/core/ports`: nothing Node-only,
 * no driver type, no environment access. Its only dependency is `@healthspan/core`.
 *
 * Services move here from `apps/api/src` one porting-ledger row at a time. A service
 * still sitting in `apps/api/src` is one that has not been ported yet.
 */
export * from './assessment.js';
export * from './content.js';
export * from './creator.js';
export * from './intelligence.js';
export * from './intervention.js';
export * from './job.js';
export * from './regulatory.js';
export * from './review.js';
