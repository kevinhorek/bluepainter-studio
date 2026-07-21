/**
 * Waitlist / pilot / newsletter capture.
 * Stores in-memory on cold starts; optionally forwards to RESEND_WEBHOOK or WAITLIST_WEBHOOK.
 * POST { email, source?, name?, company?, role?, message? }
 */
const store = globalThis.__bpWaitlist || (globalThis.__bpWaitlist = []);

function isEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const email = String(body.email || '').trim().toLowerCase();
    if (!isEmail(email)) {
      res.status(400).json({ ok: false, error: 'Valid email required' });
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

    store.push(entry);
    if (store.length > 5000) store.shift();

    const webhook = process.env.WAITLIST_WEBHOOK || process.env.RESEND_WEBHOOK;
    if (webhook) {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      }).catch(() => {});
    }

    res.status(200).json({ ok: true, id: store.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Server error' });
  }
}
