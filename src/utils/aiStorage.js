import { loadCredential, saveCredential, isCredentialRemembered } from './deployCredentials.js';

const STORAGE_KEY = 'bluepainter-openai-key';

export function loadOpenAIKey() {
  return loadCredential(STORAGE_KEY);
}

/** saveOpenAIKey(key, { remember }) — remember: false keeps it in sessionStorage only. */
export function saveOpenAIKey(key, options) {
  saveCredential(STORAGE_KEY, key, options);
}

export function isOpenAIKeyRemembered() {
  return isCredentialRemembered(STORAGE_KEY);
}

export function maskKey(key) {
  if (!key || key.length < 8) return '';
  return `${key.slice(0, 3)}…${key.slice(-4)}`;
}
