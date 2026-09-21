const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../weirdstring-actions.js');
const L = require('../weirdstring-logic.js');
const M = require('../weirdstring-messages.js');

test('UTF-8 file decoding preserves BOM, CRLF, NUL and empty input', () => {
  const cases = [
    [[0xef, 0xbb, 0xbf, 0x61, 0x0d, 0x0a, 0x62], '\ufeffa\r\nb'],
    [[0x61, 0x0a, 0x62], 'a\nb'], [[0x61, 0, 0x62], 'a\0b'], [[], '']
  ];
  for (const [bytes, text] of cases) {
    const data = Uint8Array.from(bytes);
    assert.deepEqual(A.decodeUtf8File(data), { ok: true, text, bytes: bytes.length, codePoints: Array.from(text).length });
    assert.deepEqual(Array.from(data), bytes);
  }
  for (const bytes of [[0xc3, 0x28], [0xed, 0xa0, 0x80], [0xf0, 0x80, 0x80, 0x80], [0xe2, 0x80]]) {
    assert.deepEqual(A.decodeUtf8File(Uint8Array.from(bytes)), { ok: false, reason: 'utf8' });
  }
  for (const bytes of [[0xff, 0xfe, 0x61, 0], [0xfe, 0xff, 0, 0x61]]) {
    assert.deepEqual(A.decodeUtf8File(Uint8Array.from(bytes)), { ok: false, reason: 'encoding' });
  }
});

test('file size and code point limits reject whole files, not just their tails', () => {
  assert.equal(A.MAX_FILE_BYTES, 1048576);
  assert.deepEqual(A.decodeUtf8File(new Uint8Array(1048577)), { ok: false, reason: 'size' });
  assert.deepEqual(A.decodeUtf8File(new Uint8Array(1048576)), { ok: false, reason: 'length' });
  assert.deepEqual(A.decodeUtf8File(new TextEncoder().encode('a'.repeat(100001))), { ok: false, reason: 'length' });
  const text = '\r' + '\u{e0061}'.repeat(99999);
  const result = A.decodeUtf8File(new TextEncoder().encode(text));
  assert.equal(result.ok, true);
  assert.equal(result.codePoints, 100000);
  assert.equal(result.text, text);
  assert.ok(L.escapeForInput(text).length > 200000);
  assert.equal(L.decodeEscapes(L.escapeForInput(text)).text, text);
});

test('summary reports omit content, details escape every input-derived code point', () => {
  const text = 'SECRET\ufeff\r\n<script>```[x](https://example.invalid)\u{e0061}\u{e007f}\ud800';
  const result = L.analyze(text);
  const before = JSON.stringify(result);
  const summary = A.buildReport(result);
  assert.equal(summary.schemaVersion, 1);
  assert.equal(summary.includesDetails, false);
  assert.equal(summary.analysis.complete, true);
  assert.equal(summary.analysis.analyzedCodePoints, Array.from(text).length);
  assert.deepEqual(summary.categoryCounts, result.counts);
  const json = A.serializeReport(summary, 'json');
  assert.doesNotMatch(json.content, /SECRET|script>|example.invalid|filename|source|"text"|"tokens"|"hidden"|"characters"/);
  const detailed = A.buildReport(result, { details: true, language: 'en' });
  assert.equal(L.decodeEscapes(detailed.details.text).text, text);
  assert.match(detailed.details.text, /^(?:\\u\{[0-9A-F]{4,6}\})+$/);
  const output = A.serializeReport(detailed, 'md', key => M.format('ja', key));
  assert.equal(output.ok, true);
  assert.doesNotMatch(output.content, /<script>|https:\/\/example.invalid|SECRET/);
  assert.equal((output.content.match(/```/g) || []).length, 2);
  assert.equal(JSON.stringify(result), before);
  summary.categoryCounts.tag.total = 1000;
  assert.notEqual(result.counts.tag.total, 1000);
});

test('report omissions and incomplete analysis are independently recorded', () => {
  const tag = '\u{e0061}\u{e007f}';
  const result = L.analyze(('a ' + tag + ' ').repeat(1100));
  const report = A.buildReport(result, { details: true });
  assert.equal(report.analysis.complete, true);
  assert.equal(report.details.characters.length, 1000);
  assert.equal(report.details.tokens.length, 100);
  assert.equal(report.details.hidden.length, 100);
  assert.equal(report.details.omitted.characters, result.chars.length - 1000);
  assert.equal(report.details.omitted.tokens, result.tokens.length - 100);
  assert.equal(report.details.omitted.hidden, result.hidden.length - 100);
  const partial = A.buildReport(L.analyze('a'.repeat(100001)));
  assert.equal(partial.analysis.complete, false);
  assert.equal(partial.analysis.analyzedCodePoints, 100000);
  assert.equal(partial.analysis.limit, 100000);
  for (const bytes of [5242879, 5242880, 5242881]) {
    assert.equal(A.checkReportSize('a'.repeat(bytes)).ok, bytes <= 5242880);
  }
  assert.equal(A.checkReportSize('あ'.repeat(1747627)).ok, false);
});

test('new shared URLs round-trip once without leaking other state', () => {
  const cases = ['\ufeffa\r\nb', '\u{e0061}\u{e007f}', '😀\ud800\udfff', '\\u{202E}', '%41+a', '', '\\', '\0\u202e'];
  for (const text of cases) {
    const result = A.buildShareUrl(text);
    assert.equal(result.ok, true);
    assert.match(result.url, /^https:\/\/ipusiron.github.io\/weirdstring-inspector\/#v=2&mode=escape&text=/);
    assert.doesNotMatch(result.url, /[^\x00-\x7f]|source|attack_type|filename|localhost|file:/);
    const incoming = L.parseLocation('?text=ignored', new URL(result.url).hash);
    assert.equal(incoming.mode, 'escape');
    assert.equal(L.decodeEscapes(incoming.text).text, text);
  }
  assert.equal(L.parseLocation('?text=%2541', '').text, '%41');
  assert.equal(L.parseLocation('?text=q', '#text=hash').text, 'hash');
  assert.equal(L.parseLocation('', '#text=%5Cu%7B202E%7D').text, '\\u{202E}');
  for (const hash of ['#mode=escape&text=a', '#v=3&mode=escape&text=a', '#v=2&mode=plain&text=a']) {
    assert.equal(L.parseLocation('', hash).error, 'format');
  }
  const prefixLength = A.buildShareUrl('').url.length;
  for (const length of [7999, 8000, 8001]) {
    const result = A.buildShareUrl('a'.repeat(length - prefixLength));
    assert.equal(result.ok, length <= 8000);
    assert.equal(result.ok ? result.url.length : result.length, length);
  }
  let seed = 230922;
  const alphabet = ['a', '\u202e', '\\', '\r', '\n', '%', '+', '😀', '\ud800', '\u{e0061}', '\ufeff'];
  for (let run = 0; run < 300; run++) {
    let text = '';
    for (let i = 0; i < run % 41; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      text += alphabet[seed % alphabet.length];
    }
    const incoming = L.parseLocation('', new URL(A.buildShareUrl(text).url).hash);
    assert.equal(L.decodeEscapes(incoming.text).text, text);
  }
});
