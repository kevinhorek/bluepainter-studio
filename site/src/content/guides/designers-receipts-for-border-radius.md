---
title: "Designer's Receipts for border radius"
description: "How BluePainter checks border radius against team policy and writes the fix back to TSX."
pattern: "receipts-rule"
generated: true
pubDate: 2026-07-21
---

# Designer's Receipts for border radius

How BluePainter checks border radius against team policy and writes the fix back to TSX.

## What this receipt checks

The **border radius** receipt checks corner radii against your radius scale. The policy is a 4px scale by default, and your team can change it.

## How the fix works

One click rounds the value to the nearest step on the scale, and the change is written back to the TSX as a small diff.

## Why it matters

Generation tools invent UI. Receipts enforce the rules your team already agreed on, so components pass design-system review the first time.

## Try it

- Free [receipt grader](/tools/receipt-grader)
- The full loop in the [Studio demo](https://bluepainter-studio.vercel.app/#/app)
