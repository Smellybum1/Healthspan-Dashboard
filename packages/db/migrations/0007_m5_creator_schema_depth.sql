-- Milestone 5 creator schema depth (§14 logical entities)
-- Forward-only: ALTER ADD COLUMN on existing tables; CREATE IF NOT EXISTS for new tables/indexes.

ALTER TABLE `creator_aliases` ADD `alias_type` text DEFAULT 'alias';
--> statement-breakpoint
ALTER TABLE `creator_aliases` ADD `source_provenance` text;
--> statement-breakpoint
ALTER TABLE `creator_aliases` ADD `collision_flag` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `creator_aliases` ADD `valid_from` integer;
--> statement-breakpoint
ALTER TABLE `creator_aliases` ADD `valid_to` integer;
--> statement-breakpoint

ALTER TABLE `creator_platform_accounts` ADD `account_state` text DEFAULT 'active';
--> statement-breakpoint
ALTER TABLE `creator_platform_accounts` ADD `identity_confidence` text DEFAULT 'medium';
--> statement-breakpoint
ALTER TABLE `creator_platform_accounts` ADD `last_checked_at` integer;
--> statement-breakpoint
ALTER TABLE `creator_platform_accounts` ADD `platform_data_expiry_at` integer;
--> statement-breakpoint
ALTER TABLE `creator_platform_accounts` ADD `compliance_state` text DEFAULT 'ok';
--> statement-breakpoint
ALTER TABLE `creator_platform_accounts` ADD `source_policy_version` text;
--> statement-breakpoint
ALTER TABLE `creator_platform_accounts` ADD `display_name` text;
--> statement-breakpoint

ALTER TABLE `creator_content_items` ADD `content_type` text DEFAULT 'unknown';
--> statement-breakpoint
ALTER TABLE `creator_content_items` ADD `current_state` text DEFAULT 'current';
--> statement-breakpoint
ALTER TABLE `creator_content_items` ADD `last_retrieved_at` integer;
--> statement-breakpoint
ALTER TABLE `creator_content_items` ADD `refresh_deadline_at` integer;
--> statement-breakpoint
ALTER TABLE `creator_content_items` ADD `policy_version` text;
--> statement-breakpoint

ALTER TABLE `creator_documents` ADD `mime_type` text;
--> statement-breakpoint
ALTER TABLE `creator_documents` ADD `rights_declared_at` integer;
--> statement-breakpoint
ALTER TABLE `creator_documents` ADD `claim_eligible` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `creator_documents` ADD `source_url` text;
--> statement-breakpoint
ALTER TABLE `creator_documents` ADD `lifecycle_state` text DEFAULT 'current';
--> statement-breakpoint
ALTER TABLE `creator_documents` ADD `account_id` text;
--> statement-breakpoint

ALTER TABLE `creator_claims` ADD `account_id` text;
--> statement-breakpoint
ALTER TABLE `creator_claims` ADD `claim_fingerprint` text;
--> statement-breakpoint
ALTER TABLE `creator_claims` ADD `claim_kind` text;
--> statement-breakpoint
ALTER TABLE `creator_claims` ADD `direction` text;
--> statement-breakpoint
ALTER TABLE `creator_claims` ADD `certainty_language` text;
--> statement-breakpoint
ALTER TABLE `creator_claims` ADD `intervention_text` text;
--> statement-breakpoint
ALTER TABLE `creator_claims` ADD `population_text` text;
--> statement-breakpoint
ALTER TABLE `creator_claims` ADD `organism` text;
--> statement-breakpoint
ALTER TABLE `creator_claims` ADD `comparator` text;
--> statement-breakpoint
ALTER TABLE `creator_claims` ADD `outcome_text` text;
--> statement-breakpoint
ALTER TABLE `creator_claims` ADD `timeframe` text;
--> statement-breakpoint
ALTER TABLE `creator_claims` ADD `regulatory_scope` text;
--> statement-breakpoint
ALTER TABLE `creator_claims` ADD `review_status` text DEFAULT 'unreviewed';
--> statement-breakpoint
ALTER TABLE `creator_claims` ADD `lifecycle_state` text DEFAULT 'current';
--> statement-breakpoint

ALTER TABLE `creator_disclosures` ADD `review_state` text DEFAULT 'accepted';
--> statement-breakpoint
ALTER TABLE `creator_disclosures` ADD `source_url` text;
--> statement-breakpoint

ALTER TABLE `creator_profile_snapshots` ADD `input_dependency_hash` text;
--> statement-breakpoint
ALTER TABLE `creator_profile_snapshots` ADD `status` text DEFAULT 'ready';
--> statement-breakpoint
ALTER TABLE `creator_profile_snapshots` ADD `counts_json` text DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE `creator_profile_snapshots` ADD `policy_redaction_state` text DEFAULT 'none';
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`role` text NOT NULL,
	`source_statement_id` text,
	`provenance_state` text NOT NULL DEFAULT 'declared',
	`review_state` text NOT NULL DEFAULT 'accepted',
	`valid_from` integer,
	`valid_to` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_roles_creator` ON `creator_roles` (`creator_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_account_identity_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`candidate_creator_id` text NOT NULL,
	`match_method` text NOT NULL,
	`evidence_json` text NOT NULL DEFAULT '{}',
	`state` text NOT NULL DEFAULT 'candidate',
	`confidence` text NOT NULL DEFAULT 'medium',
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_identity_candidates_account` ON `creator_account_identity_candidates` (`account_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_identity_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`candidate_id` text,
	`reason` text NOT NULL,
	`proposed_creator_id` text,
	`current_state` text NOT NULL DEFAULT 'open',
	`source_evidence_json` text NOT NULL DEFAULT '{}',
	`priority` integer NOT NULL DEFAULT 0,
	`review_status` text NOT NULL DEFAULT 'pending',
	`stale` integer NOT NULL DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_identity_tasks_queue` ON `creator_identity_tasks` (`review_status`, `priority`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_profile_statements` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`statement_type` text NOT NULL,
	`subject` text,
	`predicate` text,
	`value_text` text NOT NULL,
	`provenance_state` text NOT NULL DEFAULT 'declared',
	`source_url` text,
	`source_content_id` text,
	`source_document_id` text,
	`source_span_json` text,
	`review_state` text NOT NULL DEFAULT 'accepted',
	`effective_at` integer,
	`superseded_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_profile_statements_creator` ON `creator_profile_statements` (`creator_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `monitored_creator_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`enabled` integer NOT NULL DEFAULT true,
	`paused` integer NOT NULL DEFAULT false,
	`onboarding_method` text NOT NULL,
	`user_label` text,
	`tags_json` text NOT NULL DEFAULT '[]',
	`sync_policy_json` text NOT NULL DEFAULT '{}',
	`initial_lookback_days` integer,
	`include_replies` integer NOT NULL DEFAULT false,
	`include_reposts` integer NOT NULL DEFAULT false,
	`added_at` integer NOT NULL,
	`last_synced_at` integer,
	`next_due_at` integer,
	`budget_quota_policy_json` text NOT NULL DEFAULT '{}',
	`removed_at` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `monitored_sources_due` ON `monitored_creator_sources` (`enabled`, `next_due_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `monitored_sources_account` ON `monitored_creator_sources` (`account_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `platform_policy_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`policy_id` text NOT NULL,
	`policy_version` text NOT NULL,
	`checked_at` integer NOT NULL,
	`official_reference` text,
	`refresh_delete_rule` text,
	`display_rule` text,
	`export_rule` text,
	`ai_rule` text,
	`current_state` text NOT NULL DEFAULT 'current',
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `platform_policy_versions_platform` ON `platform_policy_versions` (`platform`, `current_state`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `platform_content_current` (
	`id` text PRIMARY KEY NOT NULL,
	`content_item_id` text NOT NULL,
	`title` text,
	`description` text,
	`text_body` text,
	`duration_seconds` integer,
	`status_text` text,
	`thumbnail_url` text,
	`paid_placement_declared` integer NOT NULL DEFAULT false,
	`caption_available` integer NOT NULL DEFAULT false,
	`source_version_identity` text,
	`content_hash` text,
	`retrieved_at` integer NOT NULL,
	`expiry_at` integer,
	`display_eligible` integer NOT NULL DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `platform_content_current_item` ON `platform_content_current` (`content_item_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `platform_content_tombstones` (
	`id` text PRIMARY KEY NOT NULL,
	`content_item_id` text NOT NULL,
	`platform` text NOT NULL,
	`content_id_hash` text,
	`unavailability_reason` text NOT NULL,
	`compliance_event_id` text,
	`purged_at` integer NOT NULL,
	`audit_metadata_json` text NOT NULL DEFAULT '{}',
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `platform_tombstones_hash` ON `platform_content_tombstones` (`content_id_hash`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `platform_tombstones_item` ON `platform_content_tombstones` (`content_item_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `platform_compliance_events` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`content_item_id` text,
	`account_id` text,
	`event_type` text NOT NULL,
	`source_event_or_cursor` text,
	`received_at` integer NOT NULL,
	`applied_at` integer,
	`action_taken` text,
	`error_retry_state` text,
	`detail_json` text NOT NULL DEFAULT '{}',
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `platform_compliance_events_platform` ON `platform_compliance_events` (`platform`, `received_at`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `platform_retention_job_results` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`policy_version` text,
	`background_job_id` text,
	`due_record_count` integer NOT NULL DEFAULT 0,
	`refreshed_count` integer NOT NULL DEFAULT 0,
	`purged_count` integer NOT NULL DEFAULT 0,
	`hidden_count` integer NOT NULL DEFAULT 0,
	`status` text NOT NULL DEFAULT 'pending',
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `platform_retention_results_platform` ON `platform_retention_job_results` (`platform`, `status`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `platform_quota_ledgers` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`period_key` text NOT NULL,
	`method_or_resource` text NOT NULL,
	`units_or_reads` integer NOT NULL DEFAULT 0,
	`estimated_cost_micros` integer NOT NULL DEFAULT 0,
	`price_table_version` text,
	`app_cap` integer,
	`remaining_allowance` integer,
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `platform_quota_period_method` ON `platform_quota_ledgers` (`platform`, `period_key`, `method_or_resource`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `platform_price_tables` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`checked_at` integer NOT NULL,
	`currency` text NOT NULL DEFAULT 'USD',
	`resource_type` text NOT NULL,
	`unit_price_micros` integer NOT NULL,
	`source_url` text,
	`lifecycle_state` text NOT NULL DEFAULT 'active',
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `platform_price_tables_platform` ON `platform_price_tables` (`platform`, `lifecycle_state`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_document_segments` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`segment_kind` text NOT NULL,
	`start_ms` integer,
	`end_ms` integer,
	`char_start` integer,
	`char_end` integer,
	`text` text NOT NULL,
	`text_hash` text NOT NULL,
	`source_line_or_cue_ids` text,
	`claim_eligible` integer NOT NULL DEFAULT true,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_doc_segments_document` ON `creator_document_segments` (`document_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_claim_source_spans` (
	`id` text PRIMARY KEY NOT NULL,
	`claim_id` text NOT NULL,
	`content_item_id` text,
	`document_id` text,
	`segment_id` text,
	`platform_content_version` text,
	`start_ms` integer,
	`end_ms` integer,
	`char_start` integer,
	`char_end` integer,
	`bounded_excerpt` text NOT NULL,
	`excerpt_word_count` integer NOT NULL DEFAULT 0,
	`span_hash` text NOT NULL,
	`source_url` text,
	`primary_support` integer NOT NULL DEFAULT true,
	`display_eligible` integer NOT NULL DEFAULT true,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_claim_spans_claim` ON `creator_claim_source_spans` (`claim_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_claim_concepts` (
	`id` text PRIMARY KEY NOT NULL,
	`claim_id` text NOT NULL,
	`concept_type` text NOT NULL,
	`concept_id` text,
	`source_term` text,
	`assignment_method` text NOT NULL,
	`confidence` text NOT NULL DEFAULT 'medium',
	`review_state` text NOT NULL DEFAULT 'candidate',
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_claim_concepts_claim` ON `creator_claim_concepts` (`claim_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_claim_concepts_type` ON `creator_claim_concepts` (`concept_type`, `concept_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_claim_evidence_links` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_claim_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`link_role` text NOT NULL,
	`detection_method` text NOT NULL,
	`compatibility_dimensions_json` text NOT NULL DEFAULT '[]',
	`link_state` text NOT NULL DEFAULT 'candidate',
	`rationale` text,
	`source_or_version` text,
	`created_at` integer NOT NULL,
	`reviewed_at` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_claim_evidence_claim` ON `creator_claim_evidence_links` (`creator_claim_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_claim_evidence_target` ON `creator_claim_evidence_links` (`target_type`, `target_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_claim_alignment_assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_claim_id` text NOT NULL,
	`input_dependency_hash` text NOT NULL,
	`ruleset_version` text NOT NULL,
	`status` text NOT NULL DEFAULT 'ready',
	`completeness` text,
	`extraction_confidence` text,
	`lifecycle_state` text NOT NULL DEFAULT 'current',
	`deterministic_summary` text NOT NULL,
	`analysis_identity` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `creator_alignment_analysis_identity` ON `creator_claim_alignment_assessments` (`analysis_identity`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_alignment_claim` ON `creator_claim_alignment_assessments` (`creator_claim_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_claim_alignment_dimensions` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`dimension` text NOT NULL,
	`state` text NOT NULL,
	`creator_claim_value` text,
	`linked_evidence_value` text,
	`explanation` text,
	`evidence_link_id` text,
	`method` text,
	`review_state` text NOT NULL DEFAULT 'accepted',
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_alignment_dims_assessment` ON `creator_claim_alignment_dimensions` (`assessment_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_claim_findings` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`finding_type` text NOT NULL,
	`finding_state` text NOT NULL DEFAULT 'candidate',
	`explanation` text NOT NULL,
	`review_required` integer NOT NULL DEFAULT true,
	`review_decision` text,
	`created_at` integer NOT NULL,
	`reviewed_at` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_claim_findings_assessment` ON `creator_claim_findings` (`assessment_id`, `finding_state`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_claim_relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`source_claim_id` text NOT NULL,
	`target_claim_id` text NOT NULL,
	`relationship_type` text NOT NULL,
	`relationship_state` text NOT NULL DEFAULT 'candidate',
	`similarity_features_json` text NOT NULL DEFAULT '{}',
	`scope_compatibility` text,
	`created_at` integer NOT NULL,
	`reviewed_at` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_claim_rels_source` ON `creator_claim_relationships` (`source_claim_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_claim_rels_target` ON `creator_claim_relationships` (`target_claim_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_corrections` (
	`id` text PRIMARY KEY NOT NULL,
	`original_claim_id` text,
	`original_content_id` text,
	`correction_claim_id` text,
	`correction_content_id` text,
	`relationship_kind` text NOT NULL,
	`source_evidence_json` text NOT NULL DEFAULT '{}',
	`review_state` text NOT NULL DEFAULT 'accepted',
	`effective_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_corrections_original` ON `creator_corrections` (`original_claim_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_profile_state` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`current_snapshot_id` text,
	`stale` integer NOT NULL DEFAULT false,
	`stale_reason` text,
	`pending_job_id` text,
	`last_successful_rebuild_at` integer,
	`last_reviewed_at` integer,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `creator_profile_state_creator` ON `creator_profile_state` (`creator_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_profile_state_stale` ON `creator_profile_state` (`stale`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `creator_events` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text,
	`account_id` text,
	`claim_id` text,
	`event_kind` text NOT NULL,
	`baseline` integer NOT NULL DEFAULT false,
	`deterministic_summary` text NOT NULL,
	`source_date` integer,
	`detection_date` integer NOT NULL,
	`source_policy_state` text,
	`dedupe_key` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `creator_events_dedupe` ON `creator_events` (`dedupe_key`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_events_creator` ON `creator_events` (`creator_id`, `detection_date`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `claim_recurrence_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`claim_theme_concept` text NOT NULL,
	`window_start` integer NOT NULL,
	`window_end` integer NOT NULL,
	`distinct_monitored_source_count` integer NOT NULL DEFAULT 0,
	`reviewed_claim_count` integer NOT NULL DEFAULT 0,
	`linked_evidence_maturity` text,
	`correction_count` integer NOT NULL DEFAULT 0,
	`conflict_count` integer NOT NULL DEFAULT 0,
	`source_unavailable_count` integer NOT NULL DEFAULT 0,
	`formula_version` text NOT NULL,
	`source_scope_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `claim_recurrence_theme_window` ON `claim_recurrence_snapshots` (`claim_theme_concept`, `window_start`, `window_end`);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `creator_entities_lifecycle` ON `creator_entities` (`lifecycle_state`, `normalized_name`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_content_platform_published` ON `creator_content_items` (`platform`, `platform_account_id`, `published_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_content_refresh_deadline` ON `creator_content_items` (`refresh_deadline_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_documents_rights_eligible` ON `creator_documents` (`rights_basis`, `claim_eligible`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_claims_creator_kind_status` ON `creator_claims` (`creator_id`, `claim_kind`, `review_status`, `created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `x_budget_ledger_period` ON `x_budget_ledger` (`period_key`);
