# Validation guide — BluePainter Studio

Use this for **5–8 sessions** with frontend devs, design engineers, or founders shipping React UI. Sessions should be **15–20 minutes** of them using the tool, not you presenting.

**Demo URL:** https://bluepainter-studio.vercel.app  
**Facilitator tools:** add `?facilitator=1` for export, auto-present, break/fix scenarios.

---

## Before the session

- [ ] Deploy is current (`npm run deploy:vercel`)
- [ ] Browser: Chrome or Safari, desktop (1280px+ width ideal)
- [ ] You: facilitator mode on, export empty or note prior session count
- [ ] Them: no prep — this is a first-impression test

---

## Script (15 min)

### 1. Hook (1 min)

> "This is a prototype of a visual editor that stays in sync with your React/TSX — and catches design issues before merge. I'd love you to click around like it's real and tell me if you'd use it."

Open **DashboardPage.tsx** from the file menu. Don't tour unless they're stuck.

### 2. Explore freely (5 min)

Watch silently. Note:

- Do they find the **canvas** vs **code** panel (rail → code icon)?
- Do they **select elements** and see the sidebar open?
- Do they switch to **PricingCard.tsx** and edit something?
- Do **receipt messages** appear at the bottom when something fails?

**Prompt only if stuck:**

> "Try changing the button color on the canvas and see if the code updates."

> "Open the Library tab and drag HeroSection onto the page."

### 3. Receipts moment (3 min)

If no issues yet (facilitator): **··· → Break design**, switch to PricingCard, select the CTA.

> "These are Designer's Receipts — team rules for contrast, spacing, copy. Would your team run this before merge?"

Let them click a **receipt message** or **Fix** in the sidebar.

### 4. Page vs component (2 min)

> "Dashboard composes PricingCard and HeroSection as imports — same files you'd ship. Does composing a full page feel useful?"

### 5. Close (4 min)

Open **··· → Share feedback** (or leave it to them).

Ask out loud:

1. **"Would you use this instead of your current Figma + IDE flow for components?"** (yes / maybe / no)
2. **"What's the one thing that would make you switch?"**
3. **"Would your team pay for this or expect it free in Cursor/Figma?"**

Thank them. Don't sell.

---

## After the session

- Facilitator: **··· → Export** — saves JSON with feedback + learning events
- Log notes: name, role, quotes, blockers
- Target: **8 sessions** before go/no-go

---

## Go / no-go (from SPEC §8)

| Result | Action |
|--------|--------|
| **≥3 "very interested"** + would pilot in real repo | Build v1 VS Code/Cursor extension |
| Interest but vague | One killer workflow only; don't expand scope |
| Mostly "cool but…" | Refine problem or kill |
| **<3 willing to pilot after 10 sessions** | Kill or pivot |

### Kill signals

- "Cursor/Figma good enough"
- Don't trust code sync
- Would never run receipts in CI/review
- Can't complete canvas ↔ code round-trip without help

### Build signals

- Ask about **real repo** unprompted
- Customize **Rules** in receipts
- Want **page composition** + component files
- Compare to v0/Figma and say what's missing *specifically*

---

## Export checklist

After 8 sessions, your export JSON should show:

- `feedback.summary.very` ≥ 3 → **GO**
- `learningLoop.summary.roundTripsCanvas` + `roundTripsCode` > 0 per engaged user
- `learningLoop.events` with `fix_applied` → receipts resonate

---

## v1 if GO (reminder)

1. Recast/Babel AST sync (replace regex)
2. VS Code/Cursor extension on real `src/` files
3. Team learning loop backend
4. CI gate on error-severity receipts

Not in v1: Tauri, Figma plugin, responsive canvas, AI app generator.
