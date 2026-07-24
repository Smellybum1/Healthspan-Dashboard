import { previewLegacyPreferenceImport } from '@healthspan/personalization';

const payload = process.argv.includes('--file')
  ? JSON.parse(
      await (
        await import('node:fs/promises')
      ).readFile(process.argv[process.argv.indexOf('--file') + 1]!, 'utf8'),
    )
  : { followedIdsByMode: { live: ['live-1'], demo: ['demo-1'] }, topics: ['aging'] };

const preview = previewLegacyPreferenceImport(payload);
console.log(
  JSON.stringify(
    {
      command: 'personalisation:import',
      mode: 'preview',
      ...preview,
      note: 'CLI import remains preview/merge-gated; Demo IDs never import into Live.',
    },
    null,
    2,
  ),
);
process.exit(preview.ok ? 0 : 1);
