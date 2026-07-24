import { z } from 'zod';

export const LOCAL_OWNER_PROFILE_ID = 'local-owner';

const BoundedStringList = (max: number, itemMax = 120) =>
  z.array(z.string().max(itemMax)).max(max).optional();

/** Structured Saved Search schema (Remediation IV §5). v1 payloads migrate via migrateSavedSearchQuery. */
export const SavedSearchQuerySchemaV2 = z.object({
  searchSchemaVersion: z.literal(2).default(2),
  schemaVersion: z.literal(2).optional(),
  entityTypes: BoundedStringList(20),
  textQuery: z.string().max(400).optional(),
  text: z.string().max(400).optional(), // legacy alias
  filters: z
    .object({
      source: BoundedStringList(20),
      contentType: BoundedStringList(20),
      studyDesign: BoundedStringList(20),
      evidenceMaturity: BoundedStringList(20),
      evidenceAvailability: BoundedStringList(20),
      organism: BoundedStringList(20),
      population: BoundedStringList(20),
      outcomeFamily: BoundedStringList(20),
      translationGap: BoundedStringList(20),
      trialStatus: BoundedStringList(20),
      regulatoryStanding: BoundedStringList(20),
      safetyItemPresent: z.boolean().optional(),
      intervention: BoundedStringList(40),
      peptide: BoundedStringList(40),
      creator: BoundedStringList(40),
      creatorClaimFinding: BoundedStringList(40),
      topics: BoundedStringList(40),
      jurisdictions: z
        .array(z.enum(['AU', 'US']))
        .max(2)
        .optional(),
    })
    .optional(),
  dateRange: z
    .object({
      from: z.string().datetime().optional().or(z.string().max(40).optional()),
      to: z.string().datetime().optional().or(z.string().max(40).optional()),
    })
    .optional(),
  sort: z.enum(['newest', 'oldest', 'importance']).default('newest').optional(),
  includeRetracted: z.boolean().default(false).optional(),
  includeUnavailable: z.boolean().default(false).optional(),
  dataMode: z.enum(['live', 'demo']).default('live').optional(),
  // legacy fields accepted then normalised
  targetTypes: BoundedStringList(20),
  topics: BoundedStringList(40),
  sources: BoundedStringList(20),
  jurisdictions: z
    .array(z.enum(['AU', 'US']))
    .max(2)
    .optional(),
});

export const SavedSearchQuerySchemaV1 = z.object({
  schemaVersion: z.literal(1),
  text: z.string().max(400).optional(),
  targetTypes: BoundedStringList(20),
  topics: BoundedStringList(40),
  sources: BoundedStringList(20),
  jurisdictions: z
    .array(z.enum(['AU', 'US']))
    .max(2)
    .optional(),
});

export const SavedSearchQuerySchema = z.union([SavedSearchQuerySchemaV2, SavedSearchQuerySchemaV1]);
export type SavedSearchQuery = z.infer<typeof SavedSearchQuerySchemaV2>;

export function migrateSavedSearchQuery(raw: unknown): {
  query: SavedSearchQuery;
  needsUpdate: boolean;
} {
  const asObj = (raw ?? {}) as Record<string, unknown>;
  const version = asObj.searchSchemaVersion ?? asObj.schemaVersion ?? 1;
  if (version === 1) {
    const v1 = SavedSearchQuerySchemaV1.parse(raw);
    return {
      needsUpdate: true,
      query: {
        searchSchemaVersion: 2,
        textQuery: v1.text,
        entityTypes: v1.targetTypes,
        filters: {
          topics: v1.topics,
          source: v1.sources,
          jurisdictions: v1.jurisdictions,
        },
        sort: 'newest',
        includeRetracted: false,
        includeUnavailable: false,
        dataMode: 'live',
      },
    };
  }
  const parsed = SavedSearchQuerySchemaV2.parse(raw);
  const query: SavedSearchQuery = {
    ...parsed,
    searchSchemaVersion: 2,
    textQuery: parsed.textQuery ?? parsed.text,
    entityTypes: parsed.entityTypes ?? parsed.targetTypes,
    filters: {
      ...(parsed.filters ?? {}),
      topics: parsed.filters?.topics ?? parsed.topics,
      source: parsed.filters?.source ?? parsed.sources,
      jurisdictions: parsed.filters?.jurisdictions ?? parsed.jurisdictions,
    },
  };
  return { query, needsUpdate: false };
}

/** Stable canonical hash without depending on Node crypto at import time. */
export function canonicalSearchHash(
  query: SavedSearchQuery | { schemaVersion?: number; text?: string; [k: string]: unknown },
): string {
  const normalised = migrateSavedSearchQuery(query).query;
  const s = JSON.stringify({
    searchSchemaVersion: 2,
    entityTypes: normalised.entityTypes ?? [],
    textQuery: normalised.textQuery ?? '',
    filters: normalised.filters ?? {},
    dateRange: normalised.dateRange ?? {},
    sort: normalised.sort ?? 'newest',
    includeRetracted: normalised.includeRetracted ?? false,
    includeUnavailable: normalised.includeUnavailable ?? false,
    dataMode: normalised.dataMode ?? 'live',
  });
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv1a_${(h >>> 0).toString(16).padStart(8, '0')}`;
}

export const AlertRuleTargetTypeSchema = z.enum([
  'watchlist',
  'watchable',
  'saved_search',
  'topic',
  'source',
  'event_type',
  'all_official_safety',
  'database_integrity',
]);

export const AlertRuleSchema = z.object({
  name: z.string().min(1).max(120),
  enabled: z.boolean().default(true),
  targetType: AlertRuleTargetTypeSchema,
  targetRef: z.string().max(200).nullable().optional(),
  eventKinds: z.array(z.string().max(80)).max(40).default([]),
  family: z.enum(['operational', 'research']).default('research'),
  priorityFloor: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  severity: z.record(z.string(), z.unknown()).default({}),
});
export type AlertRuleInput = z.infer<typeof AlertRuleSchema>;

export const ReadingStateSchema = z.enum(['unread', 'opened', 'read', 'dismissed']);
export const PersonalSurfaceStateSchema = z.enum(['default', 'archived', 'dismissed']);

export const MuteScopeTypeSchema = z.enum(['object', 'topic', 'source', 'event_type', 'watchable']);

export function slugifyWatchlistName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64) || 'watchlist'
  );
}

export function buildAlertDedupeKey(parts: {
  kind: string;
  watchableId?: string | null;
  eventRef?: string | null;
}): string {
  return [parts.kind, parts.watchableId ?? '', parts.eventRef ?? ''].join(':');
}

export function selectBriefItems<
  T extends { id: string; importance?: string; occurredAt?: number },
>(items: T[], max: number): T[] {
  return [...items]
    .sort((a, b) => {
      const ia = a.importance === 'high' ? 0 : a.importance === 'low' ? 2 : 1;
      const ib = b.importance === 'high' ? 0 : b.importance === 'low' ? 2 : 1;
      if (ia !== ib) return ia - ib;
      return (b.occurredAt ?? 0) - (a.occurredAt ?? 0);
    })
    .slice(0, max);
}

export function sinceLastVisitWindow(lastVisitAt: number | null, now = Date.now()) {
  const start = lastVisitAt && lastVisitAt > 0 ? lastVisitAt : now - 7 * 86400000;
  return { start, end: now };
}

export const LegacyPreferencesImportSchema = z.object({
  theme: z.enum(['dark', 'light']).optional(),
  followedIds: z.array(z.string()).optional(),
  followedIdsByMode: z
    .object({
      demo: z.array(z.string()).optional(),
      live: z.array(z.string()).optional(),
    })
    .optional(),
  topics: z.array(z.string()).optional(),
  lastVisitAt: z.string().nullable().optional(),
});

export const KNOWN_LEGACY_PREFERENCE_KEYS = [
  'healthspan.preferences',
  'healthspan.prefs',
  'healthspan.followed',
  'healthspan.followedIds',
  'healthspan.theme',
  'healthspan.browserNotifications',
] as const;

export function previewLegacyPreferenceImport(raw: unknown) {
  const parsed = LegacyPreferencesImportSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: 'Invalid legacy preferences payload' };
  }
  const liveIds = parsed.data.followedIdsByMode?.live ?? [];
  const demoIds = parsed.data.followedIdsByMode?.demo ?? parsed.data.followedIds ?? [];
  return {
    ok: true as const,
    liveIds,
    demoIds,
    topics: parsed.data.topics ?? [],
    unresolvedDemoBlocked: demoIds.length,
    importable: liveIds.length,
  };
}

export const PERSONALISATION_EVAL_CASES = [
  { id: 'wl-default', kind: 'watchlist', expect: 'default_following' },
  { id: 'search-hash', kind: 'saved_search', expect: 'stable_hash' },
  { id: 'alert-dedupe', kind: 'alert', expect: 'dedupe_key' },
  { id: 'brief-cap', kind: 'brief', expect: 'max_items' },
  { id: 'visit-window', kind: 'visit', expect: 'since_last_visit' },
  { id: 'legacy-preview', kind: 'migration', expect: 'no_demo_into_live' },
  { id: 'search-v2', kind: 'saved_search', expect: 'structured_filters' },
  { id: 'visit-lifecycle', kind: 'visit', expect: 'start_heartbeat_close' },
  { id: 'alert-rule', kind: 'alert', expect: 'rule_crud' },
  { id: 'mute-expiry', kind: 'mute', expect: 'timed_mute' },
] as const;

export const BATCH_LIMIT = 50;
export const LIST_PAGE_DEFAULT = 50;
export const LIST_PAGE_MAX = 200;
