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

```bash
cd mcp
npm install
npm start
```

Inspector:

```bash
npm run inspect
```

### Cursor / Claude config example

```json
{
  "mcpServers": {
    "bluepainter": {
      "command": "node",
      "args": ["/absolute/path/to/bluepainter-studio/mcp/src/index.js"],
      "env": {
        "BLUEPAINTER_SITE_URL": "https://bluepainter.dev",
        "BLUEPAINTER_WAITLIST_URL": "https://bluepainter-studio.vercel.app/api/waitlist",
        "FIGMA_TOKEN": "figd_…"
      }
    }
  }
}
```

## Registry submission (Smithery / Open Tools)

Config ready: [`smithery.yaml`](./smithery.yaml) · Cursor example: [`mcp.json`](./mcp.json)

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
