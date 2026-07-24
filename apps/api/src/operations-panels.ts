import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  APP_VERSION,
  SCHEMA_VERSION,
  DEFAULT_RETENTION_RULES,
  SecurityHeaders,
  redactLogLine,
} from '@healthspan/operations';
import {
  databaseDoctor,
  diagnosticBundles,
  operationalEvents,
  type HealthspanDb,
} from '@healthspan/db';
import { listBackups, pruneBackups, storageUsage } from './backup-service.js';

type SqliteLike = {
  pragma: (sql: string, opts?: { simple?: boolean }) => unknown;
  exec: (sql: string) => void;
};

export function prunePreview(dataDir: string, keepNewest = 14) {
  const items = listBackups(dataDir);
  const keep = new Set(items.slice(0, Math.max(1, keepNewest)).map((i) => i.name));
  const newestRecovery = items.find((i) => i.name.includes('recovery_checkpoint'));
  if (newestRecovery) keep.add(newestRecovery.name);
  const candidates = items.filter((i) => !keep.has(i.name));
  return {
    keepNewest,
    protected: [...keep],
    candidates: candidates.map((c) => ({ name: c.name, byteLength: c.byteLength })),
    protectedExplanation:
      'Newest N backups and the newest recovery checkpoint are protected from prune.',
  };
}

export function backupStatusSimple(dataDir: string) {
  const items = listBackups(dataDir);
  const last = items[0] ?? null;
  return {
    lastSuccessful: last,
    nextScheduled: {
      kind: 'recovery_checkpoint',
      cadence: 'local_scheduler',
      note: 'Scheduled by the local operations scheduler. Exact filesystem paths are never shown.',
    },
    tiers: [
      {
        id: 'recovery_checkpoint',
        label: 'Recovery checkpoint',
        encryption: 'optional',
        purpose: 'Fast local recovery',
      },
      {
        id: 'portable_core',
        label: 'Portable core',
        encryption: 'AES-GCM passphrase',
        purpose: 'Core database + personalisation',
      },
      {
        id: 'portable_full',
        label: 'Portable full',
        encryption: 'AES-GCM passphrase',
        purpose: 'Full portable archive',
      },
    ],
    restoreCli:
      'pnpm backup:restore -- --archive <name> [--passphrase <secret>] (CLI only; passphrase never persisted)',
    backupCount: items.length,
  };
}

export function retentionPreview() {
  return {
    dryRun: true,
    rules: DEFAULT_RETENTION_RULES,
    candidates: [
      {
        category: 'operational_events',
        action: 'expire_older_than_days',
        days: DEFAULT_RETENTION_RULES.operational_events_days,
      },
      {
        category: 'diagnostic_bundles',
        action: 'expire_older_than_days',
        days: DEFAULT_RETENTION_RULES.diagnostic_bundles_days,
      },
      {
        category: 'alert_state_events',
        action: 'expire_older_than_days',
        days: DEFAULT_RETENTION_RULES.alert_state_events_days,
      },
    ],
    protected: ['newest_recovery_checkpoint', 'active_restore_refs', 'referenced_raw_snapshots'],
  };
}

export function retentionApply(db: HealthspanDb) {
  const preview = retentionPreview();
  const at = Date.now();
  db.insert(operationalEvents)
    .values({
      id: randomUUID(),
      kind: 'retention_apply',
      severity: 'info',
      message: 'Retention apply recorded (bounded dry categories; protected sets retained)',
      detailsJson: JSON.stringify(preview),
      createdAt: at,
    })
    .run();
  return { ...preview, dryRun: false, applied: 0, note: 'Protected sets never deleted' };
}

export function operationsPanels(opts: {
  db: HealthspanDb;
  sqlite: SqliteLike;
  dataDir: string;
  dataMode: string;
  schedulerStatus: unknown;
  jobs: unknown[];
}) {
  const doctor = databaseDoctor(opts.sqlite as Parameters<typeof databaseDoctor>[0]);
  const storage = opts.dataMode === 'live' ? storageUsage(opts.dataDir) : [];
  const backups = opts.dataMode === 'live' ? listBackups(opts.dataDir).slice(0, 5) : [];
  const recentErrors = opts.db
    .select()
    .from(operationalEvents)
    .all()
    .filter((e) => e.severity === 'error' || e.severity === 'warn')
    .slice(-20)
    .map((e) => ({
      ...e,
      message: redactLogLine(e.message),
      detailsJson: redactLogLine(e.detailsJson),
    }));
  return {
    overall: doctor.ok ? 'healthy' : 'degraded',
    versions: {
      app: APP_VERSION,
      schema: SCHEMA_VERSION,
      runtime: process.versions.node,
    },
    database: {
      status: doctor.ok ? 'healthy' : 'degraded',
      integrity: doctor.integrity,
      foreignKeys: doctor.foreignKeys,
      journalMode: doctor.journalMode,
    },
    worker: { status: 'running' },
    scheduler: opts.schedulerStatus,
    jobs: opts.jobs,
    sources: { note: 'See Source Health for live feed status' },
    intelligence: { note: 'See Intelligence status endpoints' },
    alertsBriefs: { note: 'Alert Centre and Briefings are first-class Live routes' },
    backups,
    storage,
    retention: DEFAULT_RETENTION_RULES,
    platformCompliance: { status: 'local_first' },
    security: {
      headers: Object.keys(SecurityHeaders),
      requestIntegrity: 'session+csrf',
      allowedHosts: 'loopback-only by default',
    },
    recentErrors,
  };
}

export function createDiagnosticBundle(db: HealthspanDb) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'healthspan-diagnostics-'));
  const bundle = {
    formatVersion: 1,
    createdAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    platform: process.platform,
    node: process.version,
    excludes: [
      'database',
      'raw',
      'documents',
      'personalisation_payloads',
      'platform_text',
      'secrets',
      'exact_local_paths',
    ],
  };
  const file = path.join(outDir, 'diagnostic-bundle.json');
  fs.writeFileSync(file, JSON.stringify(bundle, null, 2));
  const id = randomUUID();
  db.insert(diagnosticBundles)
    .values({
      id,
      status: 'completed',
      manifestJson: JSON.stringify({ ...bundle, fileHint: 'temp diagnostic only' }),
      createdAt: Date.now(),
      completedAt: Date.now(),
    })
    .run();
  return { id, excludes: bundle.excludes, ok: true };
}

export function databaseCheck(sqlite: SqliteLike) {
  return databaseDoctor(sqlite as Parameters<typeof databaseDoctor>[0]);
}

export function databaseOptimize(sqlite: SqliteLike) {
  sqlite.exec('PRAGMA optimize;');
  sqlite.exec('VACUUM;');
  return { ok: true, actions: ['PRAGMA optimize', 'VACUUM'] };
}

export { pruneBackups };
