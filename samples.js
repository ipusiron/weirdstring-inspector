const sampleData = {
  tag: [
    {
      id: "tag-1",
      nameKey: "sample.tag-1.name",
      text: "fun\u{E0020}ding",
      descriptionKey: "sample.tag-1.description",
    },
    {
      id: "tag-2",
      nameKey: "sample.tag-2.name",
      text: "Thanks!\u{E0073}" +
        "\u{E0065}\u{E0063}\u{E0072}\u{E0065}\u{E0074}\u{E0020}\u{E006D}\u{E0065}" +
        "\u{E0073}\u{E0073}\u{E0061}\u{E0067}\u{E0065}",
      descriptionKey: "sample.tag-2.description",
    },
    {
      id: "tag-3",
      nameKey: "sample.tag-3.name",
      text: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
      descriptionKey: "sample.tag-3.description",
    },
    {
      id: "tag-unverified-flag",
      nameKey: "sample.tag-unverified-flag.name",
      text: "\ud83c\udff4\udb40\udc68\udb40\udc65\udb40\udc6c\udb40\udc6c\udb40\udc6f\udb40\udc7f",
      descriptionKey: "sample.tag-unverified-flag.description"
    },
    {
      id: "tag-markdown-note",
      nameKey: "sample.tag-markdown-note.name",
      text: "# Demo note \udb40\udc64\udb40\udc65\udb40\udc6d\udb40\udc6f\udb40\udc20\udb40\udc6e\udb40\udc6f\udb40\udc74\udb40\udc65",
      descriptionKey: "sample.tag-markdown-note.description"
    },
  ],
  bidi: [
    {
      id: "bidi-1",
      nameKey: "sample.bidi-1.name",
      text: "abc\u{202E}txt." +
        "galf",
      descriptionKey: "sample.bidi-1.description",
    },
    {
      id: "bidi-2",
      nameKey: "sample.bidi-2.name",
      text: "evil\u{202E}gnp" +
        ".exe",
      descriptionKey: "sample.bidi-2.description",
    },
    {
      id: "bidi-3",
      nameKey: "sample.bidi-3.name",
      text: "/*\u{202E} } \u{2066}i" +
        "f (isAdm" +
        "in)\u{2069} \u{2066} b" +
        "egin adm" +
        "ins only" +
        " */",
      descriptionKey: "sample.bidi-3.description",
    },
    {
      id: "bidi-4",
      nameKey: "sample.bidi-4.name",
      text: "A\u{2066}B\u{2069}C",
      descriptionKey: "sample.bidi-4.description",
    },
    {
      id: "bidi-5",
      nameKey: "sample.bidi-5.name",
      text: "a\u{200E}b\u{200F}c",
      descriptionKey: "sample.bidi-5.description",
    },
  ],
  variation: [
    {
      id: "variation-1",
      nameKey: "sample.variation-1.name",
      text: "\u{1F600}\u{E0158}\u{E0159}",
      descriptionKey: "sample.variation-1.description",
    },
    {
      id: "variation-2",
      nameKey: "sample.variation-2.name",
      text: "\u{2600}\u{FE0F}",
      descriptionKey: "sample.variation-2.description",
    },
    {
      id: "variation-3",
      nameKey: "sample.variation-3.name",
      text: "\u{845B}\u{E0100}",
      descriptionKey: "sample.variation-3.description",
    },
    {
      id: "variation-distributed",
      nameKey: "sample.variation-distributed.name",
      text: "\ud83d\ude00\udb40\udd58\ud83d\ude01\udb40\udd59",
      descriptionKey: "sample.variation-distributed.description"
    },
  ],
  invisible: [
    {
      id: "invisible-1",
      nameKey: "sample.invisible-1.name",
      text: "f\u{200B}l\u{200B}a\u{200B}g." +
        "txt",
      descriptionKey: "sample.invisible-1.description",
    },
    {
      id: "invisible-2",
      nameKey: "sample.invisible-2.name",
      text: "pass\u{00AD}wor" +
        "d",
      descriptionKey: "sample.invisible-2.description",
    },
    {
      id: "invisible-3",
      nameKey: "sample.invisible-3.name",
      text: "\u{1F468}\u{200D}\u{1F4BB}",
      descriptionKey: "sample.invisible-3.description",
    },
    {
      id: "invisible-4",
      nameKey: "sample.invisible-4.name",
      text: "\u{FEFF}hello",
      descriptionKey: "sample.invisible-4.description",
    },
    {
      id: "invisible-5",
      nameKey: "sample.invisible-5.name",
      text: "\u{3164}",
      descriptionKey: "sample.invisible-5.description",
    },
  ],
  control: [
    {
      id: "control-1",
      nameKey: "sample.control-1.name",
      text: "f\u{0007}lag.tx" +
        "t",
      descriptionKey: "sample.control-1.description",
    },
    {
      id: "control-2",
      nameKey: "sample.control-2.name",
      text: "flag\r.tx" +
        "t",
      descriptionKey: "sample.control-2.description",
    },
    {
      id: "control-3",
      nameKey: "sample.control-3.name",
      text: "\u{001B}[31mERR" +
        "OR\u{001B}[0m",
      descriptionKey: "sample.control-3.description",
    },
  ],
  whitespace: [
    {
      id: "whitespace-1",
      nameKey: "sample.whitespace-1.name",
      text: "flag\u{00A0}.tx" +
        "t",
      descriptionKey: "sample.whitespace-1.description",
    },
    {
      id: "whitespace-2",
      nameKey: "sample.whitespace-2.name",
      text: "f\u{200A}la\u{200A}g.t" +
        "xt",
      descriptionKey: "sample.whitespace-2.description",
    },
    {
      id: "whitespace-3",
      nameKey: "sample.whitespace-3.name",
      text: "if (x)\u{3000}r" +
        "eturn;",
      descriptionKey: "sample.whitespace-3.description",
    },
    {
      id: "whitespace-4",
      nameKey: "sample.whitespace-4.name",
      text: "f\tlag.tx" +
        "t",
      descriptionKey: "sample.whitespace-4.description",
    },
  ],
  private: [
    {
      id: "private-1",
      nameKey: "sample.private-1.name",
      text: "key=\u{E000}\u{E001}\u{E002}",
      descriptionKey: "sample.private-1.description",
    },
  ],
  combining: [
    {
      id: "combining-1",
      nameKey: "sample.combining-1.name",
      text: "Z\u{0335}\u{0322}\u{031B}\u{035E}\u{0361}\u{0337}a" +
        "lgo",
      descriptionKey: "sample.combining-1.description",
    },
    {
      id: "combining-2",
      nameKey: "sample.combining-2.name",
      text: "a\u{0301}\u{0301}",
      descriptionKey: "sample.combining-2.description",
    },
    {
      id: "combining-3",
      nameKey: "sample.combining-3.name",
      text: "cafe\u{0301}",
      descriptionKey: "sample.combining-3.description",
    },
    {
      id: "combining-4",
      nameKey: "sample.combining-4.name",
      text: "\u{304B}\u{3099}",
      descriptionKey: "sample.combining-4.description",
    },
  ],
  compat: [
    {
      id: "compat-1",
      nameKey: "sample.compat-1.name",
      text: "\u{FF46}\u{FF4C}\u{FF41}\u{FF47}\u{FF0E}\u{FF54}\u{FF58}\u{FF54}",
      descriptionKey: "sample.compat-1.description",
    },
    {
      id: "compat-2",
      nameKey: "sample.compat-2.name",
      text: "\u{1D429}\u{1D41A}\u{1D432}",
      descriptionKey: "sample.compat-2.description",
    },
  ],
  lookalike: [
    {
      id: "lookalike-1",
      nameKey: "sample.lookalike-1.name",
      text: "\u{0430}\u{0440}\u{0440}\u{04CF}\u{0435}.co" +
        "m",
      descriptionKey: "sample.lookalike-1.description",
    },
    {
      id: "lookalike-2",
      nameKey: "sample.lookalike-2.name",
      text: "g\u{043E}\u{043E}gle.c" +
        "om",
      descriptionKey: "sample.lookalike-2.description",
    },
    {
      id: "lookalike-3",
      nameKey: "sample.lookalike-3.name",
      text: "\u{03B1}lpha",
      descriptionKey: "sample.lookalike-3.description",
    },
    {
      id: "lookalike-4",
      nameKey: "sample.lookalike-4.name",
      text: "f\u{0631}\u{0627}g.txt",
      descriptionKey: "sample.lookalike-4.description",
    },
    {
      id: "lookalike-5",
      nameKey: "sample.lookalike-5.name",
      text: "example\u{FF0E}" +
        "com",
      descriptionKey: "sample.lookalike-5.description",
    },
    {
      id: "lookalike-6",
      nameKey: "sample.lookalike-6.name",
      text: "example\u{3002}" +
        "com",
      descriptionKey: "sample.lookalike-6.description",
    },
    {
      id: "lookalike-7",
      nameKey: "sample.lookalike-7.name",
      text: "example." +
        "com\u{30CE}logi" +
        "n",
      descriptionKey: "sample.lookalike-7.description",
    },
    {
      id: "lookalike-8",
      nameKey: "sample.lookalike-8.name",
      text: "example." +
        "com\u{2044}logi" +
        "n",
      descriptionKey: "sample.lookalike-8.description",
    },
    {
      id: "japanese-login",
      nameKey: "sample.japanese-login.name",
      text: "\u53e3\u30b0\u30a4\u30f3",
      descriptionKey: "sample.japanese-login.description"
    },
    {
      id: "japanese-account",
      nameKey: "sample.japanese-account.name",
      text: "\u30a2\u529b\u30a6\u30f3\u30c8",
      descriptionKey: "sample.japanese-account.description"
    },
    {
      id: "japanese-mail",
      nameKey: "sample.japanese-mail.name",
      text: "\u30e1\u4e00\u30eb",
      descriptionKey: "sample.japanese-mail.description"
    },
  ],
  normal: [
    {
      id: "normal-1",
      nameKey: "sample.normal-1.name",
      text: "flag.txt",
      descriptionKey: "sample.normal-1.description",
    },
    {
      id: "normal-2",
      nameKey: "sample.normal-2.name",
      text: "\u{3053}\u{3093}\u{306B}\u{3061}\u{306F}\u{3002}\u{30D5}\u{30A1}" +
        "\u{30A4}\u{30EB}\u{540D}\u{306F}flag" +
        ".txt\u{3067}\u{3059}\u{FF01}",
      descriptionKey: "sample.normal-2.description",
    },
    {
      id: "normal-3",
      nameKey: "sample.normal-3.name",
      text: "\u{041F}\u{0440}\u{0438}\u{0432}\u{0435}\u{0442}, " +
        "\u{043C}\u{0438}\u{0440}",
      descriptionKey: "sample.normal-3.description",
    },
  ],
};

if (typeof module === "object" && module.exports) {
  module.exports = sampleData;
}
