/**
 * Browser-safe wrappers over the desktop shell's native file bridge
 * (`window.bluepainterDesktop`, exposed by desktop/preload.cjs).
 * In the web app every call resolves to its "not available" value instead of
 * throwing, so callers need no environment checks beyond `isDesktop()`.
 */

const NOT_DESKTOP_ERROR = 'Native file access is only available in the BluePainter desktop app.';

function getBridge() {
  const bridge = typeof window !== 'undefined' ? window.bluepainterDesktop : undefined;
  return bridge && bridge.isDesktop === true ? bridge : null;
}

function errorText(err) {
  return err && err.message ? err.message : String(err);
}

/** True inside the Electron desktop app. */
export function isDesktop() {
  return getBridge() !== null;
}

/**
 * Show the native open dialog (.tsx / .jsx).
 * @returns {Promise<{ path: string, name: string, content: string } | null>} null if cancelled or not in the desktop app
 */
export async function openTsxFile() {
  const bridge = getBridge();
  if (!bridge) return null;
  try {
    return (await bridge.openFile()) || null;
  } catch {
    return null;
  }
}

/**
 * Write `content` to a path previously returned by `openTsxFile` or `saveTsxFileAs`.
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function saveTsxFile(path, content) {
  const bridge = getBridge();
  if (!bridge) return { ok: false, error: NOT_DESKTOP_ERROR };
  try {
    const result = await bridge.saveFile(path, content);
    if (result && result.ok === true) return { ok: true };
    return { ok: false, error: (result && result.error) || 'The file could not be saved.' };
  } catch (err) {
    return { ok: false, error: errorText(err) };
  }
}

/**
 * Show the native save dialog and write `content` to the chosen file.
 * @returns {Promise<{ path: string, name: string } | null>} null if cancelled, failed, or not in the desktop app
 */
export async function saveTsxFileAs(name, content) {
  const bridge = getBridge();
  if (!bridge) return null;
  try {
    return (await bridge.saveFileAs(name, content)) || null;
  } catch {
    return null;
  }
}
