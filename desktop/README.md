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

## Environment Variables

- `BLUEPAINTER_START_ROUTE`: Set to `home` to start at marketing page, or `app` (default) to start at the studio
- `BLUEPAINTER_DEV_URL`: Override dev server URL (default: `http://127.0.0.1:5173`)
- `BLUEPAINTER_DESKTOP_PROD`: Set to `1` to load from built assets in dev mode
- `BLUEPAINTER_ELECTRON_NO_SANDBOX`: Set to `1` to disable sandbox (for headless environments)

## Notes

- This is the Phase 2 desktop surface from `SPEC.md` — a real OS window around the same studio UI as the web demo
- Window title: **BluePainter Studio**
- The in-app `TauriShell` remains a facilitator vision mock (`?facilitator=1#/demo/phase2`)
