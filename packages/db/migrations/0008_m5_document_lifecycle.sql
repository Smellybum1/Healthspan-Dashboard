ALTER TABLE `creator_documents` ADD `replaces_document_id` text;--> statement-breakpoint
ALTER TABLE `creator_documents` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `creator_documents` ADD `purged_at` integer;--> statement-breakpoint
ALTER TABLE `creator_documents` ADD `storage_purged` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `creator_claim_findings` ADD `claim_id` text;--> statement-breakpoint
ALTER TABLE `creator_claim_findings` ADD `published_to_profile` integer DEFAULT false;--> statement-breakpoint
CREATE INDEX `creator_documents_replaces` ON `creator_documents` (`replaces_document_id`);--> statement-breakpoint
CREATE INDEX `creator_claim_findings_claim` ON `creator_claim_findings` (`claim_id`,`finding_state`);
