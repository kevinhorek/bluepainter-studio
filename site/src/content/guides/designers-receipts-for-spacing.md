---
title: "Designer's Receipts for spacing"
description: "How BluePainter checks spacing against team policy and writes the fix back to TSX."
pattern: "receipts-rule"
generated: true
pubDate: 2026-07-21
---

# Designer's Receipts for spacing

How BluePainter checks spacing against team policy and writes the fix back to TSX.

## What this receipt checks

The **spacing** receipt checks whether padding sits on your spacing grid. The policy is an 8px grid by default, and your team can change it.

## How the fix works

One click snaps the value to the nearest grid step, and the change is written back to the TSX as a small diff.

## Why it matters

Generation tools invent UI. Receipts enforce the rules your team already agreed on, so components pass design-system review the first time.

## Try it

- Free [receipt grader](/tools/receipt-grader)
- The full loop in the [Studio demo](https://www.bluepainter.com/#/app)
