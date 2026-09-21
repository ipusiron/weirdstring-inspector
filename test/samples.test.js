const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const L = require('../weirdstring-logic.js');
const samples = require('../samples.js');
const root = path.join(__dirname, '..');

function raw(value) {
  return value.replace(/^\x60|\x60$/g, '').replace(/\\u\{([0-9a-f]+)\}/gi, (_, cp) => String.fromCodePoint(parseInt(cp, 16)));
}
const expected = [
[
"1",
"tag",
"タグ文字で分断したキーワード",
"danger",
"tag 1（danger 1）",
"`funding`",
"hidden tag:\" \""
],
[
"2",
"tag",
"タグ文字に隠した文",
"danger",
"tag 14（danger 14）",
"`Thanks!`",
"hidden tag:\"secret message\""
],
[
"3",
"tag",
"絵文字の旗（正常な使い方）",
"info",
"tag 6（info 6）",
"同じ",
"hidden emojiFlag:\"gbeng\""
],
[
"4",
"bidi",
"RLOで偽装された拡張子",
"danger",
"bidi 1（danger 1）",
"`abctxt.galf`",
"unclosed [3] orphans []"
],
[
"5",
"bidi",
"実行ファイルを画像に見せる",
"danger",
"bidi 1（danger 1）",
"`evilgnp.exe`",
"unclosed [4] orphans []"
],
[
"6",
"bidi",
"Trojan Source型のコメント",
"danger",
"bidi 4（danger 4）",
"`/* } if (isAdmin)  begin admins only */`",
"unclosed [2,21] orphans []"
],
[
"7",
"bidi",
"LRI＋PDI（閉じている）",
"danger",
"bidi 2（danger 2）",
"`ABC`",
"unclosed [] orphans []"
],
[
"8",
"bidi",
"LRMとRLM",
"caution",
"bidi 2（caution 2）",
"`abc`",
"—"
],
[
"9",
"variation",
"絵文字に隠したバイト列",
"danger",
"variation 2（danger 2）",
"`\\u{1F600}`",
"hidden variation:\"hi\":68 69"
],
[
"10",
"variation",
"絵文字の表示指定（正常）",
"info",
"variation 1（info 1）",
"同じ",
"—"
],
[
"11",
"variation",
"漢字の異体字（正常）",
"info",
"variation 1（info 1）",
"同じ",
"—"
],
[
"12",
"invisible",
"ゼロ幅スペース入りのflag.txt",
"danger",
"invisible 3（danger 3）",
"`flag.txt`",
"—"
],
[
"13",
"invisible",
"ソフトハイフンで分断",
"danger",
"invisible 1（danger 1）",
"`password`",
"—"
],
[
"14",
"invisible",
"絵文字をつなぐZWJ（正常）",
"info",
"invisible 1（info 1）",
"同じ",
"—"
],
[
"15",
"invisible",
"先頭のBOM",
"info",
"invisible 1（info 1）",
"同じ",
"—"
],
[
"16",
"invisible",
"空に見える文字",
"caution",
"invisible 1（caution 1）",
"``",
"—"
],
[
"17",
"control",
"ベル文字",
"caution",
"control 1（caution 1）",
"`flag.txt`",
"—"
],
[
"18",
"control",
"単独のCR",
"caution",
"control 1（caution 1）",
"`flag.txt`",
"エスケープ表記で読み込む"
],
[
"19",
"control",
"端末のエスケープシーケンス",
"caution",
"control 2（caution 2）",
"`[31mERROR[0m`",
"—"
],
[
"20",
"whitespace",
"ノーブレークスペース",
"caution",
"whitespace 1（caution 1）",
"`flag .txt`",
"—"
],
[
"21",
"whitespace",
"ヘアスペース",
"caution",
"whitespace 2（caution 2）",
"`f la g.txt`",
"—"
],
[
"22",
"whitespace",
"コードに紛れた全角スペース",
"caution",
"whitespace 1（caution 1）",
"`if (x) return;`",
"—"
],
[
"23",
"whitespace",
"タブ文字",
"info",
"whitespace 1（info 1）",
"同じ",
"—"
],
[
"24",
"private",
"私用領域の文字",
"caution",
"private 3（caution 3）",
"同じ",
"—"
],
[
"25",
"combining",
"積み重ねた結合記号（Zalgo）",
"caution",
"zalgo 6（caution 6）",
"`Zalgo`",
"—"
],
[
"26",
"combining",
"同じ結合記号の連続",
"caution",
"zalgo 2（caution 2）",
"`a`",
"—"
],
[
"27",
"combining",
"分解形（NFD）のアクセントつきe",
"info",
"combining 1（info 1）",
"同じ",
"—"
],
[
"28",
"combining",
"分解形（NFD）の「が」",
"info",
"combining 1（info 1）",
"同じ",
"—"
],
[
"29",
"compat",
"全角の英数字",
"info",
"compat 7（info 7）",
"`flag.txt`",
"—"
],
[
"30",
"compat",
"数学用の英字",
"caution",
"compat 3（caution 3）",
"`pay`",
"—"
],
[
"31",
"lookalike",
"キリル文字だけで書いたapple",
"danger",
"lookalike 5（danger 5）",
"`apple.com`",
"tokens wholeScript(Cyrillic)→`apple`"
],
[
"32",
"lookalike",
"キリル文字を混ぜたgoogle",
"danger",
"lookalike 2（danger 2）",
"`google.com`",
"tokens mixed(Latin+Cyrillic)→`google`"
],
[
"33",
"lookalike",
"ギリシャ文字のアルファで始まるalpha",
"danger",
"lookalike 1（danger 1）",
"`alpha`",
"tokens mixed(Greek+Latin)→`alpha`"
],
[
"34",
"lookalike",
"アラビア文字を紛れ込ませたflag.txt",
"danger",
"lookalike 1（danger 1）、mixed 1（danger 1）",
"`f\\u{0631}lg.txt`",
"tokens mixed(Latin+Arabic)→`f\\u{0631}lg`"
],
[
"35",
"lookalike",
"全角ピリオドのドメイン",
"danger",
"lookalike 1（danger 1）",
"`example.com`",
"—"
],
[
"36",
"lookalike",
"句点のドメイン",
"danger",
"lookalike 1（danger 1）",
"`example.com`",
"—"
],
[
"37",
"lookalike",
"スラッシュに見える「ノ」",
"danger",
"lookalike 1（danger 1）",
"`example.com/login`",
"—"
],
[
"38",
"lookalike",
"分数用のスラッシュ",
"danger",
"lookalike 1（danger 1）",
"`example.com/login`",
"—"
],
[
"39",
"normal",
"正常なflag.txt",
"clean",
"なし",
"同じ",
"—"
],
[
"40",
"normal",
"日本語の文",
"clean",
"なし",
("`\\u{3053}\\u{3093}\\u{306B}\\u{3061}\\u{306F}\\u{3002}\\u{30D5}\\u{" +
"30A1}\\u{30A4}\\u{30EB}\\u{540D}\\u{306F}flag.txt\\u{3067}\\u{3059" +
"}!`"),
"—"
],
[
"41",
"normal",
"ロシア語の文",
"info",
"lookalike 3（info 3）",
"`\\u{041F}p\\u{0438}\\u{0432}e\\u{0442}, \\u{043C}\\u{0438}p`",
"—"
]
];
test('all 41 independently specified sample verdicts, counts, contents and context', () => {
  assert.deepEqual(Object.keys(samples), [
    'tag', 'bidi', 'variation', 'invisible', 'control', 'whitespace', 'private', 'combining', 'compat', 'lookalike', 'normal'
  ]);
  assert.deepEqual(Object.values(samples).map(group => group.length), [3, 5, 3, 5, 3, 4, 1, 4, 2, 8, 3]);
  const flat = Object.values(samples).flat();
  assert.equal(flat.length, 41);
  assert.equal(expected.length, 41);
  expected.forEach((row, index) => {
    const [, category, name, verdict, counts, comparable, extra] = row;
    const sample = flat[index];
    assert.equal(sample.name, name);
    assert.ok(samples[category].includes(sample));
    const result = L.analyze(sample.text);
    assert.equal(result.verdict, verdict, name);
    assert.equal(result.comparable, comparable === '同じ' ? sample.text : raw(comparable), name);
    const want = {};
    for (const m of counts.matchAll(/([a-z]+) (\d+)（(danger|caution|info) (\d+)）/g)) {
      want[m[1]] = { danger: 0, caution: 0, info: 0, total: +m[2], [m[3]]: +m[4] };
    }
    assert.deepEqual(Object.fromEntries(Object.entries(result.counts).filter(([, v]) => v.total)), want, name);
    if (extra.startsWith('hidden ')) {
      const m = extra.match(/^hidden (\w+):"([^"]*)"(.*)$/);
      assert.equal(result.hidden.length, 1);
      assert.equal(result.hidden[0].kind, m[1]);
      assert.equal(result.hidden[0].text, m[2]);
      if (m[3]) assert.equal(result.hidden[0].bytes, m[3].slice(1));
    } else assert.equal(result.hidden.length, 0);
    if (extra.startsWith('unclosed ')) {
      const m = extra.match(/unclosed (\[[^\]]*\]) orphans (\[[^\]]*\])/);
      assert.deepEqual(result.bidi.unclosed, JSON.parse(m[1]));
      assert.deepEqual(result.bidi.orphans, JSON.parse(m[2]));
    }
    if (extra.startsWith('tokens ')) {
      const m = extra.match(/tokens (\w+)\(([^)]+)\)→\x60([^\x60]*)\x60/);
      const tokens = result.tokens.filter(token => token.level === 'mixed' || token.wholeScriptConfusable);
      assert.equal(tokens.length, 1);
      if (m[1] === 'wholeScript') assert.equal(tokens[0].wholeScriptConfusable, true);
      else assert.equal(tokens[0].level, m[1]);
      assert.deepEqual(tokens[0].scripts, m[2].split('+'));
      assert.equal(tokens[0].comparable, raw(m[3]));
    }
  });
});
test('generated samples.md preserves all 37 literal examples and explains four control examples', () => {
  const run = spawnSync(process.execPath, ['tools/build-samples-md.js', '--check'], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const md = fs.readFileSync(path.join(root, 'samples.md'), 'utf8');
  const rows = md.split(/\r?\n/).filter(line => line.startsWith('| ') && !line.startsWith('| サンプル名'));
  assert.equal(rows.length, 41);
  let actual = 0;
  for (const sample of Object.values(samples).flat()) {
    const row = rows.find(line => line.startsWith('| ' + sample.name + ' |'));
    assert.ok(row, sample.name);
    const cell = row.split('|')[2].trim();
    if (/[\u0000-\u001f\u007f]/.test(sample.text)) assert.equal(cell, '（エスケープ表記を参照）');
    else {
      assert.equal(cell.slice(1, -1), sample.text);
      actual++;
    }
  }
  assert.equal(actual, 37);
});
