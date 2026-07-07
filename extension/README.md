# BluePainter VS Code Extension (v1 scaffold)

MVP scaffold for repo-native sync. Reads the active TSX file, counts JSX elements with `id` attributes, and links to the validation demo.

## Install (local dev)

1. Open this repo in VS Code
2. Run **Extensions: Install Extension from Location…** and select the `extension/` folder  
   — or symlink into your extensions directory
3. Install extension dependencies:

```bash
cd extension
npm init -y
npm install @babel/parser @babel/traverse
```

4. Reload VS Code
5. Command palette → **BluePainter: Open Component Panel**

## Commands

| Command | Description |
|---------|-------------|
| `BluePainter: Open Component Panel` | Sidebar panel with file analysis |
| `BluePainter: Analyze TSX for Canvas IDs` | Count syncable `id` attributes |

## Roadmap

- [ ] Webview embed of canvas (bundled studio UI)
- [ ] Write-back via shared `astSyncEngine` patch
- [ ] Designer's Receipts in sidebar
- [ ] Marketplace publish

See **AST_SCOPE.md** for sync limits.
