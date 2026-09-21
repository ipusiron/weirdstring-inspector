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

  const MAX_FILE_BYTES = 1048576;

  function decodeUtf8File(bytes) {
    if (!(bytes instanceof Uint8Array)) throw new TypeError('Expected Uint8Array');
    if (bytes.byteLength > MAX_FILE_BYTES) return { ok: false, reason: 'size' };
    if ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff)) {
      return { ok: false, reason: 'encoding' };
    }
    let text;
    try {
      text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    } catch {
      return { ok: false, reason: 'utf8' };
    }
    let length = 0;
    for (const ch of text) {
      if (++length > L.MAX_CODE_POINTS) return { ok: false, reason: 'length' };
    }
    return { ok: true, text, bytes: bytes.byteLength, codePoints: length };
  }

  const MAX_REPORT_BYTES = 5 * 1024 * 1024;
  const MAX_SHARE_LENGTH = 8000;
  const SHARE_BASE = 'https://ipusiron.github.io/weirdstring-inspector/';

  function escapeAll(text) {
    return Array.from(text, ch => '\\u{' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') + '}').join('');
  }

  function buildReport(result, options = {}) {
    const language = options.language || 'ja';
    if (!['ja', 'en'].includes(language)) throw new RangeError('Unsupported report language');
    const severityCounts = { danger: 0, caution: 0, info: 0, none: 0 };
    const ruleCounts = {};
    for (const char of result.chars) {
      severityCounts[char.severity]++;
      if (char.reason) ruleCounts[char.reason] = (ruleCounts[char.reason] || 0) + 1;
    }
    const report = {
      schemaVersion: 1, tool: 'WeirdString Inspector', unicodeVersion: C.unicodeVersion, language,
      analysis: { complete: !result.truncated, analyzedCodePoints: result.length.codePoints, limit: L.MAX_CODE_POINTS },
      verdict: result.verdict, categoryCounts: structuredClone(result.counts), severityCounts, ruleCounts,
      includesDetails: options.details === true
    };
    if (report.includesDetails) {
      report.details = {
        encoding: 'all-code-points-u-braces', text: escapeAll(result.text), comparable: escapeAll(result.comparable),
        characters: result.chars.slice(0, 1000).map(char => ({
          index: char.index, offset: char.offset, codePoint: L.describeCodePoint(char.cp).codePoint,
          text: escapeAll(char.ch), category: char.category, severity: char.severity, reason: char.reason,
          ascii: char.ascii === null ? null : escapeAll(char.ascii),
          japaneseTarget: char.japaneseTarget ? escapeAll(char.japaneseTarget) : null
        })),
        tokens: result.tokens.slice(0, 100).map(token => ({
          start: token.start, end: token.end, text: escapeAll(token.text), comparable: escapeAll(token.comparable),
          scripts: token.scripts.slice(), level: token.level
        })),
        hidden: result.hidden.slice(0, 100).map(item => ({
          kind: item.kind, start: item.start, end: item.end, count: item.count,
          indices: item.indices ? item.indices.slice() : null, text: item.text === null ? null : escapeAll(item.text),
          bytes: item.bytes, candidate: item.candidate === true
        })),
        totals: { characters: result.chars.length, tokens: result.tokens.length, hidden: result.hidden.length },
        omitted: {
          characters: Math.max(0, result.chars.length - 1000), tokens: Math.max(0, result.tokens.length - 100),
          hidden: Math.max(0, result.hidden.length - 100)
        }
      };
    }
    return report;
  }

  function checkReportSize(content) {
    const bytes = new TextEncoder().encode(content).length;
    return bytes <= MAX_REPORT_BYTES ? { ok: true, content, bytes } : { ok: false, reason: 'size', bytes };
  }

  function serializeReport(report, format, translate) {
    const json = JSON.stringify(report, null, 2);
    if (format === 'json') return checkReportSize(json + '\n');
    if (format !== 'md') throw new RangeError('Unsupported report format');
    const content = '# ' + translate('report.heading') + '\n\n' + translate('report.limits') + '\n\n' +
      translate(report.includesDetails ? 'report.includes' : 'report.excludes') + '\n\n```json\n' + json + '\n```\n';
    return checkReportSize(content);
  }

  function buildShareUrl(text) {
    const params = new URLSearchParams({ v: '2', mode: 'escape', text: L.escapeForInput(text) });
    const url = SHARE_BASE + '#' + params.toString();
    return url.length <= MAX_SHARE_LENGTH ? { ok: true, url } : { ok: false, reason: 'length', length: url.length };
  }

  const API = {
    buildRemovalPlan, removeSelected, compareTexts, MAX_FILE_BYTES, decodeUtf8File,
    MAX_REPORT_BYTES, MAX_SHARE_LENGTH, escapeAll, buildReport, checkReportSize, serializeReport, buildShareUrl
  };
  if (typeof module === 'object' && module.exports) {
    module.exports = API;
  } else {
    root.WeirdStringActions = API;
  }
})(typeof self !== 'undefined' ? self : this);
