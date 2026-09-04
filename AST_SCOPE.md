# AST Sync Scope — BluePainter v1

This document defines the **lossless scope** for AST-preserving bidirectional sync between canvas edits and TSX code in BluePainter Studio and the VS Code extension (SPEC.md §5 requirement).

## Supported Node Types

BluePainter v1 AST sync supports the following node types for bidirectional canvas ↔ code synchronization:

| Node Type | JSX Elements | Syncable Properties | Notes |
|-----------|--------------|---------------------|-------|
| **Container** | `<div>`, `<section>`, `<article>` | `style` (inline) | `className` preserved but not modified by canvas |
| **Text** | `<p>`, `<span>`, `<h1>`–`<h6>` | `text` content, `style` (inline) | `className` preserved but not modified by canvas |
| **Button** | `<button>` | `text` content, `style` (inline) | `className` preserved but not modified by canvas |
| **Image** | `<img>` | `src`, `alt`, `style` (inline) | `className` preserved but not modified by canvas |
| **Line** | `<hr>` | `style` (inline) | `className` preserved but not modified by canvas |
| **Shape** | `<div role="presentation">` | `style` (inline) | `className` preserved but not modified by canvas |
| **List** | `<ul>`, `<ol>` | `style` (inline) | `className` preserved but not modified by canvas |
| **List Item** | `<li>` | `text` content, `style` (inline) | `className` preserved but not modified by canvas |
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
- `objectFit` (for image elements), `overflow`

### Typography
- `fontSize`, `fontWeight`, `fontFamily`, `fontStyle`
- `lineHeight`, `letterSpacing`
- `textAlign`, `textDecoration`, `textTransform`

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
- **Tailwind className utilities** — `className` attribute is preserved but not modified by canvas edits. Tailwind utility classes (e.g., `className="bg-blue-500 text-white"`) are not parsed, merged, or updated when you change styles on canvas. Use inline `style={{}}` for canvas-editable styling.
- **CSS Modules** — scoped class name resolution not supported. `className` strings are preserved but not interpreted.
- **`className` canvas editing** — Canvas style edits modify the `style={{}}` attribute only. Any existing `className` is preserved but remains unchanged. To edit Tailwind or CSS module classes, edit the code directly.
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

**User will see:** "AST sync failed. Code unchanged. Ensure elements have stable id attributes."

## Error Messages

When AST sync encounters unsupported patterns, you'll see one of these messages:

| Error | Cause | Solution |
|-------|-------|----------|
| "AST sync failed. Code unchanged. Ensure elements have stable id attributes." | Parse or patch failed | Check for missing `id` attributes, malformed JSX, or syntax errors |
| "AST parse failed: [reason]" | Code → canvas sync failed | Fix syntax errors in the code editor |
| "AST patch failed: [reason]" | Canvas → code sync failed | Ensure elements have unique string literal `id` attributes |

**Common Issues:**
- ❌ `<div id={`node-${idx}`}>` — Use string literals: `<div id="node-1">`
- ❌ Missing closing tag: `<div>` — Add: `</div>`
- ❌ Tailwind-only styling with no inline styles — Add `style={{}}` for canvas editability

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

## Best Practices for Canvas Editing

To get the most out of AST-preserving sync:

1. **Use inline styles for canvas-editable properties**
   ```jsx
   ✅ <button id="cta" style={{ background: '#1e40af', color: '#fff' }}>
   ❌ <button id="cta" className="bg-blue-700 text-white">  // className preserved but not editable on canvas
   ```

2. **Add stable `id` attributes to all syncable elements**
   ```jsx
   ✅ <div id="pricing-card">
   ❌ <div id={`card-${index}`}>  // Dynamic IDs not supported
   ```

3. **Keep Tailwind for layout, inline styles for design tokens**
   ```jsx
   ✅ <div id="card" className="flex gap-4" style={{ padding: 24, borderRadius: 8 }}>
   // Layout via Tailwind (not canvas-editable), spacing via inline style (canvas-editable)
   ```

4. **Avoid mixing style sources for the same property**
   ```jsx
   ❌ <div className="p-4" style={{ padding: 16 }}>  // Conflict: which padding wins?
   ✅ <div style={{ padding: 16 }}>  // Clear: use one style source
   ```

## Conflict Behavior

See [CONFLICT_MODEL.md](./CONFLICT_MODEL.md) for full documentation of how BluePainter handles simultaneous canvas and code edits.

**v1 summary:** Last-write-wins with user prompt when a conflict is detected (code changed externally while canvas state is dirty).

## Testing AST Sync

Run the full automated AST sync test suite:

```bash
npm run test:ast
```

**Coverage:**
- Basic parsing and patching consistency (PricingCard fixture)
- Advanced patterns: button lists, nested containers, feature lists
- Expanded patterns: deep nesting, arrays of elements, grid layouts, boolean/null values
- Card patterns: pricing cards, feature cards, testimonial cards, product cards with badges and icons
- Hero/Form/Nav patterns: hero sections, contact forms with labels/inputs/textareas, navigation bars, footers, stats sections
- Style source detection: Tailwind, CSS modules, inline styles, mixed

**Total:** 30 tests covering production-ready component patterns for landing pages, e-commerce, and app UIs

Expected output: All tests pass with green checkmarks

## Versioning

This document describes **AST Scope v1.0** (BluePainter prototype → v1 launch).

Future versions may expand support to:
- Tailwind class merging
- Multi-file component graphs
- Advanced layout (Grid, absolute positioning)

### Responsive Multi-Viewport Canvas

BluePainter v1 includes a **responsive multi-viewport canvas** that allows previewing and editing at different screen sizes (Desktop 1280px, Tablet 768px, Mobile 375px). See [RESPONSIVE.md](./docs/RESPONSIVE.md) for full documentation.

**What is synced:**
- ✅ All element structure, inline styles, text content, and code ↔ canvas AST sync work identically across all viewports
- ✅ The same `nodesMap` is used for all viewports, so edits at any size are reflected in the code

**What is NOT synced:**
- ❌ Responsive CSS media queries are not generated
- ❌ Per-viewport style overrides (there is only one `style={{}}` object, not one per breakpoint)
- ❌ Automatic layout adaptation (elements do not automatically reflow or stack for mobile)

---

*Last updated: September 2026*
