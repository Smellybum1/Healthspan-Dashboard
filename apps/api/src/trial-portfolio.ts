import { randomUUID } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import {
  interventionAliases,
  interventionEntities,
  trialInterventionEntityLinks,
  trialInterventions,
  trials,
  type HealthspanDb,
} from '@healthspan/db';
import { normalizeForMatch, proposeMapping } from '@healthspan/interventions';
import { bootstrapInterventionCatalog } from './dossier-service.js';

/**
 * Map ClinicalTrials.gov intervention name rows to canonical entities (exact unique only).
 * Source registry terms are preserved; trial registration is never treated as authorisation.
 */
export function linkTrialInterventionsToEntities(db: HealthspanDb, limit = 500) {
  bootstrapInterventionCatalog(db);
  const entities = db.select().from(interventionEntities).all();
  const aliases = db.select().from(interventionAliases).all();
  const rows = db.select().from(trialInterventions).limit(limit).all();
  let linked = 0;
  let reviewNeeded = 0;
  const now = Date.now();

  for (const row of rows) {
    const candidates = proposeMapping({
      mentionNormalized: normalizeForMatch(row.name),
      mentionRaw: row.name,
      entities,
      aliases,
      identifiers: [],
    });
    const auto = candidates.find((c) => c.method === 'exact_alias_unique' || c.method === 'exact_identifier');
    if (!auto) {
      reviewNeeded += 1;
      continue;
    }

    const existing = db
      .select()
      .from(trialInterventionEntityLinks)
      .where(
        and(
          eq(trialInterventionEntityLinks.trialInterventionId, row.id),
          eq(trialInterventionEntityLinks.entityId, auto.entityId),
          isNull(trialInterventionEntityLinks.supersededAt),
        ),
      )
      .all()[0];
    if (existing) continue;

    db.insert(trialInterventionEntityLinks)
      .values({
        id: randomUUID(),
        trialInterventionId: row.id,
        trialId: row.trialId,
        entityId: auto.entityId,
        sourceTerm: row.name,
        mappingState: 'accepted',
        ruleOrDecisionId: auto.ruleId,
        effectiveAt: now,
      })
      .run();
    linked += 1;
  }

  return { linked, reviewNeeded, scanned: rows.length };
}

export function trialPortfolioForEntity(db: HealthspanDb, entityId: string) {
  const links = db
    .select()
    .from(trialInterventionEntityLinks)
    .all()
    .filter((l) => l.entityId === entityId && l.supersededAt == null);

  const items = links.map((link) => {
    const trial = db.select().from(trials).where(eq(trials.contentItemId, link.trialId)).all()[0];
    return {
      trialId: link.trialId,
      nctId: trial?.nctId ?? null,
      overallStatus: trial?.overallStatus ?? null,
      sourceTerm: link.sourceTerm,
      mappingState: link.mappingState,
      note: 'ClinicalTrials.gov registration is not regulatory authorisation.',
    };
  });

  return {
    count: items.length,
    items,
    caveat: 'Trial portfolio links preserve source intervention terms. Registry presence ≠ approval or efficacy.',
  };
}
