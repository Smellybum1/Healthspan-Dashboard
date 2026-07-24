import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const checklist = path.resolve('docs/accessibility/WCAG_2_2_AA_CHECKLIST.md');
const statesDoc = fs.existsSync(checklist);
const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const install = spawnSync(
  pnpmCmd,
  ['--filter', '@healthspan/web', 'exec', 'playwright', 'install', 'chromium'],
  { encoding: 'utf8', shell: true, env: { ...process.env } },
);

const result = spawnSync(
  pnpmCmd,
  [
    '--filter',
    '@healthspan/web',
    'exec',
    'playwright',
    'test',
    'e2e/a11y.spec.ts',
    '--project=chromium',
  ],
  {
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, CI: process.env.CI ?? '' },
  },
);

const ok = result.status === 0 && statesDoc && install.status === 0;
console.log(
  JSON.stringify(
    {
      suite: 'accessibility:audit',
      checklistPresent: statesDoc,
      playwrightInstallExit: install.status,
      playwrightExit: result.status,
      note: 'Runs Playwright + axe-core against critical routes. Not a WCAG certification claim.',
      ok,
    },
    null,
    2,
  ),
);
if (result.stdout) process.stdout.write(result.stdout.slice(-4000));
if (result.stderr) process.stderr.write(result.stderr.slice(-2000));
process.exit(ok ? 0 : 1);
