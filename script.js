const sampleData = {
  invisible: [
    {
      name: "ゼロ幅スペース入り flag.txt",
      text: "f\u200Bl\u200Ba\u200Bg.txt",
      description: "ゼロ幅スペース（U+200B）が文字間に紛れています。見た目は同じでもバイト列が異なります。"
    },
    {
      name: "ノンブレークスペース付き",
      text: "flag\u00A0.txt",
      description: "ノンブレークスペース（U+00A0）がスペースのように見えますが、異なる文字です。"
    },
    {
      name: "ゼロ幅ノンジョイナー使用",
      text: "a\u200Cb",
      description: "U+200C（ゼロ幅ノンジョイナー）が含まれています。表示に影響はありませんが、内部的には異なる文字列です。"
    },
    {
      name: "ゼロ幅結合子使用",
      text: "A\u200D💀",
      description: "U+200D（ゼロ幅結合子）により絵文字と文字が結合されています。"
    }
  ],
  lookalike: [
    {
      name: "キリルの l と a を含む flag.txt",
      text: "f\u043B\u0430g.txt",
      description: "`l`と`a`がキリル文字（U+043B, U+0430）です。見た目は同じでも別の文字です。"
    },
    {
      name: "Greek Alpha を使った alpha",
      text: "\u03B1lpha",
      description: "`α`（Greek small letter alpha）と `a` は別文字です。"
    },
    {
      name: "数学用アルファベット A",
      text: "\u{1D400}",
      description: "数学用太字ラテン大文字A（U+1D400）です。見た目は普通のAに似ています。"
    },
    {
      name: "フル幅文字列",
      text: "ｆｌａｇ．ｔｘｔ",
      description: "全角文字（U+FFxx）で構成されています。パースの挙動が異なることがあります。"
    }
  ],
  control: [
    {
      name: "RLOで偽装された拡張子",
      text: "abc\u202Etxt.galf",
      description: "RLO（U+202E）により、拡張子が右から読まれるように見えます。"
    },
    {
      name: "タブ文字を含む",
      text: "f\tlag.txt",
      description: "U+0009（水平タブ）が含まれています。表示幅や位置がずれる原因になります。"
    },
    {
      name: "キャリッジリターン",
      text: "flag\r.txt",
      description: "U+000D（CR）が途中に含まれています。OSやアプリによって表示が異なります。"
    },
    {
      name: "警告ベル文字を含む",
      text: "f\u0007lag.txt",
      description: "U+0007（BEL）。一部の端末でビープ音が鳴ることがあります。"
    }
  ],
  zalgo: [
    {
      name: "軽めのZalgo文字",
      text: "f͟l͜a͞g͡.txt",
      description: "合成用記号が少数加えられたZalgo風文字列です。"
    },
    {
      name: "重Zalgo構成",
      text: "f̵̢̛͞͡l̷̷̴̨͜a̴͞͏̛g̡͡.txt",
      description: "複数の合成ダイアクリティカルマークが積み重ねられています。視認性が極端に低下します。"
    },
    {
      name: "垂直方向のZalgo崩壊例",
      text: "f̍̑̄͘l̒͌̈́a͗͆͒g̿̎̍",
      description: "上下に伸びる装飾記号により文字列が視覚的に崩壊しています。"
    }
  ],
  normal: [
    {
      name: "正常なflag.txt",
      text: "flag.txt",
      description: "異常なUnicode文字は含まれていません。"
    },
	{
    name: "正常なflag.txt（JavaScriptにおけるUnicodeコードを利用）",
    text: "f\u006C\u0061\u0067.txt", // 明示的にASCIIを指定してもよい
    description: "異常なUnicode文字は含まれていません。"
  	}
  ]
};


// --- 異常文字コードポイント定義 ---

const invisibleCodePoints = new Set([
  0x00A0, // ← ノンブレークスペースを追加
  0x200B, 0x200C, 0x200D,
  0x2060,
  0xFEFF
]);

const lookalikeCodePoints = new Set([
  // キリル文字
  0x0430, 0x0435, 0x043E, 0x0440, 0x0441, 0x0455, 0x0491,
  // ギリシャ文字
  0x03B1, 0x03BF, 0x03C1, 0x03C3, 0x03C5, 0x03C7, 0x03D5,
  // フル幅ラテン
  0xFF41, 0xFF4C, 0xFF4F
]);

// 数学用アルファベット U+1D400〜U+1D7FF を追加
function addRangeToSet(set, start, end) {
  for (let i = start; i <= end; i++) {
    set.add(i);
  }
}
addRangeToSet(lookalikeCodePoints, 0x1D400, 0x1D7FF);

const controlCodePoints = new Set([
  ...Array.from({ length: 32 }, (_, i) => i),
  0x007F,
  0x202E
]);

const zalgoCodePoints = new Set([
  ...rangeSet(0x0300, 0x036F),
  ...rangeSet(0x0483, 0x0489),
  ...rangeSet(0x0591, 0x05BD),
  0x05BF,
  ...rangeSet(0x05C1, 0x05C2)
]);

function rangeSet(start, end) {
  const set = [];
  for (let i = start; i <= end; i++) {
    set.push(i);
  }
  return set;
}

// --- カテゴリ設定 ---
const categories = {
  invisible: {
    label: 'Invisible（見えない文字）',
    color: '#ff8888',
    codePoints: invisibleCodePoints
  },
  lookalike: {
    label: 'Look-alike（そっくり文字）',
    color: '#88bbff',
    codePoints: lookalikeCodePoints
  },
  control: {
    label: 'Control（制御文字）',
    color: '#ffaa00',
    codePoints: controlCodePoints
  },
  zalgo: {
    label: 'Zalgo（結合記号）',
    color: '#cc88ff',
    codePoints: zalgoCodePoints
  }
};

// --- サンプル切替 ---
function switchSampleCategory(category) {
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach(btn => btn.classList.remove('active'));
  const activeTab = Array.from(tabs).find(btn => btn.textContent.toLowerCase().includes(category));
  if (activeTab) activeTab.classList.add('active');

  const area = document.getElementById('sampleListArea');
  area.innerHTML = '';

  const samples = sampleData[category] || [];
  samples.forEach(sample => {
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
    zalgo: 0
  };

  const chars = [...input];
  const highlighted = chars.map(ch => {
    const code = ch.codePointAt(0);
    for (let key in categories) {
      if (categories[key].codePoints.has(code)) {
        counts[key]++;
        return `<span class="highlight ${key}" title="U+${code.toString(16).toUpperCase().padStart(4, '0')}">${ch}</span>`;
      }
    }
    return ch;
  });

  result.innerHTML = highlighted.join('');

  for (let key in categories) {
    if (counts[key] > 0) {
      const li = document.createElement('li');
      li.textContent = `${categories[key].label}：${counts[key]} 件`;
      summary.appendChild(li);
    }
  }

  if (Object.values(counts).every(v => v === 0)) {
    const li = document.createElement('li');
    li.textContent = '異常文字は検出されませんでした。';
    summary.appendChild(li);
  }
}

// --- 初期化 ---
document.addEventListener('DOMContentLoaded', () => {
  switchSampleCategory('invisible');
});

// --- デバッグ表示 ---
function debugCharCodes(str) {
  console.log([...str].map(c => `${c} (U+${c.codePointAt(0).toString(16).toUpperCase()})`).join(', '));
}
