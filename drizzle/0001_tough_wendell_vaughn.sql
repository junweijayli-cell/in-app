CREATE TABLE `source_records` (
	`id` text PRIMARY KEY NOT NULL,
	`cohort` text NOT NULL,
	`created_by` text NOT NULL,
	`source_type` text NOT NULL,
	`title` text NOT NULL,
	`source_date` text NOT NULL,
	`consent_note` text NOT NULL,
	`participant_scope` text,
	`content` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sources_cohort_date` ON `source_records` (`cohort`,`source_date`);