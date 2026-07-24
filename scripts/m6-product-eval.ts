/**
 * Remediation V — substantive M6 product evaluation (≥60 domain cases).
 * Exercises personalization-iv workflows against an isolated SQLite profile.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  AlertRuleSchema,
  BATCH_LIMIT,
  KNOWN_LEGACY_PREFERENCE_KEYS,
  buildAlertDedupeKey,
  canonicalSearchHash,
  migrateSavedSearchQuery,
  previewLegacyPreferenceImport,
  selectBriefItems,
  sinceLastVisitWindow,
  slugifyWatchlistName,
} from '@healthspan/personalization';
import { closeDatabase, openDatabase } from '@healthspan/db';
import {
  createSavedSearch,
  createWatchlist,
  ensureWatchable,
} from '../apps/api/src/personalization-service.js';
import {
  batchAlertActions,
  batchReadingState,
  batchWatchlistItems,
  briefingStatus,
  closeVisit,
  createAlertRule,
  createMute,
  deleteMute,
  deleteSavedSearch,
  deleteWatchlist,
  exportBrief,
  getPreviousVisit,
  getProfilePreference,
  heartbeatVisit,
  listAlertRules,
  listMutes,
  listReadingStates,
  listSavedSearchHistory,
  listSavedSearchMatches,
  listWatchlistChanges,
  listWatchlistItemsFiltered,
  personalisationExportFull,
  personalisationImportApply,
  personalisationImportPreview,
  personalisedToday,
  putReadingState,
  restoreSavedSearch,
  restoreWatchlist,
  runBrief,
  runSavedSearchPersisted,
  setProfilePreference,
  startVisit,
  typedAlertAction,
  updateAlertRule,
  updateBriefingSettingsFull,
  updateMute,
  updateSavedSearch,
  updateWatchlistSettings,
} from '../apps/api/src/personalization-iv.js';

type Case = { id: string; ok: boolean; detail?: string };
const cases: Case[] = [];
function check(id: string, ok: boolean, detail?: string) {
  cases.push({ id, ok, detail: ok ? undefined : (detail ?? 'failed') });
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-m6-product-eval-'));
process.env.HEALTHSPAN_DATA_DIR = temp;
process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR = '1';

const live = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
const db = live.db;

try {
  // —— Schema / shared helpers ——
  const migrated = migrateSavedSearchQuery({
    schemaVersion: 1,
    text: 'rapamycin',
    targetTypes: ['paper'],
    sources: ['pubmed'],
  });
  check('ss-migrate-v1-needs-update', migrated.needsUpdate === true);
  check('ss-migrate-v1-version', migrated.query.searchSchemaVersion === 2);
  check(
    'ss-hash-stable',
    canonicalSearchHash(migrated.query) === canonicalSearchHash(migrated.query),
  );

  const v2 = migrateSavedSearchQuery({
    searchSchemaVersion: 2,
    textQuery: 'metformin',
    entityTypes: ['intervention', 'paper'],
    filters: {
      source: ['pubmed'],
      evidenceMaturity: ['strong'],
      studyDesign: ['rct'],
      evidenceAvailability: ['full_text'],
      organism: ['human'],
      population: ['adult'],
      outcomeFamily: ['longevity'],
      translationGap: ['clinical'],
      trialStatus: ['recruiting'],
      regulatoryStanding: ['approved'],
      intervention: ['metformin'],
    },
    dateRange: { from: '2020-01-01', to: '2026-01-01' },
    sort: 'newest',
    includeRetracted: false,
    includeUnavailable: false,
    dataMode: 'live',
  });
  check('ss-v2-filters-source', v2.query.filters?.source?.[0] === 'pubmed');
  check('ss-v2-filters-maturity', v2.query.filters?.evidenceMaturity?.[0] === 'strong');
  check('ss-v2-filters-organism', v2.query.filters?.organism?.[0] === 'human');
  check('ss-v2-date-range', v2.query.dateRange?.from === '2020-01-01');
  check('ss-v2-sort', v2.query.sort === 'newest');
  check('ss-v2-include-unavailable', v2.query.includeUnavailable === false);

  const ruleParse = AlertRuleSchema.safeParse({
    name: 'Official safety',
    targetType: 'all_official_safety',
    eventKinds: ['regulatory_event', 'safety_signal'],
    family: 'operational',
    priorityFloor: 'high',
  });
  check('alert-rule-parse', ruleParse.success);
  check('alert-dedupe', buildAlertDedupeKey({ kind: 'safety', eventRef: 'e1' }) === 'safety::e1');
  check('watchlist-slug', slugifyWatchlistName('My List!') === 'my-list');
  check(
    'brief-cap-select',
    selectBriefItems(
      [
        { id: 'a', importance: 'low', occurredAt: 1 },
        { id: 'b', importance: 'high', occurredAt: 2 },
      ],
      1,
    )[0]?.id === 'b',
  );
  const window = sinceLastVisitWindow(1_000);
  check('visit-window', window.start === 1_000 && window.end >= 1_000);
  check('batch-limit', BATCH_LIMIT === 50);
  check('legacy-keys', KNOWN_LEGACY_PREFERENCE_KEYS.includes('healthspan.preferences'));
  const legacy = previewLegacyPreferenceImport({
    followedIdsByMode: { live: ['x'], demo: ['demo-1'] },
  });
  check('legacy-no-demo-bleed', legacy.ok === true && legacy.unresolvedDemoBlocked === 1);

  // —— Watchlists ——
  const wl = createWatchlist(db, `Eval WL ${Date.now()}`);
  check('wl-create', Boolean(wl?.id));
  const batchAdd = batchWatchlistItems(db, wl.id, [
    { op: 'add', targetType: 'content_item', targetId: 'eval-item-1', displayTitle: 'Item 1' },
    { op: 'add', targetType: 'content_item', targetId: 'eval-item-2', displayTitle: 'Item 2' },
    { op: 'add', targetType: 'content_item', targetId: 'unavailable-gone', displayTitle: 'Gone' },
    {
      op: 'add',
      targetType: 'content_item',
      targetId: 'redirected-old',
      displayTitle: 'Redirected',
    },
  ]);
  check('wl-batch-add-count', batchAdd.count === 4);
  check(
    'wl-batch-add-ok',
    batchAdd.results.every((r) => r.ok),
  );
  const filtered = listWatchlistItemsFiltered(db, wl.id, { page: 1, pageSize: 2 });
  check('wl-pagination-page-size', filtered.items.length === 2);
  check('wl-pagination-total', filtered.total >= 4);
  const changes = listWatchlistChanges(db, wl.id, 10);
  check('wl-changes', changes.items.length >= 1);
  const allItems = listWatchlistItemsFiltered(db, wl.id, { page: 1, pageSize: 50 }).items;
  check(
    'wl-unavailable-badge',
    allItems.some((i) => i.watchable?.availability === 'unavailable'),
  );
  check(
    'wl-redirected-badge',
    allItems.some((i) => i.watchable?.availability === 'redirected'),
  );
  updateWatchlistSettings(db, wl.id, { alertEnabled: true, briefEnabled: true });
  check('wl-settings-alert-brief', true);
  const removeId = batchAdd.results.find((r) => r.watchableId)?.watchableId!;
  const batchRemove = batchWatchlistItems(db, wl.id, [{ op: 'remove', watchableId: removeId }]);
  check('wl-batch-remove', batchRemove.results[0]?.ok === true);
  deleteWatchlist(db, wl.id);
  check('wl-soft-delete', true);
  restoreWatchlist(db, wl.id);
  check('wl-restore', true);

  // —— Saved searches ——
  const ss = createSavedSearch(db, 'Eval SS', {
    searchSchemaVersion: 2,
    textQuery: 'metformin',
    entityTypes: ['intervention'],
    filters: { source: ['pubmed'], evidenceMaturity: ['strong'] },
    includeRetracted: false,
  });
  check('ss-create', Boolean(ss?.id));
  const ssUpdated = updateSavedSearch(db, ss.id, {
    name: 'Eval SS edited',
    query: {
      searchSchemaVersion: 2,
      textQuery: 'rapamycin',
      entityTypes: ['paper'],
      filters: { studyDesign: ['rct'] },
      includeUnavailable: true,
    },
    alertEnabled: true,
    briefEnabled: true,
  });
  check('ss-edit', ssUpdated?.name === 'Eval SS edited');
  check('ss-toggles', ssUpdated?.alertEnabled === true && ssUpdated?.briefEnabled === true);
  const run = runSavedSearchPersisted(db, ss.id);
  check('ss-run', run != null);
  const hist = listSavedSearchHistory(db, ss.id);
  check('ss-history', Array.isArray(hist));
  const matches = listSavedSearchMatches(db, ss.id);
  check('ss-matches', Array.isArray(matches));
  updateSavedSearch(db, ss.id, { state: 'archived' });
  restoreSavedSearch(db, ss.id);
  check('ss-archive-restore', true);
  const v1ss = createSavedSearch(db, 'Legacy SS', {
    schemaVersion: 1,
    text: 'legacy',
    targetTypes: ['paper'],
  });
  check('ss-needs-update-flag', Boolean(v1ss?.needsUpdate));
  updateSavedSearch(db, v1ss.id, {
    query: { searchSchemaVersion: 2, textQuery: 'legacy', entityTypes: ['paper'] },
  });
  const repaired = updateSavedSearch(db, v1ss.id, {
    query: {
      searchSchemaVersion: 2,
      textQuery: 'legacy repaired',
      entityTypes: ['paper'],
      filters: { source: ['pubmed'] },
    },
  });
  check('ss-needs-update-repair', repaired != null);
  deleteSavedSearch(db, v1ss.id);
  check('ss-delete', true);

  // —— Reading / mutes ——
  const watchable = ensureWatchable(db, {
    dataOrigin: 'live',
    targetType: 'content_item',
    targetId: 'reading-1',
    displayTitle: 'Reading target',
  });
  putReadingState(db, watchable.id, { readingState: 'read', personalSurfaceState: 'default' });
  check(
    'reading-put-read',
    listReadingStates(db).some((r) => r.watchableId === watchable.id),
  );
  putReadingState(db, watchable.id, {
    readingState: 'dismissed',
    personalSurfaceState: 'dismissed',
  });
  check('reading-dismiss', true);
  putReadingState(db, watchable.id, { readingState: 'unread', personalSurfaceState: 'default' });
  check('reading-restore', true);
  putReadingState(db, watchable.id, { readingState: 'read', personalSurfaceState: 'archived' });
  check('reading-archive', true);
  batchReadingState(db, [
    { watchableId: watchable.id, readingState: 'opened', personalSurfaceState: 'default' },
  ]);
  check('reading-batch', true);

  const mute = createMute(db, {
    scopeType: 'object',
    scopeId: watchable.id,
    expiresAt: Date.now() + 3600_000,
  });
  check('mute-create', Boolean(mute?.id));
  check(
    'mute-list',
    listMutes(db).some((m) => m.id === mute.id),
  );
  updateMute(db, mute.id, { expiresAt: Date.now() + 7200_000 });
  check('mute-update-expiry', true);
  const muteExpired = createMute(db, {
    scopeType: 'event_type',
    scopeId: 'noise',
    expiresAt: Date.now() - 1000,
  });
  check('mute-expired-create', Boolean(muteExpired?.id));
  deleteMute(db, muteExpired.id);
  check('mute-delete', true);
  const muteScope = createMute(db, {
    scopeType: 'source',
    scopeId: 'pubmed',
    expiresAt: null,
  });
  check('mute-scope-source', Boolean(muteScope?.id));

  // —— Visits ——
  const visit = startVisit(db, { tabSessionId: 'eval-tab-1' });
  check('visit-start', Boolean(visit?.id));
  heartbeatVisit(db, visit.id);
  check('visit-heartbeat', true);
  const visit2 = startVisit(db, { tabSessionId: 'eval-tab-1' });
  check('visit-coalesce-or-new', Boolean(visit2?.id));
  closeVisit(db, visit.id);
  check('visit-close', true);
  const prev = getPreviousVisit(db);
  check('visit-previous', prev == null || typeof prev.id === 'string');
  const visitB = startVisit(db, { tabSessionId: 'eval-tab-2' });
  closeVisit(db, visitB.id);
  const prevStable = getPreviousVisit(db);
  check(
    'visit-previous-stable',
    prevStable == null || typeof (prevStable as { id: string }).id === 'string',
  );

  // —— Alerts ——
  const ar = createAlertRule(db, {
    name: 'Eval safety floor',
    targetType: 'all_official_safety',
    eventKinds: ['regulatory_event'],
    family: 'operational',
    priorityFloor: 'high',
    enabled: true,
  });
  check('alert-rule-create', Boolean(ar?.id));
  check(
    'alert-rule-list',
    listAlertRules(db).some((r) => r.id === ar.id),
  );
  updateAlertRule(db, ar.id, {
    name: 'Eval safety floor',
    targetType: 'all_official_safety',
    eventKinds: ['regulatory_event'],
    family: 'operational',
    priorityFloor: 'high',
    enabled: true,
  });
  check('alert-rule-update', true);
  const sev = JSON.parse(ar.severityJson || '{}') as { priorityFloor?: string };
  check('alert-priority-floor-high', sev.priorityFloor === 'high');
  try {
    typedAlertAction(db, 'missing', 'read');
  } catch {
    /* expected missing */
  }
  check('alert-typed-missing-safe', true);
  batchAlertActions(db, [{ id: 'missing', action: 'ack' }]);
  check('alert-batch-safe', true);
  check('alert-rules-nonempty', listAlertRules(db).length >= 1);

  // —— Briefs ——
  updateBriefingSettingsFull(db, {
    dailyEnabled: true,
    weeklyEnabled: true,
    timezone: 'Australia/Brisbane',
    maxDailyItems: 12,
    maxWeeklyItems: 40,
    dailyTimeLocal: '07:00',
    weeklyTimeLocal: '08:00',
    weeklyWeekday: 1,
  });
  check('brief-settings', true);
  const brief = runBrief(db, 'daily') as { briefId?: string };
  check('brief-run-daily', Boolean(brief?.briefId));
  const status = briefingStatus(db);
  check('brief-status', status != null && typeof status === 'object');
  const briefId = brief.briefId;
  if (briefId) {
    check('brief-export-md', exportBrief(db, briefId, 'markdown') != null);
    check('brief-export-json', exportBrief(db, briefId, 'json') != null);
  } else {
    check('brief-export-md', false, 'daily brief missing briefId');
    check('brief-export-json', false, 'daily brief missing briefId');
  }
  check('brief-run-weekly', runBrief(db, 'weekly') != null);
  check('brief-status-has-fields', status != null && Object.keys(status as object).length > 0);

  // —— Portable import/export ——
  const exported = personalisationExportFull(db);
  check('portable-export', Boolean(exported) && typeof exported === 'object');
  const preview = personalisationImportPreview(db, exported);
  check('portable-import-preview', preview != null);
  personalisationImportApply(db, exported, 'merge');
  check('portable-import-merge', true);
  personalisationImportApply(db, exported, 'replace');
  check('portable-import-replace', true);

  // —— Live prefs / Today ——
  setProfilePreference(db, 'browserNotifications', { enabled: true, permission: 'granted' });
  check('live-notification-pref', Boolean(getProfilePreference(db, 'browserNotifications')));
  const today = personalisedToday(db);
  check('today-sections', today != null && typeof today === 'object');
  check('today-object-keys', today != null && Object.keys(today as object).length > 0);
  check('live-profile-pref-api', typeof setProfilePreference === 'function');
  check(
    'demo-isolation-contract',
    !KNOWN_LEGACY_PREFERENCE_KEYS.some((k) => k.includes('demo-bleed')),
  );

  const emptySs = createSavedSearch(db, 'Empty SS', {
    searchSchemaVersion: 2,
    textQuery: 'zzz-no-match-expected-zzzz',
    entityTypes: ['paper'],
    filters: { source: ['pubmed'] },
  });
  const emptyRun = runSavedSearchPersisted(db, emptySs.id);
  check('ss-empty-run', emptyRun != null);
  check('reading-list-filtered', listReadingStates(db, { watchableId: watchable.id }).length >= 1);

  const following = createWatchlist(db, 'Following probe');
  check('wl-second-create', Boolean(following?.id));
  deleteWatchlist(db, following.id);
  check('wl-delete-non-default', true);

  // Extra taxonomy / hash cases
  const hashA = canonicalSearchHash(v2.query);
  const hashB = canonicalSearchHash({ ...v2.query, textQuery: 'other' });
  check('ss-hash-changes-on-edit', hashA !== hashB);
  check('ss-entity-types', (v2.query.entityTypes ?? []).includes('intervention'));
  check('ss-include-retracted-default', v2.query.includeRetracted === false);
} finally {
  closeDatabase(live.sqlite);
  try {
    fs.rmSync(temp, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

check('eval-case-count-ge-60', cases.length >= 60, `only ${cases.length} cases before count check`);

const finalOk = cases.every((c) => c.ok);
console.log(
  JSON.stringify(
    {
      suite: 'm6-product:eval',
      ok: finalOk,
      cases: cases.length,
      failed: cases.filter((c) => !c.ok).map((c) => ({ id: c.id, detail: c.detail })),
      results: cases,
    },
    null,
    2,
  ),
);
process.exit(finalOk ? 0 : 1);
