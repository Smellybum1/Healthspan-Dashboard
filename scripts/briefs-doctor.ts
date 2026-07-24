import { selectBriefItems } from '@healthspan/personalization';

const items = selectBriefItems(
  Array.from({ length: 50 }, (_, i) => ({
    id: String(i),
    importance: i % 7 === 0 ? 'high' : 'medium',
    occurredAt: i,
  })),
  20,
);
const ok = items.length === 20 && items[0]?.importance === 'high';
console.log(JSON.stringify({ suite: 'briefs:doctor', selected: items.length, ok }, null, 2));
process.exit(ok ? 0 : 1);
