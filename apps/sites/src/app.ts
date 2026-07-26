/**
 * The hosted Hono application.
 *
 * Milestone 7 Stage 4. A fetch-style app with no Node server adapter, no native driver,
 * no filesystem, and no persistent timer. It is a separate application from
 * `apps/api/src/app.ts` rather than a flag inside it: the local app's module graph
 * reaches `better-sqlite3`, the connectors, and the backup subsystem, so no shared
 * factory could be edge-safe until every one of those rows is ported. What the two
 * runtimes share is the layer the brief requires them to share — the async ports and
 * DTO mapping in `@healthspan/core`, and the services in `@healthspan/runtime`.
 *
 * Enforced here:
 *
 * - Security headers on every response, from the shared `SecurityHeaders`.
 * - Exactly one allowed origin. There is no CORS middleware at all, so there is nothing
 *   that could emit a wildcard.
 * - Fail closed on missing hosted configuration: only the readiness report answers.
 * - Disabled and unported capabilities answer explicitly. Nothing returns an empty
 *   success to stand in for a feature that is not there.
 */
import { Hono, type Context } from 'hono';
import {
  SecurityHeaders,
  fetchMetadataAllowed,
  originAllowedIn,
  parseHostHeader,
  type OriginPolicy,
} from '@healthspan/core';
import {
  getAssessment,
  getCreatorDetail,
  listAssessments,
  listContentItems,
  listCreatorClaims,
  listCreators,
  listRecurrenceSnapshots,
  listReviewDecisions,
  listReviewTasks,
  parseContentListQuery,
} from '@healthspan/runtime';
import type { SitesBindings } from './env.js';
import {
  HOSTED_UNAVAILABLE,
  createSitesRuntime,
  hostedUnavailableFor,
  type SitesRuntime,
  type SitesRuntimeOptions,
} from './runtime.js';

type AppEnv = {
  Bindings: SitesBindings;
  Variables: { runtime: SitesRuntime };
};

/** Paths that answer even when configuration has failed closed, so the owner can see why. */
const ALWAYS_AVAILABLE = ['/api/hosted-readiness', '/api/runtime-capabilities'];

/**
 * Hosts the app answers for.
 *
 * The configured origin's host is always accepted. `HEALTHSPAN_HOSTED_PREVIEW_HOSTS`
 * exists because a saved Sites version is reached through a preview host that is not
 * the canonical origin, and §25.5 requires that host to be configuration rather than a
 * wildcard. Absent that setting, only the canonical host is accepted.
 */
function allowedHosts(runtime: SitesRuntime, bindings: SitesBindings): Set<string> {
  const hosts = new Set<string>();
  if (runtime.config.allowedOrigin) {
    hosts.add(parseHostHeader(new URL(runtime.config.allowedOrigin).host).hostname);
  }
  for (const raw of (bindings.HEALTHSPAN_HOSTED_PREVIEW_HOSTS ?? '').split(',')) {
    const { hostname } = parseHostHeader(raw.trim());
    if (hostname) hosts.add(hostname);
  }
  return hosts;
}

function originPolicy(runtime: SitesRuntime, bindings: SitesBindings): OriginPolicy {
  return {
    allowedOrigins: new Set(runtime.config.allowedOrigin ? [runtime.config.allowedOrigin] : []),
    allowedHosts: allowedHosts(runtime, bindings),
    // Never true in hosted. A loopback origin satisfying the hosted exact-origin rule
    // would mean something other than the owner's Site had satisfied it.
    allowLoopback: false,
  };
}

/**
 * The answer for a domain that is ported but has no adapter bound.
 *
 * A `503` with the domain's own readiness reason, never an empty `200`. The distinction
 * is the whole point: an empty success reads as an empty database, which is a very
 * different thing from a missing binding.
 */
function unbound(c: Context<AppEnv>, domain: string) {
  const status = c.get('runtime').domains.find((d) => d.domain === domain);
  return c.json(
    {
      error: `${domain} is not available in this runtime`,
      capability: domain,
      reason: status?.reason ?? 'no adapter bound',
    },
    503,
  );
}

export function createSitesApp(options: SitesRuntimeOptions = {}) {
  const app = new Hono<AppEnv>();

  app.use('*', async (c, next) => {
    for (const [k, v] of Object.entries(SecurityHeaders)) c.header(k, v);

    const bindings = c.env ?? ({} as SitesBindings);
    const runtime = createSitesRuntime(bindings, options);
    c.set('runtime', runtime);

    const pathname = new URL(c.req.url).pathname;
    const host = c.req.header('host');
    const origin = c.req.header('origin');

    if (!runtime.configured) {
      if (!ALWAYS_AVAILABLE.includes(pathname)) {
        return c.json(
          {
            error: 'Hosted runtime is not configured',
            capability: 'configuration',
            problems: runtime.problems,
            readiness: '/api/hosted-readiness',
          },
          503,
        );
      }
    } else {
      const policy = originPolicy(runtime, bindings);
      if (host && !policy.allowedHosts.has(parseHostHeader(host).hostname)) {
        return c.json({ error: 'Host not allowed' }, 403);
      }
      if (
        !fetchMetadataAllowed({
          secFetchSite: c.req.header('sec-fetch-site'),
          secFetchMode: c.req.header('sec-fetch-mode'),
          secFetchDest: c.req.header('sec-fetch-dest'),
        })
      ) {
        return c.json({ error: 'Fetch metadata rejected' }, 403);
      }
      // A present Origin must be the one configured origin. An absent Origin is
      // accepted only for reads, because a top-level navigation carries none.
      const isRead = c.req.method === 'GET' || c.req.method === 'HEAD';
      if (!originAllowedIn(origin, host, policy, { allowMissingOrigin: isRead })) {
        return c.json({ error: 'Origin not allowed' }, 403);
      }
    }

    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      // No hosted write path has been ported yet. Saying so is the point: a 404 or a
      // silent 200 would each misrepresent the state of the migration.
      return c.json(
        {
          error: 'No hosted mutation is available',
          capability: 'mutations',
          reason: 'no write path has been ported to the hosted runtime yet',
        },
        501,
      );
    }

    await next();
  });

  app.get('/api/runtime-capabilities', (c) => c.json(c.get('runtime').capabilities));

  app.get('/api/hosted-readiness', (c) => {
    const runtime = c.get('runtime');
    const unbound = runtime.domains.filter((d) => !d.bound);
    return c.json({
      runtime: 'sites',
      configured: runtime.configured,
      ready: runtime.configured && unbound.length === 0,
      // Hosted data is synthetic by project rule, never a copy of the local database.
      dataOrigin: 'synthetic',
      bindings: runtime.config.bindings,
      // Presence only — a secret value never reaches this response.
      secrets: runtime.config.secrets,
      allowedOrigin: runtime.config.allowedOrigin,
      problems: runtime.problems,
      domains: runtime.domains,
      unavailable: HOSTED_UNAVAILABLE,
    });
  });

  app.get('/api/items', async (c) => {
    const repo = c.get('runtime').repositories.content;
    if (!repo) return unbound(c, 'content');
    const result = await listContentItems(
      repo,
      parseContentListQuery({
        type: c.req.query('type'),
        q: c.req.query('q'),
        page: c.req.query('page'),
        pageSize: c.req.query('pageSize'),
        sort: c.req.query('sort'),
      }),
    );
    return c.json({
      count: result.total,
      page: result.page,
      pageSize: result.pageSize,
      items: result.items,
      dataMode: 'live',
      dataOrigin: 'live',
    });
  });

  app.get('/api/assessments', async (c) => {
    const repo = c.get('runtime').repositories.assessment;
    if (!repo) return unbound(c, 'assessment');
    return c.json({
      dataMode: 'live',
      ...(await listAssessments(repo, {
        page: Number(c.req.query('page') ?? 1),
        pageSize: Number(c.req.query('pageSize') ?? 25),
        evidenceMaturity: c.req.query('evidenceMaturity') ?? undefined,
        evidenceAvailability: c.req.query('evidenceAvailability') ?? undefined,
        studyDesign: c.req.query('studyDesign') ?? undefined,
        organism: c.req.query('organism') ?? undefined,
        retractionOrCorrection: c.req.query('retractionOrCorrection') ?? undefined,
        q: c.req.query('q') ?? undefined,
      })),
    });
  });

  app.get('/api/assessments/:id', async (c) => {
    const repo = c.get('runtime').repositories.assessment;
    if (!repo) return unbound(c, 'assessment');
    const detail = await getAssessment(repo, c.req.param('id'));
    if (!detail) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', ...detail });
  });

  app.get('/api/creators', async (c) => {
    const repo = c.get('runtime').repositories.creator;
    if (!repo) return unbound(c, 'creator');
    // No bootstrap. The local runtime seeds its curated catalog from its own route; a
    // hosted read may not write, and hosted data is synthetic-fixture-only.
    const listed = await listCreators(repo, {
      page: Number(c.req.query('page') ?? 1),
      pageSize: Number(c.req.query('pageSize') ?? 50),
      q: c.req.query('q') ?? undefined,
    });
    return c.json({ dataMode: 'live', dataOrigin: 'live', ...listed });
  });

  app.get('/api/creators/:id', async (c) => {
    const repo = c.get('runtime').repositories.creator;
    if (!repo) return unbound(c, 'creator');
    const detail = await getCreatorDetail(repo, c.req.param('id'));
    if (!detail) return c.json({ error: 'Not found' }, 404);
    return c.json({ dataMode: 'live', dataOrigin: 'live', type: 'creator', ...detail });
  });

  app.get('/api/creator-claims', async (c) => {
    const repo = c.get('runtime').repositories.creator;
    if (!repo) return unbound(c, 'creator');
    const claims = await listCreatorClaims(repo, {
      creatorId: c.req.query('creatorId') ?? undefined,
      limit: Number(c.req.query('limit') ?? 50),
    });
    return c.json({ dataMode: 'live', claims });
  });

  app.get('/api/claim-recurrence', async (c) => {
    const repo = c.get('runtime').repositories.creator;
    if (!repo) return unbound(c, 'creator');
    return c.json({ dataMode: 'live', snapshots: await listRecurrenceSnapshots(repo) });
  });

  app.get('/api/review/tasks', async (c) => {
    const repo = c.get('runtime').repositories.review;
    if (!repo) return unbound(c, 'review');
    const tasks = await listReviewTasks(repo, {
      status: c.req.query('status') ?? undefined,
      limit: Number(c.req.query('limit') ?? 100),
    });
    return c.json({
      dataMode: 'live',
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        reason: t.reason,
        status: t.status,
        confidence: t.confidence,
        contentItemId: t.contentItemId,
        claimId: t.claimId,
        analysisId: t.analysisId,
        expectedAnalysisId: t.expectedAnalysisId,
        createdAt: new Date(t.createdAt).toISOString(),
      })),
    });
  });

  app.get('/api/review/decisions', async (c) => {
    const repo = c.get('runtime').repositories.review;
    if (!repo) return unbound(c, 'review');
    const decisions = await listReviewDecisions(repo);
    return c.json({
      dataMode: 'live',
      decisions: decisions.map((d) => ({
        id: d.id,
        taskId: d.taskId,
        action: d.action,
        claimId: d.claimId,
        notes: d.notes,
        editedClaimText: d.editedClaimText,
        createdAt: new Date(d.createdAt).toISOString(),
      })),
    });
  });

  // `POST /api/review/tasks/:id/resolve` is deliberately absent. The resolve path is
  // ported and its contract passes against the D1 adapter, but exposing it hosted needs
  // the session/CSRF provider that the compatibility audit §5 leaves open, and an owner
  // principal to record as the decision actor. Until then the mutation refusal in the
  // middleware answers it — explicitly, with a reason.

  app.all('/api/*', (c) => {
    const unavailable = hostedUnavailableFor(new URL(c.req.url).pathname);
    if (unavailable) {
      return c.json(
        {
          error: 'Not available in the hosted runtime',
          capability: unavailable.capability,
          reason: unavailable.reason,
        },
        501,
      );
    }
    return c.json(
      {
        error: 'Not ported to the hosted runtime',
        capability: 'unported',
        reason: 'this route has not been ported to the async repository ports yet',
        readiness: '/api/hosted-readiness',
      },
      501,
    );
  });

  return app;
}
