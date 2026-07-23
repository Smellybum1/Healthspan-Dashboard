import { createYoutubeConnector, createXConnector } from '@healthspan/connectors';

const yt = await createYoutubeConnector({ apiKey: null }).fetchWindow({
  cursor: {},
  lookbackDays: 1,
  recordCap: 1,
});
const x = await createXConnector({}).fetchWindow({ cursor: {}, lookbackDays: 1, recordCap: 1 });

const report = {
  suite: 'platform-policy:doctor',
  youtubeDisabledHealthy: yt.ok && (yt.warnings?.some((w) => /never claim evidence/i.test(w)) ?? false),
  xDisabledHealthy: x.ok && (x.warnings?.some((w) => /disabled by default/i.test(w)) ?? false),
  ok: true,
};

report.ok = report.youtubeDisabledHealthy && report.xDisabledHealthy;
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
