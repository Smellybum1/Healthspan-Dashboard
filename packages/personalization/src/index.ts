import { z } from 'zod';

export const LOCAL_OWNER_PROFILE_ID = 'local-owner';

export const SavedSearchQuerySchema = z.object({
  schemaVersion: z.literal(1),
  text: z.string().max(400).optional(),
  targetTypes: z.array(z.string()).max(20).optional(),
  topics: z.array(z.string()).max(40).optional(),
  sources: z.array(z.string()).max(20).optional(),
  jurisdictions: z
    .array(z.enum(['AU', 'US']))
    .max(2)
    .optional(),
});
export type SavedSearchQuery = z.infer<typeof SavedSearchQuerySchema>;

/** Stable canonical hash without depending on Node crypto at import time. */
export function canonicalSearchHash(query: SavedSearchQuery): string {
  const s = JSON.stringify(query);
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv1a_${(h >>> 0).toString(16).padStart(8, '0')}`;
}

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
] as const;
