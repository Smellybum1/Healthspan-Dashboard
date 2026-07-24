import { spawnSync } from 'node:child_process';

const steps = [
  ['pnpm', ['format:check']],
  ['pnpm', ['lint']],
  ['pnpm', ['typecheck']],
  ['pnpm', ['test']],
  ['pnpm', ['security:check']],
  ['pnpm', ['backup:doctor']],
];

const results: Array<{ step: string; ok: boolean; status: number | null }> = [];
for (const [cmd, args] of steps) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  results.push({ step: [cmd, ...args].join(' '), ok: r.status === 0, status: r.status });
  if (r.status !== 0) break;
}
const ok = results.every((r) => r.ok) && results.length === steps.length;
console.log(JSON.stringify({ suite: 'ci:quality', results, ok }, null, 2));
process.exit(ok ? 0 : 1);
