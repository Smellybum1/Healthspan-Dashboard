CREATE TABLE `intelligence_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`trigger` text NOT NULL,
	`scope` text DEFAULT 'all' NOT NULL,
	`status` text NOT NULL,
	`ruleset_version` text NOT NULL,
	`ai_enabled` integer DEFAULT false NOT NULL,
	`provider` text,
	`model` text,
	`requested_count` integer DEFAULT 0 NOT NULL,
	`completed_count` integer DEFAULT 0 NOT NULL,
	`deterministic_count` integer DEFAULT 0 NOT NULL,
	`ai_count` integer DEFAULT 0 NOT NULL,
	`review_task_count` integer DEFAULT 0 NOT NULL,
	`reused_count` integer DEFAULT 0 NOT NULL,
	`warning_count` integer DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`summary` text
);--> statement-breakpoint
CREATE TABLE `intelligence_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`content_item_id` text NOT NULL,
	`analysis_mode` text NOT NULL,
	`input_hash` text NOT NULL,
	`ruleset_version` text NOT NULL,
	`segment_builder_version` text NOT NULL,
	`claim_schema_version` text NOT NULL,
	`prompt_version` text,
	`provider` text,
	`model` text,
	`status` text DEFAULT 'complete' NOT NULL,
	`classification_confidence` text NOT NULL,
	`assessment_completeness` text DEFAULT 'partial' NOT NULL,
	`evidence_maturity` text NOT NULL,
	`evidence_availability` text NOT NULL,
	`study_design` text,
	`organism_level` text,
	`results_present` integer DEFAULT false NOT NULL,
	`research_activity` integer DEFAULT 0 NOT NULL,
	`translation_gaps_json` text DEFAULT '[]' NOT NULL,
	`methodological_signals_json` text DEFAULT '[]' NOT NULL,
	`what_would_change_json` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`superseded_at` integer
);--> statement-breakpoint
CREATE INDEX `intelligence_analyses_content` ON `intelligence_analyses` (`content_item_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `intelligence_analyses_identity` ON `intelligence_analyses` (`content_item_id`,`input_hash`,`ruleset_version`);--> statement-breakpoint
CREATE TABLE `content_intelligence_state` (
	`content_item_id` text PRIMARY KEY NOT NULL,
	`current_analysis_id` text,
	`last_successful_analysis_at` integer,
	`stale` integer DEFAULT false NOT NULL,
	`stale_reason` text,
	`pending_job_id` text,
	`last_review_at` integer,
	`updated_at` integer NOT NULL
);--> statement-breakpoint
CREATE TABLE `live_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`analysis_id` text NOT NULL,
	`content_item_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`claim_kind` text NOT NULL,
	`assertion_role` text NOT NULL,
	`claim_text` text NOT NULL,
	`direction` text DEFAULT 'unspecified' NOT NULL,
	`outcome_family` text,
	`extraction_method` text DEFAULT 'deterministic' NOT NULL,
	`classification_confidence` text NOT NULL,
	`review_status` text DEFAULT 'unreviewed' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE INDEX `live_claims_analysis` ON `live_claims` (`analysis_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `live_claims_fingerprint` ON `live_claims` (`analysis_id`,`fingerprint`);--> statement-breakpoint
CREATE TABLE `claim_source_spans` (
	`id` text PRIMARY KEY NOT NULL,
	`claim_id` text NOT NULL,
	`field_path` text NOT NULL,
	`excerpt` text NOT NULL,
	`span_hash` text NOT NULL,
	`primary_support` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE TABLE `live_review_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`content_item_id` text,
	`claim_id` text,
	`analysis_id` text,
	`title` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`confidence` text DEFAULT 'low' NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	`resolution_json` text
);
