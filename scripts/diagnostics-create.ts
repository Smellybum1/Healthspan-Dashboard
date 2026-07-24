import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { APP_VERSION, SCHEMA_VERSION, redactLogLine } from '@healthspan/operations';

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'healthspan-diagnostics-'));
const bundle = {
  formatVersion: 1,
  createdAt: new Date().toISOString(),
  appVersion: APP_VERSION,
  schemaVersion: SCHEMA_VERSION,
  platform: process.platform,
  node: process.version,
  redactedSample: redactLogLine('token=sk-test path=C:\\Users\\secret'),
  excludes: [
    'database',
    'raw',
    'documents',
    'personalisation_payloads',
    'platform_text',
    'secrets',
  ],
  markers: {
    startup: true,
    shutdown: true,
  },
};
const file = path.join(outDir, 'diagnostic-bundle.json');
fs.writeFileSync(file, JSON.stringify(bundle, null, 2));
console.log(
  JSON.stringify(
    { command: 'diagnostics:create', ok: true, file, excludes: bundle.excludes },
    null,
    2,
  ),
);
process.exit(0);
