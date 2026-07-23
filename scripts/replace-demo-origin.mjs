import fs from 'node:fs';
import path from 'node:path';

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'docs'].includes(e.name)) continue;
      walk(p, acc);
    } else if (/\.(ts|tsx|mjs)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const root = process.cwd();
const files = walk(root);
const log = [];
for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  const orig = t;
  t = t.replace(/demo:\s*z\.literal\(true\)/g, 'dataOrigin: DataOriginSchema');
  t = t.replace(/\bdemo:\s*true\b/g, 'dataOrigin: "demo"');
  t = t.replace(/\bdemo:\s*DEMO\b/g, 'dataOrigin: "demo"');
  if (t !== orig) {
    fs.writeFileSync(f, t);
    log.push(path.relative(root, f));
  }
}
fs.writeFileSync('docs/milestones/_replace_log.txt', log.join('\n') + `\ncount=${log.length}\n`);
