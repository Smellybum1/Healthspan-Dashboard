import { SecurityHeaders } from '@healthspan/operations';

const required = [
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
];
const missing = required.filter((k) => !SecurityHeaders[k]);
const csp = SecurityHeaders['Content-Security-Policy'] ?? '';
const ok =
  missing.length === 0 &&
  csp.includes("frame-ancestors 'none'") &&
  csp.includes("base-uri 'none'") &&
  csp.includes("object-src 'none'");
console.log(JSON.stringify({ suite: 'security:headers', missing, ok }, null, 2));
process.exit(ok ? 0 : 1);
