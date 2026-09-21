const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../weirdstring-logic.js');
const D = require('../weirdstring-context-data.js');

test('Japanese candidate rules preserve normal text and identify the three designed examples', () => {
  for (const [text, target] of [['口グイン', 'ロ'], ['ア力ウント', 'カ'], ['メ一ル', 'ー']]) {
    const result = L.analyze(text);
    const candidates = result.chars.filter(char => char.reason === 'japaneseConfusable');
    assert.equal(candidates.length, 1, text);
    assert.equal(candidates[0].japaneseTarget, target);
    assert.equal(candidates[0].ascii, null);
    assert.equal(result.verdict, 'caution');
    assert.equal(result.comparable, text);
  }
  for (const text of ['ログイン', 'アカウント', 'メール', '八ヶ岳', '一ヶ月', '二カ月', '入口', '人口', '工場',
    '東京タワーへ行く', 'カタカナへ', '入ロ', 'ア力', '口グ', 'か\u3099', '力一グイン', '力ーグ']) {
    assert.ok(!L.analyze(text).chars.some(char => char.reason === 'japaneseConfusable'), text);
  }
  assert.equal(L.analyze('口ク\u3099イン').chars[0].japaneseTarget, 'ロ');
});

test('all 15 Han pairs have the same conditional rule; hiragana he is comparison-only', () => {
  assert.equal(D.japanesePairs.length, 16);
  for (const [from, to] of D.japanesePairs) {
    const text = String.fromCodePoint(from) + 'アイ';
    const result = L.analyze(text);
    if (from === 0x3078) assert.ok(!result.chars[0].japaneseTarget);
    else assert.equal(result.chars[0].japaneseTarget, String.fromCodePoint(to), text);
  }
});
