// 答案之书 —— 可定制、会学习、问题与答案匹配的随机答案生成器
'use strict';

/* ================= 默认配置 ================= */
const THEMES = [
  { id: 'mystic', name: '神秘紫金', bg: '#2b1b52', gold: '#e8c977', violet: '#b388ff' },
  { id: 'ocean',  name: '幽蓝海渊', bg: '#10304f', gold: '#7fd8e8', violet: '#6fa8ff' },
  { id: 'rose',   name: '玫瑰占卜', bg: '#4a1c33', gold: '#f0b8a0', violet: '#e88fb8' },
  { id: 'forest', name: '森之秘语', bg: '#1d3d2e', gold: '#cfe0a0', violet: '#8fd6a8' },
  { id: 'solar',  name: '曜金圣殿', bg: '#4a3210', gold: '#ffd98a', violet: '#ffb36b' }
];

function parseTags(s) {
  if (Array.isArray(s)) return s.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim().slice(0, 12)).slice(0, 20);
  if (typeof s !== 'string') return [];
  return s.split(/[\s,，、;；]+/).map(x => x.trim()).filter(Boolean).map(x => x.slice(0, 12)).slice(0, 20);
}

// [文本, 类型, 适用词]
const DEFAULT_ANSWERS = [
  ['是，毫无疑问', 'yes', '能不能 可以吗 行不行 该不该 要不要 会不会 成功 机会'],
  ['答案是肯定的', 'yes', '能不能 可以吗 是不是 会吗 有没有 值得 决定'],
  ['命运站在你这边', 'yes', '运气 命运 冒险 赌 机会 选择 公平'],
  ['现在正是时候', 'yes', '现在 时机 时候 今天 开始 行动 准备'],
  ['毫无疑问，去吧', 'yes', '去吗 出发 旅行 行动 开始 尝试 跳槽'],
  ['星辰都指向「是」', 'yes', '会不会 能不能 是不是 结果 考试 面试'],
  ['相信你的直觉', 'yes', '直觉 感觉 内心 心动 喜欢 选择 决定'],
  ['时机已成熟', 'yes', '时机 时候 现在 准备 项目 创业 表白'],
  ['当然可以', 'yes', '可以 能不能 允许 行吗 一起 帮忙'],
  ['它会如你所愿', 'yes', '希望 愿望 期待 结果 心想事成 考试'],
  ['不是', 'no', '是不是 能不能 有没有 该不该 吗'],
  ['恐怕不行', 'no', '能不能 行吗 可以吗 机会 难度 危险'],
  ['不太可能', 'no', '会不会 可能 概率 机会 成功 考试'],
  ['别抱太大希望', 'no', '希望 期待 愿望 结果 等 消息'],
  ['答案是「否」', 'no', '是不是 该不该 要不要 行不行 决定'],
  ['还不是时候', 'no', '现在 时机 时候 等 急 准备'],
  ['放下这个念头吧', 'no', '放 念头 执念 纠结 想太多 前任'],
  ['这条路走不通', 'no', '路 方向 方法 继续 坚持 创业 项目'],
  ['最好不要', 'no', '最好 要不要 该不该 建议 提醒 小心'],
  ['希望渺茫', 'no', '希望 机会 成功 概率 结果 等'],
  ['也许', 'maybe', '会不会 可能 也许 吗 结果 未来'],
  ['再等等看', 'maybe', '等 什么时候 明天 以后 消息 结果'],
  ['问问你的心', 'maybe', '心 直觉 感觉 内心 喜欢 选择 该不该'],
  ['顺其自然', 'maybe', '自然 随缘 强求 结果 怎么办 关系'],
  ['答案在你手中', 'maybe', '选择 决定 自己 该不该 要不要 主动'],
  ['时机尚未成熟', 'maybe', '时机 时候 现在 准备 等 创业'],
  ['有些事说不清', 'maybe', '为什么 困惑 迷茫 想不通 缘分 感觉'],
  ['未来会告诉你', 'maybe', '未来 以后 明天 结果 会不会 等待'],
  ['一半一半', 'maybe', '概率 可能 会不会 赌 选择 风险'],
  ['静候佳音', 'maybe', '等 结果 消息 通知 希望 考试'],
  ['换个角度想想', 'maybe', '怎么办 角度 思路 困惑 卡住 方法'],
  ['天机不可泄露', 'maybe', '命 天意 为什么 神秘 未来 结果']
].map(([t, k, tags]) => ({ t, k, w: 1, tags: parseTags(tags), learned: [] }));

const TYPE_LABEL = { yes: '肯定', no: '否定', maybe: '模糊' };
const STORAGE_KEY = 'answerBookSettings';
const W_MIN = 0.25, W_MAX = 3.5;
const W_STEP = 0.3;
const HISTORY_MAX = 60;
const RECENT_MAX = 10;   // unique 模式：最近这么多条内不重复
const STOP_WORDS = new Set(['吗','呢','吧','啊','哦','嗯','我','你','他','她','它','我们','你们','他们','这个','那个','什么','怎么','为什么','怎么办','是否','可以','应该','要不要','会不会','能不能','是不是','该不该','有没有','现在','今天','明天','以后','未来','一个','真的','到底','还是','或者','就是','觉得','想问','请问','告诉','答案']);

function defaultSettings() {
  return {
    theme: 'mystic',
    accent: null,
    mainTitle: '答案之书',
    subTitle: '在心中默念你的问题，然后翻开它',
    coverTitle: '答案之书',
    answers: DEFAULT_ANSWERS.map(a => ({ ...a, tags: [...a.tags], learned: [] })),
    sound: true,
    stars: true,
    showQuestion: true,
    adaptive: true,
    match: true,   // 按问题内容匹配答案
    unique: true,  // 抽过的答案不再重复（一轮内）
    history: []
  };
}

/* ================= 状态与持久化 ================= */
let settings = loadSettings();
let isOpen = false;
let animating = false;
let lastAnswerText = null;
let currentAnswer = null;
let currentFeedback = null;
let currentQuestion = '';
let lastMatchNote = '';
let recentTexts = [];   // unique 模式：最近抽过的答案文本（滑动窗口）
let audioCtx = null;
let activeFilter = 'all';
let toastTimer = null;

const $ = (id) => document.getElementById(id);

function normalizeAnswers(arr, base) {
  if (!Array.isArray(arr)) return base;
  const clean = arr
    .filter(a => a && typeof a.t === 'string' && a.t.trim())
    .map(a => ({
      t: String(a.t).trim().slice(0, 30),
      k: TYPE_LABEL[a.k] ? a.k : 'maybe',
      w: Number.isFinite(Number(a.w)) ? Math.min(W_MAX, Math.max(W_MIN, Number(a.w))) : 1,
      tags: parseTags(a.tags),
      learned: parseTags(a.learned)
    }));
  return clean.length ? clean : base;
}

function normalizeHistory(h) {
  if (!Array.isArray(h)) return [];
  return h.slice(0, HISTORY_MAX).filter(x => x && typeof x.t === 'string').map(x => ({
    q: typeof x.q === 'string' ? x.q.slice(0, 60) : '',
    t: String(x.t).slice(0, 30),
    k: TYPE_LABEL[x.k] ? x.k : 'maybe',
    fb: x.fb === 'up' || x.fb === 'down' ? x.fb : null,
    ts: Number.isFinite(Number(x.ts)) ? Number(x.ts) : Date.now()
  }));
}

function loadSettings() {
  const base = defaultSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    const merged = { ...base, ...saved };
    merged.answers = normalizeAnswers(merged.answers, base.answers);
    merged.history = normalizeHistory(merged.history);
    if (!THEMES.some(t => t.id === merged.theme)) merged.theme = 'mystic';
    if (merged.accent !== null && !/^#[0-9a-f]{6}$/i.test(merged.accent || '')) merged.accent = null;
    ['mainTitle', 'subTitle', 'coverTitle'].forEach(k => {
      if (typeof merged[k] !== 'string') merged[k] = base[k];
    });
    return merged;
  } catch (e) {
    return base;
  }
}

function saveSettings() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) { /* 静默 */ }
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ================= 主题 / 外观 ================= */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function shade(hex, factor) {
  const c = hexToRgb(hex);
  if (!c) return hex;
  const f = v => Math.max(0, Math.min(255, Math.round(v * factor)));
  return '#' + [f(c.r), f(c.g), f(c.b)].map(v => v.toString(16).padStart(2, '0')).join('');
}
function rgba(hex, a) {
  const c = hexToRgb(hex);
  return c ? `rgba(${c.r}, ${c.g}, ${c.b}, ${a})` : hex;
}
function readableText(hex) {
  const c = hexToRgb(hex);
  if (!c) return '#1a1030';
  return (c.r * 299 + c.g * 587 + c.b * 114) / 1000 > 150 ? '#1a1030' : '#fff8e8';
}

function applyAppearance() {
  const root = document.documentElement;
  root.setAttribute('data-theme', settings.theme);
  ['--gold', '--gold-dim', '--violet', '--shadow-gold', '--glow', '--btn-text'].forEach(p => root.style.removeProperty(p));
  if (settings.accent && hexToRgb(settings.accent)) {
    const themeViolet = THEMES.find(t => t.id === settings.theme)?.violet || '#b388ff';
    root.style.setProperty('--gold', settings.accent);
    root.style.setProperty('--gold-dim', shade(settings.accent, 0.72));
    root.style.setProperty('--violet', themeViolet);
    root.style.setProperty('--shadow-gold', rgba(settings.accent, 0.32));
    root.style.setProperty('--glow', rgba(settings.accent, 0.26));
    root.style.setProperty('--btn-text', readableText(settings.accent));
  }
  $('mainTitle').textContent = settings.mainTitle;
  $('subTitle').textContent = settings.subTitle;
  $('coverTitle').textContent = settings.coverTitle;
  document.title = `${settings.mainTitle} · The Book of Answers`;
  document.body.classList.toggle('no-stars', !settings.stars);
  document.body.classList.toggle('hide-question', !settings.showQuestion);

  $('soundToggle').textContent = settings.sound ? '🔊' : '🔇';
  $('soundToggle').setAttribute('aria-label', settings.sound ? '关闭音效' : '开启音效');
  $('soundSwitch').checked = !!settings.sound;
  $('starSwitch').checked = !!settings.stars;
  $('questionSwitch').checked = !!settings.showQuestion;
  $('adaptiveSwitch').checked = !!settings.adaptive;
  $('matchSwitch').checked = !!settings.match;
  $('uniqueSwitch').checked = !!settings.unique;

  const accentHex = settings.accent || getComputedStyle(root).getPropertyValue('--gold').trim() || '#e8c977';
  $('accentColor').value = /^#[0-9a-f]{6}$/i.test(accentHex) ? accentHex : '#e8c977';
  $('accentValue').textContent = settings.accent ? settings.accent.toUpperCase() : '跟随主题';
  renderThemeGrid();
  renderMemoryPanel();
}

function renderThemeGrid() {
  const grid = $('themeGrid');
  grid.innerHTML = '';
  THEMES.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'theme-card' + (t.id === settings.theme ? ' active' : '');
    btn.dataset.theme = t.id;
    btn.innerHTML = `<span class="theme-swatch" style="background:linear-gradient(135deg, ${t.bg}, ${t.gold} 130%)"></span><span>${t.name}</span>`;
    btn.addEventListener('click', () => {
      settings.theme = t.id;
      applyAppearance(); saveSettings();
    });
    grid.appendChild(btn);
  });
}

/* ================= 问题 ⟷ 答案 匹配 ================= */
// 从问题中提取：命中答案适用词的个数 + 问题的类别倾向
function questionHints(question) {
  if (!question || !settings.match) return { hits: [], cat: null };
  const q = question.replace(/[\s，。！？、,.!?…「」"'《》：:；;]/g, '');
  const counts = new Map();
  const allWords = new Set();
  settings.answers.forEach(a => { (a.tags || []).concat(a.learned || []).forEach(w => allWords.add(w)); });
  allWords.forEach(w => {
    if (w && q.includes(w)) counts.set(w, (counts.get(w) || 0) + 1);
  });

  // 类别倾向：依据问句里常见的措辞做轻量判断
  let cat = null;
  if (/怎么办|如何|为什么|怎样|该不该|要不要|选择|纠结|迷茫|困惑/.test(q)) cat = 'maybe';
  else if (/是不是|会不会|能不能|可以吗|行不行|有没有/.test(q)) cat = /不能|不行|没有|不会|不是/.test(q) ? 'no' : 'yes';
  else if (/该不该|最好|建议|风险|危险|小心/.test(q)) cat = 'no';

  // 提取问题中的双字词，作为"满意时自动学习"的候选
  const grams = new Set();
  for (let i = 0; i < q.length - 1; i++) {
    const g = q.slice(i, i + 2);
    if (/[\u4e00-\u9fa5]{2}/.test(g) && !STOP_WORDS.has(g)) grams.add(g);
  }
  return { hits: [...counts.keys()], cat, grams: [...grams] };
}

function matchScore(answer, hint) {
  if (!settings.match || !hint) return 1;
  let boost = 1;
  const words = (answer.tags || []).concat(answer.learned || []);
  let hit = 0;
  words.forEach(w => { if (w && hint.hits.includes(w)) hit++; });
  if (hit) boost *= 1 + Math.min(2.2, hit * 0.7);       // 命中适用词 → 更容易出现
  if (hint.cat && answer.k === hint.cat) boost *= 1.35;  // 类别倾向
  return Math.min(5, boost);
}

// 加权随机抽取（unique 模式用滑动窗口排除最近答案，避免短期重复；其余按匹配权重抽取）
function pickAnswer(hint) {
  const pool = settings.answers;
  if (!pool.length) return { answer: null, note: '' };

  let candidates = pool.map((_, i) => i);
  // 排除最近出现过的答案；若排除后为空（答案太少），则退回全部
  if (settings.unique && recentTexts.length) {
    const filtered = candidates.filter(i => !recentTexts.includes(pool[i].t));
    if (filtered.length) candidates = filtered;
    else recentTexts = [];
  }

  const bias = categoryBias();
  const weights = candidates.map(i => {
    const a = pool[i];
    const w = settings.adaptive ? a.w * (bias[a.k] || 1) : 1;
    return Math.max(0.05, w * matchScore(a, hint));
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  let pos = candidates.length - 1;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) { pos = i; break; }
  }
  const chosen = pool[candidates[pos]];

  // 记录进滑动窗口
  if (settings.unique) {
    recentTexts.push(chosen.t);
    if (recentTexts.length > Math.min(RECENT_MAX, Math.max(1, pool.length - 1))) recentTexts.shift();
  }
  lastAnswerText = chosen.t;

  let note = '';
  if (settings.match && hint && hint.hits.length) note = `已结合你的问题匹配（命中：${hint.hits.slice(0, 3).join('、')}）`;
  else if (settings.unique) note = '已避开最近出现过的答案';
  return { answer: chosen, note };
}

// 满意反馈时，从问题里自动学习关键词
function learnFromQuestion(answer, question) {
  if (!question || !answer) return false;
  const hint = questionHints(question);
  const grams = hint.grams || [];
  if (!grams.length) return false;
  const learned = answer.learned || (answer.learned = []);
  let added = 0;
  for (const g of grams) {
    if (learned.length >= 12) break;
    if (learned.includes(g) || answer.tags.includes(g)) continue;
    learned.push(g); added++;
    if (added >= 3) break;
  }
  return added > 0;
}

function resetBag() { recentTexts = []; lastAnswerText = null; }

/* ================= 自适应反馈 ================= */
function categoryBias() {
  const bias = { yes: 1, no: 1, maybe: 1 };
  if (!settings.adaptive) return bias;
  const stat = { yes: { u: 0, d: 0 }, no: { u: 0, d: 0 }, maybe: { u: 0, d: 0 } };
  settings.history.forEach(h => {
    if (!stat[h.k] || !h.fb) return;
    if (h.fb === 'up') stat[h.k].u++; else stat[h.k].d++;
  });
  Object.keys(stat).forEach(k => {
    const { u, d } = stat[k];
    const n = u + d;
    if (n < 2) return;
    bias[k] = 1 + ((u - d) / n) * 0.3 * Math.min(1, n / 6);
  });
  return bias;
}

function giveFeedback(fb) {
  if (!currentAnswer) return;
  if (currentFeedback === 'up') currentAnswer.w = Math.max(W_MIN, currentAnswer.w - W_STEP);
  if (currentFeedback === 'down') currentAnswer.w = Math.min(W_MAX, currentAnswer.w + W_STEP);
  if (currentFeedback === fb) fb = null;
  if (fb === 'up') currentAnswer.w = Math.min(W_MAX, currentAnswer.w + W_STEP);
  if (fb === 'down') currentAnswer.w = Math.max(W_MIN, currentAnswer.w - W_STEP);
  currentFeedback = fb;

  const rec = settings.history[0];
  if (rec && rec.t === currentAnswer.t) rec.fb = fb;
  let learned = false;
  if (fb === 'up') learned = learnFromQuestion(currentAnswer, currentQuestion);

  saveSettings();
  renderFeedback(); renderMemoryPanel(); renderAnswers();
  if (fb === 'up') toast(learned ? '记住啦！还从你的问题里学到了关键词 ✦' : '记住啦，类似的答案会更常出现 ✦');
  else if (fb === 'down') toast('明白，会减少类似的答案');
  else toast('已取消这条反馈');
}

/* ================= 答案库 ================= */
function filteredAnswers() {
  return settings.answers.map((a, i) => ({ ...a, i })).filter(a => activeFilter === 'all' || a.k === activeFilter);
}
function weightLabel(w) {
  if (w >= 1.6) return ' ↑↑'; if (w >= 1.15) return ' ↑';
  if (w <= 0.5) return ' ↓↓'; if (w <= 0.85) return ' ↓'; return '';
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function tagsNote(a) {
  const bits = [];
  if (a.tags && a.tags.length) bits.push(`适用词：${a.tags.join('、')}`);
  if (a.learned && a.learned.length) bits.push(`自动学到：${a.learned.join('、')}`);
  return bits.join(' ｜ ') || '还没有适用词；点「满意」时我会从你的问题里自动学几个。';
}
function renderAnswers() {
  const list = $('answerList');
  list.innerHTML = '';
  filteredAnswers().forEach(a => {
    const li = document.createElement('li');
    li.className = 'answer-item';
    li.dataset.index = a.i;
    li.style.flexWrap = 'wrap';
    li.innerHTML =
      `<span class="badge ${a.k}">${TYPE_LABEL[a.k]}</span>` +
      `<span class="txt" title="点击编辑答案">${escapeHtml(a.t)}</span>` +
      `<span class="badge" style="border:none;opacity:.7;font-family:Georgia,serif" title="当前权重">${a.w.toFixed(2)}${weightLabel(a.w)}</span>` +
      `<button class="tag-edit" title="设置适用词" aria-label="设置适用词">⚑</button>` +
      `<button class="del" title="删除" aria-label="删除答案">×</button>` +
      `<div class="tag-editor"><input type="text" maxlength="120" value="${escapeHtml((a.tags || []).join(' '))}" placeholder="适用词，用空格分隔，如：能不能 时机 未来" /><div class="learned-note">${escapeHtml(tagsNote(a))}</div></div>`;
    list.appendChild(li);
  });
  $('answerCount').textContent = `共 ${settings.answers.length} 条`;
  if (!list.children.length) list.innerHTML = '<li class="answer-item" style="opacity:.6">这个分类还是空的，添加一条吧 ✦</li>';
}

/* ================= 记忆面板 ================= */
function renderMemoryPanel() {
  const hist = settings.history;
  const ups = hist.filter(h => h.fb === 'up').length;
  const downs = hist.filter(h => h.fb === 'down').length;
  const learnedCount = settings.answers.reduce((s, a) => s + (a.learned ? a.learned.length : 0), 0);
  $('memoryStat').textContent = `已记录 ${hist.length} 次 · 满意 ${ups} · 学到 ${learnedCount} 词`;

  const stat = { yes: { u: 0, d: 0 }, no: { u: 0, d: 0 }, maybe: { u: 0, d: 0 } };
  hist.forEach(h => { if (stat[h.k] && h.fb) stat[h.k][h.fb === 'up' ? 'u' : 'd']++; });
  const counts = { yes: stat.yes.u + stat.yes.d, no: stat.no.u + stat.no.d, maybe: stat.maybe.u + stat.maybe.d };
  const totalFb = counts.yes + counts.no + counts.maybe;
  const box = $('biasBox');
  if (!totalFb) {
    box.innerHTML = '<p class="bias-empty">还没有反馈记录。揭晓答案后点一下「满意 / 不满意」，我就会开始了解你的偏好。</p>';
  } else {
    box.innerHTML = Object.keys(TYPE_LABEL).map(k => {
      const c = counts[k];
      const pct = totalFb ? Math.round(c / totalFb * 100) : 0;
      const likeRate = c ? Math.round(stat[k].u / c * 100) : 0;
      return `<div class="bias-row"><span class="bias-name">${TYPE_LABEL[k]}</span>` +
        `<span class="bias-track"><span class="bias-fill ${k}" style="width:${pct}%"></span></span>` +
        `<span class="bias-num">${likeRate}%</span></div>`;
    }).join('') + '<p class="hint" style="margin-top:2px">进度条＝该类在你反馈中的占比，右侧数字＝该类答案的满意率。</p>';
  }
  $('adaptiveHint').textContent = settings.adaptive
    ? '自适应已开启：每次反馈都会微调答案权重与类别偏好，越用越懂你。记忆只保存在你的浏览器里。'
    : '自适应已关闭：反馈仍会被记录，但暂时不影响答案出现概率。打开上方开关即可启用。';

  const hl = $('historyList');
  if (!hist.length) {
    hl.innerHTML = '<li class="history-empty">暂时还没有问答记录。</li>';
  } else {
    hl.innerHTML = hist.slice(0, 12).map(h => {
      const q = h.q ? escapeHtml(h.q) : '<span style="opacity:.5">（心中默念的问题）</span>';
      const f = h.fb === 'up' ? '<span class="h-fb up">✓</span>' : h.fb === 'down' ? '<span class="h-fb down">✕</span>' : '<span class="h-fb none">·</span>';
      return `<li class="history-item">${f}<span class="h-q">${q}</span><br><span class="h-a">→ ${escapeHtml(h.t)}</span></li>`;
    }).join('');
  }
}

function renderFeedback() {
  const bar = $('feedbackBar');
  if (!currentAnswer || !isOpen) { bar.hidden = true; return; }
  bar.hidden = false;
  $('fbUp').classList.toggle('picked-up', currentFeedback === 'up');
  $('fbDown').classList.toggle('picked-down', currentFeedback === 'down');
}

/* ================= 星空 / 音效 ================= */
function createStars() {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 120; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = 1 + Math.random() * 2;
    star.style.width = size + 'px'; star.style.height = size + 'px';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = (Math.random() * 4).toFixed(2) + 's';
    star.style.animationDuration = (2 + Math.random() * 3).toFixed(2) + 's';
    frag.appendChild(star);
  }
  $('stars').appendChild(frag);
}
function playChime() {
  if (!settings.sound) return;
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      const t = now + i * 0.11;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(t); osc.stop(t + 1.5);
    });
  } catch (e) { /* 静默 */ }
}

/* ================= 翻书交互 ================= */
function setBookOpen(open) {
  $('book').classList.toggle('open', open);
  isOpen = open;
  if (!open) { $('feedbackBar').hidden = true; $('matchHint').textContent = ''; }
}
function doReveal() {
  const question = $('questionInput').value.trim();
  currentQuestion = question;
  $('pageQuestion').textContent = question ? '你问：' + question : '';
  const hint = questionHints(question);
  const { answer, note } = pickAnswer(hint);

  currentAnswer = answer;
  currentFeedback = null;
  $('answer').textContent = answer ? answer.t : '…';
  lastMatchNote = note;
  if (answer) {
    settings.history.unshift({ q: question, t: answer.t, k: answer.k, fb: null, ts: Date.now() });
    if (settings.history.length > HISTORY_MAX) settings.history.length = HISTORY_MAX;
    saveSettings();
  }
  setBookOpen(true);
  setTimeout(finishReveal, 500);
}
function reveal() {
  if (animating) return;
  animating = true;
  $('revealBtn').disabled = true;
  $('status').textContent = '星辰正在低语…';
  $('feedbackBar').hidden = true;
  $('matchHint').textContent = '';
  if (isOpen) {
    $('answer').classList.remove('show');
    setBookOpen(false);
    setTimeout(doReveal, 850);
  } else doReveal();
}
function finishReveal() {
  $('answer').classList.add('show');
  $('status').textContent = '请聆听你内心的回响';
  $('matchHint').textContent = lastMatchNote ? '✦ ' + lastMatchNote : '';
  $('revealBtn').disabled = false;
  $('revealBtn').innerHTML = '<span class="btn-icon">✦</span> 再问一次';
  renderFeedback(); playChime(); animating = false;
}

/* ================= 设置抽屉 ================= */
function openDrawer() {
  $('drawerBackdrop').hidden = false;
  $('drawer').classList.add('open');
  $('drawer').setAttribute('aria-hidden', 'false');
  renderAnswers(); renderMemoryPanel();
}
function closeDrawer() {
  $('drawer').classList.remove('open');
  $('drawer').setAttribute('aria-hidden', 'true');
  setTimeout(() => { $('drawerBackdrop').hidden = true; }, 380);
}

/* ================= 事件 ================= */
$('revealBtn').addEventListener('click', reveal);
$('questionInput').addEventListener('keydown', e => { if (e.key === 'Enter') reveal(); });
$('fbUp').addEventListener('click', () => giveFeedback('up'));
$('fbDown').addEventListener('click', () => giveFeedback('down'));

$('soundToggle').addEventListener('click', toggleSound);
function toggleSound() {
  settings.sound = !settings.sound;
  applyAppearance(); saveSettings();
  if (settings.sound) playChime();
}
$('settingsBtn').addEventListener('click', openDrawer);
$('closeDrawer').addEventListener('click', closeDrawer);
$('drawerBackdrop').addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('drawer').classList.contains('open')) closeDrawer();
});

$('accentColor').addEventListener('input', e => { settings.accent = e.target.value; applyAppearance(); saveSettings(); });
$('resetAccent').addEventListener('click', () => { settings.accent = null; applyAppearance(); saveSettings(); toast('已跟随主题配色'); });
[['mainTitleInput', 'mainTitle'], ['subTitleInput', 'subTitle'], ['coverTitleInput', 'coverTitle']].forEach(([id, key]) => {
  $(id).addEventListener('input', e => { settings[key] = e.target.value; applyAppearance(); saveSettings(); });
});
$('resetText').addEventListener('click', () => {
  const d = defaultSettings();
  settings.mainTitle = d.mainTitle; settings.subTitle = d.subTitle; settings.coverTitle = d.coverTitle;
  syncTextInputs(); applyAppearance(); saveSettings(); toast('文案已恢复默认');
});
function syncTextInputs() {
  $('mainTitleInput').value = settings.mainTitle;
  $('subTitleInput').value = settings.subTitle;
  $('coverTitleInput').value = settings.coverTitle;
}

$('filterRow').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  activeFilter = chip.dataset.filter;
  $('filterRow').querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === chip));
  renderAnswers();
});
$('addAnswerBtn').addEventListener('click', addAnswer);
$('newAnswerInput').addEventListener('keydown', e => { if (e.key === 'Enter') addAnswer(); });
function addAnswer() {
  const input = $('newAnswerInput');
  const text = input.value.trim();
  if (!text) { toast('先写点什么吧'); return; }
  settings.answers.push({ t: text.slice(0, 30), k: $('newAnswerType').value, w: 1, tags: parseTags($('newAnswerTags').value), learned: [] });
  input.value = ''; $('newAnswerTags').value = '';
  resetBag(); saveSettings(); renderAnswers(); toast('已添加答案 ✦');
}

$('answerList').addEventListener('click', e => {
  const li = e.target.closest('.answer-item');
  if (!li || li.dataset.index === undefined) return;
  const idx = Number(li.dataset.index);

  if (e.target.closest('.del')) {
    settings.answers.splice(idx, 1);
    resetBag(); saveSettings(); renderAnswers(); toast('已删除答案');
    return;
  }
  if (e.target.classList.contains('tag-edit')) {
    const ed = li.querySelector('.tag-editor');
    const on = ed.classList.toggle('open');
    e.target.classList.toggle('on', on);
    if (on) { const inp = ed.querySelector('input'); inp.focus(); inp.select(); }
    return;
  }
  if (e.target.classList.contains('txt') && !li.querySelector('.edit-input')) {
    const span = e.target;
    const input = document.createElement('input');
    input.type = 'text'; input.className = 'edit-input'; input.value = settings.answers[idx].t;
    span.replaceWith(input); input.focus(); input.select();
    let done = false;
    const commit = () => {
      if (done) return; done = true;
      const v = input.value.trim();
      if (v) { settings.answers[idx].t = v.slice(0, 30); saveSettings(); }
      renderAnswers();
    };
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', ev => {
      if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
      if (ev.key === 'Escape') { done = true; renderAnswers(); }
    });
  }
});
$('answerList').addEventListener('change', e => {
  if (!e.target.classList.contains('tag-editor') && !e.target.closest('.tag-editor')) return;
  const li = e.target.closest('.answer-item');
  if (!li || li.dataset.index === undefined) return;
  const idx = Number(li.dataset.index);
  const input = li.querySelector('.tag-editor input');
  if (!input) return;
  settings.answers[idx].tags = parseTags(input.value);
  saveSettings(); renderAnswers(); toast('适用词已更新');
});

$('resetAnswers').addEventListener('click', () => {
  settings.answers = defaultSettings().answers;
  resetBag(); saveSettings(); renderAnswers(); toast('答案库已恢复默认');
});
$('soundSwitch').addEventListener('change', () => { if (settings.sound !== $('soundSwitch').checked) toggleSound(); });
$('starSwitch').addEventListener('change', e => { settings.stars = e.target.checked; applyAppearance(); saveSettings(); });
$('questionSwitch').addEventListener('change', e => { settings.showQuestion = e.target.checked; applyAppearance(); saveSettings(); });
$('adaptiveSwitch').addEventListener('change', e => { settings.adaptive = e.target.checked; applyAppearance(); saveSettings(); toast(settings.adaptive ? '自适应已开启，会从反馈中学习' : '自适应已关闭'); });
$('matchSwitch').addEventListener('change', e => { settings.match = e.target.checked; saveSettings(); toast(settings.match ? '已开启问题与答案匹配' : '已关闭匹配，恢复纯随机'); });
$('uniqueSwitch').addEventListener('change', e => { settings.unique = e.target.checked; resetBag(); saveSettings(); toast(settings.unique ? '已开启：最近答案不再重复' : '已关闭不重复限制'); });

$('clearMemoryBtn').addEventListener('click', () => {
  settings.history = [];
  settings.answers.forEach(a => { a.w = 1; a.learned = []; });
  currentFeedback = null; resetBag();
  saveSettings(); renderFeedback(); renderAnswers(); renderMemoryPanel();
  toast('记忆已清除，一切从头开始 ✦');
});

/* 导出 / 导入 / 全部重置 */
$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${settings.mainTitle || 'answer-book'}-配置.json`;
  a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('配置与记忆已导出 ✦');
});
$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || !Array.isArray(data.answers)) throw new Error('bad');
      const base = defaultSettings();
      const fresh = { ...base, ...data };
      fresh.answers = normalizeAnswers(fresh.answers, base.answers);
      fresh.history = normalizeHistory(fresh.history);
      if (!THEMES.some(t => t.id === fresh.theme)) fresh.theme = 'mystic';
      if (fresh.accent !== null && !/^#[0-9a-f]{6}$/i.test(fresh.accent || '')) fresh.accent = null;
      settings = fresh;
      currentAnswer = null; currentFeedback = null; resetBag();
      applyAppearance(); syncTextInputs(); renderAnswers(); renderFeedback(); saveSettings();
      toast('配置与记忆导入成功 ✦');
    } catch (err) {
      toast('文件格式不正确，导入失败');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});
$('resetAllBtn').addEventListener('click', () => {
  settings = defaultSettings();
  activeFilter = 'all'; currentAnswer = null; currentFeedback = null; resetBag();
  $('filterRow').querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.filter === 'all'));
  applyAppearance(); syncTextInputs(); renderAnswers(); renderFeedback(); saveSettings();
  toast('已恢复全部默认设置');
});

/* ================= 启动 ================= */
createStars();
applyAppearance();
syncTextInputs();
renderAnswers();
renderMemoryPanel();
