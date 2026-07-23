import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';

const id = () => text('id').primaryKey();
const ts = (name: string) => integer(name, { mode: 'number' }).notNull();
const tsNull = (name: string) => integer(name, { mode: 'number' });
const bool = (name: string) => integer(name, { mode: 'boolean' }).notNull().default(false);

export const creatorEntities = sqliteTable(
  'creator_entities',
  {
    id: id(),
    preferredName: text('preferred_name').notNull(),
    normalizedName: text('normalized_name').notNull(),
    creatorKind: text('creator_kind').notNull().default('individual'),
    lifecycleState: text('lifecycle_state').notNull().default('active'),
    identityConfidence: text('identity_confidence').notNull().default('medium'),
    neutralDescription: text('neutral_description'),
    currentProfileSnapshotId: text('current_profile_snapshot_id'),
    redirectTargetId: text('redirect_target_id'),
    dataOrigin: text('data_origin').notNull().default('live'),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
  },
  (t) => [
    index('creator_entities_norm').on(t.normalizedName),
    index('creator_entities_lifecycle').on(t.lifecycleState, t.normalizedName),
  ],
);

export const creatorAliases = sqliteTable('creator_aliases', {
  id: id(),
  creatorId: text('creator_id').notNull(),
  aliasText: text('alias_text').notNull(),
  normalizedAlias: text('normalized_alias').notNull(),
  aliasType: text('alias_type').default('alias'),
  sourceProvenance: text('source_provenance'),
  reviewState: text('review_state').notNull().default('accepted'),
  collisionFlag: bool('collision_flag').default(false),
  validFrom: tsNull('valid_from'),
  validTo: tsNull('valid_to'),
  createdAt: ts('created_at'),
});

export const creatorRoles = sqliteTable(
  'creator_roles',
  {
    id: id(),
    creatorId: text('creator_id').notNull(),
    role: text('role').notNull(),
    sourceStatementId: text('source_statement_id'),
    provenanceState: text('provenance_state').notNull().default('declared'),
    reviewState: text('review_state').notNull().default('accepted'),
    validFrom: tsNull('valid_from'),
    validTo: tsNull('valid_to'),
    createdAt: ts('created_at'),
  },
  (t) => [index('creator_roles_creator').on(t.creatorId)],
);

export const creatorPlatformAccounts = sqliteTable(
  'creator_platform_accounts',
  {
    id: id(),
    creatorId: text('creator_id').notNull(),
    platform: text('platform').notNull(),
    externalAccountId: text('external_account_id').notNull(),
    handle: text('handle'),
    displayName: text('display_name'),
    canonicalUrl: text('canonical_url'),
    accountState: text('account_state').default('active'),
    monitored: bool('monitored').default(false),
    enabled: bool('enabled').default(true),
    identityConfidence: text('identity_confidence').default('medium'),
    lastCheckedAt: tsNull('last_checked_at'),
    platformDataExpiryAt: tsNull('platform_data_expiry_at'),
    complianceState: text('compliance_state').default('ok'),
    sourcePolicyVersion: text('source_policy_version'),
    createdAt: ts('created_at'),
  },
  (t) => [uniqueIndex('creator_platform_ext').on(t.platform, t.externalAccountId)],
);

export const creatorAccountIdentityCandidates = sqliteTable(
  'creator_account_identity_candidates',
  {
    id: id(),
    accountId: text('account_id').notNull(),
    candidateCreatorId: text('candidate_creator_id').notNull(),
    matchMethod: text('match_method').notNull(),
    evidenceJson: text('evidence_json').notNull().default('{}'),
    state: text('state').notNull().default('candidate'),
    confidence: text('confidence').notNull().default('medium'),
    createdAt: ts('created_at'),
  },
  (t) => [index('creator_identity_candidates_account').on(t.accountId)],
);

export const creatorIdentityTasks = sqliteTable(
  'creator_identity_tasks',
  {
    id: id(),
    accountId: text('account_id').notNull(),
    candidateId: text('candidate_id'),
    reason: text('reason').notNull(),
    proposedCreatorId: text('proposed_creator_id'),
    currentState: text('current_state').notNull().default('open'),
    sourceEvidenceJson: text('source_evidence_json').notNull().default('{}'),
    priority: integer('priority').notNull().default(0),
    reviewStatus: text('review_status').notNull().default('pending'),
    stale: bool('stale').default(false),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
  },
  (t) => [index('creator_identity_tasks_queue').on(t.reviewStatus, t.priority)],
);

export const creatorProfileStatements = sqliteTable(
  'creator_profile_statements',
  {
    id: id(),
    creatorId: text('creator_id').notNull(),
    statementType: text('statement_type').notNull(),
    subject: text('subject'),
    predicate: text('predicate'),
    valueText: text('value_text').notNull(),
    provenanceState: text('provenance_state').notNull().default('declared'),
    sourceUrl: text('source_url'),
    sourceContentId: text('source_content_id'),
    sourceDocumentId: text('source_document_id'),
    sourceSpanJson: text('source_span_json'),
    reviewState: text('review_state').notNull().default('accepted'),
    effectiveAt: tsNull('effective_at'),
    supersededAt: tsNull('superseded_at'),
    createdAt: ts('created_at'),
  },
  (t) => [index('creator_profile_statements_creator').on(t.creatorId)],
);

export const monitoredCreatorSources = sqliteTable(
  'monitored_creator_sources',
  {
    id: id(),
    accountId: text('account_id').notNull(),
    enabled: bool('enabled').default(true),
    paused: bool('paused').default(false),
    onboardingMethod: text('onboarding_method').notNull(),
    userLabel: text('user_label'),
    tagsJson: text('tags_json').notNull().default('[]'),
    syncPolicyJson: text('sync_policy_json').notNull().default('{}'),
    initialLookbackDays: integer('initial_lookback_days'),
    includeReplies: bool('include_replies').default(false),
    includeReposts: bool('include_reposts').default(false),
    addedAt: ts('added_at'),
    lastSyncedAt: tsNull('last_synced_at'),
    nextDueAt: tsNull('next_due_at'),
    budgetQuotaPolicyJson: text('budget_quota_policy_json').notNull().default('{}'),
    removedAt: tsNull('removed_at'),
  },
  (t) => [
    index('monitored_sources_due').on(t.enabled, t.nextDueAt),
    index('monitored_sources_account').on(t.accountId),
  ],
);

export const creatorContentItems = sqliteTable(
  'creator_content_items',
  {
    id: id(),
    creatorId: text('creator_id').notNull(),
    platformAccountId: text('platform_account_id'),
    platform: text('platform').notNull(),
    externalId: text('external_id').notNull(),
    contentType: text('content_type').default('unknown'),
    title: text('title').notNull(),
    publishedAt: tsNull('published_at'),
    canonicalUrl: text('canonical_url'),
    currentState: text('current_state').default('current'),
    retentionState: text('retention_state').notNull().default('current'),
    complianceState: text('compliance_state').notNull().default('ok'),
    metadataOnly: bool('metadata_only').default(true),
    lastRetrievedAt: tsNull('last_retrieved_at'),
    refreshDeadlineAt: tsNull('refresh_deadline_at'),
    policyVersion: text('policy_version'),
    sourceRecordVersionId: text('source_record_version_id'),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
  },
  (t) => [
    index('creator_content_platform_published').on(t.platform, t.platformAccountId, t.publishedAt),
    index('creator_content_refresh_deadline').on(t.refreshDeadlineAt),
  ],
);

export const platformPolicyVersions = sqliteTable(
  'platform_policy_versions',
  {
    id: id(),
    platform: text('platform').notNull(),
    policyId: text('policy_id').notNull(),
    policyVersion: text('policy_version').notNull(),
    checkedAt: ts('checked_at'),
    officialReference: text('official_reference'),
    refreshDeleteRule: text('refresh_delete_rule'),
    displayRule: text('display_rule'),
    exportRule: text('export_rule'),
    aiRule: text('ai_rule'),
    currentState: text('current_state').notNull().default('current'),
    createdAt: ts('created_at'),
  },
  (t) => [index('platform_policy_versions_platform').on(t.platform, t.currentState)],
);

export const platformContentCurrent = sqliteTable(
  'platform_content_current',
  {
    id: id(),
    contentItemId: text('content_item_id').notNull(),
    title: text('title'),
    description: text('description'),
    textBody: text('text_body'),
    durationSeconds: integer('duration_seconds'),
    statusText: text('status_text'),
    thumbnailUrl: text('thumbnail_url'),
    paidPlacementDeclared: bool('paid_placement_declared').default(false),
    captionAvailable: bool('caption_available').default(false),
    sourceVersionIdentity: text('source_version_identity'),
    contentHash: text('content_hash'),
    retrievedAt: ts('retrieved_at'),
    expiryAt: tsNull('expiry_at'),
    displayEligible: bool('display_eligible').default(true),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
  },
  (t) => [uniqueIndex('platform_content_current_item').on(t.contentItemId)],
);

export const platformContentTombstones = sqliteTable(
  'platform_content_tombstones',
  {
    id: id(),
    contentItemId: text('content_item_id').notNull(),
    platform: text('platform').notNull(),
    contentIdHash: text('content_id_hash'),
    unavailabilityReason: text('unavailability_reason').notNull(),
    complianceEventId: text('compliance_event_id'),
    purgedAt: ts('purged_at'),
    auditMetadataJson: text('audit_metadata_json').notNull().default('{}'),
    createdAt: ts('created_at'),
  },
  (t) => [
    index('platform_tombstones_hash').on(t.contentIdHash),
    index('platform_tombstones_item').on(t.contentItemId),
  ],
);

export const platformComplianceEvents = sqliteTable(
  'platform_compliance_events',
  {
    id: id(),
    platform: text('platform').notNull(),
    contentItemId: text('content_item_id'),
    accountId: text('account_id'),
    eventType: text('event_type').notNull(),
    sourceEventOrCursor: text('source_event_or_cursor'),
    receivedAt: ts('received_at'),
    appliedAt: tsNull('applied_at'),
    actionTaken: text('action_taken'),
    errorRetryState: text('error_retry_state'),
    detailJson: text('detail_json').notNull().default('{}'),
    createdAt: ts('created_at'),
  },
  (t) => [index('platform_compliance_events_platform').on(t.platform, t.receivedAt)],
);

export const platformRetentionJobResults = sqliteTable(
  'platform_retention_job_results',
  {
    id: id(),
    platform: text('platform').notNull(),
    policyVersion: text('policy_version'),
    backgroundJobId: text('background_job_id'),
    dueRecordCount: integer('due_record_count').notNull().default(0),
    refreshedCount: integer('refreshed_count').notNull().default(0),
    purgedCount: integer('purged_count').notNull().default(0),
    hiddenCount: integer('hidden_count').notNull().default(0),
    status: text('status').notNull().default('pending'),
    startedAt: tsNull('started_at'),
    completedAt: tsNull('completed_at'),
    createdAt: ts('created_at'),
  },
  (t) => [index('platform_retention_results_platform').on(t.platform, t.status)],
);

export const platformQuotaLedgers = sqliteTable(
  'platform_quota_ledgers',
  {
    id: id(),
    platform: text('platform').notNull(),
    periodKey: text('period_key').notNull(),
    methodOrResource: text('method_or_resource').notNull(),
    unitsOrReads: integer('units_or_reads').notNull().default(0),
    estimatedCostMicros: integer('estimated_cost_micros').notNull().default(0),
    priceTableVersion: text('price_table_version'),
    appCap: integer('app_cap'),
    remainingAllowance: integer('remaining_allowance'),
    updatedAt: ts('updated_at'),
    createdAt: ts('created_at'),
  },
  (t) => [
    index('platform_quota_period_method').on(t.platform, t.periodKey, t.methodOrResource),
  ],
);

export const platformPriceTables = sqliteTable(
  'platform_price_tables',
  {
    id: id(),
    platform: text('platform').notNull(),
    checkedAt: ts('checked_at'),
    currency: text('currency').notNull().default('USD'),
    resourceType: text('resource_type').notNull(),
    unitPriceMicros: integer('unit_price_micros').notNull(),
    sourceUrl: text('source_url'),
    lifecycleState: text('lifecycle_state').notNull().default('active'),
    createdAt: ts('created_at'),
  },
  (t) => [index('platform_price_tables_platform').on(t.platform, t.lifecycleState)],
);

export const creatorDocuments = sqliteTable(
  'creator_documents',
  {
    id: id(),
    creatorId: text('creator_id').notNull(),
    accountId: text('account_id'),
    contentItemId: text('content_item_id'),
    filename: text('filename').notNull(),
    documentKind: text('document_kind').notNull(),
    mimeType: text('mime_type'),
    rightsBasis: text('rights_basis').notNull(),
    rightsDeclaredAt: tsNull('rights_declared_at'),
    claimEligible: bool('claim_eligible').default(false),
    sourceUrl: text('source_url'),
    storageKey: text('storage_key').notNull(),
    byteLength: integer('byte_length').notNull(),
    sha256: text('sha256').notNull(),
    parsedTextExcerpt: text('parsed_text_excerpt'),
    lifecycleState: text('lifecycle_state').default('current'),
    reviewState: text('review_state').notNull().default('accepted'),
    createdAt: ts('created_at'),
  },
  (t) => [index('creator_documents_rights_eligible').on(t.rightsBasis, t.claimEligible)],
);

export const creatorDocumentSegments = sqliteTable(
  'creator_document_segments',
  {
    id: id(),
    documentId: text('document_id').notNull(),
    segmentKind: text('segment_kind').notNull(),
    startMs: integer('start_ms'),
    endMs: integer('end_ms'),
    charStart: integer('char_start'),
    charEnd: integer('char_end'),
    text: text('text').notNull(),
    textHash: text('text_hash').notNull(),
    sourceLineOrCueIds: text('source_line_or_cue_ids'),
    claimEligible: bool('claim_eligible').default(true),
    createdAt: ts('created_at'),
  },
  (t) => [index('creator_doc_segments_document').on(t.documentId)],
);

export const creatorClaims = sqliteTable(
  'creator_claims',
  {
    id: id(),
    creatorId: text('creator_id').notNull(),
    accountId: text('account_id'),
    contentItemId: text('content_item_id'),
    documentId: text('document_id'),
    claimFingerprint: text('claim_fingerprint'),
    claimText: text('claim_text').notNull(),
    assertionRole: text('assertion_role').notNull(),
    claimKind: text('claim_kind'),
    direction: text('direction'),
    certaintyLanguage: text('certainty_language'),
    interventionText: text('intervention_text'),
    populationText: text('population_text'),
    organism: text('organism'),
    comparator: text('comparator'),
    outcomeText: text('outcome_text'),
    timeframe: text('timeframe'),
    regulatoryScope: text('regulatory_scope'),
    excerpt: text('excerpt').notNull(),
    fieldPath: text('field_path').notNull(),
    confidence: text('confidence').notNull(),
    recurrenceKey: text('recurrence_key').notNull(),
    active: bool('active').default(true),
    reviewStatus: text('review_status').default('unreviewed'),
    lifecycleState: text('lifecycle_state').default('current'),
    alignmentJson: text('alignment_json').notNull().default('{}'),
    extractionVersion: text('extraction_version').notNull(),
    createdAt: ts('created_at'),
  },
  (t) => [
    index('creator_claims_recurrence').on(t.recurrenceKey),
    index('creator_claims_creator_kind_status').on(
      t.creatorId,
      t.claimKind,
      t.reviewStatus,
      t.createdAt,
    ),
  ],
);

export const creatorClaimSourceSpans = sqliteTable(
  'creator_claim_source_spans',
  {
    id: id(),
    claimId: text('claim_id').notNull(),
    contentItemId: text('content_item_id'),
    documentId: text('document_id'),
    segmentId: text('segment_id'),
    platformContentVersion: text('platform_content_version'),
    startMs: integer('start_ms'),
    endMs: integer('end_ms'),
    charStart: integer('char_start'),
    charEnd: integer('char_end'),
    boundedExcerpt: text('bounded_excerpt').notNull(),
    excerptWordCount: integer('excerpt_word_count').notNull().default(0),
    spanHash: text('span_hash').notNull(),
    sourceUrl: text('source_url'),
    primarySupport: bool('primary_support').default(true),
    displayEligible: bool('display_eligible').default(true),
    createdAt: ts('created_at'),
  },
  (t) => [index('creator_claim_spans_claim').on(t.claimId)],
);

export const creatorClaimConcepts = sqliteTable(
  'creator_claim_concepts',
  {
    id: id(),
    claimId: text('claim_id').notNull(),
    conceptType: text('concept_type').notNull(),
    conceptId: text('concept_id'),
    sourceTerm: text('source_term'),
    assignmentMethod: text('assignment_method').notNull(),
    confidence: text('confidence').notNull().default('medium'),
    reviewState: text('review_state').notNull().default('candidate'),
    createdAt: ts('created_at'),
  },
  (t) => [
    index('creator_claim_concepts_claim').on(t.claimId),
    index('creator_claim_concepts_type').on(t.conceptType, t.conceptId),
  ],
);

export const creatorClaimLinks = sqliteTable('creator_claim_links', {
  id: id(),
  creatorClaimId: text('creator_claim_id').notNull(),
  linkedClaimId: text('linked_claim_id'),
  linkedAnalysisId: text('linked_analysis_id'),
  linkedEntityId: text('linked_entity_id'),
  linkedAssertionId: text('linked_assertion_id'),
  linkRole: text('link_role').notNull().default('evidence_alignment'),
  createdAt: ts('created_at'),
});

export const creatorClaimEvidenceLinks = sqliteTable(
  'creator_claim_evidence_links',
  {
    id: id(),
    creatorClaimId: text('creator_claim_id').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    linkRole: text('link_role').notNull(),
    detectionMethod: text('detection_method').notNull(),
    compatibilityDimensionsJson: text('compatibility_dimensions_json').notNull().default('[]'),
    linkState: text('link_state').notNull().default('candidate'),
    rationale: text('rationale'),
    sourceOrVersion: text('source_or_version'),
    createdAt: ts('created_at'),
    reviewedAt: tsNull('reviewed_at'),
  },
  (t) => [
    index('creator_claim_evidence_claim').on(t.creatorClaimId),
    index('creator_claim_evidence_target').on(t.targetType, t.targetId),
  ],
);

export const creatorClaimAlignmentAssessments = sqliteTable(
  'creator_claim_alignment_assessments',
  {
    id: id(),
    creatorClaimId: text('creator_claim_id').notNull(),
    inputDependencyHash: text('input_dependency_hash').notNull(),
    rulesetVersion: text('ruleset_version').notNull(),
    status: text('status').notNull().default('ready'),
    completeness: text('completeness'),
    extractionConfidence: text('extraction_confidence'),
    lifecycleState: text('lifecycle_state').notNull().default('current'),
    deterministicSummary: text('deterministic_summary').notNull(),
    analysisIdentity: text('analysis_identity').notNull(),
    createdAt: ts('created_at'),
  },
  (t) => [
    uniqueIndex('creator_alignment_analysis_identity').on(t.analysisIdentity),
    index('creator_alignment_claim').on(t.creatorClaimId),
  ],
);

export const creatorClaimAlignmentDimensions = sqliteTable(
  'creator_claim_alignment_dimensions',
  {
    id: id(),
    assessmentId: text('assessment_id').notNull(),
    dimension: text('dimension').notNull(),
    state: text('state').notNull(),
    creatorClaimValue: text('creator_claim_value'),
    linkedEvidenceValue: text('linked_evidence_value'),
    explanation: text('explanation'),
    evidenceLinkId: text('evidence_link_id'),
    method: text('method'),
    reviewState: text('review_state').notNull().default('accepted'),
    createdAt: ts('created_at'),
  },
  (t) => [index('creator_alignment_dims_assessment').on(t.assessmentId)],
);

export const creatorClaimFindings = sqliteTable(
  'creator_claim_findings',
  {
    id: id(),
    assessmentId: text('assessment_id').notNull(),
    findingType: text('finding_type').notNull(),
    findingState: text('finding_state').notNull().default('candidate'),
    explanation: text('explanation').notNull(),
    reviewRequired: bool('review_required').default(true),
    reviewDecision: text('review_decision'),
    createdAt: ts('created_at'),
    reviewedAt: tsNull('reviewed_at'),
  },
  (t) => [index('creator_claim_findings_assessment').on(t.assessmentId, t.findingState)],
);

export const creatorClaimRelationships = sqliteTable(
  'creator_claim_relationships',
  {
    id: id(),
    sourceClaimId: text('source_claim_id').notNull(),
    targetClaimId: text('target_claim_id').notNull(),
    relationshipType: text('relationship_type').notNull(),
    relationshipState: text('relationship_state').notNull().default('candidate'),
    similarityFeaturesJson: text('similarity_features_json').notNull().default('{}'),
    scopeCompatibility: text('scope_compatibility'),
    createdAt: ts('created_at'),
    reviewedAt: tsNull('reviewed_at'),
  },
  (t) => [
    index('creator_claim_rels_source').on(t.sourceClaimId),
    index('creator_claim_rels_target').on(t.targetClaimId),
  ],
);

export const creatorCorrections = sqliteTable(
  'creator_corrections',
  {
    id: id(),
    originalClaimId: text('original_claim_id'),
    originalContentId: text('original_content_id'),
    correctionClaimId: text('correction_claim_id'),
    correctionContentId: text('correction_content_id'),
    relationshipKind: text('relationship_kind').notNull(),
    sourceEvidenceJson: text('source_evidence_json').notNull().default('{}'),
    reviewState: text('review_state').notNull().default('accepted'),
    effectiveAt: tsNull('effective_at'),
    createdAt: ts('created_at'),
  },
  (t) => [index('creator_corrections_original').on(t.originalClaimId)],
);

export const creatorDisclosures = sqliteTable('creator_disclosures', {
  id: id(),
  creatorId: text('creator_id').notNull(),
  creatorClaimId: text('creator_claim_id'),
  disclosureText: text('disclosure_text').notNull(),
  source: text('source').notNull().default('document'),
  sourceUrl: text('source_url'),
  reviewState: text('review_state').default('accepted'),
  createdAt: ts('created_at'),
});

export const creatorProfileSnapshots = sqliteTable('creator_profile_snapshots', {
  id: id(),
  creatorId: text('creator_id').notNull(),
  inputDependencyHash: text('input_dependency_hash'),
  summaryJson: text('summary_json').notNull().default('{}'),
  countsJson: text('counts_json').default('{}'),
  rulesetVersion: text('ruleset_version').notNull(),
  status: text('status').default('ready'),
  policyRedactionState: text('policy_redaction_state').default('none'),
  createdAt: ts('created_at'),
});

export const creatorProfileState = sqliteTable(
  'creator_profile_state',
  {
    id: id(),
    creatorId: text('creator_id').notNull(),
    currentSnapshotId: text('current_snapshot_id'),
    stale: bool('stale').default(false),
    staleReason: text('stale_reason'),
    pendingJobId: text('pending_job_id'),
    lastSuccessfulRebuildAt: tsNull('last_successful_rebuild_at'),
    lastReviewedAt: tsNull('last_reviewed_at'),
    updatedAt: ts('updated_at'),
  },
  (t) => [
    uniqueIndex('creator_profile_state_creator').on(t.creatorId),
    index('creator_profile_state_stale').on(t.stale),
  ],
);

export const creatorEvents = sqliteTable(
  'creator_events',
  {
    id: id(),
    creatorId: text('creator_id'),
    accountId: text('account_id'),
    claimId: text('claim_id'),
    eventKind: text('event_kind').notNull(),
    baseline: bool('baseline').default(false),
    deterministicSummary: text('deterministic_summary').notNull(),
    sourceDate: tsNull('source_date'),
    detectionDate: ts('detection_date'),
    sourcePolicyState: text('source_policy_state'),
    dedupeKey: text('dedupe_key').notNull(),
    createdAt: ts('created_at'),
  },
  (t) => [
    uniqueIndex('creator_events_dedupe').on(t.dedupeKey),
    index('creator_events_creator').on(t.creatorId, t.detectionDate),
  ],
);

export const claimRecurrenceSnapshots = sqliteTable(
  'claim_recurrence_snapshots',
  {
    id: id(),
    claimThemeConcept: text('claim_theme_concept').notNull(),
    windowStart: ts('window_start'),
    windowEnd: ts('window_end'),
    distinctMonitoredSourceCount: integer('distinct_monitored_source_count').notNull().default(0),
    reviewedClaimCount: integer('reviewed_claim_count').notNull().default(0),
    linkedEvidenceMaturity: text('linked_evidence_maturity'),
    correctionCount: integer('correction_count').notNull().default(0),
    conflictCount: integer('conflict_count').notNull().default(0),
    sourceUnavailableCount: integer('source_unavailable_count').notNull().default(0),
    formulaVersion: text('formula_version').notNull(),
    sourceScopeHash: text('source_scope_hash').notNull(),
    createdAt: ts('created_at'),
  },
  (t) => [
    index('claim_recurrence_theme_window').on(t.claimThemeConcept, t.windowStart, t.windowEnd),
  ],
);

export const platformPolicyState = sqliteTable('platform_policy_state', {
  id: id(),
  platform: text('platform').notNull(),
  policyKey: text('policy_key').notNull(),
  status: text('status').notNull(),
  detailJson: text('detail_json').notNull().default('{}'),
  updatedAt: ts('updated_at'),
});

export const xBudgetLedger = sqliteTable(
  'x_budget_ledger',
  {
    id: id(),
    periodKey: text('period_key').notNull(),
    spentMicros: integer('spent_micros').notNull().default(0),
    capMicros: integer('cap_micros').notNull(),
    acknowledged: bool('acknowledged').default(false),
    updatedAt: ts('updated_at'),
  },
  (t) => [index('x_budget_ledger_period').on(t.periodKey)],
);
