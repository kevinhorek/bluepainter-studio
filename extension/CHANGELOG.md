# Change Log

All notable changes to the BluePainter VS Code extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-11-13

### Fixed
- The packaged VSIX now ships its runtime dependencies (`@babel/*`, `recast`); 0.2.0 was packaged with `--no-dependencies` and could not activate outside the repo.
- The sidebar is declared as a webview view, so the BluePainter panel actually renders.
- Canvas edits keep working while a webview has focus: the extension remembers the last TSX/JSX editor and writes back with a `WorkspaceEdit`.
- A file with a syntax error no longer blanks the canvas; the last good state is kept and **Sync Canvas from File** reports the parse error.
- **Sync Canvas from File** rebuilds the node tree, so ids added to or removed from the file are picked up.
- Demo templates (Pricing/Hero) are only used when the file really contains the template's ids; other files are built from their own JSX `id`s.

### Changed
- Write-back uses the non-destructive sync engine from the web app: dynamic style props, spreads, nested/dynamic text, comments and formatting are left alone; negative numbers, JSX-special characters and image `src` round-trip. A no-op write-back is byte-identical.
- List items (`<li>`) are editable text nodes.
- The contrast receipt measures against the element's real text colour and is skipped when there is no button or the colour can't be parsed.
- Saving a file re-syncs quietly (no toast on every save).

### Added
- `bluepainter.weakCtaWords` setting — the CTA labels the copy receipt flags.
- `npm test` — round-trip test on `test-fixtures/PricingCard.tsx` (plain Node, no VS Code host).

### Known limitations
- Editing multi-line JSX text re-indents that text and its closing tag.
- Adding, removing or reordering elements and Tailwind classes are not synced (see `AST_SCOPE.md`).

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
