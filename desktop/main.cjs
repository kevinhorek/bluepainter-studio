/**
 * BluePainter desktop shell (Electron).
 * Loads the Vite app in a native window — Phase 2 surface from SPEC.md.
 */
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

const DEV_URL = process.env.BLUEPAINTER_DEV_URL || 'http://127.0.0.1:5173';
const START_ROUTE = process.env.BLUEPAINTER_START_ROUTE || 'app';
const isDev = !app.isPackaged && process.env.BLUEPAINTER_DESKTOP_PROD !== '1';

// Cloud / container Linux often lacks a full GPU + DBus stack.
if (process.env.BLUEPAINTER_ELECTRON_NO_SANDBOX === '1' || process.env.CURSOR_AGENT) {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
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
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    show: false
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const startHash = START_ROUTE === 'home' ? '/home' : '/app';

  if (isDev) {
    win.loadURL(`${DEV_URL}/#${startHash}`);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'), { hash: startHash });
  }

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Failed to load: ${errorDescription} (${errorCode})`);
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
