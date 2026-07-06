const FIGMA_TOKEN_KEY = 'bluepainter-figma-token';

export function loadFigmaToken() {
  try { return localStorage.getItem(FIGMA_TOKEN_KEY) || ''; } catch { return ''; }
}

export function saveFigmaToken(token) {
  try {
    if (token) localStorage.setItem(FIGMA_TOKEN_KEY, token);
    else localStorage.removeItem(FIGMA_TOKEN_KEY);
  } catch { /* ignore */ }
}

export function maskToken(token) {
  if (!token || token.length < 8) return '';
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}
