import type { ChatGPTUser } from '@/app/chatgpt-auth';
import { ensureDatabase, getD1 } from './index';

type ProfileRow = {
  id: string; email: string; name: string; role: 'student' | 'tutor'; cohort: string;
  is_demo: number; allow_tutor_access: number; allow_ai_summary: number;
  allow_anonymized_stats: number; created_at: string; updated_at: string;
};

type DailyRow = {
  id: string; user_id: string; entry_date: string;
  morning_intention: string | null; morning_action: string | null;
  morning_confidence: number | null; morning_obstacle: string | null;
  morning_help: string | null; morning_visibility: string;
  evening_achievement: string | null; evening_evidence: string | null;
  evening_learning: string | null; evening_obstacle: string | null;
  evening_energy: number | null; evening_help: string | null;
  evening_visibility: string; created_at: string; updated_at: string;
};

type GoalRow = {
  id: string; user_id: string; domain: string; title: string; detail: string | null;
  target_value: number; current_value: number; unit: string; weight: number;
  deadline: string | null; status: string; visibility: string;
  created_at: string; updated_at: string;
};

type SupportRow = {
  id: string; student_id: string; tutor_id: string | null; type: string; status: string;
  source_date: string | null; reason: string; note: string | null;
  created_at: string; resolved_at: string | null;
};

type SourceRow = {
  id: string; cohort: string; created_by: string; source_type: string; title: string;
  source_date: string; consent_note: string; participant_scope: string | null;
  content: string; status: string; created_at: string;
};

const cohortName = '第18期 · 南方班';

function nowIso() { return new Date().toISOString(); }

export function chinaDate(daysFromToday = 0) {
  const date = new Date(Date.now() + 8 * 60 * 60 * 1000 + daysFromToday * 86400000);
  return date.toISOString().slice(0, 10);
}

function uid(prefix: string) { return `${prefix}-${crypto.randomUUID()}`; }

function cleanText(value: unknown, max = 1200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function boundedNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function mapProfile(row: ProfileRow) {
  return {
    id: row.id, email: row.email, name: row.name, role: row.role, cohort: row.cohort,
    isDemo: Boolean(row.is_demo),
    preferences: {
      tutorAccess: Boolean(row.allow_tutor_access),
      aiSummary: Boolean(row.allow_ai_summary),
      anonymizedStats: Boolean(row.allow_anonymized_stats),
    },
  };
}

function mapDaily(row: DailyRow) {
  return {
    id: row.id, userId: row.user_id, entryDate: row.entry_date,
    morningIntention: row.morning_intention, morningAction: row.morning_action,
    morningConfidence: row.morning_confidence, morningObstacle: row.morning_obstacle,
    morningHelp: row.morning_help, morningVisibility: row.morning_visibility,
    eveningAchievement: row.evening_achievement, eveningEvidence: row.evening_evidence,
    eveningLearning: row.evening_learning, eveningObstacle: row.evening_obstacle,
    eveningEnergy: row.evening_energy, eveningHelp: row.evening_help,
    eveningVisibility: row.evening_visibility, updatedAt: row.updated_at,
  };
}

function mapDailyForTutor(row: DailyRow) {
  const mapped = mapDaily(row);
  if (row.morning_visibility === 'private') {
    mapped.morningIntention = null;
    mapped.morningAction = null;
    mapped.morningConfidence = null;
    mapped.morningObstacle = null;
    mapped.morningHelp = null;
  }
  if (row.evening_visibility === 'private') {
    mapped.eveningAchievement = null;
    mapped.eveningEvidence = null;
    mapped.eveningLearning = null;
    mapped.eveningObstacle = null;
    mapped.eveningEnergy = null;
    mapped.eveningHelp = null;
  }
  return mapped;
}

function goalProgress(goal: GoalRow) {
  if (goal.target_value <= 0) return 0;
  return Math.round(Math.min(1, Math.max(0, goal.current_value / goal.target_value)) * 100);
}

function mapGoal(row: GoalRow) {
  return {
    id: row.id, userId: row.user_id, domain: row.domain, title: row.title,
    detail: row.detail, targetValue: row.target_value, currentValue: row.current_value,
    unit: row.unit, weight: row.weight, deadline: row.deadline, status: row.status,
    visibility: row.visibility, progress: goalProgress(row), updatedAt: row.updated_at,
  };
}

function weightedProgress(goalRows: GoalRow[]) {
  const active = goalRows.filter((goal) => goal.status === 'active');
  const totalWeight = active.reduce((sum, goal) => sum + goal.weight, 0);
  if (!totalWeight) return 0;
  return Math.round(active.reduce((sum, goal) => sum + goalProgress(goal) * goal.weight, 0) / totalWeight);
}

export async function ensureCurrentUser(user: ChatGPTUser) {
  await ensureDatabase();
  const db = getD1();
  let profile = await db.prepare('SELECT * FROM profiles WHERE id = ?').bind(user.userId).first<ProfileRow>();
  if (!profile) {
    const realCount = await db.prepare('SELECT COUNT(*) AS count FROM profiles WHERE is_demo = 0').first<{ count: number }>();
    const role = Number(realCount?.count ?? 0) === 0 ? 'tutor' : 'student';
    const stamp = nowIso();
    const displayName = user.fullName || user.email.split('@')[0] || '智慧学员';
    await db.prepare(`INSERT INTO profiles
      (id, email, name, role, cohort, is_demo, allow_tutor_access, allow_ai_summary, allow_anonymized_stats, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, 1, 0, 1, ?, ?)`)
      .bind(user.userId, user.email, displayName, role, cohortName, stamp, stamp).run();
    profile = await db.prepare('SELECT * FROM profiles WHERE id = ?').bind(user.userId).first<ProfileRow>();
    await seedStarterForUser(user.userId);
  }
  await seedDemoCohort();
  return profile!;
}

async function seedStarterForUser(userId: string) {
  const db = getD1();
  const stamp = nowIso();
  const goalSeeds = [
    ['career', '事业 · 推动关键项目落地', '用每周可验证的交付物推动项目，而不是只记录忙碌。', 10, 6, '个里程碑', 28, 50],
    ['health', '健康 · 保持稳定运动', '每周完成三次有记录的运动。', 24, 17, '次', 22, 45],
    ['family', '家庭 · 高质量陪伴', '安排不被工作打断的专注陪伴。', 16, 8, '次', 20, 40],
    ['contribution', '贡献 · 邀请合适的同行者', '只向真正适合的人介绍课程，不做排名。', 8, 3, '位', 15, 30],
    ['growth', '成长 · 完成每周复盘', '把洞见转成下一周一个清晰实验。', 12, 7, '次', 15, 35],
  ] as const;
  const statements: D1PreparedStatement[] = [];
  for (const [domain, title, detail, target, current, unit, weight, deadlineDays] of goalSeeds) {
    statements.push(db.prepare(`INSERT INTO goals
      (id, user_id, domain, title, detail, target_value, current_value, unit, weight, deadline, status, visibility, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'tutor', ?, ?)`)
      .bind(uid('goal'), userId, domain, title, detail, target, current, unit, weight, chinaDate(deadlineDays), stamp, stamp));
  }
  for (let offset = -7; offset <= -1; offset += 1) {
    if (offset === -4) continue;
    const date = chinaDate(offset);
    statements.push(db.prepare(`INSERT INTO daily_entries
      (id, user_id, entry_date, morning_intention, morning_action, morning_confidence, morning_obstacle,
       morning_visibility, evening_achievement, evening_evidence, evening_learning, evening_obstacle,
       evening_energy, evening_visibility, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'tutor', ?, ?, ?, ?, ?, 'tutor', ?, ?)`)
      .bind(uid('entry'), userId, date, '保持清晰，把注意力放在最重要的一步', '完成当天最重要的一个可验证行动', 4,
        offset === -2 ? '临时会议压缩了专注时间' : '需要减少并行任务', '推进了关键事项', '已记录一项完成证据',
        '先完成再优化，比同时追求所有事情更有效', '晚上能量有限，需要早点休息', offset === -2 ? 2 : 4, stamp, stamp));
  }
  statements.push(db.prepare(`INSERT INTO support_events
    (id, student_id, tutor_id, type, status, source_date, reason, note, created_at, resolved_at)
    VALUES (?, ?, 'demo-tutor', 'tutor_note', 'closed', ?, '导师跟进', '先把今天最重要的一步走扎实。', ?, ?)`)
    .bind(uid('support'), userId, chinaDate(-1), stamp, stamp));
  await db.batch(statements);
}

async function seedDemoCohort() {
  const db = getD1();
  const existing = await db.prepare('SELECT COUNT(*) AS count FROM profiles WHERE is_demo = 1').first<{ count: number }>();
  const seededGoals = await db.prepare("SELECT COUNT(*) AS count FROM goals WHERE user_id LIKE 'demo-%'").first<{ count: number }>();
  if (Number(existing?.count ?? 0) >= 6 && Number(seededGoals?.count ?? 0) >= 25) return;

  const stamp = nowIso();
  const students = [
    ['demo-xu', '徐宁', '#b95f49', 3, 2, '我需要帮助重新聚焦事业目标，最近优先级太多。'],
    ['demo-chen', '陈宇', '#376858', 0, 4, ''],
    ['demo-he', '何嘉敏', '#d5a348', 4, 3, ''],
    ['demo-zhou', '周然', '#7b6da5', 1, 2, '这周家庭和工作冲突较大，希望导师一起梳理。'],
    ['demo-li', '李博', '#3f7891', 0, 5, ''],
  ] as const;
  const statements: D1PreparedStatement[] = [
    db.prepare(`INSERT OR IGNORE INTO profiles
      (id,email,name,role,cohort,is_demo,allow_tutor_access,allow_ai_summary,allow_anonymized_stats,created_at,updated_at)
      VALUES ('demo-tutor','mentor@zhihui.local','周岚','tutor',?,1,1,0,1,?,?)`).bind(cohortName, stamp, stamp),
  ];
  students.forEach(([id, name], index) => {
    statements.push(db.prepare(`INSERT OR IGNORE INTO profiles
      (id,email,name,role,cohort,is_demo,allow_tutor_access,allow_ai_summary,allow_anonymized_stats,created_at,updated_at)
      VALUES (?,?,?,'student',?,1,1,?,1,?,?)`)
      .bind(id, `${id}@zhihui.local`, name, cohortName, index % 2, stamp, stamp));
  });
  await db.batch(statements);

  const goalBlueprints = [
    ['career', '事业突破', 10, '个里程碑', 30],
    ['health', '健康习惯', 24, '次', 22],
    ['family', '家庭陪伴', 16, '次', 20],
    ['contribution', '同行者邀请', 8, '位', 13],
    ['growth', '每周复盘', 12, '次', 15],
  ] as const;
  const baseProgress = [62, 84, 39, 58, 91];
  const dataStatements: D1PreparedStatement[] = [];
  students.forEach(([studentId, , , inactiveDays, energy, help], studentIndex) => {
    goalBlueprints.forEach(([domain, title, target, unit, weight], goalIndex) => {
      const ratio = Math.max(12, Math.min(96, baseProgress[studentIndex] + goalIndex * 3 - 6));
      const goalId = `goal-${studentId}-${domain}`;
      const current = Math.round(target * ratio) / 100;
      const updated = new Date(Date.now() - (studentIndex === 2 ? 16 : goalIndex + 2) * 86400000).toISOString();
      dataStatements.push(db.prepare(`INSERT INTO goals
        (id,user_id,domain,title,detail,target_value,current_value,unit,weight,deadline,status,visibility,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,'active','tutor',?,?)`)
        .bind(goalId, studentId, domain, `${title} · ${['一季度重点','稳定节奏','关系连接','分享价值','行动复盘'][goalIndex]}`,
          '由学员定义目标与可接受证据，进度由学员提交并确认。', target, current, unit, weight, chinaDate(45 + goalIndex * 5), stamp, updated));
    });
    for (let offset = -9; offset <= -inactiveDays; offset += 1) {
      if ((studentIndex + Math.abs(offset)) % 5 === 0) continue;
      const date = chinaDate(offset);
      dataStatements.push(db.prepare(`INSERT INTO daily_entries
        (id,user_id,entry_date,morning_intention,morning_action,morning_confidence,morning_obstacle,morning_help,morning_visibility,
         evening_achievement,evening_evidence,evening_learning,evening_obstacle,evening_energy,evening_help,evening_visibility,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,'tutor',?,?,?,?,?,?,'tutor',?,?)`)
        .bind(uid('entry'), studentId, date, '把注意力放在最重要的关系和行动上', '完成一个能被看见的推进', 3 + (studentIndex % 2),
          studentIndex === 2 ? '连续出差，节奏被打断' : '需要为重要任务留出完整时间', offset === -inactiveDays ? help : '',
          '完成了今天承诺的主要行动', `行动记录 ${Math.abs(offset)}`, '把目标缩小后更容易持续',
          studentIndex === 3 ? '家庭与工作安排冲突' : '临时事项干扰', energy, offset === -inactiveDays ? help : '', stamp, stamp));
    }
    if (help) {
      dataStatements.push(db.prepare(`INSERT INTO support_events
        (id,student_id,tutor_id,type,status,source_date,reason,note,created_at,resolved_at)
        VALUES (?, ?, NULL, 'student_request', 'open', ?, '学员主动请求支持', ?, ?, NULL)`)
        .bind(uid('support'), studentId, chinaDate(-inactiveDays), help, stamp));
    }
  });
  await db.batch(dataStatements);
}

export async function getBootstrap(user: ChatGPTUser) {
  const profileRow = await ensureCurrentUser(user);
  const db = getD1();
  const today = chinaDate();
  const todayEntry = await db.prepare('SELECT * FROM daily_entries WHERE user_id = ? AND entry_date = ?')
    .bind(profileRow.id, today).first<DailyRow>();
  const goalsResult = await db.prepare("SELECT * FROM goals WHERE user_id = ? AND status = 'active' ORDER BY weight DESC, created_at ASC")
    .bind(profileRow.id).all<GoalRow>();
  const historyResult = await db.prepare('SELECT * FROM daily_entries WHERE user_id = ? ORDER BY entry_date DESC LIMIT 21')
    .bind(profileRow.id).all<DailyRow>();
  const supportResult = await db.prepare('SELECT * FROM support_events WHERE student_id = ? ORDER BY created_at DESC LIMIT 12')
    .bind(profileRow.id).all<SupportRow>();

  const goals = goalsResult.results ?? [];
  const history = historyResult.results ?? [];
  const support = supportResult.results ?? [];
  const bootstrap = {
    user: mapProfile(profileRow), today, todayEntry: todayEntry ? mapDaily(todayEntry) : null,
    goals: goals.map(mapGoal), history: history.map(mapDaily),
    overallProgress: weightedProgress(goals), streak: calculateStreak(history),
    support: support.map((row) => ({
      id: row.id, type: row.type, status: row.status, reason: row.reason,
      note: row.note, sourceDate: row.source_date, createdAt: row.created_at,
    })),
  } as Record<string, unknown>;

  if (profileRow.role === 'tutor') bootstrap.tutor = await getTutorDashboard(profileRow);
  return bootstrap;
}

function calculateStreak(entries: DailyRow[]) {
  const completed = new Set(entries.filter((entry) => entry.morning_action || entry.evening_achievement).map((entry) => entry.entry_date));
  let streak = 0;
  for (let offset = 0; offset > -60; offset -= 1) {
    if (completed.has(chinaDate(offset))) streak += 1;
    else if (offset === 0) continue;
    else break;
  }
  return streak;
}

async function getTutorDashboard(tutor: ProfileRow) {
  const db = getD1();
  const profilesResult = await db.prepare("SELECT * FROM profiles WHERE role = 'student' AND cohort = ? AND allow_tutor_access = 1 ORDER BY is_demo DESC, name ASC")
    .bind(tutor.cohort).all<ProfileRow>();
  const studentRows = profilesResult.results ?? [];
  const students = [];
  const queue: Array<Record<string, unknown>> = [];

  for (const student of studentRows) {
    const [goalResult, entryResult, supportResult] = await Promise.all([
      db.prepare("SELECT * FROM goals WHERE user_id = ? AND status = 'active' AND visibility != 'private' ORDER BY weight DESC").bind(student.id).all<GoalRow>(),
      db.prepare('SELECT * FROM daily_entries WHERE user_id = ? ORDER BY entry_date DESC LIMIT 14').bind(student.id).all<DailyRow>(),
      db.prepare("SELECT * FROM support_events WHERE student_id = ? AND status = 'open' ORDER BY created_at DESC").bind(student.id).all<SupportRow>(),
    ]);
    const studentGoals = goalResult.results ?? [];
    const entries = entryResult.results ?? [];
    const openSupport = supportResult.results ?? [];
    const latest = entries[0];
    const inactiveDays = latest ? Math.max(0, Math.floor((Date.parse(chinaDate()) - Date.parse(latest.entry_date)) / 86400000)) : 99;
    const progress = weightedProgress(studentGoals);
    const checkedToday = entries.some((entry) => entry.entry_date === chinaDate() && (entry.morning_action || entry.evening_achievement));
    const latestEnergy = latest?.evening_energy ?? null;
    const latestSummary = latest
      ? latest.evening_visibility === 'private'
        ? '学员将最近的晚间记录设为仅自己可见。'
        : latest.evening_learning || latest.evening_achievement || latest.morning_action || '已完成记录，暂无文字总结。'
      : '尚无记录。';
    const mapped = {
      id: student.id, name: student.name, cohort: student.cohort, progress, checkedToday,
      inactiveDays, latestEnergy, latestDate: latest?.entry_date ?? null, latestSummary,
      openRequests: openSupport.length, goals: studentGoals.map(mapGoal), history: entries.map(mapDailyForTutor),
    };
    students.push(mapped);

    openSupport.forEach((event) => queue.push({
      id: event.id, studentId: student.id, studentName: student.name, priority: 'urgent',
      kind: 'request', title: '学员主动请求支持', reason: event.note || event.reason,
      source: '学员明确提交', sourceDate: event.source_date, eventId: event.id,
    }));
    if (!openSupport.length && inactiveDays >= 3) queue.push({
      id: `missed-${student.id}`, studentId: student.id, studentName: student.name,
      priority: inactiveDays >= 5 ? 'urgent' : 'attention', kind: 'missed',
      title: `${inactiveDays} 天未记录`, reason: '这是活动缺口，不代表态度或心理状态。建议用关心式提问了解现实障碍。',
      source: '描述性活动记录', sourceDate: latest?.entry_date ?? null,
    });
    if (!openSupport.length && latestEnergy !== null && latestEnergy <= 2) queue.push({
      id: `energy-${student.id}`, studentId: student.id, studentName: student.name,
      priority: 'attention', kind: 'energy', title: '学员自报能量偏低',
      reason: `最近一次晚间记录由学员本人选择能量 ${latestEnergy}/5。请核实，不作心理判断。`,
      source: '学员自评', sourceDate: latest?.entry_date ?? null,
    });
    const staleGoals = studentGoals.filter((goal) => Date.now() - Date.parse(goal.updated_at) > 14 * 86400000);
    if (!openSupport.length && staleGoals.length && progress < 55) queue.push({
      id: `stalled-${student.id}`, studentId: student.id, studentName: student.name,
      priority: 'watch', kind: 'stalled', title: '目标可能需要复盘',
      reason: `${staleGoals.length} 个目标超过两周没有学员确认的新证据。请先询问目标是否仍然适合。`,
      source: '学员确认的目标更新', sourceDate: staleGoals[0].updated_at.slice(0, 10),
    });
  }

  const priorityRank: Record<string, number> = { urgent: 0, attention: 1, watch: 2 };
  queue.sort((a, b) => priorityRank[String(a.priority)] - priorityRank[String(b.priority)]);
  const sourceResult = await db.prepare('SELECT * FROM source_records WHERE cohort = ? ORDER BY source_date DESC, created_at DESC LIMIT 20')
    .bind(tutor.cohort).all<SourceRow>();
  return {
    students, queue,
    sources: (sourceResult.results ?? []).map((source) => ({
      id: source.id, type: source.source_type, title: source.title, sourceDate: source.source_date,
      consentNote: source.consent_note, participantScope: source.participant_scope,
      content: source.content, characterCount: source.content.length, status: source.status,
    })),
    metrics: {
      studentCount: students.length,
      checkedToday: students.filter((student) => student.checkedToday).length,
      openRequests: queue.filter((item) => item.kind === 'request').length,
      averageProgress: students.length ? Math.round(students.reduce((sum, student) => sum + student.progress, 0) / students.length) : 0,
    },
  };
}

export async function saveDailyEntry(userId: string, body: Record<string, unknown>) {
  await ensureDatabase();
  const db = getD1();
  const entryDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.entryDate)) ? String(body.entryDate) : chinaDate();
  const kind = body.kind === 'evening' ? 'evening' : 'morning';
  const stamp = nowIso();
  const existing = await db.prepare('SELECT id FROM daily_entries WHERE user_id = ? AND entry_date = ?').bind(userId, entryDate).first<{ id: string }>();
  if (!existing) {
    await db.prepare(`INSERT INTO daily_entries (id,user_id,entry_date,morning_visibility,evening_visibility,created_at,updated_at)
      VALUES (?,?,?,'tutor','tutor',?,?)`).bind(uid('entry'), userId, entryDate, stamp, stamp).run();
  }
  if (kind === 'morning') {
    const help = cleanText(body.help, 500);
    await db.prepare(`UPDATE daily_entries SET morning_intention=?, morning_action=?, morning_confidence=?,
      morning_obstacle=?, morning_help=?, morning_visibility=?, updated_at=? WHERE user_id=? AND entry_date=?`)
      .bind(cleanText(body.intention), cleanText(body.action), boundedNumber(body.confidence, 1, 5, 3),
        cleanText(body.obstacle), help, body.visibility === 'private' ? 'private' : 'tutor', stamp, userId, entryDate).run();
    if (help) await createSupportRequestIfNeeded(userId, entryDate, help, '晨间记录中的支持请求');
  } else {
    const help = cleanText(body.help, 500);
    await db.prepare(`UPDATE daily_entries SET evening_achievement=?, evening_evidence=?, evening_learning=?,
      evening_obstacle=?, evening_energy=?, evening_help=?, evening_visibility=?, updated_at=? WHERE user_id=? AND entry_date=?`)
      .bind(cleanText(body.achievement), cleanText(body.evidence), cleanText(body.learning), cleanText(body.obstacle),
        boundedNumber(body.energy, 1, 5, 3), help, body.visibility === 'private' ? 'private' : 'tutor', stamp, userId, entryDate).run();
    if (help) await createSupportRequestIfNeeded(userId, entryDate, help, '晚间总结中的支持请求');
  }
}

async function createSupportRequestIfNeeded(userId: string, sourceDate: string, note: string, reason: string) {
  const db = getD1();
  const existing = await db.prepare("SELECT id FROM support_events WHERE student_id=? AND source_date=? AND type='student_request' AND status='open'")
    .bind(userId, sourceDate).first<{ id: string }>();
  if (existing) {
    await db.prepare('UPDATE support_events SET reason=?, note=? WHERE id=?').bind(reason, note, existing.id).run();
  } else {
    await db.prepare(`INSERT INTO support_events
      (id,student_id,tutor_id,type,status,source_date,reason,note,created_at,resolved_at)
      VALUES (?, ?, NULL, 'student_request', 'open', ?, ?, ?, ?, NULL)`)
      .bind(uid('support'), userId, sourceDate, reason, note, nowIso()).run();
  }
}

export async function saveGoal(userId: string, body: Record<string, unknown>) {
  await ensureDatabase();
  const db = getD1();
  const stamp = nowIso();
  const goalId = cleanText(body.id, 100);
  if (goalId) {
    const owned = await db.prepare('SELECT * FROM goals WHERE id=? AND user_id=?').bind(goalId, userId).first<GoalRow>();
    if (!owned) throw new Error('目标不存在或无权修改。');
    const currentValue = boundedNumber(body.currentValue, 0, Math.max(owned.target_value * 5, 1000000), owned.current_value);
    await db.batch([
      db.prepare('UPDATE goals SET current_value=?, updated_at=? WHERE id=? AND user_id=?').bind(currentValue, stamp, goalId, userId),
      db.prepare(`INSERT INTO goal_updates (id,goal_id,user_id,value,evidence,note,created_at) VALUES (?,?,?,?,?,?,?)`)
        .bind(uid('update'), goalId, userId, currentValue, cleanText(body.evidence, 700), cleanText(body.note, 700), stamp),
    ]);
    return;
  }
  const title = cleanText(body.title, 120);
  if (!title) throw new Error('请填写目标名称。');
  const target = boundedNumber(body.targetValue, 0.01, 1000000, 1);
  const current = boundedNumber(body.currentValue, 0, target * 5, 0);
  const domain = ['career', 'health', 'family', 'contribution', 'growth'].includes(String(body.domain)) ? String(body.domain) : 'growth';
  await db.prepare(`INSERT INTO goals
    (id,user_id,domain,title,detail,target_value,current_value,unit,weight,deadline,status,visibility,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,'active',?,?,?)`)
    .bind(uid('goal'), userId, domain, title, cleanText(body.detail, 800), target, current,
      cleanText(body.unit, 40) || '项', boundedNumber(body.weight, 5, 50, 20),
      cleanText(body.deadline, 10) || null, body.visibility === 'private' ? 'private' : 'tutor', stamp, stamp).run();
}

export async function saveSupport(userId: string, userRole: string, body: Record<string, unknown>) {
  await ensureDatabase();
  const db = getD1();
  const action = String(body.action || 'request');
  if (action === 'request') {
    const note = cleanText(body.note, 800);
    if (!note) throw new Error('请告诉导师你希望获得什么支持。');
    await createSupportRequestIfNeeded(userId, chinaDate(), note, '学员从支持页主动请求');
    return;
  }
  if (userRole !== 'tutor') throw new Error('仅导师可以记录跟进。');
  if (action === 'resolve') {
    const eventId = cleanText(body.eventId, 120);
    await db.prepare("UPDATE support_events SET status='closed', tutor_id=?, resolved_at=? WHERE id=?")
      .bind(userId, nowIso(), eventId).run();
    return;
  }
  if (action === 'outreach') {
    const studentId = cleanText(body.studentId, 120);
    const note = cleanText(body.note, 1000);
    if (!studentId || !note) throw new Error('请选择学员并记录跟进内容。');
    await db.prepare(`INSERT INTO support_events
      (id,student_id,tutor_id,type,status,source_date,reason,note,created_at,resolved_at)
      VALUES (?,?,?,'tutor_note','closed',?,'导师跟进记录',?,?,?)`)
      .bind(uid('support'), studentId, userId, chinaDate(), note, nowIso(), nowIso()).run();
  }
}

export async function savePreferences(userId: string, body: Record<string, unknown>) {
  await ensureDatabase();
  await getD1().prepare(`UPDATE profiles SET allow_tutor_access=?, allow_ai_summary=?, allow_anonymized_stats=?, updated_at=? WHERE id=?`)
    .bind(body.tutorAccess ? 1 : 0, body.aiSummary ? 1 : 0, body.anonymizedStats ? 1 : 0, nowIso(), userId).run();
}

export async function saveSource(userId: string, userRole: string, cohort: string, body: Record<string, unknown>) {
  await ensureDatabase();
  if (userRole !== 'tutor') throw new Error('仅导师可以导入班级资料。');
  const title = cleanText(body.title, 160);
  const content = cleanText(body.content, 50000);
  const consentNote = cleanText(body.consentNote, 500);
  if (!title || !content) throw new Error('请填写资料名称和已授权的文字内容。');
  if (consentNote.length < 6) throw new Error('请记录本次资料的知情同意依据。');
  const sourceType = ['meeting', 'wecom', 'other'].includes(String(body.sourceType)) ? String(body.sourceType) : 'other';
  const sourceDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.sourceDate)) ? String(body.sourceDate) : chinaDate();
  await getD1().prepare(`INSERT INTO source_records
    (id,cohort,created_by,source_type,title,source_date,consent_note,participant_scope,content,status,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,'available',?)`)
    .bind(uid('source'), cohort, userId, sourceType, title, sourceDate, consentNote,
      cleanText(body.participantScope, 500), content, nowIso()).run();
}
