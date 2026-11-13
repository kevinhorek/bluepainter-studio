---
title: "How to sync a footer between canvas and TSX"
description: "A practical id-contract checklist for keeping a footer editable on the BluePainter canvas and in code."
pattern: "how-to-sync"
generated: true
pubDate: 2026-07-21
---

# How to sync a footer between canvas and TSX

A practical id-contract checklist for keeping a footer editable on the BluePainter canvas and in code.

## Goal

Keep a **footer** editable on the canvas and in TSX without losing comments or formatting.

## Id contract

```tsx
<section id="footer-frame" style={{ padding: 32 }}>
  <button id="footer-cta" style={{ background: '#2563eb' }}>Start free trial</button>
</section>
```

The `id` is the join key between a canvas layer and its JSX element. Synced fields today: inline `style`, text, and `img` `src`.

## Steps

1. Open the footer in BluePainter (or the VS Code extension)
2. Give every layer you want to edit visually a stable, unique `id` — the [TSX id analyzer](/tools/tsx-id-analyzer) lists what the canvas can map
3. Edit on the canvas or in code; receipts flag policy issues as you go
4. Export or write back when the diff looks right

See the [AST scope](https://github.com/kevinhorek/bluepainter-studio/blob/main/AST_SCOPE.md) for what is and is not synced.
