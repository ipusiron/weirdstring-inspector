const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../weirdstring-logic.js');

// Decode the specification's notation independently of the implementation.
function raw(value) {
  return value.replace(/\\(?:u\{([0-9a-f]+)\}|u([0-9a-f]{4})|([\\nrt0]))/gi, (_, a, b, c) =>
    a || b ? String.fromCodePoint(parseInt(a || b, 16)) : ({ '\\': '\\', n: '\n', r: '\r', t: '\t', '0': '\0' })[c]);
}
function countsOf(result) {
  return Object.fromEntries(Object.entries(result.counts).filter(([, value]) => value.total));
}
function expectedCounts(value) {
  const counts = {};
  for (const m of value.matchAll(/([a-z]+) (\d+)（(danger|caution|info) (\d+)）/g)) {
    counts[m[1]] = { danger: 0, caution: 0, info: 0, total: Number(m[2]), [m[3]]: Number(m[4]) };
  }
  return counts;
}
function detections(result) {
  return result.chars.filter(char => char.category).map(char =>
    char.index + '=' + char.category + '/' + char.severity + '/' + char.reason +
    (char.ascii === null ? '' : '/' + JSON.stringify(char.ascii))).join(' ');
}
const escapes = [
[
"flag\\r.txt",
"flag\\r.txt",
"なし"
],
[
"a\\u200Bb",
"a\\u{200B}b",
"なし"
],
[
"a\\u{E0041}b",
"a\\u{E0041}b",
"なし"
],
[
"\\uD83D\\uDE00",
"\\u{1F600}",
"なし"
],
[
"\\x41\\x07",
"A\\u{0007}",
"なし"
],
[
"C:\\\\temp\\\\new",
"C:\\\\temp\\\\new",
"なし"
],
[
"tab\\there",
"tab\\there",
"なし"
],
[
"nul\\0end",
"nul\\u{0000}end",
"なし"
],
[
"\\n\\n",
"\\n\\n",
"なし"
],
[
"\\\\u200B",
"\\\\u200B",
"なし"
],
[
"100%",
"100%",
"なし"
],
[
"\\u{110000}",
"\\\\u{110000}",
"0:`\\u{110000}"
],
[
"\\q",
"\\\\q",
"0:`\\q"
],
[
"end\\",
"end\\\\",
"3:`\\"
],
[
"\\u12",
"\\\\u12",
"0:`\\u"
],
[
"\\u{}",
"\\\\u{}",
"0:`\\u"
]
];
const escapedInput = [
[
"flag\\r.txt",
"flag\\r.txt",
"true"
],
[
"f\\u{200B}l",
"f\\u{200B}l",
"false"
],
[
"C:\\\\temp",
"C:\\\\temp",
"false"
],
[
"a\\tb\\nc",
"a\\tb⏎c",
"false"
],
[
"a\\r\\nb",
"a\\r⏎b",
"true"
],
[
"\\u{1F600}\\u{E0158}",
"😀\\u{E0158}",
"false"
],
[
"a\\u{D800}b",
"a\\u{D800}b",
"false"
],
[
"x\\u{00A0}y\\u{3000}z",
"x\\u{00A0}y\\u{3000}z",
"false"
],
[
"\\u{0000}",
"\\0",
"false"
],
[
"caf\\u{00E9} \\u{3042}",
"café あ",
"false"
]
];

test('A-13: all 16 decoded strings and error offsets', () => {
  assert.equal(escapes.length, 16);
  for (const [input, expected, errorText] of escapes) {
    const actual = L.decodeEscapes(input);
    assert.equal(actual.text, raw(expected), input);
    const errors = errorText === 'なし' ? [] : (() => {
      const colon = errorText.indexOf(':');
      return [{ index: Number(errorText.slice(0, colon)), raw: errorText.slice(colon + 1).replace(/^`|`$/g, '') }];
    })();
    assert.deepEqual(actual.errors, errors, input);
  }
});
test('A-13: all 10 input-safe encodings and CR detection', () => {
  assert.equal(escapedInput.length, 10);
  for (const [input, escaped, needs] of escapedInput) {
    assert.equal(L.escapeForInput(raw(input)), escaped.replace(/⏎/g, '\n'), input);
    assert.equal(L.needsEscapeMode(raw(input)), needs === 'true', input);
  }
});
test('escape round trips over all 12167 triples, including lone surrogates', () => {
  const parts = ['a', '\\', 'u', '{', '}', '0', 'n', 'r', '\r', '\n', '\t', '\0',
    String.fromCodePoint(0x200b), String.fromCodePoint(0x202e), String.fromCodePoint(0xe0041), String.fromCodePoint(0xfe0f),
    String.fromCharCode(0xd800), String.fromCharCode(0xdc00), 'あ', String.fromCodePoint(0xa0), 'x', '4', '1'];
  assert.equal(parts.length, 23);
  let count = 0;
  for (const a of parts) for (const b of parts) for (const c of parts) {
    const text = a + b + c;
    assert.deepEqual(L.decodeEscapes(L.escapeForInput(text)), { text, errors: [] });
    count++;
  }
  assert.equal(count, 12167);
});

