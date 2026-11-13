# BluePainter VS Code Extension — First Session Guide

Quick-start guide for evaluating BluePainter's visual canvas editor and Designer's Receipts directly in your IDE.

---

## What you'll experience

- **Pick Component** — quick-open TSX/JSX files with component list
- **Visual Canvas** — see your component rendered with live editing
- **Designer's Receipts** — policy checks (spacing, contrast, copy, features)
- **One-click fixes** — remediate issues without leaving the IDE
- **Conflict detection** — safe merge when file changes externally
- **Learning suggestions** — weighted recommendations after 3+ interactions

---

## Prerequisites

- VS Code or Cursor IDE (1.85.0+)
- Workspace with React/TSX components
- Node.js 22+ (optional, for CI gate scripts)

---

## Installation

### From VSIX file

```bash
# Download bluepainter-0.2.0.vsix from releases
code --install-extension bluepainter-0.2.0.vsix
```

### Or build from source

```bash
cd extension
npm install
# Press F5 in VS Code to launch Extension Development Host
```

---

## Your First Session (5 minutes)

### Step 1: Open BluePainter sidebar

1. Click the **paint can icon** (🎨) in VS Code activity bar
2. Or use **Command Palette** (`Cmd+Shift+P` / `Ctrl+Shift+P`) → `BluePainter: Open Sidebar Panel`

You'll see a welcome tip at the top of the panel. Dismiss it when ready.

### Step 2: Pick a component

**Command Palette** → `BluePainter: Pick Component`

- Extension scans workspace for `.tsx` and `.jsx` files
- Select a component from the list (try `PricingCard.tsx` or `HeroSection.tsx`)
- Component appears in canvas with live preview

**What the extension does:**
- Parses component AST with Babel
- Counts syncable nodes (elements with `id="..."` attributes)
- Evaluates Designer's Receipts against team policy

### Step 3: Review receipts

Switch to **Receipts tab** in the panel.

| Receipt | What it checks |
|---------|----------------|
| Spacing grid | Padding aligns to 8px (configurable) |
| Contrast | Button text meets WCAG AA (4.5:1) |
| CTA copy | Avoids weak words ("click here", "submit") |
| Border radius | Corners fit 4px scale (configurable) |
| Feature count | Lists stay under 5 items (configurable) |

**Colors:**
- ✅ Green border = passing
- 🔴 Red border = failing (requires fix)

**Actions:**
- **Apply fix** — one-click remediation (updates canvas + code)
- **Dismiss** — hide rule for this session

### Step 4: Apply a fix

1. Find a failing receipt (red border)
2. Click **Apply fix** button
3. Extension updates the canvas AND writes back to your TSX file
4. Changes preserve formatting (Recast AST sync)

**Behind the scenes:**
- Extension logs `receipt_fix_applied` event to learning loop
- After 3+ fixes for the same rule, you'll see a learning suggestion

### Step 5: Edit in canvas

Switch to **Inspector tab**:

1. Select a node on the canvas (click it)
2. Edit properties: padding, background, text, border-radius
3. Click **Apply changes**
4. Extension syncs changes back to code

**Round-trip guarantee:**
- Text edits reliably round-trip to TSX
- Inline style edits update code (some complex styles may require manual tweaking)

### Step 6: Conflict handling

**What happens if the file changes while you're editing?**

1. Extension tracks `lastSyncedVersion` of the document
2. When you write back, it detects conflicts
3. You get 3 options:
   - **Overwrite with canvas** — your canvas changes win
   - **Discard canvas changes** — file changes win
   - **Cancel** — review manually

**Logged to learning loop:**
- `conflict_resolved` event with resolution choice

### Step 7: Dismiss a rule

If a receipt doesn't apply to your component:

1. Click **Dismiss** button on the receipt
2. Rule disappears for this session
3. Extension logs `receipt_dismissed` event

**After 3+ dismisses** for the same rule, you'll see a **learning suggestion** to downgrade severity or hide the rule.

---

## Learning Suggestions (after 3+ interactions)

The extension tracks fixes and dismisses in a local learning loop.

**Suggestions appear in the Receipts tab:**

| Suggestion Type | When it triggers |
|-----------------|------------------|
| Downgrade rule | You dismiss the same rule 70%+ of the time |
| Prefer quick-fix | You apply the same fix 3+ times |

**To apply a suggestion:**
1. Review the suggestion card (shows reason, weight, and action)
2. Click **Apply**
3. Extension updates policy (hidden rules) or preferences (preferred fixes)

**Data storage:**
- Learning loop: VS Code global state (survives workspace changes)
- Session state: Per-file state (dismissed rules, canvas edits)

---

## Customize Policy (Optional)

Create `.bluepainter.json` in repo root:

```json
{
  "receiptPolicy": {
    "spacingGrid": 8,
    "radiusGrid": 4,
    "minContrastRatio": 4.5,
    "maxFeatureCount": 5,
    "weakCtaWords": ["submit", "click here", "send"],
    "suggestedCta": "Start free trial",
    "contrastFixColor": "#1e40af",
    "ruleSeverities": {
      "copy": "info"
    }
  }
}
```

**Rule severities:**
- `error` — blocks CI (contrast only by default)
- `warning` — logged, does not block
- `info` — hidden from receipts

---

## Expected Behavior (v0.2)

### ✅ What works

- Parse React/TSX files with Babel AST
- Evaluate receipts (spacing, contrast, copy, radius, features)
- One-click fixes update component code
- Canvas ↔ code sync preserves formatting (Recast)
- Conflict detection with 3-way resolution
- Learning loop tracks fixes/dismisses
- First-run tip dismissible per install

### ⚠️ Known limitations (prototype)

- Text edits round-trip reliably; some style edits (e.g. text color) may not write back to inline-style object
- Canvas sync is AST-first with regex fallback
- No Figma bidirectional sync yet (v2)
- Learning loop uses VS Code global state (no team backend yet)

---

## Troubleshooting

### "No components found"

→ Ensure workspace has `.tsx` or `.jsx` files. Extension scans recursively (excludes `node_modules`).

### "AST sync failed" or "0 syncable ids"

→ Check that elements have `id` attributes. BluePainter requires stable IDs for round-trip sync.

Example:
```tsx
// ✅ Works
<div id="pricing-card-frame" style={{ padding: 24 }}>
  <button id="cta-button">Click me</button>
</div>

// ❌ Won't sync (no ids)
<div style={{ padding: 24 }}>
  <button>Click me</button>
</div>
```

### "Parse error" in sync count

→ Component has syntax errors or unsupported JSX patterns. Check VS Code problems panel.

### Receipts not showing

→ Run `BluePainter: Pick Component` command to reload. Receipts only evaluate when a component is loaded.

### Conflict modal appears unexpectedly

→ Another tool (e.g., Prettier, auto-format on save) modified the file. Choose **Overwrite with canvas** if you want to keep canvas edits.

---

## CI Integration (Optional)

Add Designer's Receipts gate to your CI pipeline:

**GitHub Actions** (`.github/workflows/receipt-gate.yml`):

```yaml
name: Designer's Receipts Gate

on: [pull_request]

jobs:
  receipts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm install --no-save
      - run: node scripts/check-receipts.mjs src/components/**/*.tsx
```

**Blocks merge on:**
- Error-severity receipts (e.g., contrast < 4.5:1)

**Warnings do not block merge.**

See [CI.md](./CI.md) for GitLab CI, Bitbucket Pipelines, and other systems.

---

## Feedback

Report bugs, suggest features, or request policy additions:

- **GitHub Issues:** https://github.com/kevinhorek/bluepainter-studio/issues
- **Email:** kevin@example.com

---

## Next Steps

After your first session:

1. **Try CI gate** — add receipt checks to your PR pipeline
2. **Customize policy** — create `.bluepainter.json` with team rules
3. **Apply learning suggestions** — after 3+ interactions, review and apply
4. **Pilot in real repo** — use on production components before merge

**Ready to start?** Install the extension, pick a component, and run your first receipt check.
