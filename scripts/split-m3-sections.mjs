import fs from 'node:fs';

const t = fs.readFileSync('docs/milestones/M3_EXECUTION_BRIEF.md', 'utf8');
const sections = {
  '04-m2-closure': /4\.\s+Mandatory Milestone 2 closure items([\s\S]*?)(?=\n5\.\s+)/,
  '05-fixed-decisions':
    /5\.\s+Fixed Milestone 3 product-management decisions([\s\S]*?)(?=\n6\.\s+)/,
  '06-architecture': /6\.\s+Deterministic-first intelligence architecture([\s\S]*?)(?=\n7\.\s+)/,
  '08-schema': /8\.\s+Required database\/schema work([\s\S]*?)(?=\n9\.\s+)/,
  '10-packages': /10\.\s+Package requirements([\s\S]*?)(?=\n11\.\s+)/,
  '14-api': /14\.\s+API requirements([\s\S]*?)(?=\n15\.\s+)/,
  '15-ui': /15\.\s+UI requirements([\s\S]*?)(?=\n16\.\s+)/,
  '16-commands': /16\.\s+Intelligence and job commands([\s\S]*?)(?=\n17\.\s+)/,
  '24-acceptance': /24\.\s+Acceptance criteria checklist([\s\S]*?)(?=\n25\.\s+)/,
};

for (const [name, re] of Object.entries(sections)) {
  const m = t.match(re);
  const body = m ? m[1].trim() : 'NOT FOUND';
  fs.writeFileSync(`docs/milestones/_m3_${name}.txt`, body);
  console.log(name, body.length);
}
