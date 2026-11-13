/**
 * "Sign in with GitHub / Vercel" for the export & deploy flow (popup OAuth, no server-side session).
 *
 *   GET /api/oauth/config              → { github, vercel } booleans (are the env vars set?)
 *   GET /api/oauth/<provider>/start    → 302 to the provider, with a signed `state`
 *   GET /api/oauth/<provider>/callback → exchanges `code`, then a tiny page postMessage()s the
 *                                        token to the opener and closes
 *
 * `state` is `<payload>.<hmac>`: the payload carries a random nonce, the provider, an expiry and
 * the opener origin, signed with the provider's client secret. The nonce is also set as a
 * short-lived HttpOnly cookie, so a state minted in one browser is useless in another. The
 * callback only ever posts to the origin bound into that verified state — never `*`.
 *
 * Everything is gated on env vars; without them `start` answers 501 and `config` reports false,
 * and the Studio keeps showing only the pasted-token fields.
 */
import crypto from 'node:crypto';
import { applyCors, isAllowedOrigin, rateLimited } from './http.js';

const STATE_TTL_SECONDS = 10 * 60;
const MESSAGE_SOURCE = 'bluepainter-oauth';
const RATE_LIMIT = { name: 'oauth', limit: 40, windowMs: 10 * 60 * 1000 };

function env(name) {
  return String(process.env[name] || '').trim();
}

function header(req, name) {
  const value = req?.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

async function readJson(res) {
  try {
    return (await res.json()) || {};
  } catch {
    return {};
  }
}

function describeError(data, fallback) {
  const error = data?.error;
  const text = data?.error_description
    || (typeof error === 'string' ? error : error?.message)
    || data?.message
    || fallback;
  return String(text).slice(0, 300);
}

const PROVIDERS = {
  github: {
    label: 'GitHub',
    configured: () => Boolean(env('GITHUB_CLIENT_ID') && env('GITHUB_CLIENT_SECRET')),
    secret: () => env('GITHUB_CLIENT_SECRET'),
    authorizeUrl({ state, redirectUri }) {
      const url = new URL('https://github.com/login/oauth/authorize');
      url.searchParams.set('client_id', env('GITHUB_CLIENT_ID'));
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('scope', 'repo');
      url.searchParams.set('state', state);
      return url.toString();
    },
    async exchange({ code, redirectUri }) {
      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: env('GITHUB_CLIENT_ID'),
          client_secret: env('GITHUB_CLIENT_SECRET'),
          code,
          redirect_uri: redirectUri
        })
      });
      const data = await readJson(res);
      // GitHub reports a bad/expired code as 200 + { error, error_description }.
      if (!res.ok || data.error || typeof data.access_token !== 'string' || !data.access_token) {
        throw new Error(describeError(data, `GitHub responded ${res.status}`));
      }
      return { token: data.access_token };
    }
  },
  vercel: {
    label: 'Vercel',
    configured: () => Boolean(env('VERCEL_CLIENT_ID') && env('VERCEL_CLIENT_SECRET') && env('VERCEL_INTEGRATION_SLUG')),
    secret: () => env('VERCEL_CLIENT_SECRET'),
    authorizeUrl({ state }) {
      const url = new URL(`https://vercel.com/integrations/${encodeURIComponent(env('VERCEL_INTEGRATION_SLUG'))}/new`);
      url.searchParams.set('state', state);
      return url.toString();
    },
    async exchange({ code, redirectUri }) {
      const res = await fetch('https://api.vercel.com/v2/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env('VERCEL_CLIENT_ID'),
          client_secret: env('VERCEL_CLIENT_SECRET'),
          code,
          redirect_uri: redirectUri
        })
      });
      const data = await readJson(res);
      if (!res.ok || data.error || typeof data.access_token !== 'string' || !data.access_token) {
        throw new Error(describeError(data, `Vercel responded ${res.status}`));
      }
      return { token: data.access_token, teamId: typeof data.team_id === 'string' && data.team_id ? data.team_id : null };
    }
  }
};

export function oauthConfig() {
  return { github: PROVIDERS.github.configured(), vercel: PROVIDERS.vercel.configured() };
}

/* ---------- request helpers ---------- */

function ownHost(req) {
  return String(header(req, 'x-forwarded-host') || header(req, 'host') || '').toLowerCase();
}

function isLocalHost(host) {
  const name = host.replace(/:\d+$/, '');
  return name === 'localhost' || name === '127.0.0.1' || name === '[::1]';
}

/** This deployment's own origin, e.g. https://bluepainter-studio.vercel.app */
function ownOrigin(req) {
  const host = ownHost(req);
  const forwarded = String(header(req, 'x-forwarded-proto') || '').split(',')[0].trim().toLowerCase();
  const proto = forwarded === 'http' || forwarded === 'https' ? forwarded : (isLocalHost(host) ? 'http' : 'https');
  return `${proto}://${host}`;
}

function redirectUri(req, provider) {
  return `${ownOrigin(req)}/api/oauth/${provider}/callback`;
}

function getQuery(req) {
  if (req.query && typeof req.query === 'object') return req.query;
  try {
    return Object.fromEntries(new URL(req.url || '/', 'http://localhost').searchParams);
  } catch {
    return {};
  }
}

function param(query, name) {
  const value = query[name];
  return typeof value === 'string' ? value : Array.isArray(value) && typeof value[0] === 'string' ? value[0] : '';
}

function toOrigin(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : '';
  } catch {
    return '';
  }
}

/**
 * Stricter than the API's CORS list: a token is handed to this origin, so the
 * bluepainter*.vercel.app preview pattern (registrable by anyone) does not qualify —
 * a preview deployment still works through the own-host rule.
 */
function isAllowedOpener(origin, req) {
  return Boolean(origin) && isAllowedOrigin(origin, req, { previewWildcard: false });
}

function cookieName(provider) {
  return `bp_oauth_${provider}`;
}

function readCookie(req, name) {
  const raw = String(header(req, 'cookie') || '');
  for (const part of raw.split(';')) {
    const index = part.indexOf('=');
    if (index > 0 && part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return '';
}

function stateCookie(req, provider, value, maxAge) {
  const secure = ownOrigin(req).startsWith('https://') ? '; Secure' : '';
  return `${cookieName(provider)}=${value}; Max-Age=${maxAge}; Path=/api/oauth; HttpOnly${secure}; SameSite=Lax`;
}

/* ---------- signed state ---------- */

function sign(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function createState(provider, secret, origin) {
  const nonce = crypto.randomBytes(24).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    n: nonce,
    p: provider,
    o: origin,
    e: Date.now() + STATE_TTL_SECONDS * 1000
  })).toString('base64url');
  return { nonce, state: `${payload}.${sign(secret, payload)}` };
}

/** Returns the bound opener origin, or null when the state is absent, forged, expired or from another browser. */
function verifyState(req, provider, secret, state) {
  const dot = state.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = state.slice(0, dot);
  if (!safeEqual(state.slice(dot + 1), sign(secret, payload))) return null;

  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!data || data.p !== provider || typeof data.n !== 'string' || typeof data.o !== 'string') return null;
  if (typeof data.e !== 'number' || data.e < Date.now()) return null;

  const cookie = readCookie(req, cookieName(provider));
  if (!cookie || !safeEqual(cookie, data.n)) return null;
  if (!isAllowedOpener(data.o, req)) return null;
  return data.o;
}

/* ---------- callback page ---------- */

/** JSON that is safe inside <script>: no `<`, `>`, `&` or JS line separators survive unescaped. */
function scriptJson(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

function sendPage(res, status, { text, post }) {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`);
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const script = post
    ? `<script nonce="${nonce}">(function(){var d=${scriptJson(post)};var sent=false;`
      + 'try{if(window.opener&&!window.opener.closed){window.opener.postMessage(d.message,d.origin);sent=true;}}catch(e){}'
      + 'if(sent){window.close();}else{document.getElementById("msg").textContent='
      + '"Could not reach the BluePainter window. Close this window and try again.";}})();</script>'
    : '';

  res.status(status).end(
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>BluePainter sign-in</title></head>'
    + `<body><p id="msg">${escapeHtml(text)}</p>${script}</body></html>`
  );
}

/* ---------- handlers ---------- */

export function handleOAuthConfig(req, res) {
  const { allowed } = applyCors(req, res, { methods: 'GET, OPTIONS' });
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(allowed ? 204 : 403).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json(oauthConfig());
}

async function handleStart(req, res, provider, config) {
  if (!config.configured()) {
    return res.status(501).json({
      error: `${config.label} sign-in is not configured on this deployment`,
      code: 'OAUTH_NOT_CONFIGURED'
    });
  }

  const query = getQuery(req);
  // An explicit ?origin= is taken as-is (and rejected if bad); without one, fall back to the page that opened us.
  const requested = param(query, 'origin');
  const origin = requested ? toOrigin(requested) : (toOrigin(header(req, 'referer')) || ownOrigin(req));
  if (!isAllowedOpener(origin, req)) return res.status(403).json({ error: 'Origin not allowed' });

  const { nonce, state } = createState(provider, config.secret(), origin);
  res.setHeader('Set-Cookie', stateCookie(req, provider, nonce, STATE_TTL_SECONDS));
  res.setHeader('Location', config.authorizeUrl({ state, redirectUri: redirectUri(req, provider) }));
  return res.status(302).end();
}

async function handleCallback(req, res, provider, config) {
  if (!config.configured()) {
    return res.status(501).json({
      error: `${config.label} sign-in is not configured on this deployment`,
      code: 'OAUTH_NOT_CONFIGURED'
    });
  }

  const query = getQuery(req);
  const origin = verifyState(req, provider, config.secret(), param(query, 'state'));
  res.setHeader('Set-Cookie', stateCookie(req, provider, '', 0)); // single use

  // Without a verified state there is no trusted origin to post to: plain page, no script, no provider call.
  if (!origin) {
    return sendPage(res, 400, { text: 'This sign-in link is invalid or has expired. Close this window and try again from BluePainter.' });
  }

  const post = (fields) => sendPage(res, 200, {
    text: 'Finishing sign-in… you can close this window.',
    post: { origin, message: { source: MESSAGE_SOURCE, provider, ...fields } }
  });

  const code = param(query, 'code');
  if (!code) {
    const denied = param(query, 'error_description') || param(query, 'error');
    return post({ error: denied ? String(denied).slice(0, 300) : `${config.label} did not return an authorization code` });
  }

  try {
    return post(await config.exchange({ code, redirectUri: redirectUri(req, provider) }));
  } catch (err) {
    return post({ error: `${config.label} sign-in failed: ${err?.message || 'token exchange failed'}` });
  }
}

/** Entry point for /api/oauth/<provider>/<action>. */
export async function handleOAuth(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const query = getQuery(req);
  const provider = param(query, 'provider');
  const action = param(query, 'action');
  const config = Object.hasOwn(PROVIDERS, provider) ? PROVIDERS[provider] : null;
  if (!config || (action !== 'start' && action !== 'callback')) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (await rateLimited(req, res, RATE_LIMIT)) return undefined;
  return action === 'start' ? handleStart(req, res, provider, config) : handleCallback(req, res, provider, config);
}
