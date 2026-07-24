import {
  DEFAULT_RETENTION_RULES,
  SecurityHeaders,
  isLoopbackHost,
  originAllowed,
  redactLogLine,
} from '@healthspan/operations';

const ok =
  isLoopbackHost('127.0.0.1') &&
  !isLoopbackHost('evil.example') &&
  originAllowed('http://127.0.0.1:5173', '127.0.0.1:8787') &&
  !originAllowed('https://evil.example', '127.0.0.1:8787') &&
  redactLogLine('authorization: Bearer secret-token-value').includes('[REDACTED]') &&
  Boolean(SecurityHeaders['X-Content-Type-Options']) &&
  DEFAULT_RETENTION_RULES.operational_events_days === 90;

console.log(JSON.stringify({ suite: 'operations:doctor', ok }, null, 2));
process.exit(ok ? 0 : 1);
