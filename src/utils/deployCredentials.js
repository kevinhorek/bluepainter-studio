const GITHUB_TOKEN_KEY = 'bluepainter-github-token';
const VERCEL_TOKEN_KEY = 'bluepainter-vercel-token';
const VERCEL_TEAM_KEY = 'bluepainter-vercel-team';
const FIGMA_TOKEN_KEY = 'bluepainter-figma-token';
const OPENAI_KEY_KEY = 'bluepainter-openai-key';

const ALL_CREDENTIAL_KEYS = [GITHUB_TOKEN_KEY, VERCEL_TOKEN_KEY, VERCEL_TEAM_KEY, FIGMA_TOKEN_KEY, OPENAI_KEY_KEY];

function getStorage(kind) {
  try {
    return kind === 'session' ? globalThis.sessionStorage : globalThis.localStorage;
  } catch {
    return null; // access can throw when storage is blocked
  }
}

function readFrom(kind, key) {
  try { return getStorage(kind)?.getItem(key) || ''; } catch { return ''; }
}

function writeTo(kind, key, value) {
  try {
    const storage = getStorage(kind);
    if (!storage) return;
    if (value) storage.setItem(key, value);
    else storage.removeItem(key);
  } catch { /* ignore */ }
}

/** Reads a credential: this tab's session copy first, then the remembered (localStorage) one. */
export function loadCredential(key) {
  return readFrom('session', key) || readFrom('local', key);
}

/**
 * Stores a credential.
 * - remember: true (default) → localStorage, persists on this device.
 * - remember: false → sessionStorage only (gone when the tab closes); any remembered copy is cleared.
 * An empty value removes it from both.
 */
export function saveCredential(key, value, { remember = true } = {}) {
  writeTo('local', key, value && remember ? value : '');
  writeTo('session', key, value && !remember ? value : '');
}

/** True when the credential is persisted on this device (useful to pre-check a "remember" box). */
export function isCredentialRemembered(key) {
  return Boolean(readFrom('local', key));
}

export function loadGithubToken() {
  return loadCredential(GITHUB_TOKEN_KEY);
}

export function saveGithubToken(token, options) {
  saveCredential(GITHUB_TOKEN_KEY, token, options);
}

export function isGithubTokenRemembered() {
  return isCredentialRemembered(GITHUB_TOKEN_KEY);
}

export function loadVercelToken() {
  return loadCredential(VERCEL_TOKEN_KEY);
}

export function saveVercelToken(token, options) {
  saveCredential(VERCEL_TOKEN_KEY, token, options);
}

export function isVercelTokenRemembered() {
  return isCredentialRemembered(VERCEL_TOKEN_KEY);
}

/**
 * Team the saved Vercel token belongs to. Set by "Sign in with Vercel" (an integration token is
 * tied to the team it was installed on); empty for a pasted personal token.
 */
export function loadVercelTeamId() {
  return loadCredential(VERCEL_TEAM_KEY);
}

export function saveVercelTeamId(teamId, options) {
  saveCredential(VERCEL_TEAM_KEY, teamId, options);
}

/** Removes every stored token/key (GitHub, Vercel, Figma, OpenAI) from both storages. */
export function clearAllCredentials() {
  ALL_CREDENTIAL_KEYS.forEach((key) => saveCredential(key, ''));
}

export function maskToken(token) {
  if (!token || token.length < 8) return '';
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}
