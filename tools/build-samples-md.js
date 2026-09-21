// samples.js is the single source of the educational examples.
const fs = require('node:fs');
const path = require('node:path');
const samples = require('../samples.js');
const logic = require('../weirdstring-logic.js');
const messages = require('../weirdstring-messages.js');

function build() {
  const rows = [
    '# 学習用サンプル',
    '',
    '41件の文字列を、画面のタブと同じ順に載せています。実物の列からコピーして検査できます。',
    '不可視文字や双方向制御文字も実物のまま含めています。制御文字を含む4件はエスケープ表記を使ってください。',
    '',
    'このファイルは`node tools/build-samples-md.js`で生成します。直接編集せず、`samples.js`を更新してください。',
    '',
  ];
  for (const [key, group] of Object.entries(samples)) {
    const title = key === 'normal' ? '正常' : messages.format('ja', 'category.' + key);
    rows.push('## ' + title, '', '| サンプル名 | 実物 | エスケープ表記 | 判定 | 説明 |', '|---|---|---|---|---|');
    for (const sample of group) {
      const actual = /[\u0000-\u001f\u007f]/.test(sample.text) ? '（エスケープ表記を参照）' : '`' + sample.text + '`';
      const result = logic.analyze(sample.text);
      const verdict = result.verdict === 'clean' ? '検出なし' : messages.format('ja', 'severity.' + result.verdict);
      rows.push('| ' + [sample.name, actual, '`' + logic.escapeForInput(sample.text) + '`', verdict, sample.description].join(' | ') + ' |');
    }
    rows.push('');
  }
  return rows.join('\n');
}

if (require.main === module) {
  const target = path.join(__dirname, '..', 'samples.md');
  const expected = build();
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (process.argv.includes('--check')) {
    const same = current.replace(/\r\n/g, '\n') === expected;
    process.stdout.write(same ? '差分なし\n' : 'samples.mdに差分があります\n');
    process.exitCode = same ? 0 : 1;
  } else {
    // Preserve the existing working-tree line endings.
    fs.writeFileSync(target, current.includes('\r\n') ? expected.replace(/\n/g, '\r\n') : expected);
  }
}

module.exports = { build };
