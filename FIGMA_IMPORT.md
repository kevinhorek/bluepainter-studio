# Figma Import — One-Way Design Handoff

BluePainter supports **one-way import** from Figma to the Studio canvas. This is a **design-to-code handoff tool**, not bidirectional sync.

## What it does

Pull frames from Figma → BluePainter canvas → edit visually → export as shippable React/TSX.

- **Import method 1:** Figma URL + personal access token (via `/api/figma-import`)
- **Import method 2:** Paste Figma REST API JSON (client-side only, no API call)
- **Output:** BluePainter nodes map with inline styles

## Supported node types

| Figma node | Converts to | Notes |
|------------|-------------|-------|
| `FRAME`, `COMPONENT`, `INSTANCE`, `GROUP`, `SECTION` | `<div>` frame | Auto-layout → flexbox, absolute positioning preserved |
| `TEXT` | `<p>` text | Font size, weight, color, alignment, line height |
| `LINE` | `<hr>` line | Stroke color, width |
| Fills (solid color) | `background` style | Single solid fill only |
| Strokes | `border` properties | Width, color, style |
| Corner radius | `borderRadius` | Single radius or first corner value |

## NOT supported

| Feature | Why | Workaround |
|---------|-----|------------|
| Images / fills with images | No image export in v0.2 | Manual `<img>` tag after import |
| Gradients | Inline style limitation | Use solid color or add CSS post-export |
| Shadows / effects | Not in inline styles | Add `boxShadow` manually after import |
| Boolean operations | Figma-specific | Simplify design or flatten before import |
| Component instances with overrides | No component system yet | Import flattened frames |
| Vector paths / icons | No SVG conversion | Export SVG separately, add as `<img>` or inline |
| Text styles (font family) | No web font setup | BluePainter uses system fonts; adjust after export |
| Responsive constraints | Not mapped | Use BluePainter canvas to adjust layout |
| **Bidirectional sync** | Intentionally deferred to v3 | One-way import only |

## Usage

### 1. Figma URL import (requires API)

**In Figma:**
1. Open your file → select a frame or top-level component
2. Copy the file URL: `https://www.figma.com/design/ABC123/My-File`
3. (Optional) Copy a specific frame URL: `https://www.figma.com/design/ABC123/My-File?node-id=123-456`

**In BluePainter:**
1. Open **··· → Import from Figma**
2. **Figma URL** tab → paste file URL (and optional frame URL for specific node)
3. **Personal Access Token**: Get from [figma.com/developers/api#access-tokens](https://www.figma.com/developers/api#access-tokens) (read-only scope)
4. Choose import target:
   - **New FigmaImport page** (dedicated canvas)
   - **Replace MarketingPage** or **Replace DashboardPage** (overwrites existing)
5. Click **Import**

**Requires:** `api/figma-import` endpoint running
- Production: works on live demo
- Local: run `npx vercel dev` or deploy to Vercel

### 2. JSON paste (offline / no token)

**In Figma (via plugin or REST API):**
1. Export Figma file JSON via REST API (`GET /v1/files/:key`) or plugin
2. Copy the entire JSON response

**In BluePainter:**
1. Open **··· → Import from Figma**
2. **Paste JSON** tab → paste Figma JSON
3. Choose import target
4. Click **Import**

**No API required** — runs entirely client-side.

## Import scope

- **Depth:** BluePainter fetches Figma files with `depth=4` (first 4 levels of nesting)
- **Root:** Imports the first top-level frame on the first page, or a specific node if `node-id` is provided
- **Children:** All nested frames, text, and lines within the root are converted

## API endpoint

**`POST /api/figma-import`**

### Authentication

The API accepts Figma tokens in two ways (in order of preference):

1. **Client-side token** (recommended for personal use): Pass `token` in request body. The Studio UI sends the user's personal access token (stored in localStorage).
2. **Server-side token** (recommended for production/team use): Set `FIGMA_TOKEN` environment variable on the API host (Vercel, etc.). When set, users don't need to provide a token.

```bash
# Set server-side token (Vercel)
vercel env add FIGMA_TOKEN

# Or in .env.local for local development
echo "FIGMA_TOKEN=figd_..." >> .env.local
```

### Request

```json
{
  "token": "figd_...",  // Optional if FIGMA_TOKEN env var is set
  "fileUrl": "https://www.figma.com/design/ABC123/My-File",
  "nodeUrl": "https://www.figma.com/design/ABC123/My-File?node-id=123-456"
}
```

### Response

```json
{
  "fileKey": "ABC123",
  "nodeId": "123:456",
  "fileName": "My File",
  "figma": { /* Figma REST API JSON */ }
}
```

### Error responses

- **400** — Invalid file URL or missing token
- **403** — Invalid token or insufficient permissions (needs `file_content:read` scope)
- **404** — File/node not found or API endpoint unavailable
- **502** — Figma API error (network or rate limit)

## After import

1. **Edit on canvas** — select nodes, adjust styles in Inspector
2. **Apply Designer's Receipts** — fix spacing, contrast, CTA copy
3. **Export as React** — **··· → Export & Deploy** → download TSX

## Known limitations

- **One-way only:** Changes in BluePainter do NOT sync back to Figma
- **No component library:** Figma components are flattened to frames
- **Inline styles only:** No Tailwind, CSS modules, or styled-components yet
- **Simple parser:** Auto-layout → flexbox conversion is best-effort; complex nested constraints may not match pixel-perfect
- **Token security:** Personal access tokens are stored in `localStorage` (client-side only). Do not use write-scope tokens.

## Fallback when API is unavailable

If `/api/figma-import` returns 404 (localhost without `vercel dev` or API not deployed), use **Paste JSON** method instead:
1. Fetch Figma file JSON via `curl` or Figma plugin
2. Paste into **Paste JSON** tab
3. Import works offline

## Roadmap

- [ ] Support for images (Figma image fills)
- [ ] SVG conversion for vectors/icons
- [ ] Gradient support
- [ ] Figma component instances → BluePainter component library
- [ ] Bidirectional sync (v3 — see SPEC.md §5)

## FAQ

**Q: Can I push changes back to Figma?**  
A: No. BluePainter → Figma sync is deferred to v3. Use this for one-way design handoff only.

**Q: Why do some colors look different?**  
A: Figma uses RGBA (0-1 scale); we convert to hex/rgba CSS. Slight rounding may occur.

**Q: Why doesn't my Figma component show up?**  
A: Ensure the component is on the first page and is a top-level frame. Nested components inside pages are not selected by default — use `node-id` to import a specific frame.

**Q: Why do I see "Figma API error"?**  
A: Check:
1. Token is valid and has read-only file scope (`file_content:read`)
2. File URL is correct and accessible with your token
3. File is not private unless token has access
4. `/api/figma-import` is deployed or `vercel dev` is running locally

**Server-side token (optional):** Set `FIGMA_TOKEN` env var on the API host (Vercel dashboard → Environment Variables) to skip token entry in the UI.

**Q: Should I use client-side or server-side token?**  
A:
- **Client-side** (personal use): Each user provides their own token. Best for demos and personal projects.
- **Server-side** (`FIGMA_TOKEN` env): One shared token on the API. Best for team deployments where you want users to import without managing tokens.
- **Security note:** Personal access tokens grant read access to your Figma files. Use read-only scope and rotate tokens periodically.

**Q: Can I import multiple files at once?**  
A: Not yet. Import one frame at a time, or paste multiple frames into a single Figma file before importing.

## Related docs

- [SPEC.md](./SPEC.md) — Product roadmap and v1 scope
- [AST_SCOPE.md](./AST_SCOPE.md) — What TSX output is generated from Figma imports
- Figma REST API docs: [figma.com/developers/api](https://www.figma.com/developers/api)
