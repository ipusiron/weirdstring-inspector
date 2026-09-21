// --- ダークモード切替機能 ---
function initTheme() {
  let savedTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
    themeIcon.textContent = theme === 'dark' ? t('theme.sun') : t('theme.moon');
  }
  const button = document.getElementById('theme-toggle');
  const label = theme === 'dark' ? t('theme.toLight') : t('theme.toDark');
  button.setAttribute('aria-label', label);
  button.setAttribute('aria-pressed', String(theme === 'dark'));
  button.title = label;
}

// --- モーダル機能 ---
function openModal() {
  const modal = document.getElementById('help-modal');
  if (modal) {
    modal.showModal();
    modal.querySelector('.modal-close').focus();
  }
}

function closeModal() {
  const modal = document.getElementById('help-modal');
  if (modal) {
    modal.close();
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
    modal.addEventListener('close', () => helpButton.focus());
    modal.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(modal.querySelectorAll('button, a[href], [tabindex="0"]'));
      const current = controls.indexOf(document.activeElement);
      if (event.shiftKey && current <= 0) {
        event.preventDefault();
        controls.at(-1).focus();
      } else if (!event.shiftKey && current === controls.length - 1) {
        event.preventDefault();
        controls[0].focus();
      }
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
  
  // 入力の経路を初期化
  initInput();
  initDetails();
  initActions();
  document.getElementById('file-input').addEventListener('change', loadTextFile);
  
  // サンプルカテゴリ初期化
  initSampleTabs();
  switchSampleCategory('tag');
});

// --- 辞書とDOMの共通処理 ---
const L = WeirdStringLogic;
const A = WeirdStringActions;
const t = (key, params) => WeirdStringMessages.format('ja', key, params);
let analysisTimer = null;
let currentResult = null;
let revision = 0;
let removalState = null;
let comparisonState = null;
let fileRequest = 0;
const notices = new Map();

function setNotice(id, key, params = {}) {
  notices.set(id, { key, params });
  document.getElementById(id).textContent = key ? t(key, params) : '';
}

function invalidateActions() {
  revision++;
  removalState = null;
  comparisonState = null;
  document.getElementById('copy-removal').disabled = true;
  document.getElementById('removal-candidates').replaceChildren();
  document.getElementById('removal-preview').value = '';
  document.getElementById('removal-escaped').textContent = '';
  document.getElementById('removal-result').textContent = t('actions.stale');
  document.getElementById('comparison-result').textContent = t('actions.stale');
}

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
  return '';
}

function charLabel(char) {
  if (['tag', 'bidi', 'variation', 'invisible', 'control', 'whitespace', 'private'].includes(char.category)) {
    return L.abbrOf(char.cp) || L.describeCodePoint(char.cp).codePoint;
  }
  if (['zalgo', 'combining'].includes(char.category)) return t('char.combining', { char: char.ch });
  if (char.japaneseTarget) return t('char.mapping', { char: char.ch, ascii: char.japaneseTarget });
  if (['compat', 'lookalike'].includes(char.category) && char.ascii !== null) {
    return t('char.mapping', { char: char.ch, ascii: char.ascii });
  }
  if (char.newline) return char.cp === 10 ? t('char.lf') : t('char.cr');
  return char.ch;
}

// --- サンプル切替とキーボード操作 ---
function initSampleTabs() {
  const tabs = Array.from(document.querySelectorAll('#sample-tabs [role="tab"]'));
  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener('click', () => switchSampleCategory(tab.dataset.category));
    tab.addEventListener('keydown', event => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      switchSampleCategory(tabs[next].dataset.category);
      tabs[next].focus();
    });
  }
}

function switchSampleCategory(category) {
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach(button => {
    const selected = button.dataset.category === category;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  const area = document.getElementById('sampleListArea');
  area.setAttribute('aria-labelledby', 'sample-tab-' + category);
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
  invalidateActions();
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
    invalidateActions();
    clearTimeout(analysisTimer);
    if (document.getElementById('inputText').value.length > 20000) analysisTimer = setTimeout(renderAnalysis, 200);
    else renderAnalysis();
  });
  for (const radio of document.querySelectorAll('[name="input-mode"]')) radio.addEventListener('change', () => {
    invalidateActions();
    renderAnalysis();
  });
  document.getElementById('to-escape').addEventListener('click', () => {
    invalidateActions();
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
    invalidateActions();
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
  renderPanels(result);
  document.getElementById('status').textContent = '';
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

// --- 詳細・コピー ---
function scriptName(name) {
  return Object.hasOwn(WeirdStringMessages.ja, 'script.' + name) ? t('script.' + name) : name;
}

function initDetails() {
  document.getElementById('view-logical').addEventListener('click', event => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    for (const button of document.querySelectorAll('.chip')) button.setAttribute('aria-pressed', String(button === chip));
    showCharDetail(currentResult.chars[Number(chip.dataset.index)]);
  });
  document.getElementById('table-all').addEventListener('change', () => renderTable(currentResult));
  document.getElementById('copy-comparable').addEventListener('click', () => copyText(currentResult.comparable));
}

function showCharDetail(char) {
  const description = L.describeCodePoint(char.cp);
  const detail = document.getElementById('char-detail');
  detail.replaceChildren();
  const heading = element('h3', t('detail.heading', { codePoint: description.codePoint }));
  const list = element('dl', undefined, 'detail-list');
  const fields = [
    ['detail.name', [description.abbr, charName(char)].filter(Boolean).join(' / ')],
    ['detail.category', t('category.' + char.category)], ['detail.severity', t('severity.' + char.severity)],
    ['detail.reason', t('reason.' + char.reason, { ascii: char.ascii, target: char.japaneseTarget })],
    ['detail.script', scriptName(description.script)],
    ['detail.gc', description.generalCategory], ['detail.utf8', description.utf8], ['detail.utf16', description.utf16],
    ['detail.escape', description.escape]
  ];
  for (const [key, value] of fields) {
    if (key === 'detail.name' && !value) continue;
    list.append(element('dt', t(key)), element('dd', value));
  }
  const link = element('a', t('detail.unicode'));
  link.href = 'https://util.unicode.org/UnicodeJsps/character.jsp?a=' + char.cp.toString(16).toUpperCase();
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  detail.append(heading, list, link);
  if (char.contextUnverified) detail.append(element('p', t('context.unverified')));
}

async function copyText(text) {
  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    document.getElementById('status').textContent = t('copy.success');
  } catch {
    document.getElementById('status').textContent = t('copy.failure');
  }
}

function renderPanels(result) {
  const hidden = document.getElementById('hidden-content');
  hidden.replaceChildren();
  document.getElementById('hidden-panel').hidden = result.hidden.length === 0;
  for (const item of result.hidden) {
    const block = element('div', undefined, 'hidden-entry');
    block.append(element('p', t('hidden.item', {
      kind: t('hidden.' + item.kind), start: item.start + 1, count: item.count
    })));
    block.append(element('pre', item.text === null ? t('hidden.unreadable') : L.escapeForInput(item.text)));
    if (item.candidate) block.append(element('p', t('hidden.candidate')));
    if (item.flagStatus === 'unverified') block.append(element('p', t('hidden.unverifiedFlag')));
    if (item.bytes !== null) block.append(element('p', t('hidden.bytes', { bytes: item.bytes })));
    if (['tag', 'variation', 'variationDistributed'].includes(item.kind) && item.text) {
      const copy = element('button', t('hidden.copy'));
      copy.type = 'button';
      copy.addEventListener('click', () => copyText(item.text));
      block.append(copy);
    }
    hidden.append(block);
  }
  const tokens = result.tokens.filter(token => token.level === 'mixed' || token.wholeScriptConfusable);
  document.getElementById('token-panel').hidden = tokens.length === 0;
  const list = document.getElementById('token-list');
  list.replaceChildren();
  for (const token of tokens) list.append(element('li', t('token.item', {
    text: token.text, comparable: token.comparable, scripts: token.scripts.map(scriptName).join(t('token.separator')),
    level: t(token.wholeScriptConfusable ? 'level.wholeScript' : 'level.mixed')
  })));
  document.getElementById('comparable-panel').hidden = result.verdict === 'clean' || !result.comparableDiffers;
  document.getElementById('comparable-text').textContent = result.comparable;
  document.getElementById('normalization-panel').hidden = !result.text;
  const forms = document.getElementById('normalization-list');
  forms.replaceChildren();
  for (const [form, info] of Object.entries(result.normalization)) {
    forms.append(element('li', t(info.same ? 'normalization.same' : 'normalization.changed', {
      form, before: result.length.codePoints, after: info.codePoints
    })));
  }
  renderTable(result);
}

function renderTable(result) {
  const all = document.getElementById('table-all').checked;
  const chars = all ? result.chars : result.chars.filter(char => char.category);
  const fragment = document.createDocumentFragment();
  for (const char of chars.slice(0, L.TABLE_LIMIT)) {
    const description = L.describeCodePoint(char.cp);
    const row = element('tr');
    const values = [char.index + 1, charLabel(char), description.codePoint,
      char.category ? t('category.' + char.category) : t('table.none'),
      char.severity === 'none' ? t('table.none') : t('severity.' + char.severity),
      [description.abbr, charName(char)].filter(Boolean).join(' / '), scriptName(description.script),
      description.generalCategory, description.utf8, description.escape];
    for (const value of values) row.append(element('td', value));
    fragment.append(row);
  }
  document.querySelector('#char-table tbody').replaceChildren(fragment);
  document.getElementById('table-limit').textContent = chars.length > L.TABLE_LIMIT ? t('table.limit') : '';
}

// --- Optional operations use snapshots, not text read back from result elements. ---
function initActions() {
  document.getElementById('prepare-removal').addEventListener('click', prepareRemoval);
  document.getElementById('copy-removal').addEventListener('click', () => {
    if (removalState?.revision === revision) copyText(removalState.preview.text);
  });
  document.getElementById('removal-candidates').addEventListener('change', event => {
    if (!removalState || removalState.revision !== revision) return;
    const index = Number(event.target.dataset.index);
    if (!removalState.plan.candidates.some(char => char.index === index)) return;
    if (event.target.checked) removalState.selected.add(index);
    else removalState.selected.delete(index);
    renderRemovalPreview();
  });
  document.getElementById('compare-input').addEventListener('input', invalidateActions);
  for (const radio of document.querySelectorAll('[name="compare-mode"]')) radio.addEventListener('change', invalidateActions);
  document.getElementById('compare-texts').addEventListener('click', () => {
    const left = interpretedInput();
    const right = interpretedComparison();
    comparisonState = left.errors.length || right.errors.length ? { status: 'incomplete' } : A.compareTexts(left.text, right.text);
    renderComparison();
  });
  document.getElementById('swap-inputs').addEventListener('click', () => {
    const input = document.getElementById('inputText');
    const other = document.getElementById('compare-input');
    [input.value, other.value] = [other.value, input.value];
    const escape = document.getElementById('mode-escape').checked;
    document.getElementById('mode-escape').checked = document.getElementById('compare-escape').checked;
    document.getElementById('mode-plain').checked = !document.getElementById('mode-escape').checked;
    document.getElementById('compare-escape').checked = escape;
    document.getElementById('compare-plain').checked = !escape;
    invalidateActions();
    renderAnalysis();
  });
}

function interpretedComparison() {
  const value = document.getElementById('compare-input').value;
  return document.getElementById('compare-escape').checked ? L.decodeEscapes(value) : { text: value, errors: [] };
}

function prepareRemoval() {
  renderAnalysis();
  const decoded = interpretedInput();
  if (decoded.errors.length || currentResult.truncated) {
    document.getElementById('removal-result').textContent = t('actions.incomplete');
    return;
  }
  const plan = A.buildRemovalPlan(currentResult);
  removalState = { revision, text: decoded.text, plan, selected: new Set(plan.defaultIndices) };
  renderRemovalCandidates();
  renderRemovalPreview();
}

function renderRemovalCandidates() {
  const container = document.getElementById('removal-candidates');
  container.replaceChildren();
  for (const char of removalState.plan.candidates) {
    const label = element('label', undefined, 'removal-choice');
    const checkbox = element('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.index = String(char.index);
    checkbox.checked = removalState.selected.has(char.index);
    label.append(checkbox, element('span', t('remove.item', {
      index: char.index + 1, codePoint: L.describeCodePoint(char.cp).codePoint, reason: t('reason.' + char.reason)
    })));
    container.append(label);
  }
  if (!container.childElementCount) container.append(element('p', t('remove.empty')));
}

function renderRemovalPreview() {
  const preview = A.removeSelected(removalState.text, removalState.selected);
  removalState.preview = preview;
  const result = L.analyze(preview.text);
  document.getElementById('removal-preview').value = preview.text;
  document.getElementById('removal-escaped').textContent = L.escapeForInput(preview.text);
  document.getElementById('removal-result').textContent = t('remove.result', {
    n: preview.removed.length, verdict: t('verdict.' + (result.text ? result.verdict : 'empty'))
  });
  document.getElementById('copy-removal').disabled = removalState.revision !== revision;
}

function renderComparison() {
  const container = document.getElementById('comparison-result');
  container.replaceChildren();
  if (comparisonState.status !== 'complete') {
    container.textContent = t('actions.incomplete');
    return;
  }
  const flags = ['exactEqual', 'nfcEqual', 'nfkcEqual', 'comparableEqual', 'japanesePairEqual'];
  const list = element('ul');
  for (const key of flags) {
    const row = element('li', t('compare.row', {
      kind: t('compare.' + key), result: t(comparisonState[key] ? 'compare.match' : 'compare.different')
    }));
    row.dataset.match = String(comparisonState[key]);
    list.append(row);
  }
  container.append(list);
  if (comparisonState.transformedEmpty) container.append(element('p', t('compare.empty')));
  const diff = comparisonState.firstDifference;
  if (!diff) return;
  for (const side of ['a', 'b']) {
    const position = diff[side];
    container.append(element('p', position ? t('compare.position', {
      side: side.toUpperCase(), ...position, codePoint: L.describeCodePoint(position.cp).codePoint
    }) : t('compare.end', { side: side.toUpperCase() })));
    container.append(element('pre', t('compare.context', {
      side: side.toUpperCase(), text: L.escapeForInput(diff[side === 'a' ? 'contextA' : 'contextB'])
    })));
  }
}

async function loadTextFile() {
  const input = document.getElementById('file-input');
  const file = input.files[0];
  if (!file) return;
  const request = ++fileRequest;
  const startedRevision = revision;
  input.value = '';
  if (file.size > A.MAX_FILE_BYTES) {
    setNotice('file-status', 'file.size');
    return;
  }
  setNotice('file-status', 'file.reading');
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (request !== fileRequest) return;
    if (startedRevision !== revision) {
      setNotice('file-status', 'file.stale');
      return;
    }
    const result = A.decodeUtf8File(bytes);
    if (!result.ok) {
      setNotice('file-status', 'file.' + result.reason);
      return;
    }
    setSampleText(result.text);
    setNotice('file-status', 'file.success', {
      name: L.escapeForInput(file.name), bytes: result.bytes, codePoints: result.codePoints
    });
  } catch {
    if (request === fileRequest) setNotice('file-status', startedRevision === revision ? 'file.failure' : 'file.stale');
  }
}
