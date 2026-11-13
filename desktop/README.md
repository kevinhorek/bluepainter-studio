# BluePainter Desktop

Native desktop window for the BluePainter studio (Electron shell).

## Run (development)

From the repo root:

```bash
npm install
npm run desktop
```

This starts Vite and opens BluePainter Studio in a desktop window at `#/app`.

## Start at marketing page (for demos)

```bash
BLUEPAINTER_START_ROUTE=home npm run desktop
```

## Production-style window (built assets)

```bash
npm run build
npm run desktop:prod
```

## Native file open / save

In the desktop app the Studio page gets a small bridge, `window.bluepainterDesktop`
(exposed by `preload.cjs` through `contextBridge`):

| Call | Result |
| --- | --- |
| `isDesktop` | `true` |
| `openFile()` | Native open dialog (`.tsx`, `.jsx`). Resolves `{ path, name, content }`, or `null` if cancelled or unreadable. |
| `saveFile(path, content)` | Writes UTF-8 to `path`. Resolves `{ ok: true }` or `{ ok: false, error }`. |
| `saveFileAs(suggestedName, content)` | Native save dialog, then writes the file. Resolves `{ path, name }`, or `null` if cancelled or the write failed. |

Studio code should call it through `src/utils/desktopBridge.js` (`isDesktop()`,
`openTsxFile()`, `saveTsxFile(path, content)`, `saveTsxFileAs(name, content)`),
which returns `null` / `{ ok: false }` in the browser instead of throwing.
The bridge is not yet wired into the Studio UI (there is no File → Open / Save
menu item or button yet).

What the main process enforces (`main.cjs`, rules in `fileAccess.cjs`):

- `saveFile` only writes to a path that `openFile` or `saveFileAs` returned
  earlier in the same app session. The list is kept in the main process and is
  empty again after a restart.
- Only `.tsx`, `.jsx`, `.ts` and `.js` files are written. A name typed without
  an extension in the save dialog gets `.tsx`.
- Calls are accepted only from the main frame of a Studio window while it is
  showing the Studio (the dev server origin, or the built `dist/index.html`).
- Arguments must be strings; files over 10 MB are refused.
- The window keeps `contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: true`.

Test the rules (plain Node, no Electron):

```bash
npm run test:desktop
```

## Environment Variables

- `BLUEPAINTER_START_ROUTE`: Set to `home` to start at marketing page, or `app` (default) to start at the studio
- `BLUEPAINTER_DEV_URL`: Override dev server URL (default: `http://127.0.0.1:5173`)
- `BLUEPAINTER_DESKTOP_PROD`: Set to `1` to load from built assets in dev mode
- `BLUEPAINTER_ELECTRON_NO_SANDBOX`: Set to `1` to disable sandbox (for headless environments)

## Notes

- This is the Phase 2 desktop surface from `SPEC.md` — a real OS window around the same studio UI as the web demo
- Window title: **BluePainter Studio**
- The in-app `TauriShell` remains a facilitator vision mock (`?facilitator=1#/demo/phase2`)
