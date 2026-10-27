const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

// theme-init.js を、保存値と OS 設定を差し替えた仮の window で動かし、付いた data-theme を返す。
function run({ saved = null, prefersDark = false, storageThrows = false } = {}) {
  const attributes = {};
  const window = {
    localStorage: { getItem: () => { if (storageThrows) throw new Error('blocked'); return saved; } },
    matchMedia: () => ({ matches: prefersDark }),
    document: { documentElement: { setAttribute: (name, value) => { attributes[name] = value; } } },
  };
  vm.runInNewContext(read('theme-init.js'), { window });
  return attributes['data-theme'];
}

test('theme-init: 保存値がなければ OS の設定に従う', () => {
  assert.equal(run({ prefersDark: true }), 'dark');
  assert.equal(run({ prefersDark: false }), 'light');
});

test('theme-init: 保存値は OS の設定より優先する', () => {
  assert.equal(run({ saved: 'light', prefersDark: true }), 'light');
  assert.equal(run({ saved: 'dark', prefersDark: false }), 'dark');
});

test('theme-init: 想定外の保存値は無視して OS の設定に従う', () => {
  assert.equal(run({ saved: 'blue', prefersDark: true }), 'dark');
  assert.equal(run({ saved: 'blue', prefersDark: false }), 'light');
});

test('theme-init: localStorage が使えなくても落ちず、OS の設定に従う', () => {
  assert.equal(run({ storageThrows: true, prefersDark: true }), 'dark');
  assert.equal(run({ storageThrows: true, prefersDark: false }), 'light');
});

test('theme-init: index.html の <head> で、stylesheet のあとに同期で読み込む', () => {
  const html = read('index.html');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.ok(head.includes('<script src="theme-init.js"></script>'), '<head> に theme-init.js がない');
  assert.ok(head.indexOf('style.css') < head.indexOf('theme-init.js'));
});

test('theme-init: script.js は初回にテーマを決め直さず、<head> で付けた値に合わせる', () => {
  const script = read('script.js');
  assert.doesNotMatch(script, /prefers-color-scheme/);
  assert.doesNotMatch(script, /localStorage\.getItem\('theme'\)/);
  assert.match(script, /function initTheme\(\) \{\s*updateThemeIcon\(document\.documentElement\.getAttribute\('data-theme'\)\);/);
});
