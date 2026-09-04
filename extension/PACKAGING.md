# Extension Packaging Guide

## Prerequisites

- Node.js 22+ (extension uses Babel 7.x + Recast)
- VS Code 1.85.0 or higher (for testing)
- `@vscode/vsce` (already in devDependencies)

## Quick Start

### 1. Install dependencies

```bash
cd extension
npm install
```

### 2. Package the extension

```bash
npm run package
```

This creates `bluepainter-0.2.0.vsix` in the `extension/` directory.

**Output:**
```
DONE  Packaged: /workspace/extension/bluepainter-0.2.0.vsix (23 files, 27.48 KB)
```

### 3. Test locally

Install the packaged extension in VS Code:

```bash
code --install-extension bluepainter-0.2.0.vsix
```

Or from VS Code:
1. Open Extensions view (Ctrl+Shift+X)
2. Click ··· menu → Install from VSIX
3. Select `extension/bluepainter-0.2.0.vsix`

### 4. Verify installation

1. Open a React/TSX project
2. Open a component file (e.g., `PricingCard.tsx`)
3. Click the BluePainter icon in the sidebar (paintcan)
4. Canvas should load with visual editor

## Package Contents

The VSIX includes:

```
bluepainter-0.2.0.vsix (27.48 KB)
├─ extension.js (16.83 KB) — main extension entry point
├─ package.json (4.24 KB) — extension manifest
├─ README.md — marketplace listing
├─ MARKETPLACE.md — publish checklist
├─ data/ — default component fixtures
│  ├─ heroNodes.json
│  └─ pricingNodes.json
├─ lib/ — core modules
│  ├─ astSyncEngine.js — Recast/Babel AST patching
│  ├─ babelPatch.js — AST node patching
│  ├─ bootstrap.js — template generation
│  ├─ receiptPolicy.js — Designer's Receipts engine
│  └─ learningLoop.js — event logging
├─ media/ — UI assets
│  ├─ icon.png (257 bytes) — extension icon
│  ├─ panel.js — webview UI
│  └─ panel.css
└─ test-fixtures/ — CI test components
   ├─ PricingCard.tsx
   └─ LowContrastCard.tsx
```

## Publishing to VS Code Marketplace

See [MARKETPLACE.md](./MARKETPLACE.md) for the full checklist.

**Quick summary:**

1. Create publisher account: https://marketplace.visualstudio.com/manage
2. Generate Personal Access Token (Marketplace scope)
3. Login and publish:

```bash
cd extension
npx vsce login bluepainter
npx vsce publish --no-dependencies
```

Or upload `bluepainter-0.2.0.vsix` manually in the publisher portal.

## Troubleshooting

### "Cannot find package 'recast'"

**Problem:** Dependencies not installed.

**Fix:**
```bash
cd extension && npm install
```

### "Icon not found"

**Problem:** `media/icon.png` missing.

**Fix:** Ensure `extension/media/icon.png` exists (should be 128×128px PNG).

### "vsce: command not found"

**Problem:** `@vscode/vsce` not installed.

**Fix:**
```bash
cd extension
npm install --save-dev @vscode/vsce
```

### Package size too large

**Current size:** 27.48 KB (well under 50 MB limit).

If you add large dependencies, use `--no-dependencies` flag (already set in `npm run package`).

## Version Bumps

1. Update `version` in `extension/package.json`
2. Add release notes to `extension/README.md`
3. Re-package:

```bash
cd extension
npm run package
```

New VSIX will reflect the updated version.

## CI Integration

The extension can be packaged in CI for automated releases:

**GitHub Actions example:**

```yaml
- name: Package extension
  run: |
    cd extension
    npm install
    npm run package
    
- name: Upload VSIX artifact
  uses: actions/upload-artifact@v4
  with:
    name: bluepainter-vsix
    path: extension/*.vsix
```

## Next Steps

- **Sideload testing:** Install on multiple VS Code versions (1.85+)
- **Pilot feedback:** Share VSIX with early users before Marketplace publish
- **Marketplace listing:** Complete [MARKETPLACE.md](./MARKETPLACE.md) checklist
- **Automated releases:** Set up GitHub Actions to package on tags

---

**Questions?** See [extension/README.md](./README.md) or [report an issue](https://github.com/kevinhorek/bluepainter-studio/issues).
