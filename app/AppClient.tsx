'use client';

import { useEffect, useMemo, useState, type FormEvent, type ReactNode, type CSSProperties } from 'react';

type Tab = 'today' | 'goals' | 'growth' | 'support';
type Modal = 'morning' | 'evening' | 'new-goal' | 'update-goal' | 'support' | 'outreach' | 'source' | null;
type Profile = { id: string; email: string; name: string; role: 'student' | 'tutor'; cohort: string; isDemo: boolean; preferences: { tutorAccess: boolean; aiSummary: boolean; anonymizedStats: boolean } };
type Daily = { id: string; entryDate: string; morningIntention?: string; morningAction?: string; morningConfidence?: number; morningObstacle?: string; morningHelp?: string; morningVisibility?: string; eveningAchievement?: string; eveningEvidence?: string; eveningLearning?: string; eveningObstacle?: string; eveningEnergy?: number; eveningHelp?: string; eveningVisibility?: string };
type Goal = { id: string; domain: string; title: string; detail?: string; targetValue: number; currentValue: number; unit: string; weight: number; deadline?: string; visibility: string; progress: number };
type Support = { id: string; type: string; status: string; reason: string; note?: string; sourceDate?: string; createdAt: string };
type QueueItem = { id: string; studentId: string; studentName: string; priority: 'urgent' | 'attention' | 'watch'; kind: string; title: string; reason: string; source: string; sourceDate?: string; eventId?: string };
type SourceRecord = { id: string; type: string; title: string; sourceDate: string; consentNote: string; participantScope?: string; content: string; characterCount: number; status: string };
type TutorStudent = { id: string; name: string; progress: number; checkedToday: boolean; inactiveDays: number; latestEnergy: number | null; latestDate: string | null; latestSummary: string; openRequests: number; goals: Goal[]; history: Daily[] };
type Bootstrap = { user: Profile; today: string; todayEntry: Daily | null; goals: Goal[]; history: Daily[]; overallProgress: number; streak: number; support: Support[]; tutor?: { students: TutorStudent[]; queue: QueueItem[]; sources: SourceRecord[]; metrics: { studentCount: number; checkedToday: number; openRequests: number; averageProgress: number } } };

const domains: Record<string, { label: string; short: string; tone: string }> = {
  career: { label: '事业发展', short: '事', tone: 'jade' }, health: { label: '身心健康', short: '健', tone: 'gold' },
  family: { label: '家庭关系', short: '家', tone: 'clay' }, contribution: { label: '贡献同行', short: '同', tone: 'plum' },
  growth: { label: '自我成长', short: '长', tone: 'blue' },
};
const navItems: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'today', label: '今日', icon: '今' }, { id: 'goals', label: '目标', icon: '标' },
  { id: 'growth', label: '成长', icon: '迹' }, { id: 'support', label: '支持', icon: '伴' },
];

function formatDate(date: string, long = false) {
  const parsed = new Date(`${date}T12:00:00+08:00`);
  return new Intl.DateTimeFormat('zh-CN', long ? { month: 'long', day: 'numeric', weekday: 'long' } : { month: 'numeric', day: 'numeric' }).format(parsed);
}
function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
function Progress({ value, tone = 'jade' }: { value: number; tone?: string }) { return <div className="progress" aria-label={`进度 ${value}%`}><i className={tone} style={{ width: `${Math.min(100, value)}%` }} /></div>; }

export default function AppClient() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('today');
  const [mode, setMode] = useState<'student' | 'tutor'>('student');
  const [modal, setModal] = useState<Modal>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<TutorStudent | null>(null);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const response = await fetch('/api/bootstrap', { cache: 'no-store' });
    const body = await response.json() as Bootstrap & { error?: string };
    if (!response.ok) throw new Error(body.error || '读取失败');
    setData(body);
    if (selectedStudent && body.tutor) setSelectedStudent(body.tutor.students.find((student) => student.id === selectedStudent.id) ?? null);
  }
  useEffect(() => {
    let cancelled = false;
    void fetch('/api/bootstrap', { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json() as Bootstrap & { error?: string };
        if (!response.ok) throw new Error(body.error || '读取失败');
        if (!cancelled) setData(body);
      })
      .catch((reason: Error) => { if (!cancelled) setError(reason.message); });
    return () => { cancelled = true; };
  }, []);
  async function post(path: string, payload: Record<string, unknown>, message: string) {
    setSaving(true);
    try {
      const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || '保存失败');
      await refresh(); setModal(null); setToast(message); window.setTimeout(() => setToast(''), 2600);
    } catch (reason) { setToast(reason instanceof Error ? reason.message : '保存失败'); } finally { setSaving(false); }
  }

  if (error) return <main className="loading-page"><div className="loading-mark">光</div><h1>暂时无法打开成长记录</h1><p>{error}</p><button onClick={() => location.reload()}>重新尝试</button></main>;
  if (!data) return <main className="loading-page"><div className="loading-mark pulse">光</div><p>正在整理你的成长记录…</p></main>;
  const isTutor = data.user.role === 'tutor' && data.tutor;
  const studentView = mode === 'student' || !isTutor;

  return <main className="app-shell">
    <aside className="desktop-rail"><button className="brand-mark" onClick={() => { setMode('student'); setTab('today'); }}>光</button><nav>
      {studentView ? navItems.map((item) => <button key={item.id} className={`rail-item ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}><span>{item.icon}</span>{item.label}</button>) : <><span className="rail-section">导师台</span><button className="rail-item active"><span>览</span>全班</button></>}
    </nav><div className="rail-avatar">{data.user.name.slice(0, 1)}</div></aside>
    <section className="main-stage">
      <header className="global-topbar"><button className="mobile-brand" onClick={() => setTab('today')}><span>光</span><b>智慧之光</b></button><div className="topbar-actions">
        {isTutor && <div className="role-switch"><button className={studentView ? 'active' : ''} onClick={() => setMode('student')}>我的成长</button><button className={!studentView ? 'active' : ''} onClick={() => setMode('tutor')}>导师工作台</button></div>}
        <span className="privacy-status"><i /> {data.user.isDemo ? '公开演示' : '已保护'}</span><div className="account-chip"><b>{data.user.name.slice(0, 1)}</b><span>{data.user.name}<small>{data.user.isDemo ? '共享演示账户' : data.user.role === 'tutor' ? '导师账户' : data.user.cohort}</small></span></div>
      </div></header>
      {data.user.isDemo && <aside className="demo-banner"><b>公开演示环境</b><span>所有访客共享示例数据，请勿填写真实姓名、联系方式、聊天记录或其他个人信息。</span></aside>}
      {studentView ? <section className="student-page view-enter">
        {tab === 'today' && <TodayView data={data} open={setModal} go={setTab} />}
        {tab === 'goals' && <GoalsView data={data} onNew={() => setModal('new-goal')} onUpdate={(goal) => { setSelectedGoal(goal); setModal('update-goal'); }} />}
        {tab === 'growth' && <GrowthView data={data} />}
        {tab === 'support' && <SupportView data={data} onRequest={() => setModal('support')} onSave={(payload) => post('/api/profile', payload, '隐私偏好已保存')} />}
      </section> : <TutorView data={data} onStudent={setSelectedStudent} onOutreach={(student) => { setSelectedStudent(student); setModal('outreach'); }} onResolve={(eventId) => post('/api/support', { action: 'resolve', eventId }, '支持请求已标记为完成')} onSource={() => setModal('source')} />}
    </section>
    {studentView && <nav className="mobile-nav">{navItems.map((item) => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav>}
    {selectedStudent && !modal && <StudentDrawer student={selectedStudent} close={() => setSelectedStudent(null)} outreach={() => setModal('outreach')} />}
    {modal && <EntryModal modal={modal} data={data} goal={selectedGoal} student={selectedStudent} saving={saving} close={() => setModal(null)} submit={post} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}

function TodayView({ data, open, go }: { data: Bootstrap; open: (modal: Modal) => void; go: (tab: Tab) => void }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => { const date = new Date(`${data.today}T12:00:00+08:00`); date.setDate(date.getDate() + index - 3); const iso = date.toISOString().slice(0, 10); return { iso, day: '日一二三四五六'[date.getDay()], number: date.getDate(), done: data.history.some((item) => item.entryDate === iso) }; }), [data.today, data.history]);
  const entry = data.todayEntry; const recentNote = data.support.find((item) => item.type === 'tutor_note');
  return <><div className="page-title-row"><div><p className="eyebrow">{data.user.cohort}</p><h1>早上好，{data.user.name}</h1><p className="intro">用一个清晰行动，让今天向重要的方向移动。</p></div><div className="date-seal"><span>{formatDate(data.today)}</span><b>{data.streak}</b><small>连续记录</small></div></div>
    <div className="day-strip">{days.map((day) => <div key={day.iso} className={`day-cell ${day.iso === data.today ? 'active' : ''}`}><span>{day.day}</span><b>{day.number}</b><i className={day.done ? 'done' : ''} /></div>)}</div>
    <section className="hero-card"><div className="hero-copy"><p>{formatDate(data.today, true)} · 今日意图</p><h2>{entry?.morningIntention || '今天，想为自己创造什么？'}</h2><button onClick={() => open('morning')}>{entry?.morningAction ? '更新晨间立言' : '写下晨间立言'} <span>→</span></button></div><div className="sun-orbit"><span>{data.overallProgress}</span><small>整体进度</small></div><div className="hero-glow" /></section>
    <section className="checkin-grid"><button className={`checkin-card morning ${entry?.morningAction ? 'complete' : ''}`} onClick={() => open('morning')}><div className="card-icon">晨</div><div><span>晨间立言</span><h3>{entry?.morningAction || '等待你的开始'}</h3><p>{entry?.morningAction ? `信心 ${entry.morningConfidence}/5 · 可随时调整` : '一个意图 · 一个行动'}</p></div><b>{entry?.morningAction ? '✓' : '›'}</b></button><button className={`checkin-card evening ${entry?.eveningAchievement ? 'complete' : ''}`} onClick={() => open('evening')}><div className="card-icon">夕</div><div><span>晚间总结</span><h3>{entry?.eveningAchievement || '记录事实，也记录学习'}</h3><p>{entry?.eveningAchievement ? `能量 ${entry.eveningEnergy}/5 · 已留下证据` : '成就 · 证据 · 下一步'}</p></div><b>{entry?.eveningAchievement ? '✓' : '›'}</b></button></section>
    <section className="section-block"><div className="section-heading"><div><p>你的方向</p><h2>目标进展</h2></div><button onClick={() => go('goals')}>查看全部</button></div><div className="goal-list">{data.goals.slice(0, 3).map((goal) => <article className="goal-row" key={goal.id}><div className={`goal-symbol ${domains[goal.domain]?.tone}`}>{domains[goal.domain]?.short || '标'}</div><div className="goal-main"><div><h3>{goal.title}</h3><b>{goal.progress}%</b></div><Progress value={goal.progress} tone={domains[goal.domain]?.tone} /></div></article>)}</div></section>
    <button className="support-card" onClick={() => go('support')}><div className="support-portrait">周</div><div><p>{recentNote ? '来自导师的跟进' : '需要一点支持？'}</p><h3>{recentNote?.note || '把真实障碍说出来，我们一起找到下一步。'}</h3><span>{recentNote?.sourceDate || '你决定什么时候开口'}</span></div><b>↗</b></button></>;
}

function GoalsView({ data, onNew, onUpdate }: { data: Bootstrap; onNew: () => void; onUpdate: (goal: Goal) => void }) {
  return <><div className="page-title-row compact"><div><p className="eyebrow">由你定义，按证据更新</p><h1>我的目标地图</h1><p className="intro">进度不是评价，而是帮助你看清方向的仪表。</p></div><button className="primary-round" onClick={onNew}>＋ 新目标</button></div>
    <section className="goal-summary-card"><div><p>跨领域加权进度</p><b>{data.overallProgress}%</b><span>权重由你设置，随阶段调整。</span></div><div className="ring" style={{ '--progress': `${data.overallProgress * 3.6}deg` } as CSSProperties}><i>{data.overallProgress}</i></div></section>
    <section className="domain-grid">{data.goals.map((goal) => <button className="domain-card" key={goal.id} onClick={() => onUpdate(goal)}><div className="domain-card-top"><span className={`goal-symbol ${domains[goal.domain]?.tone}`}>{domains[goal.domain]?.short || '标'}</span><i>{domains[goal.domain]?.label || '成长目标'}</i><b>{goal.progress}%</b></div><h2>{goal.title}</h2><p>{goal.detail || '为这个目标补充你认可的完成证据。'}</p><Progress value={goal.progress} tone={domains[goal.domain]?.tone} /><footer><span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span><span>{goal.deadline ? `至 ${goal.deadline.slice(5)}` : '持续进行'} · 更新 ↗</span></footer></button>)}</section>
    <button className="wide-cta" onClick={onNew}><span>＋</span><div><b>添加一个真正重要的目标</b><small>事业、健康、家庭、贡献或个人成长</small></div></button></>;
}

function GrowthView({ data }: { data: Bootstrap }) {
  const recent = [...data.history].slice(0, 10).reverse(); const completed = data.history.filter((item) => item.morningAction && item.eveningAchievement).length; const energyEntries = data.history.filter((item) => item.eveningEnergy); const averageEnergy = Math.round((energyEntries.reduce((sum, item) => sum + (item.eveningEnergy || 0), 0) / Math.max(1, energyEntries.length)) * 10) / 10;
  return <><div className="page-title-row compact"><div><p className="eyebrow">看见行动留下的轨迹</p><h1>成长复盘</h1><p className="intro">只呈现你提交的事实与自评，不猜测心理状态。</p></div></div>
    <section className="metric-grid"><article><span>连续记录</span><b>{data.streak}<small> 天</small></b><p>保持节奏，不追求完美</p></article><article><span>完整复盘</span><b>{completed}<small> 次</small></b><p>近 21 天晨晚均完成</p></article><article><span>自报能量</span><b>{averageEnergy || '—'}<small> / 5</small></b><p>仅用于回看个人节奏</p></article></section>
    <section className="chart-card"><div className="section-heading"><div><p>最近十次记录</p><h2>行动与能量</h2></div><span className="method-chip">本人自报</span></div><div className="bar-chart">{recent.map((entry) => <div className="bar-column" key={entry.entryDate}><div className="bar-track"><i style={{ height: `${(entry.eveningEnergy || entry.morningConfidence || 1) * 18}%` }} /></div><span>{entry.entryDate.slice(8)}</span></div>)}</div><div className="chart-legend"><i /> 每根柱子是当天自报能量或行动信心</div></section>
    <section className="reflection-panel"><div className="section-heading"><div><p>事实比印象更可靠</p><h2>近期学习与证据</h2></div></div><div className="evidence-list">{data.history.filter((item) => item.eveningLearning || item.eveningEvidence).slice(0, 6).map((item) => <article key={item.entryDate}><time>{formatDate(item.entryDate)}</time><div><h3>{item.eveningLearning || '完成了一次行动复盘'}</h3><p>{item.eveningEvidence || item.eveningAchievement}</p></div></article>)}</div></section></>;
}

function SupportView({ data, onRequest, onSave }: { data: Bootstrap; onRequest: () => void; onSave: (payload: Record<string, unknown>) => void }) {
  const [preferences, setPreferences] = useState(data.user.preferences); const open = data.support.filter((item) => item.status === 'open');
  return <><section className="help-hero"><div className="help-orbit">伴</div><div><p className="eyebrow">真实困难值得被看见</p><h1>你不必独自扛着</h1><p>你可以直接说明需要什么。导师看到的是你的原话与明确事实，不是隐性的心理标签。</p><button onClick={onRequest}>发起支持请求 <span>→</span></button></div></section>
    {open.length > 0 && <section className="open-request"><span>正在跟进</span><h2>{open[0].note || open[0].reason}</h2><p>导师可见 · {open[0].sourceDate || '今天'} · 你可以在下次记录中补充</p></section>}
    <section className="preference-card"><div className="section-heading"><div><p>你的数据，你来决定</p><h2>隐私与分享</h2></div></div><div className="preference-list"><Toggle label="允许本期导师查看记录" detail="关闭后，你会从导师工作台中移除。" checked={preferences.tutorAccess} change={(value) => setPreferences({ ...preferences, tutorAccess: value })} /><Toggle label="允许生成辅助摘要" detail="默认关闭；本版本不做心理诊断或人格评分。" checked={preferences.aiSummary} change={(value) => setPreferences({ ...preferences, aiSummary: value })} /><Toggle label="计入匿名班级统计" detail="只进入汇总数字，不显示你的原文。" checked={preferences.anonymizedStats} change={(value) => setPreferences({ ...preferences, anonymizedStats: value })} /></div><button className="secondary-button" onClick={() => onSave(preferences)}>保存隐私偏好</button><p className="privacy-note">每条晨间、晚间和目标记录还可以单独设为“仅自己可见”。</p></section>
    <section className="timeline"><div className="section-heading"><div><p>支持记录</p><h2>最近的陪伴</h2></div></div>{data.support.length ? data.support.slice(0, 6).map((item) => <article key={item.id}><i className={item.status === 'open' ? 'open' : ''} /><div><span>{item.type === 'student_request' ? '你发起的请求' : '导师跟进'}</span><h3>{item.note || item.reason}</h3><p>{item.sourceDate || item.createdAt.slice(0, 10)} · {item.status === 'open' ? '处理中' : '已完成'}</p></div></article>) : <p className="empty-copy">还没有支持记录。需要时，随时开口。</p>}</section></>;
}
function Toggle({ label, detail, checked, change }: { label: string; detail: string; checked: boolean; change: (value: boolean) => void }) { return <button className="preference-row" onClick={() => change(!checked)}><span><b>{label}</b><small>{detail}</small></span><i className={checked ? 'on' : ''}><em /></i></button>; }

function TutorView({ data, onStudent, onOutreach, onResolve, onSource }: { data: Bootstrap; onStudent: (student: TutorStudent) => void; onOutreach: (student: TutorStudent) => void; onResolve: (eventId: string) => void; onSource: () => void }) {
  const tutor = data.tutor!;
  return <section className="tutor-page view-enter"><header className="tutor-heading"><div><p className="eyebrow">{data.user.cohort} · 支持视角</p><h1>先看见谁正在开口</h1><p>主动请求优先；其他提示只描述记录事实，必须由导师沟通核实。</p></div><div className="tutor-heading-actions"><span className="method-chip">非诊断 · 非排名</span><button className="primary-round" onClick={onSource}>＋ 导入授权资料</button></div></header>
    <section className="metric-grid tutor-metrics"><article><span>本期学员</span><b>{tutor.metrics.studentCount}<small> 人</small></b><p>已授权导师查看</p></article><article><span>今日已记录</span><b>{tutor.metrics.checkedToday}<small> 人</small></b><p>{tutor.metrics.studentCount ? Math.round(tutor.metrics.checkedToday / tutor.metrics.studentCount * 100) : 0}% 参与</p></article><article><span>主动求助</span><b>{tutor.metrics.openRequests}<small> 项</small></b><p>优先回应真实请求</p></article><article><span>目标均值</span><b>{tutor.metrics.averageProgress}<small>%</small></b><p>仅作班级资源规划</p></article></section>
    <div className="tutor-grid"><section className="queue-panel"><div className="section-heading"><div><p>需要你的关注</p><h2>支持队列</h2></div><span>{tutor.queue.length} 条</span></div><div className="queue-list">{tutor.queue.map((item) => { const student = tutor.students.find((value) => value.id === item.studentId)!; return <article className={`queue-card ${item.priority}`} key={item.id}><div className="queue-top"><span><i />{item.studentName}</span><b>{item.kind === 'request' ? '本人请求' : item.priority === 'urgent' ? '尽快核实' : '建议关注'}</b></div><h3>{item.title}</h3><p>{item.reason}</p><small>依据：{item.source}{item.sourceDate ? ` · ${item.sourceDate}` : ''}</small><div className="queue-actions"><button onClick={() => onStudent(student)}>查看事实</button><button className="primary-small" onClick={() => item.eventId ? onResolve(item.eventId) : onOutreach(student)}>{item.eventId ? '完成跟进' : '记录联系'}</button></div></article>; })}{!tutor.queue.length && <p className="empty-copy">当前没有待核实的提示。</p>}</div></section>
      <section className="cohort-panel"><div className="section-heading"><div><p>本期视图</p><h2>学员近况</h2></div><span>按姓名 · 不排名</span></div><div className="student-list">{tutor.students.map((student) => <button className="student-row" key={student.id} onClick={() => onStudent(student)}><span className="student-avatar">{student.name.slice(0, 1)}</span><span className="student-info"><b>{student.name}</b><small>{student.checkedToday ? '今日已记录' : student.inactiveDays >= 3 ? `${student.inactiveDays} 天未记录` : '等待今日记录'}</small></span><span className="mini-progress"><i style={{ width: `${student.progress}%` }} /></span><strong>{student.progress}%</strong><em>{student.openRequests ? `${student.openRequests} 求助` : '查看'}</em></button>)}</div></section></div>
    <section className="source-panel"><div className="section-heading"><div><p>会议与群聊</p><h2>授权资料库</h2></div><button onClick={onSource}>导入文字资料</button></div><div className="source-grid"><article className="source-connector"><span>企业微信会话存档</span><h3>需管理员配置与成员知情</h3><p>个人微信历史消息无法由本应用直接读取。企业微信接入前需完成成员通知、必要同意与保存期限设置。</p><b>当前未自动连接</b></article>{tutor.sources.map((source) => <article className="source-item" key={source.id}><div><span>{source.type === 'meeting' ? '周会转写' : source.type === 'wecom' ? '企业微信群聊' : '其他资料'}</span><time>{source.sourceDate}</time></div><h3>{source.title}</h3><p>{source.content.slice(0, 150)}{source.content.length > 150 ? '…' : ''}</p><footer><span>{source.characterCount} 字 · {source.participantScope || '范围已记录'}</span><b title={source.consentNote}>同意依据已留档</b></footer></article>)}</div></section>
    <aside className="ethics-bar"><b>工作台原则</b><span>提示只用于分配支持，不用于评价、淘汰或公开排名。先问本人，再形成判断；紧急身心安全问题请交由合资格专业人员。</span></aside></section>;
}

function StudentDrawer({ student, close, outreach }: { student: TutorStudent; close: () => void; outreach: () => void }) {
  return <div className="drawer-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) close(); }}><aside className="student-drawer"><header><div><p className="eyebrow">学员事实卡</p><h2>{student.name}</h2></div><button onClick={close}>×</button></header><section className="drawer-progress"><div className="ring small" style={{ '--progress': `${student.progress * 3.6}deg` } as CSSProperties}><i>{student.progress}</i></div><div><b>目标加权进度</b><p>来自学员确认的当前值，不是能力评分。</p></div></section><div className="drawer-labels"><span>{student.checkedToday ? '今日已记录' : `${student.inactiveDays} 天未记录`}</span><span>{student.latestEnergy ? `最近能量 ${student.latestEnergy}/5` : '未填写能量'}</span><span>{student.openRequests ? `${student.openRequests} 个主动请求` : '无开放请求'}</span></div><section className="source-card"><span>最近可见记录 · {student.latestDate || '暂无日期'}</span><p>{student.latestSummary}</p></section><h3 className="drawer-title">目标明细</h3>{student.goals.map((goal) => <article className="drawer-goal" key={goal.id}><div><b>{goal.title}</b><span>{goal.progress}%</span></div><Progress value={goal.progress} tone={domains[goal.domain]?.tone} /></article>)}<footer><button className="secondary-button" onClick={close}>返回列表</button><button className="primary-button" onClick={outreach}>记录一次支持</button></footer></aside></div>;
}

function EntryModal({ modal, data, goal, student, saving, close, submit }: { modal: Exclude<Modal, null>; data: Bootstrap; goal: Goal | null; student: TutorStudent | null; saving: boolean; close: () => void; submit: (path: string, payload: Record<string, unknown>, message: string) => void }) {
  const entry = data.todayEntry;
  function handle(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget).entries()); if (modal === 'morning') submit('/api/daily', { ...body, kind: 'morning', entryDate: data.today }, '晨间立言已保存'); if (modal === 'evening') submit('/api/daily', { ...body, kind: 'evening', entryDate: data.today }, '晚间总结已保存'); if (modal === 'new-goal') submit('/api/goals', body, '新目标已建立'); if (modal === 'update-goal') submit('/api/goals', { ...body, id: goal?.id }, '目标证据与进度已更新'); if (modal === 'support') submit('/api/support', { ...body, action: 'request' }, '支持请求已发给导师'); if (modal === 'outreach') submit('/api/support', { ...body, action: 'outreach', studentId: student?.id }, '跟进记录已保存'); if (modal === 'source') submit('/api/sources', body, '授权资料已导入'); }
  const titles: Record<Exclude<Modal, null>, [string, string]> = { morning: ['晨间立言', '定下一个意图，以及今天真正能完成的一步。'], evening: ['晚间总结', '记录事实、证据和学习，不要求每天完美。'], 'new-goal': ['建立新目标', '目标属于你；导师只帮助你看见进度与障碍。'], 'update-goal': ['更新目标证据', goal?.title || '用事实更新进展'], support: ['请求支持', '直接告诉导师发生了什么，以及你希望得到什么帮助。'], outreach: ['记录导师跟进', `为 ${student?.name || '学员'} 留下一条可追溯的支持记录。`], source: ['导入授权资料', '粘贴已获授权的会议转写或企业微信导出文字，并记录同意依据。'] };
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) close(); }}><section className="modal-sheet"><header><div><p className="eyebrow">{formatDate(data.today, true)}</p><h2>{titles[modal][0]}</h2><span>{titles[modal][1]}</span></div><button onClick={close} aria-label="关闭">×</button></header><form onSubmit={handle}>
    {modal === 'morning' && <><Field label="今天，我想以怎样的状态出现？"><textarea name="intention" required defaultValue={entry?.morningIntention} placeholder="例如：清晰、坦诚，把注意力放在最重要的关系上" /></Field><Field label="今天最重要的一个可验证行动"><textarea name="action" required defaultValue={entry?.morningAction} placeholder="例如：在 16:00 前完成方案并发给合作伙伴" /></Field><div className="field-grid"><Field label="行动信心 1–5"><input name="confidence" type="number" min="1" max="5" defaultValue={entry?.morningConfidence || 3} /></Field><Visibility name="visibility" value={entry?.morningVisibility} /></div><Field label="可能的现实障碍"><input name="obstacle" defaultValue={entry?.morningObstacle} placeholder="时间、资源、沟通或精力" /></Field><Field label="希望导师提供什么支持？（可选）"><textarea name="help" defaultValue={entry?.morningHelp} placeholder="写下内容会生成一条明确的支持请求" /></Field></>}
    {modal === 'evening' && <><Field label="今天实际完成了什么？"><textarea name="achievement" required defaultValue={entry?.eveningAchievement} placeholder="只写事实，小步也值得记录" /></Field><Field label="完成证据"><input name="evidence" defaultValue={entry?.eveningEvidence} placeholder="交付物、沟通结果、照片或量化结果的描述" /></Field><Field label="今天学到什么？"><textarea name="learning" defaultValue={entry?.eveningLearning} placeholder="什么有效？明天想继续或调整什么？" /></Field><div className="field-grid"><Field label="今晚能量 1–5"><input name="energy" type="number" min="1" max="5" defaultValue={entry?.eveningEnergy || 3} /></Field><Visibility name="visibility" value={entry?.eveningVisibility} /></div><Field label="遇到的障碍"><input name="obstacle" defaultValue={entry?.eveningObstacle} placeholder="描述情境，不给自己贴标签" /></Field><Field label="希望导师提供什么支持？（可选）"><textarea name="help" defaultValue={entry?.eveningHelp} /></Field></>}
    {modal === 'new-goal' && <><div className="field-grid"><Field label="领域"><select name="domain" defaultValue="career">{Object.entries(domains).map(([key, value]) => <option value={key} key={key}>{value.label}</option>)}</select></Field><Field label="截止日期"><input name="deadline" type="date" /></Field></div><Field label="目标名称"><input name="title" required placeholder="具体、重要、由你选择" /></Field><Field label="为什么这件事重要"><textarea name="detail" placeholder="你希望它为生活带来什么变化？" /></Field><div className="field-grid thirds"><Field label="起始值"><input name="currentValue" type="number" step="any" min="0" defaultValue="0" /></Field><Field label="目标值"><input name="targetValue" type="number" step="any" min="0.01" defaultValue="10" /></Field><Field label="单位"><input name="unit" defaultValue="次" /></Field></div><div className="field-grid"><Field label="整体权重 5–50"><input name="weight" type="number" min="5" max="50" defaultValue="20" /></Field><Visibility name="visibility" /></div></>}
    {modal === 'update-goal' && goal && <><div className="goal-modal-summary"><span>{domains[goal.domain]?.label}</span><h3>{goal.title}</h3><Progress value={goal.progress} tone={domains[goal.domain]?.tone} /><p>当前 {goal.currentValue} / {goal.targetValue} {goal.unit}</p></div><Field label={`最新累计值（${goal.unit}）`}><input name="currentValue" required type="number" step="any" min="0" defaultValue={goal.currentValue} /></Field><Field label="这次更新的完成证据"><textarea name="evidence" required placeholder="具体发生了什么？什么结果能证明推进？" /></Field><Field label="补充说明（可选）"><textarea name="note" placeholder="下一步、障碍或需要的支持" /></Field></>}
    {modal === 'support' && <><Field label="我希望获得的支持"><textarea name="note" required placeholder="例如：请帮我一起判断三个项目的优先级；我希望本周能安排 20 分钟沟通。" /></Field><p className="form-note">这段原话会进入导师支持队列，并标记为“学员主动请求”。</p></>}
    {modal === 'outreach' && <><Field label="本次沟通或支持内容"><textarea name="note" required placeholder="记录已核实的事实、学员自己的表述，以及商定的下一步。" /></Field><p className="form-note">避免记录诊断、人格判断或未经本人确认的推测。</p></>}
    {modal === 'source' && <><div className="field-grid"><Field label="资料类型"><select name="sourceType" defaultValue="meeting"><option value="meeting">周会转写</option><option value="wecom">企业微信群聊</option><option value="other">其他授权资料</option></select></Field><Field label="资料日期"><input name="sourceDate" type="date" required defaultValue={data.today} /></Field></div><Field label="资料名称"><input name="title" required placeholder="例如：第 6 周小组复盘会" /></Field><Field label="参与范围"><input name="participantScope" placeholder="例如：事业三组 8 人；已排除未授权成员" /></Field><Field label="知情同意依据"><textarea name="consentNote" required placeholder="例如：会议开始前说明用途并取得全体同意，记录保存 90 天。" /></Field><Field label="文字内容"><textarea className="large-textarea" name="content" required placeholder="粘贴已授权的转写或导出文字。导入后只进入导师资料库，不会自动形成心理标签。" /></Field><p className="form-note">请勿上传未授权的个人微信聊天历史。当前版本保存文字资料与同意记录，不进行自动心理分析。</p></>}
    <footer className="form-actions"><button type="button" className="secondary-button" onClick={close}>取消</button><button className="primary-button" disabled={saving}>{saving ? '保存中…' : '保存记录'}</button></footer>
  </form></section></div>;
}
function Visibility({ name, value = 'tutor' }: { name: string; value?: string }) { return <Field label="谁可以看"><select name={name} defaultValue={value}><option value="tutor">我和本期导师</option><option value="private">仅自己</option></select></Field>; }
