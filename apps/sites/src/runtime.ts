/**
 * Hosted runtime assembly: capabilities, bound repositories, and readiness.
 *
 * The entrypoint holds no persistence knowledge. It asks this module what the runtime
 * can do and which ports are bound, and every route answers from that. When the D1
 * adapters land, only {@link createSitesRepositories} changes — no handler does.
 */
import {
  SITES_RUNTIME_CAPABILITIES,
  type IntelligenceReadRepository,
  type ContentReadRepository,
  type CreatorReadRepository,
  type InterventionReadRepository,
  type RegulatoryReadRepository,
  type D1Database,
  type ReviewRepository,
  type RuntimeCapabilities,
} from '@healthspan/core';
// `@healthspan/db/sites`, never `@healthspan/db`. The package root exposes
// `HealthspanDb`, `openDatabase`, and the native driver and is forbidden in this graph;
// the conditional export reaches only the D1 adapters, which the bundle doctor walks.
import { createSitesRepositories as createD1Repositories } from '@healthspan/db/sites';
import { readSitesEnv, type ConfigProblem, type SitesBindings, type SitesConfig } from './env.js';

/**
 * The ports the hosted runtime binds.
 *
 * A port is `null` when its domain has not been ported yet, or has been ported but has
 * no D1 adapter. Both cases are reported; neither is served as an empty success.
 */
export type SitesRepositories = {
  assessment: IntelligenceReadRepository | null;
  content: ContentReadRepository | null;
  creator: CreatorReadRepository | null;
  intervention: InterventionReadRepository | null;
  regulatory: RegulatoryReadRepository | null;
  review: ReviewRepository | null;
};

/**
 * Per-domain hosted status, derived from the ledger.
 *
 * `ported` tracks `docs/sites/HOSTED_REACHABILITY_AND_ASYNC_PORTING_LEDGER.md`; `bound`
 * tracks whether an adapter is actually wired at runtime. The two differ today because
 * the content domain is ported but its D1 adapter is a later row, and that gap is
 * exactly what the readiness report exists to make visible.
 */
export type DomainStatus = {
  domain: string;
  port: string;
  ported: boolean;
  bound: boolean;
  reason?: string;
};

/**
 * Build the repository set from the D1 binding.
 *
 * Ports with a D1 adapter are bound here; ports without one stay `null` and are reported
 * as ported-but-unbound. That distinction is deliberate — a hosted route that returned
 * `[]` for a missing adapter would look like an empty database.
 */
export function createSitesRepositories(db: D1Database): SitesRepositories {
  const bound = createD1Repositories(db);
  return {
    assessment: bound.assessment,
    content: bound.content,
    creator: bound.creator,
    intervention: bound.intervention,
    regulatory: bound.regulatory,
    review: bound.review,
  };
}

export type SitesRuntime = {
  capabilities: RuntimeCapabilities;
  config: SitesConfig;
  problems: ConfigProblem[];
  /** False when configuration failed closed — no data route may serve. */
  configured: boolean;
  repositories: SitesRepositories;
  domains: DomainStatus[];
};

export type SitesRuntimeOptions = {
  /**
   * Override the repository factory.
   *
   * Used by the route tests to bind an in-memory adapter that satisfies the shared port,
   * which is what lets the entrypoint be tested without standing up a database. The
   * default is the real D1 factory; the adapter itself is verified against the shared
   * contract suite in `packages/db/src/adapters/sites-d1/content.test.ts`.
   */
  createRepositories?: (db: D1Database) => SitesRepositories;
};

export function createSitesRuntime(
  bindings: SitesBindings,
  options: SitesRuntimeOptions = {},
): SitesRuntime {
  const env = readSitesEnv(bindings);
  const factory = options.createRepositories ?? createSitesRepositories;
  const repositories = bindings.DB
    ? factory(bindings.DB)
    : {
        assessment: null,
        content: null,
        creator: null,
        intervention: null,
        regulatory: null,
        review: null,
      };

  const describe = (domain: string, port: string, bound: unknown): DomainStatus => ({
    domain,
    port,
    ported: true,
    bound: bound !== null,
    ...(bound === null ? { reason: 'D1 binding "DB" is not provisioned' } : {}),
  });

  const domains: DomainStatus[] = [
    describe('assessment', 'ClaimAssessmentRepository', repositories.assessment),
    describe('content', 'ContentReadRepository', repositories.content),
    describe('creator', 'CreatorReadRepository', repositories.creator),
    describe('intervention', 'InterventionReadRepository', repositories.intervention),
    describe('regulatory', 'RegulatoryReadRepository', repositories.regulatory),
    describe('review', 'ReviewRepository', repositories.review),
  ];

  return {
    capabilities: SITES_RUNTIME_CAPABILITIES,
    config: env.config,
    problems: env.problems,
    configured: env.ok,
    repositories,
    domains,
  };
}

/**
 * Domains that are reachable locally but must never be operational in the hosted
 * runtime, with the reason a caller sees instead of a 404.
 *
 * Mirrors §2 of the porting ledger. A hosted request for one of these gets an explicit
 * not-applicable answer, because a 404 would read as "this build is missing a route"
 * rather than "this capability does not exist here by design".
 */
export const HOSTED_UNAVAILABLE: Array<{ prefix: string; capability: string; reason: string }> = [
  {
    prefix: '/api/backup',
    capability: 'localBackupRestore',
    reason: 'local-only: SQLite online backup and filesystem archives have no hosted equivalent',
  },
  {
    prefix: '/api/restore',
    capability: 'localBackupRestore',
    reason: 'local-only: restore replaces local database files',
  },
  {
    prefix: '/api/diagnostics',
    capability: 'localBackupRestore',
    reason: 'local-only: diagnostic bundles are written to the local filesystem',
  },
  {
    prefix: '/api/ingest',
    capability: 'externalConnectors',
    reason: 'prohibited in hosted: M7 adds no hosted connectors',
  },
  {
    prefix: '/api/sources',
    capability: 'externalConnectors',
    reason: 'prohibited in hosted: connector orchestration is local-only',
  },
  {
    prefix: '/api/youtube',
    capability: 'platformMonitoring',
    reason: 'prohibited in hosted: no hosted YouTube monitoring',
  },
  {
    prefix: '/api/x',
    capability: 'platformMonitoring',
    reason: 'prohibited in hosted: no hosted X monitoring or compliance reconciliation',
  },
  {
    prefix: '/api/scheduler',
    capability: 'persistentBackgroundScheduler',
    reason: 'local-only: the hosted runtime has no persistent process timer',
  },
];

export function hostedUnavailableFor(pathname: string) {
  return HOSTED_UNAVAILABLE.find((entry) => pathname.startsWith(entry.prefix));
}
