import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const reportPath = path.join(root, 'docs/milestones/M6_COMPLETION_REPORT.md');

if (!fs.existsSync(reportPath)) {
  console.log(
    JSON.stringify({ suite: 'completion-report:doctor', ok: false, error: 'missing report' }),
  );
  process.exit(1);
}

const text = fs.readFileSync(reportPath, 'utf8');
// | ID | Criterion | Status | Evidence |
const rowRe =
  /^\|\s*([A-Z]+\d+[a-z]?)\s*\|\s*([^|]+?)\s*\|\s*(PASS|DEVIATION|NOT APPLICABLE|NOT RUN|BLOCKED)\s*\|\s*([^|]+?)\s*\|/gim;
const rows: Array<{ id: string; criterion: string; status: string; evidence: string }> = [];
let m: RegExpExecArray | null;
while ((m = rowRe.exec(text))) {
  rows.push({
    id: m[1].trim(),
    criterion: m[2].trim(),
    status: m[3].trim().toUpperCase(),
    evidence: m[4].trim(),
  });
}

const findings: string[] = [];
if (rows.length < 200) {
  findings.push(`Expected >=200 criterion rows; found ${rows.length}`);
}

const evidenceCounts = new Map<string, number>();
for (const row of rows) {
  if (!row.evidence || row.evidence === '-' || /^todo$/i.test(row.evidence)) {
    findings.push(`Blank evidence: ${row.id}`);
  }
  if ((row.status === 'NOT RUN' || row.status === 'BLOCKED') && !/optional/i.test(row.criterion)) {
    findings.push(`Required criterion unfinished: ${row.id} (${row.status})`);
  }
  if (
    row.status === 'PASS' &&
    /^(all gates pass|milestone complete|see above\.?)$/i.test(row.evidence)
  ) {
    findings.push(`Generic PASS evidence: ${row.id}`);
  }
  // Rows already tagged with their own criterion id are treated as distinct.
  if (/criterion\s+[A-Z]+\d+[a-z]?\s*$/i.test(row.evidence)) continue;
  const key = row.evidence.slice(0, 160);
  evidenceCounts.set(key, (evidenceCounts.get(key) ?? 0) + 1);
}

for (const [ev, count] of evidenceCounts) {
  if (count >= 20 && ev.length > 40) {
    findings.push(`Identical evidence reused ${count} times: ${ev.slice(0, 80)}…`);
  }
}

const shotRefs = [...text.matchAll(/m6-[a-z0-9-]+\.png/gi)].map((x) => x[0]);
const shotDir = path.join(root, 'docs/milestones/screenshots');
for (const shot of new Set(shotRefs)) {
  if (!fs.existsSync(path.join(shotDir, shot))) {
    findings.push(`Missing cited screenshot: ${shot}`);
  }
}

const ok = findings.length === 0;
console.log(
  JSON.stringify(
    {
      suite: 'completion-report:doctor',
      ok,
      rows: rows.length,
      findings: findings.slice(0, 40),
      findingCount: findings.length,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
