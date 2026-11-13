# Pilot Dry-Run Checklist

**Purpose:** Pre-flight checklist for facilitators before running validation sessions

**Time:** 10 minutes  
**Print this:** Keep it next to your laptop during pilot sessions

---

## Pre-Session Setup (5 min)

### Environment Check

- [ ] Open facilitator mode: `https://bluepainter-studio.vercel.app/?facilitator=1#/app`
- [ ] Verify **Facilitator** badge visible in header (amber background)
- [ ] Confirm `···` menu shows facilitator tools (Break design, Fix all, Auto-present, Session scorecard)
- [ ] Test session scorecard opens: `···` → **Session scorecard**
- [ ] Verify export button works: **Export pilot pack** downloads JSON
- [ ] Clear any prior session data: Browser DevTools → Application → Local Storage → Clear (optional)

### User Prep

- [ ] Ask user to prepare 1–2 components from their real codebase (`.tsx` or `.jsx`)
- [ ] Confirm components have inline styles or simple CSS (not styled-components)
- [ ] Request components with 5–15 elements (buttons, headings, cards work best)
- [ ] Verify user has 30–45 minutes of focused time
- [ ] Send them the Studio link (non-facilitator): `https://bluepainter-studio.vercel.app/#/app`

---

## Session Script (30 min)

### Part 1: Intro (2 min)

- [ ] "We're validating BluePainter — a tool that syncs visual edits ↔ React code bidirectionally"
- [ ] "You'll paste your component, edit it visually, and see if it writes back to shippable TSX"
- [ ] "Goal: prove canvas ↔ code round-trips work in your real repo"

### Part 2: Load Component (3 min)

- [ ] User clicks **Open file** and pastes TSX/JSX code
- [ ] Canvas renders the component
- [ ] If canvas is blank: check for syntax errors, missing `id` attributes, or unsupported patterns

### Part 3: Canvas → Code Round-Trip (10 min)

- [ ] User selects an element on canvas (button, heading, card)
- [ ] User edits in Inspector panel:
  - [ ] Change text content: `"Buy Now"` → `"Start Free Trial"`
  - [ ] Update padding: `16px` → `24px`
  - [ ] Change background color
- [ ] Verify code panel updates in real-time
- [ ] User copies updated TSX and confirms it's merge-ready (formatting preserved)
- [ ] **Checkpoint:** Ask "Did text and style edits both survive in the code?"

### Part 4: Code → Canvas Round-Trip (5 min)

- [ ] User edits code panel directly:
  - [ ] Change heading text
  - [ ] Update padding/margin
  - [ ] Modify color hex code
- [ ] Verify canvas updates immediately
- [ ] User makes another canvas edit to confirm round-trip still works
- [ ] **Checkpoint:** Ask "Did code edits update the canvas AND allow further visual edits?"

### Part 5: Designer's Receipts (8 min)

- [ ] User opens Receipts panel (right sidebar or bottom panel)
- [ ] Review active receipts with user:
  - [ ] Spacing grid violations (padding not 8px aligned)
  - [ ] Contrast failures (text < 4.5:1 WCAG AA)
  - [ ] CTA copy issues (weak words like "click here")
  - [ ] Border radius not on 4px grid
  - [ ] Feature count exceeds 5 items
- [ ] User applies **at least one fix** (one-click):
  - [ ] Example: Fix contrast → auto-suggests darker color
  - [ ] Example: Align padding to grid → rounds `18px` to `16px`
- [ ] User dismisses **at least one rule** (if not applicable)
- [ ] Explain learning loop: "After 3+ dismisses, we suggest hiding that rule for your team"
- [ ] **Checkpoint:** Ask "Would these receipts catch real design drift before code review?"

### Part 6: Feedback (2 min)

- [ ] User clicks `···` → **Share feedback**
- [ ] User fills quick form:
  - [ ] Interest level: Very / Somewhat / Not really
  - [ ] Pilot willingness: Yes / Maybe / No
  - [ ] Role: Designer / Developer / Hybrid
  - [ ] Comments: What worked? What didn't?
- [ ] User submits feedback

---

## Post-Session (5 min)

### Export Session Data

- [ ] Facilitator opens `···` → **Session scorecard**
- [ ] Review activation metrics with user:
  - [ ] Canvas → code round-trips: ✓ or ○
  - [ ] Code → canvas round-trips: ✓ or ○
  - [ ] Receipt actions: N fixes + M dismisses
- [ ] Click **📦 Export pilot pack** (comprehensive JSON export)
- [ ] Verify JSON downloads with session data, activation status, kill criteria
- [ ] Save JSON to `validation-exports/` folder for analysis

### Session Notes

- [ ] Record blockers encountered (if any):
  - Component didn't render?
  - Edits didn't sync?
  - Receipts panel empty?
- [ ] Note user's top feedback:
  - What worked best?
  - What was confusing?
  - Would they use this daily?
- [ ] Add notes to pilot tracking sheet (Google Sheets, Notion, etc.)

---

## Kill Criteria Check (After 8–10 Sessions)

Review exported pilot pack JSON files:

- [ ] **Sessions completed:** ≥ 8 (target: 10)
- [ ] **"Very interested":** ≥ 3 responses
- [ ] **Pilot willingness:** ≥ 1 "yes" to using on real codebase
- [ ] **Activation rate:** ≥ 50% of sessions completed both round-trips
- [ ] **Receipt engagement:** Users applied or dismissed ≥ 3 receipt actions per session

**Decision:**
- **GO:** Build v1 extension (≥3 very interested + ≥1 pilot yes)
- **CONTINUE:** Run 2–3 more sessions
- **NO-GO:** Review SPEC §8 kill criteria and pivot

---

## Common Session Issues

### Canvas doesn't render after paste
- **Cause:** Syntax error, missing JSX export, or unsupported pattern
- **Fix:** Ask user to simplify component (remove server-side code, async/await)
- **Fallback:** Use demo component (Hero, PricingCard) and discuss hypothetically

### Edits don't sync back to code
- **Cause:** Element missing `id` attribute, or unsupported style property
- **Fix:** Add `id="unique-id"` to elements, verify inline styles
- **Note:** Text edits round-trip reliably; some style edits are read-only (see `AST_SCOPE.md`)

### Receipts panel is empty
- **Cause:** Component has no detectable violations, or policy not loaded
- **Fix (Facilitator):** Use `···` → **Break design** to inject violations for demo
- **Alternative:** Manually edit canvas to create violations (e.g., change padding to `18px`)

### User says "we use Tailwind/styled-components"
- **Response:** "v1 focuses on inline styles + simple CSS. Tailwind has partial support. Your feedback helps us prioritize v2 scope."
- **Note:** Log this as a blocker in session notes — may affect pilot willingness

### User asks "will this replace Figma?"
- **Response:** "No. BluePainter owns repo truth. Figma import is planned for v2 (one-way), not bidirectional. We complement Figma, not replace it."

---

## Emergency Facilitator Tools

If session is stuck, use these to unblock:

- **Auto-present:** `···` → **Auto-present** (automated demo walkthrough)
- **Break design:** `···` → **Break design** (inject violations to demo receipts)
- **Fix all:** `···` → **Fix all** (apply all receipt fixes at once)
- **Reset:** `···` → **Reset** (restore component to original state)
- **Tour:** `···` → **Tour** (product walkthrough with tooltips)

---

## Session Timing

| Phase | Target | Critical? |
|-------|--------|-----------|
| Intro | 2 min | No |
| Load component | 3 min | Yes — session fails if this doesn't work |
| Canvas → code | 10 min | Yes — core activation metric |
| Code → canvas | 5 min | Yes — core activation metric |
| Receipts | 8 min | Yes — product differentiation |
| Feedback | 2 min | Yes — validation data |
| **Total** | **30 min** | — |

**Buffer:** Plan for 45 minutes total to handle blockers and Q&A

---

## Success Metrics (Per Session)

Track these in your session notes:

- ✅ **Activation complete:** User completed both round-trips (canvas↔code)
- ✅ **Receipt engagement:** User applied or dismissed ≥ 1 receipt
- ✅ **Interest level:** "Very interested" response
- ✅ **Pilot willingness:** "Yes" to using on real codebase
- ⚠️ **Partial activation:** Only one round-trip completed
- ❌ **Blocked:** Session failed due to technical issue

---

## Post-Session Email Template

```
Subject: BluePainter validation session — thank you + next steps

Hi [Name],

Thanks for testing BluePainter with your [component name] component!

Quick recap:
- ✅ Canvas ↔ code round-trips: [completed / partial / blocked]
- ✅ Receipt actions: [N fixes + M dismisses]
- ✅ Feedback submitted: [interest level]

Your feedback will help us decide whether to build v1 (VS Code extension).

Next steps:
- If you're interested in piloting: We'll reach out after 8–10 validation sessions
- If you want updates: We'll email when v1 ships

Questions? Reply here or check https://bluepainter.com/

Thanks,
[Your name]
```

---

## Links

- **Facilitator mode:** https://bluepainter-studio.vercel.app/?facilitator=1#/app
- **Full pilot guide:** `PILOT.md`
- **Self-pilot guide:** `SELF_PILOT.md`
- **Validation checklist:** `VALIDATION.md`
- **Product spec:** `SPEC.md`
- **AST scope doc:** `AST_SCOPE.md`

---

**Ready?** Print this checklist and keep it next to you during validation sessions.
