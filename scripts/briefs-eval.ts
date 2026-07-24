import { selectBriefItems } from '@healthspan/personalization';

type Case = { id: string; ok: boolean };
const cases: Case[] = [];

for (let i = 0; i < 40; i += 1) {
  const items = [
    { id: `low-${i}`, importance: 'low', occurredAt: i },
    { id: `high-${i}`, importance: 'high', occurredAt: i },
    { id: `med-${i}`, importance: 'medium', occurredAt: i + 5 },
  ];
  const selected = selectBriefItems(items, 2);
  cases.push({
    id: `brief-priority-${i}`,
    ok: selected[0]?.id === `high-${i}` && selected.length === 2,
  });
}
for (let i = 0; i < 40; i += 1) {
  const items = Array.from({ length: 20 }, (_, j) => ({
    id: `item-${i}-${j}`,
    importance: j === 0 ? 'high' : 'low',
    occurredAt: j,
  }));
  const selected = selectBriefItems(items, 5);
  const ids = new Set(selected.map((s) => s.id));
  cases.push({
    id: `brief-cap-dedupe-${i}`,
    ok: selected.length === 5 && ids.size === 5 && selected[0]?.importance === 'high',
  });
}

const failed = cases.filter((c) => !c.ok);
console.log(
  JSON.stringify(
    {
      suite: 'briefs:eval',
      total: cases.length,
      failed: failed.length,
      ok: failed.length === 0 && cases.length >= 80,
    },
    null,
    2,
  ),
);
process.exit(failed.length === 0 && cases.length >= 80 ? 0 : 1);
