(() => {
  'use strict';

  const STORAGE_KEY = 'zhihui-growth-light-github-demo-v1';
  const root = document.querySelector('#app');
  const domains = {
    career: { label: '事业发展', short: '事', tone: 'jade' },
    health: { label: '身心健康', short: '健', tone: 'gold' },
    family: { label: '家庭关系', short: '家', tone: 'clay' },
    contribution: { label: '贡献同行', short: '同', tone: 'plum' },
    growth: { label: '自我成长', short: '长', tone: 'blue' },
  };
  const navItems = [
    ['today', '今', '今日'], ['goals', '标', '目标'], ['growth', '迹', '成长'], ['support', '伴', '支持'],
  ];
  let tab = 'today';
  let mode = 'student';
  let state = loadState();

  function localToday() {
    const value = new Date();
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  function isoOffset(days) {
    const value = new Date(`${localToday()}T12:00:00+08:00`);
    value.setDate(value.getDate() + days);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  function defaultState() {
    return {
      user: { name: '林晓光', cohort: '第18期 · 南方班' },
      entry: { date: localToday(), morningIntention: '', morningAction: '', morningConfidence: 3, eveningAchievement: '', eveningEvidence: '', eveningLearning: '', eveningEnergy: 3 },
      goals: [
        { id: 'g1', domain: 'career', title: '完成新产品验证', detail: '与真实客户完成十次深度访谈', target: 10, current: 6, unit: '次', weight: 40, deadline: isoOffset(30) },
        { id: 'g2', domain: 'health', title: '恢复稳定运动节奏', detail: '每周完成三次有氧或力量训练', target: 12, current: 8, unit: '次', weight: 30, deadline: isoOffset(24) },
        { id: 'g3', domain: 'family', title: '创造高质量家庭时间', detail: '每周一次不被工作打断的共同活动', target: 8, current: 5, unit: '次', weight: 30, deadline: isoOffset(38) },
      ],
      history: [
        { date: isoOffset(-6), energy: 3, achievement: '完成了第一轮客户访谈', learning: '先听事实，再急着给方案。' },
        { date: isoOffset(-5), energy: 4, achievement: '和合伙人对齐了本周重点', learning: '清晰的优先级能减少内耗。' },
        { date: isoOffset(-4), energy: 3, achievement: '完成一次力量训练', learning: '行动开始后，阻力比想象中小。' },
        { date: isoOffset(-3), energy: 2, achievement: '及时取消了低价值会议', learning: '说不也是对重要目标的承诺。' },
        { date: isoOffset(-2), energy: 4, achievement: '陪家人散步并认真倾听', learning: '在场本身就是一种支持。' },
        { date: isoOffset(-1), energy: 4, achievement: '整理了访谈中的三个共性需求', learning: '证据让决策更安定。' },
      ],
      support: [{ id: 's1', status: 'done', note: '导师建议：把本周目标缩小到一个可以验证的关键假设。', date: isoOffset(-2) }],
      preferences: { tutorAccess: true, aiSummary: false, anonymizedStats: true },
    };
  }
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved?.goals && saved?.preferences) {
        if (saved.entry?.date !== localToday()) saved.entry = defaultState().entry;
        return saved;
      }
    } catch { /* Use a clean demo if saved data is invalid. */ }
    return defaultState();
  }
  function saveState(message) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render();
    if (message) toast(message);
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }
  function progress(goal) { return Math.max(0, Math.min(100, Math.round((Number(goal.current) / Math.max(1, Number(goal.target))) * 100))); }
  function overallProgress() {
    const weight = state.goals.reduce((sum, goal) => sum + Number(goal.weight || 0), 0) || 1;
    return Math.round(state.goals.reduce((sum, goal) => sum + progress(goal) * Number(goal.weight || 0), 0) / weight);
  }
  function formatDate(value, long = false) {
    return new Intl.DateTimeFormat('zh-CN', long ? { month: 'long', day: 'numeric', weekday: 'long' } : { month: 'numeric', day: 'numeric' }).format(new Date(`${value}T12:00:00+08:00`));
  }
  function progressBar(value, tone = 'jade') { return `<div class="progress" aria-label="进度 ${value}%"><i class="${tone}" style="width:${value}%"></i></div>`; }

  function render() {
    const studentView = mode === 'student';
    root.innerHTML = `<main class="app-shell">
      <aside class="desktop-rail"><button class="brand-mark" data-action="home">光</button><nav>
        ${studentView ? navItems.map(([id, icon, label]) => `<button class="rail-item ${tab === id ? 'active' : ''}" data-tab="${id}"><span>${icon}</span>${label}</button>`).join('') : '<span class="rail-section">导师台</span><button class="rail-item active"><span>览</span>全班</button>'}
      </nav><div class="rail-avatar">演</div></aside>
      <section class="main-stage">
        <header class="global-topbar"><button class="mobile-brand" data-action="home"><span>光</span><b>智慧之光</b></button><div class="topbar-actions">
          <div class="role-switch"><button class="${studentView ? 'active' : ''}" data-mode="student">学员体验</button><button class="${!studentView ? 'active' : ''}" data-mode="tutor">导师工作台</button></div>
          <span class="local-badge">设备本地演示</span><button class="utility-button" data-action="reset">重置演示</button>
        </div></header>
        <aside class="demo-banner"><b>公开演示 · 无需登录</b><span>所有输入只保存在当前浏览器，不会上传，也不会与其他访客共享。请勿填写真实个人信息。</span></aside>
        ${studentView ? `<section class="student-page view-enter">${studentContent()}</section>` : tutorContent()}
      </section>
      ${studentView ? `<nav class="mobile-nav">${navItems.map(([id, icon, label]) => `<button class="${tab === id ? 'active' : ''}" data-tab="${id}"><span>${icon}</span>${label}</button>`).join('')}</nav>` : ''}
    </main>`;
  }

  function studentContent() {
    if (tab === 'goals') return goalsView();
    if (tab === 'growth') return growthView();
    if (tab === 'support') return supportView();
    return todayView();
  }
  function todayView() {
    const entry = state.entry;
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = isoOffset(index - 3);
      const parsed = new Date(`${date}T12:00:00+08:00`);
      const done = state.history.some(item => item.date === date) || (date === localToday() && (entry.morningAction || entry.eveningAchievement));
      return `<div class="day-cell ${date === localToday() ? 'active' : ''}"><span>${'日一二三四五六'[parsed.getDay()]}</span><b>${parsed.getDate()}</b><i class="${done ? 'done' : ''}"></i></div>`;
    }).join('');
    return `<div class="page-title-row"><div><p class="eyebrow">${escapeHtml(state.user.cohort)}</p><h1>早上好，${escapeHtml(state.user.name)}</h1><p class="intro">用一个清晰行动，让今天向重要的方向移动。</p></div><div class="date-seal"><span>${formatDate(localToday())}</span><b>${state.history.length + (entry.morningAction ? 1 : 0)}</b><small>累计记录</small></div></div>
      <div class="day-strip">${days}</div>
      <section class="hero-card"><div class="hero-copy"><p>${formatDate(localToday(), true)} · 今日意图</p><h2>${escapeHtml(entry.morningIntention || '今天，想为自己创造什么？')}</h2><button data-modal="morning">${entry.morningAction ? '更新晨间立言' : '写下晨间立言'} <span>→</span></button></div><div class="sun-orbit"><span>${overallProgress()}</span><small>整体进度</small></div><div class="hero-glow"></div></section>
      <section class="checkin-grid"><button class="checkin-card morning ${entry.morningAction ? 'complete' : ''}" data-modal="morning"><div class="card-icon">晨</div><div><span>晨间立言</span><h3>${escapeHtml(entry.morningAction || '等待你的开始')}</h3><p>${entry.morningAction ? `信心 ${entry.morningConfidence}/5 · 可随时调整` : '一个意图 · 一个行动'}</p></div><b>${entry.morningAction ? '✓' : '›'}</b></button>
      <button class="checkin-card evening ${entry.eveningAchievement ? 'complete' : ''}" data-modal="evening"><div class="card-icon">夕</div><div><span>晚间总结</span><h3>${escapeHtml(entry.eveningAchievement || '记录事实，也记录学习')}</h3><p>${entry.eveningAchievement ? `能量 ${entry.eveningEnergy}/5 · 已保存在本机` : '成就 · 证据 · 下一步'}</p></div><b>${entry.eveningAchievement ? '✓' : '›'}</b></button></section>
      <section class="section-block"><div class="section-heading"><div><p>你的方向</p><h2>目标进展</h2></div><button data-tab="goals">查看全部</button></div><div class="goal-list">${state.goals.slice(0, 3).map(goalRow).join('')}</div></section>
      <button class="support-card" data-tab="support"><div class="support-portrait">周</div><div><p>需要一点支持？</p><h3>${escapeHtml(state.support[0]?.note || '把真实障碍说出来，我们一起找到下一步。')}</h3><span>你决定什么时候开口</span></div><b>↗</b></button>`;
  }
  function goalRow(goal) {
    const domain = domains[goal.domain] || domains.growth;
    return `<article class="goal-row"><div class="goal-symbol ${domain.tone}">${domain.short}</div><div class="goal-main"><div><h3>${escapeHtml(goal.title)}</h3><b>${progress(goal)}%</b></div>${progressBar(progress(goal), domain.tone)}</div></article>`;
  }
  function goalsView() {
    const overall = overallProgress();
    return `<div class="page-title-row compact"><div><p class="eyebrow">由你定义，按证据更新</p><h1>我的目标地图</h1><p class="intro">进度不是评价，而是帮助你看清方向的仪表。</p></div><button class="primary-round" data-modal="new-goal">＋ 新目标</button></div>
      <section class="goal-summary-card"><div><p>跨领域加权进度</p><b>${overall}%</b><span>权重由你设置，随阶段调整。</span></div><div class="ring" style="--progress:${overall * 3.6}deg"><i>${overall}</i></div></section>
      <section class="domain-grid">${state.goals.map(goal => { const domain = domains[goal.domain] || domains.growth; return `<button class="domain-card" data-goal="${escapeHtml(goal.id)}"><div class="domain-card-top"><span class="goal-symbol ${domain.tone}">${domain.short}</span><i>${domain.label}</i><b>${progress(goal)}%</b></div><h2>${escapeHtml(goal.title)}</h2><p>${escapeHtml(goal.detail || '为这个目标补充你认可的完成证据。')}</p>${progressBar(progress(goal), domain.tone)}<footer><span>${goal.current} / ${goal.target} ${escapeHtml(goal.unit)}</span><span>更新 ↗</span></footer></button>`; }).join('')}</section>
      <button class="wide-cta" data-modal="new-goal"><span>＋</span><div><b>添加一个真正重要的目标</b><small>事业、健康、家庭、贡献或个人成长</small></div></button>`;
  }
  function growthView() {
    const todayRecord = state.entry.eveningAchievement ? [{ date: localToday(), energy: state.entry.eveningEnergy, achievement: state.entry.eveningAchievement, learning: state.entry.eveningLearning }] : [];
    const history = [...state.history, ...todayRecord].slice(-10);
    const average = history.length ? (history.reduce((sum, item) => sum + Number(item.energy || 0), 0) / history.length).toFixed(1) : '—';
    return `<div class="page-title-row compact"><div><p class="eyebrow">看见行动留下的轨迹</p><h1>成长复盘</h1><p class="intro">只呈现你提交的事实与自评，不猜测心理状态。</p></div></div>
      <section class="metric-grid"><article><span>累计记录</span><b>${history.length}<small> 天</small></b><p>保持节奏，不追求完美</p></article><article><span>目标进度</span><b>${overallProgress()}<small>%</small></b><p>根据本人更新的证据计算</p></article><article><span>自报能量</span><b>${average}<small> / 5</small></b><p>只用于回看个人节奏</p></article></section>
      <section class="chart-card"><div class="section-heading"><div><p>最近记录</p><h2>行动与能量</h2></div><span class="method-chip">本人自报</span></div><div class="bar-chart">${history.map(item => `<div class="bar-column"><div class="bar-track"><i style="height:${Math.max(14, Number(item.energy || 1) * 18)}%"></i></div><span>${item.date.slice(8)}</span></div>`).join('')}</div><div class="chart-legend"><i></i> 每根柱子是当天自报能量</div></section>
      <section class="reflection-panel"><div class="section-heading"><div><p>事实比印象更可靠</p><h2>近期学习与证据</h2></div></div><div class="evidence-list">${history.slice().reverse().map(item => `<article><time>${formatDate(item.date)}</time><div><h3>${escapeHtml(item.learning || '完成了一次行动复盘')}</h3><p>${escapeHtml(item.achievement)}</p></div></article>`).join('')}</div></section>`;
  }
  function supportView() {
    const open = state.support.filter(item => item.status === 'open');
    return `<section class="help-hero"><div class="help-orbit">伴</div><div><p class="eyebrow">真实困难值得被看见</p><h1>你不必独自扛着</h1><p>直接说明需要什么。导师应看到你的原话与明确事实，而不是隐性的心理标签。</p><button data-modal="support">发起支持请求 <span>→</span></button></div></section>
      ${open.length ? `<section class="open-request"><span>设备本地记录</span><h2>${escapeHtml(open[0].note)}</h2><p>${formatDate(open[0].date)} · 等待导师工作流接入</p></section>` : ''}
      <section class="preference-card"><div class="section-heading"><div><p>你的数据，你来决定</p><h2>隐私与分享</h2></div></div><div class="preference-list">${preference('tutorAccess', '允许本期导师查看记录', '正式版关闭后，将从导师工作台移除。')}${preference('aiSummary', '允许生成辅助摘要', '默认关闭；不做心理诊断或人格评分。')}${preference('anonymizedStats', '计入匿名班级统计', '只进入汇总数字，不显示原文。')}</div><p class="static-note">当前 GitHub 演示不会把数据上传到服务器，这些开关用于展示正式产品的隐私设计。</p></section>
      <section class="timeline"><div class="section-heading"><div><p>支持记录</p><h2>最近的陪伴</h2></div></div>${state.support.map(item => `<article><i class="${item.status === 'open' ? 'open' : ''}"></i><div><span>${item.status === 'open' ? '你发起的请求' : '导师跟进示例'}</span><h3>${escapeHtml(item.note)}</h3><p>${formatDate(item.date)} · ${item.status === 'open' ? '待跟进' : '已完成'}</p></div></article>`).join('')}</section>`;
  }
  function preference(key, label, detail) {
    return `<button class="preference-row" data-pref="${key}"><span><b>${label}</b><small>${detail}</small></span><i class="${state.preferences[key] ? 'on' : ''}"><em></em></i></button>`;
  }
  function tutorContent() {
    const openRequests = state.support.filter(item => item.status === 'open');
    const students = [
      { name: state.user.name, progress: overallProgress(), status: state.entry.morningAction ? '今日已记录' : '今日待记录', energy: state.entry.eveningEnergy || 3 },
      { name: '陈思远', progress: 78, status: '今日已记录', energy: 4 }, { name: '黄佳宁', progress: 63, status: '2天未记录', energy: 2 },
      { name: '赵明川', progress: 55, status: '今日已记录', energy: 3 }, { name: '梁安然', progress: 84, status: '今日已记录', energy: 5 },
    ];
    const requests = openRequests.length ? openRequests.map(item => ({ name: state.user.name, title: '学员主动求助', reason: item.note, priority: 'attention' })) : [{ name: '黄佳宁', title: '连续两天未记录', reason: '只呈现行为事实，建议导师先进行一次关怀确认。', priority: 'watch' }];
    const average = Math.round(students.reduce((sum, item) => sum + item.progress, 0) / students.length);
    return `<section class="tutor-page view-enter"><header class="tutor-heading"><div><p class="eyebrow">第18期 · 南方班</p><h1>导师支持工作台</h1><p>先看事实，再决定是否介入。所有演示数据都停留在当前设备。</p></div></header>
      <section class="metric-grid tutor-metrics"><article><span>演示学员</span><b>${students.length}<small> 人</small></b><p>含固定示例数据</p></article><article><span>今日记录</span><b>${students.filter(item => item.status.includes('已记录')).length}<small> 人</small></b><p>由本人主动提交</p></article><article><span>待支持</span><b>${requests.length}<small> 项</small></b><p>只基于明确事实</p></article><article><span>平均进度</span><b>${average}<small>%</small></b><p>目标加权汇总</p></article></section>
      <div class="tutor-grid"><section class="queue-panel"><div class="section-heading"><div><p>按事实排序</p><h2>支持队列</h2></div><span>${requests.length} 项</span></div><div class="queue-list">${requests.map(item => `<article class="queue-card ${item.priority}"><div class="queue-top"><span><i></i>${escapeHtml(item.name)}</span><b>需要关注</b></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.reason)}</p><small>来源：本人记录或明确的缺席事实</small><div class="queue-actions"><button data-action="demo-detail">查看依据</button><button class="primary-small" data-action="demo-contact">记录跟进</button></div></article>`).join('')}</div></section>
      <section class="cohort-panel"><div class="section-heading"><div><p>目标与记录概览</p><h2>学员状态</h2></div><span>演示班级</span></div><div class="student-list">${students.map(item => `<button class="student-row" data-action="student-detail"><span class="student-avatar">${escapeHtml(item.name.slice(0, 1))}</span><span class="student-info"><b>${escapeHtml(item.name)}</b><small>能量自报 ${item.energy}/5 · ${escapeHtml(item.status)}</small></span><span class="mini-progress"><i style="width:${item.progress}%"></i></span><strong>${item.progress}%</strong><em>${escapeHtml(item.status)}</em></button>`).join('')}</div></section></div>
      <div class="ethics-bar"><b>介入原则</b><span>不做心理诊断，不用聊天活跃度评价人格；优先使用本人求助、本人自报和可核验行为事实。</span></div>
      <section class="source-panel"><div class="section-heading"><div><p>数据来源设计</p><h2>正式版可接入</h2></div></div><div class="source-grid"><article class="source-connector"><span>学员主动记录</span><h3>晨间立言与晚间复盘</h3><p>结构化记录行动、证据、障碍与支持需求。</p><b>需本人同意</b></article><article class="source-connector"><span>经同意后导入</span><h3>群聊与周会纪要</h3><p>只导入获得授权的文本或转写稿，并保留来源。</p><b>演示未连接</b></article></div></section></section>`;
  }

  function openModal(type, goalId) {
    const goal = state.goals.find(item => item.id === goalId);
    const titles = { morning: ['晨间立言', '把重要方向变成今天的一步'], evening: ['晚间总结', '记录事实、证据与学习'], 'new-goal': ['添加目标', '由你定义成功的证据'], 'update-goal': ['更新目标进度', '按真实证据更新'], support: ['发起支持请求', '直接说出你需要什么'] };
    const [title, subtitle] = titles[type];
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'demo-modal';
    modal.innerHTML = `<section class="modal-sheet"><header><div><h2>${title}</h2><span>${subtitle}</span></div><button data-action="close-modal" aria-label="关闭">×</button></header>${modalForm(type, goal)}</section>`;
    document.body.appendChild(modal);
    modal.querySelector('input,textarea,select')?.focus();
  }
  function modalForm(type, goal) {
    const entry = state.entry;
    if (type === 'morning') return `<form data-form="morning"><label class="field"><span>今天想创造什么？</span><textarea name="intention" required>${escapeHtml(entry.morningIntention)}</textarea></label><label class="field"><span>最重要的一个行动</span><textarea name="action" required>${escapeHtml(entry.morningAction)}</textarea></label><label class="field"><span>行动信心（1–5）</span><div class="range-row"><input type="range" name="confidence" min="1" max="5" value="${entry.morningConfidence}"><output>${entry.morningConfidence}/5</output></div></label>${formActions('保存晨间立言')}</form>`;
    if (type === 'evening') return `<form data-form="evening"><label class="field"><span>今天完成了什么？</span><textarea name="achievement" required>${escapeHtml(entry.eveningAchievement)}</textarea></label><label class="field"><span>可核验的证据</span><textarea name="evidence" placeholder="例如：完成文档、沟通结果、数字变化">${escapeHtml(entry.eveningEvidence)}</textarea></label><label class="field"><span>今天学到了什么？</span><textarea name="learning">${escapeHtml(entry.eveningLearning)}</textarea></label><label class="field"><span>当前能量（1–5）</span><div class="range-row"><input type="range" name="energy" min="1" max="5" value="${entry.eveningEnergy}"><output>${entry.eveningEnergy}/5</output></div></label>${formActions('保存晚间总结')}</form>`;
    if (type === 'new-goal') return `<form data-form="new-goal"><label class="field"><span>目标名称</span><input name="title" required placeholder="真正重要、可由你行动的目标"></label><label class="field"><span>领域</span><select name="domain">${Object.entries(domains).map(([key, value]) => `<option value="${key}">${value.label}</option>`).join('')}</select></label><label class="field"><span>完成证据</span><textarea name="detail" placeholder="做到什么，才算真正向前？"></textarea></label><div class="field-grid thirds"><label class="field"><span>目标值</span><input name="target" type="number" min="1" value="10" required></label><label class="field"><span>当前值</span><input name="current" type="number" min="0" value="0" required></label><label class="field"><span>单位</span><input name="unit" value="次" required></label></div>${formActions('添加目标')}</form>`;
    if (type === 'update-goal') return `<form data-form="update-goal" data-id="${escapeHtml(goal.id)}"><section class="goal-modal-summary"><span>${escapeHtml((domains[goal.domain] || domains.growth).label)}</span><h3>${escapeHtml(goal.title)}</h3>${progressBar(progress(goal), (domains[goal.domain] || domains.growth).tone)}<p>当前 ${goal.current} / ${goal.target} ${escapeHtml(goal.unit)}</p></section><label class="field"><span>最新完成值</span><input name="current" type="number" min="0" max="${goal.target}" value="${goal.current}" required></label><label class="field"><span>本次证据或说明</span><textarea name="evidence" placeholder="记录真实发生的行动或结果"></textarea></label>${formActions('更新进度')}</form>`;
    return `<form data-form="support"><label class="field"><span>希望导师帮助你什么？</span><textarea name="note" required placeholder="描述事实、障碍，以及你希望获得的支持"></textarea></label><p class="form-note">当前为设备本地演示。提交后会出现在本机的导师工作台，不会发送给真实导师。</p>${formActions('记录支持请求')}</form>`;
  }
  function formActions(label) { return `<div class="form-actions"><button class="secondary-button" type="button" data-action="close-modal">取消</button><button class="primary-button" type="submit">${label}</button></div>`; }
  function closeModal() { document.querySelector('#demo-modal')?.remove(); }
  function toast(message) {
    document.querySelector('.toast')?.remove();
    const notice = document.createElement('div');
    notice.className = 'toast'; notice.textContent = message; document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 2400);
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('button,[data-tab],[data-mode]');
    if (!target) return;
    if (target.dataset.tab) { tab = target.dataset.tab; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (target.dataset.mode) { mode = target.dataset.mode; render(); return; }
    if (target.dataset.pref) { state.preferences[target.dataset.pref] = !state.preferences[target.dataset.pref]; saveState('隐私偏好已保存在本机'); return; }
    if (target.dataset.goal) { openModal('update-goal', target.dataset.goal); return; }
    if (target.dataset.modal) { openModal(target.dataset.modal); return; }
    const action = target.dataset.action;
    if (action === 'home') { mode = 'student'; tab = 'today'; render(); }
    if (action === 'close-modal') closeModal();
    if (action === 'reset' && window.confirm('重置当前设备上的演示记录？')) { localStorage.removeItem(STORAGE_KEY); state = defaultState(); tab = 'today'; render(); toast('演示数据已重置'); }
    if (action === 'demo-detail' || action === 'student-detail') toast('正式版会在这里展示获得授权的原始依据');
    if (action === 'demo-contact') toast('已演示记录一次导师跟进');
    if (event.target.classList.contains('modal-backdrop')) closeModal();
  });
  document.addEventListener('input', event => {
    if (event.target.type === 'range') event.target.parentElement.querySelector('output').textContent = `${event.target.value}/5`;
  });
  document.addEventListener('submit', event => {
    const form = event.target;
    if (!form.dataset.form) return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    if (form.dataset.form === 'morning') Object.assign(state.entry, { morningIntention: values.intention.trim(), morningAction: values.action.trim(), morningConfidence: Number(values.confidence) });
    if (form.dataset.form === 'evening') Object.assign(state.entry, { eveningAchievement: values.achievement.trim(), eveningEvidence: values.evidence.trim(), eveningLearning: values.learning.trim(), eveningEnergy: Number(values.energy) });
    if (form.dataset.form === 'new-goal') state.goals.push({ id: `g-${Date.now()}`, domain: values.domain, title: values.title.trim(), detail: values.detail.trim(), target: Number(values.target), current: Number(values.current), unit: values.unit.trim(), weight: 20, deadline: '' });
    if (form.dataset.form === 'update-goal') { const goal = state.goals.find(item => item.id === form.dataset.id); if (goal) goal.current = Number(values.current); }
    if (form.dataset.form === 'support') state.support.unshift({ id: `s-${Date.now()}`, status: 'open', note: values.note.trim(), date: localToday() });
    closeModal();
    saveState({ morning: '晨间立言已保存在本机', evening: '晚间总结已保存在本机', 'new-goal': '目标已添加', 'update-goal': '目标进度已更新', support: '支持请求已记录在本机' }[form.dataset.form]);
  });

  render();
})();
