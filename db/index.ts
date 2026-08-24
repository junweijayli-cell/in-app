import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

let schemaReady: Promise<void> | null = null;

export function getD1(): D1Database {
  if (!env.DB) throw new Error('Cloudflare D1 binding `DB` is unavailable.');
  return env.DB;
}

export function getDb() {
  return drizzle(getD1(), { schema });
}

export async function ensureDatabase() {
  if (!schemaReady) schemaReady = initializeSchema().catch((error) => {
    schemaReady = null;
    throw error;
  });
  await schemaReady;
}

async function initializeSchema() {
  const db = getD1();
  const statements = [
    `CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student', cohort TEXT NOT NULL DEFAULT '第18期 · 南方班',
      is_demo INTEGER NOT NULL DEFAULT 0, allow_tutor_access INTEGER NOT NULL DEFAULT 1,
      allow_ai_summary INTEGER NOT NULL DEFAULT 0, allow_anonymized_stats INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS daily_entries (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, entry_date TEXT NOT NULL,
      morning_intention TEXT, morning_action TEXT, morning_confidence INTEGER,
      morning_obstacle TEXT, morning_help TEXT, morning_visibility TEXT NOT NULL DEFAULT 'tutor',
      evening_achievement TEXT, evening_evidence TEXT, evening_learning TEXT,
      evening_obstacle TEXT, evening_energy INTEGER, evening_help TEXT,
      evening_visibility TEXT NOT NULL DEFAULT 'tutor', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, domain TEXT NOT NULL, title TEXT NOT NULL,
      detail TEXT, target_value REAL NOT NULL, current_value REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL, weight INTEGER NOT NULL DEFAULT 20, deadline TEXT,
      status TEXT NOT NULL DEFAULT 'active', visibility TEXT NOT NULL DEFAULT 'tutor',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS goal_updates (
      id TEXT PRIMARY KEY, goal_id TEXT NOT NULL, user_id TEXT NOT NULL, value REAL NOT NULL,
      evidence TEXT, note TEXT, created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS support_events (
      id TEXT PRIMARY KEY, student_id TEXT NOT NULL, tutor_id TEXT, type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open', source_date TEXT, reason TEXT NOT NULL,
      note TEXT, created_at TEXT NOT NULL, resolved_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS source_records (
      id TEXT PRIMARY KEY, cohort TEXT NOT NULL, created_by TEXT NOT NULL,
      source_type TEXT NOT NULL, title TEXT NOT NULL, source_date TEXT NOT NULL,
      consent_note TEXT NOT NULL, participant_scope TEXT, content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available', created_at TEXT NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email)`,
    `CREATE INDEX IF NOT EXISTS idx_profiles_cohort_role ON profiles(cohort, role)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_user_date ON daily_entries(user_id, entry_date)`,
    `CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_entries(entry_date)`,
    `CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_goal_updates_user_created ON goal_updates(user_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_goal_updates_goal_created ON goal_updates(goal_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_support_student_status ON support_events(student_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_support_status_created ON support_events(status, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_sources_cohort_date ON source_records(cohort, source_date)`,
  ];
  await db.batch(statements.map((statement) => db.prepare(statement)));
  await db.prepare('PRAGMA optimize').run();
}
