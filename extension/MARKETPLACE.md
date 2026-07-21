# VS Code Marketplace publish checklist

## Packaged locally

- [x] `private: false` in package.json
- [x] Icon `media/icon.png`
- [x] Repository / homepage / license fields
- [x] VSIX built: `extension/bluepainter-0.2.0.vsix`

## Your account (required to publish)

1. Create publisher **bluepainter** at https://marketplace.visualstudio.com/manage
2. Create a Personal Access Token (Marketplace scope)
3. From `extension/`:

```bash
npx vsce login bluepainter
npx vsce publish --no-dependencies
```

Or upload `bluepainter-0.2.0.vsix` in the publisher portal.

## Sideload without Marketplace (works now)

```bash
code --install-extension extension/bluepainter-0.2.0.vsix
```

## Listing copy

- **Name:** BluePainter
- **Short:** Repo-native canvas ↔ TSX sync with Designer's Receipts
- **Links:**
  - Demo https://bluepainter-studio.vercel.app/#/app
  - Site https://bluepainter-launch.vercel.app
  - MCP https://bluepainter-launch.vercel.app/knowledge/mcp
  - Free tools https://bluepainter-launch.vercel.app/tools

## Post-publish

- [ ] Add Marketplace badge to extension README
- [ ] Announce via newsletter sequence ([site/NEWSLETTER.md](../site/NEWSLETTER.md))
- [ ] Add Marketplace URL to knowledge catalog
