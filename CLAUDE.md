# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeirdString Inspector is a client-side web application for detecting and visualizing suspicious Unicode characters. It's a security/forensics tool designed for educational purposes and CTF challenges, part of the "100 Security Tools with Generative AI" project (Day 023).

## Architecture

This is a vanilla JavaScript single-page application with no build process or dependencies:
- **index.html**: Main UI interface
- **script.js**: Input, rendering, character details, tabs, native help dialog and theme
- **weirdstring-logic.js**: Pure classification, context, token, hidden-content, escape and URL functions
- **weirdstring-data.js**: Generated ASCII-confusable mappings (Unicode 18.0.0; 2,249 entries, 423 targets)
- **weirdstring-messages.js**: Japanese messages and strict placeholder formatting
- **samples.js**: 41 educational examples in 11 groups
- **samples.md**: Generated sample reference, including literal invisible characters
- **style.css**: Styling and layout
- **test/**: Dependency-free Node tests, including documentation and source invariants
- **tools/**: Data/documentation generators and the bundled Unicode originals and license

The application runs entirely in the browser without any backend requirements.

## Key Technical Details

### Character Detection Categories
The tool detects 12 categories, in this order:
tag, bidi, variation, invisible, control, whitespace, private, zalgo, combining, compat, lookalike, mixed.
Severity is danger, caution or info; whole-input verdicts also include clean and empty.
Normal Japanese is not suspicious by itself. Emoji ZWJ and a single variation selector are informative, not dangerous.

### Detection Implementation
- Apply primary classification, then context rules, then token/script rules.
- Use UTS #39 augmented script sets and allow Latin plus Japanese/Chinese/Korean combinations.
- Browser Unicode regular expressions determine Script and General_Category; newer characters may be unknown.
- Keep the textarea value plus selected input mode as the only source of the analyzed text.
- Preserve CR through escape mode, since a textarea normalizes CR to LF. Never silently lose CR in sample/URL input.
- Analyze at most 100,000 code points; render 5,000 logical characters and at most 1,000 table rows.
- Render natural visual order separately from logical order with safe labels for controls.
- All dynamic UI messages go through t(key, params) and weirdstring-messages.js; do not add English UI yet.

## Development Commands

This is a static site with no build process:
- **Run locally**: Open `index.html` directly, or run `python -m http.server 8000 --bind 127.0.0.1`
- **Deploy**: Push to GitHub Pages (configured with `.nojekyll`)
- **Testing**: `npm test` (Node 22 or newer, node --test, no dependencies)
- **Check data**: `node tools/build-confusables.js --check`
- **Check samples**: `node tools/build-samples-md.js --check`
- **Regenerate**: Run either generator without --check. Do not hand-edit weirdstring-data.js or samples.md.
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

## Script Load Order

In `index.html`, scripts must load in this order:
1. `weirdstring-data.js`
2. `weirdstring-messages.js`
3. `weirdstring-logic.js`
4. `samples.js`
5. `script.js`

All are classic scripts, not ES modules. Pure files also expose conditional CommonJS exports for Node tests.

## Important Notes

- All text is in Japanese (README, UI labels, comments)
- Designed for GitHub Pages deployment
- Educational tool for understanding Unicode-based security vulnerabilities
- No external dependencies or frameworks
- Invisible/bidirectional characters in README, samples.md, help and examples are intentional. Do not remove or escape them.
- Tests compare literal documentation examples with their escaped notation; four control-character samples use placeholders.
- Render untrusted text with textContent/value only. No innerHTML, inline handlers/styles, input logging or network calls.
- Preserve the CSP, no-referrer policy, external-link rel attributes, and keyboard focus behavior.
- Sample tabs use data-category and ARIA, not visible text matching; Arrow keys, Home and End select tabs.
- Help uses dialog.showModal(), Escape, a close button, backdrop close, focus containment and focus return.
- Storage is optional: catch failures and use prefers-color-scheme when no valid stored theme is available.
- HTTP and file:// were verified with local Chromium; Firefox/Safari remain unverified.
