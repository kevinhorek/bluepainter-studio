# AST Sync Scope — BluePainter v1

This document defines the **lossless scope** for AST-preserving bidirectional sync between canvas edits and TSX code in BluePainter Studio and the VS Code extension (SPEC.md §5 requirement).

## Supported Node Types

BluePainter v1 AST sync supports the following node types for bidirectional canvas ↔ code synchronization:

| Node Type | JSX Elements | Syncable Properties | Notes |
|-----------|--------------|---------------------|-------|
| **Container** | `<div>`, `<section>`, `<article>` | `style` (inline), `className` | Preserves children structure |
| **Text** | `<p>`, `<span>`, `<h1>`–`<h6>` | `text` content, `style`, `className` | Text content syncs bidirectionally |
| **Button** | `<button>` | `text` content, `style`, `className` | CTA copy and styling |
| **Image** | `<img>` | `src`, `alt`, `style`, `className` | Self-closing element |
| **Line** | `<hr>` | `style`, `className` | Self-closing divider |
| **Shape** | `<div role="presentation">` | `style`, `className` | Generic visual elements |
| **List** | `<ul>`, `<ol>` | `style`, `className` | Container for list items |
| **List Item** | `<li>` | `text` content, `style`, `className` | Child of list containers |
| **Component Instance** | Any imported component | Reference only | Placeholder; internal structure not synced in v1 |

## Supported Style Properties

All inline styles are synced via the `style={{ ... }}` JSX attribute. Supported CSS properties (v1):

### Layout
- `padding`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`
- `margin`, `marginTop`, `marginRight`, `marginBottom`, `marginLeft`
- `width`, `height`, `minWidth`, `minHeight`, `maxWidth`, `maxHeight`
- `display`, `flexDirection`, `alignItems`, `justifyContent`, `gap`

### Visual
- `background`, `backgroundColor`
- `color` (text color)
- `border`, `borderWidth`, `borderColor`, `borderStyle`, `borderRadius`
- `boxShadow`
- `opacity`

### Typography
- `fontSize`, `fontWeight`, `fontFamily`
- `lineHeight`, `letterSpacing`
- `textAlign`, `textDecoration`

### Position
- `position`, `top`, `right`, `bottom`, `left`
- `zIndex`

**Note:** Style values are written as-is (e.g., `16` for pixels, `"#ff0000"` for colors, `"center"` for alignment). The AST patch preserves numeric literals and string literals without conversion.

## Component Boundaries

### ✅ In Scope (v1)
- **Single-file components** with stable `id` attributes on elements
- **Flat or shallow hierarchies** (containers with text/button/image children)
- **Known templates** (`PricingCard`, `HeroSection`) bootstrapped from filenames
- **Imported components** as read-only instances (placeholder on canvas, not editable internally)

### ❌ Out of Scope (v1)
- **Multi-file component graphs** (component defined in one file, edited in another)
- **Dynamic `id` generation** (template literals, computed ids)
- **Tailwind classes** — className syncs as a string, but Tailwind utilities are not parsed or merged intelligently
- **CSS Modules** — scoped class name resolution not supported
- **Conditional rendering** — `{condition && <Element />}` structure synced, but condition logic not editable on canvas
- **Mapped children** — `.map()` structure preserved, but individual mapped nodes not independently editable
- **Fragments** (`<>` / `<React.Fragment>`) — children synced, but fragment wrapper itself not a canvas node

## AST Preservation Guarantees

When BluePainter performs an AST patch (canvas → code or code → canvas):

### ✅ Preserved
- **Comments** (line comments `//` and block comments `/* */`)
- **Formatting and indentation** (spaces, tabs, newlines)
- **Import statements** (order and structure)
- **Non-synced code** (logic outside the component tree, event handlers, hooks)
- **Attribute order** (unless `id` or `style` is modified)

### ⚠️ Modified
- **`style` attribute** — rewritten as `style={{ key: value, ... }}` when changed on canvas
- **Text content** — rewritten as `<Tag>New Text</Tag>` when changed on canvas
- **`src` attribute** (images) — rewritten as `src="new-url"` when changed

### ❌ Not Preserved (fallback to template generation)
If AST patching fails (e.g., malformed JSX, missing closing tags, or unsupported Babel constructs), BluePainter **falls back to template generation** and warns the user. This is a fail-loud behavior (SPEC.md §5 requirement).

## Required Element Structure

For reliable AST sync, elements must have:

1. **Stable `id` attributes**:
   ```jsx
   <div id="pricing-card-frame">...</div>
   ```
   IDs must be unique within the file and **string literals** (not template literals or expressions).

2. **Supported JSX syntax**:
   - Self-closing tags for void elements: `<img src="..." />`
   - Properly nested opening/closing tags: `<div>...</div>`
   - Valid attribute syntax: `id="value"` or `style={{ key: value }}`

3. **No computed IDs**:
   ```jsx
   ❌ <div id={`node-${index}`}>  // Not syncable
   ✅ <div id="node-1">            // Syncable
   ```

## Conflict Behavior

See [CONFLICT_MODEL.md](./CONFLICT_MODEL.md) for full documentation of how BluePainter handles simultaneous canvas and code edits.

**v1 summary:** Last-write-wins with user prompt when a conflict is detected (code changed externally while canvas state is dirty).

## Testing AST Sync

Run the automated AST sync test:

```bash
node scripts/test-ast-sync.mjs
```

Expected output:
```
=== ✓ All tests passed! AST sync is working correctly ===
```

## Versioning

This document describes **AST Scope v1.0** (BluePainter prototype → v1 launch).

Future versions may expand support to:
- Tailwind class merging
- Multi-file component graphs
- Responsive breakpoints (canvas multi-viewport)
- Advanced layout (Grid, absolute positioning)

---

*Last updated: September 2026*
