# BluePainter — Product Spec

> **Status:** v1 engineering complete → awaiting pilot validation (SPEC §8)  
> **SPEC §5 (7/7):** ✓ Extension, ✓ AST sync, ✓ Receipts, ✓ Learning loop, ✓ CI gate — all shipped (#115–#123)  
> **Live demo:** https://bluepainter-studio.vercel.app  
> **Repo:** https://github.com/kevinhorek/bluepainter-studio

---

## 1. Problem

Design-to-code handoff is lossy. Designers work in Figma; developers work in repos. Export tools generate throwaway code. Incumbents (Figma Dev Mode, Cursor agents, v0) can generate UI from prompts or designs, but they do **not** preserve team formatting, design-system policy, or bidirectional editability inside an existing codebase.

**Target pain:** A frontend dev + designer pair shipping components that must pass design-system review before merge.

---

## 2. Wedge (what we sell)

**AST-preserving bidirectional sync + Designer's Receipts inside existing repos.**

| Capability | Why it matters |
|------------|----------------|
| Canvas ↔ code round-trip | Edits survive in shippable React/TSX, not a runtime lock-in |
| Formatting preservation | Comments, spacing, and structure survive visual edits (Recast/Babel) |
| Designer's Receipts | Live policy checks (contrast, grid, copy, clutter) — governance, not generation |
| Learning loop | Fix/dismiss/merge patterns improve team-specific rules over time |

**We are NOT** an LLM wrapper that generates apps from prompts. Model intelligence is a commodity; **workflow + repo integration + compounding team policy** is the moat.

---

## 3. Moat — the learning loop

The product must get **strictly better with usage**. A generic model upgrade must not replace core value.

### Data we capture (v1 prototype → production)

| Event | Use |
|-------|-----|
| Receipt fix applied | Which rules fire most; auto-suggest fixes per team |
| Receipt dismissed / ignored | Rules teams reject → tune or downgrade severity |
| Policy config changes | Team design tokens, grid scale, contrast floor, max features |
| Canvas → code round-trip | Activation metric; proves sync works |
| Code → canvas round-trip | Developer trust signal |
| Merge-ready export ✓ | What actually shipped to `src/` — **implemented in Studio + extension** |

### Output over time

- Receipt suggestions weighted by past team fixes  
- Custom rules from repeated dismiss/fix patterns  
- Audit log: who changed what, via canvas or code, which receipt fired  

**Spec requirement:** Every receipt action in the product logs to the learning loop (prototype: localStorage; production: team backend).

---

## 4. Bear case test

For every feature, answer:

> *If Figma + Cursor shipped this in 90 days, would we still win? Why?*

| Feature | Bear case | Our defense |
|---------|-----------|-------------|
| Generate React from design | v0, Figma MCP, Cursor agent | We **round-trip** in their repo with formatting preserved |
| Design lint / contrast | Figma plugins, Lighthouse CI | Receipts are **policy-configurable**, tied to sync, audit logged |
| Visual editor in IDE | Cursor, VS Code extensions | **AST fidelity** + team rules + learning loop |
| Standalone design tool | Figma | We **don't replace Figma** — we own repo truth |

**Kill test:** If the answer is "our UI is nicer," do not build it.

---

## 5. v1 scope (non-negotiable) — ✅ COMPLETE

**Status:** All v1 engineering shipped (#115–#123). See SPEC_STATUS.md for evidence.

### Ship ✅

- ✅ **One surface:** VS Code / Cursor extension (Phase 1 in demo = target UX)
- ✅ **One user job:** Edit known components (e.g. PricingCard) with receipts before merge
- ✅ **Real AST sync:** Recast + Babel — regex prototype replaced
- ✅ **Lossless scope (v1):** Inline styles + simple component trees; documented in AST_SCOPE.md
- ✅ **Configurable receipts:** Grid, contrast floor, CTA blocklist, max features
- ✅ **Learning loop:** Logs fixes, dismissals, policy changes, round-trips to localStorage (production backend optional)
- ✅ **Conflict model:** Documented in CONFLICT_MODEL.md + implemented (3-way resolution in Studio, prompt in extension)

### Explicitly defer (vision only in demo) — ⏳ DEFERRED

- ⏳ Tauri desktop shell (Phase 2) — Electron prototype exists but not v1 requirement
- ⏳ Figma plugin bidirectional sync (Phase 3) — v2 may allow import-only; one-way import working in v0.3
- ⏳ Responsive multi-viewport canvas (Phase 4) — prototype exists but not v1 moat requirement
- ⏳ Hosted code runtime / proprietary lock-in — explicitly not building
- ⏳ "AI generates whole apps from prompts" — explicitly not building

---

## 6. Receipts as team policy engine

Not demo rules — a **governance layer**.

| Rule | Default | Configurable | Severity |
|------|---------|--------------|----------|
| Spacing grid | 8px | Grid step | Warning |
| Border radius grid | 4px | Grid step | Warning |
| Button contrast | 4.5:1 WCAG AA | Min ratio | Error |
| CTA copy | Block weak words | Word list + suggestion | Warning |
| Feature count | Max 5 | Max count | Warning |
| **Brand color ✓** | **Primary token** | **Team primary color** | **Info** |

**Shipped in v0.2:** Design token fields (primary, secondary, text color) in `.bluepainter.json` with brand-color receipt.  
**Future:** Block merge on error-severity receipts (CI gate). Audit log per fix/dismiss.

---

## 7. Distribution (Clock 2 — incumbents)

Users already live in VS Code/Cursor and Git. v1 must:

- Read/write files in `src/` — **✓ implemented:** extension write-back confirms path, Studio exports merge-ready TSX  
- Ship as marketplace extension, not standalone app first  
- Optional Figma import in v2, not v1 bidirectional  

---

## 8. Success metrics & kill criteria — 🟡 HUMAN GATE

**Status:** v1 engineering complete. Awaiting pilot validation sessions (5–10 required).

### Activation (Instrumented ✅)

- User completes **one full canvas ↔ code round-trip** (either direction)
- Tracked in facilitator mode via session scorecard

### Retention signal (Instrumented ✅)

- User runs receipts on **3+ components** in a week (production)
- User applies or dismisses **5+ receipt actions** (prototype demo)
- Tracked in learning loop + exported in pilot pack

### Moat signal (Instrumented ✅)

- Team **customizes ≥1 receipt policy** and uses it repeatedly  
- **Learning loop** shows repeated fix patterns (production)
- Tracked via `.bluepainter.json` changes + learning loop events

### Validation gate (CURRENT PHASE — human work required)

| Signal | Action |
|--------|--------|
| **3+ "very interested"** + willingness to pilot in real repo | Ship v1 to Marketplace |
| Interest but vague | Sharpen wedge; one killer workflow |
| Mostly "cool but…" | Refine problem; do not build platforms |

**Facilitator tools ready:**
- SELF_PILOT.md — 30-minute self-guided validation
- FACILITATOR.md — session guide for running validation with users
- Session scorecard + pilot pack export (`?facilitator=1` mode)

**Next step:** Run 5–10 validation sessions, export pilot packs, review kill criteria dashboard.

### Kill criteria

- After **10 validation sessions**, fewer than 3 would pay or pilot → NO-GO
- Bear case wins: users say Cursor/Figma "good enough" for their flow → NO-GO
- Cannot achieve AST round-trip without destroying formatting (technical kill) → **PASSED** (AST sync working, 7/7 tests passing)

---

## 9. We are NOT building — ⏳ DEFERRED / OUT OF SCOPE

**Status:** Scope discipline enforced. These remain deferred or permanently out of scope.

- ⏳ **General website builder** — BluePainter is a component editor, not a site builder
- ⏳ **Figma replacement** — BluePainter owns repo truth; Figma owns design truth
- ⏳ **AI whole-app generator** — Model intelligence is a commodity; workflow + repo integration is the moat
- ⏳ **Four platform shells in v1** — Extension only; desktop/web are validation prototypes
- ⏳ **Hosted proprietary runtime** — No vendor lock-in; export shippable TSX
- ⏳ **Features whose only defense is UI polish** — Every feature must pass bear case test (SPEC §4)  

---

## 10. Technical wedge (v1 engineering)

### AST sync

- **Engine:** Recast + custom printer, or Babel parser + generator  
- **Preserve:** Comments, user formatting, identifier names where possible  
- **Scope doc:** Supported node types, style props, component boundaries  

### Conflict resolution

1. Canvas edit → regenerate code segment  
2. Code edit → parse → update canvas  
3. Simultaneous edit → last-write-wins with user prompt (v1); 3-way merge (v2)  

### Prototype → v1 gap

Current demo uses regex `syncEngine.js`. **v1 must replace this** before any paid pilot.

---

## 11. Roadmap

| Phase | Deliverable |
|-------|-------------|
| **Now** | Clickable validation demo + feedback export |
| **Validation** | 5–10 sessions; export JSON; decision gate |
| **v1** | Cursor/VS Code extension, real AST, policy + learning loop |
| **v2** | Figma import, CI receipt gates, team audit log |
| **v3** | Multi-surface vision (Tauri, responsive) if v1 moat proven |

---

## 12. Open questions — 🔵 DECISIONS MADE + REMAINING

### ✅ Resolved (implemented in v0.3)

| Question | Decision | Evidence |
|----------|----------|----------|
| **Tailwind vs. inline styles vs. CSS modules for v1 sync scope?** | **Inline styles** for canvas-editable properties. Tailwind/CSS modules preserved but not modified by canvas edits. | `AST_SCOPE.md` lines 62–64; all guides specify inline style scope |
| **Monorepo / design-system package detection?** | **Git context detection** (repo URL, branch, user, commit SHA) via URL params → localStorage (Studio) or native git CLI (extension). Design system token detection via `.bluepainter.json` in repo root. | `src/utils/gitContext.js`, `extension/lib/gitContext.js`, `src/utils/designSystemDetection.js` |

### 🟡 Still open (requires pilot validation or go-to-market decision)

| Question | Current Status | Decision Gate |
|----------|----------------|---------------|
| **Pricing: per-seat vs. per-repo vs. open-core receipts?** | Validation prototype is free. No pricing model yet. | Post-pilot validation (SPEC §8) |
| **Team backend for learning loop?** | Optional. Default is localStorage. Teams can self-host or use SaaS backend. | Pilot feedback will determine priority |
| **Marketplace vs. self-hosted first?** | Extension packages to VSIX; not yet published to Marketplace. | Blocked on pilot validation only |  

---

*Last updated: September 2026 — v0.2 merge-ready export + design tokens shipped*
