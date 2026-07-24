import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Minimal SBOM-like inventory from the lockfile / package manifests. */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  name: string;
  version: string;
  packageManager?: string;
  engines?: { node?: string };
};
const lockExists = fs.existsSync(path.join(root, 'pnpm-lock.yaml'));
const out = {
  bomFormat: 'healthspan-lite-sbom',
  specVersion: '0.6',
  metadata: {
    component: { name: pkg.name, version: pkg.version },
    packageManager: pkg.packageManager ?? null,
    engines: pkg.engines ?? null,
    lockfilePresent: lockExists,
    generatedAt: new Date().toISOString(),
  },
  note: 'Lite SBOM for local CI artifact. Prefer CycloneDX tooling when available.',
};
console.log(JSON.stringify(out, null, 2));
