// Optional operations keep the original text and never access the browser.
(function (root) {
  'use strict';
  const L = typeof module === 'object' && module.exports ? require('./weirdstring-logic.js') : root.WeirdStringLogic;
  const C = typeof module === 'object' && module.exports ? require('./weirdstring-context-data.js') : root.WeirdStringContextData;
  const removable = new Set(['tag', 'bidi', 'variation', 'invisible', 'control']);
  const japanese = new Map(C.japanesePairs.map(([a, b]) => [a, b]));

  function buildRemovalPlan(result) {
    const candidates = result.chars.filter(char => removable.has(char.category) && ['danger', 'caution'].includes(char.severity));
    return {
      candidates: candidates.map(char => ({ ...char })),
      defaultIndices: candidates.filter(char => char.severity === 'danger').map(char => char.index)
    };
  }

  function removeSelected(text, indices) {
    const chars = Array.from(text);
    const selected = new Set(indices);
    for (const index of selected) {
      if (!Number.isInteger(index) || index < 0 || index >= chars.length) throw new RangeError('Invalid code point index');
    }
    const removed = [];
    const kept = [];
    let offset = 0;
    chars.forEach((ch, index) => {
      if (selected.has(index)) removed.push({ index, offset, cp: ch.codePointAt(0), ch });
      else kept.push(ch);
      offset += ch.length;
    });
    return { text: kept.join(''), removed };
  }

  function japaneseComparable(text) {
    return Array.from(text.normalize('NFC'), ch => String.fromCodePoint(japanese.get(ch.codePointAt(0)) ?? ch.codePointAt(0))).join('');
  }

  function compareTexts(a, b) {
    const left = L.analyze(a);
    const right = L.analyze(b);
    if (left.truncated || right.truncated) return { status: 'incomplete', reason: 'limit' };
    const ca = left.chars;
    const cb = right.chars;
    let index = 0;
    while (index < ca.length && index < cb.length && ca[index].ch === cb[index].ch) index++;
    const position = chars => chars[index] ? { index, offset: chars[index].offset, cp: chars[index].cp } : null;
    const context = chars => chars.slice(Math.max(0, index - 8), index + 9).map(char => char.ch).join('');
    return {
      status: 'complete', exactEqual: a === b,
      nfcEqual: a.normalize('NFC') === b.normalize('NFC'),
      nfkcEqual: a.normalize('NFKC') === b.normalize('NFKC'),
      comparableEqual: left.comparable === right.comparable,
      japanesePairEqual: japaneseComparable(a) === japaneseComparable(b),
      transformedEmpty: (a.length > 0 && left.comparable === '') || (b.length > 0 && right.comparable === ''),
      firstDifference: a === b ? null : { a: position(ca), b: position(cb), contextA: context(ca), contextB: context(cb) }
    };
  }

  const API = { buildRemovalPlan, removeSelected, compareTexts };
  if (typeof module === 'object' && module.exports) {
    module.exports = API;
  } else {
    root.WeirdStringActions = API;
  }
})(typeof self !== 'undefined' ? self : this);
