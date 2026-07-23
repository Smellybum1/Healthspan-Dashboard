import {
  applyXComplianceActionsLocally,
  createXClient,
  createXConnector,
  estimateXTimelineJobMicros,
  gateXBudget,
  X_PRICE_TABLE_VERSION,
} from './x.js';
import { describe, expect, it } from 'vitest';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function xFixtureTransport(): (input: string | URL) => Promise<Response> {
  return async (input) => {
    const url = String(input);
    if (url.includes('/users/by/username/')) {
      return jsonResponse({
        data: { id: '12345', username: 'fixture', name: 'Fixture User', protected: false },
      });
    }
    if (url.includes('/users/12345/tweets')) {
      return jsonResponse({
        data: [
          {
            id: 'post1',
            text: 'Metformin reduces glucose in humans.',
            created_at: new Date().toISOString(),
            conversation_id: 'post1',
          },
          {
            id: 'post2',
            text: 'RT something',
            created_at: new Date().toISOString(),
            referenced_tweets: [{ type: 'retweeted', id: 'other' }],
          },
          {
            id: 'post3',
            text: 'reply text',
            created_at: new Date().toISOString(),
            referenced_tweets: [{ type: 'replied_to', id: 'other' }],
          },
        ],
        meta: {},
      });
    }
    return jsonResponse({ error: 'unexpected', url }, 404);
  };
}

describe('X connector depth', () => {
  it('stays disabled by default without budget acknowledgement', async () => {
    const result = await createXConnector({}).fetchWindow({
      cursor: {},
      lookbackDays: 7,
      recordCap: 5,
    });
    expect(result.ok).toBe(true);
    expect(result.pages).toHaveLength(0);
    expect(result.warnings?.[0]).toMatch(/disabled by default/i);
  });

  it('blocks jobs that would exceed remaining budget', () => {
    const estimated = estimateXTimelineJobMicros({ includeUserLookup: true, maxPosts: 200 });
    const gate = gateXBudget({
      enabled: true,
      acknowledged: true,
      capMicros: 1_000,
      spentMicros: 0,
      estimatedMicros: estimated,
    });
    expect(gate.allowed).toBe(false);
    if (!gate.allowed) expect(gate.reason).toBe('budget_blocked');
  });

  it('resolves username and fetches timeline excluding reposts/replies by default', async () => {
    const client = createXClient({
      bearerToken: 'test',
      transport: xFixtureTransport(),
      minIntervalMs: 0,
    });
    expect(client).not.toBeNull();
    const user = await client!.resolveUsername('fixture');
    expect(user.user?.userId).toBe('12345');
    const timeline = await client!.fetchUserTimeline({ userId: '12345', maxPosts: 50 });
    expect(timeline.posts).toHaveLength(1);
    expect(timeline.posts[0]?.postId).toBe('post1');
    expect(timeline.posts[0]?.externalAiAllowed).toBe(false);
    expect(timeline.posts[0]?.claimEvidence).toBe(false);
  });

  it('enabled connector returns posts without raw snapshot bodies', async () => {
    const prevEnabled = process.env.HEALTHSPAN_X_ENABLED;
    const prevAck = process.env.HEALTHSPAN_X_BUDGET_ACKNOWLEDGED;
    const prevCap = process.env.HEALTHSPAN_X_BUDGET_CAP_MICROS;
    process.env.HEALTHSPAN_X_ENABLED = 'true';
    process.env.HEALTHSPAN_X_BUDGET_ACKNOWLEDGED = 'true';
    process.env.HEALTHSPAN_X_BUDGET_CAP_MICROS = String(10_000_000);
    try {
      const result = await createXConnector({
        bearerToken: 'test',
        usernames: ['fixture'],
        budgetAcknowledged: true,
        capMicros: 10_000_000,
        spentMicros: 0,
        transport: xFixtureTransport(),
      }).fetchWindow({ cursor: {}, lookbackDays: 90, recordCap: 50 });
      expect(result.ok).toBe(true);
      expect(result.rawBodies).toHaveLength(0);
      expect(result.pages.some((p) => p.normalized.type === 'x_post_metadata')).toBe(true);
      expect(result.warnings?.some((w) => /external_ai_allowed_for_x=false/.test(w))).toBe(true);
      expect(result.pages[0]?.normalized.priceTableVersion).toBe(X_PRICE_TABLE_VERSION);
    } finally {
      process.env.HEALTHSPAN_X_ENABLED = prevEnabled;
      process.env.HEALTHSPAN_X_BUDGET_ACKNOWLEDGED = prevAck;
      process.env.HEALTHSPAN_X_BUDGET_CAP_MICROS = prevCap;
    }
  });

  it('compliance helper purges deleted/withheld posts locally', () => {
    const { remaining, purged } = applyXComplianceActionsLocally(
      [
        {
          postId: 'a',
          userId: '1',
          text: 'keep',
          createdAt: null,
          editedAt: null,
          conversationId: null,
          isReply: false,
          isRepost: false,
          withheld: false,
          claimEvidence: false,
          externalAiAllowed: false,
          note: '',
        },
        {
          postId: 'b',
          userId: '1',
          text: 'drop',
          createdAt: null,
          editedAt: null,
          conversationId: null,
          isReply: false,
          isRepost: false,
          withheld: false,
          claimEvidence: false,
          externalAiAllowed: false,
          note: '',
        },
      ],
      [{ postId: 'b', action: 'delete', reason: 'deleted' }],
    );
    expect(purged).toEqual(['b']);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.postId).toBe('a');
  });
});
