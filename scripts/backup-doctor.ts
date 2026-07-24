import {
  APP_VERSION,
  SCHEMA_VERSION,
  buildBackupManifest,
  sha256Hex,
} from '@healthspan/operations';

const manifest = buildBackupManifest({ platform: process.platform, includes: ['sqlite'] });
const ok =
  manifest.appVersion === APP_VERSION &&
  manifest.schemaVersion === SCHEMA_VERSION &&
  sha256Hex('test').length === 64 &&
  manifest.excludes.includes('secrets');
console.log(
  JSON.stringify(
    { suite: 'backup:doctor', appVersion: APP_VERSION, schemaVersion: SCHEMA_VERSION, ok },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
