#!/usr/bin/env node
// tools/unicode/confusables.txt（Unicode 公式・UTS #39）から、
// 「ASCII に見える非 ASCII 文字」の表 weirdstring-data.js を生成する。
//
//   node tools/build-confusables.js          weirdstring-data.js を書き出す
//   node tools/build-confusables.js --check  生成結果と現在のファイルを比べる（差があれば終了コード 1）
//
// 依存パッケージなし。出力は入力だけで決まる（実行環境の Unicode の版に依存しない）。
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SOURCE_PATH = path.join(__dirname, 'unicode', 'confusables.txt');
const OUTPUT_PATH = path.join(__dirname, '..', 'weirdstring-data.js');
const CHUNK_WIDTH = 100;

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, '\n');
}

// confusables.txt を読み、「元のコードポイント → 原型（コードポイントの配列）」の Map を返す
function parseConfusables(sourceText) {
  const map = new Map();
  let version = null;
  let date = null;
  for (const rawLine of normalizeNewlines(sourceText).split('\n')) {
    const line = rawLine.replace(/^﻿/, '');
    const versionMatch = line.match(/^# Version: (\d+\.\d+\.\d+)/);
    if (versionMatch) version = versionMatch[1];
    const dateMatch = line.match(/^# Date: (\d{4}-\d{2}-\d{2})/);
    if (dateMatch) date = dateMatch[1];
    const body = line.split('#')[0].trim();
    if (!body) continue;
    const fields = body.split(';').map((field) => field.trim());
    const source = fields[0].split(/\s+/).map((hex) => parseInt(hex, 16));
    if (source.length !== 1) throw new Error('元が複数のコードポイント: ' + line);
    map.set(source[0], fields[1].split(/\s+/).map((hex) => parseInt(hex, 16)));
  }
  if (!version || !date) throw new Error('Version または Date の行が見つからない');
  return { map, version, date };
}

function isPrintableAscii(codePoint) {
  return codePoint >= 0x21 && codePoint <= 0x7e;
}

// 非 ASCII の 1 文字が「ASCII のどの文字（列）に見えるか」を決める。
// 1. 原型が ASCII の 1 文字なら、その文字
// 2. 原型が ASCII のどれかの文字の原型と同じなら、その ASCII 文字（例: 原型 "rn" → "m"）
// 3. 原型がすべて ASCII なら、その文字列（例: U+0491 → "r'"）
// 4. どれでもなければ対象外
function buildAsciiLookalikes(map) {
  const asciiByPrototype = new Map();
  for (let ascii = 0x21; ascii <= 0x7e; ascii++) {
    const key = (map.get(ascii) || [ascii]).join(',');
    if (!asciiByPrototype.has(key)) asciiByPrototype.set(key, ascii);
  }
  const result = new Map();
  for (const [source, prototype] of map) {
    if (source <= 0x7f) continue;
    let lookalike = null;
    if (prototype.length === 1 && isPrintableAscii(prototype[0])) {
      lookalike = String.fromCodePoint(prototype[0]);
    } else if (asciiByPrototype.has(prototype.join(','))) {
      lookalike = String.fromCodePoint(asciiByPrototype.get(prototype.join(',')));
    } else if (prototype.every(isPrintableAscii)) {
      lookalike = String.fromCodePoint(...prototype);
    }
    if (lookalike !== null) result.set(source, lookalike);
  }
  return result;
}

function chunk(words, width) {
  const lines = [];
  let current = '';
  for (const word of words) {
    if (current && current.length + 1 + word.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// 生成するファイルの中身（文字列）を返す。テストからも呼ぶ
function build(sourceText) {
  const { map, version, date } = parseConfusables(sourceText);
  const lookalikes = buildAsciiLookalikes(map);
  const byTarget = new Map();
  for (const [source, target] of lookalikes) {
    if (!byTarget.has(target)) byTarget.set(target, []);
    byTarget.get(target).push(source);
  }
  const targets = [...byTarget.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const out = [];
  out.push('// このファイルは tools/build-confusables.js が生成する。手で編集しない。');
  out.push('// 出所: Unicode confusables.txt Version ' + version + '（Date: ' + date + '）。UTS #39 Unicode Security Mechanisms。');
  out.push('// © Unicode, Inc. Unicode License V3（tools/unicode/LICENSE-UNICODE.txt）のもとで利用している。');
  out.push('// 中身: 「ASCII に見える文字（列）」→ その文字に見える非 ASCII のコードポイント（16 進・昇順・空白区切り）。');
  out.push('(function (root) {');
  out.push("  'use strict';");
  out.push('  var DATA = {');
  out.push("    unicodeVersion: '" + version + "',");
  out.push("    sourceDate: '" + date + "',");
  out.push('    count: ' + lookalikes.size + ',');
  out.push('    asciiLookalike: {');
  targets.forEach((target, index) => {
    const words = byTarget.get(target).sort((a, b) => a - b).map((codePoint) => codePoint.toString(16));
    const lines = chunk(words, CHUNK_WIDTH);
    out.push('      ' + JSON.stringify(target) + ': [');
    lines.forEach((line, lineIndex) => {
      out.push('        ' + JSON.stringify(line) + (lineIndex < lines.length - 1 ? ',' : ''));
    });
    out.push('      ]' + (index < targets.length - 1 ? ',' : ''));
  });
  out.push('    }');
  out.push('  };');
  out.push("  if (typeof module === 'object' && module.exports) {");
  out.push('    module.exports = DATA;');
  out.push('  } else {');
  out.push('    root.WeirdStringData = DATA;');
  out.push('  }');
  out.push("})(typeof self !== 'undefined' ? self : this);");
  return out.join('\n') + '\n';
}

function main(argv) {
  const generated = build(fs.readFileSync(SOURCE_PATH, 'utf8'));
  if (argv.includes('--check')) {
    const current = fs.existsSync(OUTPUT_PATH) ? normalizeNewlines(fs.readFileSync(OUTPUT_PATH, 'utf8')) : '';
    if (current === generated) {
      console.log('差分なし: weirdstring-data.js は tools/unicode/confusables.txt から生成したものと一致する');
      return 0;
    }
    console.error('差分あり: weirdstring-data.js が生成結果と一致しない。node tools/build-confusables.js で作り直すこと');
    return 1;
  }
  fs.writeFileSync(OUTPUT_PATH, generated);
  console.log('書き出した: ' + path.relative(process.cwd(), OUTPUT_PATH));
  return 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { build, parseConfusables, buildAsciiLookalikes, normalizeNewlines };
