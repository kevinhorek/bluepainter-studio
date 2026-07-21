---
title: "How to sync a testimonial between canvas and TSX"
description: "Practical id-contract checklist for keeping a testimonial editable in BluePainter."
pattern: "how-to-sync"
pubDate: 2026-07-21
---

# How to sync a testimonial between canvas and TSX

Practical id-contract checklist for keeping a testimonial editable in BluePainter.

## Goal

Keep a **testimonial** editable on canvas and in TSX without losing formatting.

## Id contract

```tsx
<button id="cta-button" style={{ background: '#2563eb' }}>Start free trial</button>
```

The `id` is the join key. Synced fields today: inline `style`, text, and `img` `src`.

## Steps

1. Open the component in BluePainter (or the VS Code extension)
2. Confirm every layer you care about has a stable id
3. Edit canvas or code — receipts flag policy issues
4. Export / write-back when ready

See [AST scope](https://github.com/kevinhorek/bluepainter-studio/blob/main/AST_SCOPE.md).

