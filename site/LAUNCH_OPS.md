# Launch ops — what still needs your login

Code + deploy for the launch program are done. These need *your* accounts:

| Step | Action | Link / note |
|------|--------|-------------|
| Custom domain | Point `bluepainter.dev` → Vercel project `bluepainter-launch`, then **set `SITE_URL=https://bluepainter.dev`** on that project and redeploy. Until then every canonical, og:url, robots.txt and sitemap entry uses the `*.vercel.app` origin (see `site/site.config.mjs`). Also set `VITE_SITE_URL` to the same value on `bluepainter-studio` so share links follow. | Vercel → Domains + Environment Variables |
| ESP webhook | Set `WAITLIST_WEBHOOK` on `bluepainter-launch` (site forms post to the site's own `/api/waitlist`) and on `bluepainter-studio` (in-app waitlist) | Zapier/Make → Buttondown/Beehiiv/Resend |
| Search Console | Verify + submit sitemap | See [GSC.md](./GSC.md) |
| Smithery MCP | Connect GitHub repo, subdirectory `mcp/` | https://smithery.ai + [mcp/smithery.yaml](../mcp/smithery.yaml) |
| VS Marketplace | Create publisher `bluepainter`, then `vsce publish` | PAT from https://marketplace.visualstudio.com/manage |
| Install VSIX now | Sideload without Marketplace | `extension/*.vsix` after package |
| Newsletter buy | Optional budget | Duuce / creator outreach |
| Pilots | Schedule humans | `?facilitator=1` on demo |

## Live URLs

- Distribution site: https://bluepainter-launch.vercel.app
- Product demo: https://bluepainter-studio.vercel.app
- Waitlist API (site forms): https://bluepainter-launch.vercel.app/api/waitlist — same-origin `/api/waitlist`, override with `WAITLIST_URL`
- Waitlist API (Studio): https://bluepainter-studio.vercel.app/api/waitlist

## Environment variables (site project)

| Variable | Default | Purpose |
|----------|---------|---------|
| `SITE_URL` | `https://bluepainter-launch.vercel.app` | Canonicals, og:url, robots.txt, sitemap. **Set when the domain goes live.** |
| `DEMO_URL` | `https://bluepainter-studio.vercel.app` | Links into the Studio demo |
| `WAITLIST_URL` | `/api/waitlist` | Newsletter, pilot and tool email forms |
| `WAITLIST_WEBHOOK` | — | Durable store for signups (without it they are in-memory only) |

Social images: `npm run og` in `site/` re-renders `public/og-*.png` from the SVG sources.
