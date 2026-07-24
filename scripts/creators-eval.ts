import {
  ALIGNMENT_DIMENSION_IDS,
  ALIGNMENT_PAIR_CORPUS,
  alignCreatorClaim,
  evaluateAlignmentPairCorpus,
  extractCreatorClaimsFromText,
  parseTranscriptDocument,
  CREATOR_PROHIBITED_SCORES,
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
  prohibitedScores: CREATOR_PROHIBITED_SCORES.length >= 7,
  youtubeDisabledHealthy: ytDisabled.ok && (ytDisabled.warnings?.length ?? 0) > 0,
  xDisabledHealthy: xDisabled.ok && (xDisabled.warnings?.length ?? 0) > 0,
  xBudgetGate: !budgetBlocked.allowed,
  xCompliancePurge: compliance.purged.includes('drop') && compliance.remaining.length === 1,
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
    byCategory: alignmentPairs.byCategory,
  },
  prohibitedScoresDefined: CREATOR_PROHIBITED_SCORES.length,
  checks,
  meetsMinimum: Object.values(checks).every(Boolean),
  ok: Object.values(checks).every(Boolean),
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
