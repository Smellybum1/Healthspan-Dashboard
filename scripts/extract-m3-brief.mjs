import fs from 'node:fs';

const src =
  'C:/Users/moxhe/.cursor/browser-logs/cdp-response-Runtime.evaluate-2026-07-23T13-06-15-141Z.json';
const raw = fs.readFileSync(src, 'utf8');
const j = JSON.parse(raw);

let text = null;
function walk(o) {
  if (!o || typeof o !== 'object') return;
  if (typeof o.text === 'string' && o.text.includes('Milestone 3 Execution Brief')) {
    text = o.text;
    return;
  }
  for (const v of Object.values(o)) walk(v);
}
walk(j);

if (!text) {
  const asStr = JSON.stringify(j);
  const m = asStr.match(
    /Healthspan Dashboard — Milestone 3 Execution Brief[\s\S]*?(?="\s*,\s*"len"|$)/,
  );
  console.log('fallback match', !!m, asStr.slice(0, 200));
  process.exit(1);
}

const out = 'docs/milestones/M3_EXECUTION_BRIEF.md';
fs.writeFileSync(out, text.replace(/\\n/g, '\n').replace(/\\t/g, '\t'));
console.log('wrote', out, 'chars', text.length);
console.log(text.slice(0, 400));
