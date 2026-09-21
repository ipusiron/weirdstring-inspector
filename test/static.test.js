const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../weirdstring-messages.js');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const expected = {
  "verdict.danger": "危険：見た目と中身が食い違う文字、または隠された内容があります",
  "verdict.caution": "注意：気づきにくい文字が含まれています",
  "verdict.info": "参考：特殊な文字がありますが、普通の使い方の範囲です",
  "verdict.clean": "気になる文字は見つかりませんでした",
  "verdict.empty": "文字列を入力すると、ここに判定が出ます",
  "reason.tagRun": "タグ文字（U+E0000〜E007F）です。画面には表示されませんが、ASCIIの文字に1対1で対応するので、文を隠せます。",
  "reason.emojiFlag": "絵文字の旗を作るためのタグ文字です。黒い旗（U+1F3F4）に続き、終端（U+E007F）で閉じているので、正規の使い方です。",
  "reason.bidiFormat": "文字の並ぶ向きを変える制御文字です。見た目の順序と実際の順序が食い違います。",
  "reason.bidiMark": "向きを示す目印の文字です。表示されません。アラビア語やヘブライ語の文では正規に使われます。",
  "reason.variationRun": "異体字セレクターが2個以上続いています。正規の文では起きない並びで、1個を1バイトとしてデータを隠す手口に使われます。",
  "reason.variationSingle": "直前の文字の字形を選ぶ指定です。絵文字の表示指定や漢字の異体字では正規に使われます。",
  "reason.emojiZwj": "絵文字どうしをつなぐZWJです。正規の使い方です。",
  "reason.scriptJoiner": "アラビア文字やインド系の文字の中で、字形のつながりを制御しています。正規の使い方です。",
  "reason.leadingBom": "先頭のBOMです。ファイルの先頭に付く目印で害はありませんが、文字列の比較では1文字として数えられます。",
  "reason.splitsAsciiWord": "ASCIIの英数字の間に入っています。見た目を変えずに語を分断するので、キーワードの検索や一致の判定をすり抜けます。",
  "reason.invisible": "表示されない文字です。見た目が同じでも、文字列としては一致しなくなります。",
  "reason.control": "制御文字です。表示されませんが、端末やログの表示に影響することがあります。",
  "reason.loneCr": "LFを伴わないCRです。端末やログでは、行の先頭へ戻って上書きされることがあります。",
  "reason.tab": "タブです。広く使われる文字です。",
  "reason.lineSeparator": "行区切り（U+2028）または段落区切り（U+2029）です。普通の改行とは別の文字で、プログラムによって扱いが分かれます。",
  "reason.specialSpace": "普通のスペース（U+0020）とは別の空白です。見分けにくく、比較や分割の処理で食い違いが起きます。",
  "reason.surrogate": "対になっていないサロゲートです。UTF-16として不正な並びで、UTF-8へ正しく変換できません。",
  "reason.nonchar": "非文字（noncharacter）です。文字が割り当てられることのないコードポイントです。",
  "reason.pua": "私用領域の文字です。フォントがなければ表示されません。エディターで見えないコードを隠す手口に使われました。",
  "reason.markRunOver4": "結合記号が5個以上続いています。UTS #39は、4個を超える連続を受け付けないよう勧めています。",
  "reason.sameMarkRepeated": "同じ結合記号が続いています。UTS #39は、同じ結合記号の連続を受け付けないよう勧めています。",
  "reason.combining": "直前の文字に重なる結合記号です。分解形（NFD）の文では普通に現れます。",
  "reason.fullwidth": "全角の英数字です。NFKCに正規化すると半角になります。日本語の文では普通の表記です。",
  "reason.compat": "互換文字です。NFKCに正規化するとASCIIの「{ascii}」になります。キーワードの検出をすり抜ける目的で使われます。",
  "reason.lookalike": "ASCIIの「{ascii}」に見える文字です（Unicode公式のconfusables.txtによる）。",
  "reason.lookalikeInAsciiWord": "ASCIIの英字の語の中にあり、「{ascii}」に見えます。",
  "reason.lookalikeInMixedToken": "1つの語に複数のスクリプトが混ざっており、この文字は「{ascii}」に見えます。なりすましの典型です。",
  "reason.wholeScriptConfusable": "語の全体が1つのスクリプトですが、すべての文字がASCIIに見えます。この文字は「{ascii}」に見えます。",
  "reason.minorityScript": "1つの語の中で、ほかと違うスクリプトの文字です。",
  "reason.urlDelimiterLookalike": "英数字にはさまれて、URLの区切りの「{ascii}」に見えます。",
  "severity.danger": "危険",
  "severity.caution": "注意",
  "severity.info": "情報",
  "summary.item": "{category}：{count}件（{breakdown}）",
  "summary.part": "{severity}{count}",
  "summary.separator": "・",
  "category.tag": "タグ文字",
  "category.bidi": "双方向制御",
  "category.variation": "異体字セレクター",
  "category.invisible": "不可視文字",
  "category.control": "制御文字",
  "category.whitespace": "特殊な空白",
  "category.private": "私用領域・非文字",
  "category.zalgo": "積み重ねた結合記号",
  "category.combining": "結合記号",
  "category.compat": "互換文字",
  "category.lookalike": "そっくり文字",
  "category.mixed": "スクリプトの混在",
  "charName.0000": "ヌル",
  "charName.0007": "ベル",
  "charName.0008": "バックスペース",
  "charName.0009": "水平タブ",
  "charName.000A": "改行（LF）",
  "charName.000D": "復帰（CR）",
  "charName.001B": "エスケープ",
  "charName.007F": "削除",
  "charName.0085": "次の行",
  "charName.00A0": "ノーブレークスペース",
  "charName.00AD": "ソフトハイフン",
  "charName.034F": "結合書記素結合子",
  "charName.061C": "アラビア文字マーク",
  "charName.115F": "ハングル初声フィラー",
  "charName.1160": "ハングル中声フィラー",
  "charName.180E": "モンゴル語母音区切り",
  "charName.2002": "enスペース",
  "charName.2003": "emスペース",
  "charName.2009": "シンスペース",
  "charName.200A": "ヘアスペース",
  "charName.200B": "ゼロ幅スペース",
  "charName.200C": "ゼロ幅非接合子",
  "charName.200D": "ゼロ幅接合子",
  "charName.200E": "左から右へのマーク",
  "charName.200F": "右から左へのマーク",
  "charName.2028": "行区切り",
  "charName.2029": "段落区切り",
  "charName.202A": "左から右への埋め込み",
  "charName.202B": "右から左への埋め込み",
  "charName.202C": "方向指定の終了",
  "charName.202D": "左から右への上書き",
  "charName.202E": "右から左への上書き",
  "charName.202F": "狭いノーブレークスペース",
  "charName.205F": "数学用の中間スペース",
  "charName.2060": "単語結合子",
  "charName.2061": "関数適用",
  "charName.2062": "不可視の乗算記号",
  "charName.2063": "不可視の区切り",
  "charName.2064": "不可視の加算記号",
  "charName.2066": "左から右への分離",
  "charName.2067": "右から左への分離",
  "charName.2068": "最初の強い文字による分離",
  "charName.2069": "方向分離の終了",
  "charName.2800": "点字の空白",
  "charName.3000": "全角スペース",
  "charName.3164": "ハングルフィラー",
  "charName.FEFF": "バイト順マーク（BOM）",
  "charName.FFA0": "半角ハングルフィラー",
  "charName.E0001": "言語タグ",
  "charName.E007F": "タグの終端",
  "charName.vs": "異体字セレクター{n}",
  "charName.tag": "タグ文字「{ascii}」",
  "charName.tagSpace": "タグ文字のスペース",
  "script.Latin": "ラテン文字",
  "script.Cyrillic": "キリル文字",
  "script.Greek": "ギリシャ文字",
  "script.Arabic": "アラビア文字",
  "script.Hebrew": "ヘブライ文字",
  "script.Han": "漢字",
  "script.Hiragana": "ひらがな",
  "script.Katakana": "カタカナ",
  "script.Hangul": "ハングル",
  "script.Common": "共通",
  "script.Inherited": "継承",
  "script.Other": "その他"
};
test('pure classic scripts with conditional CommonJS exports', () => {
  for (const file of ['weirdstring-logic.js', 'weirdstring-messages.js', 'weirdstring-data.js', 'samples.js']) {
    const source = read(file);
    assert.doesNotMatch(source, /\b(?:document|window|navigator|localStorage|console)\s*[.(]|\bfetch\s*\(/);
    assert.doesNotMatch(source, /^\s*(?:export|import)\s/m);
    assert.match(source.slice(-500), /if \(typeof module === ['"]object['"] && module.exports\)/);
    assert.match(source.slice(-500), /module.exports = /);
  }
  const logic = read('weirdstring-logic.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.doesNotMatch(logic, /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u);
});
test('fixed Japanese messages match C-7 and placeholders are strict', () => {
  assert.equal(Object.keys(expected).filter(key => key.startsWith('reason.')).length, 30);
  for (const [key, value] of Object.entries(expected)) assert.equal(M.ja[key], value, key);
  assert.equal(M.format('ja', 'summary.item', { category: '不可視文字', count: 3, breakdown: '危険3' }),
    '不可視文字：3件（危険3）');
  assert.throws(() => M.format('ja', 'not-a-key'));
  for (const [key, value] of Object.entries(M.ja)) {
    assert.ok(value.length > 0, key);
    const params = Object.fromEntries(Array.from(value.matchAll(/\{(\w+)\}/g), m => [m[1], 'x']));
    assert.doesNotMatch(M.format('ja', key, params), /\{/);
  }
});
test('dependency-free npm test and Node 22 CI for push and pull_request', () => {
  const pkg = JSON.parse(read('package.json'));
  for (const field of ['type', 'dependencies', 'devDependencies']) assert.ok(!(field in pkg));
  assert.equal(pkg.scripts.test, 'node --test');
  const workflow = read('.github/workflows/test.yml');
  for (const required of ['push', 'pull_request', 'npm test']) assert.ok(workflow.includes(required));
  assert.match(workflow, /node-version: ['"]?22/);
  assert.ok(!read('.gitignore').includes('.github/workflows'));
});

test('UI dictionary keys exist', () => {
  const keys = Array.from(read('script.js').matchAll(/\bt\(['"]([^'"]+)['"]/g), match => match[1]);
  const literalKeys = keys.filter(key => !key.endsWith('.'));
  assert.ok(literalKeys.length > 0);
  for (const key of literalKeys) assert.ok(Object.hasOwn(M.ja, key), key);
});

test('UI avoids HTML insertion, logging, networking and Japanese string literals', () => {
  for (const file of ['script.js', 'weirdstring-logic.js', 'weirdstring-messages.js']) {
    const source = read(file);
    assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML|console\.|alert\(|setAttribute\(['"]style|\.cssText/);
    assert.doesNotMatch(source, /decodeURIComponent|fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
    if (file !== 'weirdstring-messages.js') {
      const uncommented = source.replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      assert.doesNotMatch(uncommented, /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u);
    }
  }
});
