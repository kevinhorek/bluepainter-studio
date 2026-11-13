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

const API_BASE = (process.env.BLUEPAINTER_API_BASE || DEMO_URL).replace(/\/+$/, '');
const HTTP_TIMEOUT_MS = Number(process.env.BLUEPAINTER_TIMEOUT_MS) || 15000;
const MAX_FIGMA_JSON_CHARS = 20000;
const KNOWLEDGE_TOPICS = ['all', 'pricing', 'services', 'faq'];
const WEAK_CTA_WORDS = ['submit', 'click here', 'send', 'button', 'ok', 'enter'];

const NAMED_COLORS = { white: '#ffffff', black: '#000000' };

/** Parse #rgb, #rrggbb(aa), rgb()/rgba() and white/black → [r, g, b], or null. */
function parseColor(input) {
  if (typeof input !== 'string') return null;
  let value = input.trim().toLowerCase();
  if (NAMED_COLORS[value]) value = NAMED_COLORS[value];
  let m = value.match(/^#([0-9a-f]{3})$/);
  if (m) return m[1].split('').map((c) => parseInt(c + c, 16));
  m = value.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].substring(i, i + 2), 16));
  m = value.match(/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/);
  if (m) return [m[1], m[2], m[3]].map((n) => Math.min(255, parseInt(n, 10)));
  return null;
}

function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast of white text on `background`; null when the colour can't be parsed. */
function getContrastRatio(background) {
  const bg = parseColor(background);
  if (!bg) return null;
  const ratio = 1.05 / (relativeLuminance(bg) + 0.05);
  return Math.round(ratio * 100) / 100;
}

/** Drop JS/JSX comments while leaving string literals (which may contain `//`) intact. */
function stripComments(source) {
  return source.replace(
    /("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    (match, str) => (str !== undefined ? str : ' ')
  );
}

/**
 * Heuristic (no parser): `id` attributes with a static string value —
 * id="a", id='a', id={"a"}, id={'a'}, id={`a`}. Skips data-id / fooId / obj.id
 * and `const id = "…"` declarations.
 */
function analyzeTsxIds(source) {
  const code = stripComments(String(source ?? ''));
  const re =
    /(?<![\w$.-])(?<!\b(?:const|let|var)\s+)id\s*=\s*(?:"([^"]+)"|'([^']+)'|\{\s*(?:"([^"]+)"|'([^']+)'|`([^`$]+)`)\s*\})/g;
  const ids = [];
  let m;
  while ((m = re.exec(code))) ids.push(m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5]);
  const unique = [...new Set(ids)];
  return { count: unique.length, ids: unique };
}

function evaluateReceiptsFromArgs(args) {
  const bg = args.background ?? '#2563eb';
  const ratio = getContrastRatio(bg);
  const cta = String(args.ctaText || '').toLowerCase().trim();
  const pad = parseInt(args.padding, 10);
  const contrast =
    ratio === null
      ? {
          id: 'contrast',
          valid: null,
          ratio: null,
          note: `Could not parse background "${bg}". Use #rgb, #rrggbb or rgb(r, g, b).`
        }
      : { id: 'contrast', valid: ratio >= 4.5, ratio };
  const rules = [
    contrast,
    { id: 'copy', valid: !WEAK_CTA_WORDS.includes(cta) },
    { id: 'spacing', valid: Number.isNaN(pad) || pad % 8 === 0 }
  ];
  // Rules that couldn't be evaluated (valid: null) don't count for or against the score.
  const evaluated = rules.filter((r) => r.valid !== null);
  const score = Math.round((evaluated.filter((r) => r.valid).length / evaluated.length) * 100);
  return { rules, score };
}

function isEmail(v) {
  return typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function textResult(payload, isError = false) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
  return isError ? { content: [{ type: 'text', text }], isError: true } : { content: [{ type: 'text', text }] };
}

/** POST JSON with a timeout; tolerates non-JSON responses. Never throws. */
async function postJson(url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS)
    });
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: `Non-JSON response (HTTP ${res.status})`, body: raw.slice(0, 500) };
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    const error = timedOut ? `Request timed out after ${HTTP_TIMEOUT_MS}ms` : err?.cause?.message || err?.message || 'Request failed';
    return { ok: false, status: 0, data: { ok: false, error } };
  }
}

function countFigmaNodes(figma) {
  const roots = [];
  if (figma?.document) roots.push(figma.document);
  for (const entry of Object.values(figma?.nodes || {})) {
    if (entry?.document) roots.push(entry.document);
  }
  let count = 0;
  const stack = [...roots];
  while (stack.length) {
    const node = stack.pop();
    count += 1;
    if (Array.isArray(node?.children)) stack.push(...node.children);
  }
  return count;
}

function isLocalhost(base) {
  try {
    return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname);
  } catch {
    return false;
  }
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
          topic: {
            type: 'string',
            enum: KNOWLEDGE_TOPICS,
            description: 'Optional topic filter (default: all)'
          }
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
      description:
        'Fetch a Figma file (or one node) via the BluePainter API. Needs a Figma personal access token: pass `token` or set FIGMA_TOKEN in the MCP server env. Returns a summary plus JSON truncated to ~20k chars.',
      inputSchema: {
        type: 'object',
        properties: {
          fileUrl: { type: 'string', description: 'Figma file URL or file key' },
          nodeUrl: { type: 'string', description: 'Optional Figma URL with node-id (or a node id like 1:2) to import one node' },
          token: { type: 'string', description: 'Figma personal access token (defaults to FIGMA_TOKEN env)' },
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
    const topic = String(args.topic ?? 'all').toLowerCase().trim();
    if (!KNOWLEDGE_TOPICS.includes(topic)) {
      return textResult({ ok: false, error: `Unknown topic "${topic}". Use one of: ${KNOWLEDGE_TOPICS.join(', ')}.` }, true);
    }
    let out = knowledge;
    if (topic === 'pricing') out = knowledge.pricing || knowledge;
    if (topic === 'services') out = knowledge.services || knowledge;
    if (topic === 'faq') out = knowledge.faq || knowledge;
    return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] };
  }

  if (name === 'bluepainter_request_pilot') {
    const email = String(args.email ?? '').trim().toLowerCase();
    if (!isEmail(email)) {
      return textResult({ ok: false, error: 'A valid email is required.' }, true);
    }
    const { ok, status, data } = await postJson(WAITLIST_URL, {
      email,
      name: args.name || '',
      company: args.company || '',
      message: args.message || '',
      source: 'mcp-pilot'
    });
    return textResult(ok ? data : { ok: false, status, ...data }, !ok);
  }

  if (name === 'bluepainter_figma_import') {
    const customBase = typeof args.apiBase === 'string' && args.apiBase.trim() ? args.apiBase.trim().replace(/\/+$/, '') : null;
    const base = customBase || API_BASE;
    if (!/^https?:\/\//i.test(base)) {
      return textResult({ ok: false, error: 'apiBase must be an http(s) URL.' }, true);
    }
    if (typeof args.fileUrl !== 'string' || !args.fileUrl.trim()) {
      return textResult({ ok: false, error: 'fileUrl is required.' }, true);
    }
    // The env token is only sent to the configured API host (or localhost), so a
    // caller-supplied apiBase can't be used to exfiltrate it.
    const envTokenAllowed = !customBase || customBase === API_BASE || isLocalhost(customBase);
    const token = String(args.token || (envTokenAllowed ? process.env.FIGMA_TOKEN : '') || '').trim();
    if (!token) {
      return textResult(
        {
          ok: false,
          error: envTokenAllowed
            ? 'Figma personal access token required: pass `token` or set FIGMA_TOKEN in the MCP server env.'
            : 'Pass `token` explicitly when using a custom apiBase (FIGMA_TOKEN from env is only sent to the default API host).'
        },
        true
      );
    }

    const body = { token, fileUrl: args.fileUrl.trim() };
    if (typeof args.nodeUrl === 'string' && args.nodeUrl.trim()) body.nodeUrl = args.nodeUrl.trim();
    const { ok, status, data } = await postJson(`${base}/api/figma-import`, body);
    if (!ok) return textResult({ ok: false, status, ...data }, true);

    const json = JSON.stringify(data.figma ?? data, null, 2);
    const truncated = json.length > MAX_FIGMA_JSON_CHARS;
    const summary = {
      ok: true,
      fileKey: data.fileKey ?? null,
      fileName: data.fileName ?? null,
      nodeId: data.nodeId ?? null,
      nodeCount: countFigmaNodes(data.figma),
      jsonChars: json.length,
      truncated
    };
    return {
      content: [
        { type: 'text', text: JSON.stringify(summary, null, 2) },
        {
          type: 'text',
          text: truncated
            ? `${json.slice(0, MAX_FIGMA_JSON_CHARS)}\n… [truncated ${json.length - MAX_FIGMA_JSON_CHARS} of ${json.length} chars — pass nodeUrl to import a single node]`
            : json
        }
      ]
    };
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
