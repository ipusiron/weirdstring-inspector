// --- ダークモード切替機能 ---
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
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
  const params = new URLSearchParams(window.location.search);
  const text = params.get('text');
  const source = params.get('source');
  const attackType = params.get('attack_type');
  
  if (text) {
    try {
      // URLデコード
      const decodedText = decodeURIComponent(text);
      
      // 入力欄にセット
      const input = document.getElementById('inputText');
      if (input) {
        input.value = decodedText;
        // 自動解析実行
        analyzeInput();
      }
      
      // ClipThreat Studioからの呼び出しの場合、表示を追加
      if (source === 'clipthreat-studio') {
        showExternalSourceInfo(source, attackType);
      }
    } catch (error) {
      console.error('URL parameter decode error:', error);
    }
  }
}

// --- 外部ツール連携表示 ---
function showExternalSourceInfo(source, attackType) {
  const resultArea = document.getElementById('resultArea');
  if (resultArea && source === 'clipthreat-studio') {
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
      background-color: var(--highlight-punctuation);
      border: 1px solid var(--box-border);
      border-radius: 5px;
      padding: 0.8em;
      margin-bottom: 1em;
      font-size: 0.9em;
    `;
    
    let infoText = '🔗 ClipThreat Studio から解析対象が渡されました';
    if (attackType) {
      infoText += `（攻撃タイプ: ${attackType}）`;
    }
    
    infoDiv.textContent = infoText;
    resultArea.parentNode.insertBefore(infoDiv, resultArea);
  }
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
  
  // URLパラメータ処理
  parseUrlParameters();
  
  // サンプルカテゴリ初期化
  switchSampleCategory('invisible');
});

// --- 異常文字コードポイント定義 ---

const invisibleCodePoints = new Set([
  0x00a0, // ← ノンブレークスペースを追加
  0x200b,
  0x200c,
  0x200d,
  0x2060,
  0xfeff,
]);

const lookalikeCodePoints = new Set([
  // キリル文字
  0x0430, 0x0435, 0x043e, 0x0440, 0x0441, 0x0455, 0x0491,
  // ギリシャ文字
  0x03b1, 0x03bf, 0x03c1, 0x03c3, 0x03c5, 0x03c7, 0x03d5,
  // フル幅ラテン
  0xff41, 0xff4c, 0xff4f,
]);

// 数学用アルファベット U+1D400〜U+1D7FF を追加
function addRangeToSet(set, start, end) {
  for (let i = start; i <= end; i++) {
    set.add(i);
  }
}
addRangeToSet(lookalikeCodePoints, 0x1d400, 0x1d7ff);

const controlCodePoints = new Set([
  ...Array.from({ length: 32 }, (_, i) => i),
  0x007f,
  0x202e,
]);

const zalgoCodePoints = new Set([
  ...rangeSet(0x0300, 0x036f),
  ...rangeSet(0x0483, 0x0489),
  ...rangeSet(0x0591, 0x05bd),
  0x05bf,
  ...rangeSet(0x05c1, 0x05c2),
]);

function rangeSet(start, end) {
  const set = [];
  for (let i = start; i <= end; i++) {
    set.push(i);
  }
  return set;
}

const bidirectionalCodePoints = new Set([
  0x202a,
  0x202b,
  0x202c,
  0x202d,
  0x202e, // LRE～RLO、PDF
  0x2066,
  0x2067,
  0x2068,
  0x2069, // LRI～PDI
]);

const punctuationCodePoints = new Set([
  0xff0e, // 全角ピリオド
  0xff02, // 全角ダブルクォート
  0x201e,
  0x201c, // ダブルクォート風記号
  0x02d9, // 上付き点（見た目はドット）
]);

const emojiCodePoints = new Set([
  0x200d, // ゼロ幅結合子
]);

const whitespaceCodePoints = new Set([
  0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008,
  0x2009, 0x200a, 0x205f,
]);

const confusedCodePoints = new Set([
  0x0627,
  0x0631, // アラビア文字：ا،ر
  0x0905, // デーヴァナーガリー：अ
  0x3042,
  0x30a2, // ひらがな/カタカナ：あ、ア
]);

// --- カテゴリ設定 ---
const categories = {
  invisible: {
    label: 'Invisible（見えない文字）',
    color: '#ff8888',
    codePoints: invisibleCodePoints,
  },
  lookalike: {
    label: 'Look-alike（そっくり文字）',
    color: '#88bbff',
    codePoints: lookalikeCodePoints,
  },
  control: {
    label: 'Control（制御文字）',
    color: '#ffaa00',
    codePoints: controlCodePoints,
  },
  zalgo: {
    label: 'Zalgo（結合記号）',
    color: '#cc88ff',
    codePoints: zalgoCodePoints,
  },
  bidirectional: {
    label: 'Bidirectional（双方向制御）',
    color: '#ffddee',
    codePoints: bidirectionalCodePoints,
  },
  punctuation: {
    label: 'Punctuation（紛らわしい記号）',
    color: '#e6ffe6',
    codePoints: punctuationCodePoints,
  },
  emoji: {
    label: 'Emoji ZWJ',
    color: '#fff0cc',
    codePoints: emojiCodePoints,
  },
  whitespace: {
    label: 'Whitespace（空白偽装）',
    color: '#ddeeff',
    codePoints: whitespaceCodePoints,
  },
  confused: {
    label: 'Confused Scripts',
    color: '#f0e6ff',
    codePoints: confusedCodePoints,
  },
};

// --- サンプル切替 ---
function switchSampleCategory(category) {
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach((btn) => btn.classList.remove('active'));
  const activeTab = Array.from(tabs).find((btn) =>
    btn.textContent.toLowerCase().includes(category)
  );
  if (activeTab) activeTab.classList.add('active');

  const area = document.getElementById('sampleListArea');
  area.innerHTML = '';

  const samples = sampleData[category] || [];
  samples.forEach((sample) => {
    const box = document.createElement('div');
    box.className = 'sample-box';
    box.innerHTML = `
      <p><strong>${sample.name}</strong></p>
      <p>${sample.description}</p>
      <button onclick="setSampleText(\`${sample.text}\`)">この文字列をセット</button>
      <hr>
    `;
    area.appendChild(box);
  });
}

// --- サンプル適用 ---
function setSampleText(text) {
  const input = document.getElementById('inputText');
  input.value = text;
  analyzeInput();
}

// --- HTMLエスケープ関数（XSS対策） ---
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- メイン解析ロジック ---
function analyzeInput() {
  const input = document.getElementById('inputText').value;
  debugCharCodes(input);

  const result = document.getElementById('resultArea');
  const summary = document.getElementById('summaryList');
  result.innerHTML = '';
  summary.innerHTML = '';

  const counts = {
    invisible: 0,
    lookalike: 0,
    control: 0,
    zalgo: 0,
  };

  const chars = [...input];
  const highlighted = chars.map((ch) => {
    const code = ch.codePointAt(0);
    for (let key in categories) {
      if (categories[key].codePoints.has(code)) {
        counts[key]++;
        return `<span class="highlight ${key}" title="U+${code
          .toString(16)
          .toUpperCase()
          .padStart(4, '0')}">${escapeHtml(ch)}</span>`;
      }
    }
    return escapeHtml(ch);
  });

  result.innerHTML = highlighted.join('');

  for (let key in categories) {
    if (counts[key] > 0) {
      const li = document.createElement('li');
      li.textContent = `${categories[key].label}：${counts[key]} 件`;
      summary.appendChild(li);
    }
  }

  if (Object.values(counts).every((v) => v === 0)) {
    const li = document.createElement('li');
    li.textContent = '異常文字は検出されませんでした。';
    summary.appendChild(li);
  }
}


// --- デバッグ表示 ---
function debugCharCodes(str) {
  console.log(
    [...str]
      .map((c) => `${c} (U+${c.codePointAt(0).toString(16).toUpperCase()})`)
      .join(', ')
  );
}
