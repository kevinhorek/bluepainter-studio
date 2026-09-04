# BluePainter Scripts

## Receipt Gate Checker

**`check-receipts.mjs`** — CI-ready receipt evaluation for TSX/JSX files.

### Purpose

Enforce Designer's Receipts (spacing, contrast, CTA copy, feature count) in CI or pre-merge. Fails builds on error-severity findings (e.g., WCAG contrast violations).

### Usage

```bash
# Check a single file
node scripts/check-receipts.mjs extension/test-fixtures/PricingCard.tsx

# Check multiple files
node scripts/check-receipts.mjs src/components/*.tsx

# Use custom config file
node scripts/check-receipts.mjs --config=.bluepainter.json src/components/*.tsx

# Via npm script (add to package.json)
npm run check:receipts
```

### Exit Codes

- `0` — All receipts passed (warnings allowed)
- `1` — One or more error-severity findings (e.g., contrast < 4.5:1)

### CI Integration

See `.github/workflows/receipt-gate.yml` for GitHub Actions example.

### Policy Configuration

Create `.bluepainter.json` in repo root to customize receipt policy:

```json
{
  "receiptPolicy": {
    "spacingGrid": 8,
    "radiusGrid": 4,
    "minContrastRatio": 4.5,
    "maxFeatureCount": 5,
    "weakCtaWords": ["submit", "click here", "send", "button", "ok", "enter"],
    "suggestedCta": "Start free trial",
    "contrastFixColor": "#1e40af"
  }
}
```

Default policy (if no config file):
- **Spacing grid:** 8px
- **Border-radius grid:** 4px
- **Min contrast ratio:** 4.5:1 (WCAG AA)
- **Max feature count:** 5
- **Weak CTA words:** submit, click here, send, button, ok, enter

The script auto-loads `.bluepainter.json` if present, or use `--config=path/to/config.json` to specify a different file.

### Supported Checks

| Rule | Severity | Blocks CI |
|------|----------|-----------|
| Button contrast (WCAG) | Error | ✅ Yes |
| Off-grid spacing | Warning | No |
| Off-grid border radius | Warning | No |
| Weak CTA copy | Warning | No |
| Feature list clutter | Warning | No |

### Limitations

- Requires `id` attributes on elements to parse
- Inline styles only (no Tailwind/CSS modules yet)
- Simple regex-based parser (production should use AST)

### Test Fixtures

- `extension/test-fixtures/PricingCard.tsx` — Passes receipts (1 CTA copy warning)
- `extension/test-fixtures/BadContrastButton.tsx` — Fails contrast check (demo only)

### Roadmap

- [ ] AST-based parser for production
- [ ] Load policy from `.bluepainter.json`
- [ ] Support Tailwind classes
- [ ] Custom rule plugins
- [ ] Team audit log integration
