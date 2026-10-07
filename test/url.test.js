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
const urls = [
[
"?text=100%25",
"（空）",
"100%",
"null",
"null",
"query"
],
[
"?text=%2541",
"（空）",
"%41",
"null",
"null",
"query"
],
[
"?text=a%2Bb",
"（空）",
"a+b",
"null",
"null",
"query"
],
[
"?text=a+b",
"（空）",
"a b",
"null",
"null",
"query"
],
[
"?text=flag%0D.txt",
"（空）",
"flag\\r.txt",
"null",
"null",
"query"
],
[
("?text=f%E2%80%8Bl&source=clipthreat-studio&attack_type=%E3%8" +
"2%BC%E3%83%AD%E5%B9%85"),
"（空）",
"f\\u{200B}l",
"clipthreat-studio",
"ゼロ幅",
"query"
],
[
"?text=query",
"#text=hash",
"hash",
"null",
"null",
"hash"
],
[
"（空）",
"#text=only%20hash&source=qr-risk-radar",
"only hash",
"qr-risk-radar",
"null",
"hash"
],
[
"?source=clipthreat-studio",
"（空）",
"null",
"null",
"null",
"null"
],
[
"?text=",
"（空）",
"（空文字列）",
"null",
"null",
"query"
],
[
"（空）",
"（空）",
"null",
"null",
"null",
"null"
]
];

test('A-14: all 11 URL cases, hash precedence and no second decoding', () => {
  assert.equal(urls.length, 11);
  for (const [search, hash, text, source, attackType, from] of urls) {
    const nullable = value => value === 'null' ? null : value === '（空文字列）' ? '' : raw(value);
    assert.deepEqual(L.parseLocation(search === '（空）' ? '' : search, hash === '（空）' ? '' : hash),
      { text: nullable(text), source: nullable(source), attackType: nullable(attackType), from: nullable(from) });
  }
  const params = new URLSearchParams({ text: 'x', attack_type: '😀'.repeat(100), source: '😀'.repeat(100) });
  const result = L.parseLocation('?' + params, '');
  assert.equal(Array.from(result.attackType).length, 60);
  assert.equal(Array.from(result.source).length, 40);
});


test('A-15: loaded content is removed from the URL; other values and anchors stay', () => {
  const cases = [
    [['?text=a&source=x', ''], { search: '', hash: '' }],
    [['', '#text=a%E2%80%AE&source=qr-risk-radar'], { search: '', hash: '' }],
    [['', '#v=2&mode=escape&text=a%5Cr'], { search: '', hash: '' }],
    [['?lang=en&text=a', '#section'], { search: '?lang=en', hash: '#section' }],
    [['?text=q', '#text=h&x=1'], { search: '', hash: '#x=1' }],
    [['?foo=1', '#bar'], { search: '?foo=1', hash: '#bar' }],
    [['', ''], { search: '', hash: '' }]
  ];
  for (const [[search, hash], expected] of cases) assert.deepEqual(L.stripLocation(search, hash), expected, search + hash);
  // script.js removes the content only after a successful load (a format error keeps the URL)
  const script = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'script.js'), 'utf8');
  const body = script.slice(script.indexOf('function parseUrlParameters'), script.indexOf('function clearIncomingUrl'));
  assert.ok(body.indexOf('clearIncomingUrl()') > body.indexOf('renderSource()'));
  assert.ok(body.indexOf('incoming.error') < body.indexOf('return;') && body.indexOf('clearIncomingUrl()') > body.lastIndexOf('return;'));
  assert.match(script, /history\.replaceState\(history\.state, '', location\.pathname \+ next\.search \+ next\.hash\)/);
});
