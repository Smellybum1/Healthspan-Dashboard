import { normalizeForMatch, normalizeIdentifierValue } from './normalize.js';

export const RESOLUTION_RULESET_VERSION = 'm4.resolve.1';

export type MappingCandidate = {
  entityId: string;
  method: 'exact_identifier' | 'exact_alias_unique' | 'review_required';
  ruleId: string;
  confidence: 'high' | 'medium' | 'low';
  collision: boolean;
  reasons: string[];
};

export type EntityLike = {
  id: string;
  preferredName: string;
  normalizedPreferredName: string;
  entityType: string;
  lifecycleState: string;
};

export type AliasLike = {
  entityId: string;
  normalizedAlias: string;
  aliasType: string;
  reviewState: string;
  collisionFlag: boolean;
};

export type IdentifierLike = {
  entityId: string;
  scheme: string;
  normalizedValue: string;
  reviewState: string;
};

/**
 * Auto-accept only exact trusted identifiers or unique exact aliases with no collision.
 */
export function proposeMapping(opts: {
  mentionNormalized: string;
  mentionRaw: string;
  identifierScheme?: string | null;
  identifierValue?: string | null;
  entities: EntityLike[];
  aliases: AliasLike[];
  identifiers: IdentifierLike[];
}): MappingCandidate[] {
  const candidates: MappingCandidate[] = [];

  if (opts.identifierScheme && opts.identifierValue) {
    const normalized = normalizeIdentifierValue(opts.identifierScheme, opts.identifierValue);
    const hits = opts.identifiers.filter(
      (i) =>
        i.scheme === opts.identifierScheme &&
        i.normalizedValue === normalized &&
        i.reviewState !== 'rejected',
    );
    if (hits.length === 1) {
      candidates.push({
        entityId: hits[0]!.entityId,
        method: 'exact_identifier',
        ruleId: 'auto.exact_identifier.v1',
        confidence: 'high',
        collision: false,
        reasons: [`Exact ${opts.identifierScheme} match`],
      });
      return candidates;
    }
    if (hits.length > 1) {
      for (const hit of hits) {
        candidates.push({
          entityId: hit.entityId,
          method: 'review_required',
          ruleId: 'review.identifier_collision.v1',
          confidence: 'low',
          collision: true,
          reasons: ['Identifier collision — human review required'],
        });
      }
      return candidates;
    }
  }

  const normalized = opts.mentionNormalized || normalizeForMatch(opts.mentionRaw);
  const aliasHits = opts.aliases.filter(
    (a) => a.normalizedAlias === normalized && a.reviewState !== 'rejected' && !a.collisionFlag,
  );
  const uniqueEntityIds = [...new Set(aliasHits.map((a) => a.entityId))];
  if (uniqueEntityIds.length === 1) {
    const entity = opts.entities.find((e) => e.id === uniqueEntityIds[0]);
    if (entity && entity.lifecycleState === 'active') {
      candidates.push({
        entityId: entity.id,
        method: 'exact_alias_unique',
        ruleId: 'auto.exact_alias_unique.v1',
        confidence: 'high',
        collision: false,
        reasons: ['Unique exact normalized alias'],
      });
      return candidates;
    }
  }

  const preferredHits = opts.entities.filter(
    (e) => e.normalizedPreferredName === normalized && e.lifecycleState === 'active',
  );
  if (preferredHits.length === 1) {
    candidates.push({
      entityId: preferredHits[0]!.id,
      method: 'exact_alias_unique',
      ruleId: 'auto.exact_preferred_name.v1',
      confidence: 'high',
      collision: false,
      reasons: ['Exact preferred name'],
    });
    return candidates;
  }

  for (const hit of preferredHits.length ? preferredHits : aliasHits) {
    const entityId = 'entityId' in hit ? hit.entityId : hit.id;
    candidates.push({
      entityId,
      method: 'review_required',
      ruleId: 'review.ambiguous_name.v1',
      confidence: 'low',
      collision: preferredHits.length > 1 || uniqueEntityIds.length > 1,
      reasons: ['Ambiguous or non-unique name — review required'],
    });
  }

  return candidates;
}
