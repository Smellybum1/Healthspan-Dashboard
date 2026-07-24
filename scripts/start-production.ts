/**
 * Production-local single-origin start: build artifacts + API on loopback.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webDist = path.join(root, 'apps/web/dist/index.html');
if (!fs.existsSync(webDist)) {
  console.error('Web build missing. Run `pnpm build` first.');
  process.exit(1);
}

process.env.HEALTHSPAN_SERVE_WEB = '1';
process.env.HEALTHSPAN_WEB_DIST = path.join(root, 'apps/web/dist');
process.env.API_HOST = process.env.API_HOST ?? '127.0.0.1';
process.env.API_PORT = process.env.API_PORT ?? '8787';

const child = spawn(process.execPath, [path.join(root, 'apps/api/dist/index.js')], {
  stdio: 'inherit',
  env: process.env,
  cwd: root,
});
child.on('exit', (code) => process.exit(code ?? 1));
