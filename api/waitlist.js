/**
 * Waitlist / pilot / newsletter capture.
 * POST { email, source?, name?, company?, role?, message?, website? (honeypot) }
 *
 * Durable storage: Upstash list `bluepainter:waitlist` (UPSTASH_REDIS_REST_URL/_TOKEN) and/or
 * a webhook (WAITLIST_WEBHOOK, falling back to RESEND_WEBHOOK). With neither configured the
 * route returns 503 in production and keeps entries in memory elsewhere (local dev).
 *
 * NOTE: site/api/waitlist.js is a byte-identical copy (the site is its own Vercel project).
 * scripts/api-tests.mjs fails if they drift — edit this file, then copy it across.
 */
import { preflight, rateLimited, readJsonBody } from './_lib/http.js';
import { persistEntry } from './_lib/store.js';

const fail = (error) => ({ ok: false, error });

function isEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default async function handler(req, res) {
  if (preflight(req, res, { optionsStatus: 204, errorBody: fail })) return;

  try {
    if (await rateLimited(req, res, { name: 'waitlist', limit: 10 }, fail)) return;

    const parsed = readJsonBody(req);
    if (!parsed.ok) {
      res.status(400).json(fail('Invalid JSON body'));
      return;
    }
    const body = parsed.body;

    // Honeypot: real visitors never see or fill the hidden "website" field.
    if (String(body.website || '').trim()) {
      res.status(200).json({ ok: true });
      return;
    }

    const email = String(body.email || '').trim().toLowerCase();
    if (email.length > 254 || !isEmail(email)) {
      res.status(400).json(fail('Valid email required'));
      return;
    }

    const entry = {
      email,
      source: String(body.source || 'waitlist').slice(0, 64),
      name: String(body.name || '').slice(0, 120),
      company: String(body.company || '').slice(0, 120),
      role: String(body.role || '').slice(0, 64),
      message: String(body.message || '').slice(0, 2000),
      createdAt: new Date().toISOString()
    };

    const result = await persistEntry({
      label: 'waitlist',
      listKey: 'bluepainter:waitlist',
      webhook: process.env.WAITLIST_WEBHOOK || process.env.RESEND_WEBHOOK,
      entry
    });

    if (!result.ok) {
      res.status(result.status).json(fail(
        result.status === 503
          ? 'Signups are not configured yet — please email us'
          : 'Could not save your request — please try again'
      ));
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json(fail(err.message || 'Server error'));
  }
}
