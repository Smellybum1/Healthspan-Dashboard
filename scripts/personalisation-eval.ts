import {
  LOCAL_OWNER_PROFILE_ID,
  SavedSearchQuerySchema,
  buildAlertDedupeKey,
  canonicalSearchHash,
  previewLegacyPreferenceImport,
  selectBriefItems,
  sinceLastVisitWindow,
  slugifyWatchlistName,
} from '@healthspan/personalization';

type Case = { id: string; ok: boolean };

const cases: Case[] = [];

function add(id: string, ok: boolean) {
  cases.push({ id, ok });
}

for (let i = 0; i < 40; i += 1) {
  const name = `Watch List ${i}!`;
  add(
    `wl-slug-${i}`,
    slugifyWatchlistName(name).length > 0 && !slugifyWatchlistName(name).includes('!'),
  );
}
for (let i = 0; i < 40; i += 1) {
  const q = SavedSearchQuerySchema.parse({
    schemaVersion: 1,
    text: `metformin ${i}`,
    topics: i % 2 === 0 ? ['aging'] : ['exercise'],
    jurisdictions: i % 3 === 0 ? ['AU'] : ['US'],
  });
  const h1 = canonicalSearchHash(q);
  const h2 = canonicalSearchHash(q);
  add(`search-hash-${i}`, h1 === h2 && h1.startsWith('fnv1a_'));
}

const failed = cases.filter((c) => !c.ok);
console.log(
  JSON.stringify(
    {
      suite: 'personalisation:eval',
      profileId: LOCAL_OWNER_PROFILE_ID,
      total: cases.length,
      failed: failed.length,
      ok: failed.length === 0 && cases.length >= 80,
    },
    null,
    2,
  ),
);
process.exit(failed.length === 0 && cases.length >= 80 ? 0 : 1);
