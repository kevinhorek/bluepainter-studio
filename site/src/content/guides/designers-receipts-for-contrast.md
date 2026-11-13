---
title: "Designer's Receipts for contrast"
description: "How BluePainter checks contrast against team policy and writes the fix back to TSX."
pattern: "receipts-rule"
generated: true
pubDate: 2026-07-21
---

# Designer's Receipts for contrast

How BluePainter checks contrast against team policy and writes the fix back to TSX.

## What this receipt checks

The **contrast** receipt checks the contrast ratio between button text and its background. The policy is WCAG AA — 4.5:1 by default, and your team can change it.

## How the fix works

One click swaps the background for the nearest policy-approved colour, and the change is written back to the TSX as a small diff.

## Why it matters

Generation tools invent UI. Receipts enforce the rules your team already agreed on, so components pass design-system review the first time.

## Try it

- Free [contrast checker](/tools/contrast-checker)
- The full loop in the [Studio demo](https://bluepainter-studio.vercel.app/#/app)
