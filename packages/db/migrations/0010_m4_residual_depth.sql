-- M6 entry-gate: M4 residual schema depth (labels, ingredients, status history, safety items)
CREATE TABLE IF NOT EXISTS `regulated_product_ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`ingredient_name` text NOT NULL,
	`role` text DEFAULT 'active' NOT NULL,
	`quantity_text` text,
	`source_record_version_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `regulated_product_ingredients_product` ON `regulated_product_ingredients` (`product_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `regulatory_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text,
	`entity_id` text,
	`jurisdiction` text NOT NULL,
	`authority` text NOT NULL,
	`application_type` text NOT NULL,
	`native_application_id` text,
	`status_raw` text,
	`normalized_status` text NOT NULL,
	`official_url` text,
	`source_record_version_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `regulatory_indications` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text,
	`assertion_id` text,
	`indication_text` text NOT NULL,
	`population_context` text,
	`jurisdiction` text NOT NULL,
	`source_record_version_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `regulatory_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text,
	`assertion_id` text,
	`from_standing` text,
	`to_standing` text NOT NULL,
	`effective_at` integer,
	`source_record_version_id` text,
	`note` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `product_label_records` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text,
	`entity_id` text,
	`jurisdiction` text NOT NULL,
	`authority` text NOT NULL,
	`label_version` text,
	`section_kind` text NOT NULL,
	`section_title` text,
	`section_text` text NOT NULL,
	`official_url` text,
	`source_record_version_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_label_records_entity` ON `product_label_records` (`entity_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `safety_items` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`jurisdiction` text NOT NULL,
	`authority` text NOT NULL,
	`severity_class` text,
	`official_url` text,
	`severity_caveat` text NOT NULL,
	`source_record_version_id` text,
	`current_state` text DEFAULT 'current' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `intervention_safety_links` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`safety_item_id` text,
	`signal_record_id` text,
	`link_role` text DEFAULT 'related' NOT NULL,
	`match_state` text DEFAULT 'unreviewed' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `intervention_safety_links_entity` ON `intervention_safety_links` (`entity_id`);
