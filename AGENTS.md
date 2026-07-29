# AGENTS.md

## Cursor Cloud specific instructions

### Repo layout (multi-component)
BluePainter is a validation prototype with several independent surfaces. Each has its own `package.json`/deps:

- **Main product — BluePainter Studio** (root: `src/`, `index.html`, `vite.config.js`): Vite + React 19 SPA. The core canvas ↔ TSX editor with Designer's Receipts. This is the primary service to run. It is fully client-side.
- `api/`: Vercel serverless functions (OpenAI copy generation, Figma import, GitHub push, Vercel deploy, waitlist). Optional — the app degrades gracefully to local fallbacks when these aren't running or keys are absent.
- `site/`: separate Astro 5 marketing/pSEO site (own deps under `site/`).
- `mcp/`: stdio MCP server (own deps under `mcp/`).
- `extension/`: VS Code extension (own deps under `extension/`); runs via F5 in VS Code, no web server.

### Running the main app (required service)
- Dev server: `npm run dev` → serves the Studio at `http://localhost:5173` (Vite default). Lands on `DashboardPage.tsx`.
- Lint: `npm run lint`. Note: the repo currently has pre-existing eslint errors (unused vars, a react-hooks set-state-in-effect rule); they are not caused by the environment and lint tooling itself works.
- Build: `npm run build` (output in `dist/`). The build warns about a >500 kB chunk and externalizes Node `os` (imported by `recast`) for the browser — both are expected, not failures.
- `npm run dev:full` runs `vercel dev` (Vite + `api/` together) — only needed to exercise real OpenAI/Figma/GitHub/Vercel integrations; requires the Vercel CLI and is not needed for normal Studio development.

### Optional services (only if working on them)
- Astro site: `npm run site:dev` (needs `npm install` inside `site/` first) → `http://localhost:4321`.
- MCP server: `npm run mcp:start` (needs `npm install` inside `mcp/` first) → stdio, no port.
- Extension: `cd extension && npm install`, then F5 in VS Code.

### Non-obvious caveats
- Node engine: root deps (`@babel/*@8`) declare a preferred engine of Node `^22.18.0 || >=24.11.0`; the VM has Node 22.14 which emits `EBADENGINE` warnings during install but installs and runs fine.
- Browser demo canvas ↔ code sync is AST-first with a regex fallback. Editing an element's **text content** reliably round-trips to the TSX code; some **style** edits (e.g. text color) may update the canvas but not always write back into the inline-style object in the code panel. This is a known prototype limitation (see README "Prototype limitations"), not a setup problem.
- The learning loop / feedback is persisted to `localStorage` only.
- Add `?facilitator=1` to the URL for facilitator/validation tooling (break/fix scenarios, session export).
