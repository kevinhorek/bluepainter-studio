# BluePainter

Interactive validation demo for a **visual canvas ↔ code workspace** with **Designer's Receipts** and page-level component composition.

- **Live demo:** https://bluepainter-studio.vercel.app  
- **Product spec:** [SPEC.md](./SPEC.md)  
- **Interview guide:** [VALIDATION.md](./VALIDATION.md)

## What this is

BluePainter is **not** an LLM wrapper. It's a workflow bet: **AST-preserving bidirectional sync** and **team-configurable design policy** inside existing repos.

This repo is the **validation prototype**. Opens straight into BluePainter — canvas, code, receipts, and page composition.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 — lands on `DashboardPage.tsx`. The Studio is fully client-side; the `api/` functions (AI copy, Figma import, GitHub push, Vercel deploy, waitlist, feedback) are optional and need `npm run dev:full` (`vercel dev`).

Environment variables are all optional for local work and are documented in [`.env.example`](./.env.example).

## Tests

```bash
npm run lint
npm test               # test:features + test:api + test:export + check:extension (offline, seconds)
npm run verify:export  # writes the real export to a temp dir, then npm install + typecheck + build (needs network)
npm run build
```

| Script | Covers |
|--------|--------|
| `test:features` | Canvas ↔ TSX sync engine, receipts, AI apply, Figma import, export file map |
| `test:api` | `api/` handlers with mocked upstreams |
| `test:export` | Every file of the app export and the marketing kit `landing-site` parses as TSX; `package.json` / `tsconfig.json` shape |
| `check:extension` | `extension/lib` copies generated from `src/` are up to date (`npm run sync:extension` regenerates) |

`mcp/` and `extension/` have their own `npm test`. CI (`.github/workflows/ci.yml`) runs lint, tests and build for the Studio, the Astro site build, and the extension and MCP tests on every push and pull request.

## Validation workflow

1. Share **https://bluepainter-studio.vercel.app**
2. Use **··· → Interview guide** (or [VALIDATION.md](./VALIDATION.md))
3. Collect feedback via **Share feedback**
4. Facilitator (`?facilitator=1`): **Export** JSON after each session
5. Apply go/no-go after **8 sessions** (see VALIDATION.md)

## Deploy

```bash
npm run deploy:vercel
```

Vercel is the only supported host (the `api/` functions are Vercel serverless functions); set the variables from `.env.example` in the project settings.

## Key features (demo)

| Feature | Where |
|---------|--------|
| Page layout | `DashboardPage.tsx` |
| Component files | `PricingCard.tsx`, `HeroSection.tsx` — code is tracked per file, so switching files never shows or patches another file's TSX |
| Export / deploy | **Export** → zip, GitHub push or Vercel deploy of a Vite + React + **TypeScript** project (`src/*.tsx`, strict `tsconfig.json`, `npm run typecheck`) |
| Drag components onto page | Sidebar → **Library** tab |
| Receipt issues | Pills at bottom → click for sidebar |
| Inspect / layers / code | Icon rail on canvas |

## Facilitator mode

Add `?facilitator=1` for break/fix scenarios, tour, spec, and session export.

## Distribution site (Astro)

Crawlable marketing + free tools + guides + knowledge catalog (hybrid launch layer):

```bash
npm run site:guides   # generate 100 pSEO guide pages
cd site && npm install && npm run dev
```

- Pricing / pilot: `/pricing`, `/pilot`
- Free tools: `/tools/*`
- AEO: `/faq`, `/knowledge`, `/llms.txt`, `/knowledge.json`
- MCP: `mcp/` — see [mcp/README.md](./mcp/README.md) (`cd mcp && npm install && npm test`; publishable as `bluepainter-mcp`, not yet published)
- Repurpose pillar content: `npm run repurpose -- scripts/fixtures/pillar-transcript.txt`
- Newsletter ESP: [site/NEWSLETTER.md](./site/NEWSLETTER.md)
- Marketplace checklist: [extension/MARKETPLACE.md](./extension/MARKETPLACE.md)

**Live distribution site:** https://bluepainter-launch.vercel.app  

Ops checklist (domain, GSC, ESP, Marketplace login): [site/LAUNCH_OPS.md](./site/LAUNCH_OPS.md)

## VS Code extension

Repo-native editing in VS Code — canvas preview, inspector, receipts, and AST write-back.

```bash
cd extension && npm install
```

Then **F5** in VS Code (launch config **BluePainter Extension**), or build and install the VSIX: `npm run package && code --install-extension bluepainter-0.3.0.vsix`. `npm test` runs the write-back round-trip test. See [extension/README.md](./extension/README.md) and [extension/CHANGELOG.md](./extension/CHANGELOG.md).

Try `extension/test-fixtures/PricingCard.tsx` — edit on canvas, changes write back to the file.

## Prototype limitations

- Browser demo sync uses AST-first with regex fallback; Recast parse can fail on some JSX in Node (extension uses Babel generator fallback)
- Editing multi-line JSX text re-indents that text and its closing tag
- The workspace, learning loop and feedback are kept in `localStorage` (feedback is also posted to `/api/feedback` when the API is running)
- Deploy / Figma / OpenAI tokens stay in the browser: this tab only by default, or `localStorage` when **Remember on this device** is ticked
- In an exported app, a component placed twice on a page repeats its element ids

See [SPEC.md](./SPEC.md) for v1 scope and kill criteria.
