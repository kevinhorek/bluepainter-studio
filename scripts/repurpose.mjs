#!/usr/bin/env node
/**
 * AI content repurposing engine — turn a pillar transcript into multi-channel drafts.
 * Usage: node scripts/repurpose.mjs path/to/transcript.txt
 * Optional: OPENAI_API_KEY for live generation; otherwise writes template drafts.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../site/drafts');
mkdirSync(outDir, { recursive: true });

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/repurpose.mjs <transcript.txt>');
  process.exit(1);
}

const transcript = readFileSync(inputPath, 'utf8');
const stamp = new Date().toISOString().slice(0, 10);
const stem = basename(inputPath, '.txt').replace(/[^\w-]+/g, '-');

function templateDrafts(text) {
  const excerpt = text.slice(0, 400).replace(/\s+/g, ' ').trim();
  return {
    thread: [
      '1/ Design-to-code handoff is lossy. BluePainter bets on AST-preserving canvas ↔ TSX sync + Designer’s Receipts — not another generator.',
      `2/ ${excerpt.slice(0, 180)}…`,
      '3/ Free demo during validation. Request a pilot if you ship React with a design–dev pair → bluepainter.dev/pilot',
      '4/ Agents: read bluepainter.dev/llms.txt or use the BluePainter MCP server.'
    ].join('\n\n'),
    linkedin: `Most "AI design tools" generate throwaway UI.\n\nBluePainter is a workflow bet: keep canvas and TSX in sync inside your repo, then enforce contrast/spacing/CTA policy with Designer's Receipts.\n\n${excerpt}\n\nTry the free demo → https://bluepainter-studio.vercel.app/#/app\nPilot → https://bluepainter.dev/pilot`,
    newsletter: `# BluePainter note — ${stamp}\n\n## The idea\n\n${excerpt}\n\n## Links\n- Demo: https://bluepainter-studio.vercel.app/#/app\n- Pricing: https://bluepainter.dev/pricing\n- Free tools: https://bluepainter.dev/tools\n- FAQ: https://bluepainter.dev/faq\n`,
    faqDrafts: `### What problem does BluePainter solve?\n${excerpt}\n\n### How do I try it?\nOpen the free demo or request a pilot at https://bluepainter.dev/pilot\n`,
    shortClipPrompts: [
      'Hook: "Stop vibe-coding throwaway UI — sync canvas to real TSX."',
      'Demo beat: edit button color on canvas → code updates with id intact.',
      'Receipt beat: weak CTA "Submit" → fix to "Start free trial".',
      'CTA: free demo + request pilot.'
    ].join('\n')
  };
}

async function openaiDrafts(text) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content:
            'You repurpose founder transcripts for BluePainter (AST canvas↔TSX sync + Designer’s Receipts). Return JSON with keys: thread, linkedin, newsletter, faqDrafts, shortClipPrompts.'
        },
        { role: 'user', content: text.slice(0, 12000) }
      ],
      response_format: { type: 'json_object' }
    })
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

const drafts = (await openaiDrafts(transcript).catch(() => null)) || templateDrafts(transcript);
const outPath = join(outDir, `${stamp}-${stem}.json`);
writeFileSync(outPath, JSON.stringify({ source: inputPath, createdAt: new Date().toISOString(), drafts }, null, 2));

writeFileSync(join(outDir, `${stamp}-${stem}-thread.txt`), drafts.thread || '');
writeFileSync(join(outDir, `${stamp}-${stem}-linkedin.txt`), drafts.linkedin || '');
writeFileSync(join(outDir, `${stamp}-${stem}-newsletter.md`), drafts.newsletter || '');

console.log('Wrote drafts to', outDir);
console.log('Checklist: schedule thread + LinkedIn + newsletter; paste FAQ drafts into site/src/lib/faq.ts after edit; shoot clips from shortClipPrompts.');
