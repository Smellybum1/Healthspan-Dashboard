import { createHash, randomUUID } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import {
  entityResolutionDecisions,
  entityResolutionTasks,
  interventionAliases,
  interventionEntities,
  interventionMappingCandidates,
  interventionMentionMappings,
  interventionMentions,
  type HealthspanDb,
} from '@healthspan/db';
import { normalizeForMatch } from '@healthspan/interventions';

export const ENTITY_RESOLUTION_ACTIONS = [
  'accept',
  'reject',
  'defer',
  'link_other',
  'create_entity',
  'keep_separate',
] as const;

export type EntityResolutionAction = (typeof ENTITY_RESOLUTION_ACTIONS)[number];

function mappingHash(parts: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}

function supersedeCurrentMapping(db: HealthspanDb, mentionId: string) {
  const current = db
    .select()
    .from(interventionMentionMappings)
    .where(
      and(
        eq(interventionMentionMappings.mentionId, mentionId),
        isNull(interventionMentionMappings.supersededAt),
      ),
    )
    .all()[0];
  if (current) {
    db.update(interventionMentionMappings)
      .set({ supersededAt: Date.now() })
      .where(eq(interventionMentionMappings.id, current.id))
      .run();
  }
  return current ?? null;
}

/**
 * Append-only entity-resolution decisions. Never silently auto-merges ambiguous names.
 */
export function resolveEntityResolutionTask(
  db: HealthspanDb,
  opts: {
    taskId: string;
    action: EntityResolutionAction;
    entityId?: string;
    notes?: string;
    newEntityName?: string;
    newEntityType?: string;
  },
) {
  const task = db.select().from(entityResolutionTasks).where(eq(entityResolutionTasks.id, opts.taskId)).all()[0];
  if (!task) {
    return { ok: false as const, status: 404 as const, error: 'Entity-resolution task not found' };
  }
  if (task.status !== 'open' && task.status !== 'deferred') {
    return { ok: false as const, status: 409 as const, error: 'Task is no longer actionable' };
  }
  if (task.stale) {
    return {
      ok: false as const,
      status: 409 as const,
      error: 'Task is stale; refresh mention extraction before resolving',
    };
  }

  const mention = task.mentionId
    ? db.select().from(interventionMentions).where(eq(interventionMentions.id, task.mentionId)).all()[0]
    : null;
  const prior = mention
    ? db
        .select()
        .from(interventionMentionMappings)
        .where(
          and(
            eq(interventionMentionMappings.mentionId, mention.id),
            isNull(interventionMentionMappings.supersededAt),
          ),
        )
        .all()[0]
    : null;
  const priorHash = prior
    ? mappingHash({
        mentionId: prior.mentionId,
        entityId: prior.entityId,
        mappingState: prior.mappingState,
        rule: prior.ruleOrDecisionId,
      })
    : null;

  const now = Date.now();
  let resultingEntityId: string | null = null;
  let resultingHash: string | null = null;
  let nextStatus: string = 'resolved';

  if (opts.action === 'defer') {
    nextStatus = 'deferred';
    db.update(entityResolutionTasks)
      .set({ status: 'deferred' })
      .where(eq(entityResolutionTasks.id, task.id))
      .run();
  } else if (opts.action === 'reject' || opts.action === 'keep_separate') {
    if (mention && task.proposedEntityId) {
      supersedeCurrentMapping(db, mention.id);
      const mappingId = randomUUID();
      db.insert(interventionMentionMappings)
        .values({
          id: mappingId,
          mentionId: mention.id,
          entityId: task.proposedEntityId,
          mappingState: opts.action === 'reject' ? 'rejected' : 'keep_separate',
          mappingScope: 'content_item',
          ruleOrDecisionId: `human.${opts.action}.v1`,
          effectiveAt: now,
        })
        .run();
      resultingHash = mappingHash({
        mentionId: mention.id,
        entityId: task.proposedEntityId,
        mappingState: opts.action === 'reject' ? 'rejected' : 'keep_separate',
      });
      db.update(entityResolutionTasks)
        .set({ status: 'resolved', resolvedAt: now, currentMappingId: mappingId })
        .where(eq(entityResolutionTasks.id, task.id))
        .run();
    } else {
      db.update(entityResolutionTasks)
        .set({ status: 'resolved', resolvedAt: now })
        .where(eq(entityResolutionTasks.id, task.id))
        .run();
    }
  } else if (opts.action === 'accept' || opts.action === 'link_other' || opts.action === 'create_entity') {
    let entityId = opts.entityId ?? task.proposedEntityId ?? null;

    if (opts.action === 'link_other') {
      if (!opts.entityId) {
        return { ok: false as const, status: 400 as const, error: 'entityId is required for link_other' };
      }
      entityId = opts.entityId;
    }

    if (opts.action === 'create_entity') {
      const name = (opts.newEntityName ?? mention?.rawText ?? '').trim();
      if (!name) {
        return { ok: false as const, status: 400 as const, error: 'newEntityName is required for create_entity' };
      }
      entityId = randomUUID();
      db.insert(interventionEntities)
        .values({
          id: entityId,
          preferredName: name,
          normalizedPreferredName: normalizeForMatch(name),
          entityType: opts.newEntityType ?? 'substance',
          lifecycleState: 'active',
          identityConfidence: 'low',
          shortDescription: 'Created from entity-resolution review (M4).',
          createdByMethod: 'human_resolution',
          createdByVersion: 'm4.resolve.1',
          dataOrigin: 'live',
          createdAt: now,
          updatedAt: now,
        })
        .run();
      db.insert(interventionAliases)
        .values({
          id: randomUUID(),
          entityId,
          aliasText: name,
          normalizedAlias: normalizeForMatch(name),
          aliasType: 'preferred',
          reviewState: 'accepted',
          collisionFlag: false,
          createdAt: now,
        })
        .run();
    }

    if (!entityId) {
      return { ok: false as const, status: 400 as const, error: 'No target entity for accept/link' };
    }
    const entity = db.select().from(interventionEntities).where(eq(interventionEntities.id, entityId)).all()[0];
    if (!entity) {
      return { ok: false as const, status: 404 as const, error: 'Target entity not found' };
    }
    if (!mention) {
      return { ok: false as const, status: 400 as const, error: 'Task has no mention to map' };
    }

    supersedeCurrentMapping(db, mention.id);
    const mappingId = randomUUID();
    db.insert(interventionMentionMappings)
      .values({
        id: mappingId,
        mentionId: mention.id,
        entityId,
        mappingState: 'accepted',
        mappingScope: 'content_item',
        ruleOrDecisionId: `human.${opts.action}.v1`,
        effectiveAt: now,
      })
      .run();
    if (task.candidateId) {
      db.update(interventionMappingCandidates)
        .set({ status: 'accepted' })
        .where(eq(interventionMappingCandidates.id, task.candidateId))
        .run();
    }
    resultingEntityId = entityId;
    resultingHash = mappingHash({
      mentionId: mention.id,
      entityId,
      mappingState: 'accepted',
      rule: `human.${opts.action}.v1`,
    });
    db.update(entityResolutionTasks)
      .set({
        status: 'resolved',
        resolvedAt: now,
        currentMappingId: mappingId,
        proposedEntityId: entityId,
      })
      .where(eq(entityResolutionTasks.id, task.id))
      .run();
  } else {
    return { ok: false as const, status: 400 as const, error: 'Unsupported action' };
  }

  const decisionId = randomUUID();
  db.insert(entityResolutionDecisions)
    .values({
      id: decisionId,
      taskId: task.id,
      action: opts.action,
      priorMappingHash: priorHash,
      resultingMappingHash: resultingHash,
      entityId: resultingEntityId ?? opts.entityId ?? task.proposedEntityId,
      notes: opts.notes ?? null,
      actor: 'local_admin',
      createdAt: now,
    })
    .run();

  return {
    ok: true as const,
    decisionId,
    taskId: task.id,
    action: opts.action,
    status: nextStatus,
    entityId: resultingEntityId ?? opts.entityId ?? task.proposedEntityId,
  };
}
