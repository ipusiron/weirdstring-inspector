const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const L = require('../weirdstring-logic.js');
const D = require('../weirdstring-context-data.js');
const flag = text => '\u{1F3F4}' + Array.from(text, ch => String.fromCodePoint(ch.codePointAt(0) + 0xe0000)).join('') + '\u{E007F}';

test('pinned context data regenerates offline and includes 3 RGI flags, 2179 variants and 16 pairs', () => {
  assert.equal(D.unicodeVersion, '18.0.0');
  assert.equal(D.rgiFlags.length, 3);
  assert.equal(D.variants.length, 2179);
  assert.equal(D.japanesePairs.length, 16);
  execFileSync(process.execPath, [path.join(__dirname, '../tools/build-context-data.js'), '--check']);
});

test('RGI flags are informative; other shapes are unverified, malformed tags remain high concern', () => {
  for (const name of ['gbeng', 'gbsct', 'gbwls']) {
    const result = L.analyze(flag(name));
    assert.equal(result.verdict, 'info');
    assert.equal(result.hidden[0].kind, 'emojiFlag');
    assert.equal(result.hidden[0].text, name);
  }
  for (const text of ['hello', 'a'.repeat(30)]) {
    const result = L.analyze(flag(text));
    assert.equal(result.verdict, 'caution');
    assert.equal(result.hidden[0].flagStatus, 'unverified');
    assert.equal(result.chars[1].reason, 'emojiFlagUnverified');
  }
  for (const text of [flag('a'.repeat(31)), flag('gbeng').slice(0, -2), flag('HELLO'), flag(''), flag('gbeng').slice(2)]) {
    assert.equal(L.analyze(text).verdict, 'danger');
  }
});

test('single VS distinguishes documented, Han-unverified, FVS and unexpected contexts', () => {
  for (const text of ['\u2600\ufe0f', '\u2764\ufe0f', '\u845b\u{E0100}', '\u180b']) {
    assert.equal(L.analyze(text).verdict, 'info');
  }
  assert.equal(L.analyze('\u845b\u{E0100}').chars[1].contextUnverified, true);
  for (const text of ['\ufe0f', '\u{1F600}\u{E0158}', 'a\ufe00']) {
    const result = L.analyze(text);
    assert.equal(result.verdict, 'caution');
    assert.equal(result.chars.at(-1).reason, 'variationUnexpected');
    assert.equal(result.hidden.length, 0);
  }
});

test('distributed decoding is an adjacent, unexpected VS candidate, never a whole-text join', () => {
  const a = '\u{1F600}\u{E0158}', b = '\u{1F601}\u{E0159}';
  const result = L.analyze(a + b);
  assert.equal(result.verdict, 'caution');
  assert.deepEqual(result.hidden, [{ kind: 'variationDistributed', start: 1, end: 3, count: 2,
    indices: [1, 3], candidate: true, bytes: '68 69', text: 'hi' }]);
  for (const middle of [' ', '\n', '\t', '\u200b', '\u0301', '\u2600\ufe0f', '\u845b\u{E0100}']) {
    assert.equal(L.analyze(a + middle + b).hidden.length, 0, JSON.stringify(middle));
  }
  assert.equal(L.analyze('\u{1F600}\u{E0158}\u{E0159}').hidden[0].kind, 'variation');
  assert.equal(L.analyze('\u{1F600}\u{E01EF}\u{1F601}\u{E01EE}').hidden[0].text, null);
  assert.equal(L.analyze('\u{1F600}\ufe00\u{1F601}\ufe01').hidden[0].text, null);
  assert.equal(L.analyze('a\u180bb\u180c').hidden.length, 0);
});
