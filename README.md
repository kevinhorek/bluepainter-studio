# BluePainter Studio

Interactive validation demo for a **visual canvas ↔ code workspace** with **Designer's Receipts** and page-level component composition.

- **Live demo:** https://bluepainter-studio.vercel.app  
- **Product spec:** [SPEC.md](./SPEC.md)  
- **Interview guide:** [VALIDATION.md](./VALIDATION.md)

## What this is

BluePainter is **not** an LLM wrapper. It's a workflow bet: **AST-preserving bidirectional sync** and **team-configurable design policy** inside existing repos.

This repo is the **validation prototype**. Opens straight into the studio — canvas, code, receipts, and page composition.

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

## Prototype limitations

- Sync uses regex, not Recast/Babel (v1 requirement)
- Learning loop uses localStorage only

See [SPEC.md](./SPEC.md) for v1 scope and kill criteria.
