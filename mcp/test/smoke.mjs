/**
 * Smoke test: spawn the server over stdio and speak raw JSON-RPC to it.
 * Offline — the two network tools are pointed at a closed local port and must
 * come back as tool errors rather than hang or crash.
 *
 * Run: npm test
 */
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

/** A port nothing listens on: bind an ephemeral one, then close it. */
function closedPort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

const port = await closedPort();
const deadOrigin = `http://127.0.0.1:${port}`;

const env = { ...process.env };
delete env.FIGMA_TOKEN;
Object.assign(env, {
  BLUEPAINTER_SITE_URL: 'https://site.example.test',
  BLUEPAINTER_WAITLIST_URL: `${deadOrigin}/api/waitlist`,
  BLUEPAINTER_API_BASE: deadOrigin,
  BLUEPAINTER_TIMEOUT_MS: '3000'
});

// Launch through the package's bin entry, the same file `npx bluepainter-mcp` runs.
const binPath = join(root, typeof pkg.bin === 'string' ? pkg.bin : pkg.bin['bluepainter-mcp']);
const child = spawn(process.execPath, [binPath], { env, stdio: ['pipe', 'pipe', 'pipe'] });

let stderr = '';
child.stderr.on('data', (d) => { stderr += d; });

const pending = new Map();
let buffer = '';
child.stdout.on('data', (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    const msg = JSON.parse(line); // anything that isn't JSON-RPC on stdout is a bug
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});

let nextId = 1;
function request(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${method} timed out\n${stderr}`)), 10000);
    pending.set(id, (msg) => {
      clearTimeout(timer);
      resolve(msg);
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  });
}
const notify = (method, params) => child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method, params })}\n`);

async function callTool(name, args = {}) {
  const res = await request('tools/call', { name, arguments: args });
  assert.ok(res.result, `${name}: ${JSON.stringify(res.error)}`);
  const text = res.result.content[0].text;
  let json = null;
  try { json = JSON.parse(text); } catch { /* plain text result */ }
  return { isError: Boolean(res.result.isError), text, json, content: res.result.content };
}

const checks = [];
const check = (name, fn) => checks.push({ name, fn });

check('initialize reports name and package.json version', async () => {
  const res = await request('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'bluepainter-smoke', version: '0.0.0' }
  });
  assert.strictEqual(res.result.serverInfo.name, 'bluepainter');
  assert.strictEqual(res.result.serverInfo.version, pkg.version);
  assert.ok(res.result.capabilities.tools);
  notify('notifications/initialized');
});

check('tools/list returns the six tools with input schemas', async () => {
  const res = await request('tools/list', {});
  const names = res.result.tools.map((t) => t.name).sort();
  assert.deepStrictEqual(names, [
    'bluepainter_analyze_tsx',
    'bluepainter_figma_import',
    'bluepainter_get_knowledge',
    'bluepainter_open_demo',
    'bluepainter_receipts_evaluate',
    'bluepainter_request_pilot'
  ]);
  for (const tool of res.result.tools) {
    assert.ok(tool.description, `${tool.name} has no description`);
    assert.strictEqual(tool.inputSchema.type, 'object');
  }
});

check('bluepainter_open_demo', async () => {
  const { json, isError } = await callTool('bluepainter_open_demo');
  assert.ok(!isError);
  assert.strictEqual(json.demo, 'https://bluepainter-studio.vercel.app');
  assert.strictEqual(json.site, 'https://site.example.test', 'BLUEPAINTER_SITE_URL is honoured');
  assert.strictEqual(json.pricing, 'https://site.example.test/pricing');
});

check('bluepainter_analyze_tsx', async () => {
  const source = `
    // id="commented-out"
    export function Card() {
      const id = "not-an-attr";
      return (
        <div id="card" data-id="nope">
          <h3 id={'title'}>Hi</h3>
          <button id="cta">Go</button>
          <button id="cta">Again</button>
        </div>
      );
    }`;
  const { json, isError } = await callTool('bluepainter_analyze_tsx', { source });
  assert.ok(!isError);
  assert.deepStrictEqual(json, { count: 3, ids: ['card', 'title', 'cta'] });
});

check('bluepainter_receipts_evaluate', async () => {
  const good = (await callTool('bluepainter_receipts_evaluate', { background: '#1e40af', ctaText: 'Start free trial', padding: 16 })).json;
  assert.strictEqual(good.score, 100);
  assert.ok(good.rules.every((r) => r.valid === true));

  const bad = (await callTool('bluepainter_receipts_evaluate', { background: '#fde047', ctaText: 'Submit', padding: 13 })).json;
  assert.strictEqual(bad.score, 0);
  assert.deepStrictEqual(bad.rules.map((r) => r.id), ['contrast', 'copy', 'spacing']);

  const unparseable = (await callTool('bluepainter_receipts_evaluate', { background: 'tomato-ish' })).json;
  assert.strictEqual(unparseable.rules[0].valid, null);
  assert.strictEqual(unparseable.score, 100, 'unevaluated rules do not count against the score');
});

check('bluepainter_get_knowledge', async () => {
  const all = await callTool('bluepainter_get_knowledge');
  assert.strictEqual(all.json.brand, 'BluePainter');
  const faq = await callTool('bluepainter_get_knowledge', { topic: 'faq' });
  assert.ok(Array.isArray(faq.json) && faq.json.length > 0);
  const pricing = await callTool('bluepainter_get_knowledge', { topic: 'pricing' });
  assert.ok(Array.isArray(pricing.json.plans));
  const unknown = await callTool('bluepainter_get_knowledge', { topic: 'weather' });
  assert.ok(unknown.isError);
});

check('bluepainter_request_pilot: invalid email is rejected locally', async () => {
  const { json, isError } = await callTool('bluepainter_request_pilot', { email: 'not-an-email' });
  assert.ok(isError);
  assert.match(json.error, /valid email/i);
});

check('bluepainter_request_pilot: unreachable API is a tool error', async () => {
  const { json, isError } = await callTool('bluepainter_request_pilot', { email: 'smoke@example.com' });
  assert.ok(isError);
  assert.strictEqual(json.ok, false);
  assert.strictEqual(json.status, 0);
  assert.ok(json.error);
});

check('bluepainter_figma_import: validation and unreachable API', async () => {
  const noToken = await callTool('bluepainter_figma_import', { fileUrl: 'https://www.figma.com/design/ABC123/File' });
  assert.ok(noToken.isError);
  assert.match(noToken.json.error, /token required/i);

  const badBase = await callTool('bluepainter_figma_import', { fileUrl: 'ABC123', token: 'figd_test', apiBase: 'ftp://example.test' });
  assert.ok(badBase.isError);
  assert.match(badBase.json.error, /http\(s\)/);

  const unreachable = await callTool('bluepainter_figma_import', { fileUrl: 'ABC123', token: 'figd_test' });
  assert.ok(unreachable.isError);
  assert.strictEqual(unreachable.json.status, 0);
});

check('unknown tool is a tool error', async () => {
  const { isError, text } = await callTool('bluepainter_nope');
  assert.ok(isError);
  assert.match(text, /Unknown tool/);
});

let failed = 0;
for (const { name, fn } of checks) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL ${name}\n     ${err.message}`);
  }
}

child.stdin.end();
child.kill();
console.log(`\n${checks.length - failed}/${checks.length} MCP smoke checks passed`);
process.exit(failed ? 1 : 0);
