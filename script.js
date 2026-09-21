// --- ダークモード切替機能 ---
function initTheme() {
  let savedTheme = 'light';
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') savedTheme = stored;
  } catch { /* Storage is optional. */ }
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  try { localStorage.setItem('theme', newTheme); } catch { /* Storage is optional. */ }
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const themeIcon = document.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// --- モーダル機能 ---
function openModal() {
  const modal = document.getElementById('help-modal');
  if (modal) {
    modal.classList.add('show');
    // Escキーで閉じる
    document.addEventListener('keydown', handleModalEsc);
  }
}

function closeModal() {
  const modal = document.getElementById('help-modal');
  if (modal) {
    modal.classList.remove('show');
    document.removeEventListener('keydown', handleModalEsc);
  }
}

function handleModalEsc(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
}

// --- URLパラメータ解析 ---
function parseUrlParameters() {
  const incoming = WeirdStringLogic.parseLocation(location.search, location.hash);
  if (incoming.text === null) return;
  setSampleText(incoming.text);
  const info = document.getElementById('source-info');
  info.hidden = incoming.source === null;
  const key = incoming.source === 'clipthreat-studio' ? 'source.clipthreat' :
    incoming.source === 'qr-risk-radar' ? 'source.qr' : 'source.other';
  info.textContent = incoming.source === null ? '' : t(key) +
    (incoming.attackType ? t('source.attack', { attackType: incoming.attackType }) : '');
}

// ページ読み込み時にテーマを初期化
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  // テーマ切替ボタンのイベントリスナー
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // ヘルプボタンのイベントリスナー
  const helpButton = document.getElementById('help-button');
  if (helpButton) {
    helpButton.addEventListener('click', openModal);
  }
  
  // モーダル閉じるボタンのイベントリスナー
  const modalClose = document.querySelector('.modal-close');
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }
  
  // モーダル背景クリックで閉じる
  const modal = document.getElementById('help-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
  
  // 入力の経路を初期化
  initInput();
  
  // サンプルカテゴリ初期化
  switchSampleCategory('invisible');
});

// --- 辞書とDOMの共通処理 ---
const L = WeirdStringLogic;
const t = (key, params) => WeirdStringMessages.format('ja', key, params);
let analysisTimer = null;
let currentResult = null;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function charName(char) {
  const hex = char.cp.toString(16).toUpperCase().padStart(4, '0');
  const key = 'charName.' + hex;
  if (Object.hasOwn(WeirdStringMessages.ja, key)) return t(key);
  const abbr = L.abbrOf(char.cp);
  if (abbr?.startsWith('VS')) return t('charName.vs', { n: abbr.slice(2) });
  if (abbr === 'TAG:SP') return t('charName.tagSpace');
  if (abbr?.startsWith('TAG:')) return t('charName.tag', { ascii: abbr.slice(4) });
  return char.category ? t('category.' + char.category) : t('char.ordinary');
}

function charLabel(char) {
  if (['tag', 'bidi', 'variation', 'invisible', 'control', 'whitespace', 'private'].includes(char.category)) {
    return L.abbrOf(char.cp) || L.describeCodePoint(char.cp).codePoint;
  }
  if (['zalgo', 'combining'].includes(char.category)) return t('char.combining', { char: char.ch });
  if (['compat', 'lookalike'].includes(char.category) && char.ascii !== null) {
    return t('char.mapping', { char: char.ch, ascii: char.ascii });
  }
  if (char.newline) return char.cp === 10 ? t('char.lf') : t('char.cr');
  return char.ch;
}

// --- サンプル切替（データとタブは段階4で更新） ---
function switchSampleCategory(category) {
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach(btn => btn.classList.remove('active'));
  const activeTab = Array.from(tabs).find(btn => btn.textContent.toLowerCase().includes(category));
  if (activeTab) activeTab.classList.add('active');
  const area = document.getElementById('sampleListArea');
  area.replaceChildren();
  for (const sample of sampleData[category] || []) {
    const box = element('div', undefined, 'sample-box');
    const heading = element('p');
    heading.append(element('strong', sample.name));
    const button = element('button', t('sample.load'));
    button.type = 'button';
    button.addEventListener('click', () => setSampleText(sample.text));
    box.append(heading, element('p', sample.description), button);
    area.append(box);
  }
}

// --- プログラムからの入力はこの経路に集める ---
function setSampleText(text) {
  const escape = L.needsEscapeMode(text);
  document.getElementById('mode-escape').checked = escape;
  document.getElementById('mode-plain').checked = !escape;
  document.getElementById('inputText').value = escape ? L.escapeForInput(text) : text;
  renderAnalysis();
}

function interpretedInput() {
  const value = document.getElementById('inputText').value;
  return document.getElementById('mode-escape').checked ? L.decodeEscapes(value) : { text: value, errors: [] };
}

function initInput() {
  document.getElementById('inputText').addEventListener('input', () => {
    clearTimeout(analysisTimer);
    if (document.getElementById('inputText').value.length > 20000) analysisTimer = setTimeout(renderAnalysis, 200);
    else renderAnalysis();
  });
  for (const radio of document.querySelectorAll('[name="input-mode"]')) radio.addEventListener('change', renderAnalysis);
  document.getElementById('to-escape').addEventListener('click', () => {
    const input = document.getElementById('inputText');
    input.value = L.escapeForInput(input.value);
    document.getElementById('mode-escape').checked = true;
    renderAnalysis();
  });
  document.getElementById('to-plain').addEventListener('click', () => {
    const decoded = interpretedInput();
    if (L.needsEscapeMode(decoded.text)) {
      document.getElementById('input-message').textContent = t('input.cr');
      return;
    }
    document.getElementById('inputText').value = decoded.text;
    document.getElementById('mode-plain').checked = true;
    renderAnalysis();
  });
  document.getElementById('clear-input').addEventListener('click', () => setSampleText(''));
  addEventListener('hashchange', parseUrlParameters);
  renderAnalysis();
  parseUrlParameters();
}

// --- 判定・内訳と論理順の表示 ---
function renderAnalysis() {
  clearTimeout(analysisTimer);
  const decoded = interpretedInput();
  currentResult = L.analyze(decoded.text);
  const result = currentResult;
  const escape = document.getElementById('mode-escape').checked;
  document.getElementById('to-escape').disabled = escape;
  document.getElementById('to-plain').disabled = !escape;
  const messages = [];
  if (decoded.errors.length) messages.push(t('input.errors', { n: decoded.errors.length }));
  if (result.truncated) messages.push(t('input.truncated'));
  document.getElementById('input-message').textContent = messages.join(t('message.separator'));
  document.getElementById('input-stats').textContent = t('input.stats', result.length);
  const verdict = document.getElementById('verdict');
  verdict.dataset.verdict = result.text ? result.verdict : 'empty';
  verdict.textContent = t('verdict.' + verdict.dataset.verdict);
  const summary = document.getElementById('summaryList');
  summary.replaceChildren();
  for (const category of L.CATEGORY_ORDER) {
    const count = result.counts[category];
    if (!count.total) continue;
    const breakdown = L.SEVERITY_ORDER.filter(severity => count[severity]).map(severity =>
      t('summary.part', { severity: t('severity.' + severity), count: count[severity] })).join(t('summary.separator'));
    summary.append(element('li', t('summary.item', { category: t('category.' + category), count: count.total, breakdown })));
  }
  if (!summary.childElementCount) summary.append(element('li', t(result.text ? 'verdict.clean' : 'summary.empty')));
  document.getElementById('view-rendered').textContent = result.text;
  renderLogical(result);
  document.getElementById('char-detail').textContent = t('detail.initial');
}

function renderLogical(result) {
  const view = document.getElementById('view-logical');
  const fragment = document.createDocumentFragment();
  let plain = '';
  const flush = () => {
    if (plain) fragment.append(element('span', plain));
    plain = '';
  };
  for (const char of result.chars.slice(0, L.VIEW_LIMIT)) {
    if (!char.category && !char.newline) { plain += char.ch; continue; }
    flush();
    if (char.newline) {
      const mark = element('span', charLabel(char), 'newline-mark');
      mark.setAttribute('aria-hidden', 'true');
      fragment.append(mark);
      if (char.cp === 10) fragment.append(element('br'));
      continue;
    }
    const chip = element('button', charLabel(char), 'chip');
    chip.type = 'button';
    chip.dataset.severity = char.severity;
    chip.dataset.index = String(char.index);
    chip.setAttribute('aria-pressed', 'false');
    chip.setAttribute('aria-label', t('char.aria', {
      codePoint: L.describeCodePoint(char.cp).codePoint, name: charName(char), severity: t('severity.' + char.severity)
    }));
    fragment.append(chip);
  }
  flush();
  view.replaceChildren(fragment);
  document.getElementById('view-limit').textContent = result.chars.length > L.VIEW_LIMIT ? t('view.limit') : '';
}
