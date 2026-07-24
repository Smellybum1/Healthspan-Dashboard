import { sinceLastVisitWindow } from '@healthspan/personalization';

type Case = { id: string; ok: boolean };
const cases: Case[] = [];

for (let i = 0; i < 24; i += 1) {
  const now = 1_700_000_000_000 + i * 1000;
  const last = now - (i + 1) * 86_400_000;
  const w = sinceLastVisitWindow(last, now);
  cases.push({ id: `visit-window-${i}`, ok: w.start === last && w.end === now });
}
for (let i = 0; i < 24; i += 1) {
  const now = Date.UTC(2026, 0, i + 1);
  const w = sinceLastVisitWindow(null, now);
  cases.push({
    id: `first-visit-${i}`,
    ok: w.end === now && w.start === now - 7 * 86400000,
  });
}

const failed = cases.filter((c) => !c.ok);
console.log(
  JSON.stringify(
    {
      suite: 'reading-visits:eval',
      total: cases.length,
      failed: failed.length,
      ok: failed.length === 0 && cases.length >= 48,
    },
    null,
    2,
  ),
);
process.exit(failed.length === 0 && cases.length >= 48 ? 0 : 1);
