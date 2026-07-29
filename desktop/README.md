# BluePainter Desktop

Native desktop window for the BluePainter studio (Electron shell).

## Run (development)

From the repo root:

```bash
npm install
npm run desktop
```

This starts Vite and opens BluePainter in a desktop window at `#/app`.

## Production-style window (built assets)

```bash
npm run build
npm run desktop:prod
```

## Notes

- This is the Phase 2 desktop surface from `SPEC.md` — a real OS window around the same studio UI as the web demo.
- The in-app `TauriShell` remains a facilitator vision mock (`?facilitator=1#/demo/phase2`).
