const STORAGE_KEY = 'bluepainter-openai-key';

export function loadOpenAIKey() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveOpenAIKey(key) {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function maskKey(key) {
  if (!key || key.length < 8) return '';
  return `${key.slice(0, 3)}…${key.slice(-4)}`;
}
