import fs from 'node:fs';

const brief = fs.readFileSync(
  'docs/milestones/healthspan_dashboard_milestone_6_execution_brief.md',
  'utf8',
);
const start = brief.indexOf('# 39. Acceptance criteria checklist');
const end = brief.indexOf('# 40.', start);
const section = brief.slice(start, end > 0 ? end : undefined);
const rows = [...section.matchAll(/^- \[ \] ([A-Z]\d+)\. (.+)$/gm)].map((m) => ({
  id: m[1],
  text: m[2].trim(),
}));
console.log('rows', rows.length);
fs.writeFileSync('docs/milestones/_m6_checklist_ids.json', JSON.stringify(rows, null, 2));
