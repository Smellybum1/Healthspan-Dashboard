-- M6 Remediation IV additive personalisation columns
ALTER TABLE `watchlists` ADD COLUMN `alert_enabled` integer NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE `watchlists` ADD COLUMN `brief_enabled` integer NOT NULL DEFAULT true;
--> statement-breakpoint
ALTER TABLE `watchlists` ADD COLUMN `deleted_at` integer;
--> statement-breakpoint
ALTER TABLE `visit_sessions` ADD COLUMN `tab_session_id` text;
--> statement-breakpoint
ALTER TABLE `visit_sessions` ADD COLUMN `last_heartbeat_at` integer;
--> statement-breakpoint
ALTER TABLE `visit_sessions` ADD COLUMN `status` text NOT NULL DEFAULT 'open';
--> statement-breakpoint
ALTER TABLE `visit_sessions` ADD COLUMN `previous_cutoff_at` integer;
--> statement-breakpoint
ALTER TABLE `briefing_settings` ADD COLUMN `daily_time_local` text NOT NULL DEFAULT '07:15';
--> statement-breakpoint
ALTER TABLE `briefing_settings` ADD COLUMN `weekly_time_local` text NOT NULL DEFAULT '09:00';
--> statement-breakpoint
ALTER TABLE `briefing_settings` ADD COLUMN `weekly_weekday` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `alerts` ADD COLUMN `why_included_json` text NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE `alerts` ADD COLUMN `snooze_until` integer;
--> statement-breakpoint
ALTER TABLE `alerts` ADD COLUMN `family` text NOT NULL DEFAULT 'research';
--> statement-breakpoint
ALTER TABLE `mute_rules` ADD COLUMN `scope_event_type` text;
--> statement-breakpoint
ALTER TABLE `saved_searches` ADD COLUMN `needs_update` integer NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE `briefs` ADD COLUMN `source_coverage_json` text NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE `briefs` ADD COLUMN `overflow_count` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `brief_items` ADD COLUMN `reading_state` text NOT NULL DEFAULT 'unread';
