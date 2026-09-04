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

**From VSIX file:**

```bash
# Download bluepainter-X.X.X.vsix from releases
code --install-extension bluepainter-X.X.X.vsix
```

**Or build from source:**

```bash
cd extension
npm install
# Press F5 in VS Code to launch Extension Development Host
```

---

## 2. Pick a Component

Open any `.tsx` or `.jsx` file in your workspace.

**Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):**

```
BluePainter: Pick Component
```

Select a component from the list. The extension will:
- Parse the component AST
- Show syncable node count
- Display Designer's Receipts in the sidebar

---

## 3. Review Receipts

**Receipts Panel** shows live policy checks:

| Receipt | What it checks |
|---------|----------------|
| Spacing grid | Padding aligns to 8px (configurable) |
| Contrast | Button text meets WCAG AA (4.5:1) |
| CTA copy | Avoids weak words ("click here", "submit") |
| Border radius | Corners fit 4px scale (configurable) |
| Feature count | Lists stay under 5 items (configurable) |

**Actions:**
- **Apply fix** — one-click remediation
- **Dismiss** — hide rule for this session
- **Learning suggestions** — after 3+ dismisses, option to downgrade rule severity

---

## 4. Customize Policy (Optional)

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

## 5. Enable CI Gate (Recommended)

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

## 6. Run Validation Session (Facilitator Mode)

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

## 7. Expected Behavior

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

## 8. Feedback

Report bugs, suggest features, or request policy additions:

- **GitHub Issues:** https://github.com/kevinhorek/bluepainter-studio/issues
- **Facilitator export:** Use session scorecard JSON export for structured feedback
- **Email:** kevin@example.com

---

## Quick Troubleshooting

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
