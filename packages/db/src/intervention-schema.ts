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

export const interventionEntities = sqliteTable(
  'intervention_entities',
  {
    id: id(),
    preferredName: text('preferred_name').notNull(),
    normalizedPreferredName: text('normalized_preferred_name').notNull(),
    entityType: text('entity_type').notNull(),
    lifecycleState: text('lifecycle_state').notNull().default('active'),
    identityConfidence: text('identity_confidence').notNull().default('medium'),
    shortDescription: text('short_description'),
    currentDossierSnapshotId: text('current_dossier_snapshot_id'),
    redirectTargetId: text('redirect_target_id'),
    createdByMethod: text('created_by_method').notNull().default('bootstrap'),
    createdByVersion: text('created_by_version').notNull().default('m4.1'),
    dataOrigin: text('data_origin').notNull().default('live'),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
  },
  (t) => [
    index('intervention_entities_norm').on(t.normalizedPreferredName),
    index('intervention_entities_type').on(t.entityType),
  ],
);

export const interventionAliases = sqliteTable(
  'intervention_aliases',
  {
    id: id(),
    entityId: text('entity_id').notNull(),
    aliasText: text('alias_text').notNull(),
    normalizedAlias: text('normalized_alias').notNull(),
    aliasType: text('alias_type').notNull().default('synonym'),
    language: text('language').notNull().default('en'),
    sourceId: text('source_id'),
    sourceRecordVersionId: text('source_record_version_id'),
    reviewState: text('review_state').notNull().default('accepted'),
    collisionFlag: bool('collision_flag').default(false),
    validFrom: tsNull('valid_from'),
    validTo: tsNull('valid_to'),
    createdAt: ts('created_at'),
  },
  (t) => [
    index('intervention_aliases_norm').on(t.normalizedAlias),
    index('intervention_aliases_entity').on(t.entityId),
  ],
);

export const interventionIdentifiers = sqliteTable(
  'intervention_identifiers',
  {
    id: id(),
    entityId: text('entity_id').notNull(),
    variantId: text('variant_id'),
    scheme: text('scheme').notNull(),
    value: text('value').notNull(),
    normalizedValue: text('normalized_value').notNull(),
    sourceId: text('source_id'),
    sourceRecordVersionId: text('source_record_version_id'),
    reviewState: text('review_state').notNull().default('accepted'),
    createdAt: ts('created_at'),
  },
  (t) => [
    uniqueIndex('intervention_identifiers_scheme_value').on(t.scheme, t.normalizedValue),
    index('intervention_identifiers_entity').on(t.entityId),
  ],
);

export const interventionVariants = sqliteTable('intervention_variants', {
  id: id(),
  parentEntityId: text('parent_entity_id').notNull(),
  variantType: text('variant_type').notNull(),
  preferredName: text('preferred_name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  formulation: text('formulation'),
  strength: text('strength'),
  route: text('route'),
  lifecycleState: text('lifecycle_state').notNull().default('active'),
  reviewState: text('review_state').notNull().default('accepted'),
  sourceRecordVersionId: text('source_record_version_id'),
  createdAt: ts('created_at'),
});

export const interventionMentions = sqliteTable(
  'intervention_mentions',
  {
    id: id(),
    rawText: text('raw_text').notNull(),
    normalizedText: text('normalized_text').notNull(),
    mentionType: text('mention_type').notNull(),
    contentItemId: text('content_item_id'),
    claimId: text('claim_id'),
    regulatoryEventId: text('regulatory_event_id'),
    sourceObjectId: text('source_object_id'),
    sourceRecordVersionId: text('source_record_version_id'),
    fieldPath: text('field_path').notNull(),
    excerpt: text('excerpt').notNull(),
    contextHash: text('context_hash').notNull(),
    extractionRuleVersion: text('extraction_rule_version').notNull(),
    createdAt: ts('created_at'),
  },
  (t) => [index('intervention_mentions_content').on(t.contentItemId)],
);

export const interventionMappingCandidates = sqliteTable('intervention_mapping_candidates', {
  id: id(),
  mentionId: text('mention_id').notNull(),
  candidateEntityId: text('candidate_entity_id').notNull(),
  candidateVariantId: text('candidate_variant_id'),
  candidateSource: text('candidate_source').notNull().default('deterministic'),
  matchMethod: text('match_method').notNull(),
  matchConfidence: text('match_confidence').notNull(),
  reasonsJson: text('reasons_json').notNull().default('[]'),
  collisionState: bool('collision_state').default(false),
  status: text('status').notNull().default('proposed'),
  createdAt: ts('created_at'),
});

export const interventionMentionMappings = sqliteTable(
  'intervention_mention_mappings',
  {
    id: id(),
    mentionId: text('mention_id').notNull(),
    entityId: text('entity_id').notNull(),
    variantId: text('variant_id'),
    mappingState: text('mapping_state').notNull(),
    mappingScope: text('mapping_scope').notNull().default('content_item'),
    ruleOrDecisionId: text('rule_or_decision_id').notNull(),
    sourceVersionSetHash: text('source_version_set_hash'),
    effectiveAt: ts('effective_at'),
    supersededAt: tsNull('superseded_at'),
  },
  (t) => [index('intervention_mention_mappings_mention').on(t.mentionId)],
);

export const entityResolutionTasks = sqliteTable('entity_resolution_tasks', {
  id: id(),
  mentionId: text('mention_id'),
  candidateId: text('candidate_id'),
  title: text('title').notNull(),
  reason: text('reason').notNull(),
  priority: text('priority').notNull().default('medium'),
  status: text('status').notNull().default('open'),
  proposedEntityId: text('proposed_entity_id'),
  currentMappingId: text('current_mapping_id'),
  stale: bool('stale').default(false),
  createdAt: ts('created_at'),
  resolvedAt: tsNull('resolved_at'),
});

export const entityResolutionDecisions = sqliteTable('entity_resolution_decisions', {
  id: id(),
  taskId: text('task_id').notNull(),
  action: text('action').notNull(),
  priorMappingHash: text('prior_mapping_hash'),
  resultingMappingHash: text('resulting_mapping_hash'),
  entityId: text('entity_id'),
  notes: text('notes'),
  actor: text('actor').notNull().default('local_admin'),
  createdAt: ts('created_at'),
});

export const peptideProfiles = sqliteTable('peptide_profiles', {
  id: id(),
  entityId: text('entity_id').notNull(),
  variantId: text('variant_id'),
  classification: text('classification').notNull(),
  sequenceState: text('sequence_state').notNull().default('no_sequence'),
  sequenceLength: integer('sequence_length'),
  molecularFormula: text('molecular_formula'),
  molecularMass: text('molecular_mass'),
  identitySource: text('identity_source'),
  warningState: text('warning_state').notNull().default('sequence_unverified'),
  reviewState: text('review_state').notNull().default('unreviewed'),
  updatedAt: ts('updated_at'),
});

export const peptideSequences = sqliteTable('peptide_sequences', {
  id: id(),
  profileId: text('profile_id').notNull(),
  sequence: text('sequence').notNull(),
  sequenceHash: text('sequence_hash').notNull(),
  alphabetVersion: text('alphabet_version').notNull().default('aa.1'),
  exactOrPartial: text('exact_or_partial').notNull().default('exact'),
  sourceId: text('source_id'),
  sourceRecordVersionId: text('source_record_version_id'),
  reviewState: text('review_state').notNull().default('accepted'),
  createdAt: ts('created_at'),
});

export const regulatedProducts = sqliteTable(
  'regulated_products',
  {
    id: id(),
    jurisdiction: text('jurisdiction').notNull(),
    authority: text('authority').notNull(),
    sourceNativeId: text('source_native_id').notNull(),
    productName: text('product_name').notNull(),
    sponsor: text('sponsor'),
    productType: text('product_type'),
    dosageForm: text('dosage_form'),
    route: text('route'),
    strength: text('strength'),
    marketingStatus: text('marketing_status'),
    rawStatusWording: text('raw_status_wording'),
    officialUrl: text('official_url'),
    currentSourceVersionId: text('current_source_version_id'),
    matchState: text('match_state').notNull().default('unreviewed'),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
  },
  (t) => [
    uniqueIndex('regulated_products_native').on(t.authority, t.sourceNativeId),
  ],
);

export const regulatoryAssertions = sqliteTable('regulatory_assertions', {
  id: id(),
  productId: text('product_id'),
  entityId: text('entity_id'),
  jurisdiction: text('jurisdiction').notNull(),
  authority: text('authority').notNull(),
  assertionKind: text('assertion_kind').notNull(),
  normalizedStanding: text('normalized_standing').notNull(),
  rawSourceStatus: text('raw_source_status'),
  scopeJson: text('scope_json').notNull().default('{}'),
  matchScope: text('match_scope').notNull().default('product'),
  effectiveAt: tsNull('effective_at'),
  expiresAt: tsNull('expires_at'),
  sourceRecordVersionId: text('source_record_version_id'),
  currentState: text('current_state').notNull().default('current'),
  reviewState: text('review_state').notNull().default('accepted'),
  createdAt: ts('created_at'),
});

export const regulatedProductIngredients = sqliteTable(
  'regulated_product_ingredients',
  {
    id: id(),
    productId: text('product_id').notNull(),
    ingredientName: text('ingredient_name').notNull(),
    role: text('role').notNull().default('active'),
    quantityText: text('quantity_text'),
    sourceRecordVersionId: text('source_record_version_id'),
    createdAt: ts('created_at'),
  },
  (t) => [index('regulated_product_ingredients_product').on(t.productId)],
);

export const regulatoryApplications = sqliteTable('regulatory_applications', {
  id: id(),
  productId: text('product_id'),
  entityId: text('entity_id'),
  jurisdiction: text('jurisdiction').notNull(),
  authority: text('authority').notNull(),
  applicationType: text('application_type').notNull(),
  nativeApplicationId: text('native_application_id'),
  statusRaw: text('status_raw'),
  normalizedStatus: text('normalized_status').notNull(),
  officialUrl: text('official_url'),
  sourceRecordVersionId: text('source_record_version_id'),
  createdAt: ts('created_at'),
  updatedAt: ts('updated_at'),
});

export const regulatoryIndications = sqliteTable('regulatory_indications', {
  id: id(),
  productId: text('product_id'),
  assertionId: text('assertion_id'),
  indicationText: text('indication_text').notNull(),
  populationContext: text('population_context'),
  jurisdiction: text('jurisdiction').notNull(),
  sourceRecordVersionId: text('source_record_version_id'),
  createdAt: ts('created_at'),
});

export const regulatoryStatusHistory = sqliteTable('regulatory_status_history', {
  id: id(),
  productId: text('product_id'),
  assertionId: text('assertion_id'),
  fromStanding: text('from_standing'),
  toStanding: text('to_standing').notNull(),
  effectiveAt: tsNull('effective_at'),
  sourceRecordVersionId: text('source_record_version_id'),
  note: text('note'),
  createdAt: ts('created_at'),
});

export const productLabelRecords = sqliteTable(
  'product_label_records',
  {
    id: id(),
    productId: text('product_id'),
    entityId: text('entity_id'),
    jurisdiction: text('jurisdiction').notNull(),
    authority: text('authority').notNull(),
    labelVersion: text('label_version'),
    sectionKind: text('section_kind').notNull(),
    sectionTitle: text('section_title'),
    sectionText: text('section_text').notNull(),
    officialUrl: text('official_url'),
    sourceRecordVersionId: text('source_record_version_id'),
    createdAt: ts('created_at'),
  },
  (t) => [index('product_label_records_entity').on(t.entityId)],
);

export const safetyItems = sqliteTable('safety_items', {
  id: id(),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  jurisdiction: text('jurisdiction').notNull(),
  authority: text('authority').notNull(),
  severityClass: text('severity_class'),
  officialUrl: text('official_url'),
  severityCaveat: text('severity_caveat').notNull(),
  sourceRecordVersionId: text('source_record_version_id'),
  currentState: text('current_state').notNull().default('current'),
  createdAt: ts('created_at'),
  updatedAt: ts('updated_at'),
});

export const interventionSafetyLinks = sqliteTable(
  'intervention_safety_links',
  {
    id: id(),
    entityId: text('entity_id').notNull(),
    safetyItemId: text('safety_item_id'),
    signalRecordId: text('signal_record_id'),
    linkRole: text('link_role').notNull().default('related'),
    matchState: text('match_state').notNull().default('unreviewed'),
    createdAt: ts('created_at'),
  },
  (t) => [index('intervention_safety_links_entity').on(t.entityId)],
);

export const dossierSnapshots = sqliteTable('dossier_snapshots', {
  id: id(),
  entityId: text('entity_id').notNull(),
  snapshotKind: text('snapshot_kind').notNull().default('full'),
  rulesetVersion: text('ruleset_version').notNull(),
  inputHash: text('input_hash').notNull(),
  summaryJson: text('summary_json').notNull().default('{}'),
  evidenceMapJson: text('evidence_map_json').notNull().default('{}'),
  regulatoryMatrixJson: text('regulatory_matrix_json').notNull().default('{}'),
  safetyJson: text('safety_json').notNull().default('{}'),
  createdAt: ts('created_at'),
});

export const dossierSourceDependencies = sqliteTable('dossier_source_dependencies', {
  id: id(),
  dossierSnapshotId: text('dossier_snapshot_id').notNull(),
  analysisId: text('analysis_id'),
  claimId: text('claim_id'),
  contentItemId: text('content_item_id'),
  regulatoryAssertionId: text('regulatory_assertion_id'),
  role: text('role').notNull().default('evidence'),
  createdAt: ts('created_at'),
});

export const interventionDossierState = sqliteTable('intervention_dossier_state', {
  entityId: text('entity_id').primaryKey(),
  currentSnapshotId: text('current_snapshot_id'),
  stale: bool('stale').default(false),
  staleReason: text('stale_reason'),
  lastBuiltAt: tsNull('last_built_at'),
  updatedAt: ts('updated_at'),
});

export const dossierChangeEvents = sqliteTable('dossier_change_events', {
  id: id(),
  entityId: text('entity_id').notNull(),
  fromSnapshotId: text('from_snapshot_id'),
  toSnapshotId: text('to_snapshot_id'),
  changeSummary: text('change_summary').notNull(),
  createdAt: ts('created_at'),
});

export const peptideModifications = sqliteTable('peptide_modifications', {
  id: id(),
  profileId: text('profile_id').notNull(),
  sequenceId: text('sequence_id'),
  modificationType: text('modification_type').notNull(),
  positionOrRange: text('position_or_range'),
  sourceWording: text('source_wording'),
  sourceId: text('source_id'),
  sourceRecordVersionId: text('source_record_version_id'),
  reviewState: text('review_state').notNull().default('accepted'),
  createdAt: ts('created_at'),
});

export const regulatorSignalRecords = sqliteTable(
  'regulator_signal_records',
  {
    id: id(),
    authority: text('authority').notNull(),
    jurisdiction: text('jurisdiction').notNull(),
    quarter: text('quarter'),
    publishedAt: tsNull('published_at'),
    productOrClass: text('product_or_class').notNull(),
    signalText: text('signal_text').notNull(),
    additionalInformation: text('additional_information'),
    officialUrl: text('official_url'),
    entityId: text('entity_id'),
    sourceRecordVersionId: text('source_record_version_id'),
    provenCausality: bool('proven_causality').default(false),
    currentState: text('current_state').notNull().default('current'),
    createdAt: ts('created_at'),
  },
  (t) => [index('regulator_signals_entity').on(t.entityId)],
);

export const adverseEventQueryDefinitions = sqliteTable('adverse_event_query_definitions', {
  id: id(),
  label: text('label').notNull(),
  authority: text('authority').notNull(),
  queryJson: text('query_json').notNull().default('{}'),
  identifierScheme: text('identifier_scheme'),
  identifierValue: text('identifier_value'),
  reviewed: bool('reviewed').default(false),
  createdAt: ts('created_at'),
  updatedAt: ts('updated_at'),
});

export const adverseEventReportingSnapshots = sqliteTable('adverse_event_reporting_snapshots', {
  id: id(),
  queryDefinitionId: text('query_definition_id').notNull(),
  entityId: text('entity_id'),
  fetchedAt: ts('fetched_at'),
  totalCount: integer('total_count'),
  zeroIsNotSafe: bool('zero_is_not_safe').default(true),
  sourceRecordVersionId: text('source_record_version_id'),
  caveat: text('caveat').notNull(),
  createdAt: ts('created_at'),
});

export const adverseEventTermCounts = sqliteTable('adverse_event_term_counts', {
  id: id(),
  snapshotId: text('snapshot_id').notNull(),
  term: text('term').notNull(),
  count: integer('count').notNull(),
  createdAt: ts('created_at'),
});

export const trialInterventionEntityLinks = sqliteTable(
  'trial_intervention_entity_links',
  {
    id: id(),
    trialInterventionId: text('trial_intervention_id').notNull(),
    trialId: text('trial_id').notNull(),
    entityId: text('entity_id').notNull(),
    sourceTerm: text('source_term').notNull(),
    mappingState: text('mapping_state').notNull(),
    ruleOrDecisionId: text('rule_or_decision_id').notNull(),
    effectiveAt: ts('effective_at'),
    supersededAt: tsNull('superseded_at'),
  },
  (t) => [index('trial_entity_links_entity').on(t.entityId)],
);
