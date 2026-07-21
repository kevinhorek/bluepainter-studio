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

Open http://localhost:5173 — lands on `DashboardPage.tsx`.

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

## Key features (demo)

| Feature | Where |
|---------|--------|
| Page layout | `DashboardPage.tsx` |
| Component files | `PricingCard.tsx`, `HeroSection.tsx` |
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
- MCP: `mcp/` — see [mcp/README.md](./mcp/README.md)
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

Then **F5** in VS Code (Extension Development Host) or install from `extension/` folder. See [extension/README.md](./extension/README.md).

Try `extension/test-fixtures/PricingCard.tsx` — edit on canvas, changes write back to the file.

## Prototype limitations

- Browser demo sync uses AST-first with regex fallback; Recast parse can fail on some JSX in Node (extension uses Babel generator fallback)
- Learning loop uses localStorage only

See [SPEC.md](./SPEC.md) for v1 scope and kill criteria.
