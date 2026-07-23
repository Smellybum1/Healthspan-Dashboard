import { createHash } from 'node:crypto';
import { createHttpClient } from './http.js';
import type { ConnectorFetchResult, ConnectorPage, FetchTransport, SourceConnector } from './types.js';

/** Local fence — X content must never be routed to external AI from this connector. */
function assertNoExternalAiForX(): void {
  if (process.env.HEALTHSPAN_X_EXTERNAL_AI_ALLOWED === 'true') {
    throw new Error('Policy violation: X content must not be sent to external AI providers.');
  }
}

function isExternalAiAllowedForX(): false {
  return false;
}

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export const X_PRICE_TABLE_VERSION = '2026-07-24.x.v2';
/** Conservative default estimate per user lookup (micros of USD). Operator price table overrides later. */
export const X_DEFAULT_USER_LOOKUP_MICROS = 5_000;
export const X_DEFAULT_POST_READ_MICROS = 2_000;
export const X_MAX_POSTS_PER_ACCOUNT = 200;
export const X_DEFAULT_LOOKBACK_DAYS = 90;
export const X_REFRESH_WITHIN_DAYS = 25;
export const X_DISPLAY_MAX_AGE_DAYS = 30;

export type XBudgetGate =
  | { allowed: true; estimatedMicros: number; remainingMicros: number }
  | { allowed: false; reason: 'budget_blocked' | 'not_configured' | 'disabled'; estimatedMicros: number; remainingMicros: number };

export type XUserResolved = {
  userId: string;
  username: string;
  name: string | null;
  protected: boolean;
  canonicalUrl: string;
};

export type XPostMetadata = {
  postId: string;
  userId: string;
  text: string;
  createdAt: string | null;
  editedAt: string | null;
  conversationId: string | null;
  isReply: boolean;
  isRepost: boolean;
  withheld: boolean;
  claimEvidence: false;
  externalAiAllowed: false;
  note: string;
};

export type XComplianceAction = {
  postId: string;
  action: 'delete' | 'withhold' | 'edit' | 'account_unavailable';
  reason: string;
};

export type XSyncResult = {
  ok: boolean;
  status:
    | 'healthy'
    | 'disabled'
    | 'not_configured'
    | 'budget_blocked'
    | 'permission_error'
    | 'failed';
  user: XUserResolved | null;
  posts: XPostMetadata[];
  estimatedCostMicros: number;
  warnings: string[];
  errorMessage?: string;
  baseline: boolean;
};

export function estimateXTimelineJobMicros(opts: {
  includeUserLookup: boolean;
  maxPosts: number;
}): number {
  return (
    (opts.includeUserLookup ? X_DEFAULT_USER_LOOKUP_MICROS : 0) +
    opts.maxPosts * X_DEFAULT_POST_READ_MICROS
  );
}

export function gateXBudget(opts: {
  enabled: boolean;
  acknowledged: boolean;
  capMicros: number;
  spentMicros: number;
  estimatedMicros: number;
}): XBudgetGate {
  if (!opts.enabled) {
    return {
      allowed: false,
      reason: 'disabled',
      estimatedMicros: opts.estimatedMicros,
      remainingMicros: Math.max(0, opts.capMicros - opts.spentMicros),
    };
  }
  if (!opts.acknowledged || opts.capMicros <= 0) {
    return {
      allowed: false,
      reason: 'not_configured',
      estimatedMicros: opts.estimatedMicros,
      remainingMicros: Math.max(0, opts.capMicros - opts.spentMicros),
    };
  }
  const remaining = Math.max(0, opts.capMicros - opts.spentMicros);
  if (opts.estimatedMicros > remaining) {
    return {
      allowed: false,
      reason: 'budget_blocked',
      estimatedMicros: opts.estimatedMicros,
      remainingMicros: remaining,
    };
  }
  return { allowed: true, estimatedMicros: opts.estimatedMicros, remainingMicros: remaining };
}

export type XClient = {
  resolveUsername: (username: string) => Promise<{ user: XUserResolved | null; error?: string }>;
  fetchUserTimeline: (opts: {
    userId: string;
    lookbackDays?: number;
    maxPosts?: number;
    includeReplies?: boolean;
    includeReposts?: boolean;
    sinceId?: string;
  }) => Promise<{ posts: XPostMetadata[]; error?: string }>;
};

export function createXClient(opts: {
  transport?: FetchTransport;
  bearerToken?: string | null;
  minIntervalMs?: number;
}): XClient | null {
  const token = opts.bearerToken ?? process.env.X_BEARER_TOKEN ?? null;
  if (!token) return null;
  // Hard policy: constructing an X client never enables external AI for X content.
  assertNoExternalAiForX();
  if (isExternalAiAllowedForX()) {
    throw new Error('Invariant broken: external AI must never be allowed for X');
  }
  const client = createHttpClient({
    transport: opts.transport,
    userAgent: 'HealthspanDashboard/0.2 (x-optional; local@invalid)',
    minIntervalMs: opts.minIntervalMs ?? 500,
  });

  async function authGet(url: string): Promise<Record<string, unknown>> {
    const res = await client.request(url, {
      headers: { authorization: `Bearer ${token}` },
    });
    return (await res.json()) as Record<string, unknown>;
  }

  return {
    async resolveUsername(username: string) {
      const handle = username.replace(/^@/, '').trim();
      if (!handle) return { user: null, error: 'username required' };
      try {
        const json = await authGet(
          `https://api.x.com/2/users/by/username/${encodeURIComponent(handle)}?user.fields=protected,name`,
        );
        const data = json.data as Record<string, unknown> | undefined;
        if (!data?.id) return { user: null, error: 'user_not_found' };
        return {
          user: {
            userId: String(data.id),
            username: String(data.username ?? handle),
            name: data.name ? String(data.name) : null,
            protected: Boolean(data.protected),
            canonicalUrl: `https://x.com/${String(data.username ?? handle)}`,
          },
        };
      } catch (err) {
        return { user: null, error: err instanceof Error ? err.message : 'user lookup failed' };
      }
    },

    async fetchUserTimeline(timelineOpts) {
      const maxPosts = Math.min(timelineOpts.maxPosts ?? X_MAX_POSTS_PER_ACCOUNT, X_MAX_POSTS_PER_ACCOUNT);
      const lookbackDays = timelineOpts.lookbackDays ?? X_DEFAULT_LOOKBACK_DAYS;
      const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
      const posts: XPostMetadata[] = [];
      let nextToken: string | undefined;
      try {
        while (posts.length < maxPosts) {
          const params = new URLSearchParams({
            max_results: '100',
            'tweet.fields': 'created_at,conversation_id,referenced_tweets,edit_history_tweet_ids,withheld',
            exclude: [
              timelineOpts.includeReplies ? '' : 'replies',
              timelineOpts.includeReposts ? '' : 'retweets',
            ]
              .filter(Boolean)
              .join(','),
          });
          if (timelineOpts.sinceId) params.set('since_id', timelineOpts.sinceId);
          if (nextToken) params.set('pagination_token', nextToken);
          const json = await authGet(
            `https://api.x.com/2/users/${encodeURIComponent(timelineOpts.userId)}/tweets?${params}`,
          );
          const items = (json.data as Array<Record<string, unknown>> | undefined) ?? [];
          for (const item of items) {
            const createdAt = item.created_at ? String(item.created_at) : null;
            const createdMs = createdAt ? Date.parse(createdAt) : NaN;
            if (Number.isFinite(createdMs) && createdMs < cutoff) {
              nextToken = undefined;
              break;
            }
            const refs = (item.referenced_tweets as Array<{ type?: string }> | undefined) ?? [];
            const isReply = refs.some((r) => r.type === 'replied_to');
            const isRepost = refs.some((r) => r.type === 'retweeted');
            if (!timelineOpts.includeReplies && isReply) continue;
            if (!timelineOpts.includeReposts && isRepost) continue;
            const text = String(item.text ?? '');
            assertNoExternalAiForX();
            posts.push({
              postId: String(item.id ?? ''),
              userId: timelineOpts.userId,
              text,
              createdAt,
              editedAt: Array.isArray(item.edit_history_tweet_ids) ? createdAt : null,
              conversationId: item.conversation_id ? String(item.conversation_id) : null,
              isReply,
              isRepost,
              withheld: Boolean(item.withheld),
              claimEvidence: false,
              externalAiAllowed: false,
              note: 'X post text may support claim extraction only under local policy; never sent to external AI.',
            });
            if (posts.length >= maxPosts) break;
          }
          const meta = json.meta as { next_token?: string } | undefined;
          nextToken = meta?.next_token;
          if (!nextToken || items.length === 0) break;
        }
        return { posts };
      } catch (err) {
        return { posts, error: err instanceof Error ? err.message : 'timeline fetch failed' };
      }
    },
  };
}

/**
 * Optional X API connector — disabled by default, budget-capped, no external AI.
 * Compliance deletion/withholding must be honored when enabled.
 */
export function createXConnector(
  opts: {
    transport?: FetchTransport;
    bearerToken?: string | null;
    monitoredUserIds?: string[];
    budgetAcknowledged?: boolean;
    capMicros?: number;
    spentMicros?: number;
    usernames?: string[];
  } = {},
): SourceConnector {
  const token = opts.bearerToken ?? process.env.X_BEARER_TOKEN ?? null;
  const enabledEnv = process.env.HEALTHSPAN_X_ENABLED === 'true';
  const acknowledged =
    opts.budgetAcknowledged === true || process.env.HEALTHSPAN_X_BUDGET_ACKNOWLEDGED === 'true';
  const cap = opts.capMicros ?? Number(process.env.HEALTHSPAN_X_BUDGET_CAP_MICROS ?? 0);
  const spent = opts.spentMicros ?? 0;
  const monitored = opts.monitoredUserIds ?? [];
  const usernames = opts.usernames ?? [];
  const enabled =
    enabledEnv && Boolean(token) && acknowledged && cap > 0 && spent < cap && (monitored.length > 0 || usernames.length > 0);
  const client = createXClient({ transport: opts.transport, bearerToken: token });

  return {
    id: 'x',
    name: 'X API (optional)',
    enabled,
    async fetchWindow({ recordCap, lookbackDays }): Promise<ConnectorFetchResult> {
      const fetchedAt = new Date().toISOString();
      if (!enabledEnv || !token) {
        return {
          connectorId: 'x',
          fetchedAt,
          ok: true,
          pages: [],
          rawBodies: [],
          warnings: [
            'X connector is optional and disabled by default. Requires HEALTHSPAN_X_ENABLED, token, budget acknowledgement, positive cap, and monitored accounts. No automatic recharge. X content is never sent to external AI.',
          ],
        };
      }
      const estimated = estimateXTimelineJobMicros({
        includeUserLookup: usernames.length > 0,
        maxPosts: Math.min(recordCap || X_MAX_POSTS_PER_ACCOUNT, X_MAX_POSTS_PER_ACCOUNT),
      });
      const gate = gateXBudget({
        enabled: enabledEnv,
        acknowledged,
        capMicros: cap,
        spentMicros: spent,
        estimatedMicros: estimated,
      });
      if (!gate.allowed) {
        return {
          connectorId: 'x',
          fetchedAt,
          ok: true,
          pages: [],
          rawBodies: [],
          warnings: [
            `${gate.reason}: estimated ${gate.estimatedMicros} micros exceeds remaining ${gate.remainingMicros} (cap ${cap}). Automatic recharge unsupported.`,
          ],
        };
      }
      if (!client) {
        return {
          connectorId: 'x',
          fetchedAt,
          ok: true,
          pages: [],
          rawBodies: [],
          warnings: ['X client not_configured'],
        };
      }

      const pages: ConnectorPage[] = [];
      const warnings: string[] = [];
      const userIds = [...monitored];
      for (const username of usernames) {
        const resolved = await client.resolveUsername(username);
        if (resolved.user) userIds.push(resolved.user.userId);
        else warnings.push(resolved.error ?? `resolve failed for ${username}`);
      }
      for (const userId of [...new Set(userIds)]) {
        const timeline = await client.fetchUserTimeline({
          userId,
          lookbackDays: lookbackDays || X_DEFAULT_LOOKBACK_DAYS,
          maxPosts: Math.min(recordCap || X_MAX_POSTS_PER_ACCOUNT, X_MAX_POSTS_PER_ACCOUNT),
        });
        if (timeline.error) warnings.push(timeline.error);
        for (const post of timeline.posts) {
          const normalized = {
            type: 'x_post_metadata',
            platform: 'x',
            ...post,
            priceTableVersion: X_PRICE_TABLE_VERSION,
          };
          pages.push({
            externalId: post.postId,
            canonicalUrl: `https://x.com/i/web/status/${post.postId}`,
            sourceCreatedAt: post.createdAt,
            payload: post,
            normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
          });
        }
      }

      return {
        connectorId: 'x',
        fetchedAt,
        ok: true,
        pages,
        rawBodies: [],
        warnings: [
          ...warnings,
          'X responses are not stored in permanent RawSnapshotStore; current text only with compliance purge.',
          `external_ai_allowed_for_x=${isExternalAiAllowedForX()}`,
        ],
      };
    },
  };
}

export function applyXComplianceActionsLocally(posts: XPostMetadata[], actions: XComplianceAction[]) {
  const byId = new Map(posts.map((p) => [p.postId, { ...p }]));
  const purged: string[] = [];
  for (const action of actions) {
    if (action.action === 'delete' || action.action === 'withhold' || action.action === 'account_unavailable') {
      byId.delete(action.postId);
      purged.push(action.postId);
    }
  }
  return { remaining: [...byId.values()], purged };
}
