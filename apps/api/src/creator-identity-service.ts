import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { CREATOR_ROLES, ROLE_PROVENANCE_STATES, type CreatorRole } from '@healthspan/creators';
import {
  creatorEntities,
  creatorIdentityDecisions,
  creatorIdentityTasks,
  creatorAccountIdentityCandidates,
  creatorPlatformAccounts,
  creatorProfileSnapshots,
  creatorProfileState,
  creatorProfileStatements,
  creatorRoles,
  type HealthspanDb,
} from '@healthspan/db';

export function listCreatorRoles(db: HealthspanDb, creatorId: string) {
  return db
    .select()
    .from(creatorRoles)
    .all()
    .filter((r) => r.creatorId === creatorId)
    .map((r) => ({
      id: r.id,
      role: r.role,
      provenanceState: r.provenanceState,
      reviewState: r.reviewState,
      createdAt: new Date(r.createdAt).toISOString(),
    }));
}

export function addCreatorRole(
  db: HealthspanDb,
  opts: {
    creatorId: string;
    role: string;
    provenanceState?: string;
    expectedRevision?: number;
  },
) {
  const creator = db
    .select()
    .from(creatorEntities)
    .where(eq(creatorEntities.id, opts.creatorId))
    .all()[0];
  if (!creator) return { ok: false as const, status: 404 as const, error: 'Creator not found' };
  if (!CREATOR_ROLES.includes(opts.role as CreatorRole)) {
    return {
      ok: false as const,
      status: 400 as const,
      error: `role must be one of ${CREATOR_ROLES.join(',')}`,
    };
  }
  const provenance = opts.provenanceState ?? 'declared';
  if (!ROLE_PROVENANCE_STATES.includes(provenance as (typeof ROLE_PROVENANCE_STATES)[number])) {
    return { ok: false as const, status: 400 as const, error: 'invalid provenanceState' };
  }
  if (opts.expectedRevision != null && opts.expectedRevision !== creator.identityRevision) {
    return {
      ok: false as const,
      status: 409 as const,
      error: 'identity_revision_conflict',
      currentRevision: creator.identityRevision,
    };
  }
  const now = Date.now();
  const id = randomUUID();
  db.insert(creatorRoles)
    .values({
      id,
      creatorId: opts.creatorId,
      role: opts.role,
      provenanceState: provenance,
      reviewState: 'accepted',
      createdAt: now,
    })
    .run();
  const nextRev = creator.identityRevision + 1;
  db.update(creatorEntities)
    .set({ identityRevision: nextRev, updatedAt: now })
    .where(eq(creatorEntities.id, opts.creatorId))
    .run();
  db.insert(creatorIdentityDecisions)
    .values({
      id: randomUUID(),
      creatorId: opts.creatorId,
      decision: 'add_role',
      rationale: `role=${opts.role}`,
      expectedRevision: opts.expectedRevision ?? creator.identityRevision,
      actor: 'local_admin',
      detailJson: JSON.stringify({ roleId: id, role: opts.role }),
      createdAt: now,
    })
    .run();
  return { ok: true as const, roleId: id, identityRevision: nextRev };
}

export function addCommercialStatement(
  db: HealthspanDb,
  opts: { creatorId: string; subject: string; text: string; sourceUrl?: string },
) {
  const creator = db
    .select()
    .from(creatorEntities)
    .where(eq(creatorEntities.id, opts.creatorId))
    .all()[0];
  if (!creator) return { ok: false as const, status: 404 as const, error: 'Creator not found' };
  if (!opts.text.trim() || !opts.subject.trim()) {
    return { ok: false as const, status: 400 as const, error: 'subject and text required' };
  }
  const now = Date.now();
  const id = randomUUID();
  db.insert(creatorProfileStatements)
    .values({
      id,
      creatorId: opts.creatorId,
      statementType: 'commercial_or_disclosure',
      subject: opts.subject.trim(),
      valueText: opts.text.trim(),
      sourceUrl: opts.sourceUrl ?? null,
      reviewState: 'pending_review',
      createdAt: now,
    })
    .run();
  return {
    ok: true as const,
    statementId: id,
    note: 'Commercial relationships require explicit source/review — never inferred.',
  };
}

export function listIdentityTasks(db: HealthspanDb, limit = 50) {
  return db
    .select()
    .from(creatorIdentityTasks)
    .all()
    .filter((t) => t.reviewStatus === 'pending' || t.currentState === 'open')
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
    .map((t) => ({
      id: t.id,
      accountId: t.accountId,
      reason: t.reason,
      proposedCreatorId: t.proposedCreatorId,
      priority: t.priority,
      reviewStatus: t.reviewStatus,
      createdAt: new Date(t.createdAt).toISOString(),
    }));
}

/** Queue ambiguous identity when multiple creators share a handle/external id. */
export function queueAmbiguousIdentityIfNeeded(
  db: HealthspanDb,
  opts: { accountId: string; handle: string | null; creatorId: string },
) {
  if (!opts.handle) return { queued: false };
  const collisions = db
    .select()
    .from(creatorPlatformAccounts)
    .all()
    .filter(
      (a) =>
        a.id !== opts.accountId &&
        a.handle &&
        a.handle.toLowerCase() === opts.handle!.toLowerCase() &&
        a.creatorId !== opts.creatorId,
    );
  if (collisions.length === 0) return { queued: false };
  const now = Date.now();
  for (const other of collisions) {
    const candidateId = randomUUID();
    db.insert(creatorAccountIdentityCandidates)
      .values({
        id: candidateId,
        accountId: opts.accountId,
        candidateCreatorId: other.creatorId,
        matchMethod: 'handle_collision',
        evidenceJson: JSON.stringify({ handle: opts.handle }),
        state: 'candidate',
        confidence: 'medium',
        createdAt: now,
      })
      .run();
    db.insert(creatorIdentityTasks)
      .values({
        id: randomUUID(),
        accountId: opts.accountId,
        candidateId,
        reason: 'ambiguous_handle_collision',
        proposedCreatorId: other.creatorId,
        currentState: 'open',
        sourceEvidenceJson: JSON.stringify({ handle: opts.handle, otherAccountId: other.id }),
        priority: 80,
        reviewStatus: 'pending',
        stale: false,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }
  return { queued: true, collisions: collisions.length };
}

export function resolveIdentityTask(
  db: HealthspanDb,
  opts: {
    taskId: string;
    decision: 'accept_link' | 'reject' | 'keep_separate' | 'create_entity';
    expectedRevision?: number;
    notes?: string;
  },
) {
  const task = db
    .select()
    .from(creatorIdentityTasks)
    .where(eq(creatorIdentityTasks.id, opts.taskId))
    .all()[0];
  if (!task) return { ok: false as const, status: 404 as const, error: 'Task not found' };
  if (task.reviewStatus !== 'pending') {
    return { ok: false as const, status: 409 as const, error: 'Task already resolved' };
  }
  const creatorId = task.proposedCreatorId;
  if (creatorId && opts.expectedRevision != null) {
    const creator = db
      .select()
      .from(creatorEntities)
      .where(eq(creatorEntities.id, creatorId))
      .all()[0];
    if (creator && creator.identityRevision !== opts.expectedRevision) {
      return {
        ok: false as const,
        status: 409 as const,
        error: 'identity_revision_conflict',
        currentRevision: creator.identityRevision,
      };
    }
  }
  const now = Date.now();
  db.update(creatorIdentityTasks)
    .set({
      reviewStatus: 'resolved',
      currentState: opts.decision,
      updatedAt: now,
    })
    .where(eq(creatorIdentityTasks.id, opts.taskId))
    .run();
  db.insert(creatorIdentityDecisions)
    .values({
      id: randomUUID(),
      taskId: opts.taskId,
      accountId: task.accountId,
      creatorId: creatorId ?? null,
      decision: opts.decision,
      rationale: opts.notes ?? null,
      expectedRevision: opts.expectedRevision ?? null,
      actor: 'local_admin',
      detailJson: JSON.stringify({}),
      createdAt: now,
    })
    .run();
  if (creatorId) {
    const creator = db
      .select()
      .from(creatorEntities)
      .where(eq(creatorEntities.id, creatorId))
      .all()[0];
    if (creator) {
      db.update(creatorEntities)
        .set({ identityRevision: creator.identityRevision + 1, updatedAt: now })
        .where(eq(creatorEntities.id, creatorId))
        .run();
    }
  }
  return { ok: true as const, decision: opts.decision };
}

export function rebuildCreatorProfileSnapshot(db: HealthspanDb, creatorId: string) {
  const creator = db
    .select()
    .from(creatorEntities)
    .where(eq(creatorEntities.id, creatorId))
    .all()[0];
  if (!creator) return null;
  const now = Date.now();
  const roles = listCreatorRoles(db, creatorId);
  const statements = db
    .select()
    .from(creatorProfileStatements)
    .all()
    .filter((s) => s.creatorId === creatorId);
  const summary = {
    preferredName: creator.preferredName,
    creatorKind: creator.creatorKind,
    identityConfidence: creator.identityConfidence,
    roles,
    commercialStatements: statements
      .filter((s) => s.statementType === 'commercial_or_disclosure')
      .map((s) => ({
        id: s.id,
        subject: s.subject,
        reviewState: s.reviewState,
        // policy-redactable: omit statement text from public snapshot summary when pending
        text: s.reviewState === 'accepted' ? s.valueText : null,
      })),
  };
  const snapshotId = randomUUID();
  db.insert(creatorProfileSnapshots)
    .values({
      id: snapshotId,
      creatorId,
      inputDependencyHash: randomUUID().slice(0, 12),
      summaryJson: JSON.stringify(summary),
      countsJson: JSON.stringify({ roles: roles.length, statements: statements.length }),
      rulesetVersion: 'm5.profile.1',
      status: 'ready',
      policyRedactionState: statements.some((s) => s.reviewState !== 'accepted')
        ? 'partial'
        : 'none',
      createdAt: now,
    })
    .run();
  db.update(creatorEntities)
    .set({ currentProfileSnapshotId: snapshotId, updatedAt: now })
    .where(eq(creatorEntities.id, creatorId))
    .run();
  const existingState = db
    .select()
    .from(creatorProfileState)
    .all()
    .find((s) => s.creatorId === creatorId);
  if (existingState) {
    db.update(creatorProfileState)
      .set({
        currentSnapshotId: snapshotId,
        stale: false,
        staleReason: null,
        lastSuccessfulRebuildAt: now,
        updatedAt: now,
      })
      .where(eq(creatorProfileState.id, existingState.id))
      .run();
  } else {
    db.insert(creatorProfileState)
      .values({
        id: randomUUID(),
        creatorId,
        currentSnapshotId: snapshotId,
        stale: false,
        lastSuccessfulRebuildAt: now,
        updatedAt: now,
      })
      .run();
  }
  return { snapshotId, summary };
}

export function redactProfileSnapshot(db: HealthspanDb, snapshotId: string) {
  const snap = db
    .select()
    .from(creatorProfileSnapshots)
    .where(eq(creatorProfileSnapshots.id, snapshotId))
    .all()[0];
  if (!snap) return { ok: false as const, status: 404 as const, error: 'Snapshot not found' };
  let summary: Record<string, unknown> = {};
  try {
    summary = JSON.parse(snap.summaryJson) as Record<string, unknown>;
  } catch {
    summary = {};
  }
  if (Array.isArray(summary.commercialStatements)) {
    summary.commercialStatements = (
      summary.commercialStatements as Array<Record<string, unknown>>
    ).map((s) => ({ ...s, text: null }));
  }
  db.update(creatorProfileSnapshots)
    .set({
      summaryJson: JSON.stringify(summary),
      policyRedactionState: 'redacted',
    })
    .where(eq(creatorProfileSnapshots.id, snapshotId))
    .run();
  return { ok: true as const, snapshotId, policyRedactionState: 'redacted' };
}
