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

/** Strip trailing "; criterion XYZ" / "criterion XYZ" suffixes for semantic comparison. */
function semanticEvidenceKey(evidence: string): string {
  return evidence
    .replace(/;?\s*criterion\s+[A-Z]+\d+[a-z]?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .slice(0, 200);
}

const FAMILY_TOKENS: Array<{ re: RegExp; tokens: RegExp[] }> = [
  {
    re: /\bmute\b|\bexpir/i,
    tokens: [/mute/i, /expir/i, /m6-product:eval/i, /personalization-iv/i],
  },
  {
    re: /\bvisit\b|coalesc|heartbeat|cutoff|first.?visit/i,
    tokens: [/visit/i, /heartbeat|coalesc|cutoff|previous/i, /m6-product:eval/i],
  },
  {
    re: /saved.?search|search.?builder|needs_update/i,
    tokens: [/saved.?search|search/i, /m6-product|e2e|M6Pages|personalization/i],
  },
  {
    re: /\bwatchlist\b|batch add|batch remove|\bredirect|\bunavailable/i,
    tokens: [/watchlist/i, /batch|redirect|unavailable|restore|delete/i],
  },
  {
    re: /\balert\b|snooze|priority floor|dedupe/i,
    tokens: [/alert/i, /snooze|priority|rule|batch|mute|why/i],
  },
  {
    re: /\bbriefings?\b|\bdaily brief\b|\bweekly review\b|schedule.*brief|overflow|source coverage/i,
    tokens: [/brief/i, /schedule|export|coverage|overflow|section|catch/i],
  },
  {
    re: /\boperations?\b|\bretention\b|database.?maint|\bscheduler\b/i,
    tokens: [/operation|backup|retention|database|scheduler|panel/i],
  },
  {
    re: /\bnotification\b|\bprivacy\b|\bcsrf\b|request.?integrity/i,
    tokens: [/notification|privacy|csrf|session|security|preference/i],
  },
  {
    re: /\bperformance\b|\blatency\b|\bpayload\b/i,
    tokens: [/performance|deviation|latency|payload|gzip/i],
  },
  {
    re: /\bscreenshot\b|\baxe\b|\ba11y\b|\baccessibility\b/i,
    tokens: [/screenshot|axe|a11y|accessibility|e2e/i],
  },
];

function evidenceFitsCriterion(criterion: string, evidence: string): boolean {
  for (const fam of FAMILY_TOKENS) {
    if (!fam.re.test(criterion)) continue;
    return fam.tokens.some((t) => t.test(evidence));
  }
  // Unknown family: require at least a concrete artifact token
  return /(\.ts|\.tsx|\.md|\.png|m6-product|e2e|doctor|eval|api\/|package\.json|pnpm-lock|git |PASS via|DEVIATION|CI |workflow)/i.test(
    evidence,
  );
}

const evidenceCounts = new Map<string, string[]>();
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
  // Behavioral criteria cannot cite only a route
  if (
    row.status === 'PASS' &&
    /^\/[a-z0-9/-]+$/i.test(row.evidence.trim()) &&
    /action|workflow|CRUD|batch|snooze|mute|schedule|coalesc|restore|delete|filter/i.test(
      row.criterion,
    )
  ) {
    findings.push(`Route-only evidence for behavioral criterion: ${row.id}`);
  }
  if (row.status === 'PASS' && !evidenceFitsCriterion(row.criterion, row.evidence)) {
    findings.push(`Unrelated evidence family for ${row.id}: ${row.evidence.slice(0, 80)}`);
  }

  // No criterion-ID bypass: semantically identical evidence still counts as reuse.
  const key = semanticEvidenceKey(row.evidence);
  if (key.length > 24) {
    const list = evidenceCounts.get(key) ?? [];
    list.push(row.id);
    evidenceCounts.set(key, list);
  }

  // Cited paths / scripts / screenshots
  for (const fileMatch of row.evidence.matchAll(
    /(?:^|[^\w./-])((?:apps|packages|scripts|docs)\/[\w./-]+\.(?:tsx|ts|md|sql))/g,
  )) {
    const rel = fileMatch[1];
    if (!fs.existsSync(path.join(root, rel))) {
      findings.push(`Missing cited path in ${row.id}: ${rel}`);
    }
  }
  for (const shot of row.evidence.matchAll(/\b(m6-[a-z0-9-]+\.png)\b/gi)) {
    if (!fs.existsSync(path.join(root, 'docs/milestones/screenshots', shot[1]))) {
      findings.push(`Missing cited screenshot in ${row.id}: ${shot[1]}`);
    }
  }
  for (const script of row.evidence.matchAll(
    /\b(m6-product:eval|m6-product:doctor|completion-report:doctor|backup:eval|backup:doctor)\b/g,
  )) {
    const map: Record<string, string> = {
      'm6-product:eval': 'scripts/m6-product-eval.ts',
      'm6-product:doctor': 'scripts/m6-product-doctor.ts',
      'completion-report:doctor': 'scripts/completion-report-doctor.ts',
      'backup:eval': 'scripts/backup-eval.ts',
      'backup:doctor': 'scripts/backup-doctor.ts',
    };
    const rel = map[script[1]];
    if (rel && !fs.existsSync(path.join(root, rel))) {
      findings.push(`Missing cited script for ${row.id}: ${script[1]}`);
    }
  }
}

for (const [ev, ids] of evidenceCounts) {
  if (ids.length >= 8) {
    findings.push(
      `Semantically identical evidence reused ${ids.length} times (no criterion-ID bypass): ${ev.slice(0, 70)}… [${ids.slice(0, 8).join(',')}]`,
    );
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
      findings: findings.slice(0, 60),
      findingCount: findings.length,
      note: 'Remediation V: criterion-ID suffix bypass removed; semantic reuse + family tokens enforced',
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
