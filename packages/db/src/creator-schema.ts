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
  (t) => [index('creator_entities_norm').on(t.normalizedName)],
);

export const creatorAliases = sqliteTable('creator_aliases', {
  id: id(),
  creatorId: text('creator_id').notNull(),
  aliasText: text('alias_text').notNull(),
  normalizedAlias: text('normalized_alias').notNull(),
  reviewState: text('review_state').notNull().default('accepted'),
  createdAt: ts('created_at'),
});

export const creatorPlatformAccounts = sqliteTable(
  'creator_platform_accounts',
  {
    id: id(),
    creatorId: text('creator_id').notNull(),
    platform: text('platform').notNull(),
    externalAccountId: text('external_account_id').notNull(),
    handle: text('handle'),
    canonicalUrl: text('canonical_url'),
    monitored: bool('monitored').default(false),
    enabled: bool('enabled').default(true),
    createdAt: ts('created_at'),
  },
  (t) => [uniqueIndex('creator_platform_ext').on(t.platform, t.externalAccountId)],
);

export const creatorContentItems = sqliteTable('creator_content_items', {
  id: id(),
  creatorId: text('creator_id').notNull(),
  platformAccountId: text('platform_account_id'),
  platform: text('platform').notNull(),
  externalId: text('external_id').notNull(),
  title: text('title').notNull(),
  publishedAt: tsNull('published_at'),
  canonicalUrl: text('canonical_url'),
  retentionState: text('retention_state').notNull().default('current'),
  complianceState: text('compliance_state').notNull().default('ok'),
  metadataOnly: bool('metadata_only').default(true),
  sourceRecordVersionId: text('source_record_version_id'),
  createdAt: ts('created_at'),
  updatedAt: ts('updated_at'),
});

export const creatorDocuments = sqliteTable('creator_documents', {
  id: id(),
  creatorId: text('creator_id').notNull(),
  contentItemId: text('content_item_id'),
  filename: text('filename').notNull(),
  documentKind: text('document_kind').notNull(),
  rightsBasis: text('rights_basis').notNull(),
  storageKey: text('storage_key').notNull(),
  byteLength: integer('byte_length').notNull(),
  sha256: text('sha256').notNull(),
  parsedTextExcerpt: text('parsed_text_excerpt'),
  reviewState: text('review_state').notNull().default('accepted'),
  createdAt: ts('created_at'),
});

export const creatorClaims = sqliteTable(
  'creator_claims',
  {
    id: id(),
    creatorId: text('creator_id').notNull(),
    contentItemId: text('content_item_id'),
    documentId: text('document_id'),
    claimText: text('claim_text').notNull(),
    assertionRole: text('assertion_role').notNull(),
    excerpt: text('excerpt').notNull(),
    fieldPath: text('field_path').notNull(),
    confidence: text('confidence').notNull(),
    recurrenceKey: text('recurrence_key').notNull(),
    active: bool('active').default(true),
    alignmentJson: text('alignment_json').notNull().default('{}'),
    extractionVersion: text('extraction_version').notNull(),
    createdAt: ts('created_at'),
  },
  (t) => [index('creator_claims_recurrence').on(t.recurrenceKey)],
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

export const creatorDisclosures = sqliteTable('creator_disclosures', {
  id: id(),
  creatorId: text('creator_id').notNull(),
  creatorClaimId: text('creator_claim_id'),
  disclosureText: text('disclosure_text').notNull(),
  source: text('source').notNull().default('document'),
  createdAt: ts('created_at'),
});

export const creatorProfileSnapshots = sqliteTable('creator_profile_snapshots', {
  id: id(),
  creatorId: text('creator_id').notNull(),
  summaryJson: text('summary_json').notNull().default('{}'),
  rulesetVersion: text('ruleset_version').notNull(),
  createdAt: ts('created_at'),
});

export const platformPolicyState = sqliteTable('platform_policy_state', {
  id: id(),
  platform: text('platform').notNull(),
  policyKey: text('policy_key').notNull(),
  status: text('status').notNull(),
  detailJson: text('detail_json').notNull().default('{}'),
  updatedAt: ts('updated_at'),
});

export const xBudgetLedger = sqliteTable('x_budget_ledger', {
  id: id(),
  periodKey: text('period_key').notNull(),
  spentMicros: integer('spent_micros').notNull().default(0),
  capMicros: integer('cap_micros').notNull(),
  acknowledged: bool('acknowledged').default(false),
  updatedAt: ts('updated_at'),
});
