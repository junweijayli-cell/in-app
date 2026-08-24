import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['student', 'tutor'] }).notNull().default('student'),
  cohort: text('cohort').notNull().default('第18期 · 南方班'),
  isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
  allowTutorAccess: integer('allow_tutor_access', { mode: 'boolean' }).notNull().default(true),
  allowAiSummary: integer('allow_ai_summary', { mode: 'boolean' }).notNull().default(false),
  allowAnonymizedStats: integer('allow_anonymized_stats', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  uniqueIndex('idx_profiles_email').on(table.email),
  index('idx_profiles_cohort_role').on(table.cohort, table.role),
]);

export const dailyEntries = sqliteTable('daily_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  entryDate: text('entry_date').notNull(),
  morningIntention: text('morning_intention'),
  morningAction: text('morning_action'),
  morningConfidence: integer('morning_confidence'),
  morningObstacle: text('morning_obstacle'),
  morningHelp: text('morning_help'),
  morningVisibility: text('morning_visibility').notNull().default('tutor'),
  eveningAchievement: text('evening_achievement'),
  eveningEvidence: text('evening_evidence'),
  eveningLearning: text('evening_learning'),
  eveningObstacle: text('evening_obstacle'),
  eveningEnergy: integer('evening_energy'),
  eveningHelp: text('evening_help'),
  eveningVisibility: text('evening_visibility').notNull().default('tutor'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  uniqueIndex('idx_daily_user_date').on(table.userId, table.entryDate),
  index('idx_daily_date').on(table.entryDate),
]);

export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  domain: text('domain').notNull(),
  title: text('title').notNull(),
  detail: text('detail'),
  targetValue: real('target_value').notNull(),
  currentValue: real('current_value').notNull().default(0),
  unit: text('unit').notNull(),
  weight: integer('weight').notNull().default(20),
  deadline: text('deadline'),
  status: text('status').notNull().default('active'),
  visibility: text('visibility').notNull().default('tutor'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('idx_goals_user_status').on(table.userId, table.status),
]);

export const goalUpdates = sqliteTable('goal_updates', {
  id: text('id').primaryKey(),
  goalId: text('goal_id').notNull(),
  userId: text('user_id').notNull(),
  value: real('value').notNull(),
  evidence: text('evidence'),
  note: text('note'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_goal_updates_user_created').on(table.userId, table.createdAt),
  index('idx_goal_updates_goal_created').on(table.goalId, table.createdAt),
]);

export const supportEvents = sqliteTable('support_events', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  tutorId: text('tutor_id'),
  type: text('type').notNull(),
  status: text('status').notNull().default('open'),
  sourceDate: text('source_date'),
  reason: text('reason').notNull(),
  note: text('note'),
  createdAt: text('created_at').notNull(),
  resolvedAt: text('resolved_at'),
}, (table) => [
  index('idx_support_student_status').on(table.studentId, table.status),
  index('idx_support_status_created').on(table.status, table.createdAt),
]);

export const sourceRecords = sqliteTable('source_records', {
  id: text('id').primaryKey(),
  cohort: text('cohort').notNull(),
  createdBy: text('created_by').notNull(),
  sourceType: text('source_type').notNull(),
  title: text('title').notNull(),
  sourceDate: text('source_date').notNull(),
  consentNote: text('consent_note').notNull(),
  participantScope: text('participant_scope'),
  content: text('content').notNull(),
  status: text('status').notNull().default('available'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_sources_cohort_date').on(table.cohort, table.sourceDate),
]);
