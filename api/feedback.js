/**
 * In-app feedback capture (the "Would you use BluePainter?" modal).
 * POST { interest: 'very'|'somewhat'|'not', pilot?, role?, comment?, timestamp?, website? (honeypot) }
 *
 * Durable storage: Upstash list `bluepainter:feedback` and/or a webhook
 * (FEEDBACK_WEBHOOK, falling back to WAITLIST_WEBHOOK). With neither configured the route
 * returns 503 in production and keeps entries in memory elsewhere (local dev).
 */
import { preflight, rateLimited, readJsonBody } from './_lib/http.js';
import { persistEntry } from './_lib/store.js';

const fail = (error) => ({ ok: false, error });

const INTEREST = ['very', 'somewhat', 'not'];
const PILOT = ['yes', 'maybe', 'no'];
const ROLE = ['designer', 'developer', 'founder', 'other'];

const oneOf = (value, allowed) => (allowed.includes(value) ? value : '');

export default async function handler(req, res) {
  if (preflight(req, res, { optionsStatus: 204, errorBody: fail })) return;

  try {
    if (await rateLimited(req, res, { name: 'feedback', limit: 10 }, fail)) return;

    const parsed = readJsonBody(req);
    if (!parsed.ok) {
      res.status(400).json(fail('Invalid JSON body'));
      return;
    }
    const body = parsed.body;

    if (String(body.website || '').trim()) {
      res.status(200).json({ ok: true });
      return;
    }

    const interest = oneOf(body.interest, INTEREST);
    if (!interest) {
      res.status(400).json(fail('Interest is required (very, somewhat or not)'));
      return;
    }

    const clientTime = typeof body.timestamp === 'string' && !Number.isNaN(Date.parse(body.timestamp))
      ? new Date(body.timestamp).toISOString()
      : '';

    const entry = {
      kind: 'feedback',
      interest,
      pilot: oneOf(body.pilot, PILOT),
      role: oneOf(body.role, ROLE),
      comment: typeof body.comment === 'string' ? body.comment.trim().slice(0, 2000) : '',
      timestamp: clientTime,
      createdAt: new Date().toISOString()
    };

    const result = await persistEntry({
      label: 'feedback',
      listKey: 'bluepainter:feedback',
      webhook: process.env.FEEDBACK_WEBHOOK || process.env.WAITLIST_WEBHOOK,
      entry
    });

    if (!result.ok) {
      res.status(result.status).json(fail(
        result.status === 503
          ? 'Feedback is not configured yet — please email us'
          : 'Could not save your feedback — please try again'
      ));
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json(fail(err.message || 'Server error'));
  }
}
