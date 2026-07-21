const SITE_SHARE_BASE = 'https://bluepainter-launch.vercel.app/s';

/** Encode a compact share payload into a URL-safe id (client-side, no server store). */
export function encodeSharePayload(payload) {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return b64.slice(0, 120);
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

export function getSharePageUrl(payload) {
  // Prefer static demo cards; also support hash payload pages later
  if (payload.type === 'wrapped') return `${SITE_SHARE_BASE}/demo-wrapped`;
  return `${SITE_SHARE_BASE}/demo-scorecard`;
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

export function openNativeShare(payload) {
  const url = getSharePageUrl(payload);
  const text = `My BluePainter ${payload.label}: ${payload.score}`;
  if (navigator.share) {
    return navigator.share({ title: 'BluePainter', text, url });
  }
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  return Promise.resolve();
}
