# Newsletter welcome sequence

ESP: connect `WAITLIST_WEBHOOK` on the **bluepainter-studio** Vercel project (waitlist API lives there).

Forms post to `https://bluepainter-studio.vercel.app/api/waitlist` with `source`:
- `newsletter`
- `pilot`
- `contrast-checker` / `receipt-grader` / `tsx-id-analyzer`

## Email 1 — Welcome (immediate)

**Subject:** BluePainter — free demo + contrast checker

```
Thanks for joining.

1) Open the free studio: https://bluepainter-studio.vercel.app/#/app
2) Try the free contrast checker: https://bluepainter-launch.vercel.app/tools/contrast-checker
3) Prefer a facilitated session? Request a pilot: https://bluepainter-launch.vercel.app/pilot

BluePainter = AST-preserving canvas ↔ TSX sync + Designer's Receipts.
Not another AI app generator.
```

## Email 2 — Receipts explainer (+2 days)

**Subject:** Designer's Receipts ≠ another linter

```
Designer's Receipts run on your canvas node map:
- contrast (WCAG)
- spacing grid
- weak CTA copy
- clutter

Fixes write back to TSX.

FAQ: https://bluepainter-launch.vercel.app/faq
Knowledge catalog: https://bluepainter-launch.vercel.app/knowledge
```

## Email 3 — Pilot CTA (+5 days)

**Subject:** Last seats this validation wave

```
We're running ~8 facilitated pilots per wave (30–45 min, scorecard export).

Request: https://bluepainter-launch.vercel.app/pilot
Or keep clicking around the free demo anytime.
```

## Buying a list (ops)

When budgeted: Duuce / direct outreach for design-systems or React DX newsletters (5k–50k). Warm the list with Email 1 style, not a hard sell.
