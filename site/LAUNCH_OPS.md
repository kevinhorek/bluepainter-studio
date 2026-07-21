# Launch ops — what still needs your login

Code + deploy for the launch program are done. These need *your* accounts:

| Step | Action | Link / note |
|------|--------|-------------|
| Custom domain | Point `bluepainter.dev` → Vercel project `bluepainter-launch` | Vercel → Domains |
| ESP webhook | Set `WAITLIST_WEBHOOK` on `bluepainter-studio` | Zapier/Make → Buttondown/Beehiiv/Resend |
| Search Console | Verify + submit sitemap | See [GSC.md](./GSC.md) |
| Smithery MCP | Connect GitHub repo, subdirectory `mcp/` | https://smithery.ai + [mcp/smithery.yaml](../mcp/smithery.yaml) |
| VS Marketplace | Create publisher `bluepainter`, then `vsce publish` | PAT from https://marketplace.visualstudio.com/manage |
| Install VSIX now | Sideload without Marketplace | `extension/*.vsix` after package |
| Newsletter buy | Optional budget | Duuce / creator outreach |
| Pilots | Schedule humans | `?facilitator=1` on demo |

## Live URLs

- Distribution site: https://bluepainter-launch.vercel.app
- Product demo: https://bluepainter-studio.vercel.app
- Waitlist API: https://bluepainter-studio.vercel.app/api/waitlist
