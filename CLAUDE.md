# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeirdString Inspector is a client-side web application for detecting and visualizing suspicious Unicode characters. It's a security/forensics tool designed for educational purposes and CTF challenges, part of the "100 Security Tools with Generative AI" project (Day 023).

## Architecture

This is a vanilla JavaScript single-page application with no build process or dependencies:
- **index.html**: Main UI interface
- **script.js**: Input revisions, rendering, character details, tabs, help, theme, language and explicit actions
- **weirdstring-logic.js**: Pure classification, context, token, hidden-content, escape and URL functions
- **weirdstring-data.js**: Generated ASCII-confusable mappings (Unicode 18.0.0; 2,249 entries, 423 targets)
- **weirdstring-context-data.js**: 3 RGI tag flags, 2,179 unique variation pairs and 16 Japanese candidate pairs
- **weirdstring-actions.js**: Pure removal, comparison, strict UTF-8 decoding, report and sharing functions
- **weirdstring-messages.js**: Japanese/English dictionaries, format(lang, key, params), has(lang, key)
- **samples.js**: 47 educational examples in 11 groups; stable IDs, shared text, translated name/description keys
- **samples.md**, **samples.en.md**: Generated sample references, including literal invisible characters
- **README.md**, **README.en.md**: Japanese/English usage and limitations; metadata exists only in Japanese
- **style.css**: Styling and layout
- **test/**: Dependency-free Node tests, including documentation and source invariants
- **tools/**: Data/documentation generators and the bundled Unicode originals and license

The application runs entirely in the browser without any backend requirements.

## Key Technical Details

### Character Detection Categories
The tool detects 12 categories, in this order:
tag, bidi, variation, invisible, control, whitespace, private, zalgo, combining, compat, lookalike, mixed.
Severity is danger, caution or info; whole-input verdicts also include clean and empty.
Normal Japanese is not suspicious by itself. Normal emoji ZWJ and context-matched single variation selectors are informative.
Unverified single VS contexts and well-shaped but non-RGI tag flags are cautions; malformed tags and consecutive VS runs are high concern.
Han supplementary IVS and Mongolian FVS context does not certify a registered sequence. Do not claim full IVD coverage.
Distributed base/VS candidates use restricted adjacent pairs and valid UTF-8, not an inference about intent.
The Japanese comparison transform applies NFC and 16 pairs. Auto-cautions apply to 15 Han candidates adjacent to two Katakana letters.
The へ/ヘ pair is comparison-only; Japanese candidates never become ASCII substitutions.

### Detection Implementation
- Apply primary classification, then context rules, then token/script rules.
- Use UTS #39 augmented script sets and allow Latin plus Japanese/Chinese/Korean combinations.
- Browser Unicode regular expressions determine Script and General_Category; newer characters may be unknown.
- Keep the textarea value plus selected input mode as the only source of the analyzed text.
- Preserve CR through escape mode, since a textarea normalizes CR to LF. Never silently lose CR in sample/URL input.
- Analyze at most 100,000 code points; render 5,000 logical characters and at most 1,000 table rows.
- Render natural visual order separately from logical order with safe labels for controls.
- All UI messages go through t(key, params) and the selected dictionary; static HTML uses data-i18n attributes.
- Unknown languages/keys and missing placeholders fail explicitly. Keep both key and placeholder sets equal.
- Language switching preserves A/B input, modes, revision, analysis, chosen character, removal selection, focus and notices.
- Store notices as key/params; async completions render using the language at completion.

### Explicit Actions and Privacy

- Compare exact, NFC, NFKC, the existing comparison transform and Japanese-pair equality independently.
- Partial analysis or invalid escape input cannot produce a definitive comparison/removal result.
- Removal uses code point indices; defaults select only high-concern candidates, never mutating the original.
- Input/mode changes invalidate action snapshots before debounced analysis; revision guards block stale copying/saving.
- Read one strict UTF-8 file up to 1MiB and 100,000 code points. Preserve BOM/CRLF/lone CR/NUL; reject UTF-16 and malformed UTF-8.
- File reads use request/revision guards, so older asynchronous reads cannot overwrite newer input.
- Reports default to summary-only. Details escape every original code point and are recoverable, not anonymous.
- Cap reports at 5MiB, character details at 1,000, tokens/candidates at 100; distinguish omission from partial analysis.
- Share only A via #v=2&mode=escape&text=; URLSearchParams encodes once, maximum URL length 8,000 ASCII characters.
- Never include B, filename, source or findings in sharing, and never rewrite the address bar automatically.
- Clipboard and download failures are caught and translated. No execCommand fallback or external calls.

## Development Commands

This is a static site with no build process:
- **Run locally**: Open `index.html` directly, or run `python -m http.server 8000 --bind 127.0.0.1`
- **Deploy**: Push to GitHub Pages (configured with `.nojekyll`)
- **Testing**: `npm test` (Node 22 or newer, node --test, no dependencies)
- **Check data**: `node tools/build-confusables.js --check`
- **Check context data**: `node tools/build-context-data.js --check`
- **Check samples**: `node tools/build-samples-md.js --check`
- **Regenerate**: Run generators without --check. Do not hand-edit generated data or either sample guide.
- **CI**: .github/workflows/test.yml runs npm test on push and pull_request using Node 22.

Use fixed expectations in test/; do not change them to accommodate an implementation bug.
Do not modify the bundled Unicode originals or license. Four SHA-256 fixtures protect the supplied data pipeline.

## URL Parameter API

The tool accepts GET parameters for external tool integration:
```
?text={URLエンコードされた文字列}&source={呼び出し元}&attack_type={攻撃タイプ}
```
- `text`: String to analyze (URL-encoded)
- `source`: Calling tool name (e.g., `clipthreat-studio`)
- `attack_type`: Optional attack type label

Both HTTP and file:// accept query parameters and #text= fragments. A fragment containing text takes precedence.
URLSearchParams decodes once; do not call decodeURIComponent again.
Query contents reach the hosting server and may be logged. Fragment contents are not sent to the server.
Keep ?text= compatibility with ClipThreat Studio; source and attack_type are display-only, untrusted strings.
Versioned fragments use escape mode to preserve CR, BOM and unpaired surrogates. Unknown versions/modes show a warning.
Fragments are not normally sent to the host but are visible to recipients, history and the clipboard. They are not secret storage.

## Script Load Order

In `index.html`, scripts must load in this order:
1. `weirdstring-data.js`
2. `weirdstring-context-data.js`
3. `weirdstring-messages.js`
4. `weirdstring-logic.js`
5. `weirdstring-actions.js`
6. `samples.js`
7. `script.js`

All are classic scripts, not ES modules. Pure files also expose conditional CommonJS exports for Node tests.

## Important Notes

- UI and documentation support Japanese and English; inspected strings never change with the UI language.
- Designed for GitHub Pages deployment
- Educational tool for understanding Unicode-based security vulnerabilities
- No external dependencies or frameworks
- Invisible/bidirectional characters in documented examples and both sample guides are intentional; arbitrary report input is escaped.
- Tests compare literal documentation examples with their escaped notation; four control-character samples use placeholders.
- Render untrusted text with textContent/value only. No innerHTML, inline handlers/styles, input logging or network calls.
- Preserve the CSP, no-referrer policy, external-link rel attributes, and keyboard focus behavior.
- Sample tabs use data-category and ARIA, not visible text matching; Arrow keys, Home and End select tabs.
- Help uses dialog.showModal(), Escape, a close button, backdrop close, focus containment and focus return.
- Storage is optional: catch failures; use prefers-color-scheme for theme and the first supported browser language, then English.
- Store only valid theme and language values, never input, filenames or findings.
- HTTP and file:// were verified with local Chromium; Firefox/Safari remain unverified.
