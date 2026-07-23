import fs from 'node:fs';

const t = fs.readFileSync('docs/milestones/M3_EXECUTION_BRIEF.md', 'utf8');
const lines = t.split(/\r?\n/);
const heads = lines.filter((l) => /^#{1,3}\s/.test(l) || /^\d+\.\s/.test(l));
fs.writeFileSync(
  'docs/milestones/_m3_outline.txt',
  [`lines=${lines.length}`, `chars=${t.length}`, '', ...heads].join('\n'),
);
console.log('outline written', heads.length);
