# BluePainter MCP Server

MCP server so AI assistants (Claude, Cursor, ChatGPT tools) can discover BluePainter and invoke product actions with near-zero CAC.

## Tools

| Tool | Description |
|------|-------------|
| `bluepainter_open_demo` | Demo + site deep links |
| `bluepainter_analyze_tsx` | Count syncable JSX `id`s |
| `bluepainter_receipts_evaluate` | Contrast / CTA / spacing checks |
| `bluepainter_get_knowledge` | Knowledge catalog / FAQ |
| `bluepainter_request_pilot` | Submit pilot waitlist |
| `bluepainter_figma_import` | Figma import API (needs a Figma token; returns summary + truncated JSON) |

## Install / run

Requires Node 18+.

```bash
cd mcp
npm install
npm start        # stdio server
npm test         # offline smoke test: initialize, tools/list, every tool
npm run inspect  # MCP Inspector
```

### Client config (Cursor / Claude Desktop / Claude Code)

From a checkout of this repo (works today):

```json
{
  "mcpServers": {
    "bluepainter": {
      "command": "node",
      "args": ["/absolute/path/to/bluepainter-studio/mcp/src/index.js"],
      "env": {
        "BLUEPAINTER_SITE_URL": "https://bluepainter-launch.vercel.app",
        "BLUEPAINTER_WAITLIST_URL": "https://bluepainter-studio.vercel.app/api/waitlist",
        "FIGMA_TOKEN": "figd_…"
      }
    }
  }
}
```

With `npx` (once `bluepainter-mcp` is published to npm — it is not yet; see below):

```json
{
  "mcpServers": {
    "bluepainter": {
      "command": "npx",
      "args": ["-y", "bluepainter-mcp"],
      "env": { "FIGMA_TOKEN": "figd_…" }
    }
  }
}
```

Until then the same launcher works against a local tarball: run `npm pack` in `mcp/` and use
`"args": ["-y", "--package=/absolute/path/to/bluepainter-mcp-<version>.tgz", "bluepainter-mcp"]`.

### Environment

All optional — the defaults point at the live demo and site.

| Variable | Default | Purpose |
|----------|---------|---------|
| `BLUEPAINTER_SITE_URL` | `https://bluepainter-launch.vercel.app` | Marketing site links returned by `bluepainter_open_demo` |
| `BLUEPAINTER_WAITLIST_URL` | `https://bluepainter-studio.vercel.app/api/waitlist` | Endpoint for `bluepainter_request_pilot` |
| `BLUEPAINTER_API_BASE` | `https://bluepainter-studio.vercel.app` | Origin for `bluepainter_figma_import` |
| `BLUEPAINTER_TIMEOUT_MS` | `15000` | Network tool timeout |
| `FIGMA_TOKEN` | — | Figma personal access token for `bluepainter_figma_import` |

## Publishing (maintainers)

The package is publishable (`bin`, `files`, `engines`, MIT `LICENSE`) but has **not** been published.
The server version reported to clients is read from `package.json`.

```bash
cd mcp
npm test
npm pack --dry-run   # check the tarball: src/, README.md, LICENSE, package.json
npm publish          # needs an npm login that owns the name
```

## Registry submission (Smithery / Open Tools)

Config ready: [`smithery.yaml`](./smithery.yaml) · repo-local client example: [`mcp.json`](./mcp.json)

1. https://smithery.ai → New Server → connect `kevinhorek/bluepainter-studio`
2. Subdirectory: `mcp/`
3. Command: `node src/index.js`
4. Env defaults: site `https://bluepainter-launch.vercel.app`, waitlist demo API
5. Docs: https://bluepainter-launch.vercel.app/knowledge/mcp

## Auth notes

- Read tools (demo, analyze, receipts, knowledge) are public
- `bluepainter_request_pilot` posts to waitlist API
- `bluepainter_request_pilot` validates the email locally before posting
- `bluepainter_figma_import` needs a Figma personal access token: pass `token` in the tool call or set `FIGMA_TOKEN` in the MCP server env. The token is sent in the request body to `<apiBase>/api/figma-import`, which forwards it to the Figma API. `FIGMA_TOKEN` from env is only sent to the default API host (`BLUEPAINTER_API_BASE`, default the live demo origin) or localhost; with a custom `apiBase` pass `token` explicitly. Optional `nodeUrl` imports a single node. Output is a summary (file name, node count) plus the Figma JSON truncated to ~20k chars.
- Network tools time out after 15s (`BLUEPAINTER_TIMEOUT_MS` to override) and return `isError` on non-2xx or non-JSON responses

## Notes

- `bluepainter_analyze_tsx` is a regex heuristic (no parser): it counts static `id="…"` / `id={'…'}` attributes, ignoring comments and `data-id`.
- `bluepainter_receipts_evaluate` accepts `#rgb`, `#rrggbb` and `rgb()` backgrounds (contrast is measured against white text); an unparseable colour returns `valid: null` with a note and is left out of the score.
