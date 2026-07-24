-- Migration 0009: creator identity decisions + concurrency revision
ALTER TABLE `creator_entities` ADD `identity_revision` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TABLE `creator_identity_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text,
	`account_id` text,
	`creator_id` text,
	`decision` text NOT NULL,
	`rationale` text,
	`expected_revision` integer,
	`actor` text DEFAULT 'local_admin' NOT NULL,
	`detail_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE INDEX `creator_identity_decisions_creator` ON `creator_identity_decisions` (`creator_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `creator_identity_decisions_task` ON `creator_identity_decisions` (`task_id`);
