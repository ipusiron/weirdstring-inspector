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
- **Run locally**: Open `index.html` directly in a browser or use a local web server
- **Deploy**: Push to GitHub Pages (configured with `.nojekyll`)
- **Testing**: Manual testing using the built-in samples in `samples.js`

No linting, build, or test commands are configured.

## Important Notes

- All text is in Japanese (README, UI labels, comments)
- Designed for GitHub Pages deployment
- Educational tool for understanding Unicode-based security vulnerabilities
- No external dependencies or frameworks