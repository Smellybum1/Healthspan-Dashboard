import {
  LOCAL_OWNER_PROFILE_ID,
  PERSONALISATION_EVAL_CASES,
  canonicalSearchHash,
  previewLegacyPreferenceImport,
  selectBriefItems,
  slugifyWatchlistName,
} from '@healthspan/personalization';

const checks = [
  LOCAL_OWNER_PROFILE_ID === 'local-owner',
  slugifyWatchlistName('My List!') === 'my-list',
  canonicalSearchHash({ schemaVersion: 1, text: 'metformin' }).startsWith('fnv1a_'),
  selectBriefItems(
    [
      { id: 'a', importance: 'low', occurredAt: 1 },
      { id: 'b', importance: 'high', occurredAt: 2 },
    ],
    1,
  )[0]?.id === 'b',
  previewLegacyPreferenceImport({
    followedIdsByMode: { live: ['x'], demo: ['demo-1'] },
  }).ok === true,
  PERSONALISATION_EVAL_CASES.length >= 6,
];

const ok = checks.every(Boolean);
console.log(
  JSON.stringify(
    {
      suite: 'personalisation:doctor',
      profileId: LOCAL_OWNER_PROFILE_ID,
      evalCases: PERSONALISATION_EVAL_CASES.length,
      ok,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
