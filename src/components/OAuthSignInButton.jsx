import { useEffect, useState } from 'react';
import { getOAuthConfig, signInWithProvider } from '../utils/oauthSignIn';

const LABELS = { github: 'GitHub', vercel: 'Vercel' };

/**
 * "Sign in with GitHub / Vercel" next to a token field. Renders nothing unless the API
 * reports the provider as configured, so deployments without OAuth credentials look
 * exactly as they did with pasted tokens only.
 */
export default function OAuthSignInButton({ provider, onToken, onError, disabled = false, className = '' }) {
  const [available, setAvailable] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    getOAuthConfig().then((config) => {
      if (active) setAvailable(Boolean(config[provider]));
    });
    return () => { active = false; };
  }, [provider]);

  if (!available) return null;

  const label = LABELS[provider] || provider;

  const handleClick = () => {
    setPending(true);
    // Not awaited before window.open(): the popup must open inside the click.
    signInWithProvider(provider)
      .then((result) => onToken?.(result))
      .catch((err) => onError?.(err?.message || `${label} sign-in failed`))
      .finally(() => setPending(false));
  };

  return (
    <button
      type="button"
      className={`mk-copy-btn oauth-signin-btn ${className}`.trim()}
      onClick={handleClick}
      disabled={disabled || pending}
    >
      {pending ? `Waiting for ${label}…` : `Sign in with ${label}`}
    </button>
  );
}
