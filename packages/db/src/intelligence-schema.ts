import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';

// Re-export pattern: append M3 intelligence tables onto schema.ts via this module
// imported from schema.ts to keep file size manageable.

const id = () => text('id').primaryKey();
const ts = (name: string) => integer(name, { mode: 'number' }).notNull();
const tsNull = (name: string) => integer(name, { mode: 'number' });
const bool = (name: string) => integer(name, { mode: 'boolean' }).notNull().default(false);

export const intelligenceRuns = sqliteTable('intelligence_runs', {
  id: id(),
  trigger: text('trigger').notNull(),
  scope: text('scope').notNull().default('all'),
  status: text('status').notNull(),
  rulesetVersion: text('ruleset_version').notNull(),
  aiEnabled: bool('ai_enabled').default(false),
  provider: text('provider'),
  model: text('model'),
  requestedCount: integer('requested_count').notNull().default(0),
  completedCount: integer('completed_count').notNull().default(0),
  deterministicCount: integer('deterministic_count').notNull().default(0),
  aiCount: integer('ai_count').notNull().default(0),
  reviewTaskCount: integer('review_task_count').notNull().default(0),
  reusedCount: integer('reused_count').notNull().default(0),
  warningCount: integer('warning_count').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),
  startedAt: ts('started_at'),
  completedAt: tsNull('completed_at'),
  summary: text('summary'),
});

export const intelligenceAnalyses = sqliteTable(
  'intelligence_analyses',
  {
    id: id(),
    contentItemId: text('content_item_id').notNull(),
    analysisMode: text('analysis_mode').notNull(),
    inputHash: text('input_hash').notNull(),
    rulesetVersion: text('ruleset_version').notNull(),
    segmentBuilderVersion: text('segment_builder_version').notNull(),
    claimSchemaVersion: text('claim_schema_version').notNull(),
    promptVersion: text('prompt_version'),
    provider: text('provider'),
    model: text('model'),
    status: text('status').notNull().default('complete'),
    classificationConfidence: text('classification_confidence').notNull(),
    assessmentCompleteness: text('assessment_completeness').notNull().default('partial'),
    evidenceMaturity: text('evidence_maturity').notNull(),
    evidenceAvailability: text('evidence_availability').notNull(),
    studyDesign: text('study_design'),
    organismLevel: text('organism_level'),
    resultsPresent: bool('results_present').default(false),
    researchActivity: integer('research_activity', { mode: 'number' }).notNull().default(0),
    translationGapsJson: text('translation_gaps_json').notNull().default('[]'),
    methodologicalSignalsJson: text('methodological_signals_json').notNull().default('[]'),
    whatWouldChangeJson: text('what_would_change_json').notNull().default('[]'),
    hallmarksJson: text('hallmarks_json').notNull().default('[]'),
    createdAt: ts('created_at'),
    supersededAt: tsNull('superseded_at'),
  },
  (t) => [
    index('intelligence_analyses_content').on(t.contentItemId),
    uniqueIndex('intelligence_analyses_identity').on(t.contentItemId, t.inputHash, t.rulesetVersion),
  ],
);

export const contentIntelligenceState = sqliteTable('content_intelligence_state', {
  contentItemId: text('content_item_id').primaryKey(),
  currentAnalysisId: text('current_analysis_id'),
  lastSuccessfulAnalysisAt: tsNull('last_successful_analysis_at'),
  stale: bool('stale').default(false),
  staleReason: text('stale_reason'),
  pendingJobId: text('pending_job_id'),
  lastReviewAt: tsNull('last_review_at'),
  updatedAt: ts('updated_at'),
});

export const liveClaims = sqliteTable(
  'live_claims',
  {
    id: id(),
    analysisId: text('analysis_id').notNull(),
    contentItemId: text('content_item_id').notNull(),
    fingerprint: text('fingerprint').notNull(),
    claimKind: text('claim_kind').notNull(),
    assertionRole: text('assertion_role').notNull(),
    claimText: text('claim_text').notNull(),
    direction: text('direction').notNull().default('unspecified'),
    outcomeFamily: text('outcome_family'),
    extractionMethod: text('extraction_method').notNull().default('deterministic'),
    classificationConfidence: text('classification_confidence').notNull(),
    reviewStatus: text('review_status').notNull().default('unreviewed'),
    active: bool('active').default(true),
    createdAt: ts('created_at'),
  },
  (t) => [
    index('live_claims_analysis').on(t.analysisId),
    uniqueIndex('live_claims_fingerprint').on(t.analysisId, t.fingerprint),
  ],
);

export const claimSourceSpans = sqliteTable('claim_source_spans', {
  id: id(),
  claimId: text('claim_id').notNull(),
  fieldPath: text('field_path').notNull(),
  excerpt: text('excerpt').notNull(),
  spanHash: text('span_hash').notNull(),
  primarySupport: bool('primary_support').default(true),
  createdAt: ts('created_at'),
});

export const liveReviewTasks = sqliteTable('live_review_tasks', {
  id: id(),
  contentItemId: text('content_item_id'),
  claimId: text('claim_id'),
  analysisId: text('analysis_id'),
  sourceRecordVersionId: text('source_record_version_id'),
  expectedAnalysisId: text('expected_analysis_id'),
  title: text('title').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('open'),
  confidence: text('confidence').notNull().default('low'),
  createdAt: ts('created_at'),
  resolvedAt: tsNull('resolved_at'),
  resolutionJson: text('resolution_json'),
});

export const reviewDecisions = sqliteTable(
  'review_decisions',
  {
    id: id(),
    taskId: text('task_id'),
    contentItemId: text('content_item_id'),
    claimId: text('claim_id'),
    analysisId: text('analysis_id'),
    sourceRecordVersionId: text('source_record_version_id'),
    action: text('action').notNull(),
    decisionText: text('decision_text'),
    editedClaimText: text('edited_claim_text'),
    actor: text('actor').notNull().default('local_admin'),
    createdAt: ts('created_at'),
    notes: text('notes'),
  },
  (t) => [index('review_decisions_task').on(t.taskId), index('review_decisions_claim').on(t.claimId)],
);

export const analysisSourceDependencies = sqliteTable(
  'analysis_source_dependencies',
  {
    id: id(),
    analysisId: text('analysis_id').notNull(),
    contentItemId: text('content_item_id').notNull(),
    sourceRecordVersionId: text('source_record_version_id'),
    role: text('role').notNull().default('primary'),
    createdAt: ts('created_at'),
  },
  (t) => [index('analysis_deps_analysis').on(t.analysisId)],
);

export const claimRelationships = sqliteTable(
  'claim_relationships',
  {
    id: id(),
    leftClaimId: text('left_claim_id').notNull(),
    rightClaimId: text('right_claim_id').notNull(),
    relationship: text('relationship').notNull(),
    comparabilityJson: text('comparability_json').notNull().default('[]'),
    rationale: text('rationale').notNull(),
    rulesetVersion: text('ruleset_version').notNull(),
    createdAt: ts('created_at'),
  },
  (t) => [
    uniqueIndex('claim_relationships_pair').on(t.leftClaimId, t.rightClaimId, t.relationship),
  ],
);
