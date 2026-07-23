-- Milestone 4 follow-on: safety aggregates, peptide modifications, trial portfolio links, regulator signals
CREATE TABLE IF NOT EXISTS `peptide_modifications` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`sequence_id` text,
	`modification_type` text NOT NULL,
	`position_or_range` text,
	`source_wording` text,
	`source_id` text,
	`source_record_version_id` text,
	`review_state` text DEFAULT 'accepted' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `regulator_signal_records` (
	`id` text PRIMARY KEY NOT NULL,
	`authority` text NOT NULL,
	`jurisdiction` text NOT NULL,
	`quarter` text,
	`published_at` integer,
	`product_or_class` text NOT NULL,
	`signal_text` text NOT NULL,
	`additional_information` text,
	`official_url` text,
	`entity_id` text,
	`source_record_version_id` text,
	`proven_causality` integer DEFAULT false NOT NULL,
	`current_state` text DEFAULT 'current' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `adverse_event_query_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`authority` text NOT NULL,
	`query_json` text DEFAULT '{}' NOT NULL,
	`identifier_scheme` text,
	`identifier_value` text,
	`reviewed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `adverse_event_reporting_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`query_definition_id` text NOT NULL,
	`entity_id` text,
	`fetched_at` integer NOT NULL,
	`total_count` integer,
	`zero_is_not_safe` integer DEFAULT true NOT NULL,
	`source_record_version_id` text,
	`caveat` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `adverse_event_term_counts` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot_id` text NOT NULL,
	`term` text NOT NULL,
	`count` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `trial_intervention_entity_links` (
	`id` text PRIMARY KEY NOT NULL,
	`trial_intervention_id` text NOT NULL,
	`trial_id` text NOT NULL,
	`entity_id` text NOT NULL,
	`source_term` text NOT NULL,
	`mapping_state` text NOT NULL,
	`rule_or_decision_id` text NOT NULL,
	`effective_at` integer NOT NULL,
	`superseded_at` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `trial_entity_links_entity` ON `trial_intervention_entity_links` (`entity_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `regulator_signals_entity` ON `regulator_signal_records` (`entity_id`);
