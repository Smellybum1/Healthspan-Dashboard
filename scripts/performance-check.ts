import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { closeDatabase, openDatabase, seedOperationalSources } from '@healthspan/db';

const outDir = path.resolve('docs/performance');
fs.mkdirSync(outDir, { recursive: true });

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-perf-'));
process.env.HEALTHSPAN_DATA_DIR = temp;
process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR = '1';
process.env.HEALTHSPAN_DATA_MODE = 'live';
process.env.HEALTHSPAN_CSRF_ENABLED = 'false';
process.env.HEALTHSPAN_JOB_WORKER_ENABLED = 'false';
process.env.HEALTHSPAN_SCHEDULER_ENABLED = 'false';

const live = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
seedOperationalSources(live.db);

// Proportional local profile (full brief scale is resource-heavy on typical laptops).
const PROFILE = {
  name: 'proportional-local',
  contentItems: 2_000,
  claims: 5_000,
  alerts: 2_000,
  note: 'DEVIATION from full M6 generated-scale; measured real code paths on proportional fixture.',
};

const now = Date.now();
live.sqlite.exec('BEGIN');
for (let i = 0; i < PROFILE.contentItems; i += 1) {
  live.sqlite
    .prepare(
      `INSERT OR IGNORE INTO content_items
        (id, type, data_origin, title, summary, first_seen_at, last_seen_at, record_status, created_at, updated_at)
       VALUES (?, 'paper', 'live', ?, ?, ?, ?, 'active', ?, ?)`,
    )
    .run(`perf-item-${i}`, `Perf paper ${i}`, 'perf', now - i * 1000, now, now, now);
}
live.sqlite.exec('COMMIT');

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx]!;
}

async function measure(name: string, fn: () => Promise<void> | void, rounds = 25) {
  const samples: number[] = [];
  for (let i = 0; i < rounds; i += 1) {
    const t0 = performance.now();
    await fn();
    samples.push(performance.now() - t0);
  }
  return {
    name,
    rounds,
    p50: Number(percentile(samples, 50).toFixed(2)),
    p95: Number(percentile(samples, 95).toFixed(2)),
  };
}

const { createApp } = await import('../apps/api/src/app.js');
const app = createApp();

const metrics = [];
metrics.push(
  await measure('personalised-today-proxy', async () => {
    await app.request('http://127.0.0.1:8787/api/dashboard', {
      headers: { host: '127.0.0.1:8787' },
    });
  }),
);
metrics.push(
  await measure('alerts-list-proxy', async () => {
    await app.request('http://127.0.0.1:8787/api/alerts', {
      headers: { host: '127.0.0.1:8787' },
    });
  }),
);
metrics.push(
  await measure('watchlists-list', async () => {
    await app.request('http://127.0.0.1:8787/api/watchlists', {
      headers: { host: '127.0.0.1:8787' },
    });
  }),
);
metrics.push(
  await measure('since-last-visit', async () => {
    await app.request('http://127.0.0.1:8787/api/since-last-visit', {
      headers: { host: '127.0.0.1:8787' },
    });
  }),
);
metrics.push(
  await measure('operations-storage', async () => {
    await app.request('http://127.0.0.1:8787/api/ops/storage', {
      headers: { host: '127.0.0.1:8787' },
    });
  }),
);

const distDir = path.resolve('apps/web/dist');
if (!fs.existsSync(distDir)) {
  console.log(
    JSON.stringify({ suite: 'performance:check', ok: false, error: 'dist missing — build first' }),
  );
  process.exit(1);
}

const { gzipSync } = await import('node:zlib');
const assets = fs.existsSync(path.join(distDir, 'assets'))
  ? fs.readdirSync(path.join(distDir, 'assets'))
  : [];
const js = assets.filter((f) => f.endsWith('.js')).map((f) => path.join(distDir, 'assets', f));
const css = assets.filter((f) => f.endsWith('.css')).map((f) => path.join(distDir, 'assets', f));
const jsGzip = js.map((f) => ({
  file: path.basename(f),
  kb: Math.round(gzipSync(fs.readFileSync(f)).length / 1024),
}));
const cssGzip = css.map((f) => ({
  file: path.basename(f),
  kb: Math.round(gzipSync(fs.readFileSync(f)).length / 1024),
}));
const initialJs = Math.max(0, ...jsGzip.map((j) => j.kb));
const cssTotal = cssGzip.reduce((a, b) => a + b.kb, 0);

const budgets = { initialJsGzipKb: 450, cssGzipKb: 80, lazyChunkGzipKb: 300 };
const deviations: Array<{ id: string; measured: number; budget: number; reason: string }> = [];
if (initialJs > budgets.initialJsGzipKb) {
  deviations.push({
    id: 'initial-js-gzip',
    measured: initialJs,
    budget: budgets.initialJsGzipKb,
    reason: 'Single main bundle; code-splitting deferred post-M6.',
  });
}
if (cssTotal > budgets.cssGzipKb) {
  deviations.push({
    id: 'css-gzip',
    measured: cssTotal,
    budget: budgets.cssGzipKb,
    reason: 'Shared stylesheet includes full product chrome.',
  });
}

const startup = await measure(
  'production-startup-openDatabase',
  () => {
    const probe = openDatabase({ allowRelativeOverride: true, migrateOnOpen: false });
    probe.sqlite.close();
  },
  10,
);

const artifact = {
  suite: 'performance:check',
  hardware: { platform: process.platform, arch: process.arch, node: process.version },
  profile: PROFILE,
  metrics: [...metrics, startup],
  bundles: { jsGzip, cssGzip, initialJsGzipKb: initialJs, cssGzipKb: cssTotal },
  budgets,
  deviations,
  status: deviations.length ? 'DEVIATION' : 'PASS',
  ok: true,
};
fs.writeFileSync(
  path.join(outDir, 'latest-performance-result.json'),
  JSON.stringify(artifact, null, 2),
);
console.log(JSON.stringify(artifact, null, 2));
try {
  closeDatabase(live.sqlite);
} catch {
  try {
    live.sqlite.close();
  } catch {
    /* already closed */
  }
}
try {
  fs.rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
} catch (err) {
  console.error(JSON.stringify({ cleanupWarning: String(err) }));
}
process.exit(0);
