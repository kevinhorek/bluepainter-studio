---
title: "Spacing checklist for fintech React teams"
description: "A short spacing checklist for fintech teams shipping React, with the Designer's Receipts rule that automates it."
pattern: "checklist"
generated: true
pubDate: 2026-07-21
---

# Spacing checklist for fintech React teams

A short spacing checklist for fintech teams shipping React, with the Designer's Receipts rule that automates it.

## Why this matters for fintech teams

Fintech teams work in regulated flows where contrast, wording and disclosure placement get audited. Spacing is one of the first things to drift.

## Checklist

- Padding values are multiples of the grid step
- One-off values like 13px or 34px are either fixed or documented
- The grid step in policy matches the design system tokens

## Automate it

BluePainter's spacing receipt checks whether padding sits on your spacing grid (an 8px grid by default). One click snaps the value to the nearest grid step and writes the change back to your TSX.

## Next

- Read [Designer's Receipts for spacing](/guides/designers-receipts-for-spacing)
- Try the free [receipt grader](/tools/receipt-grader)
- Bring a design–dev pair to a facilitated [pilot](/pilot)
