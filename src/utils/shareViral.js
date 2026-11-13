/**
 * The marketing site's origin — the only place the Studio names it.
 * Override with VITE_SITE_URL when the custom domain goes live.
 */
export const SITE_URL = String(import.meta.env?.VITE_SITE_URL || 'https://bluepainter-launch.vercel.app').replace(/\/+$/, '');

const RECOMMENDATIONS = ['GO', 'CONTINUE', 'NO-GO'];
const clampInt = (value, max) => Math.min(max, Math.max(0, Math.round(Number(value) || 0)));

/**
 * Encode a share payload as URL-safe base64 of a compact JSON object.
 * Only numbers and enums are included (no free text), so the link carries
 * nothing personal. Decoded and re-validated by site/src/pages/s/index.astro —
 * keep the two in sync: { v, t, s, n, f, c, r? }.
 */
export function encodeSharePayload(payload) {
  const compact = {
    v: 1,
    t: payload.type === 'wrapped' ? 'w' : 's',
    s: clampInt(payload.score, 100),
    n: clampInt(payload.nodes, 99999),
    f: clampInt(payload.fixes, 99999),
    c: clampInt(payload.contrastPasses, 99999)
  };
  if (RECOMMENDATIONS.includes(payload.recommendation)) compact.r = payload.recommendation;
  // Compact payload is ASCII-only, so btoa is safe without a UTF-8 step.
  return btoa(JSON.stringify(compact))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function buildScorecardSharePayload(scorecard) {
  const score =
    scorecard.recommendation === 'GO' ? 95
      : scorecard.recommendation === 'NO-GO' ? 40
        : 70;
  return {
    type: 'scorecard',
    score,
    label: 'Design policy score',
    name: `Session · ${scorecard.recommendation}`,
    nodes: (scorecard.activation?.canvasCount || 0) + (scorecard.activation?.codeCount || 0),
    fixes: scorecard.receipts?.fixesApplied || 0,
    contrastPasses: scorecard.receipts?.engaged ? Math.max(1, scorecard.receipts.fixesApplied || 0) : 0,
    recommendation: scorecard.recommendation
  };
}

export function buildSyncWrappedPayload(learning = {}) {
  return {
    type: 'wrapped',
    score: Math.min(99, 60 + (learning.fixesApplied || 0) * 5 + (learning.roundTripsCanvas || 0) * 2),
    label: 'Sync Wrapped',
    name: 'BluePainter session',
    nodes: (learning.roundTripsCanvas || 0) + (learning.roundTripsCode || 0),
    fixes: learning.fixesApplied || 0,
    contrastPasses: learning.rulesDismissed || 0
  };
}

/**
 * Share page for this payload. The data rides in the URL fragment, which
 * browsers never send to the server — so it stays out of query strings and logs.
 */
export function getSharePageUrl(payload) {
  return `${SITE_URL}/s#${encodeSharePayload(payload)}`;
}

export async function copyShareLink(payload) {
  const url = getSharePageUrl(payload);
  try {
    await navigator.clipboard.writeText(url);
    return { ok: true, url };
  } catch {
    return { ok: false, url };
  }
}

/**
 * Open the native share sheet, or fall back to an X intent in a new tab.
 * Resolves to { ok, method, url }:
 *   method 'native'    — share sheet completed
 *   method 'window'    — fallback tab opened
 *   method 'cancelled' — user dismissed the sheet (not an error)
 */
export async function openNativeShare(payload) {
  const url = getSharePageUrl(payload);
  const text = `My BluePainter ${payload.label}: ${payload.score}`;
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'BluePainter', text, url });
      return { ok: true, method: 'native', url };
    } catch (err) {
      if (err?.name === 'AbortError') return { ok: false, method: 'cancelled', url };
      // Any other failure (NotAllowedError, unsupported data): fall through to the intent link.
    }
  }
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    '_blank',
    'noopener'
  );
  return { ok: true, method: 'window', url };
}
