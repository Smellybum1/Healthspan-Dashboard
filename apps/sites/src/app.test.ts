import { describe, expect, it } from 'vitest';
import {
  normaliseContentPaging,
  normaliseReviewLimit,
  toContentItemDto,
  type AssessmentRow,
  type IntelligenceReadRepository,
  type ContentItemRow,
  type ContentListQuery,
  type ContentReadRepository,
  type CreatorReadRepository,
  type InterventionReadRepository,
  type JobRepository,
  type ReviewRepository,
  type ReviewTaskDto,
} from '@healthspan/core';
import { createSitesApp } from './app.js';
import type { SitesBindings } from './env.js';

const ORIGIN = 'https://healthspan.example.invalid';
const HOST = 'healthspan.example.invalid';

const CONFIGURED: SitesBindings = {
  DB: {} as never,
  FILES: {} as never,
  HEALTHSPAN_HOSTED_OWNER_EMAIL: 'owner@example.invalid',
  HEALTHSPAN_HOSTED_SESSION_SECRET: 'a'.repeat(48),
  HEALTHSPAN_HOSTED_ALLOWED_ORIGIN: ORIGIN,
};

const ROWS: ContentItemRow[] = [
  {
    id: 'c-alpha',
    type: 'paper',
    title: 'Alpha metformin cohort',
    summary: 'A synthetic paper.',
    sourcePublishedAt: Date.UTC(2026, 0, 1),
    updatedAt: Date.UTC(2026, 0, 3),
    canonicalUrl: 'https://example.invalid/alpha',
  },
  {
    id: 'c-bravo',
    type: 'trial',
    title: 'Bravo senolytic trial',
    summary: null,
    sourcePublishedAt: null,
    updatedAt: Date.UTC(2026, 0, 2),
    canonicalUrl: null,
  },
];

/**
 * An in-memory adapter for the shared port.
 *
 * It reuses `normaliseContentPaging` and `toContentItemDto` rather than reimplementing
 * them, so it cannot be a more permissive stand-in than a real adapter on the two things
 * the route depends on: paging bounds and DTO shape.
 */
function memoryContentRepository(rows = ROWS): ContentReadRepository {
  return {
    list(query: ContentListQuery) {
      const { page, pageSize, offset } = normaliseContentPaging(query);
      const filtered = rows.filter((r) => !query.type || r.type === query.type);
      return Promise.resolve({
        page,
        pageSize,
        total: filtered.length,
        items: filtered.slice(offset, offset + pageSize).map(toContentItemDto),
      });
    },
  };
}

const REVIEW_TASKS = [
  {
    id: 'task-open',
    contentItemId: 'item-1',
    claimId: 'claim-1',
    analysisId: 'analysis-1',
    sourceRecordVersionId: null,
    expectedAnalysisId: 'analysis-1',
    title: 'Open task',
    reason: 'low confidence',
    status: 'open',
    confidence: 'low',
    createdAt: Date.UTC(2026, 0, 3),
    resolvedAt: null,
    resolutionJson: null,
  },
  {
    id: 'task-resolved',
    contentItemId: null,
    claimId: null,
    analysisId: null,
    sourceRecordVersionId: null,
    expectedAnalysisId: null,
    title: 'Resolved task',
    reason: 'checked',
    status: 'resolved',
    confidence: 'high',
    createdAt: Date.UTC(2026, 0, 2),
    resolvedAt: Date.UTC(2026, 0, 2),
    resolutionJson: null,
  },
] satisfies ReviewTaskDto[];

/**
 * Read-only in-memory review port. The hosted app exposes no review mutation, so the
 * write methods reject rather than pretending to succeed — if a hosted write path is
 * ever wired without the session provider, these tests fail loudly.
 */
function memoryReviewRepository(): ReviewRepository {
  const reject = () => Promise.reject(new Error('hosted review writes are not exposed'));
  return {
    listTasks: ({ limit }) => Promise.resolve(REVIEW_TASKS.slice(0, normaliseReviewLimit(limit))),
    listDecisions: () => Promise.resolve([]),
    getTask: (id) => Promise.resolve(REVIEW_TASKS.find((t) => t.id === id) ?? null),
    getIntelligenceState: () => Promise.resolve(null),
    listCandidateCreatorFindings: () =>
      Promise.resolve([
        {
          id: 'finding-1',
          claimId: 'claim-1',
          findingType: 'overstates_causality',
          findingState: 'candidate',
          explanation: 'Overstates a causal link.',
          reviewRequired: true,
          publishedToProfile: false,
          createdAt: Date.UTC(2026, 0, 1),
          claimText: 'Creator claim under review',
          claimCreatorId: 'creator-a',
          claimConfidence: 'high',
        },
      ]),
    listClaimFindings: () => Promise.resolve([]),
    listIdentityTasks: () =>
      Promise.resolve([
        {
          id: 'identity-1',
          accountId: 'account-a',
          reason: 'ambiguous handle',
          proposedCreatorId: 'creator-a',
          priority: 9,
          reviewStatus: 'pending',
          createdAt: Date.UTC(2026, 0, 1),
        },
      ]),
    appendDecision: reject,
    updateClaimReviewState: reject,
    markTaskResolved: reject,
    recordReviewTouch: reject,
  };
}

const ASSESSMENT_ROW: AssessmentRow = {
  analysisId: 'analysis-1',
  contentItemId: 'item-1',
  title: 'Metformin randomised trial',
  contentType: 'paper',
  summary: 'A human RCT.',
  evidenceMaturity: 'clinical',
  evidenceAvailability: 'full_text',
  studyDesign: 'rct',
  organismLevel: 'human',
  classificationConfidence: 'low',
  assessmentCompleteness: 'partial',
  resultsPresent: false,
  status: 'complete',
  stale: false,
  translationGapsJson: '[]',
  methodologicalSignalsJson: '[]',
  whatWouldChangeJson: '[]',
  hallmarksJson: '[]',
  rulesetVersion: 'v1',
  createdAt: Date.UTC(2026, 0, 5),
};

const RUN = {
  id: 'run-new',
  trigger: 'manual',
  scope: 'recent',
  status: 'succeeded',
  rulesetVersion: 'm3.deterministic.1',
  requestedCount: 4,
  completedCount: 4,
  deterministicCount: 4,
  aiCount: 0,
  reviewTaskCount: 0,
  reusedCount: 0,
  startedAt: Date.UTC(2026, 0, 5),
  completedAt: Date.UTC(2026, 0, 5) + 500,
  summary: 'ok',
};

const CLAIM = {
  id: 'claim-1',
  analysisId: 'analysis-1',
  contentItemId: 'item-paper',
  claimKind: 'efficacy',
  assertionRole: 'reported_finding',
  claimText: 'Metformin reduced the primary endpoint',
  direction: 'positive',
  outcomeFamily: null,
  extractionMethod: 'deterministic',
  classificationConfidence: 'low',
  reviewStatus: 'needs_review',
  active: true,
  createdAt: Date.UTC(2026, 0, 3),
};

/** In-memory assessment port. Filtering stays in the shared service, as in a real adapter. */
function memoryAssessmentRepository(): IntelligenceReadRepository {
  return {
    listCurrent: (filters) =>
      Promise.resolve(
        filters.evidenceMaturity && filters.evidenceMaturity !== ASSESSMENT_ROW.evidenceMaturity
          ? []
          : [ASSESSMENT_ROW],
      ),
    getAnalysis: (id) =>
      Promise.resolve(
        id === 'analysis-1'
          ? {
              id: 'analysis-1',
              contentItemId: 'item-1',
              evidenceMaturity: 'clinical',
              evidenceAvailability: 'full_text',
              studyDesign: 'rct',
              organismLevel: 'human',
              classificationConfidence: 'low',
              assessmentCompleteness: 'partial',
              resultsPresent: false,
              translationGapsJson: '[]',
              methodologicalSignalsJson: '[]',
              whatWouldChangeJson: '[]',
              hallmarksJson: '[]',
              rulesetVersion: 'v1',
              createdAt: Date.UTC(2026, 0, 5),
              supersededAt: null,
            }
          : null,
      ),
    getItem: () =>
      Promise.resolve({ id: 'item-1', title: 'Metformin randomised trial', type: 'paper' }),
    listAnalysisHistory: () => Promise.resolve([]),
    intelligenceCounts: () =>
      Promise.resolve({ assessedCount: 4, staleCount: 1, openReviewTaskCount: 1 }),
    listRuns: () =>
      Promise.resolve([
        {
          id: 'run-new',
          trigger: 'manual',
          scope: 'recent',
          status: 'succeeded',
          rulesetVersion: 'm3.deterministic.1',
          requestedCount: 4,
          completedCount: 4,
          deterministicCount: 4,
          aiCount: 0,
          reviewTaskCount: 0,
          reusedCount: 0,
          startedAt: Date.UTC(2026, 0, 5),
          completedAt: Date.UTC(2026, 0, 5) + 500,
          summary: 'ok',
        },
      ]),
    getRun: (id) => Promise.resolve(id === 'run-new' ? RUN : null),
    listLiveClaims: () => Promise.resolve({ rows: [CLAIM], total: 1 }),
    listSpansForClaims: () => Promise.resolve([]),
    getLiveClaim: (id) => Promise.resolve(id === 'claim-1' ? CLAIM : null),
    listClaimRelationships: () => Promise.resolve([]),
    listRadarRows: () =>
      Promise.resolve([
        {
          contentItemId: 'item-paper',
          title: 'Metformin randomised trial',
          itemType: 'paper',
          evidenceMaturity: 'controlled_clinical_trial',
          researchActivity: 7,
          resultsPresent: true,
          stale: false,
          isCorrectionOrRetraction: false,
        },
      ]),
  };
}

/**
 * In-memory creator port.
 *
 * The video row carries no `platform_content_current` metadata, which is the case the
 * left join exists to preserve — the route must still render it.
 */
function memoryCreatorRepository(): CreatorReadRepository {
  return {
    listCreators: ({ q }) =>
      Promise.resolve(
        q && !'ada longevity'.includes(q.toLowerCase())
          ? { rows: [], total: 0 }
          : {
              rows: [
                {
                  id: 'creator-a',
                  preferredName: 'Ada Longevity',
                  creatorKind: 'individual',
                  identityConfidence: 'medium',
                  neutralDescription: 'Synthetic profile.',
                },
              ],
              total: 1,
            },
      ),
    getCreator: (id) =>
      Promise.resolve(
        id === 'creator-a'
          ? {
              id: 'creator-a',
              preferredName: 'Ada Longevity',
              creatorKind: 'individual',
              identityConfidence: 'medium',
              identityRevision: 1,
              currentProfileSnapshotId: null,
              neutralDescription: 'Synthetic profile.',
              lifecycleState: 'active',
            }
          : null,
      ),
    listClaims: () =>
      Promise.resolve([
        {
          id: 'claim-a1',
          creatorId: 'creator-a',
          claimText: 'Synthetic creator claim',
          assertionRole: 'reported_finding',
          claimKind: 'efficacy',
          direction: 'positive',
          certaintyLanguage: null,
          confidence: 'low',
          reviewStatus: 'reviewed_accepted',
          recurrenceKey: 'theme-1',
          alignmentJson: '{}',
          createdAt: Date.UTC(2026, 0, 3),
        },
      ]),
    listAccounts: () => Promise.resolve([]),
    listDisclosures: () => Promise.resolve([]),
    listDocuments: () => Promise.resolve([]),
    listYoutubeVideos: () =>
      Promise.resolve([
        {
          id: 'video-1',
          externalId: 'ext-video-1',
          title: 'Video one',
          publishedAt: Date.UTC(2026, 0, 2),
          canonicalUrl: 'https://example.invalid/video-1',
          currentThumbnailUrl: null,
          currentCaptionAvailable: null,
          currentPaidPlacementDeclared: null,
          currentDisplayEligible: null,
          currentExpiryAt: null,
        },
      ]),
    listRoles: () => Promise.resolve([]),
    listRecurrenceInputs: () => Promise.resolve([]),
    listRecurrenceSnapshots: () => Promise.resolve([]),
    listClaimEvidenceLinks: () =>
      Promise.resolve([
        {
          id: 'link-1',
          targetType: 'live_claim',
          targetId: 'live-claim-1',
          linkRole: 'supports',
          detectionMethod: 'deterministic',
          linkState: 'candidate',
          rationale: null,
          compatibilityDimensionsJson: '["direction"]',
          createdAt: Date.UTC(2026, 0, 1),
        },
      ]),
  };
}

/** In-memory intervention port. */
function memoryInterventionRepository(): InterventionReadRepository {
  return {
    listEntities: ({ typeFilter }) =>
      Promise.resolve(
        typeFilter.kind === 'peptide'
          ? { rows: [], total: 0 }
          : {
              rows: [
                {
                  id: 'ent-metformin',
                  preferredName: 'Metformin',
                  entityType: 'small_molecule',
                  identityConfidence: 'medium',
                  shortDescription: 'Synthetic profile.',
                  currentDossierSnapshotId: null,
                },
              ],
              total: 1,
            },
      ),
    listEntityResolutionTasks: () =>
      Promise.resolve([
        {
          id: 'task-new',
          mentionId: 'mention-1',
          proposedEntityId: 'ent-metformin',
          title: 'Ambiguous mention',
          reason: 'ambiguous mention',
          priority: 'medium',
          status: 'open',
          stale: false,
          createdAt: Date.UTC(2026, 0, 3),
        },
      ]),
    listTrialPortfolio: () => Promise.resolve([]),
    listEntitiesByIds: (ids) =>
      Promise.resolve(
        ids.includes('ent-metformin')
          ? [
              {
                id: 'ent-metformin',
                preferredName: 'Metformin',
                entityType: 'small_molecule',
                identityConfidence: 'medium',
                lifecycleState: 'active',
                shortDescription: 'Synthetic profile.',
                currentDossierSnapshotId: null,
              },
            ]
          : [],
      ),
    listPeptideProfiles: () => Promise.resolve([]),
    listIdentifiersForEntities: () => Promise.resolve([]),
    listCurrentAssertionsForEntities: () => Promise.resolve([]),
    listDossierSnapshots: () => Promise.resolve([]),
    listAliases: () => Promise.resolve([]),
    listIdentifierRows: () => Promise.resolve([]),
    countOpenResolutionTasksFor: () => Promise.resolve(0),
  };
}

/**
 * In-memory job port. Read-only: the hosted app exposes no job mutation, so the claim and
 * completion methods reject rather than pretending to work.
 */
function memoryJobRepository(): JobRepository {
  const reject = () => Promise.reject(new Error('hosted job mutations are not exposed'));
  const JOB = {
    id: 'job-1',
    kind: 'intelligence',
    status: 'queued',
    priority: 100,
    payloadJson: '{}',
    dedupeKey: 'dedupe-1',
    availableAt: Date.UTC(2026, 0, 1),
    claimedAt: null,
    leaseExpiresAt: null,
    attemptCount: 0,
    maxAttempts: 3,
    lastError: null,
    parentJobId: null,
    relatedRunId: null,
    createdAt: Date.UTC(2026, 0, 1),
    startedAt: null,
    completedAt: null,
  };
  return {
    getJob: (id) => Promise.resolve(id === 'job-1' ? JOB : null),
    listJobs: () => Promise.resolve([JOB]),
    recoverExpiredLeases: reject,
    listClaimCandidates: () => Promise.resolve([]),
    tryClaim: reject,
    renewLease: reject,
    completeJob: reject,
    requeue: reject,
  };
}

function bound() {
  return createSitesApp({
    createRepositories: () => ({
      assessment: memoryAssessmentRepository(),
      content: memoryContentRepository(),
      creator: memoryCreatorRepository(),
      intervention: memoryInterventionRepository(),
      job: memoryJobRepository(),
      review: memoryReviewRepository(),
    }),
  });
}

function get(path: string, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}${path}`, { headers: { host: HOST, ...headers } });
}

describe('sites entrypoint — configuration gate', () => {
  it('fails closed on a data route when hosted settings are absent', async () => {
    const res = await createSitesApp().fetch(get('/api/items'), {} as SitesBindings);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.capability).toBe('configuration');
    expect(body.problems.map((p: { setting: string }) => p.setting)).toContain(
      'HEALTHSPAN_HOSTED_OWNER_EMAIL',
    );
  });

  it('still answers readiness so the owner can see why it failed closed', async () => {
    const res = await createSitesApp().fetch(get('/api/hosted-readiness'), {} as SitesBindings);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.configured).toBe(false);
    expect(body.ready).toBe(false);
    expect(body.problems.length).toBeGreaterThan(0);
  });
});

describe('sites entrypoint — request integrity', () => {
  it('sets the shared security headers on every response', async () => {
    const res = await bound().fetch(get('/api/runtime-capabilities'), CONFIGURED);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
  });

  it('never emits a CORS allow-origin header', async () => {
    // The hosted app mounts no CORS middleware at all, so there is nothing that could
    // emit a wildcard.
    for (const path of ['/api/items', '/api/runtime-capabilities', '/api/hosted-readiness']) {
      const res = await bound().fetch(get(path, { origin: ORIGIN }), CONFIGURED);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    }
  });

  it('accepts the exact configured origin', async () => {
    const res = await bound().fetch(get('/api/items', { origin: ORIGIN }), CONFIGURED);
    expect(res.status).toBe(200);
  });

  it('rejects any other origin', async () => {
    for (const origin of ['https://evil.example.invalid', 'http://localhost:5173', 'null']) {
      const res = await bound().fetch(get('/api/items', { origin }), CONFIGURED);
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe('Origin not allowed');
    }
  });

  it('rejects a host that is not the configured one', async () => {
    const req = new Request(`${ORIGIN}/api/items`, { headers: { host: 'rebind.example.invalid' } });
    const res = await bound().fetch(req, CONFIGURED);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Host not allowed');
  });

  it('accepts a configured preview host', async () => {
    const req = new Request(`${ORIGIN}/api/items`, {
      headers: { host: 'preview.example.invalid' },
    });
    const res = await bound().fetch(req, {
      ...CONFIGURED,
      HEALTHSPAN_HOSTED_PREVIEW_HOSTS: 'preview.example.invalid',
    });
    expect(res.status).toBe(200);
  });

  it('rejects a cross-site fetch', async () => {
    const res = await bound().fetch(
      get('/api/items', { origin: ORIGIN, 'sec-fetch-site': 'cross-site' }),
      CONFIGURED,
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Fetch metadata rejected');
  });

  it('allows a read with no Origin, as a top-level navigation has none', async () => {
    const res = await bound().fetch(get('/api/items'), CONFIGURED);
    expect(res.status).toBe(200);
  });

  it('refuses every mutation, explicitly', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const req = new Request(`${ORIGIN}/api/items`, {
        method,
        headers: { host: HOST, origin: ORIGIN },
      });
      const res = await bound().fetch(req, CONFIGURED);
      expect(res.status).toBe(501);
      expect((await res.json()).capability).toBe('mutations');
    }
  });
});

describe('sites entrypoint — capabilities and readiness', () => {
  it('reports the hosted capability matrix', async () => {
    const res = await bound().fetch(get('/api/runtime-capabilities'), CONFIGURED);
    expect(await res.json()).toMatchObject({
      runtime: 'sites',
      database: 'd1',
      objectStore: 'r2',
      persistentBackgroundScheduler: false,
      externalConnectors: false,
      platformMonitoring: false,
      optionalAi: false,
      localBackupRestore: false,
      hostedRecovery: 'degraded',
      ownerIdentity: 'sites-owner',
      publicAccess: false,
    });
  });

  it('reports readiness without disclosing a secret value', async () => {
    const res = await bound().fetch(get('/api/hosted-readiness'), CONFIGURED);
    const text = await res.text();
    expect(text).not.toContain('owner@example.invalid');
    expect(text).not.toContain('a'.repeat(48));
    const body = JSON.parse(text);
    expect(body.secrets).toEqual({ ownerEmail: true, sessionSecret: true });
    expect(body.dataOrigin).toBe('synthetic');
    expect(body.allowedOrigin).toBe(ORIGIN);
  });

  it('reports content as ported but unbound when the DB binding is absent', async () => {
    // Readiness must say so rather than let the route look like an empty database.
    const res = await createSitesApp().fetch(get('/api/hosted-readiness'), {
      ...CONFIGURED,
      DB: undefined,
    });
    const body = await res.json();
    expect(body.ready).toBe(false);
    expect(body.bindings.DB).toBe(false);
    expect(body.domains).toContainEqual(
      expect.objectContaining({
        domain: 'content',
        ported: true,
        bound: false,
        reason: 'D1 binding "DB" is not provisioned',
      }),
    );
  });

  it('binds content through the real D1 factory when DB is provisioned', async () => {
    // No factory override: this exercises the default path, so a broken wiring between
    // apps/sites and @healthspan/db/sites fails here rather than only in production.
    const res = await createSitesApp().fetch(get('/api/hosted-readiness'), CONFIGURED);
    const body = await res.json();
    expect(body.domains).toContainEqual(
      expect.objectContaining({ domain: 'content', ported: true, bound: true }),
    );
    expect(body.ready).toBe(true);
  });

  it('reports ready once every ported domain is bound', async () => {
    const res = await bound().fetch(get('/api/hosted-readiness'), CONFIGURED);
    const body = await res.json();
    expect(body.ready).toBe(true);
    expect(body.domains).toContainEqual(
      expect.objectContaining({ domain: 'content', bound: true }),
    );
  });
});

describe('sites entrypoint — content through the shared port', () => {
  it('serves the same response shape as the local runtime', async () => {
    const res = await bound().fetch(get('/api/items'), CONFIGURED);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      count: 2,
      page: 1,
      pageSize: 25,
      dataMode: 'live',
      dataOrigin: 'live',
      items: [
        expect.objectContaining({
          id: 'c-alpha',
          type: 'paper',
          tags: [],
          officialUrl: 'https://example.invalid/alpha',
        }),
        // The null-summary and null-published normalisations come from the shared DTO
        // mapper, so the hosted response cannot drift from the local one.
        expect.objectContaining({ id: 'c-bravo', summary: '', publishedAt: null }),
      ],
    });
  });

  it('passes query parameters through the shared coercion', async () => {
    const res = await bound().fetch(get('/api/items?type=trial&pageSize=9999'), CONFIGURED);
    const body = await res.json();
    expect(body.count).toBe(1);
    expect(body.items[0].id).toBe('c-bravo');
    // Clamped by the shared paging bounds, not by anything this app decides.
    expect(body.pageSize).toBe(100);
  });

  it('refuses rather than returning an empty page when no adapter is bound', async () => {
    const res = await createSitesApp().fetch(get('/api/items'), { ...CONFIGURED, DB: undefined });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.capability).toBe('content');
    expect(body.reason).toContain('"DB" is not provisioned');
    expect(body.items).toBeUndefined();
  });
});

describe('sites entrypoint — review through the shared port', () => {
  it('serves review tasks in the local response shape', async () => {
    const res = await bound().fetch(get('/api/review/tasks'), CONFIGURED);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dataMode).toBe('live');
    expect(body.tasks).toHaveLength(2);
    expect(body.tasks[0]).toMatchObject({
      id: 'task-open',
      status: 'open',
      createdAt: '2026-01-03T00:00:00.000Z',
    });
  });

  it('applies the status filter through the shared service', async () => {
    const res = await bound().fetch(get('/api/review/tasks?status=open'), CONFIGURED);
    const body = await res.json();
    expect(body.tasks.map((t: { id: string }) => t.id)).toEqual(['task-open']);
  });

  it('serves review decisions', async () => {
    const res = await bound().fetch(get('/api/review/decisions'), CONFIGURED);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ dataMode: 'live', decisions: [] });
  });

  it('refuses the resolve mutation rather than exposing an unauthenticated write', async () => {
    // The resolve path is ported and its contract passes against D1, but no hosted
    // session or owner principal exists yet. This must stay a refusal until it does.
    const req = new Request(`${ORIGIN}/api/review/tasks/task-open/resolve`, {
      method: 'POST',
      headers: { host: HOST, origin: ORIGIN },
    });
    const res = await bound().fetch(req, CONFIGURED);
    expect(res.status).toBe(501);
    expect((await res.json()).capability).toBe('mutations');
  });

  it('refuses rather than returning an empty list when unbound', async () => {
    const res = await createSitesApp().fetch(get('/api/review/tasks'), {
      ...CONFIGURED,
      DB: undefined,
    });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.capability).toBe('review');
    expect(body.tasks).toBeUndefined();
  });
});

describe('sites entrypoint — assessments through the shared port', () => {
  it('serves the assessments list in the local response shape', async () => {
    const res = await bound().fetch(get('/api/assessments'), CONFIGURED);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      dataMode: 'live',
      page: 1,
      pageSize: 25,
      total: 1,
      totalPages: 1,
      items: [expect.objectContaining({ analysisId: 'analysis-1', retractionOrCorrection: false })],
    });
  });

  it('passes filters through to the port', async () => {
    const res = await bound().fetch(
      get('/api/assessments?evidenceMaturity=preclinical'),
      CONFIGURED,
    );
    expect((await res.json()).total).toBe(0);
  });

  it('serves an assessment detail and 404s an unknown one', async () => {
    const found = await bound().fetch(get('/api/assessments/analysis-1'), CONFIGURED);
    expect(found.status).toBe(200);
    expect((await found.json()).analysis.id).toBe('analysis-1');

    const missing = await bound().fetch(get('/api/assessments/nope'), CONFIGURED);
    expect(missing.status).toBe(404);
  });

  it('refuses rather than returning an empty list when unbound', async () => {
    const res = await createSitesApp().fetch(get('/api/assessments'), {
      ...CONFIGURED,
      DB: undefined,
    });
    expect(res.status).toBe(503);
    expect((await res.json()).capability).toBe('assessment');
  });
});

describe('sites entrypoint — creators through the shared port', () => {
  it('serves the creator list without bootstrapping the catalog', async () => {
    // The local runtime seeds its curated catalog from its own route. A hosted read may
    // not write, and hosted data is synthetic-fixture-only.
    const res = await bound().fetch(get('/api/creators'), CONFIGURED);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dataMode).toBe('live');
    expect(body.items.map((c: { id: string }) => c.id)).toEqual(['creator-a']);
    expect(body.total).toBe(1);
  });

  it('passes the search term to the port', async () => {
    const res = await bound().fetch(get('/api/creators?q=zzzz'), CONFIGURED);
    expect((await res.json()).items).toEqual([]);
  });

  it('serves a creator detail, and 404s an unknown one', async () => {
    const found = await bound().fetch(get('/api/creators/creator-a'), CONFIGURED);
    expect(found.status).toBe(200);
    const detail = await found.json();
    expect(detail).toMatchObject({ type: 'creator', preferredName: 'Ada Longevity' });
    expect(detail.prohibitedScores).toContain('influence_score');

    const missing = await bound().fetch(get('/api/creators/nope'), CONFIGURED);
    expect(missing.status).toBe(404);
  });

  it('renders a video whose platform metadata row is absent', async () => {
    // The left join's reason for existing: an inner join would drop this video.
    const res = await bound().fetch(get('/api/creators/creator-a'), CONFIGURED);
    const [video] = (await res.json()).youtubeVideos;
    expect(video).toMatchObject({
      id: 'video-1',
      thumbnailUrl: null,
      displayEligible: false,
      metadataOnly: true,
      claimEvidence: false,
    });
  });

  it('serves creator claims and recurrence snapshots', async () => {
    const claims = await bound().fetch(get('/api/creator-claims'), CONFIGURED);
    expect((await claims.json()).claims[0].id).toBe('claim-a1');
    const recurrence = await bound().fetch(get('/api/claim-recurrence'), CONFIGURED);
    expect(await recurrence.json()).toMatchObject({ dataMode: 'live', snapshots: [] });
  });

  it('refuses rather than returning an empty list when unbound', async () => {
    const res = await createSitesApp().fetch(get('/api/creators'), {
      ...CONFIGURED,
      DB: undefined,
    });
    expect(res.status).toBe(503);
    expect((await res.json()).capability).toBe('creator');
  });
});

describe('sites entrypoint — interventions through the shared port', () => {
  it('serves interventions and peptides from one port', async () => {
    const interventions = await bound().fetch(get('/api/interventions'), CONFIGURED);
    expect((await interventions.json()).items[0].id).toBe('ent-metformin');
    // 'peptide' and 'intervention' are not two values of one column.
    const peptides = await bound().fetch(get('/api/peptides'), CONFIGURED);
    expect((await peptides.json()).total).toBe(0);
  });

  it('serves entity resolution tasks', async () => {
    const res = await bound().fetch(get('/api/entity-resolution/tasks'), CONFIGURED);
    expect((await res.json()).tasks[0]).toMatchObject({ id: 'task-new', status: 'open' });
  });

  it('serves a dossier from the stored snapshot, never building one', async () => {
    // Ledger 00a712. The fake has no stored snapshot, so the response must say so
    // rather than look like a built dossier that happens to be empty.
    const res = await bound().fetch(get('/api/interventions/ent-metformin/dossier'), CONFIGURED);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ snapshotId: null, snapshotOrigin: 'none', reused: false });
    expect(body.entity.id).toBe('ent-metformin');

    const missing = await bound().fetch(get('/api/interventions/nope/dossier'), CONFIGURED);
    expect(missing.status).toBe(404);
  });

  it('refuses rather than returning an empty list when unbound', async () => {
    const res = await createSitesApp().fetch(get('/api/interventions'), {
      ...CONFIGURED,
      DB: undefined,
    });
    expect(res.status).toBe(503);
    expect((await res.json()).capability).toBe('intervention');
  });
});

describe('sites entrypoint — jobs', () => {
  it('serves the job list and a single job', async () => {
    const list = await bound().fetch(get('/api/jobs'), CONFIGURED);
    expect((await list.json()).jobs[0]).toMatchObject({ id: 'job-1', status: 'queued' });
    const one = await bound().fetch(get('/api/jobs/job-1'), CONFIGURED);
    expect((await one.json()).job.id).toBe('job-1');
    const missing = await bound().fetch(get('/api/jobs/nope'), CONFIGURED);
    expect(missing.status).toBe(404);
  });

  it('refuses rather than returning an empty list when unbound', async () => {
    const res = await createSitesApp().fetch(get('/api/jobs'), { ...CONFIGURED, DB: undefined });
    expect(res.status).toBe(503);
    expect((await res.json()).capability).toBe('job');
  });
});

describe('sites entrypoint — creator review surface', () => {
  it('serves creator alignment review tasks', async () => {
    const res = await bound().fetch(get('/api/creator-review/tasks'), CONFIGURED);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tasks[0]).toMatchObject({
      id: 'finding-1',
      kind: 'creator_alignment_finding',
      title: 'Creator claim under review',
      creatorId: 'creator-a',
      status: 'open',
    });
  });

  it('serves identity tasks', async () => {
    const res = await bound().fetch(get('/api/creator-identity/tasks'), CONFIGURED);
    expect((await res.json()).tasks[0]).toMatchObject({ id: 'identity-1', priority: 9 });
  });

  it('serves claim evidence links with parsed dimensions', async () => {
    const res = await bound().fetch(get('/api/creator-claims/claim-1/evidence'), CONFIGURED);
    expect((await res.json()).links[0]).toMatchObject({
      id: 'link-1',
      compatibilityDimensions: ['direction'],
    });
  });
});

describe('sites entrypoint — honesty about what is not here', () => {
  it.each([
    ['/api/backup/create', 'localBackupRestore'],
    ['/api/ingest/run', 'externalConnectors'],
    ['/api/x/compliance', 'platformMonitoring'],
    ['/api/scheduler/status', 'persistentBackgroundScheduler'],
  ])('answers %s with an explicit not-applicable', async (path, capability) => {
    const res = await bound().fetch(get(path), CONFIGURED);
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.capability).toBe(capability);
    expect(body.reason.length).toBeGreaterThan(0);
  });

  it('answers an unported route as unported rather than missing', async () => {
    const res = await bound().fetch(get('/api/watchlists'), CONFIGURED);
    expect(res.status).toBe(501);
    expect((await res.json()).capability).toBe('unported');
  });
});
