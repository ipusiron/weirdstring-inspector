const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const M = require('../weirdstring-messages.js');
const L = require('../weirdstring-logic.js');
const samples = require('../samples.js');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const params = value => [...new Set(Array.from(value.matchAll(/\{(\w+)\}/g), m => m[1]))].sort();

test('Japanese and English keys, variables and strict formatting agree', () => {
  assert.deepEqual(Object.keys(M.en).sort(), Object.keys(M.ja).sort());
  assert.ok(Object.keys(M.ja).length > 400);
  for (const key of Object.keys(M.ja)) {
    assert.deepEqual(params(M.ja[key]), params(M.en[key]), key);
    for (const lang of ['ja', 'en']) {
      assert.ok(M[lang][key].length > 0, key);
      const values = Object.fromEntries(params(M[lang][key]).map(name => [name, 'test']));
      const formatted = M.format(lang, key, values);
      assert.doesNotMatch(formatted, /\{\w+\}/, key);
      if (params(M[lang][key]).length) assert.throws(() => M.format(lang, key));
    }
  }
  for (const lang of ['ja', 'en', 'xx']) {
    assert.equal(M.has(lang, 'missing'), false);
    assert.throws(() => M.format(lang, 'missing'));
  }
  assert.throws(() => M.format('xx', 'copy.success'));
});

test('HTML and JavaScript keys, dynamic categories and sample metadata are translated', () => {
  const keys = Array.from(read('index.html').matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g), m => m[1]);
  for (const key of keys) for (const lang of ['ja', 'en']) assert.doesNotThrow(() => M.format(lang, key), key);
  keys.push(...Array.from(read('script.js').matchAll(/\bt\(['"]([^'"]+)['"]/g), m => m[1]).filter(key => !key.endsWith('.')));
  keys.push(...L.CATEGORY_ORDER.map(key => 'category.' + key), ...L.SEVERITY_ORDER.map(key => 'severity.' + key));
  for (const sample of Object.values(samples).flat()) {
    keys.push(sample.nameKey, sample.descriptionKey);
    for (const char of L.analyze(sample.text).chars) if (char.reason) keys.push('reason.' + char.reason);
  }
  assert.ok(keys.length > 200);
  for (const key of keys) for (const lang of ['ja', 'en']) assert.equal(M.has(lang, key), true, key);
  assert.match(read('index.html'), /<html lang="ja">/);
  assert.match(read('index.html'), /<noscript>[^<]*Enable JavaScript/);
  assert.doesNotMatch(read('script.js'), /format\('ja'|sample\.name\b|sample\.description\b/);
});

test('47 stable sample IDs keep all 41 baseline texts and add only six specified examples', () => {
  const flat = Object.values(samples).flat();
  assert.equal(flat.length, 47);
  assert.equal(new Set(flat.map(sample => sample.id)).size, 47);
  for (const sample of flat) {
    assert.deepEqual(Object.keys(sample).sort(), ['descriptionKey', 'id', 'nameKey', 'text']);
    assert.match(sample.id, /^[a-z0-9-]+$/);
  }
  const old = flat.filter(sample => /^[a-z]+-\d+$/.test(sample.id));
  assert.equal(old.length, 41);
  // Computed from the exact samples.js at baseline commit 53d7d96.
  const digest = crypto.createHash('sha256').update(JSON.stringify(old.map(sample => sample.text))).digest('hex');
  assert.equal(digest, '6f90790ce04e021dcccbf4ef6b21d5972fbfa1d2c991155e9e92e1896f9631a0');
  const added = flat.filter(sample => !old.includes(sample));
  assert.deepEqual(added.map(sample => sample.id), [
    'tag-unverified-flag', 'tag-markdown-note', 'variation-distributed', 'japanese-login', 'japanese-account', 'japanese-mail'
  ]);
  for (const sample of added) assert.equal(L.analyze(sample.text).verdict, sample.id === 'tag-markdown-note' ? 'danger' : 'caution');
  assert.equal(L.analyze(added.find(sample => sample.id === 'tag-markdown-note').text).hidden[0].text, 'demo note');
});
