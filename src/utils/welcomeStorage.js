const WELCOME_KEY = 'bluepainter-welcome-seen';

export function hasSeenWelcome() {
  try {
    return localStorage.getItem(WELCOME_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markWelcomeSeen() {
  try {
    localStorage.setItem(WELCOME_KEY, 'true');
  } catch {
    /* ignore */
  }
}
