import {
  buildClaims,
  buildSegments,
  classifyStudyProfile,
  researchActivityScore,
  type NormalizedLiveRecord,
} from './deterministic.js';
import { resolveIntelligenceProvider } from './providers.js';
import {
  CLAIM_SCHEMA_VERSION,
  RULESET_VERSION,
  SEGMENT_BUILDER_VERSION,
} from './versions.js';

export function analyzeNormalizedRecord(record: NormalizedLiveRecord) {
  const segments = buildSegments(record);
  const profile = classifyStudyProfile(record);
  const claims = buildClaims(record, profile, segments);
  const activity = researchActivityScore({
    evidenceMaturity: profile.evidenceMaturity,
    resultsPresent: profile.resultsPresent,
    recent: true,
  });

  return {
    rulesetVersion: RULESET_VERSION,
    segmentBuilderVersion: SEGMENT_BUILDER_VERSION,
    claimSchemaVersion: CLAIM_SCHEMA_VERSION,
    mode: 'deterministic' as const,
    segments,
    profile,
    claims,
    researchActivity: activity,
  };
}

export async function analyzeWithOptionalAi(record: NormalizedLiveRecord) {
  const deterministic = analyzeNormalizedRecord(record);
  const provider = resolveIntelligenceProvider();
  const ai = await provider.analyze({
    contentItemId: String(record.pmid ?? record.nctId ?? record.title ?? 'unknown'),
    segments: deterministic.segments.map((s) => ({
      kind: s.kind,
      fieldPath: s.fieldPath,
      text: s.text.slice(0, 2000),
    })),
    deterministicSummary: {
      evidenceMaturity: deterministic.profile.evidenceMaturity,
      evidenceAvailability: deterministic.profile.evidenceAvailability,
      claimCount: deterministic.claims.length,
    },
  });
  return { ...deterministic, ai };
}
