(function (root) {
  'use strict';

  const DATA = typeof module === 'object' && module.exports ? require('./weirdstring-data.js') : root.WeirdStringData;
  const MAX_CODE_POINTS = 100000;
  const VIEW_LIMIT = 5000;
  const TABLE_LIMIT = 1000;
  const CATEGORY_ORDER = [
    'tag', 'bidi', 'variation', 'invisible', 'control', 'whitespace',
    'private', 'zalgo', 'combining', 'compat', 'lookalike', 'mixed'
  ];
  const SEVERITY_ORDER = ['danger', 'caution', 'info'];
  const SCRIPT_NAMES = (
    'Latin Cyrillic Greek Armenian Georgian Hebrew Arabic Syriac Thaana Devanagari Bengali Gurmukhi Gujarati Oriya Tamil ' +
    'Telugu Kannada Malayalam Sinhala Thai Lao Tibetan Myanmar Khmer Mongolian Ethiopic Cherokee Coptic Lisu Hangul Han ' +
    'Hiragana Katakana Bopomofo'
  ).split(' ');
  const GC_NAMES = 'Lu Ll Lt Lm Lo Mn Mc Me Nd Nl No Pc Pd Ps Pe Pi Pf Po Sm Sc Sk So Zs Zl Zp Cc Cf Cs Co Cn'.split(' ');
  const scriptPatterns = SCRIPT_NAMES.map(name => [name, new RegExp('\\p{Script=' + name + '}', 'u')]);
  const extensionPatterns = SCRIPT_NAMES.map(name => [name, new RegExp('\\p{Script_Extensions=' + name + '}', 'u')]);
  const categoryPatterns = GC_NAMES.map(name => [name, new RegExp('\\p{General_Category=' + name + '}', 'u')]);
  const skipped = new Set(['tag', 'bidi', 'variation', 'invisible']);
  const removable = new Set([...skipped, 'control', 'zalgo']);
  const joinerExcluded = new Set(['Latin', 'Cyrillic', 'Greek', 'Han', 'Hiragana', 'Katakana', 'Hangul', 'Common', 'Inherited']);
  const invisibles = new Set([
    0x00ad, 0x034f, 0x115f, 0x1160, 0x17b4, 0x17b5, 0x180e, 0x200b, 0x200c, 0x200d, 0x2060, 0x2061,
    0x2062, 0x2063, 0x2064, 0x2800, 0x3164, 0xfeff, 0xffa0, 0xfff9, 0xfffa, 0xfffb
  ]);
  const asciiMap = new Map();
  for (const [ascii, groups] of Object.entries(DATA.asciiLookalike)) {
    for (const hex of groups.join(' ').split(' ')) asciiMap.set(parseInt(hex, 16), ascii);
  }
  const abbreviations = new Map();
  const c0 = 'NUL SOH STX ETX EOT ENQ ACK BEL BS TAB LF VT FF CR SO SI DLE DC1 DC2 DC3 DC4 NAK SYN ETB CAN EM SUB ESC FS GS RS US';
  const c1 = 'PAD HOP BPH NBH IND NEL SSA ESA HTS HTJ VTS PLD PLU RI SS2 SS3 DCS PU1 PU2 STS CCH MW SPA EPA SOS SGC SCI CSI ST OSC PM APC';
  c0.split(' ').forEach((name, cp) => abbreviations.set(cp, name));
  c1.split(' ').forEach((name, index) => abbreviations.set(index + 0x80, name));
  for (const [hex, name] of Object.entries({
    '007F': 'DEL', '00A0': 'NBSP', '00AD': 'SHY', '034F': 'CGJ', '061C': 'ALM', '180E': 'MVS',
    '200B': 'ZWSP', '200C': 'ZWNJ', '200D': 'ZWJ', '200E': 'LRM', '200F': 'RLM',
    '202A': 'LRE', '202B': 'RLE', '202C': 'PDF', '202D': 'LRO', '202E': 'RLO', '202F': 'NNBSP',
    '205F': 'MMSP', '2060': 'WJ', '2066': 'LRI', '2067': 'RLI', '2068': 'FSI', '2069': 'PDI', 'FEFF': 'BOM',
    '180B': 'FVS1', '180C': 'FVS2', '180D': 'FVS3', '180F': 'FVS4'
  })) abbreviations.set(parseInt(hex, 16), name);

  function asciiLookalikeOf(cp) {
    return cp <= 0x7f ? null : asciiMap.get(cp) ?? null;
  }

  function abbrOf(cp) {
    if (cp >= 0xfe00 && cp <= 0xfe0f) return 'VS' + (cp - 0xfe00 + 1);
    if (cp >= 0xe0100 && cp <= 0xe01ef) return 'VS' + (cp - 0xe0100 + 17);
    if (cp === 0xe0020) return 'TAG:SP';
    if (cp > 0xe0020 && cp <= 0xe007e) return 'TAG:' + String.fromCodePoint(cp - 0xe0000);
    return abbreviations.get(cp) ?? null;
  }

  function scriptOf(ch) {
    for (const [name, pattern] of scriptPatterns) if (pattern.test(ch)) return name;
    if (/\p{Script=Common}/u.test(ch)) return 'Common';
    if (/\p{Script=Inherited}/u.test(ch)) return 'Inherited';
    return 'Other';
  }

  function generalCategoryOf(ch) {
    for (const [name, pattern] of categoryPatterns) if (pattern.test(ch)) return name;
    return 'Cn';
  }

  function hex(cp, width = 4) {
    return cp.toString(16).toUpperCase().padStart(width, '0');
  }

  function describeCodePoint(cp) {
    const ch = String.fromCodePoint(cp);
    return {
      codePoint: 'U+' + hex(cp), abbr: abbrOf(cp), script: scriptOf(ch), generalCategory: generalCategoryOf(ch),
      utf8: Array.from(new TextEncoder().encode(ch), byte => hex(byte, 2)).join(' '),
      utf16: ch.split('').map(unit => hex(unit.charCodeAt(0))).join(' '), escape: '\\u{' + hex(cp) + '}'
    };
  }

  function isJapanese(ch, cp) {
    return (cp >= 0x3000 && cp <= 0x303f) || [0x30a0, 0x30fb, 0x30fc].includes(cp) ||
      (cp >= 0xff01 && cp <= 0xff5e && !/[A-Za-z0-9]/.test(ch.normalize('NFKC'))) ||
      (cp >= 0xff5f && cp <= 0xff65) ||
      /[\p{Script_Extensions=Han}\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}]/u.test(ch);
  }

  // The order here is part of the classification contract.
  function classify(ch, next) {
    const cp = ch.codePointAt(0);
    const result = { category: null, severity: 'none', reason: null, ascii: null, newline: false };
    const found = (category, severity, reason, ascii = null) => ({ ...result, category, severity, reason, ascii });
    if (cp >= 0xe0000 && cp <= 0xe007f) return found('tag', 'danger', 'tagRun');
    if ((cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x2069)) return found('bidi', 'danger', 'bidiFormat');
    if ([0x200e, 0x200f, 0x061c].includes(cp)) return found('bidi', 'caution', 'bidiMark');
    if ((cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0100 && cp <= 0xe01ef) ||
        (cp >= 0x180b && cp <= 0x180d) || cp === 0x180f) return found('variation', 'info', 'variationSingle');
    if (cp === 0x0a || (cp === 0x0d && next === '\n')) return { ...result, newline: true };
    if (cp === 9) return found('whitespace', 'info', 'tab');
    if (cp <= 0x1f || (cp >= 0x7f && cp <= 0x9f)) return found('control', 'caution', cp === 13 ? 'loneCr' : 'control');
    if (invisibles.has(cp)) return found('invisible', 'caution', 'invisible');
    if (cp === 0x2028 || cp === 0x2029) return found('whitespace', 'caution', 'lineSeparator');
    if (cp !== 32 && /\p{Zs}/u.test(ch)) return found('whitespace', 'caution', 'specialSpace');
    if (/\p{Default_Ignorable_Code_Point}/u.test(ch)) return found('invisible', 'caution', 'invisible');
    if (cp >= 0xd800 && cp <= 0xdfff) return found('private', 'caution', 'surrogate');
    if (/\p{Noncharacter_Code_Point}/u.test(ch)) return found('private', 'caution', 'nonchar');
    if (/\p{Co}/u.test(ch)) return found('private', 'caution', 'pua');
    if (/[\p{Mn}\p{Me}]/u.test(ch)) return found('combining', 'info', 'combining');
    if (cp <= 0x7f || isJapanese(ch, cp)) return result;
    const normalized = ch.normalize('NFKC');
    if (cp >= 0xff01 && cp <= 0xff5e) return found('compat', 'info', 'fullwidth', normalized);
    if (/^[\x20-\x7e]+$/.test(normalized) && /[A-Za-z0-9]/.test(normalized)) {
      return found('compat', 'caution', 'compat', normalized);
    }
    const ascii = asciiLookalikeOf(cp);
    return ascii === null ? result : found('lookalike', 'info', 'lookalike', ascii);
  }

  function comparableChar(char) {
    if (removable.has(char.category) && ['danger', 'caution'].includes(char.severity)) return '';
    if (char.category === 'whitespace') return char.cp === 9 ? '\t' : ' ';
    if (['compat', 'lookalike'].includes(char.category) && char.ascii !== null) return char.ascii;
    if (char.cp >= 0xff01 && char.cp <= 0xff5e) return char.ch.normalize('NFKC');
    return char.ch;
  }

  function runsOf(chars, category) {
    const runs = [];
    for (let i = 0; i < chars.length; i++) {
      if (chars[i].category !== category) continue;
      const start = i;
      while (i + 1 < chars.length && chars[i + 1].category === category) i++;
      runs.push(chars.slice(start, i + 1));
    }
    return runs;
  }

  function hiddenContent(chars) {
    const hidden = [];
    for (const run of runsOf(chars, 'tag')) {
      const start = run[0].index;
      const emojiFlag = chars[start - 1]?.cp === 0x1f3f4 && run.length > 1 && run.at(-1).cp === 0xe007f &&
        run.slice(0, -1).every(char => (char.cp >= 0xe0030 && char.cp <= 0xe0039) || (char.cp >= 0xe0061 && char.cp <= 0xe007a));
      for (const char of run) {
        char.reason = emojiFlag ? 'emojiFlag' : 'tagRun';
        char.severity = emojiFlag ? 'info' : 'danger';
      }
      hidden.push({
        kind: emojiFlag ? 'emojiFlag' : 'tag', start, end: run.at(-1).index, count: run.length,
        text: run.filter(char => char.cp >= 0xe0020 && char.cp <= 0xe007e)
          .map(char => String.fromCodePoint(char.cp - 0xe0000)).join(''), bytes: null
      });
    }
    for (const run of runsOf(chars, 'variation')) {
      if (run.length < 2) continue;
      const bytes = [];
      for (const char of run) {
        char.severity = 'danger';
        char.reason = 'variationRun';
        if (char.cp >= 0xfe00 && char.cp <= 0xfe0f) bytes.push(char.cp - 0xfe00);
        if (char.cp >= 0xe0100 && char.cp <= 0xe01ef) bytes.push(char.cp - 0xe0100 + 16);
      }
      let text = null;
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f]/.test(text)) text = null;
      } catch { /* Invalid UTF-8 remains a byte sequence. */ }
      hidden.push({ kind: 'variation', start: run[0].index, end: run.at(-1).index, count: run.length,
        text, bytes: bytes.map(byte => hex(byte, 2)).join(' ') });
    }
    return hidden.sort((a, b) => a.start - b.start);
  }

  function contextualize(chars) {
    const left = [];
    const right = [];
    let neighbor = null;
    for (let i = 0; i < chars.length; i++) {
      left[i] = neighbor;
      if (!skipped.has(chars[i].category)) neighbor = chars[i];
    }
    neighbor = null;
    for (let i = chars.length - 1; i >= 0; i--) {
      right[i] = neighbor;
      if (!skipped.has(chars[i].category)) neighbor = chars[i];
    }
    const betweenAscii = i => Boolean(left[i] && right[i] && /^[A-Za-z0-9]$/.test(left[i].ch) && /^[A-Za-z0-9]$/.test(right[i].ch));
    const joinerNeighbor = char => char && char.cp > 0x7f && /[\p{L}\p{M}]/u.test(char.ch) && !joinerExcluded.has(scriptOf(char.ch));
    for (const char of chars) {
      const i = char.index;
      if (char.category !== 'invisible') continue;
      let prev = i - 1;
      while (prev >= 0 && chars[prev].category === 'variation') prev--;
      if (char.cp === 0x200d && chars[prev] && /[\p{Extended_Pictographic}\p{Emoji_Modifier}]/u.test(chars[prev].ch) &&
          chars[i + 1] && /\p{Extended_Pictographic}/u.test(chars[i + 1].ch)) {
        char.severity = 'info';
        char.reason = 'emojiZwj';
      } else if ([0x200c, 0x200d].includes(char.cp) && joinerNeighbor(chars[i - 1]) && joinerNeighbor(chars[i + 1])) {
        char.severity = 'info';
        char.reason = 'scriptJoiner';
      } else if (char.cp === 0xfeff && i === 0) {
        char.severity = 'info';
        char.reason = 'leadingBom';
      } else if (betweenAscii(i)) {
        char.severity = 'danger';
        char.reason = 'splitsAsciiWord';
      }
    }
    for (const run of runsOf(chars, 'combining')) {
      const reason = run.length >= 5 ? 'markRunOver4' :
        run.some((char, i) => i > 0 && run[i - 1].cp === char.cp) ? 'sameMarkRepeated' : null;
      if (reason) for (const char of run) Object.assign(char, { category: 'zalgo', severity: 'caution', reason });
    }
    return betweenAscii;
  }

  function scriptSet(ch) {
    const names = extensionPatterns.filter(([, pattern]) => pattern.test(ch)).map(([name]) => name);
    if (names.includes('Han')) names.push('Hanb', 'Jpan', 'Kore');
    if (names.includes('Hiragana') || names.includes('Katakana')) names.push('Jpan');
    if (names.includes('Hangul')) names.push('Kore');
    if (names.includes('Bopomofo')) names.push('Hanb');
    if (names.length) return new Set(names);
    return /[\p{Script=Common}\p{Script=Inherited}]/u.test(ch) ? null : new Set(['Other']);
  }

  function intersection(sets) {
    let common = null;
    for (const set of sets) {
      if (set === null) continue;
      common = common === null ? new Set(set) : new Set([...common].filter(name => set.has(name)));
    }
    return common;
  }

  function tokenize(chars) {
    const groups = [];
    let current = [];
    for (const char of chars) {
      if (skipped.has(char.category)) continue;
      if (/[\p{L}\p{M}\p{N}]/u.test(char.ch)) current.push(char);
      else if (current.length) { groups.push(current); current = []; }
    }
    if (current.length) groups.push(current);
    const setsCache = new Map();
    const scriptsCache = new Map();
    const tokens = groups.map(group => {
      const frequencies = new Map();
      const sets = group.map(char => {
        if (!setsCache.has(char.ch)) setsCache.set(char.ch, scriptSet(char.ch));
        if (!scriptsCache.has(char.ch)) scriptsCache.set(char.ch, scriptOf(char.ch));
        const script = scriptsCache.get(char.ch);
        if (/[\p{L}\p{N}]/u.test(char.ch) && !['Common', 'Inherited'].includes(script)) {
          frequencies.set(script, (frequencies.get(script) || 0) + 1);
        }
        return setsCache.get(char.ch);
      });
      const common = intersection(sets);
      const cjk = intersection(sets.filter(set => !(set?.size === 1 && set.has('Latin'))));
      const level = group.every(char => char.cp <= 0x7f) ? 'ascii' : common === null || common.size ? 'single' :
        cjk && ['Jpan', 'Hanb', 'Kore'].some(name => cjk.has(name)) ? 'cjkLatin' : 'mixed';
      const letters = group.filter(char => /\p{L}/u.test(char.ch));
      const wholeScriptConfusable = level === 'single' && letters.length >= 2 && letters.every(char => char.category === 'lookalike');
      const majorityScript = level === 'mixed' ? [...frequencies].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null : null;
      return { start: group[0].index, end: group.at(-1).index, text: group.map(char => char.ch).join(''),
        scripts: [...frequencies.keys()], level, majorityScript, hasAsciiLetter: group.some(char => /[A-Za-z]/.test(char.ch)),
        wholeScriptConfusable, comparable: '', group };
    });
    const hasAsciiToken = tokens.some(token => token.level === 'ascii' && token.hasAsciiLetter);
    for (const token of tokens) {
      for (const char of token.group) {
        if (char.category === 'lookalike') {
          char.reason = token.level === 'mixed' ? 'lookalikeInMixedToken' : token.wholeScriptConfusable ?
            'wholeScriptConfusable' : token.hasAsciiLetter ? 'lookalikeInAsciiWord' : 'lookalike';
          char.severity = token.level === 'mixed' || (token.wholeScriptConfusable && hasAsciiToken) ? 'danger' :
            token.hasAsciiLetter ? 'caution' : 'info';
        } else if (token.level === 'mixed' && char.category === null && /[\p{L}\p{N}]/u.test(char.ch)) {
          const script = scriptsCache.get(char.ch);
          if (!['Common', 'Inherited', token.majorityScript].includes(script)) {
            Object.assign(char, { category: 'mixed', severity: 'danger', reason: 'minorityScript' });
          }
        }
      }
    }
    return tokens;
  }

  function checkBidi(chars) {
    const bidi = { formatCount: 0, markCount: 0, overrideCount: 0, unclosed: [], orphans: [] };
    let stack = [];
    for (const char of chars) {
      if ([10, 13, 0x2029, 0x85, 0x1c, 0x1d, 0x1e].includes(char.cp)) {
        bidi.unclosed.push(...stack.map(entry => entry.index));
        stack = [];
      }
      if (char.category !== 'bidi') continue;
      if (char.reason === 'bidiMark') { bidi.markCount++; continue; }
      bidi.formatCount++;
      if ([0x202d, 0x202e].includes(char.cp)) bidi.overrideCount++;
      if ([0x202a, 0x202b, 0x202d, 0x202e].includes(char.cp)) stack.push({ index: char.index, isolate: false });
      else if ([0x2066, 0x2067, 0x2068].includes(char.cp)) stack.push({ index: char.index, isolate: true });
      else if (char.cp === 0x202c) {
        if (stack.length && !stack.at(-1).isolate) stack.pop();
        else bidi.orphans.push(char.index);
      } else {
        const last = stack.findLastIndex(entry => entry.isolate);
        if (last < 0) bidi.orphans.push(char.index);
        else stack.splice(last);
      }
    }
    bidi.unclosed.push(...stack.map(entry => entry.index));
    bidi.unclosed.sort((a, b) => a - b);
    return bidi;
  }

  function analyze(input) {
    const points = [];
    let truncated = false;
    for (const ch of input) {
      if (points.length === MAX_CODE_POINTS) { truncated = true; break; }
      points.push(ch);
    }
    let offset = 0;
    const cache = new Map();
    const chars = points.map((ch, index) => {
      const cacheKey = ch === '\r' ? ch + points[index + 1] : ch;
      if (!cache.has(cacheKey)) cache.set(cacheKey, classify(ch, points[index + 1]));
      const char = { index, offset, cp: ch.codePointAt(0), ch, ...cache.get(cacheKey) };
      offset += ch.length;
      return char;
    });
    const hidden = hiddenContent(chars);
    const betweenAscii = contextualize(chars);
    const tokens = tokenize(chars);
    for (const char of chars) {
      const japanese = isJapanese(char.ch, char.cp);
      if (!japanese && !(char.category === 'lookalike' && char.reason === 'lookalike')) continue;
      const ascii = [0x3002, 0xff0e, 0xff61].includes(char.cp) ? '.' : char.cp >= 0xff01 && char.cp <= 0xff5e ?
        char.ch.normalize('NFKC') : asciiLookalikeOf(char.cp);
      if (ascii && ['.', '/', ':', '@', '?', '#', '\\'].includes(ascii) && betweenAscii(char.index)) {
        Object.assign(char, { category: 'lookalike', severity: 'danger', reason: 'urlDelimiterLookalike', ascii });
      }
    }
    for (const token of tokens) {
      token.comparable = token.group.map(comparableChar).join('');
      delete token.group;
    }
    const counts = Object.fromEntries(CATEGORY_ORDER.map(category => [category, { danger: 0, caution: 0, info: 0, total: 0 }]));
    for (const char of chars) if (char.category) { counts[char.category][char.severity]++; counts[char.category].total++; }
    const verdict = SEVERITY_ORDER.find(severity => chars.some(char => char.severity === severity)) || 'clean';
    const text = points.join('');
    const comparable = chars.map(comparableChar).join('');
    const normalization = Object.fromEntries(['NFC', 'NFD', 'NFKC', 'NFKD'].map(form => {
      const normalized = text.normalize(form);
      return [form, { same: normalized === text, codePoints: Array.from(normalized).length }];
    }));
    return { truncated, text, length: { codePoints: points.length, utf16: text.length, utf8: new TextEncoder().encode(text).length },
      chars, tokens, hidden, bidi: checkBidi(chars), counts, verdict, comparable, comparableDiffers: comparable !== text, normalization };
  }

  function decodeEscapes(input) {
    const parts = [];
    const errors = [];
    const simple = { '\\': '\\', n: '\n', r: '\r', t: '\t', '0': '\0' };
    for (let i = 0; i < input.length;) {
      if (input[i] !== '\\') { parts.push(input[i++]); continue; }
      const index = i;
      const tail = input.slice(i);
      const braced = tail.match(/^\\u\{([0-9a-fA-F]{1,6})\}/);
      const fixed = tail.match(/^\\u([0-9a-fA-F]{4})/) || tail.match(/^\\x([0-9a-fA-F]{2})/);
      if (Object.hasOwn(simple, input[i + 1])) {
        parts.push(simple[input[i + 1]]); i += 2;
      } else if (braced && parseInt(braced[1], 16) <= 0x10ffff) {
        parts.push(String.fromCodePoint(parseInt(braced[1], 16))); i += braced[0].length;
      } else if (fixed) {
        parts.push(String.fromCharCode(parseInt(fixed[1], 16))); i += fixed[0].length;
      } else {
        const raw = braced ? braced[0] : input.slice(i, i + 2);
        errors.push({ index, raw }); parts.push(raw); i += raw.length;
      }
    }
    return { text: parts.join(''), errors };
  }

  function escapeForInput(text) {
    const parts = [];
    for (const ch of text) {
      const cp = ch.codePointAt(0);
      if (ch === '\\') parts.push('\\\\');
      else if (cp === 10) parts.push('\n');
      else if (cp === 13) parts.push('\\r');
      else if (cp === 9) parts.push('\\t');
      else if (cp === 0) parts.push('\\0');
      else if (['tag', 'bidi', 'variation', 'invisible', 'control', 'whitespace', 'private'].includes(classify(ch).category)) {
        parts.push('\\u{' + hex(cp) + '}');
      } else parts.push(ch);
    }
    return parts.join('');
  }

  function needsEscapeMode(text) {
    return text.includes('\r');
  }

  function parseLocation(search, hash) {
    const fragment = new URLSearchParams(hash.replace(/^#/, ''));
    const query = new URLSearchParams(search.replace(/^\?/, ''));
    const params = fragment.has('text') ? fragment : query.has('text') ? query : null;
    if (!params) return { text: null, source: null, attackType: null, from: null };
    const clipped = (key, limit) => params.has(key) ? Array.from(params.get(key)).slice(0, limit).join('') : null;
    return { text: params.get('text'), source: clipped('source', 40), attackType: clipped('attack_type', 60),
      from: params === fragment ? 'hash' : 'query' };
  }

  const API = {
    MAX_CODE_POINTS, VIEW_LIMIT, TABLE_LIMIT, CATEGORY_ORDER, SEVERITY_ORDER,
    asciiLookalikeOf, abbrOf, scriptOf, generalCategoryOf, describeCodePoint,
    analyze, decodeEscapes, escapeForInput, needsEscapeMode, parseLocation
  };
  if (typeof module === 'object' && module.exports) {
    module.exports = API;
  } else {
    root.WeirdStringLogic = API;
  }
})(typeof self !== 'undefined' ? self : this);
