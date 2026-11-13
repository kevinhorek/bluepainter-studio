# BluePainter

Interactive validation demo for a **visual canvas ↔ code workspace** with **Designer's Receipts** and page-level component composition.

- **Live demo:** https://bluepainter-studio.vercel.app  
- **Product spec:** [SPEC.md](./SPEC.md)  
- **Interview guide:** [VALIDATION.md](./VALIDATION.md)  
- **Figma import:** [FIGMA_IMPORT.md](./FIGMA_IMPORT.md)

## What this is

BluePainter is **not** an LLM wrapper. It's a workflow bet: **AST-preserving bidirectional sync** and **team-configurable design policy** inside existing repos.

**Use it on YOUR projects:**
- Studio: Load .tsx/.jsx files, edit visually, download with AST preservation
- Extension: Edit components in VS Code with receipts before merge
- CI Gate: Block merge on error-severity receipts

This repo includes the validation prototype and production-ready extension.

**Guides:**
- [SELF_PILOT.md](./SELF_PILOT.md) — 30-minute self-guided validation on your own repo
- [PILOT.md](./PILOT.md) — Pilot team quick-start checklist
- [FACILITATOR.md](./FACILITATOR.md) — Session guide for running validation with users
- [PRICING.md](./PRICING.md) — Recommended pricing model (open-core: free core + paid team features). See [/pricing](/pricing) for the live page.
- [extension/MARKETPLACE.md](./extension/MARKETPLACE.md) — VS Code Marketplace publish checklist

## Quick start

### Studio requires authentication

BluePainter Studio now requires a free account to save and manage your projects. Sign in with:
- Magic link (email OTP)
- Email/password

**Environment setup:** Copy `.env.example` to `.env` and add your Supabase credentials (see [docs/AUTH_PROJECTS.md](./docs/AUTH_PROJECTS.md) for details).

### Try the Studio (web demo)

```bash
npm install
npm run dev
```

Open http://localhost:5173 — lands on the marketing site. Click **Try the live demo** and sign in to access Studio.

### Use on Your Own Repo

**Studio:** Click **📂 Open File** button → load .tsx/.jsx → edit → **💾 Download**

**Extension:** Install in VS Code → `BluePainter: Pick Component` → edit → write to file

**Validation workflow:**
- [SELF_PILOT.md](./SELF_PILOT.md) — 30-minute self-guided validation
- [PILOT.md](./PILOT.md) — Full pilot team quick-start checklist
- [FACILITATOR.md](./FACILITATOR.md) — Run validation sessions with users

### Desktop app

```bash
npm install
npm run desktop
```

Opens BluePainter in a native desktop window (Electron). See [desktop/README.md](./desktop/README.md).

Without `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` the Studio skips sign-in and keeps the workspace in the browser. Environment variables are documented in [`.env.example`](./.env.example).

## Tests

```bash
npm run lint
npm test               # every offline suite below (well under a minute)
npm run verify:export  # writes the real export to a temp dir, then npm install + typecheck + build (needs network)
npm run build
```

| Script | Covers |
|--------|--------|
| `test:features` | Canvas ↔ TSX sync engine, receipts, AI apply, Figma import, export file map |
| `test:ast` | 18 sync-engine suites over realistic component patterns |
| `test:integration` | Real-file workflow: detect, parse, patch, round-trip |
| `test:api` | `api/` handlers (including OAuth) with mocked upstreams |
| `test:export` | Every file of the app export and the marketing kit `landing-site` parses as TSX; `package.json` / `tsconfig.json` shape |
| `test:figma-plugin` | The Figma plugin's JSON goes through the Studio's import path |
| `test:desktop` | Desktop file-access rules (path allow-list, extensions) |

The sync engine and receipt policy live in `packages/shared` and are used by both the Studio and the extension.

`mcp/` and `extension/` have their own `npm test`. CI (`.github/workflows/ci.yml`) runs lint, tests and build for the Studio, the Astro site build, and the extension and MCP tests on every push and pull request.

## Validation workflow

1. Share **https://bluepainter-studio.vercel.app**
2. Use **··· → Interview guide** (or [VALIDATION.md](./VALIDATION.md))
3. Collect feedback via **Share feedback**
4. Facilitator (`?facilitator=1`): **Export** JSON after each session
5. Apply go/no-go after **8 sessions** (see VALIDATION.md)

**For self-guided pilots:** See [SELF_PILOT.md](./SELF_PILOT.md) for a 30-45 minute walkthrough on your own project.  
**For facilitators:** See [scripts/pilot-dry-run.md](./scripts/pilot-dry-run.md) for a printable session checklist.

## Deploy

```bash
npm run deploy:vercel
```

Vercel is the only supported host (the `api/` functions are Vercel serverless functions); set the variables from `.env.example` in the project settings.

### OAuth sign-in (optional)

The export/deploy dialog can offer **Sign in with GitHub** and **Sign in with Vercel** instead of pasted tokens. Each button appears only when its variables are set on the Studio deployment; without them the dialog shows the token fields only, and pasted tokens keep working either way.

- **GitHub:** create an OAuth App (GitHub → Settings → Developer settings → OAuth Apps) with the authorization callback URL `https://<studio-host>/api/oauth/github/callback`, then set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. The app requests the `repo` scope.
- **Vercel:** create an integration in the Vercel Integrations Console with the Redirect URL `https://<studio-host>/api/oauth/vercel/callback` and read/write access to deployments (and projects), then set `VERCEL_CLIENT_ID`, `VERCEL_CLIENT_SECRET` and `VERCEL_INTEGRATION_SLUG`.

`<studio-host>` is the production host, e.g. `bluepainter-studio.vercel.app`. For `npx vercel dev`, register `http://localhost:3000/api/oauth/<provider>/callback` on a separate dev app. The token is handed to the Studio tab that opened the sign-in window and stored like a pasted one (this tab only unless "Remember on this device" is ticked); the server keeps nothing.

### Optional: Team Audit Log Backend

The learning loop (receipt fixes, dismissals, policy changes) can persist to a team database for analytics and compliance. **This is optional** — the app works without it.

**Environment Variables:**
- `DATABASE_URL` — PostgreSQL connection string (enables production audit persistence)
- `VITE_AUDIT_API_URL` — Custom audit backend URL (optional, defaults to `/api/audit-log`)

**Without `DATABASE_URL` (demo/validation mode):**
- Events buffer to localStorage only
- No team-wide audit data
- API runs in "soft-fail" mode

**With `DATABASE_URL` (production mode):**
- Events persist to Postgres for team audit trail
- 90-day retention policy
- Query via `/api/audit-log/query`

**Quick setup for production:**
```bash
# 1. Create Postgres database (Supabase or Vercel Postgres recommended)

# 2. Set environment variable in Vercel dashboard
#    Project Settings → Environment Variables → Add Variable
#    Name: DATABASE_URL
#    Value: postgresql://[user]:[password]@[host]:[port]/[database]

# 3. Run schema migration
psql $DATABASE_URL -f docs/migrations/001_audit_events.sql

# 4. Redeploy
vercel --prod
```

**Full documentation:** [docs/AUDIT_BACKEND.md](./docs/AUDIT_BACKEND.md) — Complete setup guide with Supabase/Vercel Postgres instructions, monitoring, and troubleshooting.

## CI Receipt Gate

The repo includes a **Designer's Receipts gate** for CI pipelines that blocks merge on error-severity findings (e.g., WCAG contrast failures).

**Quick start:**
```bash
node scripts/check-receipts.mjs extension/test-fixtures/*.tsx
```

**Wire into your CI:** See [CI.md](./CI.md) for GitHub Actions, GitLab, CircleCI, and pre-commit hook examples.

**Configure team policy:** Create `.bluepainter.json` in your repo root (see [CI.md](./CI.md#configuration)).

## Extension (VS Code)

The VS Code extension brings BluePainter's canvas editor and Designer's Receipts directly into your editor.

### Development
```bash
cd extension && npm install
# Test in VS Code: press F5 to launch Extension Development Host
```

### Package for distribution
```bash
cd extension && npm run package
# Creates: extension/bluepainter-0.2.0.vsix
```

### Install locally
```bash
code --install-extension extension/bluepainter-0.2.0.vsix
```

**Marketplace checklist:** See [extension/MARKETPLACE.md](./extension/MARKETPLACE.md)

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

## Figma import

Pull frames from Figma → canvas → export as React. One-way only (no sync back to Figma).

- **URL import:** Requires Figma personal access token + `/api/figma-import` (works on live demo, or `npx vercel dev` locally)
- **JSON paste:** Offline fallback — paste Figma REST API JSON
- **Optional:** Set `FIGMA_TOKEN` environment variable on API host to skip token entry in UI (recommended for team deployments)

See [FIGMA_IMPORT.md](./FIGMA_IMPORT.md) for supported node types, limitations, and usage.

## Prototype limitations

- Browser demo sync uses AST-first with regex fallback; Recast parse can fail on some JSX in Node (extension uses Babel generator fallback)
- Elements the canvas inserts into existing code are pretty-printed; text and style edits change only the characters involved
- The workspace, learning loop and feedback are kept in `localStorage` (feedback is also posted to `/api/feedback` when the API is running)
- Deploy / Figma / OpenAI tokens stay in the browser: this tab only by default, or `localStorage` when **Remember on this device** is ticked
- In an exported app, a component placed more than once uses `data-bp-id` instead of `id` on its elements (no duplicate DOM ids)
- The Phase 2–4 layouts under `?facilitator=1` are demo layouts of the same editor; the real desktop app is `npm run desktop`, the real Figma plugin is `figma-plugin/`, and responsive preview is the viewport switcher on page files
- Learning loop uses localStorage by default; optional team backend available (see [docs/AUDIT_BACKEND.md](./docs/AUDIT_BACKEND.md))
- Figma import is one-way (no bidirectional sync)

See [SPEC.md](./SPEC.md) for v1 scope and kill criteria.
