/**
 * Durable capture for small JSON entries (waitlist signups, feedback).
 * Writes to an Upstash Redis list and/or POSTs to a webhook, whichever is configured.
 *
 * NOTE: site/api/_lib/store.js is a byte-identical copy — see the note in http.js.
 */
import { upstashConfigured, upstashPipeline } from './http.js';

const memory = globalThis.__bpMemoryStore || (globalThis.__bpMemoryStore = {});

async function postWebhook(url, entry) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
  if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
}

/**
 * Persists `entry`. Resolves to one of:
 *   { ok: true, stored: ['upstash', 'webhook'] }  at least one durable store accepted it
 *   { ok: true, stored: ['memory'] }              nothing configured, outside production
 *   { ok: false, status: 502 }                    every configured store rejected it
 *   { ok: false, status: 503 }                    nothing configured, in production
 * Never throws.
 */
export async function persistEntry({ label, listKey, webhook, entry }) {
  const targets = [];
  if (upstashConfigured()) {
    targets.push(['upstash', () => upstashPipeline([['LPUSH', listKey, JSON.stringify(entry)]])]);
  }
  if (webhook) targets.push(['webhook', () => postWebhook(webhook, entry)]);

  if (!targets.length) {
    if (process.env.VERCEL_ENV === 'production') {
      console.error(`[${label}] no durable store configured (Upstash or webhook) — rejecting`);
      return { ok: false, status: 503 };
    }
    // In-memory only: lost on cold start. Fine for local dev / previews, never for production.
    const list = memory[listKey] || (memory[listKey] = []);
    list.push(entry);
    if (list.length > 5000) list.shift();
    console.warn(`[${label}] no durable store configured — kept in memory only`);
    return { ok: true, stored: ['memory'] };
  }

  const settled = await Promise.allSettled(targets.map(([, run]) => run()));
  const stored = [];
  settled.forEach((result, i) => {
    if (result.status === 'fulfilled') stored.push(targets[i][0]);
    else console.error(`[${label}] ${targets[i][0]} store failed:`, result.reason?.message || result.reason);
  });

  // Don't tell the visitor "received" unless something durable actually took it.
  return stored.length ? { ok: true, stored } : { ok: false, status: 502 };
}
