/**
 * File access rules for the desktop shell. Pure (no Electron, no disk access)
 * so desktop/test/ipc.test.cjs can run it in plain Node.
 *
 * The renderer never chooses where to write: it may only save to a path the
 * user picked in a native open/save dialog during this session.
 */
const nodePath = require('path');
const { pathToFileURL } = require('url');

/** Extensions offered by the open dialog. */
const OPEN_EXTENSIONS = ['tsx', 'jsx'];
/** Extensions the main process is willing to write. */
const SAVE_EXTENSIONS = ['tsx', 'jsx', 'ts', 'js'];
const DEFAULT_SAVE_NAME = 'Component.tsx';
/** Largest file read or written, in bytes (UTF-8). */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function extensionOf(filePath, pathModule = nodePath) {
  return pathModule.extname(String(filePath)).slice(1).toLowerCase();
}

function hasExtension(filePath, extensions, pathModule = nodePath) {
  return extensions.includes(extensionOf(filePath, pathModule));
}

function isUsablePath(filePath, pathModule = nodePath) {
  return typeof filePath === 'string'
    && filePath.length > 0
    && filePath.length < 4096
    && !filePath.includes('\0')
    && pathModule.isAbsolute(filePath);
}

/**
 * Reduce a renderer-supplied name to a safe default file name for the save
 * dialog: base name only, no control or reserved characters, allowed extension.
 */
function sanitizeSuggestedName(name) {
  if (typeof name !== 'string') return DEFAULT_SAVE_NAME;
  const base = name.split(/[\\/]/).pop() || '';
  const cleaned = Array.from(base)
    .filter((ch) => ch.charCodeAt(0) >= 32 && !'<>:"|?*'.includes(ch))
    .join('')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 120);
  if (!cleaned) return DEFAULT_SAVE_NAME;
  if (hasExtension(cleaned, SAVE_EXTENSIONS)) return cleaned;
  const stem = cleaned.replace(/\.[^.]*$/, '') || cleaned;
  return `${stem}.tsx`;
}

/**
 * Normalise a path chosen in the save dialog. A name without an extension gets
 * `.tsx`; any other extension is refused.
 */
function resolveSaveDialogPath(filePath, pathModule = nodePath) {
  if (!isUsablePath(filePath, pathModule)) return { ok: false, error: 'No file was chosen.' };
  let resolved = pathModule.resolve(filePath);
  if (!extensionOf(resolved, pathModule)) resolved += '.tsx';
  if (!hasExtension(resolved, SAVE_EXTENSIONS, pathModule)) {
    return { ok: false, error: `Files can only be saved as ${SAVE_EXTENSIONS.map((e) => `.${e}`).join(', ')}.` };
  }
  return { ok: true, path: resolved };
}

/** Session allow-set of paths the user picked in a native dialog. */
function createFileAccess({ pathModule = nodePath } = {}) {
  const allowed = new Set();
  const normalize = (filePath) => pathModule.resolve(filePath);

  return {
    /** Remember a path returned by a native dialog. Returns the stored form. */
    allow(filePath) {
      if (!isUsablePath(filePath, pathModule)) throw new TypeError('allow() needs an absolute path');
      const normalized = normalize(filePath);
      allowed.add(normalized);
      return normalized;
    },

    isAllowed(filePath) {
      return isUsablePath(filePath, pathModule) && allowed.has(normalize(filePath));
    },

    /**
     * Check a renderer `saveFile(path, content)` request.
     * @returns {{ ok: true, path: string } | { ok: false, error: string }}
     */
    validateSave(filePath, content) {
      if (typeof filePath !== 'string' || typeof content !== 'string') {
        return { ok: false, error: 'saveFile expects (path: string, content: string).' };
      }
      if (!isUsablePath(filePath, pathModule)) {
        return { ok: false, error: 'The file path must be absolute.' };
      }
      const normalized = normalize(filePath);
      if (!hasExtension(normalized, SAVE_EXTENSIONS, pathModule)) {
        return { ok: false, error: `Only ${SAVE_EXTENSIONS.map((e) => `.${e}`).join(', ')} files can be saved.` };
      }
      if (!allowed.has(normalized)) {
        return { ok: false, error: 'This file was not opened or saved through a file dialog in this session.' };
      }
      if (Buffer.byteLength(content, 'utf8') > MAX_FILE_BYTES) {
        return { ok: false, error: 'The file is too large to save.' };
      }
      return { ok: true, path: normalized };
    },

    get size() {
      return allowed.size;
    }
  };
}

/**
 * True when `frameUrl` is the Studio itself: the dev server origin in
 * development, or the built index.html (any hash/query) in production.
 */
function isTrustedAppUrl(frameUrl, { isDev, devUrl, indexPath }) {
  if (typeof frameUrl !== 'string' || !frameUrl) return false;
  let parsed;
  try {
    parsed = new URL(frameUrl);
  } catch {
    return false;
  }
  if (isDev) {
    try {
      return parsed.origin === new URL(devUrl).origin;
    } catch {
      return false;
    }
  }
  if (parsed.protocol !== 'file:' || !indexPath) return false;
  parsed.hash = '';
  parsed.search = '';
  return parsed.href === pathToFileURL(indexPath).href;
}

module.exports = {
  OPEN_EXTENSIONS,
  SAVE_EXTENSIONS,
  DEFAULT_SAVE_NAME,
  MAX_FILE_BYTES,
  hasExtension,
  sanitizeSuggestedName,
  resolveSaveDialogPath,
  createFileAccess,
  isTrustedAppUrl
};
