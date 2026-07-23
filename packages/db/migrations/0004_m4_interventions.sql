CREATE TABLE `intervention_entities` (
	`id` text PRIMARY KEY NOT NULL,
	`preferred_name` text NOT NULL,
	`normalized_preferred_name` text NOT NULL,
	`entity_type` text NOT NULL,
	`lifecycle_state` text DEFAULT 'active' NOT NULL,
	`identity_confidence` text DEFAULT 'medium' NOT NULL,
	`short_description` text,
	`current_dossier_snapshot_id` text,
	`redirect_target_id` text,
	`created_by_method` text DEFAULT 'bootstrap' NOT NULL,
	`created_by_version` text DEFAULT 'm4.1' NOT NULL,
	`data_origin` text DEFAULT 'live' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);--> statement-breakpoint
CREATE INDEX `intervention_entities_norm` ON `intervention_entities` (`normalized_preferred_name`);--> statement-breakpoint
CREATE INDEX `intervention_entities_type` ON `intervention_entities` (`entity_type`);--> statement-breakpoint
CREATE TABLE `intervention_aliases` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`alias_text` text NOT NULL,
	`normalized_alias` text NOT NULL,
	`alias_type` text DEFAULT 'synonym' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`source_id` text,
	`source_record_version_id` text,
	`review_state` text DEFAULT 'accepted' NOT NULL,
	`collision_flag` integer DEFAULT false NOT NULL,
	`valid_from` integer,
	`valid_to` integer,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE INDEX `intervention_aliases_norm` ON `intervention_aliases` (`normalized_alias`);--> statement-breakpoint
CREATE INDEX `intervention_aliases_entity` ON `intervention_aliases` (`entity_id`);--> statement-breakpoint
CREATE TABLE `intervention_identifiers` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`variant_id` text,
	`scheme` text NOT NULL,
	`value` text NOT NULL,
	`normalized_value` text NOT NULL,
	`source_id` text,
	`source_record_version_id` text,
	`review_state` text DEFAULT 'accepted' NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX `intervention_identifiers_scheme_value` ON `intervention_identifiers` (`scheme`,`normalized_value`);--> statement-breakpoint
CREATE INDEX `intervention_identifiers_entity` ON `intervention_identifiers` (`entity_id`);--> statement-breakpoint
CREATE TABLE `intervention_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_entity_id` text NOT NULL,
	`variant_type` text NOT NULL,
	`preferred_name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`formulation` text,
	`strength` text,
	`route` text,
	`lifecycle_state` text DEFAULT 'active' NOT NULL,
	`review_state` text DEFAULT 'accepted' NOT NULL,
	`source_record_version_id` text,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE TABLE `intervention_mentions` (
	`id` text PRIMARY KEY NOT NULL,
	`raw_text` text NOT NULL,
	`normalized_text` text NOT NULL,
	`mention_type` text NOT NULL,
	`content_item_id` text,
	`claim_id` text,
	`regulatory_event_id` text,
	`source_object_id` text,
	`source_record_version_id` text,
	`field_path` text NOT NULL,
	`excerpt` text NOT NULL,
	`context_hash` text NOT NULL,
	`extraction_rule_version` text NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE INDEX `intervention_mentions_content` ON `intervention_mentions` (`content_item_id`);--> statement-breakpoint
CREATE TABLE `intervention_mapping_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`mention_id` text NOT NULL,
	`candidate_entity_id` text NOT NULL,
	`candidate_variant_id` text,
	`candidate_source` text DEFAULT 'deterministic' NOT NULL,
	`match_method` text NOT NULL,
	`match_confidence` text NOT NULL,
	`reasons_json` text DEFAULT '[]' NOT NULL,
	`collision_state` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'proposed' NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE TABLE `intervention_mention_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`mention_id` text NOT NULL,
	`entity_id` text NOT NULL,
	`variant_id` text,
	`mapping_state` text NOT NULL,
	`mapping_scope` text DEFAULT 'content_item' NOT NULL,
	`rule_or_decision_id` text NOT NULL,
	`source_version_set_hash` text,
	`effective_at` integer NOT NULL,
	`superseded_at` integer
);--> statement-breakpoint
CREATE INDEX `intervention_mention_mappings_mention` ON `intervention_mention_mappings` (`mention_id`);--> statement-breakpoint
CREATE TABLE `entity_resolution_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`mention_id` text,
	`candidate_id` text,
	`title` text NOT NULL,
	`reason` text NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`proposed_entity_id` text,
	`current_mapping_id` text,
	`stale` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer
);--> statement-breakpoint
CREATE TABLE `entity_resolution_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`action` text NOT NULL,
	`prior_mapping_hash` text,
	`resulting_mapping_hash` text,
	`entity_id` text,
	`notes` text,
	`actor` text DEFAULT 'local_admin' NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE TABLE `peptide_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`variant_id` text,
	`classification` text NOT NULL,
	`sequence_state` text DEFAULT 'no_sequence' NOT NULL,
	`sequence_length` integer,
	`molecular_formula` text,
	`molecular_mass` text,
	`identity_source` text,
	`warning_state` text DEFAULT 'sequence_unverified' NOT NULL,
	`review_state` text DEFAULT 'unreviewed' NOT NULL,
	`updated_at` integer NOT NULL
);--> statement-breakpoint
CREATE TABLE `peptide_sequences` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`sequence` text NOT NULL,
	`sequence_hash` text NOT NULL,
	`alphabet_version` text DEFAULT 'aa.1' NOT NULL,
	`exact_or_partial` text DEFAULT 'exact' NOT NULL,
	`source_id` text,
	`source_record_version_id` text,
	`review_state` text DEFAULT 'accepted' NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE TABLE `regulated_products` (
	`id` text PRIMARY KEY NOT NULL,
	`jurisdiction` text NOT NULL,
	`authority` text NOT NULL,
	`source_native_id` text NOT NULL,
	`product_name` text NOT NULL,
	`sponsor` text,
	`product_type` text,
	`dosage_form` text,
	`route` text,
	`strength` text,
	`marketing_status` text,
	`raw_status_wording` text,
	`official_url` text,
	`current_source_version_id` text,
	`match_state` text DEFAULT 'unreviewed' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX `regulated_products_native` ON `regulated_products` (`authority`,`source_native_id`);--> statement-breakpoint
CREATE TABLE `regulatory_assertions` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text,
	`entity_id` text,
	`jurisdiction` text NOT NULL,
	`authority` text NOT NULL,
	`assertion_kind` text NOT NULL,
	`normalized_standing` text NOT NULL,
	`raw_source_status` text,
	`scope_json` text DEFAULT '{}' NOT NULL,
	`match_scope` text DEFAULT 'product' NOT NULL,
	`effective_at` integer,
	`expires_at` integer,
	`source_record_version_id` text,
	`current_state` text DEFAULT 'current' NOT NULL,
	`review_state` text DEFAULT 'accepted' NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE TABLE `dossier_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`snapshot_kind` text DEFAULT 'full' NOT NULL,
	`ruleset_version` text NOT NULL,
	`input_hash` text NOT NULL,
	`summary_json` text DEFAULT '{}' NOT NULL,
	`evidence_map_json` text DEFAULT '{}' NOT NULL,
	`regulatory_matrix_json` text DEFAULT '{}' NOT NULL,
	`safety_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE TABLE `dossier_source_dependencies` (
	`id` text PRIMARY KEY NOT NULL,
	`dossier_snapshot_id` text NOT NULL,
	`analysis_id` text,
	`claim_id` text,
	`content_item_id` text,
	`regulatory_assertion_id` text,
	`role` text DEFAULT 'evidence' NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE TABLE `intervention_dossier_state` (
	`entity_id` text PRIMARY KEY NOT NULL,
	`current_snapshot_id` text,
	`stale` integer DEFAULT false NOT NULL,
	`stale_reason` text,
	`last_built_at` integer,
	`updated_at` integer NOT NULL
);--> statement-breakpoint
CREATE TABLE `dossier_change_events` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`from_snapshot_id` text,
	`to_snapshot_id` text,
	`change_summary` text NOT NULL,
	`created_at` integer NOT NULL
);
