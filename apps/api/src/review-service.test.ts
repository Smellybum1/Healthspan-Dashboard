import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { openDatabase, closeDatabase, liveReviewTasks, liveClaims } from '@healthspan/db';
import { resolveReviewTask } from './review-service.js';

describe('review service', () => {
  it('appends immutable decisions and updates claim review status', () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-review-'));
    const { db, sqlite } = openDatabase({ dataDir });
    const now = Date.now();
    const claimId = 'claim-1';
    const taskId = 'task-1';
    const analysisId = 'analysis-1';
    db.insert(liveClaims)
      .values({
        id: claimId,
        analysisId,
        contentItemId: 'item-1',
        fingerprint: 'fp1',
        claimKind: 'efficacy',
        assertionRole: 'reported_finding',
        claimText: 'Original claim',
        direction: 'positive',
        extractionMethod: 'deterministic',
        classificationConfidence: 'low',
        reviewStatus: 'needs_review',
        active: true,
        createdAt: now,
      })
      .run();
    db.insert(liveReviewTasks)
      .values({
        id: taskId,
        contentItemId: 'item-1',
        claimId,
        analysisId,
        expectedAnalysisId: analysisId,
        title: 'Review',
        reason: 'low confidence',
        status: 'open',
        confidence: 'low',
        createdAt: now,
      })
      .run();

    const first = resolveReviewTask(db, {
      taskId,
      action: 'accept',
      expectedAnalysisId: analysisId,
    });
    expect(first.ok).toBe(true);

    const second = resolveReviewTask(db, {
      taskId,
      action: 'reject',
      expectedAnalysisId: analysisId,
    });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.status).toBe(409);

    const claim = db.select().from(liveClaims).all()[0];
    expect(claim?.reviewStatus).toBe('accepted');
    closeDatabase(sqlite);
  });
});
