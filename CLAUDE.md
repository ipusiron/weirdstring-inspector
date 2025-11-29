# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeirdString Inspector is a client-side web application for detecting and visualizing suspicious Unicode characters. It's a security/forensics tool designed for educational purposes and CTF challenges, part of the "100 Security Tools with Generative AI" project (Day 023).

## Architecture

This is a vanilla JavaScript single-page application with no build process or dependencies:
- **index.html**: Main UI interface
- **script.js**: Core detection logic using Set-based Unicode character matching
- **samples.js**: Pre-defined sample strings for testing various Unicode anomalies
- **style.css**: Styling and layout

The application runs entirely in the browser without any backend requirements.

## Key Technical Details

### Character Detection Categories
The tool detects 9 categories of suspicious characters:
1. **Invisible**: Zero-width spaces, BOM, non-breaking spaces
2. **Look-alike**: Cyrillic, Greek, full-width Latin characters that resemble ASCII
3. **Control**: Control characters, RLO, tabs, CR, BEL
4. **Zalgo**: Combining diacritical marks
5. **Bidirectional**: LRI, RLI, PDF text direction controls
6. **Punctuation**: Confusing punctuation marks
7. **Emoji ZWJ**: Zero-width joiner emoji sequences
8. **Whitespace**: Various deceptive whitespace characters
9. **Confused Scripts**: Mixed scripts like Arabic/Devanagari

### Detection Implementation
- Uses JavaScript Sets with specific Unicode code points for each category
- Real-time analysis as user types
- Color-coded highlighting with tooltips showing Unicode code points
- Category-based statistics display

## Development Commands

This is a static site with no build process:
- **Run locally**: Open `index.html` directly in a browser, or use a local web server (`python -m http.server` or `npx serve`) for URL parameter testing
- **Deploy**: Push to GitHub Pages (configured with `.nojekyll`)
- **Testing**: Manual testing using the built-in samples in `samples.js`
- **Debugging**: Use browser console to see `debugCharCodes()` output showing Unicode code points for each character

No linting, build, or test commands are configured.

## URL Parameter API

The tool accepts GET parameters for external tool integration:
```
?text={URLエンコードされた文字列}&source={呼び出し元}&attack_type={攻撃タイプ}
```
- `text`: String to analyze (URL-encoded)
- `source`: Calling tool name (e.g., `clipthreat-studio`)
- `attack_type`: Optional attack type label

Note: URL parameters only work when served via HTTP server, not when opening `index.html` directly.

## Script Load Order

In `index.html`, scripts must load in this order:
1. `samples.js` - Sample data definitions (`sampleData` object)
2. `script.js` - Main application logic (depends on `sampleData`)

## Important Notes

- All text is in Japanese (README, UI labels, comments)
- Designed for GitHub Pages deployment
- Educational tool for understanding Unicode-based security vulnerabilities
- No external dependencies or frameworks