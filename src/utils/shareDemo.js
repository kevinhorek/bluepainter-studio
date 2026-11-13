export const DEMO_URL = 'https://www.bluepainter.com';

export async function copyDemoLink() {
  // Share the deployment the user is actually on (preview/staging/custom domain).
  const origin = typeof window !== 'undefined' && /^https?:/.test(window.location.origin) && !/localhost|127\.0\.0\.1/.test(window.location.hostname)
    ? window.location.origin
    : DEMO_URL;
  const url = `${origin}/#/app`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    try {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      return true;
    } catch {
      return false;
    }
  }
}
