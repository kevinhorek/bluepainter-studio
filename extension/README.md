# BluePainter VS Code Extension

Repo-native canvas ↔ TSX sync with **Designer's Receipts** — edit visually in VS Code, write back via AST-preserving patches.

## Features

- **Sidebar panel** — canvas preview, node inspector, and policy receipts for the active TSX/JSX file
- **Canvas editor tab** — larger editor-area webview for visual editing
- **AST write-back** — patches `style`, text, and `src` in place (Recast + Babel, same engine as the web app)
- **Bootstrap** — matches Pricing/Hero demo templates by filename, or builds a node map from JSX `id` attributes
- **Designer's Receipts** — spacing, contrast, CTA copy, and feature-count rules with one-click fixes
- **Session persistence** — node maps saved per file between VS Code sessions

## Install (local dev)

1. Install dependencies:

```bash
cd extension
npm install
```

2. Open this repo in VS Code
3. Press **F5** to launch an Extension Development Host — or install from folder:
   - **Extensions: Install Extension from Location…** → select `extension/`
4. Open a `.tsx` file (e.g. a component with `id="cta-button"` attributes)
5. Click the **BluePainter** activity bar icon, or run **BluePainter: Open Canvas Editor**

## Commands

| Command | Description |
|---------|-------------|
| `BluePainter: Open Sidebar Panel` | Focus the BluePainter sidebar |
| `BluePainter: Open Canvas Editor` | Open canvas webview in editor area |
| `BluePainter: Sync Canvas from File` | Re-parse TSX into canvas nodes |
| `BluePainter: Write Canvas to File` | AST-patch the active file from canvas state |

## Workflow

1. Open a TSX file with stable `id="node-id"` attributes (see `AST_SCOPE.md`)
2. BluePainter bootstraps nodes from template (Pricing/Hero filenames) or from JSX ids
3. Select nodes on the canvas → edit in **Inspector** tab
4. Changes auto-write to the file via AST patch
5. Edit code directly → canvas syncs on save / debounced document change
6. Use **Receipts** tab for team policy checks and fixes

## Settings

Configure under **BluePainter** in VS Code settings:

- `bluepainter.demoUrl` — web demo link
- `bluepainter.spacingGrid`, `radiusGrid`, `minContrastRatio`, `maxFeatureCount`
- `bluepainter.suggestedCta`, `bluepainter.contrastFixColor`

## Marketplace

See [MARKETPLACE.md](./MARKETPLACE.md) for the publish checklist (vsce package, listing copy, post-publish links to demo / MCP / free tools).

## Sync limits

See **`AST_SCOPE.md`** in the repo root. v0.2 supports inline styles, text, and image `src` on elements with matching ids. Structure add/remove and Tailwind classes are not synced yet.

## Development

```bash
cd extension
npm install
# From repo root, open Run and Debug → "Extension" if launch config exists
```

### Layout

```
extension/
  extension.js           # VS Code host: file I/O, webviews, commands
  lib/
    astSyncEngine.js     # Recast parse/patch (shared with web app)
    syncEngine.js        # parseTSX / generateTSX wrappers
    bootstrap.js         # Template + AST node bootstrap
    receiptPolicy.js     # Designer's Receipts
    sessionStore.js      # Per-file globalState persistence
  media/
    panel.css
    panel.js             # Webview UI (canvas, inspector, receipts)
  data/
    pricingNodes.json
    heroNodes.json
```

## Roadmap

- [ ] Bundle full React CanvasView for Figma-parity editing
- [ ] Component-instance / multi-file workspace
- [ ] Marketplace publish
