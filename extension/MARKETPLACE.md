# VS Code Marketplace publish checklist

## Pre-packaging verification

Before building the VSIX:

- [x] `private: false` in package.json
- [x] Icon at `media/icon.png` (128×128px PNG)
- [x] Repository, homepage, bugs, and license fields in package.json
- [x] README.md with features, screenshots, and quick start
- [x] Gallery screenshots in `media/` directory (3 screenshots extracted from demo)
- [x] CHANGELOG.md with version 0.2.0 release notes
- [x] LICENSE file (MIT)
- [x] Categories and keywords for discoverability
- [x] Gallery banner configuration (dark theme)
- [x] Badge linking to live demo

## Package the extension

From workspace root:

```bash
npm run package:extension
```

Or from `extension/` directory:

```bash
npm run package
```

This creates `extension/bluepainter-0.2.0.vsix` and prints next steps.

### Verify package contents

```bash
cd extension
npm run package:check
```

Expected size: ~27-30 KB with 23-25 files.

## Pre-publish testing

### 1. Sideload test

Install locally without publishing:

```bash
code --install-extension extension/bluepainter-0.2.0.vsix
```

Or from VS Code:
1. Extensions view (Ctrl+Shift+X)
2. ··· menu → Install from VSIX
3. Select `extension/bluepainter-0.2.0.vsix`

### 2. Verify installation

1. Open a React/TSX project
2. Open command palette (Cmd/Ctrl+Shift+P)
3. Run `BluePainter: Pick Component`
4. Select a TSX file with visual elements
5. Verify canvas loads and receipts appear
6. Test a fix/dismiss cycle
7. Verify write-to-file works

## Create publisher account (one-time)

**KEVIN MUST DO THIS MANUALLY:**

1. Visit https://marketplace.visualstudio.com/manage
2. Sign in with GitHub or Microsoft account
3. Create a publisher with ID: **bluepainter**
   - Display name: BluePainter
   - Verified badge: Link GitHub repo
4. Generate Personal Access Token (PAT):
   - Azure DevOps: https://dev.azure.com → User Settings → Personal Access Tokens
   - Scope: **Marketplace (Publish)** — select "All accessible organizations"
   - Expiration: Set based on your preference (recommend 90 days for security)
   - Copy and save the token securely (you won't see it again)

## Publish to Marketplace

**KEVIN MUST DO THIS MANUALLY (requires PAT from above):**

From `extension/` directory:

```bash
npx vsce login bluepainter
# Paste your Personal Access Token when prompted

npx vsce publish --no-dependencies
```

Or upload VSIX manually:
1. Visit https://marketplace.visualstudio.com/manage/publishers/bluepainter
2. Click "New extension" → "Visual Studio Code"
3. Upload `bluepainter-0.2.0.vsix`
4. Fill in additional marketplace metadata if needed
5. Publish

### Alternative: Use the publish script

After `vsce login`:

```bash
npm run publish:marketplace
```

## Post-publish checklist

- [ ] Verify listing appears: https://marketplace.visualstudio.com/items?itemName=bluepainter.bluepainter
- [ ] Test install from Marketplace: `code --install-extension bluepainter.bluepainter`
- [ ] Add Marketplace badge to extension/README.md:
  ```markdown
  [![VS Code Marketplace](https://img.shields.io/vscode-marketplace/v/bluepainter.bluepainter.svg)](https://marketplace.visualstudio.com/items?itemName=bluepainter.bluepainter)
  ```
- [ ] Update main README.md with Marketplace link
- [ ] Announce via newsletter sequence (see site/NEWSLETTER.md)
- [ ] Add Marketplace URL to knowledge catalog
- [ ] Tweet/social media announcement
- [ ] Update bluepainter-launch.vercel.app homepage with "Install from Marketplace" CTA

## Listing metadata

Use these values in the publisher portal (if not already in package.json):

- **Name:** BluePainter
- **Display Name:** BluePainter
- **Short description:** Visual canvas ↔ code sync with AST preservation and Designer's Receipts for React/TSX
- **Categories:** Visualization, Other
- **Tags:** react, tsx, jsx, design, figma, canvas, visual-editor, ast, design-system, accessibility, wcag
- **Links:**
  - Demo: https://bluepainter-studio.vercel.app/#/app
  - Marketing site: https://bluepainter-launch.vercel.app
  - MCP docs: https://bluepainter-launch.vercel.app/knowledge/mcp
  - Free tools: https://bluepainter-launch.vercel.app/tools
  - GitHub: https://github.com/kevinhorek/bluepainter-studio

## Version updates (for future releases)

1. Update version in `extension/package.json`
2. Add release notes to `extension/CHANGELOG.md`
3. Update `extension/README.md` release notes section
4. Run `npm run package:extension`
5. Test the new VSIX locally
6. Publish: `cd extension && npx vsce publish --no-dependencies`

## Troubleshooting

### "Publisher bluepainter not found"

Create the publisher first at https://marketplace.visualstudio.com/manage

### "Personal Access Token expired"

Generate a new PAT and run `npx vsce login bluepainter` again.

### "Missing icon"

Ensure `extension/media/icon.png` exists (128×128px PNG minimum).

### "Package too large"

Current size is ~27 KB. If dependencies bloat the package, verify `--no-dependencies` flag is used.

### "vsce: command not found"

Install it:

```bash
cd extension
npm install --save-dev @vscode/vsce
```

---

**Questions?** See [PACKAGING.md](./PACKAGING.md) or [report an issue](https://github.com/kevinhorek/bluepainter-studio/issues).

