/**
 * "Sign in with GitHub / Vercel" for the export & deploy flow.
 * The server side lives in api/oauth/ and only exists when the deployment has the OAuth
 * env vars set, so everything here degrades to "not available" and the pasted-token
 * fields stay the way to deploy.
 */

const MESSAGE_SOURCE = 'bluepainter-oauth';
const PROVIDER_LABELS = { github: 'GitHub', vercel: 'Vercel' };
const UNAVAILABLE = Object.freeze({ github: false, vercel: false });

let configPromise = null;

/**
 * Which providers the API can sign in with. Never rejects: any failure (API not running,
 * the dev server answering with index.html, a network error) resolves to all-false.
 * A successful answer is cached for the page's lifetime; a failure is retried next call.
 */
export function getOAuthConfig() {
  if (configPromise) return configPromise;
  const request = (async () => {
    try {
      const res = await fetch('/api/oauth/config', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`config responded ${res.status}`);
      const data = await res.json();
      return { github: data?.github === true, vercel: data?.vercel === true };
    } catch {
      if (configPromise === request) configPromise = null;
      return UNAVAILABLE;
    }
  })();
  configPromise = request;
  return request;
}

/**
 * Opens the provider's sign-in in a popup and resolves with { token, teamId? }.
 * Rejects when the popup is blocked, the provider reports an error, or the popup is
 * closed before a result arrives. Call it directly from a click handler (no await first),
 * otherwise browsers block the popup.
 */
export function signInWithProvider(provider) {
  const label = PROVIDER_LABELS[provider];
  if (!label) return Promise.reject(new Error(`Unknown sign-in provider: ${provider}`));

  // The API is same-origin (/api/...), so the callback page posts from this origin.
  const apiOrigin = window.location.origin;
  const startUrl = `/api/oauth/${provider}/start?origin=${encodeURIComponent(apiOrigin)}`;

  const width = 600;
  const height = 720;
  const left = Math.max(0, Math.round((window.screenX || 0) + ((window.outerWidth || width) - width) / 2));
  const top = Math.max(0, Math.round((window.screenY || 0) + ((window.outerHeight || height) - height) / 2));
  const popup = window.open(startUrl, `bluepainter-oauth-${provider}`, `popup=yes,width=${width},height=${height},left=${left},top=${top}`);

  if (!popup) {
    return Promise.reject(new Error(`The ${label} sign-in window was blocked. Allow pop-ups for this site and try again.`));
  }

  return new Promise((resolve, reject) => {
    let closedTimer = null;

    const finish = (fn, value) => {
      window.removeEventListener('message', onMessage);
      clearInterval(pollTimer);
      clearTimeout(closedTimer);
      fn(value);
    };

    function onMessage(event) {
      if (event.origin !== apiOrigin) return;
      const data = event.data;
      if (!data || typeof data !== 'object' || data.source !== MESSAGE_SOURCE || data.provider !== provider) return;

      if (typeof data.token === 'string' && data.token) {
        finish(resolve, { token: data.token, ...(typeof data.teamId === 'string' && data.teamId ? { teamId: data.teamId } : {}) });
      } else {
        finish(reject, new Error(typeof data.error === 'string' && data.error ? data.error : `${label} sign-in failed`));
      }
    }

    window.addEventListener('message', onMessage);

    // No event fires when a cross-origin popup closes, so poll. The short delay lets a
    // message posted just before window.close() arrive first.
    const pollTimer = setInterval(() => {
      if (!popup.closed || closedTimer) return;
      closedTimer = setTimeout(() => finish(reject, new Error(`${label} sign-in was cancelled`)), 400);
    }, 500);
  });
}
