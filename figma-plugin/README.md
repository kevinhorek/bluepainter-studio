# BluePainter Studio Export (Figma plugin)

Copies the selected Figma frame as JSON that BluePainter Studio imports through
**··· → Import from Figma → Paste JSON**. No Figma access token, no API server,
and the plugin makes no network requests (`networkAccess: none`).

The export is one-way: changes made in the Studio do not sync back to Figma.

## Load it in Figma (development)

Plugins can only be loaded from a manifest in the Figma **desktop app**.

1. Open any design file in the Figma desktop app.
2. Menu → **Plugins → Development → Import plugin from manifest…**
3. Choose `figma-plugin/manifest.json` from this repo.
4. Run it from **Plugins → Development → BluePainter Studio Export**.

There is no build step: `manifest.json`, `code.js` and `ui.html` are loaded as
they are. After editing them, re-run the plugin to pick up the change.

## Use it

1. Select **one** frame, component or instance (sections, groups and component
   sets also work).
2. The plugin shows the frame name, how many layers will be exported, and any
   caveats (images, vectors, gradients, mixed text styles).
3. Click **Copy JSON**.
4. Click **Open BluePainter Studio**, then in the Studio choose
   **··· → Import from Figma → Paste JSON**, paste, and import.

The panel follows the selection, so you can pick another frame without
re-running the plugin.

The Studio URL is the `STUDIO_URL` constant at the top of `code.js`.

## What is exported

The JSON has the shape of Figma's REST API `GET /v1/files/:key/nodes` response,
so the Studio's existing converter (`src/utils/figmaImport.js`) reads it
unchanged:

```json
{
  "source": "bluepainter-figma-plugin",
  "version": 1,
  "name": "Pricing Card",
  "nodeId": "1:2",
  "nodes": { "1:2": { "document": { "id": "1:2", "type": "FRAME", "children": [] } } }
}
```

| Figma | In the JSON | In the Studio |
| --- | --- | --- |
| Frames, components, instances, groups | `type`, `absoluteBoundingBox`, `children` | Frame (`div`) |
| Auto-layout | `layoutMode`, `itemSpacing`, `padding*`, `primaryAxisAlignItems`, `counterAxisAlignItems` | Flex row/column, gap, padding, alignment |
| Text | `characters`, `style` (`fontFamily`, `fontSize`, `fontWeight`, `lineHeightPx`, `textAlignHorizontal`, …), `fills` | Text with size, weight, colour, alignment, line height |
| Solid fills and strokes | `fills` / `strokes` with paint opacity in `color.a`, `strokeWeight` | Background and border, as hex or `rgba()` |
| Corner radius | `cornerRadius`, or `rectangleCornerRadii` when corners differ | Border radius (the first corner when they differ) |
| Lines | `type: "LINE"`, `strokes`, `strokeWeight` | Horizontal rule |
| Images | The layer with an `IMAGE` fill (`imageRef` = Figma image hash) | An empty box of the right size; image bytes are not exported |
| Hidden layers | Left out (counted as "Hidden layers skipped") | — |
| Hidden paints | Left out | — |
| Gradients, vectors, effects | Paint type only / plain layer | Ignored, or a plain box |

Mixed values (`figma.mixed`): text with several styles takes the style of its
first character; differing corner radii are written per corner; differing side
stroke weights use the widest side.

Two deliberate differences from the REST API, both so the unchanged converter
gives the right result: paint opacity is written to `color.a` (the REST API uses
a separate `opacity` field), and ellipses get a `cornerRadius` of half their
shorter side so circles stay round.

## Test

From the repo root:

```bash
npm run test:figma-plugin
```

This runs `code.js` in plain Node against a fake Plugin API node tree and feeds
the result through the Studio's real paste-JSON import. It does not run Figma.

## Publishing

`manifest.json` uses a placeholder `id`. To publish, create the plugin in Figma
(**Plugins → Development → New plugin…**) and copy the id Figma generates into
the manifest.
