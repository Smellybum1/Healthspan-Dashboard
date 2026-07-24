import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

const id = () => text('id').primaryKey();
const ts = (name: string) => integer(name, { mode: 'number' }).notNull();
const tsNull = (name: string) => integer(name, { mode: 'number' });
const bool = (name: string) => integer(name, { mode: 'boolean' }).notNull().default(false);

export const sources = sqliteTable('sources', {
  id: id(),
  displayName: text('display_name').notNull(),
  kind: text('kind').notNull(),
  officialBaseUrl: text('official_base_url').notNull(),
  enabled: bool('enabled').default(true),
  healthState: text('health_state').notNull().default('never_run'),
  lastAttemptAt: tsNull('last_attempt_at'),
  lastSuccessAt: tsNull('last_success_at'),
  lastFailureAt: tsNull('last_failure_at'),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  lastError: text('last_error'),
  /** First successful import completed at (source-scoped baseline). */
  baselineCompletedAt: tsNull('baseline_completed_at'),
  createdAt: ts('created_at'),
  updatedAt: ts('updated_at'),
});

export const sourceFeeds = sqliteTable(
  'source_feeds',
  {
    id: id(),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    feedKey: text('feed_key').notNull(),
    url: text('url').notNull(),
    category: text('category').notNull(),
    enabled: bool('enabled').default(true),
    etag: text('etag'),
    lastModified: text('last_modified'),
    lastCheckedAt: tsNull('last_checked_at'),
    lastSuccessAt: tsNull('last_success_at'),
    /** First successful feed import completed at (TGA child-feed baseline). */
    baselineCompletedAt: tsNull('baseline_completed_at'),
  },
  (t) => [uniqueIndex('source_feeds_source_key').on(t.sourceId, t.feedKey)],
);

export const connectorCheckpoints = sqliteTable(
  'connector_checkpoints',
  {
    id: id(),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    feedId: text('feed_id').references(() => sourceFeeds.id),
    connectorVersion: text('connector_version').notNull(),
    checkpointSchemaVersion: integer('checkpoint_schema_version').notNull().default(1),
    cursorJson: text('cursor_json').notNull().default('{}'),
    windowStartAt: tsNull('window_start_at'),
    windowEndAt: tsNull('window_end_at'),
    updatedAt: ts('updated_at'),
  },
  (t) => [uniqueIndex('checkpoints_source_feed').on(t.sourceId, t.feedId)],
);

export const ingestionRuns = sqliteTable('ingestion_runs', {
  id: id(),
  sourceId: text('source_id').references(() => sources.id),
  parentRunId: text('parent_run_id'),
  trigger: text('trigger').notNull(),
  status: text('status').notNull(),
  startedAt: ts('started_at'),
  completedAt: tsNull('completed_at'),
  cursorBeforeJson: text('cursor_before_json'),
  cursorAfterJson: text('cursor_after_json'),
  fetchedPageCount: integer('fetched_page_count').notNull().default(0),
  remoteRecordCount: integer('remote_record_count').notNull().default(0),
  rawSnapshotCount: integer('raw_snapshot_count').notNull().default(0),
  newObjectCount: integer('new_object_count').notNull().default(0),
  newVersionCount: integer('new_version_count').notNull().default(0),
  unchangedCount: integer('unchanged_count').notNull().default(0),
  contentUpsertCount: integer('content_upsert_count').notNull().default(0),
  changeEventCount: integer('change_event_count').notNull().default(0),
  warningCount: integer('warning_count').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),
  summary: text('summary'),
});

export const ingestionRunErrors = sqliteTable('ingestion_run_errors', {
  id: id(),
  runId: text('run_id')
    .notNull()
    .references(() => ingestionRuns.id),
  sourceId: text('source_id').references(() => sources.id),
  externalId: text('external_id'),
  stage: text('stage').notNull(),
  errorCode: text('error_code').notNull(),
  message: text('message').notNull(),
  retryable: bool('retryable').default(false),
  createdAt: ts('created_at'),
  diagnosticsJson: text('diagnostics_json'),
});

export const rawSnapshots = sqliteTable(
  'raw_snapshots',
  {
    id: id(),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    feedId: text('feed_id').references(() => sourceFeeds.id),
    sha256: text('sha256').notNull(),
    storageKey: text('storage_key').notNull(),
    mediaType: text('media_type').notNull(),
    encoding: text('encoding'),
    compression: text('compression').notNull().default('gzip'),
    byteLength: integer('byte_length').notNull(),
    compressedByteLength: integer('compressed_byte_length').notNull(),
    retrievedAt: ts('retrieved_at'),
    etag: text('etag'),
    lastModified: text('last_modified'),
    requestFingerprint: text('request_fingerprint'),
    connectorVersion: text('connector_version').notNull(),
    parserVersion: text('parser_version').notNull(),
  },
  (t) => [uniqueIndex('raw_snapshots_source_hash').on(t.sourceId, t.sha256)],
);

export const ingestionRunSnapshots = sqliteTable(
  'ingestion_run_snapshots',
  {
    runId: text('run_id')
      .notNull()
      .references(() => ingestionRuns.id),
    rawSnapshotId: text('raw_snapshot_id')
      .notNull()
      .references(() => rawSnapshots.id),
  },
  (t) => [uniqueIndex('run_snapshots_pk').on(t.runId, t.rawSnapshotId)],
);

export const sourceObjects = sqliteTable(
  'source_objects',
  {
    id: id(),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    externalId: text('external_id').notNull(),
    firstSeenAt: ts('first_seen_at'),
    lastSeenAt: ts('last_seen_at'),
    currentVersionId: text('current_version_id'),
    sourceCreatedAt: tsNull('source_created_at'),
    sourceUpdatedAt: tsNull('source_updated_at'),
    canonicalUrl: text('canonical_url'),
  },
  (t) => [uniqueIndex('source_objects_external').on(t.sourceId, t.externalId)],
);

export const sourceRecordVersions = sqliteTable(
  'source_record_versions',
  {
    id: id(),
    sourceObjectId: text('source_object_id')
      .notNull()
      .references(() => sourceObjects.id),
    versionNumber: integer('version_number').notNull(),
    rawSnapshotId: text('raw_snapshot_id')
      .notNull()
      .references(() => rawSnapshots.id),
    normalizedHash: text('normalized_hash').notNull(),
    sourceTimestamp: tsNull('source_timestamp'),
    firstObservedAt: ts('first_observed_at'),
    parserVersion: text('parser_version').notNull(),
    validationStatus: text('validation_status').notNull().default('ok'),
    diagnosticsJson: text('diagnostics_json'),
  },
  (t) => [
    uniqueIndex('source_versions_hash').on(t.sourceObjectId, t.normalizedHash),
    uniqueIndex('source_versions_number').on(t.sourceObjectId, t.versionNumber),
  ],
);

export const contentItems = sqliteTable(
  'content_items',
  {
    id: id(),
    type: text('type').notNull(),
    dataOrigin: text('data_origin').notNull().default('live'),
    title: text('title').notNull(),
    summary: text('summary'),
    sourcePublishedAt: tsNull('source_published_at'),
    sourceUpdatedAt: tsNull('source_updated_at'),
    firstSeenAt: ts('first_seen_at'),
    lastSeenAt: ts('last_seen_at'),
    canonicalUrl: text('canonical_url'),
    recordStatus: text('record_status').notNull().default('active'),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
  },
  (t) => [index('content_items_type').on(t.type), index('content_items_origin').on(t.dataOrigin)],
);

export const externalIdentifiers = sqliteTable(
  'external_identifiers',
  {
    id: id(),
    contentItemId: text('content_item_id')
      .notNull()
      .references(() => contentItems.id),
    scheme: text('scheme').notNull(),
    value: text('value').notNull(),
    sourceId: text('source_id').references(() => sources.id),
  },
  (t) => [uniqueIndex('external_ids_scheme_value').on(t.scheme, t.value)],
);

export const contentItemSources = sqliteTable(
  'content_item_sources',
  {
    contentItemId: text('content_item_id')
      .notNull()
      .references(() => contentItems.id),
    sourceObjectId: text('source_object_id')
      .notNull()
      .references(() => sourceObjects.id),
    role: text('role').notNull().default('primary'),
    firstLinkedAt: ts('first_linked_at'),
    lastLinkedAt: ts('last_linked_at'),
  },
  (t) => [uniqueIndex('content_item_sources_pk').on(t.contentItemId, t.sourceObjectId)],
);

export const papers = sqliteTable('papers', {
  contentItemId: text('content_item_id')
    .primaryKey()
    .references(() => contentItems.id),
  pmid: text('pmid'),
  doi: text('doi'),
  journal: text('journal'),
  publisher: text('publisher'),
  publicationStatus: text('publication_status'),
  publicationType: text('publication_type'),
  language: text('language'),
  licence: text('licence'),
  isCorrectionOrRetraction: bool('is_correction_or_retraction').default(false),
  correctionNote: text('correction_note'),
});

export const paperAuthors = sqliteTable('paper_authors', {
  id: id(),
  paperId: text('paper_id')
    .notNull()
    .references(() => papers.contentItemId),
  ordinal: integer('ordinal').notNull(),
  displayName: text('display_name').notNull(),
  givenName: text('given_name'),
  familyName: text('family_name'),
  orcid: text('orcid'),
  affiliation: text('affiliation'),
});

export const paperFunders = sqliteTable('paper_funders', {
  id: id(),
  paperId: text('paper_id')
    .notNull()
    .references(() => papers.contentItemId),
  name: text('name').notNull(),
  awardId: text('award_id'),
});

export const trials = sqliteTable('trials', {
  contentItemId: text('content_item_id')
    .primaryKey()
    .references(() => contentItems.id),
  nctId: text('nct_id').notNull(),
  overallStatus: text('overall_status').notNull(),
  studyType: text('study_type'),
  phasesJson: text('phases_json'),
  briefTitle: text('brief_title'),
  officialTitle: text('official_title'),
  sponsor: text('sponsor'),
  enrollmentCount: integer('enrollment_count'),
  enrollmentType: text('enrollment_type'),
  startDate: text('start_date'),
  primaryCompletionDate: text('primary_completion_date'),
  completionDate: text('completion_date'),
  firstPostedDate: text('first_posted_date'),
  lastUpdatePostedDate: text('last_update_posted_date'),
  resultsFirstPostedDate: text('results_first_posted_date'),
  resultsPosted: bool('results_posted').default(false),
  healthyVolunteers: integer('healthy_volunteers', { mode: 'boolean' }),
  minAgeText: text('min_age_text'),
  maxAgeText: text('max_age_text'),
  sexEligibility: text('sex_eligibility'),
  australiaLocation: bool('australia_location').default(false),
});

export const trialConditions = sqliteTable('trial_conditions', {
  id: id(),
  trialId: text('trial_id')
    .notNull()
    .references(() => trials.contentItemId),
  name: text('name').notNull(),
});

export const trialInterventions = sqliteTable('trial_interventions', {
  id: id(),
  trialId: text('trial_id')
    .notNull()
    .references(() => trials.contentItemId),
  name: text('name').notNull(),
  type: text('type'),
});

export const trialOutcomes = sqliteTable('trial_outcomes', {
  id: id(),
  trialId: text('trial_id')
    .notNull()
    .references(() => trials.contentItemId),
  outcomeType: text('outcome_type').notNull(),
  measure: text('measure'),
  description: text('description'),
  timeFrame: text('time_frame'),
});

export const trialLocations = sqliteTable('trial_locations', {
  id: id(),
  trialId: text('trial_id')
    .notNull()
    .references(() => trials.contentItemId),
  facility: text('facility'),
  city: text('city'),
  state: text('state'),
  postcode: text('postcode'),
  country: text('country'),
  latitude: text('latitude'),
  longitude: text('longitude'),
});

export const trialStatusHistory = sqliteTable(
  'trial_status_history',
  {
    id: id(),
    trialId: text('trial_id')
      .notNull()
      .references(() => trials.contentItemId),
    status: text('status').notNull(),
    effectiveAt: tsNull('effective_at'),
    detectedAt: ts('detected_at'),
    sourceRecordVersionId: text('source_record_version_id'),
    eventKey: text('event_key').notNull(),
  },
  (t) => [uniqueIndex('trial_status_event_key').on(t.trialId, t.eventKey)],
);

export const regulatoryEvents = sqliteTable('regulatory_events', {
  contentItemId: text('content_item_id')
    .primaryKey()
    .references(() => contentItems.id),
  jurisdiction: text('jurisdiction').notNull().default('AU'),
  authority: text('authority').notNull().default('TGA'),
  feedKey: text('feed_key'),
  category: text('category'),
  guid: text('guid'),
  publishedAt: tsNull('published_at'),
  officialUrl: text('official_url'),
  relevanceMatched: bool('relevance_matched').default(false),
  relevanceTermsJson: text('relevance_terms_json'),
});

export const changeEvents = sqliteTable(
  'change_events',
  {
    id: id(),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    occurredAt: ts('occurred_at'),
    detectedAt: ts('detected_at'),
    contentItemId: text('content_item_id').references(() => contentItems.id),
    sourceObjectId: text('source_object_id').references(() => sourceObjects.id),
    sourceRecordVersionId: text('source_record_version_id'),
    importance: text('importance').notNull().default('medium'),
    isBaseline: bool('is_baseline').default(false),
    dedupeKey: text('dedupe_key').notNull(),
    dataOrigin: text('data_origin').notNull().default('live'),
  },
  (t) => [uniqueIndex('change_events_dedupe').on(t.dedupeKey)],
);

export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: ts('updated_at').default(sql`(unixepoch() * 1000)`),
});

export const backgroundJobs = sqliteTable(
  'background_jobs',
  {
    id: id(),
    kind: text('kind').notNull(),
    status: text('status').notNull().default('queued'),
    priority: integer('priority').notNull().default(100),
    payloadJson: text('payload_json').notNull().default('{}'),
    dedupeKey: text('dedupe_key').notNull(),
    availableAt: ts('available_at'),
    claimedAt: tsNull('claimed_at'),
    leaseExpiresAt: tsNull('lease_expires_at'),
    attemptCount: integer('attempt_count').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    lastError: text('last_error'),
    parentJobId: text('parent_job_id'),
    relatedRunId: text('related_run_id'),
    createdAt: ts('created_at'),
    startedAt: tsNull('started_at'),
    completedAt: tsNull('completed_at'),
  },
  (t) => [
    index('background_jobs_claim').on(t.status, t.availableAt, t.priority),
    index('background_jobs_lease').on(t.leaseExpiresAt),
    uniqueIndex('background_jobs_dedupe').on(t.dedupeKey),
    index('background_jobs_parent').on(t.parentJobId),
    index('background_jobs_created').on(t.createdAt),
  ],
);

export const schedulerState = sqliteTable('scheduler_state', {
  id: text('id').primaryKey().default('local'),
  timezone: text('timezone').notNull().default('Australia/Brisbane'),
  cronExpression: text('cron_expression').notNull().default('0 6 * * *'),
  enabled: bool('enabled').default(true),
  lastEnqueuedAt: tsNull('last_enqueued_at'),
  lastCompletedAt: tsNull('last_completed_at'),
  nextRunAt: tsNull('next_run_at'),
  lastCatchupReason: text('last_catchup_reason'),
  updatedAt: ts('updated_at'),
});

export {
  intelligenceRuns,
  intelligenceAnalyses,
  contentIntelligenceState,
  liveClaims,
  claimSourceSpans,
  liveReviewTasks,
  reviewDecisions,
  analysisSourceDependencies,
  claimRelationships,
} from './intelligence-schema.js';

export {
  interventionEntities,
  interventionAliases,
  interventionIdentifiers,
  interventionVariants,
  interventionMentions,
  interventionMappingCandidates,
  interventionMentionMappings,
  entityResolutionTasks,
  entityResolutionDecisions,
  peptideProfiles,
  peptideSequences,
  regulatedProducts,
  regulatoryAssertions,
  dossierSnapshots,
  dossierSourceDependencies,
  interventionDossierState,
  dossierChangeEvents,
} from './intervention-schema.js';
