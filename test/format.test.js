const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
test('source remains readable and non-minified', () => {
  const files = [];
  for (const dir of ['', 'test', 'tools']) {
    for (const file of fs.readdirSync(path.join(root, dir))) {
      if (/\.(js|css|html)$/.test(file)) files.push(path.join(dir, file));
    }
  }
  for (const file of files) {
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
    const max = file.endsWith('.html') ? 250 : 160;
    lines.forEach((line, index) => assert.ok(line.length <= max, file + ':' + (index + 1) + ' length=' + line.length));
  }
  const minimum = { 'index.html': 150, 'script.js': 250, 'style.css': 300,
    'weirdstring-logic.js': 300, 'weirdstring-messages.js': 100, 'samples.js': 150 };
  for (const [file, count] of Object.entries(minimum)) {
    assert.ok(fs.readFileSync(path.join(root, file), 'utf8').split('\n').length >= count, file);
  }
});
