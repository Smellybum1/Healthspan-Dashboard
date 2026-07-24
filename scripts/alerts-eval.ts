import { buildAlertDedupeKey } from '@healthspan/personalization';

type Case = { id: string; ok: boolean };
const cases: Case[] = [];

const families = [
  'watchlist_match',
  'saved_search_hit',
  'topic_signal',
  'source_update',
  'regulatory_change',
  'safety_signal',
  'claim_revision',
  'brief_ready',
] as const;

for (let i = 0; i < 80; i += 1) {
  const kind = families[i % families.length]!;
  const a = buildAlertDedupeKey({ kind, watchableId: `w-${i % 10}`, eventRef: `e-${i}` });
  const b = buildAlertDedupeKey({ kind, watchableId: `w-${i % 10}`, eventRef: `e-${i}` });
  const c = buildAlertDedupeKey({ kind, watchableId: `w-${i % 10}`, eventRef: `e-${i + 1}` });
  cases.push({
    id: `alert-dedupe-${i}`,
    ok: a === b && a !== c && a.startsWith(kind) && !a.toLowerCase().includes('clinical risk'),
  });
}

const failed = cases.filter((c) => !c.ok);
console.log(
  JSON.stringify(
    {
      suite: 'alerts:eval',
      total: cases.length,
      failed: failed.length,
      families: families.length,
      ok: failed.length === 0 && cases.length >= 80,
    },
    null,
    2,
  ),
);
process.exit(failed.length === 0 && cases.length >= 80 ? 0 : 1);
