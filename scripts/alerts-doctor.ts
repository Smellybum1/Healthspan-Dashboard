import { buildAlertDedupeKey } from '@healthspan/personalization';

const a = buildAlertDedupeKey({ kind: 'new_paper', eventRef: 'e1', watchableId: 'w1' });
const b = buildAlertDedupeKey({ kind: 'new_paper', eventRef: 'e1', watchableId: 'w1' });
const c = buildAlertDedupeKey({ kind: 'new_paper', eventRef: 'e2', watchableId: 'w1' });
const ok = a === b && a !== c && !a.includes('undefined');
console.log(
  JSON.stringify(
    { suite: 'alerts:doctor', dedupeStable: a === b, distinctEvents: a !== c, ok },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
