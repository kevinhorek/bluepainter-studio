# Changelog

All notable changes to the BluePainter VS Code extension.

## 0.3.0 — 2026-11-12

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

## 0.2.0

- Sidebar panel and canvas editor tab, inspector, Designer's Receipts with one-click fixes.
- AST write-back for inline `style`, text and image `src` on elements with stable `id`s.
- Per-file session persistence.
