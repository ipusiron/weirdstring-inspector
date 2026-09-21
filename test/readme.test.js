const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const L = require('../weirdstring-logic.js');
const M = require('../weirdstring-messages.js');
const D = require('../weirdstring-data.js');
const samples = require('../samples.js');
const A = require('../weirdstring-actions.js');
const C = require('../weirdstring-context-data.js');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const md = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const en = fs.readFileSync(path.join(root, 'README.en.md'), 'utf8');
const section = heading => md.split(heading + '\n')[1].split('\n## ')[0];
const rows = text => text.split(/\r?\n/).filter(line => line.startsWith('| ')).slice(1)
  .map(line => line.slice(1, -1).split('|').map(cell => cell.trim()));
const uncode = text => text.replace(/^\x60|\x60$/g, '');
test('README category table and all eight literal examples match the code', () => {
  const categories = rows(section('## 📚 検出する文字の種類'));
  assert.equal(categories.length, 12);
  assert.deepEqual(categories.map(row => row[0]), L.CATEGORY_ORDER);
  categories.forEach(row => assert.equal(row[1], M.format('ja', 'category.' + row[0])));
  const examples = rows(section('## 🧭 判定の例'));
  assert.equal(examples.length, 8);
  assert.deepEqual(examples.map(row => row[2]), ['危険', '危険', '危険', '危険', '危険', '危険', '注意', '検出なし']);
  for (const [actual, escaped, verdict, comparable] of examples) {
    const input = L.decodeEscapes(uncode(escaped));
    assert.deepEqual(input.errors, []);
    assert.equal(uncode(actual), input.text);
    const result = L.analyze(input.text);
    const text = result.verdict === 'clean' ? '検出なし' : M.format('ja', 'severity.' + result.verdict);
    assert.equal(text, verdict);
    assert.equal(result.comparable, L.decodeEscapes(uncode(comparable)).text);
  }
});
test('README numbers and block-form metadata retain their meaning', () => {
  assert.equal(D.count, 2249);
  assert.equal(D.unicodeVersion, '18.0.0');
  assert.equal(Object.keys(D.asciiLookalike).length, 423);
  assert.equal(Object.values(samples).flat().length, 47);
  assert.equal(L.MAX_CODE_POINTS, 100000);
  for (const text of ['2,249件', '423種類', 'Version 18.0.0', '47件', '100,000文字']) assert.ok(md.includes(text), text);
  const meta = md.match(/^<!--\r?\n---\r?\n([\s\S]*?)\r?\n---\r?\n-->/);
  assert.ok(meta);
  for (const key of ['category_ja', 'category_en', 'tags']) assert.match(meta[1], new RegExp(key + ':\\r?\\n  - '));
  const fixed = {
    id: 'day023', slug: 'weirdstring-inspector', title: '"WeirdString Inspector"',
    repo_url: '"https://github.com/ipusiron/weirdstring-inspector"',
    demo_url: '"https://ipusiron.github.io/weirdstring-inspector/"', hub: 'true'
  };
  for (const [key, value] of Object.entries(fixed)) {
    assert.equal(meta[1].split(/\r?\n/).find(line => line.startsWith(key + ':')), key + ': ' + value);
  }
  assert.doesNotMatch(md, /debugCharCodes|HTTPサーバー上での動作が必要|ツールチップ|Confused Scripts|ディレクトリ構成/);
});
test('all referenced images exist and all assets PNGs are referenced', () => {
  const localImages = text => Array.from(text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g), m => m[1]).filter(url => !/^https?:/.test(url));
  assert.equal(localImages(md).length, 3);
  assert.equal(localImages(en).length, 2);
  assert.deepEqual(localImages(en), ['assets/screenshot4.png', 'assets/screenshot5.png']);
  const images = [...localImages(md), ...localImages(en)];
  assert.equal(images.length, 5);
  for (const file of images) assert.ok(fs.existsSync(path.join(root, file)), file);
  const pngs = fs.readdirSync(path.join(root, 'assets')).filter(name => name.endsWith('.png')).map(name => 'assets/' + name);
  assert.deepEqual([...images].sort(), pngs.sort());
});

test('both README comparison tables reproduce all 55 independent flags', () => {
  const flags = ['exactEqual', 'nfcEqual', 'nfkcEqual', 'comparableEqual', 'japanesePairEqual'];
  const parsed = [md, en].map(text => {
    const table = text.match(/\| A \| B \|[^\n]+\n([\s\S]*?)(?=\r?\n\r?\n)/)[0];
    const entries = rows(table);
    assert.equal(entries.length, 11);
    for (const [a, b, ...expected] of entries) {
      const left = L.decodeEscapes(uncode(a));
      const right = L.decodeEscapes(uncode(b));
      assert.deepEqual(left.errors, []);
      assert.deepEqual(right.errors, []);
      const result = A.compareTexts(left.text, right.text);
      assert.equal(result.status, 'complete');
      assert.deepEqual(flags.map(key => result[key] ? '✓' : '—'), expected);
    }
    return entries;
  });
  assert.deepEqual(parsed[0], parsed[1]);
});

test('phase 2 documentation states shared limits and preserves the exact original metadata', () => {
  assert.equal(C.rgiFlags.length, 3);
  assert.equal(C.variants.length, 2179);
  assert.equal(C.japanesePairs.length, 16);
  assert.equal(A.MAX_FILE_BYTES, 1048576);
  assert.equal(A.MAX_REPORT_BYTES, 5242880);
  assert.equal(A.MAX_SHARE_LENGTH, 8000);
  for (const doc of [md, en]) {
    for (const number of ['2,249', '423', '2,179', '100,000', '5,000', '1,000', '1MiB', '5MiB', '8,000']) {
      assert.ok(doc.includes(number), number);
    }
    assert.ok(doc.includes('#v=2&mode=escape&text='));
    assert.ok(doc.includes('node tools/build-context-data.js --check'));
  }
  assert.ok(md.includes('[English](README.en.md)'));
  assert.ok(en.includes('[日本語](README.md)'));
  assert.doesNotMatch(en, /id: day023|hub: true|^<!--/);
  const meta = md.match(/^<!--[\s\S]*?-->/)[0].replace(/\r\n/g, '\n');
  assert.equal(crypto.createHash('sha256').update(meta).digest('hex'),
    '788d37c72e8f5f420014976a2f427b9ec207bbb78127e558d31c14b01154d986');
  const guide = fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8');
  for (const file of ['weirdstring-actions.js', 'weirdstring-context-data.js', 'samples.en.md', 'README.en.md']) {
    assert.ok(guide.includes(file), file);
  }
  assert.doesNotMatch(guide, /41 educational|do not add English UI|All text is in Japanese/);
});
test('documented directory tree contains every path with aligned explanations', () => {
  const tree = section('## 📁 ディレクトリー構造').match(/\x60{3}text\n([^]*?)\n\x60{3}/)[1].split('\n');
  const paths = [];
  const stack = [];
  const column = tree[0].indexOf('#');
  tree.forEach((line, index) => {
    assert.ok(line.includes('# '), line);
    assert.equal(line.indexOf('#'), column, line);
    assert.ok(line.split('# ')[1].trim(), line);
    if (!index) { assert.match(line, /^weirdstring-inspector\//); return; }
    const branch = line.search(/[├└]/);
    assert.ok(branch >= 0, line);
    const level = branch / 4;
    const name = line.slice(branch + 4, line.indexOf('#')).trimEnd();
    const file = stack.slice(0, level).join('') + name;
    paths.push(file);
    if (name.endsWith('/')) stack[level] = name;
  });
  function walk(dir, prefix = '') {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      if (['.git', '.claude', 'node_modules'].includes(entry.name)) return [];
      const file = prefix + entry.name;
      return entry.isDirectory() ? [file + '/', ...walk(path.join(dir, entry.name), file + '/')] : [file];
    });
  }
  assert.deepEqual(paths.sort(), walk(root).sort());
});
