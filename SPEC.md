# BluePainter — Product Spec

> **Status:** Validation prototype → v1 planning  
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
| Merge-ready export (future) | What actually shipped to `src/` |

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

## 5. v1 scope (non-negotiable)

### Ship

- **One surface:** VS Code / Cursor extension (Phase 1 in demo = target UX)
- **One user job:** Edit known components (e.g. PricingCard) with receipts before merge
- **Real AST sync:** Recast or Babel — replace regex prototype
- **Lossless scope (v1):** Inline styles + simple component trees; document in/out explicitly
- **Configurable receipts:** Grid, contrast floor, CTA blocklist, max features
- **Learning loop:** Log fixes, dismissals, policy changes, round-trips
- **Conflict model:** Document canvas vs. manual code vs. git merge behavior

### Explicitly defer (vision only in demo)

- Tauri desktop shell (Phase 2)
- Figma plugin bidirectional sync (Phase 3) — v2 may allow import-only
- Responsive multi-viewport canvas (Phase 4)
- Hosted code runtime / proprietary lock-in
- "AI generates whole apps from prompts"

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

**Future:** Block merge on error-severity receipts (CI gate). Audit log per fix/dismiss.

---

## 7. Distribution (Clock 2 — incumbents)

Users already live in VS Code/Cursor and Git. v1 must:

- Read/write files in `src/` — no export step  
- Ship as marketplace extension, not standalone app first  
- Optional Figma import in v2, not v1 bidirectional  

---

## 8. Success metrics & kill criteria

### Activation

- User completes **one full canvas ↔ code round-trip** (either direction)

### Retention signal

- User runs receipts on **3+ components** in a week (production)
- User applies or dismisses **5+ receipt actions** (prototype demo)

### Moat signal

- Team **customizes ≥1 receipt policy** and uses it repeatedly  
- **Learning loop** shows repeated fix patterns (production)

### Validation gate (current demo phase)

| Signal | Action |
|--------|--------|
| **3+ "very interested"** + willingness to pilot in real repo | Build v1 extension |
| Interest but vague | Sharpen wedge; one killer workflow |
| Mostly "cool but…" | Refine problem; do not build platforms |

### Kill criteria

- After **10 validation sessions**, fewer than 3 would pay or pilot  
- Bear case wins: users say Cursor/Figma "good enough" for their flow  
- Cannot achieve AST round-trip without destroying formatting (technical kill)

---

## 9. We are NOT building

- General website builder  
- Figma replacement  
- AI whole-app generator  
- Four platform shells in v1  
- Hosted proprietary runtime  
- Features whose only defense is UI polish  

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

## 12. Open questions

- Tailwind vs. inline styles vs. CSS modules for v1 sync scope?  
- Monorepo / design-system package detection?  
- Pricing: per-seat vs. per-repo vs. open-core receipts?  

---

*Last updated: July 2026*
