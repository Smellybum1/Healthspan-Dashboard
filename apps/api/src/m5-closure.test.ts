import { describe, expect, it } from 'vitest';
import {
  assertNoXTextInExport,
  buildSafeCreatorExportBundle,
  stripForbiddenExportFields,
} from './safe-response.js';
import { JOB_PRIORITY } from './job-priorities.js';
import { claimNextJob, enqueueJob, completeJob } from './jobs.js';
import { openDatabase, closeDatabase } from '@healthspan/db';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  getXComplianceStatus,
  isXComplianceOverdue,
  runXComplianceReconciliation,
} from './x-sync-service.js';

describe('safe-response export guards', () => {
  it('strips X text and transcript fields from export-shaped payloads', () => {
    const dirty = {
      postId: 'p1',
      textBody: 'secret x text',
      parsedTextExcerpt: 'full transcript should not export',
      nested: { captionText: 'nope', id: 'ok' },
    };
    const clean = stripForbiddenExportFields(dirty);
    expect(clean).toEqual({ postId: 'p1', nested: { id: 'ok' } });
    expect(assertNoXTextInExport(clean).ok).toBe(true);
    expect(assertNoXTextInExport(dirty).ok).toBe(false);
  });

  it('builds creator export bundles without bodies', () => {
    const bundle = buildSafeCreatorExportBundle({
      creatorId: 'c1',
      preferredName: 'Example',
      xPosts: [{ postId: 'x1', textBody: 'must not appear', canonicalUrl: 'https://x.com/1' }],
      documents: [{ id: 'd1', filename: 'a.vtt', parsedTextExcerpt: 'secret' }],
      claims: [{ id: 'cl1', reviewStatus: 'candidate', assertionRole: 'assertion' }],
    });
    expect(bundle.xPosts[0]).toEqual({
      postId: 'x1',
      canonicalUrl: 'https://x.com/1',
      complianceState: 'unknown',
    });
    expect(JSON.stringify(bundle)).not.toMatch(/must not appear|secret/);
    expect(assertNoXTextInExport(bundle).ok).toBe(true);
  });
});

describe('job leases and compliance priority', () => {
  it('claims compliance jobs before ordinary platform sync', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hs-jobs-'));
    process.env.HEALTHSPAN_DATA_DIR = dir;
    process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR = '1';
    const { db, sqlite } = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
    try {
      enqueueJob(db, {
        kind: 'sync_youtube_channel',
        payload: { creatorId: 'c1' },
        dedupeKey: 'yt-1',
        priority: JOB_PRIORITY.PLATFORM_SYNC,
      });
      enqueueJob(db, {
        kind: 'run_x_batch_compliance',
        payload: { trigger: 'test' },
        dedupeKey: 'comp-1',
        priority: JOB_PRIORITY.COMPLIANCE,
      });
      const first = claimNextJob(db);
      expect(first?.kind).toBe('run_x_batch_compliance');
      completeJob(db, first!.id, 'succeeded');
      const second = claimNextJob(db);
      expect(second?.kind).toBe('sync_youtube_channel');
      completeJob(db, second!.id, 'succeeded');
    } finally {
      closeDatabase(sqlite);
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('x compliance reconciliation', () => {
  it('advances durable cursor and is not overdue after run when X disabled', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hs-xcomp-'));
    process.env.HEALTHSPAN_DATA_DIR = dir;
    process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR = '1';
    delete process.env.HEALTHSPAN_X_ENABLED;
    const { db, sqlite } = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
    try {
      const before = getXComplianceStatus(db);
      expect(before.enabled).toBe(false);
      expect(isXComplianceOverdue(before)).toBe(false);
      const result = runXComplianceReconciliation(db, { trigger: 'test' });
      expect(result.ok).toBe(true);
      expect(result.status).toBe('skipped_disabled');
      const after = getXComplianceStatus(db);
      expect(after.lastReconciledAt).not.toBeNull();
      expect(after.cursor).toMatch(/^disabled:/);
    } finally {
      closeDatabase(sqlite);
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('marks overdue when X enabled and never reconciled', () => {
    const prev = process.env.HEALTHSPAN_X_ENABLED;
    process.env.HEALTHSPAN_X_ENABLED = 'true';
    try {
      expect(
        isXComplianceOverdue({ enabled: true, lastReconciledAt: null }),
      ).toBe(true);
      expect(
        isXComplianceOverdue({
          enabled: true,
          lastReconciledAt: Date.now() - 48 * 60 * 60 * 1000,
          maxAgeHours: 24,
        }),
      ).toBe(true);
      expect(
        isXComplianceOverdue({
          enabled: true,
          lastReconciledAt: Date.now() - 60_000,
          maxAgeHours: 24,
        }),
      ).toBe(false);
    } finally {
      if (prev == null) delete process.env.HEALTHSPAN_X_ENABLED;
      else process.env.HEALTHSPAN_X_ENABLED = prev;
    }
  });
});
