-- M6 personalisation, alerts, briefs, backup/ops schema
CREATE TABLE IF NOT EXISTS `local_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL DEFAULT 'local_single_user',
	`active` integer NOT NULL DEFAULT true,
	`timezone` text NOT NULL DEFAULT 'Australia/Brisbane',
	`schema_version` integer NOT NULL DEFAULT 1,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `profile_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`preference_key` text NOT NULL,
	`value_json` text NOT NULL,
	`value_version` integer NOT NULL DEFAULT 1,
	`source` text NOT NULL DEFAULT 'default',
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `profile_preferences_unique` ON `profile_preferences` (`profile_id`,`preference_key`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `preference_migration_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`browser_identity_hash` text NOT NULL,
	`source_schema_version` integer NOT NULL,
	`preview_count` integer NOT NULL DEFAULT 0,
	`imported_count` integer NOT NULL DEFAULT 0,
	`skipped_count` integer NOT NULL DEFAULT 0,
	`unresolved_count` integer NOT NULL DEFAULT 0,
	`status` text NOT NULL,
	`error_summary` text,
	`created_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `watchable_objects` (
	`id` text PRIMARY KEY NOT NULL,
	`data_origin` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`display_title` text,
	`canonical_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `watchable_objects_unique` ON `watchable_objects` (`data_origin`,`target_type`,`target_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `watchlists` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`is_default` integer NOT NULL DEFAULT false,
	`active` integer NOT NULL DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `watchlists_profile_slug` ON `watchlists` (`profile_id`,`slug`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `watchlist_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`watchlist_id` text NOT NULL,
	`watchable_id` text NOT NULL,
	`priority` integer NOT NULL DEFAULT 100,
	`state` text NOT NULL DEFAULT 'active',
	`source` text NOT NULL DEFAULT 'user',
	`added_at` integer NOT NULL,
	`removed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `watchlist_entries_active_unique` ON `watchlist_entries` (`watchlist_id`,`watchable_id`,`state`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `saved_searches` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`query_schema_version` integer NOT NULL DEFAULT 1,
	`query_json` text NOT NULL,
	`canonical_hash` text NOT NULL,
	`state` text NOT NULL DEFAULT 'active',
	`alert_enabled` integer NOT NULL DEFAULT false,
	`brief_enabled` integer NOT NULL DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `saved_search_evaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`saved_search_id` text NOT NULL,
	`window_start` integer,
	`window_end` integer,
	`query_hash` text NOT NULL,
	`status` text NOT NULL,
	`matched_count` integer NOT NULL DEFAULT 0,
	`new_count` integer NOT NULL DEFAULT 0,
	`capped_count` integer NOT NULL DEFAULT 0,
	`error_summary` text,
	`started_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `saved_search_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`saved_search_id` text NOT NULL,
	`watchable_id` text NOT NULL,
	`first_matched_at` integer NOT NULL,
	`last_matched_at` integer NOT NULL,
	`match_state` text NOT NULL DEFAULT 'current',
	`match_version` integer NOT NULL DEFAULT 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `saved_search_matches_unique` ON `saved_search_matches` (`saved_search_id`,`watchable_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reading_states` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`watchable_id` text NOT NULL,
	`reading_state` text NOT NULL DEFAULT 'unread',
	`personal_surface_state` text NOT NULL DEFAULT 'default',
	`opened_at` integer,
	`dismissed_at` integer,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `reading_states_unique` ON `reading_states` (`profile_id`,`watchable_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reading_state_events` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`watchable_id` text NOT NULL,
	`from_state` text,
	`to_state` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `mute_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`scope_type` text NOT NULL,
	`scope_id` text,
	`reason` text,
	`active` integer NOT NULL DEFAULT true,
	`created_at` integer NOT NULL,
	`expires_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `visit_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`client_installation_id` text,
	`summary_json` text NOT NULL DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `alert_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`name` text NOT NULL,
	`enabled` integer NOT NULL DEFAULT true,
	`target_type` text NOT NULL,
	`target_ref` text,
	`event_kinds_json` text NOT NULL DEFAULT '[]',
	`severity_json` text NOT NULL DEFAULT '{}',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`rule_id` text,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`severity_json` text NOT NULL DEFAULT '{}',
	`watchable_id` text,
	`dedupe_key` text NOT NULL,
	`state` text NOT NULL DEFAULT 'new',
	`importance` text NOT NULL DEFAULT 'medium',
	`occurred_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `alerts_dedupe` ON `alerts` (`profile_id`,`dedupe_key`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `alert_state_events` (
	`id` text PRIMARY KEY NOT NULL,
	`alert_id` text NOT NULL,
	`from_state` text,
	`to_state` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `alert_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`alert_id` text NOT NULL,
	`channel` text NOT NULL DEFAULT 'in_app',
	`status` text NOT NULL,
	`delivered_at` integer,
	`error_summary` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `briefing_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`daily_enabled` integer NOT NULL DEFAULT true,
	`weekly_enabled` integer NOT NULL DEFAULT true,
	`timezone` text NOT NULL DEFAULT 'Australia/Brisbane',
	`max_daily_items` integer NOT NULL DEFAULT 20,
	`max_weekly_items` integer NOT NULL DEFAULT 40,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `briefing_settings_profile` ON `briefing_settings` (`profile_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `briefing_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`window_start` integer NOT NULL,
	`window_end` integer NOT NULL,
	`item_count` integer NOT NULL DEFAULT 0,
	`error_summary` text,
	`started_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `briefs` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`run_id` text,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`window_start` integer NOT NULL,
	`window_end` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `brief_items` (
	`id` text PRIMARY KEY NOT NULL,
	`brief_id` text NOT NULL,
	`watchable_id` text,
	`title` text NOT NULL,
	`summary` text,
	`reason` text,
	`rank` integer NOT NULL DEFAULT 100,
	`payload_json` text NOT NULL DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `brief_item_dependencies` (
	`id` text PRIMARY KEY NOT NULL,
	`brief_item_id` text NOT NULL,
	`dependency_kind` text NOT NULL,
	`dependency_ref` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `personalisation_imports_exports` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`direction` text NOT NULL,
	`format_version` integer NOT NULL DEFAULT 1,
	`status` text NOT NULL,
	`item_count` integer NOT NULL DEFAULT 0,
	`sanitized_summary` text,
	`created_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `backup_records` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text,
	`kind` text NOT NULL DEFAULT 'full',
	`status` text NOT NULL,
	`manifest_json` text NOT NULL DEFAULT '{}',
	`archive_sha256` text,
	`byte_length` integer,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	`error_summary` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `restore_records` (
	`id` text PRIMARY KEY NOT NULL,
	`backup_id` text,
	`status` text NOT NULL,
	`preflight_json` text NOT NULL DEFAULT '{}',
	`created_at` integer NOT NULL,
	`completed_at` integer,
	`error_summary` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `retention_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`scope` text NOT NULL,
	`rules_json` text NOT NULL DEFAULT '{}',
	`enabled` integer NOT NULL DEFAULT true,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `retention_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`policy_id` text,
	`status` text NOT NULL,
	`deleted_count` integer NOT NULL DEFAULT 0,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`summary` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `storage_usage_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`captured_at` integer NOT NULL,
	`category` text NOT NULL,
	`byte_length` integer NOT NULL,
	`file_count` integer NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `operational_events` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`severity` text NOT NULL DEFAULT 'info',
	`message` text NOT NULL,
	`details_json` text NOT NULL DEFAULT '{}',
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `operational_metric_buckets` (
	`id` text PRIMARY KEY NOT NULL,
	`metric` text NOT NULL,
	`bucket_start` integer NOT NULL,
	`bucket_end` integer NOT NULL,
	`value` integer NOT NULL DEFAULT 0,
	`dimensions_json` text NOT NULL DEFAULT '{}'
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `operational_metric_buckets_unique` ON `operational_metric_buckets` (`metric`,`bucket_start`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `application_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`runtime_major` integer,
	`app_version` text,
	`schema_version` integer,
	`mode` text NOT NULL DEFAULT 'api'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `diagnostic_bundles` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`manifest_json` text NOT NULL DEFAULT '{}',
	`created_at` integer NOT NULL,
	`completed_at` integer,
	`error_summary` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `security_audit_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`findings_json` text NOT NULL DEFAULT '[]',
	`created_at` integer NOT NULL,
	`completed_at` integer
);
