import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allow = new Set(['packages/connectors/fixtures', 'docs/milestones', '.env.example']);

const findings: Array<{ file: string; kind: string }> = [];

function walk(dir: string, rel = '') {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      ent.name === 'node_modules' ||
      ent.name === '.git' ||
      ent.name === 'dist' ||
      ent.name === 'data'
    )
      continue;
    const full = path.join(dir, ent.name);
    const r = path.join(rel, ent.name).replace(/\\/g, '/');
    if (ent.isDirectory()) {
      walk(full, r);
      continue;
    }
    if (!/\.(ts|tsx|js|mjs|cjs|json|md|yml|yaml|env|txt)$/i.test(ent.name)) continue;
    if ([...allow].some((a) => r.startsWith(a))) continue;
    const text = fs.readFileSync(full, 'utf8');
    if (/-----BEGIN (RSA |OPENSSH )?PRIVATE KEY-----/.test(text))
      findings.push({ file: r, kind: 'private_key' });
    if (/(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36,})/.test(text))
      findings.push({ file: r, kind: 'token_like' });
  }
}

walk(root);
const ok = findings.length === 0;
console.log(JSON.stringify({ suite: 'secrets:scan', findings, ok }, null, 2));
process.exit(ok ? 0 : 1);
