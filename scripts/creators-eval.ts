import {
  ALIGNMENT_DIMENSION_IDS,
  ALIGNMENT_PAIR_CORPUS,
  alignCreatorClaim,
  evaluateAlignmentPairCorpus,
  evaluateM5Corpora,
  extractCreatorClaimsFromText,
  parseTranscriptDocument,
  CREATOR_PROHIBITED_SCORES,
  computeClaimRecurrence,
  gateCreatorAiSegment,
  isCreatorAiEnabled,
  classifyCreatorClaimTaxonomy,
} from '@healthspan/creators';
import {
  applyXComplianceActionsLocally,
  createYoutubeConnector,
  createXConnector,
  gateXBudget,
  estimateXTimelineJobMicros,
} from '@healthspan/connectors';

const vtt = `WEBVTT

00:00:01.000 --> 00:00:05.000
Metformin reduces glucose in humans.

00:00:06.000 --> 00:00:10.000
Does rapamycin extend human healthspan?

00:00:11.000 --> 00:00:16.000
I was paid by a sponsor to discuss NMN in mice.
`;

const parsed = parseTranscriptDocument({ filename: 'sample.vtt', bytes: Buffer.from(vtt, 'utf8') });
const claims = extractCreatorClaimsFromText(parsed.text);
const questions = claims.filter((c) => c.assertionRole === 'question');
const assertions = claims.filter((c) => c.assertionRole === 'assertion');
const disclosures = claims.filter((c) => c.assertionRole === 'disclosure');

const alignment = alignCreatorClaim({
  claimText: 'Metformin causes dramatic lifespan extension in mice and is FDA approved for aging.',
  assertionRole: 'assertion',
  linkedEvidenceCount: 0,
  hasRegulatoryLink: false,
  hasInterventionLink: false,
});

const alignmentPairs = evaluateAlignmentPairCorpus();
const m5Corpora = evaluateM5Corpora();

const ytDisabled = await createYoutubeConnector({ apiKey: null, channelIds: [] }).fetchWindow({
  cursor: {},
  lookbackDays: 7,
  recordCap: 5,
});
const xDisabled = await createXConnector({}).fetchWindow({
  cursor: {},
  lookbackDays: 7,
  recordCap: 5,
});
const budgetBlocked = gateXBudget({
  enabled: true,
  acknowledged: true,
  capMicros: 1000,
  spentMicros: 0,
  estimatedMicros: estimateXTimelineJobMicros({ includeUserLookup: true, maxPosts: 200 }),
});
const compliance = applyXComplianceActionsLocally(
  [
    {
      postId: 'keep',
      userId: '1',
      text: 'a',
      createdAt: null,
      editedAt: null,
      conversationId: null,
      isReply: false,
      isRepost: false,
      withheld: false,
      claimEvidence: false,
      externalAiAllowed: false,
      note: '',
    },
    {
      postId: 'drop',
      userId: '1',
      text: 'b',
      createdAt: null,
      editedAt: null,
      conversationId: null,
      isReply: false,
      isRepost: false,
      withheld: false,
      claimEvidence: false,
      externalAiAllowed: false,
      note: '',
    },
  ],
  [{ postId: 'drop', action: 'delete', reason: 'deleted' }],
);

const checks = {
  parsedCues: parsed.cueCount >= 3,
  segments: (parsed.segments?.length ?? 0) >= 3,
  questions: questions.length >= 1,
  assertions: assertions.length >= 1,
  disclosures: disclosures.length >= 1,
  alignmentDimensions: alignment.dimensions.length === ALIGNMENT_DIMENSION_IDS.length,
  alignmentFindings: alignment.findings.length > 0,
  alignmentPairCorpusSize: ALIGNMENT_PAIR_CORPUS.length >= 72,
  alignmentPairCorpusEval: alignmentPairs.ok,
  m5CorporaOk: m5Corpora.ok,
  identityCorpus: m5Corpora.identity.total >= 48,
  documentCorpus: m5Corpora.documents.total >= 48,
  claimCorpus: m5Corpora.claims.total >= 120,
  recurrenceCorpus: m5Corpora.recurrence.total >= 24,
  complianceCorpus: m5Corpora.compliance.total >= 40,
  prohibitedScores: CREATOR_PROHIBITED_SCORES.length >= 7,
  youtubeDisabledHealthy: ytDisabled.ok && (ytDisabled.warnings?.length ?? 0) > 0,
  xDisabledHealthy: xDisabled.ok && (xDisabled.warnings?.length ?? 0) > 0,
  xBudgetGate: !budgetBlocked.allowed,
  xCompliancePurge: compliance.purged.includes('drop') && compliance.remaining.length === 1,
  creatorAiDisabledByDefault: !isCreatorAiEnabled(),
  creatorAiBlocksYoutube: !gateCreatorAiSegment({
    rightsEligible: true,
    sourceKind: 'youtube_metadata',
    segmentCharCount: 20,
  }).allowed,
  creatorAiBlocksX: !gateCreatorAiSegment({
    rightsEligible: true,
    sourceKind: 'x_content',
    segmentCharCount: 20,
  }).allowed,
  claimTaxonomy: classifyCreatorClaimTaxonomy(assertions[0]?.claimText ?? 'x improves y', 'assertion')
    .claimKind.length > 0,
  recurrenceFormula: computeClaimRecurrence([
    {
      id: 'a',
      recurrenceKey: 'k',
      claimText: 'Rapamycin extends healthspan in adults.',
      reviewStatus: 'accepted',
      active: true,
      sourceKey: 's1',
      firstObservedAt: 1,
    },
    {
      id: 'b',
      recurrenceKey: 'k',
      claimText: 'Rapamycin extends healthspan in adults.',
      reviewStatus: 'accepted',
      active: true,
      sourceKey: 's2',
      firstObservedAt: 2,
    },
  ])[0]?.distinctMonitoredSourceCount === 2,
};

const report = {
  suite: 'creators:eval',
  parsedCues: parsed.cueCount,
  segments: parsed.segments.length,
  claims: claims.length,
  questions: questions.length,
  assertions: assertions.length,
  disclosures: disclosures.length,
  alignmentDimensionCount: alignment.dimensions.length,
  alignmentFindings: alignment.findings,
  alignmentPairCorpus: {
    total: alignmentPairs.total,
    passed: alignmentPairs.passed,
    failed: alignmentPairs.failed,
  },
  m5Corpora,
  prohibitedScoresDefined: CREATOR_PROHIBITED_SCORES.length,
  checks,
  meetsMinimum: Object.values(checks).every(Boolean),
  ok: Object.values(checks).every(Boolean),
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
