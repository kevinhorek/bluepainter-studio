# AGENTS.md

## Cursor Cloud specific instructions

### Repo layout (multi-component)
BluePainter is a validation prototype with several independent surfaces. Each has its own `package.json`/deps:

- **Main product — BluePainter Studio** (root: `src/`, `index.html`, `vite.config.js`): Vite + React 19 SPA. The core canvas ↔ TSX editor with Designer's Receipts. This is the primary service to run. It is fully client-side. Code is tracked per workspace file (`DashboardPage.tsx`, `PricingCard.tsx`, …).
- `api/`: Vercel serverless functions (OpenAI copy generation, Figma import, GitHub push, Vercel deploy, waitlist, feedback). Optional — the app degrades gracefully to local fallbacks when these aren't running or keys are absent. Environment variables are documented in `.env.example` (all optional locally).
- `site/`: separate Astro 5 marketing/pSEO site (own deps under `site/`).
- `mcp/`: stdio MCP server (own deps under `mcp/`; `npm test` is an offline stdio smoke test).
- `extension/`: VS Code extension (own deps under `extension/`); runs via F5 in VS Code, no web server. `extension/lib/astSyncEngine.js` and `receiptPolicy.js` are generated from `src/utils/` — edit the sources and run `npm run sync:extension`.
- `scripts/`: Node test and tooling scripts (run through `scripts/esm-resolve.mjs` so Vite-style extensionless imports resolve).

### Running the main app (required service)
- Dev server: `npm run dev` → serves the Studio at `http://localhost:5173` (Vite default). Lands on `DashboardPage.tsx`.
- Lint: `npm run lint` — clean (0 errors); keep it that way.
- Tests: `npm test` runs `test:features` (sync engine, receipts, export map), `test:api` (`api/` handlers, mocked upstreams), `test:export` (exported projects parse as TSX; scaffold shape) and `check:extension` (generated `extension/lib` files are current). All offline, a few seconds.
- `npm run verify:export` writes the real app export and the marketing kit `landing-site` to a temp dir and runs `npm install`, `npm run typecheck`, `npm run build` in them. Needs network; about a minute. Run it after touching `src/utils/projectExport.js`, `marketingKit.js` or the code generator.
- Build: `npm run build` (output in `dist/`). The build warns about a >500 kB chunk and externalizes Node `os` (imported by `recast`) for the browser — both are expected, not failures.
- `npm run dev:full` runs `vercel dev` (Vite + `api/` together) — only needed to exercise real OpenAI/Figma/GitHub/Vercel integrations; requires the Vercel CLI and is not needed for normal Studio development.

### Optional services (only if working on them)
- Astro site: `npm run site:dev` (needs `npm install` inside `site/` first) → `http://localhost:4321`.
- MCP server: `npm run mcp:start` (needs `npm install` inside `mcp/` first) → stdio, no port.
- Extension: `cd extension && npm install`, then F5 in VS Code (launch config "BluePainter Extension"). `npm test` runs the write-back round trip in plain Node; `npm run package` builds the VSIX (git-ignored; never commit it).
- MCP tests: `cd mcp && npm install && npm test`.

### CI
`.github/workflows/ci.yml` runs on push and pull_request with Node 22: Studio (`npm ci`, lint, `npm test`, build), `site` (build), `extension` (`npm test`), `mcp` (`npm test`). `verify:export` is not in CI.

### Export
The Studio exports a Vite + React + TypeScript project (`src/*.tsx`, `main.tsx`, `vite-env.d.ts`, strict `tsconfig.json`, `npm run typecheck`). `buildProjectFileMap` (`src/utils/projectExport.js`; used by the zip download, GitHub push and Vercel deploy) and `buildLandingSiteFileMap` (`src/utils/marketingKit.js`; the marketing kit's `landing-site/` folder) are pure functions that the export tests call directly. Vercel is the only deploy target (Netlify support was removed).

### Non-obvious caveats
- Node engine: root deps (`@babel/*@8`) declare a preferred engine of Node `^22.18.0 || >=24.11.0`; the VM has Node 22.14 which emits `EBADENGINE` warnings during install but installs and runs fine.
- Browser demo canvas ↔ code sync is AST-first with a regex fallback; text, style, `src` and structure edits round-trip (covered by `npm run test:features`). Editing multi-line JSX text re-indents that text and its closing tag — a known limitation (see README "Prototype limitations"), not a setup problem.
- The workspace, learning loop and feedback are persisted to `localStorage` (feedback is also posted to `/api/feedback` when the API is running). Deploy/Figma/OpenAI tokens are kept in `sessionStorage` unless the user ticks "Remember on this device".
- `extension/node_modules` files evicted by cloud sync (macOS "dataless" files) make `vsce package` hang; `rm -rf node_modules && npm ci` fixes it.
- Add `?facilitator=1` to the URL for facilitator/validation tooling (break/fix scenarios, session export).
