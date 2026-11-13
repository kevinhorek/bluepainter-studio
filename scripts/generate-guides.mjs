#!/usr/bin/env node
/**
 * Generate the programmatic guide pages for the Astro content collection
 * (site/src/content/guides).
 *
 *   node scripts/generate-guides.mjs            # unique pages only
 *   node scripts/generate-guides.mjs --full-matrix   # every rule × team checklist
 *
 * Rules of the road:
 * - Every page has a unique slug and a unique (pattern, subject) pair — nothing is padded
 *   to hit a page count, and slugs never carry numeric suffixes.
 * - Generated files carry `generated: true` in their frontmatter. Re-running deletes
 *   generated files that are no longer produced; hand-written guides (no flag) are never
 *   touched, and a generated slug that collides with a hand-written file is skipped.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DEMO_URL } from '../site/site.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../site/src/content/guides');
const manifestPath = join(outDir, '../guides-index.json');
const DEMO_APP = `${DEMO_URL}/#/app`;
const PUB_DATE = '2026-07-21';
const FULL_MATRIX = process.argv.includes('--full-matrix');

mkdirSync(outDir, { recursive: true });

/** Team types. `label` is how the name reads mid-sentence; `context` is what makes handoff hard for them. */
const niches = [
  { id: 'saas', label: 'SaaS', context: 'ship pricing, onboarding and settings screens every sprint, so small spacing and copy drifts add up fast' },
  { id: 'fintech', label: 'fintech', context: 'work in regulated flows where contrast, wording and disclosure placement get audited' },
  { id: 'healthcare', label: 'healthcare', context: 'need accessible forms and unambiguous calls to action for patients and clinicians' },
  { id: 'ecommerce', label: 'e-commerce', context: 'live or die on product cards, carts and checkout buttons that must stay readable at every breakpoint' },
  { id: 'education', label: 'education', context: 'serve a wide range of devices and abilities, which makes contrast and clear copy non-negotiable' },
  { id: 'marketplace', label: 'marketplace', context: 'maintain two-sided UI — listings, dashboards, checkout — with one small front-end team' },
  { id: 'devtools', label: 'developer-tool', context: 'have engineers who read every diff and reject visual tools that reformat their files' },
  { id: 'design-systems', label: 'design-system', context: 'own the spacing, radius and colour scales everyone else is supposed to follow' },
  { id: 'agencies', label: 'agency', context: 'hand code to client repos and cannot leave a proprietary format behind' },
  { id: 'startups', label: 'startup', context: 'often have one designer and one engineer who need the same file to be the source of truth' },
  { id: 'enterprise', label: 'enterprise', context: 'pass every component through design-system review before it merges' },
  { id: 'b2b', label: 'B2B', context: 'build dense, form-heavy screens where consistency matters more than novelty' },
  { id: 'consumer', label: 'consumer-app', context: 'iterate on conversion copy and button treatment constantly' },
  { id: 'mobile-web', label: 'mobile-web', context: 'design for small screens where padding and tap-target decisions are highly visible' },
  { id: 'dashboard', label: 'dashboard', context: 'pack tables, filters and cards into one view and fight visual clutter daily' },
  { id: 'marketing-sites', label: 'marketing-site', context: 'rebuild hero, pricing and CTA sections often and need them on-brand each time' },
  { id: 'docs-sites', label: 'docs-site', context: 'care about readable type, calm layouts and components that survive content changes' },
  { id: 'internal-tools', label: 'internal-tool', context: 'rarely have a dedicated designer, so policy checks stand in for design review' },
  { id: 'open-source', label: 'open-source', context: 'review contributions from strangers and need objective, automatable UI checks' },
  { id: 'ai-products', label: 'AI-product', context: 'generate a lot of UI quickly and then have to make it consistent enough to ship' }
];

const components = [
  { id: 'pricing-card', label: 'pricing card' },
  { id: 'hero-section', label: 'hero section' },
  { id: 'navbar', label: 'navbar' },
  { id: 'footer', label: 'footer' },
  { id: 'feature-grid', label: 'feature grid' },
  { id: 'cta-banner', label: 'CTA banner' },
  { id: 'testimonial', label: 'testimonial' },
  { id: 'dashboard-page', label: 'dashboard page' },
  { id: 'settings-form', label: 'settings form' },
  { id: 'modal', label: 'modal' },
  { id: 'sidebar', label: 'sidebar' },
  { id: 'data-table', label: 'data table' },
  { id: 'empty-state', label: 'empty state' },
  { id: 'onboarding', label: 'onboarding flow' },
  { id: 'checkout', label: 'checkout form' }
];

/** Product names keep their own casing; `focus` is a neutral one-line description. */
const competitors = [
  { id: 'figma-dev-mode', name: 'Figma Dev Mode', focus: 'inspecting designs and copying specs and snippets out of Figma' },
  { id: 'v0', name: 'v0', focus: 'generating React UI from a prompt' },
  { id: 'cursor', name: 'Cursor', focus: 'AI-assisted editing across a whole codebase' },
  { id: 'anima', name: 'Anima', focus: 'converting Figma designs into front-end code' },
  { id: 'locofy', name: 'Locofy', focus: 'turning design files into front-end code' },
  { id: 'builder-io', name: 'Builder.io', focus: 'visual page building on top of an existing site' },
  { id: 'framer', name: 'Framer', focus: 'designing and publishing websites on its own platform' },
  { id: 'webflow', name: 'Webflow', focus: 'visually building and hosting websites' },
  { id: 'plasmic', name: 'Plasmic', focus: 'visually building pages and components for React apps' },
  { id: 'teleport-hq', name: 'TeleportHQ', focus: 'low-code front-end building with code export' }
];

const rules = [
  {
    id: 'contrast',
    label: 'contrast',
    tool: { href: '/tools/contrast-checker', name: 'contrast checker' },
    checks: 'the contrast ratio between button text and its background',
    policy: 'WCAG AA — 4.5:1 by default',
    fix: 'swaps the background for the nearest policy-approved colour',
    items: ['Button text meets 4.5:1 on its background', 'Brand colours that fail AA have an approved darker alternative', 'Disabled and hover states are checked too, not only the default']
  },
  {
    id: 'spacing',
    label: 'spacing',
    tool: { href: '/tools/receipt-grader', name: 'receipt grader' },
    checks: 'whether padding sits on your spacing grid',
    policy: 'an 8px grid by default',
    fix: 'snaps the value to the nearest grid step',
    items: ['Padding values are multiples of the grid step', 'One-off values like 13px or 34px are either fixed or documented', 'The grid step in policy matches the design system tokens']
  },
  {
    id: 'cta-copy',
    label: 'CTA copy',
    tool: { href: '/tools/receipt-grader', name: 'receipt grader' },
    checks: 'button labels against a list of weak, generic words',
    policy: 'flags labels such as “Submit”, “Click here” and “OK”',
    fix: 'suggests a specific, outcome-led label you can accept or edit',
    items: ['Primary buttons say what happens next', 'Generic labels (“Submit”, “Send”) are replaced', 'The weak-word list reflects your own voice guidelines']
  },
  {
    id: 'border-radius',
    label: 'border radius',
    tool: { href: '/tools/receipt-grader', name: 'receipt grader' },
    checks: 'corner radii against your radius scale',
    policy: 'a 4px scale by default',
    fix: 'rounds the value to the nearest step on the scale',
    items: ['Radii come from the scale (4, 8, 12…), not ad-hoc values', 'Nested elements use a smaller radius than their container', 'Cards and buttons agree on which step they use']
  },
  {
    id: 'feature-clutter',
    label: 'feature clutter',
    tool: { href: '/tools/receipt-grader', name: 'receipt grader' },
    checks: 'how many feature bullets a card or section carries',
    policy: 'a maximum of five by default',
    fix: 'flags the overflow so you can trim or regroup the list',
    items: ['Pricing and feature cards stay at five bullets or fewer', 'Longer lists are grouped or moved behind a “compare” link', 'The limit in policy matches what design review actually enforces']
  }
];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const article = (s) => (/^[aeiou]/i.test(s) ? 'an' : 'a');

const guides = [];

for (const niche of niches) {
  guides.push({
    slug: `best-figma-to-react-tools-for-${niche.id}`,
    title: `Best Figma to React tools for ${niche.label} teams`,
    pattern: 'best-for-niche',
    description: `How ${niche.label} teams evaluate Figma-to-React handoff — and when BluePainter's AST sync fits.`,
    niche
  });
}

for (const component of components) {
  guides.push({
    slug: `how-to-sync-${component.id}-canvas-and-tsx`,
    title: `How to sync ${article(component.label)} ${component.label} between canvas and TSX`,
    pattern: 'how-to-sync',
    description: `A practical id-contract checklist for keeping ${article(component.label)} ${component.label} editable on the BluePainter canvas and in code.`,
    component
  });
}

for (const competitor of competitors) {
  guides.push({
    slug: `${competitor.id}-vs-bluepainter`,
    title: `${competitor.name} vs BluePainter`,
    pattern: 'vs',
    description: `${competitor.name} focuses on ${competitor.focus}. BluePainter keeps canvas and TSX in sync inside your repo and checks design policy with Designer's Receipts.`,
    competitor
  });
}

for (const rule of rules) {
  guides.push({
    slug: `designers-receipts-for-${rule.id}`,
    title: `Designer's Receipts for ${rule.label}`,
    pattern: 'receipts-rule',
    description: `How BluePainter checks ${rule.label} against team policy and writes the fix back to TSX.`,
    rule
  });
}

// Checklists: rule × team. By default each team gets the one rule it is paired with
// (20 pages); --full-matrix emits the whole cross product (100 pages). Either way the
// pairs come from the cross product, so no pair can appear twice.
niches.forEach((niche, i) => {
  rules.forEach((rule, j) => {
    if (!FULL_MATRIX && j !== i % rules.length) return;
    guides.push({
      slug: `${rule.id}-checklist-for-${niche.id}-react-teams`,
      title: `${cap(rule.label)} checklist for ${niche.label} React teams`,
      pattern: 'checklist',
      description: `A short ${rule.label} checklist for ${niche.label} teams shipping React, with the Designer's Receipts rule that automates it.`,
      niche,
      rule
    });
  });
});

function body(g) {
  if (g.pattern === 'best-for-niche') {
    const { label, context } = g.niche;
    return `## The ${label} handoff problem

${cap(label)} teams ${context}. One-way Figma exports produce code nobody wants to maintain; BluePainter instead keeps the canvas and your existing TSX in sync through stable \`id\` attributes.

## Evaluation checklist

1. Do visual edits need to land in the real repo, as small diffs?
2. Do you need contrast, spacing and CTA policy enforced — not only code generated?
3. Is a designer–engineer pair going to use it together?

## When BluePainter fits

Choose BluePainter when format-preserving round-trips and Designer's Receipts matter more than prompt-to-app generation. Try the [free demo](${DEMO_APP}) or [request a pilot](/pilot).

## FAQ

**Is it free?** Yes during validation — the live demo is open, and pilots are capacity-limited.

**Does it replace Figma?** No. It complements Figma: explore there, then edit repo-native components here.
`;
  }
  if (g.pattern === 'how-to-sync') {
    const { id, label } = g.component;
    return `## Goal

Keep ${article(label)} **${label}** editable on the canvas and in TSX without losing comments or formatting.

## Id contract

\`\`\`tsx
<section id="${id}-frame" style={{ padding: 32 }}>
  <button id="${id}-cta" style={{ background: '#2563eb' }}>Start free trial</button>
</section>
\`\`\`

The \`id\` is the join key between a canvas layer and its JSX element. Synced fields today: inline \`style\`, text, and \`img\` \`src\`.

## Steps

1. Open the ${label} in BluePainter (or the VS Code extension)
2. Give every layer you want to edit visually a stable, unique \`id\` — the [TSX id analyzer](/tools/tsx-id-analyzer) lists what the canvas can map
3. Edit on the canvas or in code; receipts flag policy issues as you go
4. Export or write back when the diff looks right

See the [AST scope](https://github.com/kevinhorek/bluepainter-studio/blob/main/AST_SCOPE.md) for what is and is not synced.
`;
  }
  if (g.pattern === 'vs') {
    const { name, focus } = g.competitor;
    return `## Short answer

**${name}** focuses on ${focus}. **BluePainter** focuses on AST-preserving canvas ↔ TSX sync plus team policy checks, inside the repo you already have. Many teams will use both.

## Comparison lens

| Lens | What to ask of ${name} | BluePainter |
|------|------------------------|-------------|
| Starting point | Does it start from a design, a prompt, or your code? | Your existing TSX files |
| Editing existing code | Does a visual edit keep your comments and formatting? | Core — one-line diffs |
| Design policy | Can it enforce your contrast, spacing and copy rules? | Core — Designer's Receipts |
| Where the result lives | Its platform, or your repo? | Your repo |

This page describes positioning, not a feature-by-feature benchmark — check ${name}'s own documentation for its current capabilities.

## Try before you decide

Use the [free demo](${DEMO_APP}), or request a [pilot](/pilot) if you want a facilitated session on your own components.
`;
  }
  if (g.pattern === 'receipts-rule') {
    const { label, checks, policy, fix, tool } = g.rule;
    return `## What this receipt checks

The **${label}** receipt checks ${checks}. The policy is ${policy}, and your team can change it.

## How the fix works

One click ${fix}, and the change is written back to the TSX as a small diff.

## Why it matters

Generation tools invent UI. Receipts enforce the rules your team already agreed on, so components pass design-system review the first time.

## Try it

- Free [${tool.name}](${tool.href})
- The full loop in the [Studio demo](${DEMO_APP})
`;
  }
  const { rule, niche } = g;
  return `## Why this matters for ${niche.label} teams

${cap(niche.label)} teams ${niche.context}. ${cap(rule.label)} is one of the first things to drift.

## Checklist

${rule.items.map((item) => `- ${item}`).join('\n')}

## Automate it

BluePainter's ${rule.label} receipt checks ${rule.checks} (${rule.policy}). One click ${rule.fix} and writes the change back to your TSX.

## Next

- Read [Designer's Receipts for ${rule.label}](/guides/designers-receipts-for-${rule.id})
- Try the free [${rule.tool.name}](${rule.tool.href})
- Bring a design–dev pair to a facilitated [pilot](/pilot)
`;
}

// ---- guard: unique slugs and unique titles ----
const seenSlugs = new Set();
const seenTitles = new Set();
for (const g of guides) {
  if (seenSlugs.has(g.slug)) throw new Error(`Duplicate guide slug: ${g.slug}`);
  if (seenTitles.has(g.title)) throw new Error(`Duplicate guide title: ${g.title}`);
  seenSlugs.add(g.slug);
  seenTitles.add(g.title);
}

// ---- which existing files does this generator own? ----
const isGenerated = (file) => /^---\n[\s\S]*?\ngenerated:\s*true\s*\n[\s\S]*?\n---/.test(readFileSync(file, 'utf8'));
const existing = readdirSync(outDir).filter((name) => name.endsWith('.md'));
// Files written before the `generated` flag existed are recognised by the old manifest —
// but only while no file carries the flag yet. After that the flag alone decides, so
// removing it from a file is enough to adopt that guide as hand-written.
let legacyOwned = new Set();
if (!existing.some((name) => isGenerated(join(outDir, name)))) {
  try {
    legacyOwned = new Set(JSON.parse(readFileSync(manifestPath, 'utf8')).map((entry) => entry.slug));
  } catch {
    legacyOwned = new Set();
  }
}

let removed = 0;
for (const name of existing) {
  const slug = name.slice(0, -3);
  if (seenSlugs.has(slug)) continue;
  const file = join(outDir, name);
  if (isGenerated(file) || legacyOwned.has(slug)) {
    unlinkSync(file);
    removed += 1;
  }
}

// ---- write ----
const index = [];
let skipped = 0;
for (const g of guides) {
  const file = join(outDir, `${g.slug}.md`);
  if (existsSync(file) && !isGenerated(file) && !legacyOwned.has(g.slug)) {
    console.warn(`Skipping ${g.slug}: a hand-written guide with this slug exists.`);
    skipped += 1;
    continue;
  }
  const md = `---
title: ${JSON.stringify(g.title)}
description: ${JSON.stringify(g.description)}
pattern: ${JSON.stringify(g.pattern)}
generated: true
pubDate: ${PUB_DATE}
---

# ${g.title}

${g.description}

${body(g)}`;
  writeFileSync(file, md);
  index.push({ slug: g.slug, title: g.title, description: g.description, pattern: g.pattern });
}

// Manifest of generated pages (also how the next run recognises files it owns).
writeFileSync(manifestPath, `${JSON.stringify(index, null, 2)}\n`);
console.log(`Wrote ${index.length} unique guides to ${outDir} (removed ${removed} stale, skipped ${skipped} hand-written).`);
