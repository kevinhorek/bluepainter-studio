#!/usr/bin/env node
/**
 * Generate ~100 programmatic SEO guide pages for Astro content collection.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../site/src/content/guides');
mkdirSync(outDir, { recursive: true });

const niches = [
  'saas', 'fintech', 'healthcare', 'ecommerce', 'education', 'marketplace',
  'devtools', 'design-systems', 'agencies', 'startups', 'enterprise', 'b2b',
  'consumer', 'mobile-web', 'dashboard', 'marketing-sites', 'docs-sites',
  'internal-tools', 'open-source', 'ai-products'
];

const components = [
  'pricing-card', 'hero-section', 'navbar', 'footer', 'feature-grid',
  'cta-banner', 'testimonial', 'dashboard-page', 'settings-form', 'modal',
  'sidebar', 'data-table', 'empty-state', 'onboarding', 'checkout'
];

const competitors = [
  'figma-dev-mode', 'v0', 'cursor', 'anima', 'locofy', 'builder-io',
  'framer', 'webflow', 'plasmic', 'teleport-hq'
];

const rules = ['contrast', 'spacing', 'cta-copy', 'border-radius', 'feature-clutter'];

const guides = [];

niches.forEach((niche) => {
  guides.push({
    slug: `best-figma-to-react-tools-for-${niche}`,
    title: `Best Figma to React tools for ${niche} teams`,
    pattern: 'best-for-niche',
    niche,
    description: `How ${niche} product teams evaluate Figma→React handoff — and when BluePainter's AST sync fits.`
  });
});

components.forEach((component) => {
  guides.push({
    slug: `how-to-sync-${component}-canvas-and-tsx`,
    title: `How to sync a ${component.replace(/-/g, ' ')} between canvas and TSX`,
    pattern: 'how-to-sync',
    component,
    description: `Practical id-contract checklist for keeping a ${component.replace(/-/g, ' ')} editable in BluePainter.`
  });
});

competitors.forEach((competitor) => {
  guides.push({
    slug: `${competitor}-vs-bluepainter`,
    title: `${competitor.replace(/-/g, ' ')} vs BluePainter`,
    pattern: 'vs',
    competitor,
    description: `Positioning: generation vs AST-preserving canvas↔code sync with Designer's Receipts.`
  });
});

rules.forEach((rule) => {
  guides.push({
    slug: `designers-receipts-for-${rule}`,
    title: `Designer's Receipts for ${rule.replace(/-/g, ' ')}`,
    pattern: 'receipts-rule',
    rule,
    description: `How BluePainter enforces ${rule.replace(/-/g, ' ')} policy and writes fixes back to TSX.`
  });
});

// Pad to ~100 with combo pages
while (guides.length < 100) {
  const niche = niches[guides.length % niches.length];
  const rule = rules[guides.length % rules.length];
  guides.push({
    slug: `${rule}-checklist-for-${niche}-react-teams-${guides.length}`,
    title: `${rule.replace(/-/g, ' ')} checklist for ${niche} React teams`,
    pattern: 'checklist',
    niche,
    rule,
    description: `A practical ${rule.replace(/-/g, ' ')} checklist for ${niche} teams evaluating BluePainter.`
  });
}

const seed = guides.slice(0, 100);

function body(g) {
  if (g.pattern === 'best-for-niche') {
    return `## The ${g.niche} handoff problem

${g.niche} teams ship React UI under design-system review. One-way Figma exports create throwaway code. BluePainter keeps canvas and TSX in sync with stable \`id\` attributes.

## Evaluation checklist

1. Do edits need to survive in the real repo?
2. Do you need contrast/spacing/CTA policy — not only generation?
3. Is a design–dev pair the buyer?

## When BluePainter fits

Choose BluePainter when AST-preserving round-trip and Designer's Receipts matter more than prompt-to-app generation. Try the [free demo](https://bluepainter-studio.vercel.app/#/app) or [request a pilot](/pilot).

## FAQ

**Is it free?** Yes during validation — live demo open; pilots capacity-limited.

**Does it replace Figma?** No. It complements repo-native editing after design exploration.
`;
  }
  if (g.pattern === 'how-to-sync') {
    return `## Goal

Keep a **${(g.component || '').replace(/-/g, ' ')}** editable on canvas and in TSX without losing formatting.

## Id contract

\`\`\`tsx
<button id="cta-button" style={{ background: '#2563eb' }}>Start free trial</button>
\`\`\`

The \`id\` is the join key. Synced fields today: inline \`style\`, text, and \`img\` \`src\`.

## Steps

1. Open the component in BluePainter (or the VS Code extension)
2. Confirm every layer you care about has a stable id
3. Edit canvas or code — receipts flag policy issues
4. Export / write-back when ready

See [AST scope](https://github.com/kevinhorek/bluepainter-studio/blob/main/AST_SCOPE.md).
`;
  }
  if (g.pattern === 'vs') {
    return `## Short answer

**${(g.competitor || '').replace(/-/g, ' ')}** optimizes for design/codegen workflows. **BluePainter** optimizes for AST-preserving canvas↔TSX sync plus team policy receipts inside existing repos.

## Comparison lens

| Lens | Typical competitor strength | BluePainter |
|------|----------------------------|-------------|
| Generation | Strong | Secondary |
| Format-preserving edit | Varies | Core |
| Design policy receipts | Rare | Core |
| Repo-native VS Code path | Varies | Scaffolded |

## Try before you decide

Use the [free demo](https://bluepainter-studio.vercel.app/#/app). Request a [pilot](/pilot) if you need a facilitated scorecard session.
`;
  }
  if (g.pattern === 'receipts-rule') {
    return `## What this receipt checks

**${(g.rule || '').replace(/-/g, ' ')}** is part of Designer's Receipts — live governance on the canvas node map with fixes that write back to code.

## Why it matters

Generation tools invent UI. Receipts enforce team policy so merges pass design-system review.

## Try it

- Free [${g.rule === 'contrast' ? 'contrast checker' : 'receipt grader'}](/tools/${g.rule === 'contrast' ? 'contrast-checker' : 'receipt-grader'})
- Full loop in the [studio demo](https://bluepainter-studio.vercel.app/#/app)
`;
  }
  return `## Overview

This guide covers **${(g.rule || 'policy').replace(/-/g, ' ')}** for **${g.niche || 'React'}** teams evaluating BluePainter.

## Checklist

- Stable JSX ids on synced layers
- Receipt policy enabled for contrast/spacing/CTA
- Demo walkthrough with a design–dev pair
- Optional facilitated [pilot](/pilot)

## Next

Read the [FAQ](/faq) or open the [knowledge catalog](/knowledge).
`;
}

const index = [];
for (const g of seed) {
  const fm = `---
title: ${JSON.stringify(g.title)}
description: ${JSON.stringify(g.description)}
pattern: ${JSON.stringify(g.pattern)}
pubDate: 2026-07-21
---

# ${g.title}

${g.description}

${body(g)}
`;
  writeFileSync(join(outDir, `${g.slug}.md`), fm);
  index.push({ slug: g.slug, title: g.title, description: g.description, pattern: g.pattern });
}

writeFileSync(join(outDir, '../guides-index.json'), JSON.stringify(index, null, 2));
console.log(`Wrote ${seed.length} guides to ${outDir}`);
