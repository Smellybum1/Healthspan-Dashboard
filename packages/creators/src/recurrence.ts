import { createHash } from 'node:crypto';

export const RECURRENCE_FORMULA_VERSION = 'm5.recurrence.1';

export type RecurrenceClaimInput = {
  id: string;
  recurrenceKey: string;
  claimText: string;
  reviewStatus: string;
  active: boolean;
  lifecycleState?: string | null;
  /** Platform account or monitored source id — same source must not inflate source count. */
  sourceKey: string | null;
  /** Monitored-source first observation time. */
  firstObservedAt: number | null;
  sourceUnavailable?: boolean;
};

export type RecurrenceRelationshipType =
  | 'exact_duplicate'
  | 'reviewed_paraphrase'
  | 'potential_paraphrase'
  | 'correction_of'
  | 'unrelated';

export type RecurrenceGroup = {
  recurrenceKey: string;
  formulaVersion: typeof RECURRENCE_FORMULA_VERSION;
  reviewedClaimCount: number;
  distinctMonitoredSourceCount: number;
  sameSourceRepetitionCount: number;
  sourceUnavailableCount: number;
  firstObservedAt: number | null;
  firstObservedScope: 'monitored_sources';
  labels: {
    /** Explicitly not popularity/influence/attention/truth. */
    notPopularity: true;
    notInfluence: true;
    notAttention: true;
    notTruth: true;
  };
  claimIds: string[];
};

export type ClaimRelationship = {
  sourceClaimId: string;
  targetClaimId: string;
  relationshipType: RecurrenceRelationshipType;
  similarity: number;
};

function normalizeTheme(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function tokenSet(text: string): Set<string> {
  return new Set(
    normalizeTheme(text)
      .split(' ')
      .filter((t) => t.length > 2),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Classify relationship between two claims. Never emits a plagiarism label (I6).
 */
export function classifyClaimRelationship(
  a: Pick<RecurrenceClaimInput, 'id' | 'claimText' | 'recurrenceKey'>,
  b: Pick<RecurrenceClaimInput, 'id' | 'claimText' | 'recurrenceKey'>,
): ClaimRelationship {
  if (
    a.recurrenceKey === b.recurrenceKey ||
    normalizeTheme(a.claimText) === normalizeTheme(b.claimText)
  ) {
    return {
      sourceClaimId: a.id,
      targetClaimId: b.id,
      relationshipType: 'exact_duplicate',
      similarity: 1,
    };
  }
  const sim = jaccard(tokenSet(a.claimText), tokenSet(b.claimText));
  if (sim >= 0.85) {
    return {
      sourceClaimId: a.id,
      targetClaimId: b.id,
      relationshipType: 'reviewed_paraphrase',
      similarity: sim,
    };
  }
  if (sim >= 0.55) {
    return {
      sourceClaimId: a.id,
      targetClaimId: b.id,
      relationshipType: 'potential_paraphrase',
      similarity: sim,
    };
  }
  return {
    sourceClaimId: a.id,
    targetClaimId: b.id,
    relationshipType: 'unrelated',
    similarity: sim,
  };
}

/**
 * Recurrence over reviewed active claims only (I7), distinct monitored sources (I8–I9),
 * excluding source-unavailable (I10), with formula version (I11) and neutral labels (I12–I13).
 */
export function computeClaimRecurrence(claims: RecurrenceClaimInput[]): RecurrenceGroup[] {
  const eligible = claims.filter(
    (c) =>
      c.active &&
      (c.reviewStatus === 'accepted' || c.reviewStatus === 'reviewed') &&
      c.lifecycleState !== 'invalidated_compliance' &&
      !c.sourceUnavailable,
  );
  const unavailable = claims.filter((c) => c.sourceUnavailable);

  const byKey = new Map<string, RecurrenceClaimInput[]>();
  for (const c of eligible) {
    const list = byKey.get(c.recurrenceKey) ?? [];
    list.push(c);
    byKey.set(c.recurrenceKey, list);
  }

  const groups: RecurrenceGroup[] = [];
  for (const [recurrenceKey, list] of byKey) {
    const sourceKeys = list.map((c) => c.sourceKey).filter((k): k is string => Boolean(k));
    const distinctSources = new Set(sourceKeys);
    const firstObservedAt =
      list
        .map((c) => c.firstObservedAt)
        .filter((t): t is number => t != null)
        .sort((a, b) => a - b)[0] ?? null;

    groups.push({
      recurrenceKey,
      formulaVersion: RECURRENCE_FORMULA_VERSION,
      reviewedClaimCount: list.length,
      distinctMonitoredSourceCount: distinctSources.size,
      sameSourceRepetitionCount: Math.max(0, sourceKeys.length - distinctSources.size),
      sourceUnavailableCount: unavailable.filter((u) => u.recurrenceKey === recurrenceKey).length,
      firstObservedAt,
      firstObservedScope: 'monitored_sources',
      labels: {
        notPopularity: true,
        notInfluence: true,
        notAttention: true,
        notTruth: true,
      },
      claimIds: list.map((c) => c.id),
    });
  }

  return groups.sort((a, b) => b.distinctMonitoredSourceCount - a.distinctMonitoredSourceCount);
}

export function recurrenceSourceScopeHash(sourceKeys: string[]): string {
  return createHash('sha256')
    .update([...sourceKeys].sort().join('|'))
    .digest('hex')
    .slice(0, 24);
}
