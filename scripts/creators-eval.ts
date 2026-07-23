import { extractCreatorClaimsFromText, parseTranscriptDocument, CREATOR_PROHIBITED_SCORES } from '@healthspan/creators';

const vtt = `WEBVTT

00:00:01.000 --> 00:00:05.000
Metformin reduces glucose in humans.

00:00:06.000 --> 00:00:10.000
Does rapamycin extend human healthspan?
`;

const parsed = parseTranscriptDocument({ filename: 'sample.vtt', bytes: Buffer.from(vtt, 'utf8') });
const claims = extractCreatorClaimsFromText(parsed.text);
const questions = claims.filter((c) => c.assertionRole === 'question');
const assertions = claims.filter((c) => c.assertionRole === 'assertion');

const report = {
  suite: 'creators:eval',
  parsedCues: parsed.cueCount,
  claims: claims.length,
  questions: questions.length,
  assertions: assertions.length,
  prohibitedScoresDefined: CREATOR_PROHIBITED_SCORES.length,
  meetsMinimum: parsed.cueCount >= 2 && questions.length >= 1 && assertions.length >= 1,
  ok: parsed.cueCount >= 2 && questions.length >= 1 && assertions.length >= 1,
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
