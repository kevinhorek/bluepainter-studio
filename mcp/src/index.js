#!/usr/bin/env node
/**
 * BluePainter MCP server — distribution channel for AI assistants.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEMO_URL = 'https://bluepainter-studio.vercel.app';
const SITE_URL = process.env.BLUEPAINTER_SITE_URL || 'https://bluepainter-launch.vercel.app';
const WAITLIST_URL = process.env.BLUEPAINTER_WAITLIST_URL || `${DEMO_URL}/api/waitlist`;

function getContrastRatio(hexcolor) {
  if (!hexcolor || String(hexcolor).length < 6) return 8.7;
  const color = String(hexcolor).replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return 8.7;
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  return Math.round((1.05 / (luminance + 0.05)) * 100) / 100;
}

function analyzeTsxIds(source) {
  const ids = [];
  const re = /\bid\s*=\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(source || ''))) ids.push(m[1]);
  return { count: new Set(ids).size, ids: [...new Set(ids)] };
}

function evaluateReceiptsFromArgs(args) {
  const bg = args.background || '#2563eb';
  const ratio = getContrastRatio(bg);
  const weakWords = ['submit', 'click here', 'send', 'button', 'ok', 'enter'];
  const cta = String(args.ctaText || '').toLowerCase().trim();
  const pad = parseInt(args.padding, 10);
  const rules = [
    { id: 'contrast', valid: ratio >= 4.5, ratio },
    { id: 'copy', valid: !weakWords.includes(cta) },
    { id: 'spacing', valid: Number.isNaN(pad) || pad % 8 === 0 }
  ];
  return { rules, score: rules.filter((r) => r.valid).length * 33 };
}

function loadKnowledge() {
  try {
    const jsonPath = join(__dirname, 'knowledge.json');
    return JSON.parse(readFileSync(jsonPath, 'utf8'));
  } catch {
    return {
      brand: 'BluePainter',
      status: 'validation_prototype',
      urls: { demo: DEMO_URL, site: SITE_URL, demoApp: `${DEMO_URL}/#/app` }
    };
  }
}

const server = new Server(
  { name: 'bluepainter', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'bluepainter_open_demo',
      description: 'Return BluePainter live demo and marketing deep links.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'bluepainter_analyze_tsx',
      description: 'Count syncable JSX id attributes in TSX/JSX source.',
      inputSchema: {
        type: 'object',
        properties: { source: { type: 'string', description: 'TSX/JSX source code' } },
        required: ['source']
      }
    },
    {
      name: 'bluepainter_receipts_evaluate',
      description: "Evaluate Designer's Receipts style checks (contrast, CTA, spacing).",
      inputSchema: {
        type: 'object',
        properties: {
          background: { type: 'string' },
          ctaText: { type: 'string' },
          padding: { type: 'number' }
        }
      }
    },
    {
      name: 'bluepainter_get_knowledge',
      description: 'Return BluePainter knowledge catalog / FAQ facts for citation.',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Optional topic filter: pricing|services|faq|all' }
        }
      }
    },
    {
      name: 'bluepainter_request_pilot',
      description: 'Submit a pilot waitlist request (requires email).',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          name: { type: 'string' },
          company: { type: 'string' },
          message: { type: 'string' }
        },
        required: ['email']
      }
    },
    {
      name: 'bluepainter_figma_import',
      description: 'Fetch Figma file JSON via BluePainter API (requires FIGMA_TOKEN env on API host).',
      inputSchema: {
        type: 'object',
        properties: {
          fileUrl: { type: 'string' },
          apiBase: { type: 'string', description: 'API base, default live demo origin' }
        },
        required: ['fileUrl']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  if (name === 'bluepainter_open_demo') {
    const payload = {
      demo: DEMO_URL,
      app: `${DEMO_URL}/#/app`,
      home: `${DEMO_URL}/#/home`,
      site: SITE_URL,
      pricing: `${SITE_URL}/pricing`,
      pilot: `${SITE_URL}/pilot`,
      tools: `${SITE_URL}/tools`
    };
    return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
  }

  if (name === 'bluepainter_analyze_tsx') {
    return { content: [{ type: 'text', text: JSON.stringify(analyzeTsxIds(args.source), null, 2) }] };
  }

  if (name === 'bluepainter_receipts_evaluate') {
    return { content: [{ type: 'text', text: JSON.stringify(evaluateReceiptsFromArgs(args), null, 2) }] };
  }

  if (name === 'bluepainter_get_knowledge') {
    const knowledge = loadKnowledge();
    const topic = (args.topic || 'all').toLowerCase();
    let out = knowledge;
    if (topic === 'pricing') out = knowledge.pricing || knowledge;
    if (topic === 'services') out = knowledge.services || knowledge;
    if (topic === 'faq') out = knowledge.faq || knowledge;
    return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] };
  }

  if (name === 'bluepainter_request_pilot') {
    try {
      const res = await fetch(WAITLIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: args.email,
          name: args.name || '',
          company: args.company || '',
          message: args.message || '',
          source: 'mcp-pilot'
        })
      });
      const data = await res.json();
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ ok: false, error: err.message }) }],
        isError: true
      };
    }
  }

  if (name === 'bluepainter_figma_import') {
    const base = (args.apiBase || DEMO_URL).replace(/\/$/, '');
    try {
      const res = await fetch(`${base}/api/figma-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: args.fileUrl })
      });
      const data = await res.json();
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ ok: false, error: err.message }) }],
        isError: true
      };
    }
  }

  return {
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    isError: true
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
