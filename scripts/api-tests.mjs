/**
 * API route checks for the Vercel serverless functions in api/ (and the site/api copy).
 * No network: globalThis.fetch is mocked and handlers get fake req/res objects.
 * Run: npm run test:api   (plain `node scripts/api-tests.mjs`)
 */
import assert from 'assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { isAllowedOrigin, checkRateLimit, readJsonBody, resetRateLimits } from '../api/_lib/http.js';
import generate from '../api/generate.js';
import waitlist from '../api/waitlist.js';
import siteWaitlist from '../site/api/waitlist.js';
import feedback from '../api/feedback.js';
import githubPush from '../api/github-push.js';
import figmaImport from '../api/figma-import.js';
import vercelDeploy from '../api/vercel-deploy.js';

const STUDIO = 'https://bluepainter-studio.vercel.app';
const ENV_KEYS = [
  'ALLOWED_ORIGINS', 'OPENAI_API_KEY', 'WAITLIST_WEBHOOK', 'RESEND_WEBHOOK', 'FEEDBACK_WEBHOOK',
  'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'VERCEL_ENV'
];

const realFetch = globalThis.fetch;
const realWarn = console.warn;
const realError = console.error;
let calls = [];

/** Fresh env, limiter and fetch mock for every test. Unmocked fetches fail loudly. */
function reset() {
  ENV_KEYS.forEach((k) => delete process.env[k]);
  resetRateLimits();
  calls = [];
  mockFetch(() => {
    throw new Error('unexpected fetch');
  });
}

function jsonResponse(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data))
  };
}

/** route(url, init) returns [status, data] (or a response object); every call is recorded. */
function mockFetch(route) {
  globalThis.fetch = async (url, init = {}) => {
    const call = {
      url: String(url),
      method: init.method || 'GET',
      headers: init.headers || {},
      body: typeof init.body === 'string' ? JSON.parse(init.body) : init.body
    };
    calls.push(call);
    const out = await route(call);
    return Array.isArray(out) ? jsonResponse(out[0], out[1]) : out;
  };
}

function makeReq({ method = 'POST', origin, headers = {}, body, ip = '203.0.113.7' } = {}) {
  return {
    method,
    headers: {
      host: 'bluepainter-studio.vercel.app',
      'x-forwarded-for': ip,
      ...(origin ? { origin } : {}),
      ...headers
    },
    body
  };
}

function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    ended: false,
    setHeader(name, value) {
      res.headers[name.toLowerCase()] = value;
      return res;
    },
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      res.ended = true;
      return res;
    },
    end() {
      res.ended = true;
      return res;
    }
  };
  return res;
}

async function call(handler, reqOptions) {
  const res = makeRes();
  await handler(makeReq(reqOptions), res);
  assert.ok(res.ended, 'handler must send a response');
  return res;
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

/* ---------- CORS ---------- */

test('CORS: allow-list matching', () => {
  assert.equal(isAllowedOrigin(STUDIO), true);
  assert.equal(isAllowedOrigin('https://bluepainter-launch.vercel.app'), true);
  assert.equal(isAllowedOrigin('http://localhost:5173'), true);
  assert.equal(isAllowedOrigin('http://127.0.0.1:3000'), true);
  assert.equal(isAllowedOrigin('https://bluepainter-git-feature-acme.vercel.app'), true, 'project preview URL');
  assert.equal(isAllowedOrigin('https://evil.example'), false);
  assert.equal(isAllowedOrigin('https://evil-bluepainter.vercel.app'), false, 'must START with bluepainter');
  assert.equal(isAllowedOrigin('https://bluepainter.vercel.app.evil.example'), false);
  assert.equal(isAllowedOrigin('http://bluepainter-studio.vercel.app'), false, 'https only for vercel.app');
  assert.equal(isAllowedOrigin('http://localhost.evil.example'), false);
  assert.equal(isAllowedOrigin('null'), false);

  process.env.ALLOWED_ORIGINS = 'https://bluepainter.dev, https://app.example.com/';
  assert.equal(isAllowedOrigin('https://bluepainter.dev'), true);
  assert.equal(isAllowedOrigin('https://app.example.com'), true);
});

test('CORS: allowed origin is echoed (never *), with Vary: Origin', async () => {
  const res = await call(figmaImport, { origin: STUDIO, body: {} });
  assert.equal(res.headers['access-control-allow-origin'], STUDIO);
  assert.equal(res.headers.vary, 'Origin');
  assert.equal(res.statusCode, 400, 'reaches validation');

  const pre = await call(generate, { method: 'OPTIONS', origin: 'http://localhost:5173' });
  assert.equal(pre.statusCode, 200);
  assert.equal(pre.headers['access-control-allow-origin'], 'http://localhost:5173');
  assert.match(pre.headers['access-control-allow-headers'], /X-OpenAI-Key/);
});

test('CORS: disallowed origin gets 403 on every token-bearing/paid endpoint', async () => {
  process.env.OPENAI_API_KEY = 'sk-server';
  for (const handler of [generate, githubPush, vercelDeploy, figmaImport]) {
    const res = await call(handler, { origin: 'https://evil.example', body: { prompt: 'hi', token: 't' } });
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, 'Origin not allowed');
    assert.equal(res.headers['access-control-allow-origin'], undefined);
    assert.equal(res.headers.vary, 'Origin');
  }
  assert.equal(calls.length, 0, 'nothing upstream may be called');
});

test('CORS: no Origin header (server-to-server, MCP, curl) stays allowed', async () => {
  const res = await call(figmaImport, { body: {} });
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Figma personal access token is required');
  assert.equal(res.headers['access-control-allow-origin'], undefined);
});

test('CORS: same-origin POST from a custom domain is allowed', async () => {
  const res = await call(figmaImport, {
    origin: 'https://studio.custom.example',
    headers: { host: 'studio.custom.example' },
    body: {}
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.headers['access-control-allow-origin'], 'https://studio.custom.example');
});

test('CORS: waitlist is callable from the allow-list; other origins get no CORS header', async () => {
  const ok = await call(waitlist, { method: 'OPTIONS', origin: 'https://bluepainter-launch.vercel.app' });
  assert.equal(ok.statusCode, 204);
  assert.equal(ok.headers['access-control-allow-origin'], 'https://bluepainter-launch.vercel.app');

  const bad = await call(waitlist, { method: 'OPTIONS', origin: 'https://evil.example' });
  assert.equal(bad.statusCode, 403);
  assert.equal(bad.headers['access-control-allow-origin'], undefined);
});

test('method gate: non-POST is 405', async () => {
  assert.equal((await call(generate, { method: 'GET' })).statusCode, 405);
  const res = await call(waitlist, { method: 'GET' });
  assert.equal(res.statusCode, 405);
  assert.deepStrictEqual(res.body, { ok: false, error: 'Method not allowed' });
});

/* ---------- body parsing ---------- */

test('readJsonBody: objects, strings, empty and malformed input', () => {
  assert.deepStrictEqual(readJsonBody({ body: { a: 1 } }), { ok: true, body: { a: 1 } });
  assert.deepStrictEqual(readJsonBody({ body: '{"a":1}' }), { ok: true, body: { a: 1 } });
  assert.deepStrictEqual(readJsonBody({ body: Buffer.from('{"a":1}') }), { ok: true, body: { a: 1 } });
  assert.deepStrictEqual(readJsonBody({}), { ok: true, body: {} });
  assert.equal(readJsonBody({ body: '{nope' }).ok, false);
  assert.equal(readJsonBody({ body: '[1,2]' }).ok, false);
  assert.equal(readJsonBody({ body: '"text"' }).ok, false);
  const throwing = {};
  Object.defineProperty(throwing, 'body', {
    get() {
      throw new Error('Invalid JSON');
    }
  });
  assert.equal(readJsonBody(throwing).ok, false);
});

test('bad JSON body is a 400 on every route', async () => {
  for (const handler of [generate, githubPush, vercelDeploy, figmaImport, waitlist, feedback]) {
    const res = await call(handler, { body: '{not json' });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Invalid JSON body');
  }
});

/* ---------- rate limiting ---------- */

test('rate limit: in-memory limiter trips exactly at the limit, per IP and per route', async () => {
  const req = makeReq({ ip: '198.51.100.1' });
  for (let i = 0; i < 3; i += 1) {
    assert.equal((await checkRateLimit(req, { name: 't', limit: 3, windowMs: 60000 })).allowed, true, `hit ${i + 1}`);
  }
  const blocked = await checkRateLimit(req, { name: 't', limit: 3, windowMs: 60000 });
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfter >= 1 && blocked.retryAfter <= 60);

  const other = makeReq({ ip: '198.51.100.2' });
  assert.equal((await checkRateLimit(other, { name: 't', limit: 3, windowMs: 60000 })).allowed, true, 'other IP unaffected');
  assert.equal((await checkRateLimit(req, { name: 'u', limit: 3, windowMs: 60000 })).allowed, true, 'other route unaffected');
});

test('rate limit: window slides — old hits expire', async () => {
  const req = makeReq({ ip: '198.51.100.3' });
  const realNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;
  try {
    assert.equal((await checkRateLimit(req, { name: 's', limit: 1, windowMs: 1000 })).allowed, true);
    assert.equal((await checkRateLimit(req, { name: 's', limit: 1, windowMs: 1000 })).allowed, false);
    now += 1001;
    assert.equal((await checkRateLimit(req, { name: 's', limit: 1, windowMs: 1000 })).allowed, true);
  } finally {
    Date.now = realNow;
  }
});

test('rate limit: Upstash backing uses INCR + EXPIRE and falls back to memory on failure', async () => {
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'upstash-token';
  let count = 0;
  mockFetch(() => {
    count += 1;
    return [200, [{ result: count }, { result: 1 }]];
  });
  const req = makeReq({ ip: '198.51.100.4' });
  assert.equal((await checkRateLimit(req, { name: 'r', limit: 1 })).allowed, true);
  const blocked = await checkRateLimit(req, { name: 'r', limit: 1 });
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfter >= 1 && blocked.retryAfter <= 3600);

  assert.equal(calls[0].url, 'https://redis.example/pipeline');
  assert.equal(calls[0].headers.Authorization, 'Bearer upstash-token');
  assert.equal(calls[0].body[0][0], 'INCR');
  assert.match(calls[0].body[0][1], /^bluepainter:rl:r:198\.51\.100\.4:\d+$/);
  assert.deepStrictEqual(calls[0].body[1], ['EXPIRE', calls[0].body[0][1], 3600]);

  mockFetch(() => [500, 'down']);
  assert.equal((await checkRateLimit(req, { name: 'r2', limit: 1 })).allowed, true);
  assert.equal((await checkRateLimit(req, { name: 'r2', limit: 1 })).allowed, false, 'memory fallback still limits');
});

/* ---------- generate ---------- */

const openAIOk = (content) => [200, { choices: [{ message: { content } }] }];
const goodContent = JSON.stringify({ message: 'Done', updates: [{ fileId: 'hero', nodeId: 'hero-title', text: 'Hi' }] });

test('generate: missing prompt → 400', async () => {
  process.env.OPENAI_API_KEY = 'sk-server';
  for (const body of [{}, { prompt: '   ' }, { prompt: 42 }]) {
    const res = await call(generate, { body });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Prompt is required');
  }
  assert.equal(calls.length, 0);
});

test('generate: oversize prompt → 400, oversize context → 413', async () => {
  process.env.OPENAI_API_KEY = 'sk-server';
  const long = await call(generate, { body: { prompt: 'x'.repeat(4001) } });
  assert.equal(long.statusCode, 400);
  assert.match(long.body.error, /too long/i);
  const big = await call(generate, { body: { prompt: 'ok', context: { blob: 'x'.repeat(20001) } } });
  assert.equal(big.statusCode, 413);
  assert.equal(calls.length, 0);
});

test('generate: no key anywhere → 503 NO_KEY', async () => {
  const res = await call(generate, { body: { prompt: 'hello' } });
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, 'NO_KEY');
});

test('generate: success contract, server key used when caller sends none', async () => {
  process.env.OPENAI_API_KEY = 'sk-server';
  mockFetch(() => openAIOk(goodContent));
  const res = await call(generate, { origin: STUDIO, body: { type: 'hero', prompt: 'Punchier headline' } });
  assert.equal(res.statusCode, 200);
  assert.deepStrictEqual(res.body, {
    message: 'Done',
    updates: [{ fileId: 'hero', nodeId: 'hero-title', text: 'Hi' }],
    source: 'openai'
  });
  assert.equal(calls[0].url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(calls[0].headers.Authorization, 'Bearer sk-server');
});

test('generate: caller key is preferred over the server key', async () => {
  process.env.OPENAI_API_KEY = 'sk-server';
  mockFetch(() => openAIOk(goodContent));
  const res = await call(generate, { headers: { 'x-openai-key': '  sk-caller  ' }, body: { prompt: 'hello' } });
  assert.equal(res.statusCode, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.Authorization, 'Bearer sk-caller');
});

test('generate: upstream 401 → friendly 502 (429 likewise)', async () => {
  process.env.OPENAI_API_KEY = 'sk-server';
  mockFetch(() => [401, { error: { message: 'Incorrect API key provided: sk-ser***' } }]);
  const res = await call(generate, { body: { prompt: 'hello' } });
  assert.equal(res.statusCode, 502);
  assert.deepStrictEqual(res.body, { error: 'OpenAI rejected the API key' });

  mockFetch(() => [429, { error: { message: 'quota' } }]);
  const limited = await call(generate, { body: { prompt: 'hello' } });
  assert.equal(limited.statusCode, 502);
  assert.match(limited.body.error, /rate limit or quota/);
});

test('generate: malformed model JSON → 502, wrong shape → 502', async () => {
  process.env.OPENAI_API_KEY = 'sk-server';
  mockFetch(() => openAIOk('Sure! Here is your JSON: {oops'));
  const res = await call(generate, { body: { prompt: 'hello' } });
  assert.equal(res.statusCode, 502);
  assert.match(res.body.error, /unreadable/);

  mockFetch(() => openAIOk(JSON.stringify({ message: 'no updates' })));
  const shape = await call(generate, { body: { prompt: 'hello' } });
  assert.equal(shape.statusCode, 502);
  assert.equal(shape.body.error, 'Invalid AI response shape');
});

test('generate: server key is limited to 20/hour per IP; caller keys are not', async () => {
  process.env.OPENAI_API_KEY = 'sk-server';
  mockFetch(() => openAIOk(goodContent));
  for (let i = 0; i < 20; i += 1) {
    const res = await call(generate, { ip: '192.0.2.10', body: { prompt: 'hello' } });
    assert.equal(res.statusCode, 200, `request ${i + 1}`);
  }
  const blocked = await call(generate, { ip: '192.0.2.10', body: { prompt: 'hello' } });
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.body.code, 'RATE_LIMITED');
  assert.match(blocked.body.error, /Too many requests/);
  assert.ok(Number(blocked.headers['retry-after']) >= 1);
  assert.equal(calls.length, 20, 'the 21st request must not reach OpenAI');

  const byo = await call(generate, { ip: '192.0.2.10', headers: { 'x-openai-key': 'sk-caller' }, body: { prompt: 'hello' } });
  assert.equal(byo.statusCode, 200, 'bring-your-own-key is not throttled');
  const otherIp = await call(generate, { ip: '192.0.2.11', body: { prompt: 'hello' } });
  assert.equal(otherIp.statusCode, 200);
});

/* ---------- waitlist (root and site copies must behave identically) ---------- */

const readText = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

test('site/api is a byte-identical copy of the shared waitlist code', () => {
  for (const file of ['waitlist.js', '_lib/http.js', '_lib/store.js']) {
    assert.equal(readText(`../site/api/${file}`), readText(`../api/${file}`), `site/api/${file} drifted from api/${file}`);
  }
});

for (const [label, handler] of [['api', waitlist], ['site/api', siteWaitlist]]) {
  test(`waitlist (${label}): invalid email → 400`, async () => {
    process.env.WAITLIST_WEBHOOK = 'https://hooks.example/waitlist';
    for (const email of ['', 'nope', 'a@b', `${'x'.repeat(250)}@example.com`]) {
      const res = await call(handler, { body: { email } });
      assert.equal(res.statusCode, 400);
      assert.deepStrictEqual(res.body, { ok: false, error: 'Valid email required' });
    }
    assert.equal(calls.length, 0);
  });

  test(`waitlist (${label}): honeypot returns 200 without storing`, async () => {
    process.env.WAITLIST_WEBHOOK = 'https://hooks.example/waitlist';
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'upstash-token';
    mockFetch(({ url }) => (url.endsWith('/pipeline') ? [200, [{ result: 1 }, { result: 1 }]] : [200, {}]));
    const res = await call(handler, { body: { email: 'bot@example.com', website: 'https://spam.example' } });
    assert.equal(res.statusCode, 200);
    assert.deepStrictEqual(res.body, { ok: true });
    assert.ok(!calls.some((c) => c.url === 'https://hooks.example/waitlist'), 'webhook must not be called');
    assert.ok(!calls.some((c) => JSON.stringify(c.body).includes('LPUSH')), 'nothing may be stored');
  });

  test(`waitlist (${label}): webhook receives the capped entry`, async () => {
    process.env.WAITLIST_WEBHOOK = 'https://hooks.example/waitlist';
    mockFetch(() => [200, {}]);
    const res = await call(handler, {
      origin: 'https://bluepainter-launch.vercel.app',
      body: { email: '  Ada@Example.COM ', source: 'pilot', name: 'n'.repeat(500), website: '' }
    });
    assert.equal(res.statusCode, 200);
    assert.deepStrictEqual(res.body, { ok: true });
    assert.equal(res.headers['access-control-allow-origin'], 'https://bluepainter-launch.vercel.app');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://hooks.example/waitlist');
    assert.equal(calls[0].body.email, 'ada@example.com');
    assert.equal(calls[0].body.source, 'pilot');
    assert.equal(calls[0].body.name.length, 120);
    assert.equal('website' in calls[0].body, false);
  });

  test(`waitlist (${label}): webhook failure → 502`, async () => {
    process.env.RESEND_WEBHOOK = 'https://hooks.example/resend';
    mockFetch(() => [500, 'boom']);
    const res = await call(handler, { body: { email: 'ada@example.com' } });
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.ok, false);
    assert.match(res.body.error, /Could not save/);

    mockFetch(() => {
      throw new Error('ECONNRESET');
    });
    const thrown = await call(handler, { ip: '203.0.113.8', body: { email: 'ada@example.com' } });
    assert.equal(thrown.statusCode, 502);
  });

  test(`waitlist (${label}): production with no store → 503; elsewhere accepted in memory`, async () => {
    process.env.VERCEL_ENV = 'production';
    const prod = await call(handler, { body: { email: 'ada@example.com' } });
    assert.equal(prod.statusCode, 503);
    assert.deepStrictEqual(prod.body, { ok: false, error: 'Signups are not configured yet — please email us' });

    for (const env of ['preview', undefined]) {
      if (env) process.env.VERCEL_ENV = env;
      else delete process.env.VERCEL_ENV;
      const dev = await call(handler, { body: { email: 'ada@example.com' } });
      assert.equal(dev.statusCode, 200);
      assert.deepStrictEqual(dev.body, { ok: true });
    }
    assert.equal(calls.length, 0);
  });

  test(`waitlist (${label}): Upstash path issues an LPUSH to bluepainter:waitlist`, async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example/';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'upstash-token';
    mockFetch(() => [200, [{ result: 1 }, { result: 1 }]]);
    const res = await call(handler, { body: { email: 'ada@example.com', company: 'Acme' } });
    assert.equal(res.statusCode, 200);
    assert.deepStrictEqual(res.body, { ok: true });

    const push = calls.find((c) => c.body?.[0]?.[0] === 'LPUSH');
    assert.ok(push, 'LPUSH issued');
    assert.equal(push.url, 'https://redis.example/pipeline');
    assert.equal(push.headers.Authorization, 'Bearer upstash-token');
    assert.equal(push.body[0][1], 'bluepainter:waitlist');
    const stored = JSON.parse(push.body[0][2]);
    assert.equal(stored.email, 'ada@example.com');
    assert.equal(stored.company, 'Acme');
    assert.ok(!Number.isNaN(Date.parse(stored.createdAt)));
  });

  test(`waitlist (${label}): one durable store succeeding is enough; both failing → 502`, async () => {
    process.env.WAITLIST_WEBHOOK = 'https://hooks.example/waitlist';
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'upstash-token';
    const isPush = (c) => c.body?.[0]?.[0] === 'LPUSH';
    mockFetch((c) => {
      if (c.url === 'https://hooks.example/waitlist') return [500, 'down'];
      return isPush(c) ? [200, [{ result: 1 }]] : [200, [{ result: 1 }, { result: 1 }]];
    });
    assert.equal((await call(handler, { body: { email: 'ada@example.com' } })).statusCode, 200);

    mockFetch((c) => {
      if (c.url === 'https://hooks.example/waitlist') return [500, 'down'];
      return isPush(c) ? [200, [{ error: 'ERR max memory' }]] : [200, [{ result: 1 }, { result: 1 }]];
    });
    assert.equal((await call(handler, { body: { email: 'ada@example.com' } })).statusCode, 502);
  });

  test(`waitlist (${label}): 10/hour per IP, then 429 with Retry-After`, async () => {
    for (let i = 0; i < 10; i += 1) {
      assert.equal((await call(handler, { ip: '192.0.2.20', body: { email: 'ada@example.com' } })).statusCode, 200);
    }
    const blocked = await call(handler, { ip: '192.0.2.20', body: { email: 'ada@example.com' } });
    assert.equal(blocked.statusCode, 429);
    assert.equal(blocked.body.ok, false);
    assert.match(blocked.body.error, /Too many requests/);
    assert.ok(Number(blocked.headers['retry-after']) >= 1);
  });
}

/* ---------- feedback ---------- */

test('feedback: validates, caps and stores via Upstash (bluepainter:feedback)', async () => {
  process.env.VERCEL_ENV = 'production';
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'upstash-token';
  mockFetch(() => [200, [{ result: 1 }, { result: 1 }]]);
  const res = await call(feedback, {
    origin: STUDIO,
    body: {
      interest: 'very',
      pilot: 'maybe',
      role: 'hacker',
      comment: 'c'.repeat(5000),
      timestamp: '2026-01-02T03:04:05.000Z',
      extra: 'dropped'
    }
  });
  assert.equal(res.statusCode, 200);
  assert.deepStrictEqual(res.body, { ok: true });
  assert.equal(res.headers['access-control-allow-origin'], STUDIO);

  const push = calls.find((c) => c.body?.[0]?.[0] === 'LPUSH');
  assert.ok(push, 'LPUSH issued');
  assert.equal(push.body[0][1], 'bluepainter:feedback');
  const stored = JSON.parse(push.body[0][2]);
  assert.equal(stored.kind, 'feedback');
  assert.equal(stored.interest, 'very');
  assert.equal(stored.pilot, 'maybe');
  assert.equal(stored.role, '', 'unknown enum values are dropped');
  assert.equal(stored.comment.length, 2000);
  assert.equal(stored.timestamp, '2026-01-02T03:04:05.000Z');
  assert.equal('extra' in stored, false);
});

test('feedback: FEEDBACK_WEBHOOK preferred, falls back to WAITLIST_WEBHOOK', async () => {
  process.env.WAITLIST_WEBHOOK = 'https://hooks.example/waitlist';
  mockFetch(() => [200, {}]);
  assert.equal((await call(feedback, { body: { interest: 'somewhat' } })).statusCode, 200);
  assert.equal(calls[0].url, 'https://hooks.example/waitlist');
  assert.equal(calls[0].body.kind, 'feedback');

  process.env.FEEDBACK_WEBHOOK = 'https://hooks.example/feedback';
  assert.equal((await call(feedback, { body: { interest: 'not' } })).statusCode, 200);
  assert.equal(calls[1].url, 'https://hooks.example/feedback');
  assert.equal(calls.length, 2);
});

test('feedback: invalid interest → 400; honeypot → 200 unsaved; prod with no store → 503; store failure → 502', async () => {
  process.env.FEEDBACK_WEBHOOK = 'https://hooks.example/feedback';
  const bad = await call(feedback, { body: { interest: 'meh' } });
  assert.equal(bad.statusCode, 400);
  assert.equal(bad.body.ok, false);

  const bot = await call(feedback, { body: { interest: 'very', website: 'x' } });
  assert.equal(bot.statusCode, 200);
  assert.equal(calls.length, 0);

  mockFetch(() => [500, 'down']);
  assert.equal((await call(feedback, { body: { interest: 'very' } })).statusCode, 502);

  delete process.env.FEEDBACK_WEBHOOK;
  process.env.VERCEL_ENV = 'production';
  assert.equal((await call(feedback, { body: { interest: 'very' } })).statusCode, 503);
  delete process.env.VERCEL_ENV;
  assert.equal((await call(feedback, { body: { interest: 'very' } })).statusCode, 200, 'local dev keeps working');
});

/* ---------- github-push ---------- */

/** Minimal GitHub API double. `repoExists` controls GET /repos/:owner/:repo. */
function mockGithub({ login = 'octo', createStatus = 201, repoExists = true, defaultBranch = 'main' } = {}) {
  mockFetch(({ url, method }) => {
    const path = url.replace('https://api.github.com', '');
    if (path === '/user') return [200, { login }];
    if (method === 'POST' && (path === '/user/repos' || /^\/orgs\/[^/]+\/repos$/.test(path))) {
      return createStatus === 422
        ? [422, { message: 'Repository creation failed.', errors: [{ message: 'name already exists on this account' }] }]
        : [createStatus, { name: 'created' }];
    }
    if (method === 'GET' && /^\/repos\/[^/]+\/[^/]+$/.test(path)) {
      return repoExists ? [200, { default_branch: defaultBranch }] : [404, { message: 'Not Found' }];
    }
    if (method === 'GET' && path.includes('/git/ref/heads/')) return [200, { object: { sha: 'parent-sha' } }];
    if (method === 'POST' && path.endsWith('/git/blobs')) return [201, { sha: 'blob-sha' }];
    if (method === 'GET' && path.endsWith('/git/commits/parent-sha')) return [200, { tree: { sha: 'base-tree-sha' } }];
    if (method === 'POST' && path.endsWith('/git/trees')) return [201, { sha: 'tree-sha' }];
    if (method === 'POST' && path.endsWith('/git/commits')) return [201, { sha: 'commit-sha' }];
    if (method === 'PATCH' && path.includes('/git/refs/heads/')) return [200, { ref: 'ok' }];
    throw new Error(`unexpected GitHub call ${method} ${path}`);
  });
}

const githubCall = (method, suffix) => calls.find((c) => c.method === method && c.url.endsWith(suffix));

test('github-push: validation 400s', async () => {
  assert.equal((await call(githubPush, { body: {} })).body.error, 'GitHub token is required');
  assert.equal((await call(githubPush, { body: { token: 't' } })).body.error, 'Repository name is required');
  const res = await call(githubPush, { body: { token: 't', repoName: 'r', files: {} } });
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'No files to push');
  assert.equal(calls.length, 0);
});

test('github-push: new repo — created with auto_init, default branch read, blobs/tree/commit then ref PATCH', async () => {
  mockGithub({ defaultBranch: 'main' });
  const res = await call(githubPush, {
    origin: STUDIO,
    body: { token: ' ghp_test ', repoName: 'My Site!', files: { 'index.html': '<h1>hi</h1>', 'src/App.tsx': 'export {}' } }
  });
  assert.equal(res.statusCode, 200);
  assert.deepStrictEqual(res.body, {
    repoUrl: 'https://github.com/octo/My-Site-',
    owner: 'octo',
    repo: 'My-Site-',
    branch: 'main',
    commitSha: 'commit-sha',
    fileCount: 2
  });

  const create = githubCall('POST', '/user/repos');
  assert.deepStrictEqual(create.body, { name: 'My-Site-', private: true, auto_init: true });
  assert.equal(create.headers.Authorization, 'Bearer ghp_test');

  const order = calls.map((c) => `${c.method} ${c.url.replace('https://api.github.com', '')}`);
  const at = (entry) => {
    const i = order.indexOf(entry);
    assert.ok(i >= 0, `${entry} was called`);
    return i;
  };
  const repoRead = at('GET /repos/octo/My-Site-');
  const refRead = at('GET /repos/octo/My-Site-/git/ref/heads/main');
  const blob = at('POST /repos/octo/My-Site-/git/blobs');
  const tree = at('POST /repos/octo/My-Site-/git/trees');
  const commit = at('POST /repos/octo/My-Site-/git/commits');
  const patch = at('PATCH /repos/octo/My-Site-/git/refs/heads/main');
  assert.ok(at('POST /user/repos') < repoRead && repoRead < refRead && refRead < blob && blob < tree && tree < commit && commit < patch);
  assert.equal(order.filter((o) => o.endsWith('/git/blobs')).length, 2);

  assert.equal(githubCall('POST', '/git/trees').body.base_tree, 'base-tree-sha');
  assert.deepStrictEqual(githubCall('POST', '/git/trees').body.tree.map((t) => t.path), ['index.html', 'src/App.tsx']);
  assert.deepStrictEqual(githubCall('POST', '/git/commits').body, {
    message: 'Deploy from BluePainter',
    tree: 'tree-sha',
    parents: ['parent-sha']
  });
  assert.deepStrictEqual(githubCall('PATCH', '/git/refs/heads/main').body, { sha: 'commit-sha', force: false });
  assert.ok(!calls.some((c) => c.method === 'POST' && c.url.endsWith('/git/refs')), 'must not create a second branch');
});

test('github-push: existing repo (422) with default branch master pushes to master', async () => {
  mockGithub({ createStatus: 422, repoExists: true, defaultBranch: 'master' });
  const res = await call(githubPush, {
    body: { token: 'ghp_test', repoName: 'legacy', files: { 'a.txt': 'a' }, message: 'Update', owner: 'acme', isPrivate: false }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.branch, 'master');
  assert.equal(res.body.repoUrl, 'https://github.com/acme/legacy');

  const create = githubCall('POST', '/orgs/acme/repos');
  assert.ok(create, 'org endpoint used for a foreign owner');
  assert.equal(create.body.private, false);
  assert.ok(githubCall('GET', '/repos/acme/legacy/git/ref/heads/master'));
  assert.ok(githubCall('PATCH', '/repos/acme/legacy/git/refs/heads/master'));
  assert.ok(!calls.some((c) => c.url.includes('heads/main')), 'never touches main');
  assert.equal(githubCall('POST', '/git/commits').body.message, 'Update');
});

test('github-push: 422 for a genuinely invalid name errors out without pushing', async () => {
  mockGithub({ createStatus: 422, repoExists: false });
  const res = await call(githubPush, { body: { token: 'ghp_test', repoName: '...', files: { 'a.txt': 'a' } } });
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error, 'name already exists on this account');
  assert.ok(!calls.some((c) => c.url.includes('/git/')), 'no git data calls after a failed create');
});

test('github-push: bad token → error, nothing created', async () => {
  mockFetch(() => [401, { message: 'Bad credentials' }]);
  const res = await call(githubPush, { body: { token: 'nope', repoName: 'r', files: { 'a.txt': 'a' } } });
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error, 'Invalid GitHub token');
  assert.equal(calls.length, 1);
});

/* ---------- figma-import ---------- */

test('figma-import: missing token → 400, bad file key → 400', async () => {
  const noToken = await call(figmaImport, { body: { fileUrl: 'https://www.figma.com/design/abcDEF123456/My-File' } });
  assert.equal(noToken.statusCode, 400);
  assert.equal(noToken.body.error, 'Figma personal access token is required');

  const noFile = await call(figmaImport, { body: { token: 'figd_x', fileUrl: '' } });
  assert.equal(noFile.statusCode, 400);
  assert.equal(noFile.body.error, 'Invalid Figma file URL or key');
  assert.equal(calls.length, 0);
});

test('figma-import: token forwarded only to api.figma.com; upstream error → 502', async () => {
  mockFetch(() => [200, { name: 'My File', document: {} }]);
  const res = await call(figmaImport, {
    body: { token: ' figd_x ', fileUrl: 'https://www.figma.com/design/abcDEF123456/My-File' }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.fileKey, 'abcDEF123456');
  assert.equal(res.body.fileName, 'My File');
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.startsWith('https://api.figma.com/v1/files/abcDEF123456'));
  assert.equal(calls[0].headers['X-Figma-Token'], 'figd_x');

  mockFetch(() => [403, 'Forbidden']);
  const denied = await call(figmaImport, {
    body: { token: 'figd_x', fileUrl: 'https://www.figma.com/design/abcDEF123456/My-File' }
  });
  assert.equal(denied.statusCode, 502);
  assert.equal(denied.body.error, 'Figma API error');
});

/* ---------- vercel-deploy ---------- */

test('vercel-deploy: validation 400s and success contract', async () => {
  assert.equal((await call(vercelDeploy, { body: {} })).body.error, 'Vercel token is required');
  assert.equal((await call(vercelDeploy, { body: { token: 't', projectName: 'p' } })).statusCode, 400);

  mockFetch(() => [200, { id: 'dpl_1', url: 'my-site.vercel.app', readyState: 'QUEUED' }]);
  const res = await call(vercelDeploy, {
    origin: STUDIO,
    body: { token: 'vc_test', projectName: 'My Site', files: { 'index.html': '<h1>hi</h1>' }, teamId: 'team 1', staticSite: true }
  });
  assert.equal(res.statusCode, 200);
  assert.deepStrictEqual(res.body, {
    deploymentId: 'dpl_1',
    deploymentUrl: 'https://my-site.vercel.app',
    inspectorUrl: 'https://vercel.com/deployments/dpl_1',
    projectName: 'my-site',
    readyState: 'QUEUED',
    fileCount: 1
  });
  assert.equal(calls[0].url, 'https://api.vercel.com/v13/deployments?teamId=team%201');
  assert.equal(calls[0].headers.Authorization, 'Bearer vc_test');
  assert.equal(calls[0].body.projectSettings.framework, null);
});

/* ---------- runner ---------- */

const results = [];
for (const { name, fn } of tests) {
  reset();
  // Handlers log expected failures (store down, OpenAI errors); keep the report readable.
  console.warn = () => {};
  console.error = () => {};
  let error = null;
  try {
    await fn();
  } catch (e) {
    error = e;
  }
  console.warn = realWarn;
  console.error = realError;
  if (error) {
    results.push({ name, ok: false, error: error.message });
    console.error('FAIL', name, '\n ', error.message);
  } else {
    results.push({ name, ok: true });
    console.log('PASS', name);
  }
}
globalThis.fetch = realFetch;

const failed = results.filter((r) => !r.ok);
console.log('\n=== SUMMARY ===');
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  failed.forEach((f) => console.error('-', f.name, ':', f.error));
  process.exit(1);
}
