CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `change_events` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`occurred_at` integer NOT NULL,
	`detected_at` integer NOT NULL,
	`content_item_id` text,
	`source_object_id` text,
	`source_record_version_id` text,
	`importance` text DEFAULT 'medium' NOT NULL,
	`is_baseline` integer DEFAULT false NOT NULL,
	`dedupe_key` text NOT NULL,
	`data_origin` text DEFAULT 'live' NOT NULL,
	FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_object_id`) REFERENCES `source_objects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `change_events_dedupe` ON `change_events` (`dedupe_key`);--> statement-breakpoint
CREATE TABLE `connector_checkpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`feed_id` text,
	`connector_version` text NOT NULL,
	`checkpoint_schema_version` integer DEFAULT 1 NOT NULL,
	`cursor_json` text DEFAULT '{}' NOT NULL,
	`window_start_at` integer,
	`window_end_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`feed_id`) REFERENCES `source_feeds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `checkpoints_source_feed` ON `connector_checkpoints` (`source_id`,`feed_id`);--> statement-breakpoint
CREATE TABLE `content_item_sources` (
	`content_item_id` text NOT NULL,
	`source_object_id` text NOT NULL,
	`role` text DEFAULT 'primary' NOT NULL,
	`first_linked_at` integer NOT NULL,
	`last_linked_at` integer NOT NULL,
	FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_object_id`) REFERENCES `source_objects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_item_sources_pk` ON `content_item_sources` (`content_item_id`,`source_object_id`);--> statement-breakpoint
CREATE TABLE `content_items` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`data_origin` text DEFAULT 'live' NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`source_published_at` integer,
	`source_updated_at` integer,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`canonical_url` text,
	`record_status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `content_items_type` ON `content_items` (`type`);--> statement-breakpoint
CREATE INDEX `content_items_origin` ON `content_items` (`data_origin`);--> statement-breakpoint
CREATE TABLE `external_identifiers` (
	`id` text PRIMARY KEY NOT NULL,
	`content_item_id` text NOT NULL,
	`scheme` text NOT NULL,
	`value` text NOT NULL,
	`source_id` text,
	FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `external_ids_scheme_value` ON `external_identifiers` (`scheme`,`value`);--> statement-breakpoint
CREATE TABLE `ingestion_run_errors` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`source_id` text,
	`external_id` text,
	`stage` text NOT NULL,
	`error_code` text NOT NULL,
	`message` text NOT NULL,
	`retryable` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`diagnostics_json` text,
	FOREIGN KEY (`run_id`) REFERENCES `ingestion_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ingestion_run_snapshots` (
	`run_id` text NOT NULL,
	`raw_snapshot_id` text NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `ingestion_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`raw_snapshot_id`) REFERENCES `raw_snapshots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `run_snapshots_pk` ON `ingestion_run_snapshots` (`run_id`,`raw_snapshot_id`);--> statement-breakpoint
CREATE TABLE `ingestion_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text,
	`parent_run_id` text,
	`trigger` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`cursor_before_json` text,
	`cursor_after_json` text,
	`fetched_page_count` integer DEFAULT 0 NOT NULL,
	`remote_record_count` integer DEFAULT 0 NOT NULL,
	`raw_snapshot_count` integer DEFAULT 0 NOT NULL,
	`new_object_count` integer DEFAULT 0 NOT NULL,
	`new_version_count` integer DEFAULT 0 NOT NULL,
	`unchanged_count` integer DEFAULT 0 NOT NULL,
	`content_upsert_count` integer DEFAULT 0 NOT NULL,
	`change_event_count` integer DEFAULT 0 NOT NULL,
	`warning_count` integer DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`summary` text,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `paper_authors` (
	`id` text PRIMARY KEY NOT NULL,
	`paper_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`display_name` text NOT NULL,
	`given_name` text,
	`family_name` text,
	`orcid` text,
	`affiliation` text,
	FOREIGN KEY (`paper_id`) REFERENCES `papers`(`content_item_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `paper_funders` (
	`id` text PRIMARY KEY NOT NULL,
	`paper_id` text NOT NULL,
	`name` text NOT NULL,
	`award_id` text,
	FOREIGN KEY (`paper_id`) REFERENCES `papers`(`content_item_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `papers` (
	`content_item_id` text PRIMARY KEY NOT NULL,
	`pmid` text,
	`doi` text,
	`journal` text,
	`publisher` text,
	`publication_status` text,
	`publication_type` text,
	`language` text,
	`licence` text,
	`is_correction_or_retraction` integer DEFAULT false NOT NULL,
	`correction_note` text,
	FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `raw_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`feed_id` text,
	`sha256` text NOT NULL,
	`storage_key` text NOT NULL,
	`media_type` text NOT NULL,
	`encoding` text,
	`compression` text DEFAULT 'gzip' NOT NULL,
	`byte_length` integer NOT NULL,
	`compressed_byte_length` integer NOT NULL,
	`retrieved_at` integer NOT NULL,
	`etag` text,
	`last_modified` text,
	`request_fingerprint` text,
	`connector_version` text NOT NULL,
	`parser_version` text NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`feed_id`) REFERENCES `source_feeds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `raw_snapshots_source_hash` ON `raw_snapshots` (`source_id`,`sha256`);--> statement-breakpoint
CREATE TABLE `regulatory_events` (
	`content_item_id` text PRIMARY KEY NOT NULL,
	`jurisdiction` text DEFAULT 'AU' NOT NULL,
	`authority` text DEFAULT 'TGA' NOT NULL,
	`feed_key` text,
	`category` text,
	`guid` text,
	`published_at` integer,
	`official_url` text,
	`relevance_matched` integer DEFAULT false NOT NULL,
	`relevance_terms_json` text,
	FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `source_feeds` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`feed_key` text NOT NULL,
	`url` text NOT NULL,
	`category` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`etag` text,
	`last_modified` text,
	`last_checked_at` integer,
	`last_success_at` integer,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_feeds_source_key` ON `source_feeds` (`source_id`,`feed_key`);--> statement-breakpoint
CREATE TABLE `source_objects` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`external_id` text NOT NULL,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`current_version_id` text,
	`source_created_at` integer,
	`source_updated_at` integer,
	`canonical_url` text,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_objects_external` ON `source_objects` (`source_id`,`external_id`);--> statement-breakpoint
CREATE TABLE `source_record_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`source_object_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`raw_snapshot_id` text NOT NULL,
	`normalized_hash` text NOT NULL,
	`source_timestamp` integer,
	`first_observed_at` integer NOT NULL,
	`parser_version` text NOT NULL,
	`validation_status` text DEFAULT 'ok' NOT NULL,
	`diagnostics_json` text,
	FOREIGN KEY (`source_object_id`) REFERENCES `source_objects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`raw_snapshot_id`) REFERENCES `raw_snapshots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_versions_hash` ON `source_record_versions` (`source_object_id`,`normalized_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `source_versions_number` ON `source_record_versions` (`source_object_id`,`version_number`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`kind` text NOT NULL,
	`official_base_url` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`health_state` text DEFAULT 'never_run' NOT NULL,
	`last_attempt_at` integer,
	`last_success_at` integer,
	`last_failure_at` integer,
	`consecutive_failures` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trial_conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`trial_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`trial_id`) REFERENCES `trials`(`content_item_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trial_interventions` (
	`id` text PRIMARY KEY NOT NULL,
	`trial_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text,
	FOREIGN KEY (`trial_id`) REFERENCES `trials`(`content_item_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trial_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`trial_id` text NOT NULL,
	`facility` text,
	`city` text,
	`state` text,
	`postcode` text,
	`country` text,
	`latitude` text,
	`longitude` text,
	FOREIGN KEY (`trial_id`) REFERENCES `trials`(`content_item_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trial_outcomes` (
	`id` text PRIMARY KEY NOT NULL,
	`trial_id` text NOT NULL,
	`outcome_type` text NOT NULL,
	`measure` text,
	`description` text,
	`time_frame` text,
	FOREIGN KEY (`trial_id`) REFERENCES `trials`(`content_item_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trial_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`trial_id` text NOT NULL,
	`status` text NOT NULL,
	`effective_at` integer,
	`detected_at` integer NOT NULL,
	`source_record_version_id` text,
	`event_key` text NOT NULL,
	FOREIGN KEY (`trial_id`) REFERENCES `trials`(`content_item_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trial_status_event_key` ON `trial_status_history` (`trial_id`,`event_key`);--> statement-breakpoint
CREATE TABLE `trials` (
	`content_item_id` text PRIMARY KEY NOT NULL,
	`nct_id` text NOT NULL,
	`overall_status` text NOT NULL,
	`study_type` text,
	`phases_json` text,
	`brief_title` text,
	`official_title` text,
	`sponsor` text,
	`enrollment_count` integer,
	`enrollment_type` text,
	`start_date` text,
	`primary_completion_date` text,
	`completion_date` text,
	`first_posted_date` text,
	`last_update_posted_date` text,
	`results_first_posted_date` text,
	`results_posted` integer DEFAULT false NOT NULL,
	`healthy_volunteers` integer,
	`min_age_text` text,
	`max_age_text` text,
	`sex_eligibility` text,
	`australia_location` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON UPDATE no action ON DELETE no action
);
