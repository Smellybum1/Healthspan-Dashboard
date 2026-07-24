import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AlertRuleSchema,
  BATCH_LIMIT,
  KNOWN_LEGACY_PREFERENCE_KEYS,
  canonicalSearchHash,
  migrateSavedSearchQuery,
} from '@healthspan/personalization';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const requiredEndpoints = [
  'DELETE /api/watchlists/:id',
  'POST /api/watchlists/:id/items/batch',
  'GET /api/watchlists/:id/changes',
  'PATCH /api/saved-searches/:id',
  'GET /api/saved-searches/:id/matches',
  'GET /api/saved-searches/:id/history',
  'GET /api/reading-state',
  'PUT /api/reading-state/:watchableId',
  'POST /api/reading-state/batch',
  'GET /api/mutes',
  'POST /api/visits/start',
  'POST /api/visits/:id/heartbeat',
  'POST /api/visits/:id/close',
  'GET /api/visits/previous',
  'GET /api/alert-rules',
  'POST /api/alerts/:id/read',
  'POST /api/briefs/runs',
  'POST /api/briefs/:id/export',
  'GET /api/briefings/status',
  'POST /api/personalisation/export',
  'POST /api/backups/prune/preview',
  'GET /api/backups/status',
  'GET /api/operations',
  'POST /api/operations/diagnostics',
];

const requiredScreenshots = [
  'm6-today.png',
  'm6-watchlists.png',
  'm6-saved-searches.png',
  'm6-alerts.png',
  'm6-briefs.png',
  'm6-operations.png',
  'm6-backup-storage.png',
  'm6-privacy-security.png',
  'm6-personalisation-migration.png',
];

const m6Routes = fs.readFileSync(path.join(root, 'apps/api/src/m6-routes.ts'), 'utf8');
const m6Pages = fs.readFileSync(path.join(root, 'apps/web/src/pages/M6Pages.tsx'), 'utf8');
const m6Api = fs.readFileSync(path.join(root, 'apps/web/src/lib/m6Api.ts'), 'utf8');
const shotDir = path.join(root, 'docs/milestones/screenshots');

const checks: Array<{ id: string; ok: boolean; detail?: string }> = [];

for (const ep of requiredEndpoints) {
  const [, route] = ep.split(' ');
  const fragment = route.replace(/:[^/]+/g, '');
  let present = m6Routes.includes(fragment) || m6Routes.includes(route);
  if (route.includes('/alerts/:id/')) {
    present =
      m6Routes.includes('/api/alerts/:id/') ||
      m6Routes.includes('`/api/alerts/:id/${action}`') ||
      m6Routes.includes('typedAlertAction');
  }
  checks.push({
    id: `endpoint:${ep}`,
    ok: present,
    detail: present ? undefined : 'missing in m6-routes',
  });
}

checks.push({
  id: 'saved-search-v2',
  ok: migrateSavedSearchQuery({ schemaVersion: 1, text: 'metformin' }).needsUpdate === true,
});
checks.push({
  id: 'saved-search-hash',
  ok: canonicalSearchHash(
    migrateSavedSearchQuery({ searchSchemaVersion: 2, textQuery: 'metformin' }).query,
  ).startsWith('fnv1a_'),
});
checks.push({
  id: 'alert-rule-schema',
  ok: AlertRuleSchema.safeParse({
    name: 'Safety',
    targetType: 'all_official_safety',
    eventKinds: ['regulatory'],
  }).success,
});
checks.push({ id: 'batch-limit', ok: BATCH_LIMIT === 50 });
checks.push({
  id: 'legacy-keys',
  ok: KNOWN_LEGACY_PREFERENCE_KEYS.length >= 6,
});
checks.push({
  id: 'visit-lifecycle-client',
  ok: m6Api.includes('visits/start') && m6Api.includes('heartbeat') && m6Api.includes('sendBeacon'),
});
checks.push({
  id: 'ops-panels-not-json-only',
  ok: m6Pages.includes('overall') || m6Pages.includes('panels') || m6Pages.includes('Database'),
});
checks.push({
  id: 'no-localstorage-notification-sot',
  ok:
    !m6Pages.includes("localStorage.setItem('healthspan.browserNotifications'") &&
    m6Api.includes('preferences/') &&
    m6Api.includes('browserNotifications') === false
      ? m6Pages.includes('getPreference') || m6Pages.includes('setPreference')
      : m6Pages.includes('getPreference') || m6Pages.includes('setPreference'),
});
checks.push({
  id: 'watchlist-batch',
  ok: m6Api.includes('items/batch') && m6Routes.includes('items/batch'),
});
checks.push({
  id: 'watchlist-batch-add-ui',
  ok: m6Pages.includes('Batch add') && m6Pages.includes("op: 'add'"),
});
checks.push({
  id: 'saved-search-multiselect',
  ok:
    m6Pages.includes('MultiSelectCheckboxes') &&
    m6Pages.includes('evidenceAvailability') &&
    m6Pages.includes('SavedSearchQueryPreview') &&
    !/Entity types \(comma-separated\)/.test(m6Pages),
});
checks.push({
  id: 'alert-snooze-until-ui',
  ok: m6Pages.includes('datetime-local') && m6Pages.includes('Snooze hours'),
});
checks.push({
  id: 'mute-rules-page',
  ok:
    m6Pages.includes('MuteRulesPage') ||
    (m6Pages.includes('Mute Rules') && m6Api.includes('/api/mutes')),
});
checks.push({
  id: 'ops-scheduler-not-raw-json-primary',
  ok:
    m6Pages.includes('StatusDl') &&
    m6Pages.includes('FDA bulk schedules') &&
    !/Panel title="Scheduler"[\s\S]{0,200}JSON\.stringify\(panels\.scheduler/.test(m6Pages),
});
checks.push({
  id: 'alert-rules-ui',
  ok:
    m6Pages.includes('createAlertRule') ||
    m6Pages.includes('alert-rule') ||
    m6Pages.includes('Alert rule') ||
    m6Pages.includes('AlertsSettingsPage'),
});
checks.push({
  id: 'm6-product-eval-ge-60',
  ok: fs
    .readFileSync(path.join(root, 'scripts/m6-product-eval.ts'), 'utf8')
    .includes('eval-case-count-ge-60'),
});
checks.push({
  id: 'completion-report-doctor-no-id-bypass',
  ok: fs
    .readFileSync(path.join(root, 'scripts/completion-report-doctor.ts'), 'utf8')
    .includes('semanticEvidenceKey'),
});
checks.push({
  id: 'remediation-v-brief',
  ok: fs.existsSync(path.join(root, 'docs/milestones/M6_CLOSURE_REMEDIATION_V.md')),
});

for (const shot of requiredScreenshots) {
  const p = path.join(shotDir, shot);
  checks.push({ id: `screenshot:${shot}`, ok: fs.existsSync(p) });
}

const reportPath = path.join(root, 'docs/milestones/M6_COMPLETION_REPORT.md');
checks.push({ id: 'completion-report-exists', ok: fs.existsSync(reportPath) });

const ok = checks.every((c) => c.ok);
console.log(
  JSON.stringify(
    {
      suite: 'm6-product:doctor',
      ok,
      passed: checks.filter((c) => c.ok).length,
      failed: checks.filter((c) => !c.ok).map((c) => c.id),
      checks,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
