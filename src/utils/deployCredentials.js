const GITHUB_TOKEN_KEY = 'bluepainter-github-token';
const VERCEL_TOKEN_KEY = 'bluepainter-vercel-token';

export function loadGithubToken() {
  try { return localStorage.getItem(GITHUB_TOKEN_KEY) || ''; } catch { return ''; }
}

export function saveGithubToken(token) {
  try {
    if (token) localStorage.setItem(GITHUB_TOKEN_KEY, token);
    else localStorage.removeItem(GITHUB_TOKEN_KEY);
  } catch { /* ignore */ }
}

export function loadVercelToken() {
  try { return localStorage.getItem(VERCEL_TOKEN_KEY) || ''; } catch { return ''; }
}

export function saveVercelToken(token) {
  try {
    if (token) localStorage.setItem(VERCEL_TOKEN_KEY, token);
    else localStorage.removeItem(VERCEL_TOKEN_KEY);
  } catch { /* ignore */ }
}

export function maskToken(token) {
  if (!token || token.length < 8) return '';
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}
