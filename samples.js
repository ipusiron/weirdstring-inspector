const sampleData = {
  tag: [
    {
      name: "タグ文字で分断したキーワード",
      text: "fun\u{E0020}ding",
      description: "「funding」の途中にタグ文字のスペース（U+E0020）が入っています。画面には出ませんが、キーワードの一致検索をすり抜けます。2026年にフィッシングメールで大量に使われた手口です。",
    },
    {
      name: "タグ文字に隠した文",
      text: "Thanks!\u{E0073}" +
        "\u{E0065}\u{E0063}\u{E0072}\u{E0065}\u{E0074}\u{E0020}\u{E006D}\u{E0065}" +
        "\u{E0073}\u{E0073}\u{E0061}\u{E0067}\u{E0065}",
      description: "見えるのは「Thanks!」だけですが、うしろにタグ文字で「secret message」が続いています。AIへの指示を隠すASCII Smugglingと同じ仕組みです。",
    },
    {
      name: "絵文字の旗（正常な使い方）",
      text: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
      description: "イングランドの旗の絵文字です。黒い旗（U+1F3F4）に、地域を表すタグ文字と終端（U+E007F）が続きます。タグ文字の正規の用途なので「情報」として扱います。",
    },
  ],
  bidi: [
    {
      name: "RLOで偽装された拡張子",
      text: "abc\u{202E}txt." +
        "galf",
      description: "RLO（U+202E）より後ろが右から左へ描かれるので、画面では「abcflag.txt」に見えます。実際の末尾は「.galf」です。",
    },
    {
      name: "実行ファイルを画像に見せる",
      text: "evil\u{202E}gnp" +
        ".exe",
      description: "画面では「evilexe.png」に見えますが、実際の拡張子は「.exe」です。",
    },
    {
      name: "Trojan Source型のコメント",
      text: "/*\u{202E} } \u{2066}i" +
        "f (isAdm" +
        "in)\u{2069} \u{2066} b" +
        "egin adm" +
        "ins only" +
        " */",
      description: "コメントの中の双方向制御文字で、コードの見た目の順序を入れ替えます（CVE-2021-42574）。行末までに閉じていない制御文字が2個あります。",
    },
    {
      name: "LRI＋PDI（閉じている）",
      text: "A\u{2066}B\u{2069}C",
      description: "LRI（U+2066）で始めてPDI（U+2069）で閉じています。対応は取れていますが、普通の文には現れない文字です。",
    },
    {
      name: "LRMとRLM",
      text: "a\u{200E}b\u{200F}c",
      description: "方向を示す目印の文字です。表示はされません。アラビア語やヘブライ語の文では正規に使われます。",
    },
  ],
  variation: [
    {
      name: "絵文字に隠したバイト列",
      text: "\u{1F600}\u{E0158}\u{E0159}",
      description: "絵文字のうしろに異体字セレクターが2個続いています。1個が1バイトを表し、つなげると「hi」になります。",
    },
    {
      name: "絵文字の表示指定（正常）",
      text: "\u{2600}\u{FE0F}",
      description: "VS16（U+FE0F）は「絵文字の見た目で表示する」という指定です。1個だけなら正規の使い方です。",
    },
    {
      name: "漢字の異体字（正常）",
      text: "\u{845B}\u{E0100}",
      description: "「葛」のうしろのVS17（U+E0100）は、字形を選ぶための指定です（IVS）。人名や地名で使われます。",
    },
  ],
  invisible: [
    {
      name: "ゼロ幅スペース入りのflag.txt",
      text: "f\u{200B}l\u{200B}a\u{200B}g." +
        "txt",
      description: "ゼロ幅スペース（U+200B）が3個入っています。見た目は「flag.txt」と同じですが、文字列としては一致しません。",
    },
    {
      name: "ソフトハイフンで分断",
      text: "pass\u{00AD}wor" +
        "d",
      description: "ソフトハイフン（U+00AD）は、行の折り返し位置でだけ表示されます。ふだんは見えません。",
    },
    {
      name: "絵文字をつなぐZWJ（正常）",
      text: "\u{1F468}\u{200D}\u{1F4BB}",
      description: "2つの絵文字をZWJ（U+200D）でつないで、1つの絵文字に見せています。正規の使い方です。",
    },
    {
      name: "先頭のBOM",
      text: "\u{FEFF}hello",
      description: "ファイルの先頭に付くBOM（U+FEFF）です。先頭にある場合は「情報」、途中にある場合は「注意」として扱います。",
    },
    {
      name: "空に見える文字",
      text: "\u{3164}",
      description: "ハングルフィラー（U+3164）は文字として扱われますが、何も表示されません。空の名前に見せる用途で使われます。",
    },
  ],
  control: [
    {
      name: "ベル文字",
      text: "f\u{0007}lag.tx" +
        "t",
      description: "BEL（U+0007）です。表示はされませんが、端末によっては音が鳴ります。",
    },
    {
      name: "単独のCR",
      text: "flag\r.tx" +
        "t",
      description: "LFを伴わないCR（U+000D）です。端末やログの表示では、行の先頭へ戻って上書きされることがあります。入力欄はCRを保持できないので、エスケープ表記で読み込みます。",
    },
    {
      name: "端末のエスケープシーケンス",
      text: "\u{001B}[31mERR" +
        "OR\u{001B}[0m",
      description: "ESC（U+001B）で始まる色指定です。ログやファイル名に入っていると、端末の表示を書き換えられます。",
    },
  ],
  whitespace: [
    {
      name: "ノーブレークスペース",
      text: "flag\u{00A0}.tx" +
        "t",
      description: "NBSP（U+00A0）は普通のスペースに見えますが、別の文字です。",
    },
    {
      name: "ヘアスペース",
      text: "f\u{200A}la\u{200A}g.t" +
        "xt",
      description: "ヘアスペース（U+200A）はごく細い空白で、ほとんど見分けられません。",
    },
    {
      name: "コードに紛れた全角スペース",
      text: "if (x)\u{3000}r" +
        "eturn;",
      description: "全角スペース（U+3000）です。日本語の文では普通に使いますが、コードや設定ファイルに紛れるとエラーの原因になります。",
    },
    {
      name: "タブ文字",
      text: "f\tlag.tx" +
        "t",
      description: "タブ（U+0009）です。広く使われる文字なので「情報」として扱います。",
    },
  ],
  private: [
    {
      name: "私用領域の文字",
      text: "key=\u{E000}\u{E001}\u{E002}",
      description: "私用領域（U+E000〜）の文字は、フォントがなければ表示されません。エディターで見えないコードを隠す手口に使われました。",
    },
  ],
  combining: [
    {
      name: "積み重ねた結合記号（Zalgo）",
      text: "Z\u{0335}\u{0322}\u{031B}\u{035E}\u{0361}\u{0337}a" +
        "lgo",
      description: "1文字に結合記号が6個付いています。UTS #39は、5個以上の連続を不審なものとして扱うよう勧めています。",
    },
    {
      name: "同じ結合記号の連続",
      text: "a\u{0301}\u{0301}",
      description: "同じ結合記号（U+0301）が2回続いています。正規の文では起きない並びです。",
    },
    {
      name: "分解形（NFD）のアクセントつきe",
      text: "cafe\u{0301}",
      description: "「e」と結合記号（U+0301）の2文字で、アクセントつきのeを表しています。NFCに正規化すると1文字（U+00E9）になります。",
    },
    {
      name: "分解形（NFD）の「が」",
      text: "\u{304B}\u{3099}",
      description: "「か」と濁点（U+3099）の2文字です。macOSで作ったファイル名によく現れます。見た目は同じでも「が」（U+304C）とは一致しません。",
    },
  ],
  compat: [
    {
      name: "全角の英数字",
      text: "\u{FF46}\u{FF4C}\u{FF41}\u{FF47}\u{FF0E}\u{FF54}\u{FF58}\u{FF54}",
      description: "全角で書いた「flag.txt」です。NFKCに正規化すると半角になります。日本語の文では普通の表記なので「情報」として扱います。",
    },
    {
      name: "数学用の英字",
      text: "\u{1D429}\u{1D41A}\u{1D432}",
      description: "数学用の太字（U+1D400〜）で書いた「pay」です。NFKCに正規化すると普通の英字になります。キーワードの検出をすり抜ける目的で使われます。",
    },
  ],
  lookalike: [
    {
      name: "キリル文字だけで書いたapple",
      text: "\u{0430}\u{0440}\u{0440}\u{04CF}\u{0435}.co" +
        "m",
      description: "5文字すべてがキリル文字です。1つのスクリプトだけなので「混在」にはなりませんが、全体がASCIIの「apple」に見えます。",
    },
    {
      name: "キリル文字を混ぜたgoogle",
      text: "g\u{043E}\u{043E}gle.c" +
        "om",
      description: "2つの「o」がキリル文字（U+043E）です。1つの語にラテン文字とキリル文字が混ざっています。",
    },
    {
      name: "ギリシャ文字のアルファで始まるalpha",
      text: "\u{03B1}lpha",
      description: "先頭の1文字がギリシャ文字のアルファ（U+03B1）です。ラテン文字の語にギリシャ文字が混ざっています。",
    },
    {
      name: "アラビア文字を紛れ込ませたflag.txt",
      text: "f\u{0631}\u{0627}g.txt",
      description: "U+0627は「l」に見える文字として公式データに載っています。U+0631は載っていませんが、ラテン文字の語に混ざっているので検出します。",
    },
    {
      name: "全角ピリオドのドメイン",
      text: "example\u{FF0E}" +
        "com",
      description: "全角ピリオド（U+FF0E）です。ブラウザーはドメイン名の中の全角ピリオドを「.」として扱います（UTS #46）。",
    },
    {
      name: "句点のドメイン",
      text: "example\u{3002}" +
        "com",
      description: "日本語の句点（U+3002）です。ブラウザーはこれも「.」として扱います（UTS #46）。",
    },
    {
      name: "スラッシュに見える「ノ」",
      text: "example." +
        "com\u{30CE}logi" +
        "n",
      description: "カタカナの「ノ」（U+30CE）です。英数字にはさまれると「/」に見えます。",
    },
    {
      name: "分数用のスラッシュ",
      text: "example." +
        "com\u{2044}logi" +
        "n",
      description: "U+2044は「/」に見えますが、URLの区切りの「/」とは別の文字です。ドメイン名の一部として扱われることがあります。",
    },
  ],
  normal: [
    {
      name: "正常なflag.txt",
      text: "flag.txt",
      description: "ASCIIだけの文字列です。",
    },
    {
      name: "日本語の文",
      text: "\u{3053}\u{3093}\u{306B}\u{3061}\u{306F}\u{3002}\u{30D5}\u{30A1}" +
        "\u{30A4}\u{30EB}\u{540D}\u{306F}flag" +
        ".txt\u{3067}\u{3059}\u{FF01}",
      description: "「こんにちは。ファイル名はflag.txtです！」という普通の文です。句点や全角の感嘆符は検出しません。",
    },
    {
      name: "ロシア語の文",
      text: "\u{041F}\u{0440}\u{0438}\u{0432}\u{0435}\u{0442}, " +
        "\u{043C}\u{0438}\u{0440}",
      description: "ロシア語のあいさつ（「こんにちは、世界」）です。ASCIIに見える文字（U+0440・U+0435）を含みますが、語の全体がキリル文字なので「情報」に留めます。",
    },
  ],
};

if (typeof module === "object" && module.exports) {
  module.exports = sampleData;
}
