# BluePainter Pricing Options — DRAFT

> **⚠️ DRAFT — NOT A PRODUCT DECISION**  
> This document explores pricing models for BluePainter's v1 commercial launch. It is intended for internal validation and pilot discussions only. No pricing has been finalized.

---

## Context (SPEC §12)

BluePainter's moat is the **learning loop** — receipts improve with team usage, creating compounding value. The pricing model must:

1. **Align with value delivery:** Teams that use receipts more should pay more
2. **Encourage adoption:** Low friction for first pilot users
3. **Scale with usage:** Revenue grows as teams ship more components
4. **Protect the moat:** Pricing should reinforce the learning loop, not commoditize it

See [SPEC.md](./SPEC.md) §3 (Moat) and §8 (Success Metrics) for product context.

---

## Three Pricing Models

### Option A: Per-Seat SaaS (Standard Model)

**What it is:**
- $X/month per active user (e.g., $29/user/month)
- Unlimited repos, unlimited components, unlimited receipts
- Team dashboard + learning loop analytics included

**Pros:**
- Simple, familiar billing (Figma, GitHub, Linear)
- Predictable revenue per user
- Easy to forecast MRR

**Cons:**
- Does not capture value from high-volume teams (100 components vs. 10 = same price)
- Discourages adding designers-only or part-time contributors (inflates seat count)
- Standard SaaS model — **no differentiation from incumbents**

**Best for:** Teams with stable, small dev teams (5–10 people) who edit components frequently.

---

### Option B: Per-Repo or Per-Component Usage (Volume-Based)

**What it is:**
- $Y/month per active repository (e.g., $99/repo/month)
- OR metered pricing: $Z per 100 receipt evaluations (e.g., $0.10/evaluation)
- Unlimited users within the org

**Pros:**
- Scales with actual usage (aligns with moat: more receipts = more value)
- Removes seat-inflation friction — designers, PMs, and part-time devs can access for free
- Captures value from high-volume teams (design systems with 100+ components)

**Cons:**
- Harder to explain ("What counts as an evaluation?")
- Unpredictable costs for users (bill shock if usage spikes)
- Requires metering infrastructure (tracking receipt runs per repo)

**Best for:** Enterprises with large design systems (Stripe, Airbnb, Shopify) who run receipts on 50–200 components/week.

---

### Option C: Open-Core Receipts (Tiered Feature Model)

**What it is:**
- **Free tier:** Basic receipts (contrast, spacing, CTA copy) in open-source extension
- **Pro tier ($X/user/month):** Advanced receipts (brand compliance, feature count, custom rules) + team dashboard
- **Enterprise tier (custom):** Learning loop analytics, CI gate, custom policy engine, SSO, audit logs

**Pros:**
- **Best wedge for adoption** — free tier gets users hooked on core workflow
- Differentiated from incumbents (open-source moat + paid learning loop)
- Clear upgrade path: free → pro (custom rules) → enterprise (team analytics)
- Protects core IP (learning loop, policy engine) while giving away commodity features

**Cons:**
- Requires maintaining an open-source extension (support burden)
- Free users may never convert if basic receipts are "good enough"
- Harder to message value of Pro tier ("Why pay if free works?")

**Best for:** Bottom-up adoption — individual devs start free, convert to Pro when they need custom rules, upgrade to Enterprise for team-wide governance.

---

## Recommended Default: **Option C (Open-Core Receipts)**

### Why this model wins:

1. **Lowest friction for pilots:** Free tier removes pricing objections during validation
2. **Aligns with moat:** Learning loop is the paid upgrade — free users still contribute data
3. **Defensible against incumbents:** Figma/Cursor can't easily copy an open-core model without open-sourcing their own tools
4. **Natural upgrade triggers:**
   - Free tier: Individual dev evaluating BluePainter
   - Pro tier: Team adopts custom receipt policies (`.bluepainter.json`)
   - Enterprise tier: Design systems org needs audit logs + CI gate + learning analytics

### Pricing structure (illustrative):

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Core receipts (contrast, spacing, CTA copy), canvas ↔ code sync, VS Code extension |
| **Pro** | $29/user/month | Custom receipts, team policy (`.bluepainter.json`), learning loop overrides, priority support |
| **Enterprise** | Custom | CI gate, audit logs, learning analytics dashboard, SSO, custom policy engine, SLA |

---

## Pilot Ask (SPEC §8 Validation Gate)

For validation pilots, use the following framing:

> **"We're validating product-market fit before pricing. This pilot is free."**

**Questions to ask pilot teams:**

1. **Activation gate:** Did you complete at least one canvas ↔ code round-trip?
2. **Retention signal:** Did you apply or dismiss 5+ receipt actions?
3. **Upgrade trigger:** If we charged for custom receipt policies, would you pay?
4. **Price sensitivity:** What's a fair price for your team? (per user, per repo, or per month flat)

**After 8–10 pilot sessions** (SPEC §8 kill criteria):
- If 3+ teams say "very interested" + willing to pay → proceed with Option C (open-core)
- If interest is high but "too expensive" objections → revisit free tier scope
- If free tier is "good enough" and no Pro interest → pivot to Option B (usage-based)

---

## Open Questions

### For Pilot Feedback:

- Would your team pay for custom receipt policies? Or is the free tier sufficient?
- If we charged per-repo instead of per-user, would that be more attractive?
- What's the budget approval process for adding a new SaaS tool to your stack?

### For v1 Launch:

- Should the free tier include CI gate? (Drives adoption but reduces Pro conversion)
- How do we price learning loop analytics? (Per team vs. per user vs. flat fee)
- Should we offer a "Community Edition" with all features but no support?

---

## Next Steps

1. **Validation pilots** (now → 10 sessions): Test pricing sensitivity, collect willingness-to-pay data
2. **Finalize tier structure** (post-validation): Lock feature splits (free vs. pro vs. enterprise)
3. **Build billing infra** (v1 launch): Stripe integration, usage metering (if Option B or C with metering)
4. **Launch open-source extension** (v1 launch): Publish to VS Code Marketplace with free tier features

---

## References

- [SPEC.md](./SPEC.md) — Full product spec with moat, kill criteria, and success metrics
- [VALIDATION.md](./VALIDATION.md) — Interview guide for pilot sessions
- [PILOT.md](./PILOT.md) — Pilot team onboarding checklist
- [SELF_PILOT.md](./SELF_PILOT.md) — 30–45 minute self-guided validation session

---

**Last updated:** September 2026 — Draft for SPEC §12 validation
