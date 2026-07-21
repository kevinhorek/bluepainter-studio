---
title: "Designer's Receipts for contrast"
description: "How BluePainter enforces WCAG contrast policy on canvas buttons and writes fixes back to TSX."
pattern: "receipts-rule"
pubDate: 2026-07-21
---

# Designer's Receipts for contrast

**Contrast** is part of Designer's Receipts — live governance on the canvas node map with fixes that write back to code. BluePainter checks button backgrounds against WCAG AA (default 4.5:1) and suggests a fix color.

## Why it matters

Generation tools invent UI. Receipts enforce team policy so merges pass accessibility review. Weak contrast is the most common receipt failure in validation sessions.

## Try it free

1. [Contrast checker](https://bluepainter-launch.vercel.app/tools/contrast-checker) — same ratio math
2. Full loop in the [studio demo](https://bluepainter-studio.vercel.app/#/app) — edit CTA color, watch the receipt update, apply fix → TSX patches

## Policy defaults

- Minimum ratio: 4.5
- Suggested fix color: `#1e40af`
- Configurable in the VS Code extension settings and team policy panel
