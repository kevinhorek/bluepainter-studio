# BluePainter Facilitator Guide

**Target session duration:** 30–45 minutes  
**Goal:** Validate SPEC §8 activation metrics + capture interest/pilot willingness  
**Prerequisites:** Facilitator mode (`?facilitator=1`), screenshare/recording optional

---

## Overview

This guide walks facilitators through running validation sessions with real users. Each session aims to:

1. **Prove activation:** User completes canvas ↔ code round-trips both directions
2. **Prove engagement:** User interacts with 5+ receipt actions (fixes or dismisses)
3. **Capture intent:** Interest level (very/somewhat/not) + pilot willingness (yes/maybe/no)
4. **Surface feedback:** What would make this a must-have for their team?

---

## Pre-session setup (5 min)

### 1. Open facilitator mode
- Navigate to `https://bluepainter-studio.vercel.app/?facilitator=1`
- Confirm amber **Facilitator** badge appears in header next to **Prototype**
- Click **···** menu → **Session checklist** to open live metrics tracker
- Click **Start session** — timer begins

### 2. Share demo link with participant
- Send: `https://bluepainter-studio.vercel.app`
- Ask them to open in Chrome/Edge (Firefox may have canvas rendering quirks)
- Participant should see the marketing landing page first

### 3. Set expectations
> "This is a 30-minute demo of BluePainter, a prototype for React teams. You'll explore the tool on your own for ~10 minutes, then I'll ask a few quick questions. Be brutally honest — we need real feedback to decide whether to build this fully."

---

## Session structure (30–40 min)

### Phase 1: Silent exploration (5–10 min)

**Facilitator actions:**
1. Watch your **Session checklist** modal — metrics update live:
   - Canvas → code round-trip (target: 1+)
   - Code → canvas round-trip (target: 1+)
   - Receipt actions (target: 5+)
2. Do NOT guide them unless they're stuck for >90 seconds

**Participant flow:**
- Clicks **Try BluePainter free** or **Open BluePainter** on landing page
- Sees DashboardPage.tsx in the canvas ↔ code editor
- Freely explores:
  - Edit button text on canvas → code updates?
  - Edit code `<span>Dashboard</span>` → canvas updates?
  - Click element → sidebar opens with receipt pills?
  - Expand design or code panel to ~90% → restore split view?
  - Drag PricingCard from **Library** tab onto page?

**What you're watching for:**
- Do they understand the canvas ↔ code sync concept?
- Do they notice receipts at the bottom when selecting elements?
- Are they confused by anything?

**Intervention triggers:**
- Stuck >90 seconds without interacting
- Explicitly asks "What should I do?"
- Closes demo thinking they're done

**If stuck, prompt:**
> "Try editing the button text on the canvas, then check if the code panel updates."

---

### Phase 2: Receipts walkthrough (5–7 min)

Once they've explored for 5–10 minutes, gently interrupt:

> "Let me show you one feature — Designer's Receipts. This is the governance layer."

#### Step-by-step walkthrough:

1. **Facilitator: Break the design**
   - In your own facilitator instance: **···** → **Break design**
   - Their view updates: PricingCard now has contrast failures
   - Say: *"I just broke the design remotely. Select the CTA button."*

2. **Participant: Select the button**
   - They click the blue CTA button on the PricingCard
   - Receipt pills appear at bottom: **Contrast**, **Weak CTA copy**

3. **Participant: Open receipt detail**
   - They click a receipt pill (e.g., **Contrast 2.1:1 — fails WCAG AA**)
   - Sidebar opens with fix options
   - Ask: *"Would your team run this check before merging to main?"*

4. **Participant: Apply fix**
   - They click **Fix → Use #1e40af** or similar
   - Code updates, canvas updates, receipt clears
   - Your **Session checklist** increments receipt actions count

5. **Optional: Dismiss a rule**
   - Say: *"What if you disagreed with a rule? Try dismissing one."*
   - They click **Dismiss** on a receipt
   - After 3+ dismisses of the same rule, learning suggestions appear

**Key questions to ask during this phase:**
- *"Is this useful for your workflow?"*
- *"Would you trust this over manual review?"*
- *"What rules would your team want to customize?"*

---

### Phase 3: Advanced features (5 min, optional)

If time permits and user is engaged, show:

#### Component library
- **Library** tab in sidebar
- Drag PricingCard or HeroSection onto DashboardPage
- Explain: *"These are real .tsx files, not abstract symbols. You're composing pages from components you'd ship to production."*

#### Figma import (if relevant to their workflow)
- **···** → **Import from Figma**
- Show: paste Figma URL or JSON
- Say: *"You can pull Figma frames into the canvas, then edit and export as React."*

#### Marketing kit (if they ship landing pages)
- **Marketing** button in header
- Show: auto-generate landing copy, social images, deploy to Vercel
- Say: *"This exports a full marketing site from your canvas design — no separate tool."*

---

### Phase 4: Feedback collection (5 min)

#### Check your session metrics
- Open **Session checklist** modal
- Confirm all activation metrics are met:
  - ✓ Canvas → code round-trip (1+)
  - ✓ Code → canvas round-trip (1+)
  - ✓ Receipt actions (5+)
- If metrics are incomplete, gently guide them to complete before feedback

#### Prompt for feedback
1. **Interest level**
   - **···** → **Share feedback**
   - They select:
     - **Very — I'd pay for this**
     - **Somewhat — I'd try it**
     - **Not really — not for me**

2. **Pilot willingness**
   - They select:
     - **Yes — would try on our codebase**
     - **Maybe — depends on setup**
     - **No — not for our team**

3. **Open-ended feedback**
   - Ask: *"Would you use this instead of Figma + your IDE?"*
   - Ask: *"What one thing would make you switch?"*
   - Optional: *"What's your role?"* (Designer / Developer / Founder-PM / Other)

4. **Submit**
   - They click **Submit Feedback**
   - Thank them!

---

### Phase 5: Export session data (2 min)

After participant leaves:

1. **End session**
   - **Session checklist** modal → **End session**
   - Timer stops, metrics freeze

2. **Export pilot pack**
   - **···** → **Export pilot pack**
   - Downloads `bluepainter-pilot-pack-YYYY-MM-DD.json`
   - Includes:
     - Executive summary (GO/NO-GO/CONTINUE)
     - Kill criteria status (SPEC §8)
     - Session-by-session metrics
     - Learning loop events
     - Next steps

3. **Optional: Export session scorecard**
   - **···** → **Session scorecard** → **Export session JSON**
   - Lighter export for quick review

4. **Review metrics**
   - **···** → **Session scorecard**
   - Check progress toward kill criteria:
     - Target: 8–10 sessions
     - Need: 3+ "very interested" + pilot willingness
   - If ≥3 "very interested" after 8 sessions → **GO**
   - If <3 after 10 sessions → **NO-GO** (review kill criteria)

---

## Tips for running great sessions

### Do's ✓
- Let them drive — resist the urge to guide
- Watch for confusion signals (long pauses, furrowed brow)
- Ask "why" when they struggle or skip features
- Record exact quotes in feedback comments
- Note what they tried *first* (indicates intuitive entry points)

### Don'ts ✗
- Don't oversell — this is validation, not a sales pitch
- Don't dismiss negative feedback — that's the most valuable signal
- Don't skip activation metrics — they prove the core wedge works
- Don't run sessions back-to-back — take 10 min to export and review

### Red flags to escalate
- User says Figma/Cursor "already does this"
- User can't understand canvas ↔ code sync after 5 minutes
- User doesn't see value in receipts ("we already lint")
- Activation rate <50% after 5 sessions

---

## Interpreting results

### Strong signal (build v1)
- 3+ "very interested" after 8 sessions
- 2+ pilot "yes" responses
- Activation rate >70%
- Users ask: "When can I use this in my repo?"

### Weak signal (refine or pivot)
- Mostly "somewhat interested" or "not really"
- Pilot willingness: mostly "maybe" or "no"
- Activation rate <50%
- Users say: "Cool demo, but I wouldn't switch"

### Mixed signal (iterate demo)
- High interest but low pilot willingness → unclear setup story
- Low activation but high interest → UX friction, not value problem
- High activation but low interest → wedge is wrong, feature is right

---

## Troubleshooting

### Participant can't see the demo
- Check browser: Chrome/Edge work best
- Check URL: should be `bluepainter-studio.vercel.app` (no `?facilitator=1` for them)
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### Metrics not updating
- Refresh your **Session checklist** modal
- Confirm you're in facilitator mode (`?facilitator=1`)
- Check if participant is editing code *and* canvas (need both for activation)

### Receipts not showing
- Ask participant to select an element on canvas (e.g., button)
- Check if DashboardPage or PricingCard is open (other files may not have receipts)
- Run **Break design** to force receipt triggers

### Participant finishes in 10 minutes
- Ask: *"Did you try editing the code panel? Did you notice the receipts at the bottom?"*
- If they genuinely explored everything, move to feedback early
- Short sessions are fine if activation metrics are met

---

## Next steps after 8–10 sessions

### If GO (3+ very interested, 2+ pilot yes)
1. Email pilot teams: repo access, onboarding call scheduling
2. Instrument extension for production learning loop
3. Set up team policy config (`.bluepainter.json`) for each pilot
4. Schedule weekly check-ins during pilot (first 4 weeks)

### If NO-GO (< 3 very interested after 10 sessions)
1. Review all feedback comments for pivot insights
2. Identify failure mode:
   - **Wedge problem:** users don't see the value prop
   - **UX problem:** users like the idea but find it confusing
   - **Market fit:** wrong target user (e.g., agencies vs. product teams)
3. Consider:
   - Sharper demo (focus on 1 killer workflow)
   - Clearer value prop (compare to Figma/Cursor explicitly)
   - Different target user (designers vs. developers vs. founders)

### If CONTINUE (< 8 sessions or mixed signals)
1. Run 2–5 more sessions
2. If activation rate <50%, refine demo script or UX
3. If interest is high but pilot willingness low, clarify setup story

---

## Reference documents

- **SPEC.md §8:** Success metrics & kill criteria
- **PILOT.md:** Pilot team quick-start guide (for teams who say "yes")
- **VALIDATION.md:** Detailed validation checklist
- **Session checklist modal:** Live metrics tracker during sessions (`···` → Session checklist)
- **Session scorecard modal:** Post-session summary and export (`···` → Session scorecard)

---

**Questions?** Check the repo issues or email the team. Good luck with your sessions! 🚀
