-- Milestone 5 creator / platform claim intelligence
CREATE TABLE IF NOT EXISTS `creator_entities` (
	`id` text PRIMARY KEY NOT NULL,
	`preferred_name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`creator_kind` text DEFAULT 'individual' NOT NULL,
	`lifecycle_state` text DEFAULT 'active' NOT NULL,
	`identity_confidence` text DEFAULT 'medium' NOT NULL,
	`neutral_description` text,
	`current_profile_snapshot_id` text,
	`redirect_target_id` text,
	`data_origin` text DEFAULT 'live' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_entities_norm` ON `creator_entities` (`normalized_name`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `creator_aliases` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`alias_text` text NOT NULL,
	`normalized_alias` text NOT NULL,
	`review_state` text DEFAULT 'accepted' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `creator_platform_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`platform` text NOT NULL,
	`external_account_id` text NOT NULL,
	`handle` text,
	`canonical_url` text,
	`monitored` integer DEFAULT false NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `creator_platform_ext` ON `creator_platform_accounts` (`platform`,`external_account_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `creator_content_items` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`platform_account_id` text,
	`platform` text NOT NULL,
	`external_id` text NOT NULL,
	`title` text NOT NULL,
	`published_at` integer,
	`canonical_url` text,
	`retention_state` text DEFAULT 'current' NOT NULL,
	`compliance_state` text DEFAULT 'ok' NOT NULL,
	`metadata_only` integer DEFAULT true NOT NULL,
	`source_record_version_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `creator_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`content_item_id` text,
	`filename` text NOT NULL,
	`document_kind` text NOT NULL,
	`rights_basis` text NOT NULL,
	`storage_key` text NOT NULL,
	`byte_length` integer NOT NULL,
	`sha256` text NOT NULL,
	`parsed_text_excerpt` text,
	`review_state` text DEFAULT 'accepted' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `creator_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`content_item_id` text,
	`document_id` text,
	`claim_text` text NOT NULL,
	`assertion_role` text NOT NULL,
	`excerpt` text NOT NULL,
	`field_path` text NOT NULL,
	`confidence` text NOT NULL,
	`recurrence_key` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`alignment_json` text DEFAULT '{}' NOT NULL,
	`extraction_version` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `creator_claims_recurrence` ON `creator_claims` (`recurrence_key`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `creator_claim_links` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_claim_id` text NOT NULL,
	`linked_claim_id` text,
	`linked_analysis_id` text,
	`linked_entity_id` text,
	`linked_assertion_id` text,
	`link_role` text DEFAULT 'evidence_alignment' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `creator_disclosures` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`creator_claim_id` text,
	`disclosure_text` text NOT NULL,
	`source` text DEFAULT 'document' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `creator_profile_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`summary_json` text DEFAULT '{}' NOT NULL,
	`ruleset_version` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `platform_policy_state` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`policy_key` text NOT NULL,
	`status` text NOT NULL,
	`detail_json` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `x_budget_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`period_key` text NOT NULL,
	`spent_micros` integer DEFAULT 0 NOT NULL,
	`cap_micros` integer NOT NULL,
	`acknowledged` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
