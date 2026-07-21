# AST sync scope — BluePainter v1

This document defines what the **Recast + Babel** sync engine supports today. The demo uses AST-first sync (`astSyncEngine.js`) with regex fallback (`syncEngine.js`).

---

## Supported (v1 alpha)

| Area | Support |
|------|---------|
| **File shape** | Single exported function component per file |
| **JSX elements** | Must have stable `id="node-id"` matching canvas node map |
| **Styles** | Inline `style={{ key: value }}` object literals (numbers + strings) |
| **Text** | Text content on `text` / `button` node types |
| **Images** | `src` attribute on `img` with matching id |
| **Canvas → code** | Patch existing file in place (preserves comments, spacing, import order) |
| **Code → canvas** | Parse style/text/src from AST into node map |

---

## Not supported yet

- Tailwind classes, CSS modules, styled-components
- Adding/removing JSX nodes from canvas (structure changes require template regen)
- Component props other than `id`, `style`, `src`, text children
- Hooks, fragments, map/list generation
- TypeScript types on props (parsed but not round-tripped)
- 3-way merge / git conflict resolution

---

## Node id contract

Every synced layer must render with:

```tsx
<button id="cta-button" style={{ background: '#2563eb', ... }}>Start trial</button>
```

The `id` attribute is the join key between canvas and AST.

---

## Engine selection

1. **parseTSX** — tries `parseTSXWithAST`, falls back to regex
2. **generateTSX** — tries `patchTSXWithAST(existingCode)`, falls back to full template regen

---

## v1 extension

The VS Code extension (`extension/`) provides repo-native editing:

- Sidebar **canvas preview**, **inspector**, and **Designer's Receipts**
- **Canvas editor** tab for larger visual editing
- **AST write-back** via Recast (with Babel generator fallback in Node)
- Bootstrap from Pricing/Hero templates or JSX `id` attributes

See `extension/README.md` for install and commands.

---

*Last updated: July 2026*
