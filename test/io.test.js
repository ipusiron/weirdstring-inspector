const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../weirdstring-actions.js');
const L = require('../weirdstring-logic.js');

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
