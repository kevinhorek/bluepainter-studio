/**
 * Shared HTTP helpers for the serverless routes: CORS allow-list, per-IP rate limiting,
 * safe JSON body parsing, and a tiny Upstash Redis REST client. Plain fetch only — no deps.
 *
 * NOTE: site/api/_lib/http.js is a byte-identical copy (the marketing site deploys as its own
 * Vercel project rooted at site/ and cannot import from ../api). scripts/api-tests.mjs fails
 * if the two drift — edit this file, then copy it across.
 */

const DEFAULT_ALLOWED_ORIGINS = [
  'https://www.bluepainter.com',
  'https://bluepainter-launch.vercel.app'
];

function normalizeOrigin(value) {
  return String(value || '').trim().replace(/\/+$/, '').toLowerCase();
}

function configuredOrigins() {
  const extra = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...extra]);
}

function header(req, name) {
  const value = req?.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * True when `origin` may call the API from a browser:
 * the defaults + ALLOWED_ORIGINS, any http://localhost:* / http://127.0.0.1:*,
 * this project's Vercel URLs (https://bluepainter*.vercel.app), and — when `req` is given —
 * the deployment's own host (same-origin POSTs also carry an Origin header, e.g. on a custom domain).
 *
 * `previewWildcard: false` drops the bluepainter*.vercel.app pattern (anyone can register such a
 * name on Vercel). The OAuth routes use it: they hand a provider token to the origin.
 */
export function isAllowedOrigin(origin, req, { previewWildcard = true } = {}) {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  if (configuredOrigins().has(normalized)) return true;

  let url;
  try {
    url = new URL(normalized);
  } catch {
    return false;
  }
  const host = url.hostname;

  if (url.protocol === 'http:' && (host === 'localhost' || host === '127.0.0.1')) return true;
  if (previewWildcard && url.protocol === 'https:' && host.endsWith('.vercel.app') && host.startsWith('bluepainter')) return true;

  const ownHost = String(header(req, 'x-forwarded-host') || header(req, 'host') || '').toLowerCase();
  if (ownHost && url.host === ownHost) return true;

  return false;
}

/**
 * Sets CORS headers. Echoes the matched origin (never `*`) and always sets `Vary: Origin`.
 * Returns { origin, allowed } — a request with no Origin header (server-to-server, the MCP
 * server, curl) is `allowed` and simply gets no Access-Control-Allow-Origin header.
 */
export function applyCors(req, res, { methods = 'POST, OPTIONS', allowHeaders = 'Content-Type' } = {}) {
  const origin = header(req, 'origin') || '';
  const allowed = !origin || isAllowedOrigin(origin, req);

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', allowHeaders);
  if (origin && allowed) res.setHeader('Access-Control-Allow-Origin', origin);

  return { origin, allowed };
}

/**
 * CORS + preflight + method gate for a POST-only route.
 * Returns true when the response has already been sent (caller should just return).
 *
 * - blockDisallowedOrigin: respond 403 when a browser Origin is not on the allow-list
 *   (used by token-bearing / paid endpoints). When false, a disallowed origin just gets
 *   no CORS header, so the browser refuses to expose the response.
 * - optionsStatus / errorBody: keep each route's existing response contract.
 */
export function preflight(req, res, {
  allowHeaders = 'Content-Type',
  blockDisallowedOrigin = false,
  optionsStatus = 200,
  errorBody = (message) => ({ error: message })
} = {}) {
  const { allowed } = applyCors(req, res, { allowHeaders });

  if (!allowed && blockDisallowedOrigin) {
    res.status(403).json(errorBody('Origin not allowed'));
    return true;
  }
  if (req.method === 'OPTIONS') {
    res.status(allowed ? optionsStatus : 403).end();
    return true;
  }
  if (req.method !== 'POST') {
    res.status(405).json(errorBody('Method not allowed'));
    return true;
  }
  return false;
}

/**
 * Parses the request body as a JSON object without throwing.
 * Returns { ok: true, body } or { ok: false } (caller responds 400).
 * An absent/empty body is treated as {} so field validation produces the usual 400s.
 */
export function readJsonBody(req) {
  let raw;
  try {
    raw = req.body; // Vercel's lazy getter throws on malformed JSON
  } catch {
    return { ok: false };
  }
  if (raw === undefined || raw === null || raw === '') return { ok: true, body: {} };
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(raw)) raw = raw.toString('utf8');
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return { ok: false };
    }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false };
  return { ok: true, body: raw };
}

export function getClientIp(req) {
  const forwarded = header(req, 'x-vercel-forwarded-for') || header(req, 'x-real-ip') || header(req, 'x-forwarded-for');
  const first = String(forwarded || '').split(',')[0].trim();
  return first || req?.socket?.remoteAddress || 'unknown';
}

/* ---------- Upstash Redis (REST) ---------- */

export function upstashConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Runs Redis commands through Upstash's REST pipeline endpoint.
 * `commands` is an array of arrays, e.g. [['INCR', 'k'], ['EXPIRE', 'k', 60]].
 * Resolves to the array of results; throws on transport or command errors.
 */
export async function upstashPipeline(commands) {
  const base = String(process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/+$/, '');
  const res = await fetch(`${base}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });
  if (!res.ok) throw new Error(`Upstash responded ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Unexpected Upstash response');
  const failed = data.find((item) => item && item.error);
  if (failed) throw new Error(`Upstash error: ${failed.error}`);
  return data.map((item) => item?.result);
}

/* ---------- Rate limiting ---------- */

// Best-effort only: this Map lives in one warm serverless instance, so limits reset on cold
// start and are not shared between instances. Set UPSTASH_REDIS_REST_URL/_TOKEN for a
// limit that holds across instances.
const memoryHits = globalThis.__bpRateLimit || (globalThis.__bpRateLimit = new Map());
const MAX_TRACKED_KEYS = 5000;

function checkMemory(key, limit, windowMs, now) {
  const hits = (memoryHits.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    memoryHits.set(key, hits);
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)) };
  }
  hits.push(now);
  memoryHits.set(key, hits);
  if (memoryHits.size > MAX_TRACKED_KEYS) {
    for (const [k, v] of memoryHits) {
      if (!v.length || now - v[v.length - 1] >= windowMs) memoryHits.delete(k);
    }
    // Still over (many active keys): drop the oldest-inserted ones.
    for (const k of memoryHits.keys()) {
      if (memoryHits.size <= MAX_TRACKED_KEYS) break;
      memoryHits.delete(k);
    }
  }
  return { allowed: true, retryAfter: 0 };
}

async function checkUpstash(key, limit, windowMs, now) {
  // Fixed window keyed by bucket, so INCR + EXPIRE is safe to repeat on every hit.
  const bucket = Math.floor(now / windowMs);
  const redisKey = `bluepainter:rl:${key}:${bucket}`;
  const [count] = await upstashPipeline([
    ['INCR', redisKey],
    ['EXPIRE', redisKey, Math.ceil(windowMs / 1000)]
  ]);
  if (Number(count) > limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil(((bucket + 1) * windowMs - now) / 1000)) };
  }
  return { allowed: true, retryAfter: 0 };
}

/**
 * Per-IP limiter. In-memory sliding window by default (best-effort per instance);
 * Upstash-backed fixed window when configured (falls back to memory if Upstash is down).
 * Returns { allowed, retryAfter } with retryAfter in seconds.
 */
export async function checkRateLimit(req, { name, limit, windowMs = 60 * 60 * 1000 }) {
  const key = `${name}:${getClientIp(req)}`;
  const now = Date.now();
  if (upstashConfigured()) {
    try {
      return await checkUpstash(key, limit, windowMs, now);
    } catch (err) {
      console.warn('[rate-limit] Upstash unavailable, using in-memory limiter:', err.message);
    }
  }
  return checkMemory(key, limit, windowMs, now);
}

/**
 * Applies checkRateLimit and sends the 429 itself.
 * Returns true when the request was rejected (caller should just return).
 */
export async function rateLimited(req, res, options, errorBody = (message) => ({ error: message })) {
  const { allowed, retryAfter } = await checkRateLimit(req, options);
  if (allowed) return false;
  res.setHeader('Retry-After', String(retryAfter));
  res.status(429).json({
    ...errorBody('Too many requests — please try again later'),
    code: 'RATE_LIMITED',
    retryAfter
  });
  return true;
}

/** Test hook: clears the in-memory limiter. */
export function resetRateLimits() {
  memoryHits.clear();
}
