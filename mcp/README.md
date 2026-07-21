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
| `bluepainter_figma_import` | Call Figma import API |

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
        "BLUEPAINTER_WAITLIST_URL": "https://bluepainter-studio.vercel.app/api/waitlist"
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
- `bluepainter_figma_import` requires Figma token configured on the API host
