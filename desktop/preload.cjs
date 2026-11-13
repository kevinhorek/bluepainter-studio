/**
 * BluePainter desktop preload (sandboxed; only `electron` is requirable here).
 * Exposes native file open/save to the Studio as `window.bluepainterDesktop`.
 * All checks (sender, argument types, path allow-list, extensions) are enforced
 * in the main process — see main.cjs and fileAccess.cjs.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bluepainterDesktop', {
  isDesktop: true,

  /** @returns {Promise<{ path: string, name: string, content: string } | null>} null if cancelled */
  openFile: () => ipcRenderer.invoke('bluepainter:open-file'),

  /** @returns {Promise<{ ok: true } | { ok: false, error: string }>} */
  saveFile: (path, content) => ipcRenderer.invoke('bluepainter:save-file', path, content),

  /** @returns {Promise<{ path: string, name: string } | null>} null if cancelled */
  saveFileAs: (suggestedName, content) => ipcRenderer.invoke('bluepainter:save-file-as', suggestedName, content)
});
