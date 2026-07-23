CREATE TABLE `review_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text,
	`content_item_id` text,
	`claim_id` text,
	`analysis_id` text,
	`source_record_version_id` text,
	`action` text NOT NULL,
	`decision_text` text,
	`edited_claim_text` text,
	`actor` text DEFAULT 'local_admin' NOT NULL,
	`created_at` integer NOT NULL,
	`notes` text
);--> statement-breakpoint
CREATE INDEX `review_decisions_task` ON `review_decisions` (`task_id`);--> statement-breakpoint
CREATE INDEX `review_decisions_claim` ON `review_decisions` (`claim_id`);--> statement-breakpoint
CREATE TABLE `analysis_source_dependencies` (
	`id` text PRIMARY KEY NOT NULL,
	`analysis_id` text NOT NULL,
	`content_item_id` text NOT NULL,
	`source_record_version_id` text,
	`role` text DEFAULT 'primary' NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE INDEX `analysis_deps_analysis` ON `analysis_source_dependencies` (`analysis_id`);--> statement-breakpoint
CREATE TABLE `claim_relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`left_claim_id` text NOT NULL,
	`right_claim_id` text NOT NULL,
	`relationship` text NOT NULL,
	`comparability_json` text DEFAULT '[]' NOT NULL,
	`rationale` text NOT NULL,
	`ruleset_version` text NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX `claim_relationships_pair` ON `claim_relationships` (`left_claim_id`,`right_claim_id`,`relationship`);--> statement-breakpoint
ALTER TABLE `live_review_tasks` ADD `source_record_version_id` text;--> statement-breakpoint
ALTER TABLE `live_review_tasks` ADD `expected_analysis_id` text;--> statement-breakpoint
ALTER TABLE `intelligence_analyses` ADD `hallmarks_json` text DEFAULT '[]';
