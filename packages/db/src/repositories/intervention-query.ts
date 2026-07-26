import { and, desc, eq, isNull, ne, sql, type SQL } from 'drizzle-orm';
import type { InterventionTypeFilter } from '@healthspan/core';
import { trials } from '../schema.js';
import {
  dossierSnapshots,
  entityResolutionTasks,
  interventionAliases,
  interventionEntities,
  interventionIdentifiers,
  peptideProfiles,
  regulatoryAssertions,
  trialInterventionEntityLinks,
} from '../intervention-schema.js';

/**
 * Query semantics shared by the local SQLite and Sites D1 intervention adapters.
 *
 * Two shapes replace in-memory work the retired implementations did after loading whole
 * tables: the active-entity, type, and name filters became column predicates, and the
 * trial portfolio became a join instead of one trial query per link.
 */

export const interventionSummarySelection = {
  id: interventionEntities.id,
  preferredName: interventionEntities.preferredName,
  entityType: interventionEntities.entityType,
  identityConfidence: interventionEntities.identityConfidence,
  shortDescription: interventionEntities.shortDescription,
  currentDossierSnapshotId: interventionEntities.currentDossierSnapshotId,
};

/**
 * Active entities matching the type filter and name search.
 *
 * `intervention` means *not a peptide* rather than a value of `entity_type`, which is why
 * the filter arrives parsed rather than as a raw string — see
 * `parseInterventionTypeFilter`.
 */
export function interventionWhere(
  typeFilter: InterventionTypeFilter,
  q: string | undefined,
): SQL | undefined {
  const predicates: SQL[] = [eq(interventionEntities.lifecycleState, 'active')];
  if (typeFilter.kind === 'peptide') {
    predicates.push(eq(interventionEntities.entityType, 'peptide'));
  } else if (typeFilter.kind === 'not-peptide') {
    predicates.push(ne(interventionEntities.entityType, 'peptide'));
  } else if (typeFilter.kind === 'exact') {
    predicates.push(eq(interventionEntities.entityType, typeFilter.entityType));
  }
  if (q?.trim()) {
    predicates.push(
      sql`lower(${interventionEntities.preferredName}) like ${`%${q.toLowerCase()}%`}`,
    );
  }
  return and(...predicates);
}

export const entityResolutionTaskOrder = desc(entityResolutionTasks.createdAt);

/** Current links only — a superseded link is not part of the portfolio. */
export function trialPortfolioWhere(entityId: string): SQL | undefined {
  return and(
    eq(trialInterventionEntityLinks.entityId, entityId),
    isNull(trialInterventionEntityLinks.supersededAt),
  );
}

export const trialPortfolioSelection = {
  trialId: trialInterventionEntityLinks.trialId,
  sourceTerm: trialInterventionEntityLinks.sourceTerm,
  mappingState: trialInterventionEntityLinks.mappingState,
  nctId: trials.nctId,
  overallStatus: trials.overallStatus,
};

export { entityResolutionTasks, interventionEntities, trialInterventionEntityLinks, trials };

/* Comparison selections — batched by id, never one query per entity. */

export const comparisonEntitySelection = {
  id: interventionEntities.id,
  preferredName: interventionEntities.preferredName,
  entityType: interventionEntities.entityType,
  identityConfidence: interventionEntities.identityConfidence,
  lifecycleState: interventionEntities.lifecycleState,
  shortDescription: interventionEntities.shortDescription,
  currentDossierSnapshotId: interventionEntities.currentDossierSnapshotId,
};

export const peptideSelection = {
  entityId: peptideProfiles.entityId,
  classification: peptideProfiles.classification,
  sequenceState: peptideProfiles.sequenceState,
  warningState: peptideProfiles.warningState,
};

export const dossierSnapshotSelection = {
  id: dossierSnapshots.id,
  summaryJson: dossierSnapshots.summaryJson,
  evidenceMapJson: dossierSnapshots.evidenceMapJson,
  regulatoryMatrixJson: dossierSnapshots.regulatoryMatrixJson,
  safetyJson: dossierSnapshots.safetyJson,
};

export const aliasSelection = {
  aliasText: interventionAliases.aliasText,
  aliasType: interventionAliases.aliasType,
  reviewState: interventionAliases.reviewState,
  collisionFlag: interventionAliases.collisionFlag,
};

export const identifierSelection = {
  scheme: interventionIdentifiers.scheme,
  value: interventionIdentifiers.value,
  reviewState: interventionIdentifiers.reviewState,
};

/** Open tasks proposing this entity — the retired in-memory filter, as a predicate. */
export function openTasksForEntity(entityId: string): SQL | undefined {
  return and(
    eq(entityResolutionTasks.status, 'open'),
    eq(entityResolutionTasks.proposedEntityId, entityId),
  );
}

/** Current assertions only — the retired in-memory filter, as a predicate. */
export const assertionCurrent = eq(regulatoryAssertions.currentState, 'current');

export {
  dossierSnapshots,
  interventionAliases,
  interventionIdentifiers,
  peptideProfiles,
  regulatoryAssertions,
};
