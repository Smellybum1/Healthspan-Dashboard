import { spawnSync } from 'node:child_process';
import {
  SecurityHeaders,
  createIntegritySession,
  fetchMetadataAllowed,
  hostAllowed,
  originAllowed,
  parseHostHeader,
  redactLogLine,
  validateCsrf,
  assertSafeRelPath,
  BACKUP_LIMITS,
} from '@healthspan/operations';

type Case = { id: string; ok: boolean };
const cases: Case[] = [];
function add(id: string, ok: boolean) {
  cases.push({ id, ok });
}

add('deny-origin-null', originAllowed('null', '127.0.0.1:8787') === false);
add('deny-missing-origin', originAllowed(undefined, '127.0.0.1:8787') === false);
add(
  'allow-missing-classified',
  originAllowed(undefined, '127.0.0.1:8787', { allowMissingOrigin: true }) === true,
);
add('allow-dev-origin', originAllowed('http://127.0.0.1:5173', '127.0.0.1:8787') === true);
add('deny-evil-origin', originAllowed('https://evil.test', '127.0.0.1:8787') === false);
add('host-ipv4', hostAllowed('127.0.0.1:8787') === true);
add('host-localhost', hostAllowed('localhost:8787') === true);
add('host-ipv6', hostAllowed('[::1]:8787') === true);
add('host-evil', hostAllowed('evil.example') === false);
add('parse-ipv6', parseHostHeader('[::1]:8787').hostname === '::1');
add('deny-cross-site', fetchMetadataAllowed({ secFetchSite: 'cross-site' }) === false);
add('allow-same-origin-meta', fetchMetadataAllowed({ secFetchSite: 'same-origin' }) === true);
const session = createIntegritySession();
add('csrf-valid', validateCsrf(session, session.csrfToken) === true);
add('csrf-invalid', validateCsrf(session, 'bad') === false);
add('csp-present', Boolean(SecurityHeaders['Content-Security-Policy']));
add('nosniff', SecurityHeaders['X-Content-Type-Options'] === 'nosniff');
add('redact-token', !redactLogLine('authorization=Bearer SECRET123').includes('SECRET123'));
add('redact-passphrase', redactLogLine('passphrase=hunter2').includes('[REDACTED]'));
add(
  'path-traversal-reject',
  (() => {
    try {
      assertSafeRelPath('../x');
      return false;
    } catch {
      return true;
    }
  })(),
);
add('backup-limits-configured', BACKUP_LIMITS.maxFiles > 0 && BACKUP_LIMITS.maxEntryBytes > 0);

const helperFailed = cases.filter((c) => !c.ok);

const vitest = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  [
    'exec',
    'vitest',
    'run',
    'apps/api/src/security-http.test.ts',
    'apps/api/src/backup-security.test.ts',
  ],
  { encoding: 'utf8', shell: true },
);
const integrationOk = vitest.status === 0;

console.log(
  JSON.stringify(
    {
      suite: 'security:check',
      helperCases: cases.length,
      helperFailed: helperFailed.length,
      helperFailures: helperFailed.map((f) => f.id),
      integrationExit: vitest.status,
      integrationOk,
      ok: helperFailed.length === 0 && cases.length >= 20 && integrationOk,
    },
    null,
    2,
  ),
);
process.exit(helperFailed.length === 0 && integrationOk ? 0 : 1);
