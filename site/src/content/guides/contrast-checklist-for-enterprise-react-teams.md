---
title: "Contrast checklist for enterprise React teams"
description: "A short contrast checklist for enterprise teams shipping React, with the Designer's Receipts rule that automates it."
pattern: "checklist"
generated: true
pubDate: 2026-07-21
---

# Contrast checklist for enterprise React teams

A short contrast checklist for enterprise teams shipping React, with the Designer's Receipts rule that automates it.

## Why this matters for enterprise teams

Enterprise teams pass every component through design-system review before it merges. Contrast is one of the first things to drift.

## Checklist

- Button text meets 4.5:1 on its background
- Brand colours that fail AA have an approved darker alternative
- Disabled and hover states are checked too, not only the default

## Automate it

BluePainter's contrast receipt checks the contrast ratio between button text and its background (WCAG AA — 4.5:1 by default). One click swaps the background for the nearest policy-approved colour and writes the change back to your TSX.

## Next

- Read [Designer's Receipts for contrast](/guides/designers-receipts-for-contrast)
- Try the free [contrast checker](/tools/contrast-checker)
- Bring a design–dev pair to a facilitated [pilot](/pilot)
