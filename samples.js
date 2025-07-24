const sampleData = {
  invisible: [
    {
      name: 'ゼロ幅スペース入り flag.txt',
      text: 'f\u200Bl\u200Ba\u200Bg.txt',
      description:
        'ゼロ幅スペース（U+200B）が文字間に紛れています。見た目は同じでもバイト列が異なります。',
    },
    {
      name: 'ノンブレークスペース付き',
      text: 'flag\u00A0.txt',
      description:
        'ノンブレークスペース（U+00A0）がスペースのように見えますが、異なる文字です。',
    },
    {
      name: 'ゼロ幅ノンジョイナー使用',
      text: 'a\u200Cb',
      description:
        'U+200C（ゼロ幅ノンジョイナー）が含まれています。表示に影響はありませんが、内部的には異なる文字列です。',
    },
    {
      name: 'ゼロ幅結合子使用',
      text: 'A\u200D💀',
      description:
        'U+200D（ゼロ幅結合子）により絵文字と文字が結合されています。',
    },
  ],
  lookalike: [
    {
      name: 'キリルの l と a を含む flag.txt',
      text: 'f\u043B\u0430g.txt',
      description:
        '`l`と`a`がキリル文字（U+043B, U+0430）です。見た目は同じでも別の文字です。',
    },
    {
      name: 'Greek Alpha を使った alpha',
      text: '\u03B1lpha',
      description: '`α`（Greek small letter alpha）と `a` は別文字です。',
    },
    {
      name: '数学用アルファベット A',
      text: '\u{1D400}',
      description:
        '数学用太字ラテン大文字A（U+1D400）です。見た目は普通のAに似ています。',
    },
    {
      name: 'フル幅文字列',
      text: 'ｆｌａｇ．ｔｘｔ',
      description:
        '全角文字（U+FFxx）で構成されています。パースの挙動が異なることがあります。',
    },
  ],
  control: [
    {
      name: 'RLOで偽装された拡張子',
      text: 'abc\u202Etxt.galf',
      description:
        'RLO（U+202E）により、拡張子が右から読まれるように見えます。',
    },
    {
      name: 'タブ文字を含む',
      text: 'f\tlag.txt',
      description:
        'U+0009（水平タブ）が含まれています。表示幅や位置がずれる原因になります。',
    },
    {
      name: 'キャリッジリターン',
      text: 'flag\r.txt',
      description:
        'U+000D（CR）が途中に含まれています。OSやアプリによって表示が異なります。',
    },
    {
      name: '警告ベル文字を含む',
      text: 'f\u0007lag.txt',
      description: 'U+0007（BEL）。一部の端末でビープ音が鳴ることがあります。',
    },
  ],
  zalgo: [
    {
      name: '軽めのZalgo文字',
      text: 'f͟l͜a͞g͡.txt',
      description: '合成用記号が少数加えられたZalgo風文字列です。',
    },
    {
      name: '重Zalgo構成',
      text: 'f̵̢̛͞͡l̷̷̴̨͜a̴͞͏̛g̡͡.txt',
      description:
        '複数の合成ダイアクリティカルマークが積み重ねられています。視認性が極端に低下します。',
    },
    {
      name: '垂直方向のZalgo崩壊例',
      text: 'f̍̑̄͘l̒͌̈́a͗͆͒g̿̎̍',
      description: '上下に伸びる装飾記号により文字列が視覚的に崩壊しています。',
    },
  ],
  bidirectional: [
    {
      name: 'LRI + PDI による順序制御',
      text: 'A\u2066B\u2069C',
      description:
        'U+2066（LRI）と U+2069（PDI）によって、表示順が一時的に変更されます。',
    },
    {
      name: 'PDF を含む文字列',
      text: 'abc\u202Cdef',
      description:
        'U+202C（PDF：Pop Directional Formatting）によって方向制御が終了する例です。',
    },
  ],
  punctuation: [
    {
      name: '偽ドット（全角ピリオド）を含むURL',
      text: 'example\uFF0Ecom',
      description:
        'U+FF0E は全角のピリオドで、ドメイン名に見せかける偽装に使われます。',
    },
    {
      name: '偽クォート（全角ダブルクォート）',
      text: '\uFF02secret\uFF02',
      description: 'U+FF02 は見た目はクォートですが、全角の別文字です。',
    },
  ],
  emoji: [
    {
      name: '👨‍💻（開発者）に使われる ZWJ',
      text: '\uD83D\uDC68\u200D\uD83D\uDCBB',
      description:
        'U+200D（ゼロ幅結合子）で2つの絵文字を結合し、1つの絵文字 👨‍💻 に見せています。',
    },
  ],
  whitespace: [
    {
      name: 'Hair Space を含む flag.txt',
      text: 'f\u200Ala\u200Ag.txt',
      description:
        'U+200A（Hair Space）は非常に細い空白で、通常の表示では認識困難です。',
    },
  ],
  confused: [
    {
      name: 'アラビア文字を紛れ込ませた flag.txt',
      text: 'f\u0631\u0627g.txt',
      description:
        '`ر` と `ا` はアラビア文字で、`l` と `a` の代わりに使われています。',
    },
  ],
  normal: [
    {
      name: '正常なflag.txt',
      text: 'flag.txt',
      description: '異常なUnicode文字は含まれていません。',
    },
    {
      name: '正常なflag.txt（JavaScriptにおけるUnicodeコードを利用）',
      text: 'f\u006C\u0061\u0067.txt', // 明示的にASCIIを指定してもよい
      description: '異常なUnicode文字は含まれていません。',
    },
  ],
};
