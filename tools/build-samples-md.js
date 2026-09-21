// samples.js is the single source of the educational examples.
const fs = require('node:fs');
const path = require('node:path');
const samples = require('../samples.js');
const logic = require('../weirdstring-logic.js');
const messages = require('../weirdstring-messages.js');

function build(lang = 'ja') {
  const t = key => messages.format(lang, key);
  const rows = [
    '# ' + t('samples.title'),
    '',
    t('samples.intro'),
    t('samples.warning'),
    '',
    t('samples.generated'),
    '',
  ];
  for (const [key, group] of Object.entries(samples)) {
    const title = key === 'normal' ? t('samples.normal') : t('category.' + key);
    rows.push('## ' + title, '', t('samples.header'), '|---|---|---|---|---|');
    for (const sample of group) {
      const actual = /[\u0000-\u001f\u007f]/.test(sample.text) ? t('samples.escaped') : '`' + sample.text + '`';
      const result = logic.analyze(sample.text);
      const verdict = result.verdict === 'clean' ? t('samples.clean') : t('severity.' + result.verdict);
      rows.push('| ' + [t(sample.nameKey), actual, '`' + logic.escapeForInput(sample.text) + '`',
        verdict, t(sample.descriptionKey)].join(' | ') + ' |');
    }
    rows.push('');
  }
  return rows.join('\n');
}

if (require.main === module) {
  for (const lang of ['ja', 'en']) {
    const name = lang === 'ja' ? 'samples.md' : 'samples.en.md';
    const target = path.join(__dirname, '..', name);
    const expected = build(lang);
    const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    if (process.argv.includes('--check')) {
      const same = current.replace(/\r\n/g, '\n') === expected;
      process.stdout.write(same ? name + ': 差分なし\n' : name + 'に差分があります\n');
      if (!same) process.exitCode = 1;
    } else {
      // Preserve the existing working-tree line endings.
      fs.writeFileSync(target, current.includes('\r\n') ? expected.replace(/\n/g, '\r\n') : expected);
    }
  }
}

module.exports = { build };
