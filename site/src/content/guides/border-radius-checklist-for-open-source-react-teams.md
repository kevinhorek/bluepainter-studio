---
title: "Border radius checklist for open-source React teams"
description: "A short border radius checklist for open-source teams shipping React, with the Designer's Receipts rule that automates it."
pattern: "checklist"
generated: true
pubDate: 2026-07-21
---

# Border radius checklist for open-source React teams

A short border radius checklist for open-source teams shipping React, with the Designer's Receipts rule that automates it.

## Why this matters for open-source teams

Open-source teams review contributions from strangers and need objective, automatable UI checks. Border radius is one of the first things to drift.

## Checklist

- Radii come from the scale (4, 8, 12…), not ad-hoc values
- Nested elements use a smaller radius than their container
- Cards and buttons agree on which step they use

## Automate it

BluePainter's border radius receipt checks corner radii against your radius scale (a 4px scale by default). One click rounds the value to the nearest step on the scale and writes the change back to your TSX.

## Next

- Read [Designer's Receipts for border radius](/guides/designers-receipts-for-border-radius)
- Try the free [receipt grader](/tools/receipt-grader)
- Bring a design–dev pair to a facilitated [pilot](/pilot)
