ALTER TABLE `sources` ADD `baseline_completed_at` integer;--> statement-breakpoint
ALTER TABLE `source_feeds` ADD `baseline_completed_at` integer;--> statement-breakpoint
CREATE TABLE `background_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`priority` integer DEFAULT 100 NOT NULL,
	`payload_json` text DEFAULT '{}' NOT NULL,
	`dedupe_key` text NOT NULL,
	`available_at` integer NOT NULL,
	`claimed_at` integer,
	`lease_expires_at` integer,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`last_error` text,
	`parent_job_id` text,
	`related_run_id` text,
	`created_at` integer NOT NULL,
	`started_at` integer,
	`completed_at` integer
);--> statement-breakpoint
CREATE INDEX `background_jobs_claim` ON `background_jobs` (`status`,`available_at`,`priority`);--> statement-breakpoint
CREATE INDEX `background_jobs_lease` ON `background_jobs` (`lease_expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `background_jobs_dedupe` ON `background_jobs` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `background_jobs_parent` ON `background_jobs` (`parent_job_id`);--> statement-breakpoint
CREATE INDEX `background_jobs_created` ON `background_jobs` (`created_at`);--> statement-breakpoint
CREATE TABLE `scheduler_state` (
	`id` text PRIMARY KEY DEFAULT 'local' NOT NULL,
	`timezone` text DEFAULT 'Australia/Brisbane' NOT NULL,
	`cron_expression` text DEFAULT '0 6 * * *' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`last_enqueued_at` integer,
	`last_completed_at` integer,
	`next_run_at` integer,
	`last_catchup_reason` text,
	`updated_at` integer NOT NULL
);--> statement-breakpoint
-- Backfill: sources that already succeeded once are treated as baseline-complete.
UPDATE `sources` SET `baseline_completed_at` = COALESCE(`last_success_at`, `updated_at`)
WHERE `last_success_at` IS NOT NULL AND `baseline_completed_at` IS NULL;--> statement-breakpoint
UPDATE `source_feeds` SET `baseline_completed_at` = COALESCE(`last_success_at`, `last_checked_at`)
WHERE `last_success_at` IS NOT NULL AND `baseline_completed_at` IS NULL;
