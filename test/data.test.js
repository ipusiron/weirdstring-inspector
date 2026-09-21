const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const L = require('../weirdstring-logic.js');
const DATA = require('../weirdstring-data.js');
const { build } = require('../tools/build-confusables.js');
const ascii = [
[
"U+0430",
"\"a\""
],
[
"U+0440",
"\"p\""
],
[
"U+04CF",
"\"l\""
],
[
"U+0435",
"\"e\""
],
[
"U+043E",
"\"o\""
],
[
"U+0441",
"\"c\""
],
[
"U+0445",
"\"x\""
],
[
"U+0443",
"\"y\""
],
[
"U+0456",
"\"i\""
],
[
"U+0458",
"\"j\""
],
[
"U+0501",
"\"d\""
],
[
"U+0410",
"\"A\""
],
[
"U+03B1",
"\"a\""
],
[
"U+03BF",
"\"o\""
],
[
"U+0391",
"\"A\""
],
[
"U+217C",
"\"l\""
],
[
"U+0131",
"\"i\""
],
[
"U+0491",
"\"r'\""
],
[
"U+0627",
"\"l\""
],
[
"U+2024",
"\".\""
],
[
"U+2044",
"\"/\""
],
[
"U+2215",
"\"/\""
],
[
"U+2010",
"\"-\""
],
[
"U+2212",
"\"-\""
],
[
"U+2019",
"\"'\""
],
[
"U+201C",
"\"\\\"\""
],
[
"U+2026",
"\"...\""
],
[
"U+00D7",
"\"x\""
],
[
"U+30CE",
"\"/\""
],
[
"U+FF41",
"\"a\""
],
[
"U+FF0E",
"\".\""
],
[
"U+1D400",
"\"A\""
],
[
"U+043B",
"null"
],
[
"U+0631",
"null"
],
[
"U+03C7",
"null"
],
[
"U+03D5",
"null"
],
[
"U+3002",
"null"
],
[
"U+3042",
"null"
],
[
"U+00E9",
"null"
]
];

test('four immutable inputs match their supplied SHA-256 and generator', () => {
  const hashes = {
    'tools/unicode/confusables.txt': '6ed3ee967c9dfdf6677d563c9985182fbc50a2efb7d6059cd57b2e2ce18f5b92',
    'tools/unicode/LICENSE-UNICODE.txt': 'e7a93b009565cfce55919a381437ac4db883e9da2126fa28b91d12732bc53d96',
    'tools/build-confusables.js': 'f1e68ca35d545e22534a3d4bcce1a0b77600a3a640d2a8a60141b0d5ff36b38c',
    'weirdstring-data.js': 'b4b67995e06d3f9b0dcc6621bb2691bb628e7f5bcb6eb9b913894ef8bb95e28e'
  };
  for (const [file, expected] of Object.entries(hashes)) {
    const text = fs.readFileSync(path.join(__dirname, '..', file), 'utf8').replace(/\r\n/g, '\n');
    assert.equal(crypto.createHash('sha256').update(text).digest('hex'), expected, file);
  }
  assert.equal(build(fs.readFileSync(path.join(__dirname, '../tools/unicode/confusables.txt'), 'utf8')),
    fs.readFileSync(path.join(__dirname, '../weirdstring-data.js'), 'utf8').replace(/\r\n/g, '\n'));
});
test('Unicode 18.0.0: 2249 unique non-ASCII values and 423 targets', () => {
  assert.equal(DATA.unicodeVersion, '18.0.0');
  assert.equal(DATA.sourceDate, '2026-08-06');
  assert.equal(DATA.count, 2249);
  assert.equal(Object.keys(DATA.asciiLookalike).length, 423);
  const seen = new Set();
  for (const groups of Object.values(DATA.asciiLookalike)) for (const group of groups) {
    assert.match(group, /^[0-9a-f]+(?: [0-9a-f]+)*$/);
    for (const hex of group.split(' ')) {
      const cp = parseInt(hex, 16);
      assert.ok(cp > 127);
      assert.ok(!seen.has(cp));
      seen.add(cp);
    }
  }
  assert.equal(seen.size, 2249);
});
test('A-3: all 39 mappings and ASCII exclusion', () => {
  assert.equal(ascii.length, 39);
  for (const [point, expected] of ascii) {
    assert.equal(L.asciiLookalikeOf(parseInt(point.slice(2), 16)), JSON.parse(expected), point);
  }
  for (let cp = 0; cp <= 127; cp++) assert.equal(L.asciiLookalikeOf(cp), null);
});

