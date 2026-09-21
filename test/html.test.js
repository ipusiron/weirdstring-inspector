const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
test('CSP, local classic scripts and safe markup', () => {
  const csp = html.match(/<meta http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)[1];
  assert.equal(csp, "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'");
  assert.doesNotMatch(csp, /frame-ancestors|unsafe-inline|unsafe-eval|data:|blob:/);
  assert.match(html, /<meta name="referrer" content="no-referrer"/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1"/);
  assert.match(html, /<noscript>/);
  assert.doesNotMatch(html, /\son[a-z]+\s*=|\sstyle\s*=|type="module"|rel="icon"|id="resultArea"/i);
  assert.doesNotMatch(html, /<(?:script|link|img)\b[^>]*(?:src|href)="https?:/i);
  assert.deepEqual(Array.from(html.matchAll(/<script src="([^"]+)"/g), m => m[1]), [
    'weirdstring-data.js', 'weirdstring-messages.js', 'weirdstring-logic.js', 'samples.js', 'script.js'
  ]);
  for (const tag of html.match(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(tag, /rel="noopener noreferrer"/);
});
test('input, result panels, accessible tabs and native help dialog', () => {
  const ids = [
    'inputText', 'mode-plain', 'mode-escape', 'to-escape', 'to-plain', 'clear-input', 'input-stats', 'input-message',
    'source-info', 'verdict', 'summaryList', 'view-rendered', 'view-logical', 'char-detail', 'hidden-panel', 'token-panel',
    'comparable-panel', 'comparable-text', 'copy-comparable', 'normalization-panel', 'char-table', 'table-all', 'status',
    'sample-tabs', 'sampleListArea', 'help-button', 'theme-toggle', 'help-modal'
  ];
  for (const id of ids) assert.equal(html.match(new RegExp('id="' + id + '"', 'g')).length, 1, id);
  assert.match(html, /<dialog id="help-modal"[^>]*aria-labelledby="help-title"/);
  assert.equal((html.match(/role="tablist"/g) || []).length, 1);
  assert.equal((html.match(/role="tab"/g) || []).length, 11);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 1);
  assert.deepEqual(Array.from(html.matchAll(/data-category="([^"]+)"/g), m => m[1]), Object.keys(require('../samples.js')));
  assert.match(html, /<label for="inputText">/);
  assert.match(html, /<textarea[^>]*maxlength="200000"[^>]*spellcheck="false"/);
  for (const id of ['verdict', 'input-message', 'status']) assert.match(html, new RegExp('id="' + id + '"[^>]*role="status"'));
  for (const id of ['summaryList', 'char-detail']) assert.match(html, new RegExp('id="' + id + '"[^>]*aria-live="polite"'));
});
