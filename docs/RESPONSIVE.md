# Responsive Multi-Viewport Canvas

BluePainter Studio supports responsive design workflows with a **multi-viewport canvas** that lets you preview and edit components at different screen sizes.

## Overview

The responsive viewport feature provides:
- **Viewport switcher UI** with three preset sizes: Desktop (1280px), Tablet (768px), and Mobile (375px)
- **Canvas frame scaling** that resizes the artboard to match the selected viewport
- **Preserved AST sync** across all viewports (code ↔ canvas synchronization continues to work)
- **Persistent selection** - viewport mode is saved to localStorage and restored on next session

## Using the Viewport Switcher

### Location
The viewport switcher appears at the **top center of the canvas area** when editing page files (e.g., `DashboardPage.tsx`, `MarketingPage.tsx`).

### Viewport Presets

| Viewport | Width | Icon | Keyboard Shortcut |
|----------|-------|------|-------------------|
| **Desktop** | 1280px | 🖥️ | D |
| **Tablet** | 768px | 📱 | T |
| **Mobile** | 375px | 📱 | M |

### How to Switch Viewports
1. Click any of the three viewport buttons in the switcher
2. The canvas frame will smoothly transition to the new width
3. The canvas status bar will update to show the current dimensions (e.g., "375 × 800" for mobile)
4. Your selection is persisted - the same viewport will be active when you return

## What is Synced (and What Isn't)

### ✅ Synced Across All Viewports

- **Element structure** - all nodes, children, and hierarchy
- **Inline styles** - padding, margins, colors, borders, etc.
- **Text content** - all text edits sync to code
- **Selection state** - when practical, your selected element is preserved
- **Code ↔ Canvas AST sync** - bidirectional sync continues to work normally

**Why it works:** All viewports share the same `nodesMap` data structure. When you edit an element at any viewport size, the change is reflected in the shared state and synced to the TSX code via the same AST patching mechanism.

### ❌ NOT Synced / Out of Scope (v1)

- **Responsive CSS media queries** - the viewport switcher does NOT generate `@media` queries or breakpoint-specific styles
- **Responsive layout rules** - elements do not automatically reflow or stack for mobile (you see the same layout at different canvas widths)
- **Per-viewport style overrides** - changing an element's padding at mobile size changes it at all sizes (there is only one `style={{}}` object)
- **Device-specific features** - touch interactions, mobile navigation patterns, etc.

## Technical Implementation

### State Management
- **Viewport mode state** is stored in `App.jsx` as `activeViewportMode` (default: `'desktop'`)
- **Persistence** via `localStorage` key: `'bluepainter-viewport-mode'`
- **Prop flow**: `App.jsx` → `VSCodeShell.jsx` → `CanvasView.jsx` → `ViewportSwitcher.jsx`

### Canvas Scaling Logic
The `CanvasView` component calculates the effective canvas width:

```javascript
const getViewportWidth = () => {
  if (!activeViewportMode || !isPageView) return null;
  const preset = VIEWPORT_PRESETS.find(v => v.id === activeViewportMode);
  return preset ? preset.width : null;
};

const effectiveViewportWidth = getViewportWidth();
const effectiveWidth = effectiveViewportWidth || (isPageView ? pageViewport.width : null);
```

The calculated width is applied to the `canvas-page-frame` element:
```javascript
<div
  id="canvas-page-frame"
  style={{
    width: effectiveWidth || pageViewport.width,
    minWidth: effectiveWidth || pageViewport.width,
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  }}
>
```

### AST Sync Preservation
The responsive viewport feature does NOT break AST sync because:
1. **Same `nodesMap` is used** - all viewports render from the same data structure
2. **Same `onUpdateNode` handler** - edits at any viewport trigger the same state update
3. **Same code generation** - `generateTSX()` is called with the same parameters
4. **No viewport-specific state** - element properties are not duplicated or branched by viewport

## Best Practices for Responsive Design

### 1. Use Inline Styles for Viewport-Agnostic Styling
```jsx
<div id="container" style={{ padding: 24, background: '#fff' }}>
  {/* This padding applies at all viewport sizes */}
</div>
```

### 2. Test at Multiple Viewports During Design
- Start with Desktop (1280px) for layout structure
- Switch to Tablet (768px) to verify content fits
- Switch to Mobile (375px) to catch truncation or overflow issues

### 3. Design Flexible Layouts
Use flexbox properties that adapt gracefully:
```jsx
<div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
  {/* Content will naturally reflow as canvas narrows */}
</div>
```

### 4. Avoid Fixed Widths for Content
```jsx
❌ <div style={{ width: 1200 }}>  // Will overflow on tablet/mobile
✅ <div style={{ width: '100%', maxWidth: 1200 }}>  // Adapts to viewport
```

## Limitations and Roadmap

### Current Limitations (v1)
- **Single style source** - no per-viewport style overrides
- **Manual responsiveness** - layouts don't automatically adapt (you must design flexible layouts)
- **No media query generation** - exported code does not include `@media` rules
- **Page files only** - viewport switcher only appears for pages (e.g., `DashboardPage.tsx`), not components (e.g., `PricingCard.tsx`)

### Future Enhancements (Post-v1)
- **Responsive breakpoints in AST sync** - per-viewport style overrides with media query codegen
- **Automatic layout suggestions** - AI-powered responsive layout transformations
- **Component viewport testing** - enable viewport switcher for component files
- **Custom viewport presets** - user-defined viewport sizes

## Fail-Loud Behavior

The viewport switcher is designed to be **fail-silent** for non-page files:
- **Component files** (e.g., `PricingCard.tsx`, `HeroSection.tsx`) do not show the viewport switcher
- **Reason:** Component files do not have an intrinsic viewport size (they are sized by their container)
- **Workaround:** Place the component in a page file to test it at different viewport sizes

If the viewport switcher does not appear when expected, check:
1. **Is this a page file?** Check `fileConfig.isPage` in `workspaceFiles.js`
2. **Is the canvas in page view?** The switcher requires `pageViewport` to be set
3. **Is `hideToolbar` true?** The switcher is hidden when `hideToolbar={true}`

## Related Documentation
- [AST_SCOPE.md](../AST_SCOPE.md) - Full AST sync scope and guarantees
- [CONFLICT_MODEL.md](../CONFLICT_MODEL.md) - How BluePainter handles canvas/code conflicts
- [SPEC.md](../SPEC.md) - BluePainter SPEC requirements (§5 covers AST sync)

---

*Last updated: September 2026*
