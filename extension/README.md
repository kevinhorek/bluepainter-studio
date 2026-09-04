# BluePainter for VS Code

**Visual canvas ↔ code sync with AST preservation and Designer's Receipts for React/TSX**

BluePainter brings visual editing to your existing React codebase while preserving formatting, comments, and team design policy.

**📖 New to BluePainter?** See [EXTENSION_PILOT.md](https://github.com/kevinhorek/bluepainter-studio/blob/main/EXTENSION_PILOT.md) for a comprehensive first-session guide (5 minutes).

## Features

### 🎨 Visual Canvas Editor
- Edit React components visually in a canvas view
- Drag, resize, and style elements directly
- Changes write back to your TSX files with AST-based code generation

### 🔄 Bidirectional Sync
- **Canvas → Code**: Visual edits update your TSX files with merge-ready code
- **Code → Canvas**: Manual code changes reflect on canvas
- **Formatting preserved**: Comments, spacing, and structure survive visual edits (powered by Recast/Babel)
- **Write confirmation**: Toast shows file path when changes are written, confirming merge-ready status

### ✅ Designer's Receipts
Live policy checks that enforce team design standards:

- **Spacing grid** (default 8px) — catches off-grid padding
- **Border radius grid** (default 4px) — maintains consistent corner rounding
- **WCAG contrast** (4.5:1 minimum) — blocks merge on low-contrast buttons
- **CTA copy** — flags weak call-to-action text
- **Feature clutter** — warns when lists exceed team max

All rules are configurable via VS Code settings.

### 📊 Learning Loop
Every fix, dismiss, and policy change is logged to help improve team-specific rules over time.

## Quick Start

### First Session (5 minutes)

1. Open BluePainter sidebar (🎨 paintcan icon in activity bar)
2. Run `BluePainter: Pick Component` (Cmd/Ctrl+Shift+P)
3. Select a TSX/JSX file from your workspace
4. Review Designer's Receipts in the Receipts tab
5. Apply fixes or dismiss rules as needed

**For detailed walkthrough:** See [EXTENSION_PILOT.md](https://github.com/kevinhorek/bluepainter-studio/blob/main/EXTENSION_PILOT.md)

### Commands

- `BluePainter: Open Sidebar Panel` — Open the canvas in the sidebar
- `BluePainter: Open Canvas Editor` — Open full canvas editor
- `BluePainter: Sync Canvas from File` — Pull latest code changes to canvas
- `BluePainter: Write Canvas to File` — Push canvas changes to code

## Requirements

- **VS Code** 1.85.0 or higher
- **React/TSX files** with `id` attributes on elements you want to edit visually

## Extension Settings

This extension contributes the following settings:

- `bluepainter.spacingGrid`: Spacing grid in pixels (default: 8)
- `bluepainter.radiusGrid`: Border radius grid in pixels (default: 4)
- `bluepainter.minContrastRatio`: Minimum WCAG contrast ratio (default: 4.5)
- `bluepainter.maxFeatureCount`: Maximum feature list items (default: 5)
- `bluepainter.weakCtaWords`: Weak CTA words to flag (default: ["submit", "click here", "send", "button", "ok", "enter"])
- `bluepainter.suggestedCta`: Suggested CTA copy (default: "Start free trial")
- `bluepainter.contrastFixColor`: Color applied by contrast fix (default: "#1e40af")

## Known Limitations

- **Inline styles only** — Tailwind/CSS modules not supported in v0.2
- **Component instances** — Complex nested components are skipped
- **Simple layouts** — Best for pricing cards, hero sections, and similar components

See [AST_SCOPE.md](https://github.com/kevinhorek/bluepainter-studio/blob/main/AST_SCOPE.md) for full technical scope.

## Troubleshooting

**Common issues:**
- "No components found" → Workspace needs `.tsx` or `.jsx` files
- "0 syncable ids" → Elements need `id` attributes for round-trip sync
- "Parse error" → Check VS Code problems panel for syntax errors

**For detailed troubleshooting:** See [EXTENSION_PILOT.md § Troubleshooting](https://github.com/kevinhorek/bluepainter-studio/blob/main/EXTENSION_PILOT.md#troubleshooting)

## Live Demo

Try the web version at [bluepainter-studio.vercel.app](https://bluepainter-studio.vercel.app)

## Feedback & Issues

- [Report issues](https://github.com/kevinhorek/bluepainter-studio/issues)
- [Share feedback](https://github.com/kevinhorek/bluepainter-studio/discussions)

## Release Notes

### 0.2.0

- AST-based sync with formatting preservation
- Configurable Designer's Receipts
- Learning loop event logging
- Full sidebar and canvas editor views

---

**[View source on GitHub](https://github.com/kevinhorek/bluepainter-studio)** | **[Try the demo](https://bluepainter-studio.vercel.app)**
