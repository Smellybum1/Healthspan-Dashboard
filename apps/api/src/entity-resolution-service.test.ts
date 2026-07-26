import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase, closeDatabase, seedOperationalSources } from '@healthspan/db';
import { entityResolutionTasks, interventionMentions } from '@healthspan/db';
import { bootstrapInterventionCatalog } from './dossier-service.js';
import { resolveEntityResolutionTask } from './entity-resolution-service.js';

describe('M4 entity resolution and comparison', () => {
  let dir: string;
  let db: ReturnType<typeof openDatabase>['db'];
  let sqlite: ReturnType<typeof openDatabase>['sqlite'];

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-m4-svc-'));
    const opened = openDatabase({
      dbPath: path.join(dir, 'healthspan-dashboard.sqlite3'),
      migrateOnOpen: true,
    });
    db = opened.db;
    sqlite = opened.sqlite;
    seedOperationalSources(db);
    bootstrapInterventionCatalog(db);
  });

  afterEach(() => {
    closeDatabase(sqlite);
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore windows lock
    }
  });

  it('accepts an entity-resolution task with append-only decision', () => {
    const mentionId = 'mention-1';
    const taskId = 'task-1';
    db.insert(interventionMentions)
      .values({
        id: mentionId,
        rawText: 'metformin hcl',
        normalizedText: 'metformin hcl',
        mentionType: 'substance',
        fieldPath: 'title',
        excerpt: 'metformin hcl',
        contextHash: 'hash1',
        extractionRuleVersion: 'test',
        createdAt: Date.now(),
      })
      .run();
    db.insert(entityResolutionTasks)
      .values({
        id: taskId,
        mentionId,
        title: 'Resolve metformin hcl',
        reason: 'Ambiguous salt form',
        priority: 'medium',
        status: 'open',
        proposedEntityId: 'ent-metformin',
        createdAt: Date.now(),
      })
      .run();

    const result = resolveEntityResolutionTask(db, { taskId, action: 'accept' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entityId).toBe('ent-metformin');
      expect(result.action).toBe('accept');
    }

    const second = resolveEntityResolutionTask(db, { taskId, action: 'reject' });
    expect(second.ok).toBe(false);
  });
});
