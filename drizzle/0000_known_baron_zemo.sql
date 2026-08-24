CREATE TABLE `daily_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`entry_date` text NOT NULL,
	`morning_intention` text,
	`morning_action` text,
	`morning_confidence` integer,
	`morning_obstacle` text,
	`morning_help` text,
	`morning_visibility` text DEFAULT 'tutor' NOT NULL,
	`evening_achievement` text,
	`evening_evidence` text,
	`evening_learning` text,
	`evening_obstacle` text,
	`evening_energy` integer,
	`evening_help` text,
	`evening_visibility` text DEFAULT 'tutor' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_daily_user_date` ON `daily_entries` (`user_id`,`entry_date`);--> statement-breakpoint
CREATE INDEX `idx_daily_date` ON `daily_entries` (`entry_date`);--> statement-breakpoint
CREATE TABLE `goal_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`user_id` text NOT NULL,
	`value` real NOT NULL,
	`evidence` text,
	`note` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_goal_updates_user_created` ON `goal_updates` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_goal_updates_goal_created` ON `goal_updates` (`goal_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`domain` text NOT NULL,
	`title` text NOT NULL,
	`detail` text,
	`target_value` real NOT NULL,
	`current_value` real DEFAULT 0 NOT NULL,
	`unit` text NOT NULL,
	`weight` integer DEFAULT 20 NOT NULL,
	`deadline` text,
	`status` text DEFAULT 'active' NOT NULL,
	`visibility` text DEFAULT 'tutor' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_goals_user_status` ON `goals` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'student' NOT NULL,
	`cohort` text DEFAULT '第18期 · 南方班' NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`allow_tutor_access` integer DEFAULT true NOT NULL,
	`allow_ai_summary` integer DEFAULT false NOT NULL,
	`allow_anonymized_stats` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_email` ON `profiles` (`email`);--> statement-breakpoint
CREATE INDEX `idx_profiles_cohort_role` ON `profiles` (`cohort`,`role`);--> statement-breakpoint
CREATE TABLE `support_events` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`tutor_id` text,
	`type` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`source_date` text,
	`reason` text NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`resolved_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_support_student_status` ON `support_events` (`student_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_support_status_created` ON `support_events` (`status`,`created_at`);