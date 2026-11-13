# BluePainter Self-Pilot Guide

**Target:** 30–45 minute validation session on your own real project

**Goal:** Prove BluePainter's canvas ↔ code sync works in your repo, evaluate Designer's Receipts, and export feedback for product validation.

---

## Prerequisites

- Your own React/TSX project (not demo code)
- 1–3 components you actively work on
- 30–45 minutes of focused time
- Browser: Chrome, Firefox, or Safari

---

## Quick Start (5 min)

### 1. Open the Studio

**For facilitators running validation sessions:**
```
https://bluepainter-studio.vercel.app/?facilitator=1#/app
```

**For self-guided pilots:**
```
https://bluepainter-studio.vercel.app/#/app
```

> **Facilitator mode** (`?facilitator=1`) enables session export, scorecard, break/fix tools, and auto-present demo. Use it when running validation sessions with others or when you need to export session data for product feedback.

### 2. Load Your Component

Click **Open file** → paste your component's TSX/JSX code into the editor

**What works best:**
- Pricing cards, hero sections, feature cards
- Components with 5–15 elements
- Inline styles or simple CSS (see `AST_SCOPE.md` for full compatibility)

**What to avoid (prototype limitations):**
- Components with complex Tailwind classes (partial support)
- Styled-components or CSS-in-JS libraries
- Server components with async/await

---

## Core Workflow (20 min)

### Part 1: Canvas → Code Round-Trip (10 min)

**Objective:** Prove visual edits write back to shippable TSX

1. **Select an element** on the canvas (button, heading, card)
2. **Edit properties** in the Inspector panel:
   - Change button text: `"Buy Now"` → `"Start Free Trial"`
   - Update padding: `16px` → `24px`
   - Change background color
3. **Observe the code panel** — changes appear in real-time
4. **Copy the updated TSX** — verify it's merge-ready (formatting preserved)

**Activation checkpoint:** Did text and style edits both survive in the code?

### Part 2: Code → Canvas Round-Trip (10 min)

**Objective:** Prove code edits sync to the visual canvas

1. **Edit the code panel directly:**
   - Change a heading's text
   - Update a `padding` or `margin` value
   - Modify a color hex code
2. **Observe the canvas** — changes appear immediately
3. **Make another canvas edit** — verify round-trip still works

**Activation checkpoint:** Did code edits update the canvas AND allow further visual edits?

---

## Designer's Receipts (10 min)

### Part 3: Review Policy Violations

**Objective:** See how receipts catch design-system drift

1. **Open the Receipts panel** (right sidebar or bottom panel)
2. **Review active receipts:**
   - **Spacing grid:** Padding not aligned to 8px
   - **Contrast:** Button text fails WCAG AA (4.5:1)
   - **CTA copy:** Weak words ("click here", "submit")
   - **Border radius:** Corners not on 4px grid
   - **Feature count:** Lists exceed 5 items

3. **Apply a fix** (one-click):
   - Example: Fix contrast → auto-suggests darker text color
   - Example: Align padding to grid → rounds `18px` to `16px`

4. **Dismiss a rule** (if it doesn't fit your project):
   - Click **Dismiss** on a receipt
   - Note: After 3+ dismisses, learning loop suggests hiding that rule for your team

**Activation checkpoint:** Did you apply at least one receipt fix?

---

## Export & Feedback (5 min)

### Part 4: Export Your Session (Facilitators Only)

If you opened facilitator mode (`?facilitator=1`):

1. Click **···** (three-dot menu in header) → **Session scorecard**
2. Review your activation metrics:
   - Canvas → code round-trips
   - Code → canvas round-trips
   - Receipt actions (fixes + dismisses)
3. Click **📦 Export pilot pack** or **Export session JSON**
4. Share the JSON file with Kevin or the product team

**What gets exported:**
- Activation status (did you complete both round-trips?)
- Receipt engagement (how many fixes/dismisses?)
- Interest level and pilot willingness (if you filled feedback form)
- Learning loop events (fix/dismiss patterns)
- Kill criteria dashboard (SPEC §8 validation gate)

### Part 5: Share Feedback (Optional)

Click **···** → **Share feedback**

**Quick questions:**
- **Interest level:** Very / Somewhat / Not really
- **Pilot willingness:** Would you use this on your real codebase?
- **Role:** Designer, Developer, Design-Dev Hybrid
- **Comments:** What worked? What didn't?

---

## Success Criteria

After 30–45 minutes, you should have:

✅ Completed **canvas → code** round-trip (text + style edits survived)  
✅ Completed **code → canvas** round-trip (code edits updated canvas)  
✅ Applied **at least one receipt fix** (contrast, spacing, copy, etc.)  
✅ Exported session data (facilitators) or shared feedback (pilots)

**If all four checkmarks are green:** BluePainter's core loop works in your repo.

**If any failed:** Note what broke — that's critical product feedback for v1 scoping.

---

## Next Steps

### If BluePainter worked for you:

- **Request a pilot seat:** See `PILOT.md` for full pilot program details
- **Customize team policy:** Create `.bluepainter.json` in your repo (see `PILOT.md` §5)
- **Enable CI gate:** Block merges on contrast failures (see `PILOT.md` §6)

### If you hit blockers:

- **Check scope:** See `AST_SCOPE.md` — your component might use unsupported features
- **Report issues:** https://github.com/kevinhorek/bluepainter-studio/issues
- **Email feedback:** kevin@bluepainter.com

---

## Facilitator Tools (For Validation Sessions)

If you're running this session with a user (not self-guided):

### Before the session:
1. Open `?facilitator=1#/app`
2. Verify **Facilitator** badge in header
3. Prepare user's component code (ask them to paste it in)

### During the session:
- **Auto-present:** `···` → **Auto-present** (walks through demo automatically)
- **Break design:** `···` → **Break design** (injects violations for demo)
- **Fix all:** `···` → **Fix all** (one-click apply all receipts)
- **Tour:** `···` → **Tour** (product walkthrough)

### After the session:
1. `···` → **Session scorecard** — review activation + kill criteria
2. **Export pilot pack** — comprehensive JSON export for analysis
3. Ask user to fill **Share feedback** form

---

## Common Questions

**Q: Does this work with Tailwind?**  
A: Partial support. Inline styles + simple Tailwind classes work. Complex responsive utilities may not round-trip. See `AST_SCOPE.md`.

**Q: Will this replace Figma?**  
A: No. BluePainter owns **repo truth** and syncs with your codebase. Figma import is planned for v2 (one-way), not bidirectional.

**Q: What if my team doesn't use inline styles?**  
A: v1 scope is inline styles + simple CSS modules. Styled-components and CSS-in-JS are deferred to v2. See `SPEC.md` §10.

**Q: Can I use this in production?**  
A: This is a **validation prototype**. Use it on real code, but not in production CI/CD yet. After validation (SPEC §8), we'll ship a v1 VS Code extension.

---

## Troubleshooting

**Canvas is blank after pasting code:**
- Verify component exports a JSX element
- Check for syntax errors in code panel
- Ensure component has `id="..."` attributes on elements

**Edits don't sync back to code:**
- Confirm element has a unique `id` attribute
- Check `AST_SCOPE.md` — some style props are read-only
- Text edits round-trip reliably; some style edits may require manual verification

**Receipts panel is empty:**
- Run **BluePainter: Pick Component** to reload
- Verify `.bluepainter.json` exists (or default policy applies)
- Check that component has detectable style props (padding, color, etc.)

**Export button is missing:**
- Export features require `?facilitator=1` mode
- Check for **Facilitator** badge in header
- Use `···` menu → **Session scorecard** → **Export**

---

## Links

- **Live demo:** https://bluepainter-studio.vercel.app/#/app
- **Facilitator mode:** https://bluepainter-studio.vercel.app/?facilitator=1#/app
- **Marketing site:** https://bluepainter.com/
- **Full pilot guide:** `PILOT.md`
- **Validation checklist:** `VALIDATION.md`
- **Product spec:** `SPEC.md`
- **AST scope doc:** `AST_SCOPE.md`

---

**Ready?** Open the Studio, paste your component, and run your first canvas ↔ code round-trip.
