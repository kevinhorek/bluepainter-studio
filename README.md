# BluePainter Studio

Interactive validation demo for a **visual canvas ↔ code workspace** with **Designer's Receipts** and a **learning loop** moat.

- **Live demo:** https://bluepainter-studio.vercel.app  
- **Product spec:** [SPEC.md](./SPEC.md)

## What this is

BluePainter is **not** an LLM wrapper. It's a workflow bet: **AST-preserving bidirectional sync** and **team-configurable design policy** inside existing repos — the part incumbents (Figma, Cursor, v0) don't own.

This repo is the **validation prototype**. Four platform shells (VS Code, Tauri, Figma, Responsive) demonstrate vision; **v1 ships Phase 1 only** (see spec).

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Validation workflow

1. Share the live demo URL  
2. Use **📋 Script** or **▶ Present** for facilitated sessions  
3. Collect feedback via **Share Feedback**  
4. **⬇ Export** JSON (feedback + learning loop + team policy)  
5. Apply decision gate in [SPEC.md §8](./SPEC.md#8-success-metrics--kill-criteria)

## Deploy

```bash
npm run build
npm run deploy:vercel   # or deploy:netlify
```

## Project structure

```
src/
  components/     UI shells, receipts, marketing, demo tools
  data/           Mock components, receipt policy defaults, product spec (in-app)
  utils/          Sync engine (prototype), learning loop, feedback export
SPEC.md           Full product specification
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run deploy:vercel` | Build + deploy to Vercel |

## Prototype limitations

- Sync uses regex, not Recast/Babel (v1 requirement in spec)  
- Learning loop persists to localStorage only  
- Phases 2–4 are vision mocks, not v1 scope  

See [SPEC.md](./SPEC.md) for v1 scope, moat definition, bear case, and kill criteria.
