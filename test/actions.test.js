const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../weirdstring-logic.js');
const A = require('../weirdstring-actions.js');
const C = require('../weirdstring-context-data.js');

test('removal defaults only select high concern and preserve legitimate contexts', () => {
  const tag = text => Array.from(text, ch => String.fromCodePoint(0xe0000 + ch.codePointAt(0))).join('');
  const unchanged = ['👨‍👩‍👧‍👦', 'cafe\u0301', '☀️', '\ufeffabc', 'a\r\nb\tc', 'a\0b', '🏴' + tag('hello') + '\u{e007f}'];
  const cases = [['f\u200blag.txt', 'flag.txt'], ['evil\u202egnp.exe', 'evilgnp.exe'], ...unchanged.map(x => [x, x])];
  for (const [input, expected] of cases) {
    const result = L.analyze(input);
    const before = JSON.stringify(result);
    const plan = A.buildRemovalPlan(result);
    assert.equal(A.removeSelected(input, plan.defaultIndices).text, expected);
    assert.equal(JSON.stringify(result), before);
  }
  assert.equal(A.removeSelected('a\0b', [1]).text, 'ab');
  assert.equal(A.buildRemovalPlan(L.analyze('x\u0300\u0301\u0302\u0303')).candidates.length, 0);
  assert.equal(A.buildRemovalPlan(L.analyze('口グイン ｆｌａｇ \ue000')).candidates.length, 0);
  assert.equal(A.buildRemovalPlan(L.analyze('می\u200cروم')).candidates.length, 0);
  assert.equal(A.buildRemovalPlan(L.analyze('漢\u{e0100}')).candidates.length, 0);
});

test('removal uses code point indices, deduplicates, validates and never mutates indices', () => {
  const indices = [2, 1, 1];
  assert.deepEqual(A.removeSelected('A😀\0B', indices), {
    text: 'AB', removed: [{ index: 1, offset: 1, cp: 0x1f600, ch: '😀' }, { index: 2, offset: 3, cp: 0, ch: '\0' }]
  });
  assert.deepEqual(indices, [2, 1, 1]);
  assert.deepEqual(A.removeSelected('a\ud800\r\nb', []), { text: 'a\ud800\r\nb', removed: [] });
  for (const index of [-1, 4, 0.5, NaN, '1']) assert.throws(() => A.removeSelected('abcd', [index]), RangeError);
});

test('all 55 independent comparison flags match the phase 2 table', () => {
  const cases = [
    ['abc', 'abc', [true, true, true, true, true]],
    ['café', 'cafe\u0301', [false, true, true, false, true]],
    ['ｆｌａｇ', 'flag', [false, false, true, true, false]],
    ['f\u200blag.txt', 'flag.txt', [false, false, false, true, false]],
    ['g\u043e\u043egle.com', 'google.com', [false, false, false, true, false]],
    ['口グイン', 'ログイン', [false, false, false, false, true]],
    ['へ', 'ヘ', [false, false, false, false, true]],
    ['rn', 'm', [false, false, false, false, false]],
    ['a\r\nb', 'a\nb', [false, false, false, false, false]],
    ['', '', [true, true, true, true, true]],
    ['\u200b', '', [false, false, false, true, false]]
  ];
  const flags = ['exactEqual', 'nfcEqual', 'nfkcEqual', 'comparableEqual', 'japanesePairEqual'];
  for (const [a, b, expected] of cases) {
    const result = A.compareTexts(a, b);
    assert.equal(result.status, 'complete');
    assert.deepEqual(flags.map(key => result[key]), expected, JSON.stringify([a, b]));
  }
  assert.equal(A.compareTexts('\u200b', '').transformedEmpty, true);
  for (const [a, b] of C.japanesePairs) {
    assert.equal(A.compareTexts(String.fromCodePoint(a), String.fromCodePoint(b)).japanesePairEqual, true);
  }
});

test('comparison differences distinguish code point and UTF-16 positions and partial analysis', () => {
  assert.deepEqual(A.compareTexts('😀a', '😀b').firstDifference, {
    a: { index: 1, offset: 2, cp: 97 }, b: { index: 1, offset: 2, cp: 98 }, contextA: '😀a', contextB: '😀b'
  });
  assert.equal(A.compareTexts('a', '').firstDifference.b, null);
  assert.equal(A.compareTexts('\ud800', '\ud801').firstDifference.a.cp, 0xd800);
  assert.equal(A.compareTexts('abc', 'abc').firstDifference, null);
  for (const [a, b] of [['a'.repeat(100001), ''], ['', 'a'.repeat(100001)]]) {
    assert.deepEqual(A.compareTexts(a, b), { status: 'incomplete', reason: 'limit' });
  }
  const diff = A.compareTexts('a'.repeat(30) + 'b' + 'a'.repeat(30), 'a'.repeat(61)).firstDifference;
  assert.equal(Array.from(diff.contextA).length, 17);
});
