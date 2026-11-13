/**
 * BluePainter desktop shell (Electron).
 * Loads the Vite app in a native window — Phase 2 surface from SPEC.md.
 */
const { app, BrowserWindow, shell, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const {
  OPEN_EXTENSIONS,
  SAVE_EXTENSIONS,
  MAX_FILE_BYTES,
  createFileAccess,
  isTrustedAppUrl,
  resolveSaveDialogPath,
  sanitizeSuggestedName
} = require('./fileAccess.cjs');

const DEV_URL = process.env.BLUEPAINTER_DEV_URL || 'http://127.0.0.1:5173';
const START_ROUTE = process.env.BLUEPAINTER_START_ROUTE || 'app';
const isDev = !app.isPackaged && process.env.BLUEPAINTER_DESKTOP_PROD !== '1';
const INDEX_PATH = path.join(__dirname, '../dist/index.html');

/** Paths the user picked in a native dialog this session; the only ones `saveFile` may write. */
const fileAccess = createFileAccess();
/** webContents ids of the Studio windows created by createWindow(). */
const appWebContentsIds = new Set();

// Cloud / container Linux often lacks a full GPU + DBus stack.
if (process.env.BLUEPAINTER_ELECTRON_NO_SANDBOX === '1' || process.env.CURSOR_AGENT) {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
}

function createMenu() {
  const isMac = process.platform === 'darwin';
  
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com/kevinhorek/bluepainter-studio');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * The BrowserWindow behind an IPC call, or null unless the call comes from the
 * main frame of a Studio window that is still showing the Studio.
 */
function trustedWindowFor(event) {
  const sender = event.sender;
  const frame = event.senderFrame;
  if (!sender || sender.isDestroyed() || !appWebContentsIds.has(sender.id)) return null;
  if (!frame || frame !== sender.mainFrame) return null;
  if (!isTrustedAppUrl(frame.url, { isDev, devUrl: DEV_URL, indexPath: INDEX_PATH })) return null;
  return BrowserWindow.fromWebContents(sender);
}

function errorMessage(err) {
  if (err && err.code === 'EACCES') return 'Permission denied.';
  if (err && err.code === 'ENOENT') return 'The folder no longer exists.';
  return err && err.message ? err.message : 'Unknown error';
}

function registerFileHandlers() {
  ipcMain.handle('bluepainter:open-file', async (event) => {
    const win = trustedWindowFor(event);
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      title: 'Open component',
      properties: ['openFile'],
      filters: [{ name: 'React components', extensions: OPEN_EXTENSIONS }]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) throw new Error('Not a file.');
      if (stat.size > MAX_FILE_BYTES) throw new Error('The file is too large to open.');
      const content = await fs.readFile(filePath, 'utf8');
      const allowedPath = fileAccess.allow(filePath);
      return { path: allowedPath, name: path.basename(allowedPath), content };
    } catch (err) {
      dialog.showErrorBox('Could not open file', `${filePath}\n\n${errorMessage(err)}`);
      return null;
    }
  });

  ipcMain.handle('bluepainter:save-file', async (event, filePath, content) => {
    if (!trustedWindowFor(event)) return { ok: false, error: 'Not allowed from this page.' };
    const check = fileAccess.validateSave(filePath, content);
    if (!check.ok) return check;
    try {
      await fs.writeFile(check.path, content, 'utf8');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err) };
    }
  });

  ipcMain.handle('bluepainter:save-file-as', async (event, suggestedName, content) => {
    const win = trustedWindowFor(event);
    if (!win) return null;
    if (typeof content !== 'string' || Buffer.byteLength(content, 'utf8') > MAX_FILE_BYTES) return null;
    const result = await dialog.showSaveDialog(win, {
      title: 'Save component',
      defaultPath: sanitizeSuggestedName(suggestedName),
      filters: [{ name: 'React components', extensions: SAVE_EXTENSIONS }]
    });
    if (result.canceled || !result.filePath) return null;
    const target = resolveSaveDialogPath(result.filePath);
    if (!target.ok) {
      dialog.showErrorBox('Could not save file', target.error);
      return null;
    }
    try {
      await fs.writeFile(target.path, content, 'utf8');
    } catch (err) {
      dialog.showErrorBox('Could not save file', `${target.path}\n\n${errorMessage(err)}`);
      return null;
    }
    const allowedPath = fileAccess.allow(target.path);
    return { path: allowedPath, name: path.basename(allowedPath) };
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'BluePainter Studio',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    show: false
  });

  const webContentsId = win.webContents.id;
  appWebContentsIds.add(webContentsId);
  win.on('closed', () => appWebContentsIds.delete(webContentsId));

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const startHash = START_ROUTE === 'home' ? '/home' : '/app';

  if (isDev) {
    win.loadURL(`${DEV_URL}/#${startHash}`);
  } else {
    win.loadFile(INDEX_PATH, { hash: startHash });
  }

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Failed to load: ${errorDescription} (${errorCode})`);
  });

  return win;
}

app.whenReady().then(() => {
  createMenu();
  registerFileHandlers();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
