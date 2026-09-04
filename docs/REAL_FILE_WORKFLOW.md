# Real File Workflow Guide

Guide for using BluePainter Studio and Extension on your own repository components.

## Studio: Load, Edit, Download

### 1. Open a Real Component File

**From Studio header:** Click **📂 Open File** button

**Supported files:** `.tsx` and `.jsx` React components

**Requirements:**
- Elements must have stable `id="..."` attributes
- Use inline `style={{}}` for canvas-editable properties
- Tailwind classes are preserved but not editable on canvas

### 2. What Happens During Load

BluePainter validates your file in multiple steps:

1. **Extension check** — Only .tsx/.jsx files accepted
2. **Content validation** — Ensures file is not empty
3. **AST parsing** — Parses component structure with Babel
4. **Node validation** — Checks for syncable elements with `id` attributes
5. **Pattern detection** — Warns about Tailwind-only or CSS Modules usage

### 3. Common Validation Messages

#### ✅ Success
```
Loaded "PricingCard.tsx" — 12 nodes
```
Your file is ready for canvas editing.

#### ⚠️ Warnings (Non-blocking)

**Tailwind-only detected:**
```
Tailwind-only component detected. Classes are preserved but NOT 
editable on canvas.

💡 Add inline style={{}} for canvas-editable properties alongside 
Tailwind classes.

Example:
<div className="flex gap-4" style={{ padding: 16 }}>...</div>
```

**CSS Modules detected:**
```
CSS Modules detected. Module classes are NOT supported for canvas editing.

💡 Use inline style={{}} for canvas-editable properties.
```

**Low node count:**
```
Only 1 syncable element found. Add more id attributes for better 
canvas editing.
```

You can continue with warnings — they're informational only.

#### ❌ Errors (Blocking)

**No syncable elements:**
```
No syncable elements found. Components must have stable id="..." 
attributes on elements.

💡 Add id attributes to elements you want to edit on canvas:
<div id="container" style={{ padding: 16 }}>...</div>

📖 See AST_SCOPE.md § Required Element Structure
```

**Syntax error:**
```
Syntax error in file. Please ensure the component is valid TSX/JSX.
```

### 4. Edit on Canvas

Once loaded:
- Select elements by clicking on canvas
- Edit properties in inspector (padding, colors, text)
- Changes update canvas in real-time
- Code is regenerated via AST sync (preserves formatting)

**What syncs reliably:**
- ✅ Text content
- ✅ Inline style properties (padding, margin, colors, etc.)
- ✅ Basic layout (flex, positioning)

**What requires verification:**
- ⚠️ Text color changes (may not write to inline style)
- ⚠️ Complex nested styles
- ⚠️ Computed/dynamic values

### 5. Download Edited File

**From Studio header:** Click **💾 Download** button

Downloads the edited file with:
- All canvas changes applied
- AST-preserved formatting (comments, spacing, indentation)
- Original filename

**Review before committing:**
1. Check git diff to verify formatting preserved
2. Verify style changes match canvas edits
3. Test component renders correctly
4. Run lint/type-check

### 6. Troubleshooting

**"No components found"**
→ Ensure elements have `id` attributes

**"AST sync failed"**
→ Check for syntax errors or complex JSX patterns

**"Changes not writing back"**
→ Verify inline `style={{}}` exists on element

## Extension: Edit in VS Code

See [EXTENSION_PILOT.md](../EXTENSION_PILOT.md) for full guide.

**Quick workflow:**

1. Open your React project in VS Code
2. Command Palette → `BluePainter: Pick Component`
3. Edit on canvas, click **Write to file**
4. Changes sync back with AST preservation

**Key difference from Studio:**
- Extension writes directly to file (no download step)
- Conflict detection if file changed externally
- Session state persisted across VS Code restarts

## Best Practices for Own-Repo Usage

### 1. Prepare Components for Canvas Editing

**Add stable IDs:**
```tsx
export function PricingCard() {
  return (
    <div id="pricing-card-frame" style={{ padding: 24 }}>
      <h3 id="plan-name" style={{ fontSize: 18 }}>Pro</h3>
      <button id="cta-button" style={{ 
        background: '#1e40af', 
        color: '#fff' 
      }}>
        Start trial
      </button>
    </div>
  );
}
```

**Mix Tailwind + inline styles:**
```tsx
<div 
  id="card" 
  className="flex flex-col gap-4"  // Layout (not canvas-editable)
  style={{ padding: 24, borderRadius: 8 }}  // Design tokens (canvas-editable)
>
  ...
</div>
```

### 2. Use for Design Token Refinement

BluePainter excels at:
- Adjusting padding to align to 8px grid
- Fixing contrast ratios before merge
- Testing color variations
- Refining copy with team CTA guidelines

### 3. Validate with Receipts Before Merge

1. Load component in Studio or Extension
2. Review receipts tab for policy violations
3. Apply fixes (one-click)
4. Download/write-back
5. Commit changes with receipts validated

### 4. Enable CI Gate (Recommended)

Block merge on error-severity receipts:

```yaml
# .github/workflows/receipt-gate.yml
name: Designer's Receipts Gate
on: [pull_request]
jobs:
  receipts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install --no-save
      - run: node scripts/check-receipts.mjs src/components/**/*.tsx
```

See [CI.md](../CI.md) for full setup.

## Limitations (v1)

See [AST_SCOPE.md](../AST_SCOPE.md) for full technical scope.

**In scope:**
- Inline styles via `style={{}}`
- Text content
- Simple component trees
- Formatting preservation

**Out of scope:**
- Tailwind class editing (classes preserved but not modified)
- CSS Modules (not parsed)
- Conditional rendering logic
- Mapped children editing
- Complex dynamic values

## Feedback

Report issues or suggest improvements:
- [GitHub Issues](https://github.com/kevinhorek/bluepainter-studio/issues)
- Include: file type, error message, minimal reproduction

---

**Next:** See [PILOT.md](../PILOT.md) for pilot evaluation checklist.
