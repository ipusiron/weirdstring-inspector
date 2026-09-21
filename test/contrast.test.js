const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
const pairs = [
  ['text-color', 'bg-color'], ['text-color', 'box-bg'], ['heading-color', 'bg-color'], ['heading-color', 'box-bg'],
  ['muted-color', 'bg-color'], ['muted-color', 'box-bg'], ['link-color', 'bg-color'], ['link-color', 'box-bg'],
  ['button-text', 'button-bg'], ['button-text', 'button-hover-bg'], ['text-color', 'tab-bg'],
  ['danger-fg', 'danger-bg'], ['caution-fg', 'caution-bg'], ['info-fg', 'info-bg'], ['clean-fg', 'clean-bg']
];
function luminance(hex) {
  const values = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
test('15 foreground/background pairs exceed 4.5:1 in both themes', () => {
  assert.doesNotMatch(css, /--highlight-/);
  for (const selector of [':root', '[data-theme="dark"]']) {
    const start = css.indexOf(selector + ' {');
    assert.ok(start >= 0);
    const block = css.slice(start, css.indexOf('}', start));
    const vars = Object.fromEntries(Array.from(block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6});/g), m => [m[1], m[2]]));
    for (const [fg, bg] of pairs) {
      assert.ok(vars[fg] && vars[bg], selector + ': ' + fg + '/' + bg);
      const values = [luminance(vars[fg]), luminance(vars[bg])].sort((a, b) => b - a);
      assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5, selector + ': ' + fg + '/' + bg);
    }
  }
});
