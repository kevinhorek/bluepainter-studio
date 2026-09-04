# Change Log

All notable changes to the BluePainter VS Code extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-09-04

### Added
- AST-based bidirectional sync between canvas and code (Recast + Babel)
- Designer's Receipts policy engine with configurable rules:
  - Spacing grid enforcement (default 8px)
  - Border radius grid enforcement (default 4px)
  - WCAG contrast ratio checks (default 4.5:1)
  - CTA copy quality validation
  - Feature list clutter detection
- Learning loop event logging for policy improvements
- Full sidebar panel and canvas editor views
- Component picker command for quick file selection
- Write confirmation toast showing file path
- Git context detection for learning loop enrichment
- Design system and monorepo detection with helpful tips

### Changed
- Improved error messages with actionable guidance
- Enhanced first-run experience with tips and validation
- Polished receipt dismiss/apply workflow
- Updated README with comprehensive quick start guide

### Fixed
- Formatting preservation during visual edits
- AST patching for complex JSX structures
- Comment and whitespace retention
- Inline style synchronization edge cases

## [0.1.0] - 2026-08-15

### Added
- Initial alpha release
- Basic canvas-to-code sync
- Simple receipt checking
- Proof-of-concept visual editor

---

**For full project changelog:** See [main repository CHANGELOG](https://github.com/kevinhorek/bluepainter-studio/blob/main/CHANGELOG.md)
