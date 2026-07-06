export const DEMO_URL = 'https://bluepainter-studio.vercel.app';

export async function copyDemoLink() {
  const url = `${DEMO_URL}/#/studio`;
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
