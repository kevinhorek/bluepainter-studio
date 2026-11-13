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

## Import scope & limits

### Node depth
- **Depth:** BluePainter fetches Figma files with `depth=4` (first 4 levels of nesting from the root)
- **Impact:** Deeply nested components beyond 4 levels will be flattened or omitted
- **Workaround:** If critical nested content is missing, flatten your Figma structure before importing

### Import scope
- **Root:** Imports the first top-level frame on the first page, or a specific node if `node-id` is provided
- **Children:** All nested frames, text, and lines within the root (up to depth=4) are converted

### API rate limits
- **Figma API:** 1000 requests per hour per token (enforced by Figma)
- **Response:** HTTP 429 with retry-after guidance
- **Workaround:** Use "Paste JSON" tab (no API call), cache imported files, or rotate tokens

### File size
- **Timeout:** API requests abort after 15-20 seconds
- **Large files:** Files with 500+ nodes or complex vector paths may timeout
- **Workaround:** Import specific frames via node-id URL, or use "Paste JSON" after manual API fetch

### Node count
- **Practical limit:** ~500-1000 converted nodes perform well in the Studio canvas
- **Performance:** Very large imports (2000+ nodes) may cause slow rendering or lag
- **Recommendation:** Import one frame/component at a time rather than entire pages

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

| Code | Error | Common causes | Solution |
|------|-------|---------------|----------|
| **400** | Invalid request | Missing/malformed file URL or node ID | Check URL format and file key |
| **403** | Access denied | Invalid/expired token, insufficient permissions | Generate new token with `file_content:read` at figma.com/developers |
| **404** | Not found | File/node deleted, wrong node ID, or private file | Verify file exists in Figma and token has access |
| **429** | Rate limited | >1000 requests/hour | Wait 5-10 min or use "Paste JSON" method |
| **500** | Server error | Unexpected API failure | Retry or use "Paste JSON" |
| **502** | Figma API error | Figma service down or network issue | Check status.figma.com, retry, or use "Paste JSON" |
| **504** | Timeout | Very large file (>20s fetch) | Import specific frame via node-id or use "Paste JSON" |

### Token permissions
- **Required scope:** `file_content:read`
- **Access level:** Token must have permission to read the target file (personal files always accessible; team files require team member token)
- **Format:** Must start with `figd_` (personal access token)
- **Length:** Typically 40-100 characters
- **OAuth tokens:** Not supported — personal access tokens only

## After import

1. **Edit on canvas** — select nodes, adjust styles in Inspector
2. **Apply Designer's Receipts** — fix spacing, contrast, CTA copy
3. **Export as React** — **··· → Export & Deploy** → download TSX

## Known limitations

### Import behavior
- **One-way only:** Changes in BluePainter do NOT sync back to Figma (bidirectional sync deferred to v3 — see SPEC.md)
- **No component library:** Figma components/instances are flattened to plain frames (no component system yet)
- **Depth limit:** Only first 4 nesting levels are imported (depth=4)
- **Node types:** Only frames, text, lines, and basic shapes are supported (see "NOT supported" table above)

### Conversion fidelity
- **Inline styles only:** No Tailwind, CSS modules, or styled-components yet
- **Auto-layout → flexbox:** Best-effort conversion; complex constraints may not match pixel-perfect
- **Single solid fills:** Gradients, images, and multiple fills are not supported
- **System fonts:** Figma font families are not preserved (BluePainter uses system fonts)
- **Positioning:** Absolute positioning and auto-layout are converted; Figma-specific constraints are not

### Security
- **Token storage:** Personal access tokens are stored in browser `localStorage` (client-side only)
- **Token scope:** Use read-only tokens (`file_content:read`) — never use write-scope tokens
- **Server-side option:** Set `FIGMA_TOKEN` env var on API host to avoid client-side token storage

### Performance
- **Large imports:** Files with >1000 nodes may render slowly in the canvas
- **Rate limits:** Figma API allows 1000 requests/hour per token
- **Timeout:** API calls abort after 15-20 seconds for very large files

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
A: Common causes and fixes:

| Error message | Cause | Fix |
|---------------|-------|-----|
| "Access denied" (403) | Invalid/expired token or insufficient permissions | Generate new token at figma.com/developers with `file_content:read` scope |
| "File not found" (404) | File deleted, wrong URL, or private file without access | Verify file exists in Figma and URL is correct |
| "Rate limit exceeded" (429) | >1000 requests in past hour | Wait 5-10 minutes or use "Paste JSON" method |
| "Timeout" (504) | File too large (>20s fetch) | Import specific frame via node-id or use "Paste JSON" |
| "API not found" (404) | Localhost without `vercel dev` or API not deployed | Run `npx vercel dev` locally or use live demo |

**Server-side token (optional):** Set `FIGMA_TOKEN` env var on the API host (Vercel dashboard → Environment Variables) to skip token entry in the UI. Recommended for team deployments.

**Q: Should I use client-side or server-side token?**  
A:
- **Client-side** (personal use): Each user provides their own token. Best for demos and personal projects.
- **Server-side** (`FIGMA_TOKEN` env): One shared token on the API. Best for team deployments where you want users to import without managing tokens.
- **Security note:** Personal access tokens grant read access to your Figma files. Use read-only scope and rotate tokens periodically.

**Q: Can I import multiple files at once?**  
A: Not yet. Import one frame at a time. To batch import, combine multiple frames into a single Figma page before importing.

**Q: What if my import is missing content?**  
A: Check:
1. **Node depth:** Only first 4 nesting levels are imported (depth=4 limit)
2. **Unsupported types:** Images, gradients, shadows, and vectors are not converted (see "NOT supported" table)
3. **Hidden layers:** Layers with `visible: false` in Figma are skipped
4. **Node-id mismatch:** If using a specific frame URL, ensure the node-id is correct (right-click frame → Copy link)

**Q: How do I import a very large file?**  
A:
1. **Import by frame:** Right-click a specific frame → Copy link → paste that URL (imports only that frame, not the whole file)
2. **Use "Paste JSON":** Manually fetch via `curl` and paste into "Paste JSON" tab (no timeout, offline capable)
3. **Simplify in Figma:** Flatten unnecessary nesting and remove unused layers before importing

**Q: What is the depth=4 limit?**  
A: Figma API allows a `depth` parameter (1-5). BluePainter uses `depth=4` to balance completeness vs. performance. Nodes nested >4 levels deep are omitted. To see all content, flatten your Figma hierarchy or import child frames separately.

## Related docs

- [SPEC.md](./SPEC.md) — Product roadmap and v1 scope
- [AST_SCOPE.md](./AST_SCOPE.md) — What TSX output is generated from Figma imports
- Figma REST API docs: [figma.com/developers/api](https://www.figma.com/developers/api)
