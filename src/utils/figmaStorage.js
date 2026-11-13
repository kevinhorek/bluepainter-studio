import { loadCredential, saveCredential, isCredentialRemembered } from './deployCredentials.js';

const FIGMA_TOKEN_KEY = 'bluepainter-figma-token';

export function loadFigmaToken() {
  return loadCredential(FIGMA_TOKEN_KEY);
}

/** saveFigmaToken(token, { remember }) — remember: false keeps it in sessionStorage only. */
export function saveFigmaToken(token, options) {
  saveCredential(FIGMA_TOKEN_KEY, token, options);
}

export function isFigmaTokenRemembered() {
  return isCredentialRemembered(FIGMA_TOKEN_KEY);
}

export function maskToken(token) {
  if (!token || token.length < 8) return '';
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}
