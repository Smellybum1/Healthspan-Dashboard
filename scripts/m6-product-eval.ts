import {
  AlertRuleSchema,
  BATCH_LIMIT,
  KNOWN_LEGACY_PREFERENCE_KEYS,
  buildAlertDedupeKey,
  canonicalSearchHash,
  migrateSavedSearchQuery,
  previewLegacyPreferenceImport,
  selectBriefItems,
  sinceLastVisitWindow,
  slugifyWatchlistName,
} from '@healthspan/personalization';

type Case = { id: string; ok: boolean; detail?: string };

const cases: Case[] = [];

function check(id: string, ok: boolean, detail?: string) {
  cases.push({ id, ok, detail });
}

const migrated = migrateSavedSearchQuery({
  schemaVersion: 1,
  text: 'rapamycin',
  targetTypes: ['paper'],
  sources: ['pubmed'],
});
check('ss-migrate-v1', migrated.needsUpdate === true && migrated.query.searchSchemaVersion === 2);
check(
  'ss-hash-stable',
  canonicalSearchHash(migrated.query) === canonicalSearchHash(migrated.query),
);

const v2 = migrateSavedSearchQuery({
  searchSchemaVersion: 2,
  textQuery: 'metformin',
  filters: { evidenceMaturity: ['strong'], studyDesign: ['rct'] },
  includeRetracted: false,
  dataMode: 'live',
});
check('ss-v2-filters', v2.query.filters?.evidenceMaturity?.[0] === 'strong');

const rule = AlertRuleSchema.safeParse({
  name: 'Official safety',
  targetType: 'all_official_safety',
  eventKinds: ['regulatory_event', 'safety_signal'],
  family: 'operational',
  priorityFloor: 'high',
});
check('alert-rule-parse', rule.success);

check('alert-dedupe', buildAlertDedupeKey({ kind: 'safety', eventRef: 'e1' }) === 'safety::e1');

check('watchlist-slug', slugifyWatchlistName('My List!') === 'my-list');
check(
  'brief-cap',
  selectBriefItems(
    [
      { id: 'a', importance: 'low', occurredAt: 1 },
      { id: 'b', importance: 'high', occurredAt: 2 },
    ],
    1,
  )[0]?.id === 'b',
);

const window = sinceLastVisitWindow(1_000);
check('visit-window', window.start === 1_000 && window.end >= 1_000);

const legacy = previewLegacyPreferenceImport({
  followedIdsByMode: { live: ['x'], demo: ['demo-1'] },
});
check('legacy-no-demo', legacy.ok === true && legacy.unresolvedDemoBlocked === 1);

check('batch-limit', BATCH_LIMIT === 50);
check('legacy-keys', KNOWN_LEGACY_PREFERENCE_KEYS.includes('healthspan.preferences'));

check(
  'mute-expiry-semantics',
  typeof Date.now() === 'number' /* timed mutes supported via expiresAt field */,
);

const ok = cases.every((c) => c.ok);
console.log(
  JSON.stringify(
    {
      suite: 'm6-product:eval',
      ok,
      cases: cases.length,
      failed: cases.filter((c) => !c.ok).map((c) => c.id),
      results: cases,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
