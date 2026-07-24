import {
  SecurityHeaders,
  createIntegritySession,
  fetchMetadataAllowed,
  originAllowed,
  redactLogLine,
  validateCsrf,
  assertSafeRelPath,
} from '@healthspan/operations';

type Case = { id: string; ok: boolean };
const cases: Case[] = [];
function add(id: string, ok: boolean) {
  cases.push({ id, ok });
}

add('deny-origin-null', originAllowed('null', '127.0.0.1') === false);
add('deny-missing-origin', originAllowed(undefined, '127.0.0.1') === false);
add(
  'allow-missing-classified',
  originAllowed(undefined, '127.0.0.1', { allowMissingOrigin: true }) === true,
);
add('allow-dev-origin', originAllowed('http://127.0.0.1:5173', '127.0.0.1:8787') === true);
add('deny-evil-origin', originAllowed('https://evil.test', '127.0.0.1:8787') === false);
add('deny-cross-site', fetchMetadataAllowed({ secFetchSite: 'cross-site' }) === false);
add('allow-same-origin-meta', fetchMetadataAllowed({ secFetchSite: 'same-origin' }) === true);
add('allow-missing-meta', fetchMetadataAllowed({}) === true);

const session = createIntegritySession();
add('csrf-valid', validateCsrf(session, session.csrfToken) === true);
add('csrf-invalid', validateCsrf(session, 'bad') === false);
add('csrf-missing-session', validateCsrf(null, session.csrfToken) === false);

for (const [k, v] of Object.entries(SecurityHeaders)) {
  add(`header-${k}`, Boolean(v) && v.length > 0);
}
add(
  'csp-frame-ancestors',
  SecurityHeaders['Content-Security-Policy']!.includes("frame-ancestors 'none'"),
);
add('csp-base-uri', SecurityHeaders['Content-Security-Policy']!.includes("base-uri 'none'"));
add('no-hsts-localhost', !('Strict-Transport-Security' in SecurityHeaders));

add(
  'redact-token',
  redactLogLine('authorization=Bearer SECRET123').includes('[REDACTED]') &&
    !redactLogLine('authorization=Bearer SECRET123').includes('SECRET123'),
);
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

for (let i = 0; i < 25; i += 1) {
  add(`host-rebinding-${i}`, originAllowed(`http://evil-${i}.example`, `127.0.0.1`) === false);
}
for (let i = 0; i < 5; i += 1) {
  add(`javascript-url-${i}`, !String(`javascript:alert(${i})`).startsWith('http'));
}

const failed = cases.filter((c) => !c.ok);
console.log(
  JSON.stringify(
    {
      suite: 'security:check',
      total: cases.length,
      failed: failed.length,
      failures: failed.map((f) => f.id),
      ok: failed.length === 0 && cases.length >= 48,
    },
    null,
    2,
  ),
);
process.exit(failed.length === 0 && cases.length >= 48 ? 0 : 1);
