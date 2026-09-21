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
const description = [
[
"U+0041",
"null",
"Latin",
"Lu",
"41",
"0041",
"\\u{0041}"
],
[
"U+0031",
"null",
"Common",
"Nd",
"31",
"0031",
"\\u{0031}"
],
[
"U+0020",
"null",
"Common",
"Zs",
"20",
"0020",
"\\u{0020}"
],
[
"U+0009",
"TAB",
"Common",
"Cc",
"09",
"0009",
"\\u{0009}"
],
[
"U+00A0",
"NBSP",
"Common",
"Zs",
"C2 A0",
"00A0",
"\\u{00A0}"
],
[
"U+200B",
"ZWSP",
"Common",
"Cf",
"E2 80 8B",
"200B",
"\\u{200B}"
],
[
"U+2028",
"null",
"Common",
"Zl",
"E2 80 A8",
"2028",
"\\u{2028}"
],
[
"U+0301",
"null",
"Inherited",
"Mn",
"CC 81",
"0301",
"\\u{0301}"
],
[
"U+3042",
"null",
"Hiragana",
"Lo",
"E3 81 82",
"3042",
"\\u{3042}"
],
[
"U+30FC",
"null",
"Common",
"Lm",
"E3 83 BC",
"30FC",
"\\u{30FC}"
],
[
"U+1F600",
"null",
"Common",
"So",
"F0 9F 98 80",
"D83D DE00",
"\\u{1F600}"
],
[
"U+E000",
"null",
"Other",
"Co",
"EE 80 80",
"E000",
"\\u{E000}"
],
[
"U+E0041",
"TAG:A",
"Common",
"Cf",
"F3 A0 81 81",
"DB40 DC41",
"\\u{E0041}"
],
[
"U+FE0F",
"VS16",
"Inherited",
"Mn",
"EF B8 8F",
"FE0F",
"\\u{FE0F}"
],
[
"U+FFFE",
"null",
"Other",
"Cn",
"EF BF BE",
"FFFE",
"\\u{FFFE}"
],
[
"U+D800",
"null",
"Other",
"Cs",
"EF BF BD",
"D800",
"\\u{D800}"
]
];

const primary = [
[
"U+0000",
"control",
"caution",
"control",
"—",
"NUL",
"Common",
"Cc"
],
[
"U+0007",
"control",
"caution",
"control",
"—",
"BEL",
"Common",
"Cc"
],
[
"U+0009",
"whitespace",
"info",
"tab",
"—",
"TAB",
"Common",
"Cc"
],
[
"U+000A",
"null",
"none",
"null",
"—",
"LF",
"Common",
"Cc"
],
[
"U+000D",
"control",
"caution",
"loneCr",
"—",
"CR",
"Common",
"Cc"
],
[
"U+001B",
"control",
"caution",
"control",
"—",
"ESC",
"Common",
"Cc"
],
[
"U+0020",
"null",
"none",
"null",
"—",
"null",
"Common",
"Zs"
],
[
"U+0041",
"null",
"none",
"null",
"—",
"null",
"Latin",
"Lu"
],
[
"U+007F",
"control",
"caution",
"control",
"—",
"DEL",
"Common",
"Cc"
],
[
"U+0085",
"control",
"caution",
"control",
"—",
"NEL",
"Common",
"Cc"
],
[
"U+009F",
"control",
"caution",
"control",
"—",
"APC",
"Common",
"Cc"
],
[
"U+00A0",
"whitespace",
"caution",
"specialSpace",
"—",
"NBSP",
"Common",
"Zs"
],
[
"U+00AD",
"invisible",
"caution",
"invisible",
"—",
"SHY",
"Common",
"Cf"
],
[
"U+034F",
"invisible",
"caution",
"invisible",
"—",
"CGJ",
"Inherited",
"Mn"
],
[
"U+061C",
"bidi",
"caution",
"bidiMark",
"—",
"ALM",
"Arabic",
"Cf"
],
[
"U+115F",
"invisible",
"caution",
"invisible",
"—",
"null",
"Hangul",
"Lo"
],
[
"U+1680",
"whitespace",
"caution",
"specialSpace",
"—",
"null",
"Other",
"Zs"
],
[
"U+180E",
"invisible",
"caution",
"invisible",
"—",
"MVS",
"Mongolian",
"Cf"
],
[
"U+2000",
"whitespace",
"caution",
"specialSpace",
"—",
"null",
"Common",
"Zs"
],
[
"U+200A",
"whitespace",
"caution",
"specialSpace",
"—",
"null",
"Common",
"Zs"
],
[
"U+200B",
"invisible",
"caution",
"invisible",
"—",
"ZWSP",
"Common",
"Cf"
],
[
"U+200C",
"invisible",
"caution",
"invisible",
"—",
"ZWNJ",
"Inherited",
"Cf"
],
[
"U+200D",
"invisible",
"caution",
"invisible",
"—",
"ZWJ",
"Inherited",
"Cf"
],
[
"U+200E",
"bidi",
"caution",
"bidiMark",
"—",
"LRM",
"Common",
"Cf"
],
[
"U+200F",
"bidi",
"caution",
"bidiMark",
"—",
"RLM",
"Common",
"Cf"
],
[
"U+2028",
"whitespace",
"caution",
"lineSeparator",
"—",
"null",
"Common",
"Zl"
],
[
"U+2029",
"whitespace",
"caution",
"lineSeparator",
"—",
"null",
"Common",
"Zp"
],
[
"U+202A",
"bidi",
"danger",
"bidiFormat",
"—",
"LRE",
"Common",
"Cf"
],
[
"U+202C",
"bidi",
"danger",
"bidiFormat",
"—",
"PDF",
"Common",
"Cf"
],
[
"U+202E",
"bidi",
"danger",
"bidiFormat",
"—",
"RLO",
"Common",
"Cf"
],
[
"U+202F",
"whitespace",
"caution",
"specialSpace",
"—",
"NNBSP",
"Common",
"Zs"
],
[
"U+205F",
"whitespace",
"caution",
"specialSpace",
"—",
"MMSP",
"Common",
"Zs"
],
[
"U+2060",
"invisible",
"caution",
"invisible",
"—",
"WJ",
"Common",
"Cf"
],
[
"U+2062",
"invisible",
"caution",
"invisible",
"—",
"null",
"Common",
"Cf"
],
[
"U+2066",
"bidi",
"danger",
"bidiFormat",
"—",
"LRI",
"Common",
"Cf"
],
[
"U+2069",
"bidi",
"danger",
"bidiFormat",
"—",
"PDI",
"Common",
"Cf"
],
[
"U+2800",
"invisible",
"caution",
"invisible",
"—",
"null",
"Other",
"So"
],
[
"U+3000",
"whitespace",
"caution",
"specialSpace",
"—",
"null",
"Common",
"Zs"
],
[
"U+3164",
"invisible",
"caution",
"invisible",
"—",
"null",
"Hangul",
"Lo"
],
[
"U+FE00",
"variation",
"info",
"variationSingle",
"—",
"VS1",
"Inherited",
"Mn"
],
[
"U+FE0F",
"variation",
"info",
"variationSingle",
"—",
"VS16",
"Inherited",
"Mn"
],
[
"U+FEFF",
"invisible",
"info",
"leadingBom",
"—",
"BOM",
"Common",
"Cf"
],
[
"U+FFA0",
"invisible",
"caution",
"invisible",
"—",
"null",
"Hangul",
"Lo"
],
[
"U+FFF9",
"invisible",
"caution",
"invisible",
"—",
"null",
"Common",
"Cf"
],
[
"U+FFFE",
"private",
"caution",
"nonchar",
"—",
"null",
"Other",
"Cn"
],
[
"U+E000",
"private",
"caution",
"pua",
"—",
"null",
"Other",
"Co"
],
[
"U+F0000",
"private",
"caution",
"pua",
"—",
"null",
"Other",
"Co"
],
[
"U+D800",
"private",
"caution",
"surrogate",
"—",
"null",
"Other",
"Cs"
],
[
"U+E0001",
"tag",
"danger",
"tagRun",
"—",
"null",
"Common",
"Cf"
],
[
"U+E0020",
"tag",
"danger",
"tagRun",
"—",
"TAG:SP",
"Common",
"Cf"
],
[
"U+E0041",
"tag",
"danger",
"tagRun",
"—",
"TAG:A",
"Common",
"Cf"
],
[
"U+E007F",
"tag",
"danger",
"tagRun",
"—",
"null",
"Common",
"Cf"
],
[
"U+E0100",
"variation",
"info",
"variationSingle",
"—",
"VS17",
"Inherited",
"Mn"
],
[
"U+E01EF",
"variation",
"info",
"variationSingle",
"—",
"VS256",
"Inherited",
"Mn"
],
[
"U+180B",
"variation",
"info",
"variationSingle",
"—",
"FVS1",
"Mongolian",
"Mn"
],
[
"U+0301",
"combining",
"info",
"combining",
"—",
"null",
"Inherited",
"Mn"
],
[
"U+3099",
"combining",
"info",
"combining",
"—",
"null",
"Inherited",
"Mn"
],
[
"U+20DD",
"combining",
"info",
"combining",
"—",
"null",
"Inherited",
"Me"
],
[
"U+FF41",
"compat",
"info",
"fullwidth",
"\"a\"",
"null",
"Latin",
"Ll"
],
[
"U+FF11",
"compat",
"info",
"fullwidth",
"\"1\"",
"null",
"Common",
"Nd"
],
[
"U+FF0E",
"null",
"none",
"null",
"—",
"null",
"Common",
"Po"
],
[
"U+FF01",
"null",
"none",
"null",
"—",
"null",
"Common",
"Po"
],
[
"U+1D400",
"compat",
"caution",
"compat",
"\"A\"",
"null",
"Common",
"Lu"
],
[
"U+2460",
"compat",
"caution",
"compat",
"\"1\"",
"null",
"Common",
"No"
],
[
"U+2122",
"compat",
"caution",
"compat",
"\"TM\"",
"null",
"Common",
"So"
],
[
"U+2026",
"lookalike",
"info",
"lookalike",
"\"...\"",
"null",
"Common",
"Po"
],
[
"U+0430",
"lookalike",
"info",
"lookalike",
"\"a\"",
"null",
"Cyrillic",
"Ll"
],
[
"U+043B",
"null",
"none",
"null",
"—",
"null",
"Cyrillic",
"Ll"
],
[
"U+03B1",
"lookalike",
"info",
"lookalike",
"\"a\"",
"null",
"Greek",
"Ll"
],
[
"U+0131",
"lookalike",
"info",
"lookalike",
"\"i\"",
"null",
"Latin",
"Ll"
],
[
"U+00E9",
"null",
"none",
"null",
"—",
"null",
"Latin",
"Ll"
],
[
"U+00D7",
"lookalike",
"info",
"lookalike",
"\"x\"",
"null",
"Common",
"Sm"
],
[
"U+2019",
"lookalike",
"info",
"lookalike",
"\"'\"",
"null",
"Common",
"Pf"
],
[
"U+2010",
"lookalike",
"info",
"lookalike",
"\"-\"",
"null",
"Common",
"Pd"
],
[
"U+3042",
"null",
"none",
"null",
"—",
"null",
"Hiragana",
"Lo"
],
[
"U+30A2",
"null",
"none",
"null",
"—",
"null",
"Katakana",
"Lo"
],
[
"U+30CE",
"null",
"none",
"null",
"—",
"null",
"Katakana",
"Lo"
],
[
"U+30FC",
"null",
"none",
"null",
"—",
"null",
"Common",
"Lm"
],
[
"U+3002",
"null",
"none",
"null",
"—",
"null",
"Common",
"Po"
],
[
"U+301C",
"null",
"none",
"null",
"—",
"null",
"Common",
"Pd"
],
[
"U+4E00",
"null",
"none",
"null",
"—",
"null",
"Han",
"Lo"
],
[
"U+53E3",
"null",
"none",
"null",
"—",
"null",
"Han",
"Lo"
],
[
"U+FF76",
"null",
"none",
"null",
"—",
"null",
"Katakana",
"Lo"
],
[
"U+AC00",
"null",
"none",
"null",
"—",
"null",
"Hangul",
"Lo"
],
[
"U+0E01",
"null",
"none",
"null",
"—",
"null",
"Thai",
"Lo"
],
[
"U+1F600",
"null",
"none",
"null",
"—",
"null",
"Common",
"So"
]
];

const context = [
[
"ZWSPがASCIIの語を分断",
"f\\u{200B}l",
"danger",
"1=invisible/danger/splitsAsciiWord"
],
[
"ZWSPが2個続けて分断",
"f\\u{200B}\\u{200B}l",
"danger",
("1=invisible/danger/splitsAsciiWord 2=invisible/danger/splits" +
"AsciiWord")
],
[
"ZWSPが日本語の間",
"\\u{3042}\\u{200B}\\u{3044}",
"caution",
"1=invisible/caution/invisible"
],
[
"ZWSPの前が空白",
"a \\u{200B}b",
"caution",
"2=invisible/caution/invisible"
],
[
"SHYがASCIIの語を分断",
"pass\\u{00AD}word",
"danger",
"4=invisible/danger/splitsAsciiWord"
],
[
"ZWJが絵文字の間",
"\\u{1F468}\\u{200D}\\u{1F4BB}",
"info",
"1=invisible/info/emojiZwj"
],
[
"ZWJがVS16つきの絵文字の後",
"\\u{2764}\\u{FE0F}\\u{200D}\\u{1F525}",
"info",
"1=variation/info/variationSingle 2=invisible/info/emojiZwj"
],
[
"ZWJが肌色つきの絵文字の後",
"\\u{1F469}\\u{1F3FD}\\u{200D}\\u{1F4BB}",
"info",
"2=invisible/info/emojiZwj"
],
[
"ZWJが英字と絵文字の間",
"A\\u{200D}\\u{1F480}",
"caution",
"1=invisible/caution/invisible"
],
[
"ZWNJがペルシア語の中",
("\\u{0645}\\u{06CC}\\u{200C}\\u{062E}\\u{0648}\\u{0627}\\u{0647}\\u{0" +
"645}"),
"info",
("2=invisible/info/scriptJoiner 5=lookalike/info/lookalike/\"l\"" +
" 6=lookalike/info/lookalike/\"o\"")
],
[
"ZWNJがASCIIの間",
"a\\u{200C}b",
"danger",
"1=invisible/danger/splitsAsciiWord"
],
[
"BOMが先頭",
"\\u{FEFF}hello",
"info",
"0=invisible/info/leadingBom"
],
[
"BOMが途中",
"hel\\u{FEFF}lo",
"danger",
"3=invisible/danger/splitsAsciiWord"
],
[
"CRが単独",
"flag\\r.txt",
"caution",
"4=control/caution/loneCr"
],
[
"CRLF",
"a\\r\\nb",
"clean",
"なし"
],
[
"LF",
"a\\nb",
"clean",
"なし"
],
[
"VSが1個（絵文字）",
"\\u{2600}\\u{FE0F}",
"info",
"1=variation/info/variationSingle"
],
[
"VSが1個（漢字のIVS）",
"\\u{845B}\\u{E0100}",
"info",
"1=variation/info/variationSingle"
],
[
"VSが2個",
"\\u{1F600}\\u{E0158}\\u{E0159}",
"danger",
("1=variation/danger/variationRun 2=variation/danger/variation" +
"Run")
],
[
"結合記号が4個",
"a\\u{0300}\\u{0301}\\u{0302}\\u{0303}",
"info",
("1=combining/info/combining 2=combining/info/combining 3=comb" +
"ining/info/combining 4=combining/info/combining")
],
[
"結合記号が5個",
"a\\u{0300}\\u{0301}\\u{0302}\\u{0303}\\u{0304}",
"caution",
("1=zalgo/caution/markRunOver4 2=zalgo/caution/markRunOver4 3=" +
"zalgo/caution/markRunOver4 4=zalgo/caution/markRunOver4 5=za" +
"lgo/caution/markRunOver4")
],
[
"同じ結合記号が2個",
"a\\u{0301}\\u{0301}",
"caution",
("1=zalgo/caution/sameMarkRepeated 2=zalgo/caution/sameMarkRep" +
"eated")
],
[
"NFDのアクセントつきe",
"cafe\\u{0301}",
"info",
"4=combining/info/combining"
],
[
"NFDの「が」",
"\\u{304B}\\u{3099}",
"info",
"1=combining/info/combining"
],
[
"タイ語（結合記号2個）",
"\\u{0E17}\\u{0E35}\\u{0E48}",
"info",
"1=combining/info/combining 2=combining/info/combining"
],
[
"全角ピリオドがASCIIの英数字の間",
"example\\u{FF0E}com",
"danger",
"7=lookalike/danger/urlDelimiterLookalike/\".\""
],
[
"全角ピリオドが全角数字の間",
"\\u{FF11}\\u{FF0E}\\u{FF15}",
"info",
"0=compat/info/fullwidth/\"1\" 2=compat/info/fullwidth/\"5\""
],
[
"句点がASCIIの英数字の間",
"example\\u{3002}com",
"danger",
"7=lookalike/danger/urlDelimiterLookalike/\".\""
],
[
"句点が文末",
"\\u{3067}\\u{3059}\\u{3002}",
"clean",
"なし"
],
[
"「ノ」がASCIIの英数字の間",
"example.com\\u{30CE}login",
"danger",
"11=lookalike/danger/urlDelimiterLookalike/\"/\""
],
[
"「ノ」が日本語の中",
"\\u{30CE}\\u{30FC}\\u{30C8}",
"clean",
"なし"
],
[
"U+2044がASCIIの英数字の間",
"example.com\\u{2044}login",
"danger",
"11=lookalike/danger/urlDelimiterLookalike/\"/\""
],
[
"U+2019が英語の語中",
"don\\u{2019}t",
"info",
"3=lookalike/info/lookalike/\"'\""
],
[
"U+2212が空白の間",
"10 \\u{2212} 3",
"info",
"3=lookalike/info/lookalike/\"-\""
],
[
"U+0131（点のないi）がASCIIの語に混ざる",
"paypa\\u{0131}",
"caution",
"5=lookalike/caution/lookalikeInAsciiWord/\"i\""
]
];

const tokens = [
[
"\\u{0430}\\u{0440}\\u{0440}\\u{04CF}\\u{0435}.com",
"danger",
"apple.com",
("\\u{0430}\\u{0440}\\u{0440}\\u{04CF}\\u{0435}:single+wholeScript:" +
"Cyrillic ／ com:ascii:Latin"),
("0=lookalike/danger/wholeScriptConfusable/\"a\" 1=lookalike/dan" +
"ger/wholeScriptConfusable/\"p\" 2=lookalike/danger/wholeScript" +
"Confusable/\"p\" 3=lookalike/danger/wholeScriptConfusable/\"l\" " +
"4=lookalike/danger/wholeScriptConfusable/\"e\"")
],
[
"g\\u{043E}\\u{043E}gle.com",
"danger",
"google.com",
("g\\u{043E}\\u{043E}gle:mixed(majority Latin):Latin+Cyrillic ／ " +
"com:ascii:Latin"),
("1=lookalike/danger/lookalikeInMixedToken/\"o\" 2=lookalike/dan" +
"ger/lookalikeInMixedToken/\"o\"")
],
[
"\\u{0430}pple.com",
"danger",
"apple.com",
("\\u{0430}pple:mixed(majority Latin):Cyrillic+Latin ／ com:asci" +
"i:Latin"),
"0=lookalike/danger/lookalikeInMixedToken/\"a\""
],
[
"\\u{03B1}lpha",
"danger",
"alpha",
"\\u{03B1}lpha:mixed(majority Latin):Greek+Latin",
"0=lookalike/danger/lookalikeInMixedToken/\"a\""
],
[
"f\\u{0631}\\u{0627}g.txt",
"danger",
"f\\u{0631}lg.txt",
("f\\u{0631}\\u{0627}g:mixed(majority Latin):Latin+Arabic ／ txt:" +
"ascii:Latin"),
("1=mixed/danger/minorityScript 2=lookalike/danger/lookalikeIn" +
"MixedToken/\"l\"")
],
[
"\\u{0430}\\u{0440}\\u{0440}l\\u{0435}",
"danger",
"apple",
("\\u{0430}\\u{0440}\\u{0440}l\\u{0435}:mixed(majority Cyrillic):C" +
"yrillic+Latin"),
("0=lookalike/danger/lookalikeInMixedToken/\"a\" 1=lookalike/dan" +
"ger/lookalikeInMixedToken/\"p\" 2=lookalike/danger/lookalikeIn" +
"MixedToken/\"p\" 3=mixed/danger/minorityScript 4=lookalike/dan" +
"ger/lookalikeInMixedToken/\"e\"")
],
[
("\\u{041F}\\u{0440}\\u{0438}\\u{0432}\\u{0435}\\u{0442}, \\u{043C}\\u" +
"{0438}\\u{0440}"),
"info",
"\\u{041F}p\\u{0438}\\u{0432}e\\u{0442}, \\u{043C}\\u{0438}p",
("\\u{041F}\\u{0440}\\u{0438}\\u{0432}\\u{0435}\\u{0442}:single:Cyri" +
"llic ／ \\u{043C}\\u{0438}\\u{0440}:single:Cyrillic"),
("1=lookalike/info/lookalike/\"p\" 4=lookalike/info/lookalike/\"e" +
"\" 10=lookalike/info/lookalike/\"p\"")
],
[
"\\u{0441}\\u{043E}\\u{0441}\\u{043E}",
"info",
"coco",
"\\u{0441}\\u{043E}\\u{0441}\\u{043E}:single+wholeScript:Cyrillic",
("0=lookalike/info/wholeScriptConfusable/\"c\" 1=lookalike/info/" +
"wholeScriptConfusable/\"o\" 2=lookalike/info/wholeScriptConfus" +
"able/\"c\" 3=lookalike/info/wholeScriptConfusable/\"o\"")
],
[
"\\u{0441}\\u{043E}\\u{0441}\\u{043E} and coco",
"danger",
"coco and coco",
("\\u{0441}\\u{043E}\\u{0441}\\u{043E}:single+wholeScript:Cyrillic" +
" ／ and:ascii:Latin ／ coco:ascii:Latin"),
("0=lookalike/danger/wholeScriptConfusable/\"c\" 1=lookalike/dan" +
"ger/wholeScriptConfusable/\"o\" 2=lookalike/danger/wholeScript" +
"Confusable/\"c\" 3=lookalike/danger/wholeScriptConfusable/\"o\"")
],
[
"PayPay\\u{9280}\\u{884C}",
"clean",
"PayPay\\u{9280}\\u{884C}",
"PayPay\\u{9280}\\u{884C}:cjkLatin:Latin+Han",
"なし"
],
[
("\\u{6771}\\u{4EAC}\\u{30BF}\\u{30EF}\\u{30FC}\\u{3078}\\u{884C}\\u{3" +
"04F}"),
"clean",
("\\u{6771}\\u{4EAC}\\u{30BF}\\u{30EF}\\u{30FC}\\u{3078}\\u{884C}\\u{3" +
"04F}"),
("\\u{6771}\\u{4EAC}\\u{30BF}\\u{30EF}\\u{30FC}\\u{3078}\\u{884C}\\u{3" +
"04F}:single:Han+Katakana+Hiragana"),
"なし"
],
[
"A\\u{3042}\\u{30A2}\\u{6F22}",
"clean",
"A\\u{3042}\\u{30A2}\\u{6F22}",
("A\\u{3042}\\u{30A2}\\u{6F22}:cjkLatin:Latin+Hiragana+Katakana+H" +
"an"),
"なし"
],
[
"\\u{D55C}\\u{56FD}Korea",
"clean",
"\\u{D55C}\\u{56FD}Korea",
"\\u{D55C}\\u{56FD}Korea:cjkLatin:Hangul+Han+Latin",
"なし"
],
[
"\\u{3042}\\u{0430}",
"danger",
"\\u{3042}a",
"\\u{3042}\\u{0430}:mixed(majority Hiragana):Hiragana+Cyrillic",
"1=lookalike/danger/lookalikeInMixedToken/\"a\""
],
[
"caf\\u{00E9}",
"clean",
"caf\\u{00E9}",
"caf\\u{00E9}:single:Latin",
"なし"
],
[
"abc123",
"clean",
"abc123",
"abc123:ascii:Latin",
"なし"
],
[
"\\u{0966}\\u{0967}abc",
"danger",
"o\\u{0967}abc",
"\\u{0966}\\u{0967}abc:mixed(majority Latin):Devanagari+Latin",
("0=lookalike/danger/lookalikeInMixedToken/\"o\" 1=mixed/danger/" +
"minorityScript")
],
[
"f\\u{200B}l\\u{0430}g",
"danger",
"flag",
"fl\\u{0430}g:mixed(majority Latin):Latin+Cyrillic",
("1=invisible/danger/splitsAsciiWord 3=lookalike/danger/lookal" +
"ikeInMixedToken/\"a\"")
]
];

const bidi = [
[
"abc\\u{202E}txt.galf",
"danger",
"1",
"0",
"1",
"[3]",
"[]"
],
[
"A\\u{2066}B\\u{2069}C",
"danger",
"2",
"0",
"0",
"[]",
"[]"
],
[
"abc\\u{202C}def",
"danger",
"1",
"0",
"0",
"[]",
"[3]"
],
[
("/*\\u{202E} } \\u{2066}if (isAdmin)\\u{2069} \\u{2066} begin adm" +
"ins only */"),
"danger",
"4",
"0",
"1",
"[2,21]",
"[]"
],
[
"a\\u{202E}b\\nc\\u{202D}d\\u{202C}e",
"danger",
"3",
"0",
"2",
"[1]",
"[]"
],
[
"\\u{2067}a\\u{202E}b\\u{2069}c",
"danger",
"3",
"0",
"1",
"[]",
"[]"
],
[
"a\\u{200E}b\\u{200F}c",
"caution",
"0",
"2",
"0",
"[]",
"[]"
],
[
"x\\u{2069}y",
"danger",
"1",
"0",
"0",
"[]",
"[1]"
]
];

const normal = [
[
"日本語の文",
("\\u{3042}\\u{308A}\\u{304C}\\u{3068}\\u{3046}\\u{3002}\\u{30A2}\\u{3" +
"0A4}\\u{30B9}\\u{3092}\\u{98DF}\\u{3079}\\u{305F}\\u{FF01}\\u{FF08}" +
"\\u{7B11}\\u{FF09}\\u{300C}\\u{30CE}\\u{30FC}\\u{30C8}\\u{300D}10\\u" +
"{301C}20"),
"clean",
"なし"
],
[
"日本語＋全角英数",
"Windows\\u{FF11}\\u{FF11}\\u{3068}\\u{FF2F}\\u{FF33}",
"info",
"compat 4（info 4）"
],
[
"日本語＋全角スペース",
("\\u{3053}\\u{3093}\\u{306B}\\u{3061}\\u{306F}\\u{3000}\\u{4E16}\\u{7" +
"54C}"),
"caution",
"whitespace 1（caution 1）"
],
[
"複数行（LFとCRLF）",
"line1\\nline2\\r\\nline3",
"clean",
"なし"
],
[
"タブ区切り",
"a\\tb\\tc",
"info",
"whitespace 2（info 2）"
],
[
"英語（曲線の引用符）",
"\\u{201C}It\\u{2019}s fine,\\u{201D} she said \\u{2026}",
"info",
"lookalike 4（info 4）"
],
[
"ロシア語",
("\\u{041F}\\u{0440}\\u{0438}\\u{0432}\\u{0435}\\u{0442}, \\u{043C}\\u" +
"{0438}\\u{0440}"),
"info",
"lookalike 3（info 3）"
],
[
"ギリシャ語",
("\\u{03B1}\\u{03B2}\\u{03B3} \\u{03BB}\\u{03CC}\\u{03B3}\\u{03BF}\\u{" +
"03C2}"),
"info",
"lookalike 4（info 4）"
],
[
"フランス語（NFC）",
"caf\\u{00E9} \\u{00E0} la cr\\u{00E8}me",
"clean",
"なし"
],
[
"絵文字",
("\\u{1F468}\\u{200D}\\u{1F469}\\u{200D}\\u{1F467} \\u{2600}\\u{FE0F}" +
" \\u{1F44D}\\u{1F3FD}"),
"info",
"variation 1（info 1）、invisible 2（info 2）"
],
[
"韓国語",
"\\u{C548}\\u{B155}\\u{D558}\\u{C138}\\u{C694}",
"clean",
"なし"
],
[
"アラビア語",
("\\u{0645}\\u{0631}\\u{062D}\\u{0628}\\u{0627} \\u{0628}\\u{0627}\\u{" +
"0644}\\u{0639}\\u{0627}\\u{0644}\\u{0645}"),
"info",
"lookalike 3（info 3）"
],
[
"URL",
"https://example.com/path?q=1&x=%E3%81%82#top",
"clean",
"なし"
],
[
"空文字列",
"",
"clean",
"なし"
]
];

const lengths = [
[
"flag.txt",
"8",
"8",
"8",
"同じ・8",
"同じ・8",
"同じ・8",
"同じ・8"
],
[
"\\u{1F468}\\u{200D}\\u{1F4BB}",
"3",
"5",
"11",
"同じ・3",
"同じ・3",
"同じ・3",
"同じ・3"
],
[
"cafe\\u{0301}",
"5",
"5",
"6",
"違う・4",
"同じ・5",
"違う・4",
"同じ・5"
],
[
"\\u{FF46}\\u{FF4C}\\u{FF41}\\u{FF47}",
"4",
"4",
"12",
"同じ・4",
"同じ・4",
"違う・4",
"違う・4"
],
[
"\\u{304B}\\u{3099}",
"2",
"2",
"6",
"違う・1",
"同じ・2",
"違う・1",
"同じ・2"
],
[
"a\\u{D800}b",
"3",
"3",
"5",
"同じ・3",
"同じ・3",
"同じ・3",
"同じ・3"
]
];

const hidden = [
[
"タグ文字1個で分断",
"fun\\u{E0020}ding",
"danger",
"funding",
"{kind:tag, start:3, end:3, count:1, text:\" \", bytes:null}"
],
[
"タグ文字の文",
("Thanks!\\u{E0073}\\u{E0065}\\u{E0063}\\u{E0072}\\u{E0065}\\u{E0074" +
"}\\u{E0020}\\u{E006D}\\u{E0065}\\u{E0073}\\u{E0073}\\u{E0061}\\u{E0" +
"067}\\u{E0065}"),
"danger",
"Thanks!",
("{kind:tag, start:7, end:20, count:14, text:\"secret message\"," +
" bytes:null}")
],
[
"タグ文字が2か所",
"a\\u{E0078}b\\u{E0079}\\u{E007A}",
"danger",
"ab",
("{kind:tag, start:1, end:1, count:1, text:\"x\", bytes:null} {k" +
"ind:tag, start:3, end:4, count:2, text:\"yz\", bytes:null}")
],
[
"絵文字の旗",
("\\u{1F3F4}\\u{E0067}\\u{E0062}\\u{E0065}\\u{E006E}\\u{E0067}\\u{E00" +
"7F}"),
"info",
("\\u{1F3F4}\\u{E0067}\\u{E0062}\\u{E0065}\\u{E006E}\\u{E0067}\\u{E00" +
"7F}"),
("{kind:emojiFlag, start:1, end:6, count:6, text:\"gbeng\", byte" +
"s:null}")
],
[
"終端のない旗",
"\\u{1F3F4}\\u{E0067}\\u{E0062}\\u{E0065}\\u{E006E}\\u{E0067}",
"danger",
"\\u{1F3F4}",
("{kind:tag, start:1, end:5, count:5, text:\"gbeng\", bytes:null" +
"}")
],
[
"LANGUAGE TAGつき",
"\\u{E0001}\\u{E0065}\\u{E006E}",
"danger",
"",
"{kind:tag, start:0, end:2, count:3, text:\"en\", bytes:null}"
],
[
"VSが2個（hi）",
"\\u{1F600}\\u{E0158}\\u{E0159}",
"danger",
"\\u{1F600}",
("{kind:variation, start:1, end:2, count:2, text:\"hi\", bytes:\"" +
"68 69\"}")
],
[
"VS（日本語のUTF-8）",
"x\\u{E01D7}\\u{E0197}\\u{E0188}\\u{E01D5}\\u{E019F}\\u{E0176}",
"danger",
"x",
("{kind:variation, start:1, end:6, count:6, text:\"\\\\u{79D8}\\\\u" +
"{5BC6}\", bytes:\"E7 A7 98 E5 AF 86\"}")
],
[
"VS（UTF-8として不正）",
"x\\u{E01EF}\\u{E01EE}",
"danger",
"x",
("{kind:variation, start:1, end:2, count:2, text:null, bytes:\"" +
"FF FE\"}")
],
[
"VS（制御文字になるバイト）",
"x\\u{FE00}\\u{FE0F}\\u{E0100}",
"danger",
"x",
("{kind:variation, start:1, end:3, count:3, text:null, bytes:\"" +
"00 0F 10\"}")
]
];

const integration = [
[
"Day033 ゼロ幅スペース",
"f\\u{200B}l\\u{200B}a\\u{200B}g.txt",
"danger",
"invisible 3（danger 3）",
"flag.txt"
],
[
"Day033 RTL",
"evil\\u{202E}gnp.exe",
"danger",
"bidi 1（danger 1）",
"evilgnp.exe"
],
[
"Day033 スクリプト混在",
"g\\u{043E}\\u{043E}gle.com",
"danger",
"lookalike 2（danger 2）",
"google.com"
],
[
"Day033 同形異義文字",
"\\u{0430}pple.com",
"danger",
"lookalike 1（danger 1）",
"apple.com"
],
[
"Day074のREADMEの例",
("https://\\u{0430}\\u{0440}\\u{0440}\\u{04CF}\\u{0435}.com/login/v" +
"erify"),
"danger",
"lookalike 5（danger 5）",
"https://apple.com/login/verify"
]
];

test('A-4: all 16 code point descriptions', () => {
  assert.equal(description.length, 16);
  for (const [point, abbr, script, generalCategory, utf8, utf16, escape] of description) {
    assert.deepEqual(L.describeCodePoint(parseInt(point.slice(2), 16)), {
      codePoint: point, abbr: abbr === 'null' ? null : abbr, script, generalCategory, utf8, utf16, escape
    });
  }
});
test('A-6: all 86 primary classifications', () => {
  assert.equal(primary.length, 86);
  for (const [point, category, severity, reason, ascii, abbr, script, gc] of primary) {
    const cp = parseInt(point.slice(2), 16), char = String.fromCodePoint(cp);
    const actual = L.analyze(char).chars[0];
    const nullable = value => value === 'null' ? null : value;
    assert.deepEqual([actual.category, actual.severity, actual.reason, actual.ascii],
      [nullable(category), severity, nullable(reason), ascii === '—' ? null : JSON.parse(ascii)], point);
    assert.deepEqual([L.abbrOf(cp), L.scriptOf(char), L.generalCategoryOf(char)], [nullable(abbr), script, gc], point);
  }
});
test('A-7: all 35 contextual cases', () => {
  assert.equal(context.length, 35);
  for (const [name, input, verdict, detected] of context) {
    const actual = L.analyze(raw(input));
    assert.equal(actual.verdict, verdict, name);
    assert.equal(detections(actual), detected === 'なし' ? '' : detected, name);
  }
});
test('A-8: all 18 token and script cases', () => {
  assert.equal(tokens.length, 18);
  for (const [input, verdict, comparable, expected, detected] of tokens) {
    const actual = L.analyze(raw(input));
    assert.equal(actual.verdict, verdict, input);
    assert.equal(actual.comparable, raw(comparable), input);
    assert.equal(detections(actual), detected === 'なし' ? '' : detected, input);
    const descriptions = actual.tokens.map(token => token.text + ':' + token.level +
      (token.majorityScript ? '(majority ' + token.majorityScript + ')' : '') +
      (token.wholeScriptConfusable ? '+wholeScript' : '') + ':' + token.scripts.join('+'));
    assert.deepEqual(descriptions, expected.split(' ／ ').map(raw), input);
  }
});
test('A-10: all 8 bidi stack cases', () => {
  assert.equal(bidi.length, 8);
  for (const [input, verdict, formatCount, markCount, overrideCount, unclosed, orphans] of bidi) {
    const actual = L.analyze(raw(input));
    assert.equal(actual.verdict, verdict);
    assert.deepEqual(actual.bidi, { formatCount: +formatCount, markCount: +markCount, overrideCount: +overrideCount,
      unclosed: JSON.parse(unclosed), orphans: JSON.parse(orphans) });
  }
});
test('A-12: all 14 normal texts and 5 integrations', () => {
  assert.equal(normal.length, 14); assert.equal(integration.length, 5);
  for (const [name, input, verdict, counts, comparable] of [...normal, ...integration]) {
    const actual = L.analyze(raw(input));
    assert.equal(actual.verdict, verdict, name);
    assert.deepEqual(countsOf(actual), expectedCounts(counts), name);
    if (comparable !== undefined) assert.equal(actual.comparable, raw(comparable), name);
  }
});
test('A-12: all 6 lengths and normalization forms', () => {
  assert.equal(lengths.length, 6);
  for (const [input, codePoints, utf16, utf8, ...forms] of lengths) {
    const actual = L.analyze(raw(input));
    assert.deepEqual(actual.length, { codePoints: +codePoints, utf16: +utf16, utf8: +utf8 });
    for (const [index, form] of ['NFC', 'NFD', 'NFKC', 'NFKD'].entries()) {
      const [same, count] = forms[index].split('・');
      assert.deepEqual(actual.normalization[form], { same: same === '同じ', codePoints: +count });
    }
  }
});
test('A-12: all 10 hidden-content cases', () => {
  assert.equal(hidden.length, 10);
  for (const [name, input, verdict, comparable, expected] of hidden) {
    const actual = L.analyze(raw(input));
    assert.equal(actual.verdict, verdict, name);
    assert.equal(actual.comparable, raw(comparable), name);
    const parsed = Array.from(expected.matchAll(
      /\{kind:(\w+), start:(\d+), end:(\d+), count:(\d+), text:("(?:[^"\\]|\\.)*"|null), bytes:("[^"]*"|null)\}/g
    ), m => ({ kind: m[1], start: +m[2], end: +m[3], count: +m[4],
      text: m[5] === 'null' ? null : raw(JSON.parse(m[5])), bytes: JSON.parse(m[6]) }));
    assert.ok(parsed.length > 0, name);
    assert.deepEqual(actual.hidden, parsed, name);
  }
});
test('invariants, all categories, offsets, purity, and 100000-point bound', () => {
  const seen = new Set();
  for (const row of primary) {
    const input = String.fromCodePoint(parseInt(row[0].slice(2), 16));
    for (const char of L.analyze(input).chars) if (char.category) seen.add(char.category);
  }
  for (const [, input] of context) for (const char of L.analyze(raw(input)).chars) if (char.category) seen.add(char.category);
  for (const [input] of tokens) for (const char of L.analyze(raw(input)).chars) if (char.category) seen.add(char.category);
  assert.deepEqual([...seen].sort(), [...L.CATEGORY_ORDER].sort());
  const input = 'a😀' + String.fromCodePoint(0x200b) + 'b';
  const result = L.analyze(input);
  assert.deepEqual(result.chars.map(char => char.offset), [0, 1, 3, 4]);
  assert.deepEqual(result, L.analyze(input));
  result.chars[0].category = 'changed';
  assert.equal(L.analyze(input).chars[0].category, null);
  for (const [, text] of context) {
    const actual = L.analyze(raw(text));
    assert.equal(Object.values(actual.counts).reduce((sum, count) => sum + count.total, 0),
      actual.chars.filter(char => char.category).length);
    assert.equal(actual.verdict, L.SEVERITY_ORDER.find(level => actual.chars.some(char => char.severity === level)) || 'clean');
  }
  const large = L.analyze(('ab' + String.fromCodePoint(0x200b)).repeat(40000));
  assert.equal(large.truncated, true);
  assert.equal(large.length.codePoints, 100000);
  assert.equal(large.counts.invisible.total, 33333);
});

