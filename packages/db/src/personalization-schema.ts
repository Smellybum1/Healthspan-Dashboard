import { integer, sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

const id = () => text('id').primaryKey();
const ts = (name: string) => integer(name, { mode: 'number' }).notNull();
const tsNull = (name: string) => integer(name, { mode: 'number' });
const bool = (name: string) => integer(name, { mode: 'boolean' }).notNull().default(false);

export const localProfiles = sqliteTable('local_profiles', {
  id: id(),
  kind: text('kind').notNull().default('local_single_user'),
  active: bool('active').default(true),
  timezone: text('timezone').notNull().default('Australia/Brisbane'),
  schemaVersion: integer('schema_version').notNull().default(1),
  createdAt: ts('created_at'),
  updatedAt: ts('updated_at'),
});

export const profilePreferences = sqliteTable(
  'profile_preferences',
  {
    id: id(),
    profileId: text('profile_id').notNull(),
    preferenceKey: text('preference_key').notNull(),
    valueJson: text('value_json').notNull(),
    valueVersion: integer('value_version').notNull().default(1),
    source: text('source').notNull().default('default'),
    updatedAt: ts('updated_at'),
  },
  (t) => [uniqueIndex('profile_preferences_unique').on(t.profileId, t.preferenceKey)],
);

export const preferenceMigrationRuns = sqliteTable('preference_migration_runs', {
  id: id(),
  profileId: text('profile_id').notNull(),
  browserIdentityHash: text('browser_identity_hash').notNull(),
  sourceSchemaVersion: integer('source_schema_version').notNull(),
  previewCount: integer('preview_count').notNull().default(0),
  importedCount: integer('imported_count').notNull().default(0),
  skippedCount: integer('skipped_count').notNull().default(0),
  unresolvedCount: integer('unresolved_count').notNull().default(0),
  status: text('status').notNull(),
  errorSummary: text('error_summary'),
  createdAt: ts('created_at'),
  completedAt: tsNull('completed_at'),
});

export const watchableObjects = sqliteTable(
  'watchable_objects',
  {
    id: id(),
    dataOrigin: text('data_origin').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    displayTitle: text('display_title'),
    canonicalUrl: text('canonical_url'),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
  },
  (t) => [uniqueIndex('watchable_objects_unique').on(t.dataOrigin, t.targetType, t.targetId)],
);

export const watchlists = sqliteTable(
  'watchlists',
  {
    id: id(),
    profileId: text('profile_id').notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    isDefault: bool('is_default').default(false),
    active: bool('active').default(true),
    alertEnabled: bool('alert_enabled').default(false),
    briefEnabled: bool('brief_enabled').default(true),
    deletedAt: tsNull('deleted_at'),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
  },
  (t) => [uniqueIndex('watchlists_profile_slug').on(t.profileId, t.slug)],
);

export const watchlistEntries = sqliteTable(
  'watchlist_entries',
  {
    id: id(),
    watchlistId: text('watchlist_id').notNull(),
    watchableId: text('watchable_id').notNull(),
    priority: integer('priority').notNull().default(100),
    state: text('state').notNull().default('active'),
    source: text('source').notNull().default('user'),
    addedAt: ts('added_at'),
    removedAt: tsNull('removed_at'),
  },
  (t) => [
    uniqueIndex('watchlist_entries_active_unique').on(t.watchlistId, t.watchableId, t.state),
    index('watchlist_entries_watchable').on(t.watchableId),
  ],
);

export const savedSearches = sqliteTable('saved_searches', {
  id: id(),
  profileId: text('profile_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  querySchemaVersion: integer('query_schema_version').notNull().default(1),
  queryJson: text('query_json').notNull(),
  canonicalHash: text('canonical_hash').notNull(),
  state: text('state').notNull().default('active'),
  alertEnabled: bool('alert_enabled').default(false),
  briefEnabled: bool('brief_enabled').default(true),
  needsUpdate: bool('needs_update').default(false),
  createdAt: ts('created_at'),
  updatedAt: ts('updated_at'),
});

export const savedSearchEvaluations = sqliteTable('saved_search_evaluations', {
  id: id(),
  savedSearchId: text('saved_search_id').notNull(),
  windowStart: tsNull('window_start'),
  windowEnd: tsNull('window_end'),
  queryHash: text('query_hash').notNull(),
  status: text('status').notNull(),
  matchedCount: integer('matched_count').notNull().default(0),
  newCount: integer('new_count').notNull().default(0),
  cappedCount: integer('capped_count').notNull().default(0),
  errorSummary: text('error_summary'),
  startedAt: ts('started_at'),
  completedAt: tsNull('completed_at'),
});

export const savedSearchMatches = sqliteTable(
  'saved_search_matches',
  {
    id: id(),
    savedSearchId: text('saved_search_id').notNull(),
    watchableId: text('watchable_id').notNull(),
    firstMatchedAt: ts('first_matched_at'),
    lastMatchedAt: ts('last_matched_at'),
    matchState: text('match_state').notNull().default('current'),
    matchVersion: integer('match_version').notNull().default(1),
  },
  (t) => [uniqueIndex('saved_search_matches_unique').on(t.savedSearchId, t.watchableId)],
);

export const readingStates = sqliteTable(
  'reading_states',
  {
    id: id(),
    profileId: text('profile_id').notNull(),
    watchableId: text('watchable_id').notNull(),
    readingState: text('reading_state').notNull().default('unread'),
    personalSurfaceState: text('personal_surface_state').notNull().default('default'),
    openedAt: tsNull('opened_at'),
    dismissedAt: tsNull('dismissed_at'),
    updatedAt: ts('updated_at'),
  },
  (t) => [uniqueIndex('reading_states_unique').on(t.profileId, t.watchableId)],
);

export const readingStateEvents = sqliteTable('reading_state_events', {
  id: id(),
  profileId: text('profile_id').notNull(),
  watchableId: text('watchable_id').notNull(),
  fromState: text('from_state'),
  toState: text('to_state').notNull(),
  createdAt: ts('created_at'),
});

export const muteRules = sqliteTable('mute_rules', {
  id: id(),
  profileId: text('profile_id').notNull(),
  scopeType: text('scope_type').notNull(),
  scopeId: text('scope_id'),
  scopeEventType: text('scope_event_type'),
  reason: text('reason'),
  active: bool('active').default(true),
  createdAt: ts('created_at'),
  expiresAt: tsNull('expires_at'),
});

export const visitSessions = sqliteTable('visit_sessions', {
  id: id(),
  profileId: text('profile_id').notNull(),
  startedAt: ts('started_at'),
  endedAt: tsNull('ended_at'),
  clientInstallationId: text('client_installation_id'),
  tabSessionId: text('tab_session_id'),
  lastHeartbeatAt: tsNull('last_heartbeat_at'),
  status: text('status').notNull().default('open'),
  previousCutoffAt: tsNull('previous_cutoff_at'),
  summaryJson: text('summary_json').notNull().default('{}'),
});

export const alertRules = sqliteTable('alert_rules', {
  id: id(),
  profileId: text('profile_id').notNull(),
  name: text('name').notNull(),
  enabled: bool('enabled').default(true),
  targetType: text('target_type').notNull(),
  targetRef: text('target_ref'),
  eventKindsJson: text('event_kinds_json').notNull().default('[]'),
  severityJson: text('severity_json').notNull().default('{}'),
  createdAt: ts('created_at'),
  updatedAt: ts('updated_at'),
});

export const alerts = sqliteTable(
  'alerts',
  {
    id: id(),
    profileId: text('profile_id').notNull(),
    ruleId: text('rule_id'),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    severityJson: text('severity_json').notNull().default('{}'),
    whyIncludedJson: text('why_included_json').notNull().default('{}'),
    watchableId: text('watchable_id'),
    dedupeKey: text('dedupe_key').notNull(),
    state: text('state').notNull().default('new'),
    importance: text('importance').notNull().default('medium'),
    family: text('family').notNull().default('research'),
    snoozeUntil: tsNull('snooze_until'),
    occurredAt: ts('occurred_at'),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
  },
  (t) => [uniqueIndex('alerts_dedupe').on(t.profileId, t.dedupeKey)],
);

export const alertStateEvents = sqliteTable('alert_state_events', {
  id: id(),
  alertId: text('alert_id').notNull(),
  fromState: text('from_state'),
  toState: text('to_state').notNull(),
  createdAt: ts('created_at'),
});

export const alertDeliveries = sqliteTable('alert_deliveries', {
  id: id(),
  alertId: text('alert_id').notNull(),
  channel: text('channel').notNull().default('in_app'),
  status: text('status').notNull(),
  deliveredAt: tsNull('delivered_at'),
  errorSummary: text('error_summary'),
});

export const briefingSettings = sqliteTable(
  'briefing_settings',
  {
    id: id(),
    profileId: text('profile_id').notNull(),
    dailyEnabled: bool('daily_enabled').default(true),
    weeklyEnabled: bool('weekly_enabled').default(true),
    timezone: text('timezone').notNull().default('Australia/Brisbane'),
    dailyTimeLocal: text('daily_time_local').notNull().default('07:15'),
    weeklyTimeLocal: text('weekly_time_local').notNull().default('09:00'),
    weeklyWeekday: integer('weekly_weekday').notNull().default(0),
    maxDailyItems: integer('max_daily_items').notNull().default(20),
    maxWeeklyItems: integer('max_weekly_items').notNull().default(40),
    updatedAt: ts('updated_at'),
  },
  (t) => [uniqueIndex('briefing_settings_profile').on(t.profileId)],
);

export const briefingRuns = sqliteTable('briefing_runs', {
  id: id(),
  profileId: text('profile_id').notNull(),
  kind: text('kind').notNull(),
  status: text('status').notNull(),
  windowStart: ts('window_start'),
  windowEnd: ts('window_end'),
  itemCount: integer('item_count').notNull().default(0),
  errorSummary: text('error_summary'),
  startedAt: ts('started_at'),
  completedAt: tsNull('completed_at'),
});

export const briefs = sqliteTable('briefs', {
  id: id(),
  profileId: text('profile_id').notNull(),
  runId: text('run_id'),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  windowStart: ts('window_start'),
  windowEnd: ts('window_end'),
  sourceCoverageJson: text('source_coverage_json').notNull().default('{}'),
  overflowCount: integer('overflow_count').notNull().default(0),
  createdAt: ts('created_at'),
});

export const briefItems = sqliteTable('brief_items', {
  id: id(),
  briefId: text('brief_id').notNull(),
  watchableId: text('watchable_id'),
  title: text('title').notNull(),
  summary: text('summary'),
  reason: text('reason'),
  rank: integer('rank').notNull().default(100),
  readingState: text('reading_state').notNull().default('unread'),
  payloadJson: text('payload_json').notNull().default('{}'),
});

export const briefItemDependencies = sqliteTable('brief_item_dependencies', {
  id: id(),
  briefItemId: text('brief_item_id').notNull(),
  dependencyKind: text('dependency_kind').notNull(),
  dependencyRef: text('dependency_ref').notNull(),
});

export const personalisationImportsExports = sqliteTable('personalisation_imports_exports', {
  id: id(),
  profileId: text('profile_id').notNull(),
  direction: text('direction').notNull(),
  formatVersion: integer('format_version').notNull().default(1),
  status: text('status').notNull(),
  itemCount: integer('item_count').notNull().default(0),
  sanitizedSummary: text('sanitized_summary'),
  createdAt: ts('created_at'),
  completedAt: tsNull('completed_at'),
});

export const backupRecords = sqliteTable('backup_records', {
  id: id(),
  profileId: text('profile_id'),
  kind: text('kind').notNull().default('full'),
  status: text('status').notNull(),
  manifestJson: text('manifest_json').notNull().default('{}'),
  archiveSha256: text('archive_sha256'),
  byteLength: integer('byte_length'),
  createdAt: ts('created_at'),
  completedAt: tsNull('completed_at'),
  errorSummary: text('error_summary'),
});

export const restoreRecords = sqliteTable('restore_records', {
  id: id(),
  backupId: text('backup_id'),
  status: text('status').notNull(),
  preflightJson: text('preflight_json').notNull().default('{}'),
  createdAt: ts('created_at'),
  completedAt: tsNull('completed_at'),
  errorSummary: text('error_summary'),
});

export const retentionPolicies = sqliteTable('retention_policies', {
  id: id(),
  name: text('name').notNull(),
  scope: text('scope').notNull(),
  rulesJson: text('rules_json').notNull().default('{}'),
  enabled: bool('enabled').default(true),
  updatedAt: ts('updated_at'),
});

export const retentionRuns = sqliteTable('retention_runs', {
  id: id(),
  policyId: text('policy_id'),
  status: text('status').notNull(),
  deletedCount: integer('deleted_count').notNull().default(0),
  startedAt: ts('started_at'),
  completedAt: tsNull('completed_at'),
  summary: text('summary'),
});

export const storageUsageSnapshots = sqliteTable('storage_usage_snapshots', {
  id: id(),
  capturedAt: ts('captured_at'),
  category: text('category').notNull(),
  byteLength: integer('byte_length').notNull(),
  fileCount: integer('file_count').notNull().default(0),
});

export const operationalEvents = sqliteTable('operational_events', {
  id: id(),
  kind: text('kind').notNull(),
  severity: text('severity').notNull().default('info'),
  message: text('message').notNull(),
  detailsJson: text('details_json').notNull().default('{}'),
  createdAt: ts('created_at'),
});

export const operationalMetricBuckets = sqliteTable(
  'operational_metric_buckets',
  {
    id: id(),
    metric: text('metric').notNull(),
    bucketStart: ts('bucket_start'),
    bucketEnd: ts('bucket_end'),
    value: integer('value').notNull().default(0),
    dimensionsJson: text('dimensions_json').notNull().default('{}'),
  },
  (t) => [uniqueIndex('operational_metric_buckets_unique').on(t.metric, t.bucketStart)],
);

export const applicationRuns = sqliteTable('application_runs', {
  id: id(),
  startedAt: ts('started_at'),
  endedAt: tsNull('ended_at'),
  runtimeMajor: integer('runtime_major'),
  appVersion: text('app_version'),
  schemaVersion: integer('schema_version'),
  mode: text('mode').notNull().default('api'),
});

export const diagnosticBundles = sqliteTable('diagnostic_bundles', {
  id: id(),
  status: text('status').notNull(),
  manifestJson: text('manifest_json').notNull().default('{}'),
  createdAt: ts('created_at'),
  completedAt: tsNull('completed_at'),
  errorSummary: text('error_summary'),
});

export const securityAuditRuns = sqliteTable('security_audit_runs', {
  id: id(),
  status: text('status').notNull(),
  findingsJson: text('findings_json').notNull().default('[]'),
  createdAt: ts('created_at'),
  completedAt: tsNull('completed_at'),
});
