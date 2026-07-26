/**
 * sites:bundle:doctor — enforces the edge boundary.
 *
 * Milestone 7, Amendment I §3. Walks the import graph from every module declared
 * hosted-reachable and fails if it can reach anything the Sites runtime cannot provide:
 * `better-sqlite3`, the local database client, Node builtins, the filesystem, the
 * backup/restore subsystem, or a connector.
 *
 * This runs on source rather than a built bundle deliberately. The boundary is a design
 * property — a hosted service must not be *able* to import the driver — and catching it
 * at the import site names the offending edge instead of a minified frame.
 *
 * `HOSTED_ROOTS` grows as the porting ledger moves rows from `pending` to `done`. A row
 * may only be marked `done` once its module is a root here and this gate is green.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Modules that must be safe to reach from the Sites runtime.
 *
 * Extra candidate roots may be passed on argv to check a module before promoting it,
 * e.g. `pnpm sites:bundle:doctor apps/api/src/review-service.ts`.
 */
const DECLARED_ROOTS = [
  // The Sites entrypoint. Everything the hosted runtime executes hangs off this file,
  // which is what turns this check from an import-hygiene lint into the actual edge
  // boundary gate.
  'apps/sites/src/index.ts',
  'packages/core/src/ports/index.ts',
  'packages/runtime/src/index.ts',
];
const HOSTED_ROOTS = [...DECLARED_ROOTS, ...process.argv.slice(2)];

/** Specifiers no hosted module may reach, with the reason reported on failure. */
const FORBIDDEN: Array<{ test: (spec: string) => boolean; reason: string }> = [
  { test: (s) => s.startsWith('node:'), reason: 'Node builtin' },
  {
    test: (s) => ['fs', 'path', 'os', 'crypto', 'child_process', 'worker_threads'].includes(s),
    reason: 'Node builtin (bare specifier)',
  },
  { test: (s) => s === 'better-sqlite3', reason: 'native SQLite driver' },
  { test: (s) => s.endsWith('.node'), reason: 'native addon' },
  {
    test: (s) => s.startsWith('drizzle-orm/better-sqlite3'),
    reason: 'better-sqlite3 driver binding',
  },
  { test: (s) => s === '@healthspan/db', reason: 'local database package (exposes HealthspanDb)' },
  { test: (s) => s === '@healthspan/connectors', reason: 'network connector package' },
  {
    test: (s) => s === '@healthspan/operations',
    reason: 'local operations package (node:crypto, filesystem backup format)',
  },
  { test: (s) => s.startsWith('@hono/node-server'), reason: 'Node server adapter' },
];

const WORKSPACE_ALIASES: Record<string, string> = {
  '@healthspan/core': 'packages/core/src/index.ts',
  '@healthspan/runtime': 'packages/runtime/src/index.ts',
  '@healthspan/operations': 'packages/operations/src/index.ts',
  '@healthspan/ui': 'packages/ui/src/index.tsx',
  '@healthspan/intelligence': 'packages/intelligence/src/index.ts',
  '@healthspan/interventions': 'packages/interventions/src/index.ts',
  '@healthspan/creators': 'packages/creators/src/index.ts',
  '@healthspan/personalization': 'packages/personalization/src/index.ts',
};

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s+['"]([^'"]+)['"]/g;
const BARE_IMPORT_RE = /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g;

function readImports(file: string): string[] {
  const src = fs.readFileSync(file, 'utf8');
  const specs: string[] = [];
  for (const re of [IMPORT_RE, BARE_IMPORT_RE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) specs.push(m[1]!);
  }
  return specs;
}

/** Resolve a specifier to a repo-relative source file, or null if it is external. */
function resolve(spec: string, fromFile: string): string | null {
  if (WORKSPACE_ALIASES[spec]) return WORKSPACE_ALIASES[spec]!;
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(path.join(repoRoot, fromFile)), spec);
  const candidates = [
    base.replace(/\.js$/, '.ts'),
    base.replace(/\.js$/, '.tsx'),
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return path.relative(repoRoot, c).split(path.sep).join('/');
    }
  }
  return null;
}

type Violation = { module: string; specifier: string; reason: string; via: string[] };

const visited = new Set<string>();
const violations: Violation[] = [];

function walk(file: string, trail: string[]) {
  if (visited.has(file)) return;
  visited.add(file);
  const abs = path.join(repoRoot, file);
  if (!fs.existsSync(abs)) {
    violations.push({
      module: file,
      specifier: '(missing)',
      reason: 'declared hosted root does not exist',
      via: trail,
    });
    return;
  }
  for (const spec of readImports(file)) {
    const forbidden = FORBIDDEN.find((f) => f.test(spec));
    if (forbidden) {
      violations.push({ module: file, specifier: spec, reason: forbidden.reason, via: trail });
      continue;
    }
    const next = resolve(spec, file);
    if (next) walk(next, [...trail, file]);
  }
}

for (const root of HOSTED_ROOTS) walk(root, []);

const report = {
  suite: 'sites:bundle:doctor',
  roots: HOSTED_ROOTS,
  modulesInGraph: visited.size,
  violations,
  ok: violations.length === 0,
};

console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
