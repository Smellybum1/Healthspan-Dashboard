import { previewLegacyPreferenceImport } from '@healthspan/personalization';

type Case = { id: string; ok: boolean };
const cases: Case[] = [];

for (let i = 0; i < 20; i += 1) {
  const preview = previewLegacyPreferenceImport({
    followedIdsByMode: { live: [`live-${i}`], demo: [`demo-${i}`] },
    topics: [`topic-${i}`],
  });
  cases.push({
    id: `import-preview-block-demo-${i}`,
    ok: preview.ok === true && preview.unresolvedDemoBlocked === 1 && preview.importable === 1,
  });
}
for (let i = 0; i < 20; i += 1) {
  const preview = previewLegacyPreferenceImport({ followedIds: [`demo-only-${i}`] });
  cases.push({
    id: `import-legacy-followed-${i}`,
    ok: preview.ok === true && preview.importable === 0 && preview.unresolvedDemoBlocked >= 1,
  });
}

const failed = cases.filter((c) => !c.ok);
console.log(
  JSON.stringify(
    {
      suite: 'personalisation-export-import:eval',
      total: cases.length,
      failed: failed.length,
      ok: failed.length === 0 && cases.length >= 40,
    },
    null,
    2,
  ),
);
process.exit(failed.length === 0 && cases.length >= 40 ? 0 : 1);
