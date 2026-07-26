import { describe, expect, it } from 'vitest';
import type { OperationsReadRepository, OperationsSections } from '@healthspan/core';
import { operationsPanel } from '@healthspan/runtime';

/** Adapter-agnostic contract for {@link OperationsReadRepository}. Both adapters run it. */
export type OperationsContractHarness = {
  name: string;
  create(): Promise<OperationsReadRepository>;
};

const HOSTED_SECTIONS: OperationsSections = {
  database: { status: 'not_applicable', reason: 'D1 exposes no PRAGMA integrity check' },
  storage: { status: 'not_applicable', reason: 'the storage walk reads the local filesystem' },
  backups: { status: 'not_applicable', reason: 'no hosted equivalent' },
  scheduler: { status: 'not_applicable', reason: 'no persistent scheduler' },
  worker: { status: 'not_applicable', reason: 'no persistent worker' },
  jobs: [],
  runtimeVersion: null,
};

const LOCAL_SECTIONS: OperationsSections = {
  database: { status: 'healthy', integrity: 'ok', foreignKeys: 'ok', journalMode: 'wal' },
  storage: [{ path: 'raw', bytes: 1 }],
  backups: [{ id: 'b1' }],
  scheduler: { enabled: true },
  worker: { status: 'running' },
  jobs: [{ id: 'job-1' }],
  runtimeVersion: 'v24.0.0',
};

export function runOperationsContract(harness: OperationsContractHarness) {
  describe(`OperationsReadRepository contract — ${harness.name}`, () => {
    it('surfaces only warnings and errors, oldest first', async () => {
      const repo = await harness.create();
      const panel = await operationsPanel(repo, LOCAL_SECTIONS);
      // The info event is excluded; the two remaining read oldest-to-newest as the
      // retired in-memory `slice(-20)` produced.
      expect(panel.recentErrors.map((e) => e.id)).toEqual(['evt-warn', 'evt-error']);
    });

    it('redacts credentials and addresses out of operational messages', async () => {
      // Redaction lives in the shared panel, so neither runtime can serve a raw message.
      const repo = await harness.create();
      const panel = await operationsPanel(repo, LOCAL_SECTIONS);
      const serialised = JSON.stringify(panel.recentErrors);
      expect(serialised).not.toContain('owner@example.invalid');
      expect(serialised).not.toContain('abc123token');
      expect(serialised).toContain('[REDACTED_EMAIL]');
    });

    it('reports overall health from the database section when there is one', async () => {
      const repo = await harness.create();
      const healthy = await operationsPanel(repo, LOCAL_SECTIONS);
      expect(healthy.overall).toBe('healthy');
      const degraded = await operationsPanel(repo, {
        ...LOCAL_SECTIONS,
        database: { status: 'degraded', integrity: 'bad', foreignKeys: 'ok', journalMode: 'wal' },
      });
      expect(degraded.overall).toBe('degraded');
    });

    it('reports unknown rather than healthy when the database cannot be checked', async () => {
      // The hosted case. Claiming 'healthy' from a check that never ran would be a lie,
      // and claiming 'degraded' would be a false alarm.
      const repo = await harness.create();
      const panel = await operationsPanel(repo, HOSTED_SECTIONS);
      expect(panel.overall).toBe('unknown');
    });

    it('carries a reason on every section a runtime cannot provide', async () => {
      const repo = await harness.create();
      const panel = await operationsPanel(repo, HOSTED_SECTIONS);
      for (const section of [
        panel.database,
        panel.storage,
        panel.backups,
        panel.scheduler,
        panel.worker,
      ]) {
        expect(section).toMatchObject({ status: 'not_applicable' });
        expect(String((section as { reason: string }).reason).length).toBeGreaterThan(0);
      }
      // Not omitted, and not an empty array that would read as "none".
      expect(Array.isArray(panel.backups)).toBe(false);
      expect(Array.isArray(panel.storage)).toBe(false);
    });

    it('always reports versions, retention rules and the security posture', async () => {
      const repo = await harness.create();
      const panel = await operationsPanel(repo, HOSTED_SECTIONS);
      expect(panel.versions).toMatchObject({ app: '0.6.0', schema: 12, runtime: null });
      expect(panel.retention.operational_events_days).toBe(90);
      expect(panel.security.headers).toContain('Content-Security-Policy');
    });
  });
}
