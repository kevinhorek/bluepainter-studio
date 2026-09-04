# BluePainter Pilot Checklist

Quick-start guide for pilot teams evaluating BluePainter in your real codebase.

**For IDE pilots:** See [EXTENSION_PILOT.md](./EXTENSION_PILOT.md) for a comprehensive first-session guide with the VS Code extension.

---

## Prerequisites

- VS Code or Cursor IDE
- Node.js 22+ (for CI gate scripts)
- Git repository with React/TSX components
- (Optional) `.bluepainter.json` for team policy

---

## 1. Install Extension

**Option A: From pre-built VSIX (recommended for pilots):**

```bash
# Download bluepainter-0.2.0.vsix from releases
code --install-extension bluepainter-0.2.0.vsix
```

**Option B: Build from source:**

```bash
cd extension
npm install
npm run package
# Then install: code --install-extension bluepainter-0.2.0.vsix
```

**Option C: Development mode (for contributors):**

```bash
cd extension
npm install
# Open extension/ folder in VS Code, press F5 to launch Extension Development Host
```

---

## 2. Pick a Component from Your Real Repo

**Prerequisites:**
- Open your React/TSX project workspace in VS Code
- Ensure components have `id="..."` attributes on elements you want to edit

**Steps:**

1. **Open any `.tsx` or `.jsx` file** from your project
2. **Command Palette** (`Cmd+Shift+P` / `Ctrl+Shift+P`) → `BluePainter: Pick Component`
3. Select your component from the list

The extension will:
- Parse the component AST with Babel
- Count syncable nodes (elements with `id="..."` attributes)
- Display the canvas in the sidebar
- Evaluate Designer's Receipts against your team policy

**What if no components appear?**
- Ensure your workspace has `.tsx` or `.jsx` files
- Check that components export a function/class that returns JSX
- Verify `id` attributes exist on elements (required for sync)

---

## 3. Edit on Canvas → Write Back to File

**Canvas Tab:**
- See your component rendered with live preview
- Click elements to select and edit properties
- Changes update the canvas immediately

**Inspector Tab:**
- Edit padding, background, text, border-radius
- Changes write back to your TSX file
- AST sync preserves formatting (Recast engine)

**Write to File:**
1. Make edits on canvas
2. Click **Write to file** button in sidebar footer
3. Extension updates your `.tsx` file with changes
4. Check git diff to verify formatting preserved

**Important:** Text edits round-trip reliably. Some style edits (e.g., text color via inline style) may require manual verification. See [AST_SCOPE.md](./AST_SCOPE.md) for full scope.

## 4. Review Receipts (Designer's Policy Checks)

**Receipts Tab** shows live policy violations:

| Receipt | What it checks | Default |
|---------|----------------|---------|
| Spacing grid | Padding aligns to grid | 8px |
| Contrast | Button text meets WCAG AA | 4.5:1 |
| CTA copy | Avoids weak words | "click here", "submit" |
| Border radius | Corners fit grid | 4px |
| Feature count | Lists stay under max | 5 items |

**Actions:**
- **Apply fix** — one-click remediation (updates canvas + code)
- **Dismiss** — hide rule for this session
- **Learning suggestions** — after 3+ dismisses, option to downgrade rule severity

---

## 5. Customize Policy for Your Team (Optional)

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

## 6. Enable CI Gate for Pull Requests (Recommended)

Add **Designer's Receipts Gate** to your CI pipeline.

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

**Fails on:**
- Error-severity receipts (e.g., contrast < 4.5:1)

**Warnings do not block merge.**

See `CI.md` for GitLab CI, Bitbucket Pipelines, and other systems.

---

## 7. Product Validation (Optional — for facilitators only)

For product validation feedback:

1. Open https://bluepainter-studio.vercel.app/?facilitator=1
2. Navigate to a component (Hero or PricingCard)
3. Make canvas edits (button text, color, padding)
4. Click `···` → **Share feedback**
5. Fill out: Interest, Pilot willingness, Notes
6. Submit

**Review metrics:**

`···` → **Session scorecard**

- Shows N sessions, "very interested" count, pilot willingness
- Per-session activation status (canvas↔code round-trips)
- Receipt actions count (fixes + dismisses)
- Kill criteria dashboard (SPEC §8: after 10 sessions, need 3+ very interested)

**Export:**

`···` → **Session scorecard** → **Export session JSON**

Share exported JSON with Kevin for go/no-go review.

---

## 8. Expected Behavior (v0.2)

**✓ What works (v0.2):**
- Parse React/TSX files with Babel AST
- Evaluate receipts (spacing, contrast, copy, radius, features)
- One-click fixes update component code
- Canvas ↔ code sync preserves formatting (Recast)
- Learning loop tracks fixes/dismisses
- CI gate blocks on error-severity receipts

**⚠️ Known limitations (prototype):**
- Text edits round-trip reliably; some style edits (e.g. text color) may not write back
- Canvas sync is AST-first with regex fallback
- No Figma bidirectional sync yet (v2)
- No multi-viewport canvas (v3)

See `README.md` "Prototype limitations" for full list.

---

## 9. Real Repo Workflow Summary

**Day-to-day usage on your own projects:**

1. Open your repo in VS Code
2. Pick a component with `BluePainter: Pick Component`
3. Edit visually on canvas (padding, colors, text, layout)
4. Apply receipt fixes for design policy violations
5. **Write to file** to sync changes back to code
6. Review git diff (formatting should be preserved)
7. Commit and push to your branch
8. CI gate blocks merge on error-severity receipts (if enabled)

**What makes receipts before merge?**
- Canvas edits update code with AST sync (preserves comments, spacing)
- Receipts catch policy violations before code review
- Learning loop tracks your fixes to improve team rules
- CI gate blocks merge on contrast failures (configurable)

**Typical pilot tasks:**
- Edit existing pricing card padding to align to 8px grid
- Fix low-contrast button before merge
- Update hero section CTA copy per team guidelines
- Add new component instance to dashboard page

See [EXTENSION_PILOT.md](./EXTENSION_PILOT.md) for a detailed first-session guide with step-by-step instructions.

## 10. Feedback

Report bugs, suggest features, or request policy additions:

- **GitHub Issues:** https://github.com/kevinhorek/bluepainter-studio/issues
- **Facilitator export:** Use session scorecard JSON export for structured feedback
- **Email:** kevin@example.com

---

## 11. Quick Troubleshooting

**"No components found"**
→ Ensure workspace has `.tsx` or `.jsx` files. Extension scans recursively.

**"AST sync failed"**
→ Check for missing `id` attributes on elements. BluePainter requires stable IDs for round-trip sync.

**CI gate not running**
→ Verify `scripts/check-receipts.mjs` is executable and Node 22+ is installed.

**Receipts not showing**
→ Run `BluePainter: Pick Component` command to reload.

---

**Ready to start?** Install the extension, pick a component, and run your first receipt check.
