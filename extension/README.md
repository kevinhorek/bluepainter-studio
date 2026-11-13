# BluePainter VS Code Extension

Repo-native canvas ↔ TSX sync with **Designer's Receipts** — edit visually in VS Code, write back via AST-preserving patches.

## Features

- **Sidebar panel** — canvas preview, node inspector, and policy receipts for the active TSX/JSX file
- **Canvas editor tab** — larger editor-area webview for visual editing
- **AST write-back** — patches `style`, text, and `src` in place (Recast + Babel, same engine as the web app); a write-back with no canvas change leaves the file byte-identical
- **Bootstrap** — builds a node map from the file's JSX `id` attributes (the Pricing/Hero demo templates are used only when the file contains exactly those ids)
- **Designer's Receipts** — spacing, contrast, CTA copy, and feature-count rules with one-click fixes
- **Session persistence** — node maps saved per file between VS Code sessions

## Install (local dev)

1. Install dependencies:

```bash
cd extension
npm install
```

2. Open this repo in VS Code
3. Press **F5** (launch config **BluePainter Extension**) to open an Extension Development Host
4. Open a `.tsx` file (e.g. a component with `id="cta-button"` attributes)
5. Click the **BluePainter** activity bar icon, or run **BluePainter: Open Canvas Editor**

## Install (packaged VSIX)

```bash
cd extension
npm install
npm run package                                   # → bluepainter-<version>.vsix (git-ignored build artefact)
code --install-extension bluepainter-0.3.0.vsix
```

The VSIX bundles its runtime dependencies (`@babel/*`, `recast`), so it works outside this repo.

## Commands

| Command | Description |
|---------|-------------|
| `BluePainter: Open Sidebar Panel` | Focus the BluePainter sidebar |
| `BluePainter: Open Canvas Editor` | Open canvas webview in editor area |
| `BluePainter: Sync Canvas from File` | Re-parse TSX into canvas nodes |
| `BluePainter: Write Canvas to File` | AST-patch the active file from canvas state |

## Workflow

1. Open a TSX file with stable `id="node-id"` attributes (see `AST_SCOPE.md`)
2. BluePainter bootstraps nodes from the JSX ids in the file
3. Select nodes on the canvas → edit in **Inspector** tab
4. Changes auto-write to the file via AST patch
5. Edit code directly → canvas syncs on save / debounced document change (a syntax error keeps the last good canvas)
6. Use **Receipts** tab for team policy checks and fixes

## Settings

Configure under **BluePainter** in VS Code settings:

- `bluepainter.demoUrl` — web demo link
- `bluepainter.spacingGrid`, `radiusGrid`, `minContrastRatio`, `maxFeatureCount`
- `bluepainter.weakCtaWords`, `bluepainter.suggestedCta`, `bluepainter.contrastFixColor`

## Marketplace

See [MARKETPLACE.md](./MARKETPLACE.md) for the publish checklist (vsce package, listing copy, post-publish links to demo / MCP / free tools).

## Sync limits

See **`AST_SCOPE.md`** in the repo root. v0.3 supports inline styles, text, and image `src` on elements with matching ids; dynamic style props, spreads and nested/dynamic text are left untouched. Structure add/remove and Tailwind classes are not synced yet, and editing multi-line JSX text re-indents that text and its closing tag.

## Development

```bash
cd extension
npm install
npm test          # round-trip test on test-fixtures/PricingCard.tsx (plain Node, no VS Code)
npm run package   # build the VSIX
```

From the repo root, **Run and Debug → BluePainter Extension** (`.vscode/launch.json`) starts an Extension Development Host. Release notes: [CHANGELOG.md](./CHANGELOG.md).

### Layout

```
extension/
  extension.js           # VS Code host: file I/O, webviews, commands
  lib/
    astSyncEngine.js     # Recast parse/patch (CommonJS port of src/utils/astSyncEngine.js)
    babelPatch.js        # @babel/generator fallback when Recast can't print
    syncEngine.js        # parseTSX / generateTSX wrappers
    bootstrap.js         # Template + AST node bootstrap
    receiptPolicy.js     # Designer's Receipts (port of src/utils/receiptPolicy.js)
    defaultReceiptPolicy.js  # Policy from VS Code settings
    sessionStore.js      # Per-file persistence between sessions
  media/
    icon.png
    panel.css
    panel.js             # Webview UI (canvas, inspector, receipts)
  data/
    pricingNodes.json
    heroNodes.json
  test/
    roundtrip.test.js    # npm test
  test-fixtures/
    PricingCard.tsx
```

## Roadmap

- [ ] Bundle full React CanvasView for Figma-parity editing
- [ ] Component-instance / multi-file workspace
- [ ] Marketplace publish
