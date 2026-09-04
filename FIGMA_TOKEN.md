# Figma Token Setup

BluePainter imports designs from Figma using the Figma REST API. You need a **personal access token** with read permissions to fetch file data.

## Quick start

### Option 1: Client-side token (recommended for personal use)

1. Go to [figma.com/developers/api#access-tokens](https://www.figma.com/developers/api#access-tokens)
2. Click **Generate new token**
3. Name it (e.g. "BluePainter import")
4. Select scope: **`file_content:read`** (read-only)
5. Copy the token — it starts with `figd_`
6. In BluePainter Studio: **··· → Import from Figma** → paste token
7. Token is saved in your browser's `localStorage` (never sent to BluePainter servers)

### Option 2: Server-side token (recommended for team/production)

Set the `FIGMA_TOKEN` environment variable on your API host (Vercel, local dev, etc.). When set, users don't need to provide a token.

**Vercel deployment:**
```bash
vercel env add FIGMA_TOKEN
# Paste your token when prompted
```

**Local development:**
```bash
echo "FIGMA_TOKEN=figd_..." >> .env.local
npx vercel dev
```

**When to use server-side:**
- Team shared token for all users
- Production deployment where you don't want users managing tokens
- CI/CD or automated imports

**When to use client-side:**
- Personal projects
- Demos where each user has different Figma access
- Multi-tenant scenarios where each user needs their own token

## Token permissions

BluePainter only needs **read** access. The token must have:
- Scope: `file_content:read`
- Access to the Figma files you want to import

**Do NOT use tokens with write scope** — BluePainter does not write back to Figma in v2 (import-only).

## Security notes

### Client-side tokens
- Stored in browser `localStorage` only (not sent to BluePainter backend)
- Sent directly from your browser to Figma API via `/api/figma-import` proxy
- Never logged or persisted on BluePainter servers
- Rotate tokens periodically (Figma settings → Tokens → revoke old ones)

### Server-side tokens
- Set as environment variable on API host (Vercel, etc.)
- Not visible in client-side code
- Shared across all users of your deployment
- Suitable for team tokens with limited file access

### Best practices
- Use read-only scope (`file_content:read`) — never use full access
- Create separate tokens per project/tool
- Revoke tokens you're no longer using
- If token is compromised: revoke in Figma settings immediately
- For team use: create a service account in Figma with limited file access

## Troubleshooting

### "Figma API access denied" (403)
- Token is invalid, expired, or has wrong permissions
- Token doesn't have access to the file (check file sharing settings)
- Token was revoked
- **Fix:** Create a new token with `file_content:read` scope

### "Figma file not found" (404)
- File URL is incorrect
- File is private and token doesn't have access
- File was deleted or moved
- **Fix:** Check file URL, verify token has access, or make file accessible

### "Figma personal access token required" (400)
- No token provided and `FIGMA_TOKEN` env var not set
- **Fix:** Paste token in UI or set `FIGMA_TOKEN` on API host

### Token not saving in browser
- Browser blocking `localStorage` (incognito mode, privacy settings)
- **Fix:** Use regular browser window or set server-side `FIGMA_TOKEN`

### "Figma import API not found" (404 on /api/figma-import)
- Running localhost without `npx vercel dev`
- API not deployed to production
- **Workaround:** Use **Paste JSON** tab instead — fetch Figma JSON manually and paste

## Manual JSON import (no token needed)

If you can't use a token or API is unavailable:

1. Get Figma file JSON via REST API:
```bash
curl -H "X-Figma-Token: YOUR_TOKEN" \
  "https://api.figma.com/v1/files/YOUR_FILE_KEY?depth=4" > figma.json
```

2. Copy the entire JSON output
3. In BluePainter: **··· → Import from Figma → Paste JSON** tab
4. Paste JSON and click Import

This method runs entirely client-side — no API or token storage involved.

## Token rotation

Rotate tokens every 90 days (Figma recommends every 30-90 days for security):

1. Create new token at [figma.com/developers](https://www.figma.com/developers/api#access-tokens)
2. Update `FIGMA_TOKEN` env var (server-side) or paste new token in UI (client-side)
3. Revoke old token in Figma settings

## FAQ

**Q: Is my token secure?**  
A: Client-side tokens are stored in your browser only. Server-side tokens are environment variables on your API host. BluePainter never stores or logs tokens on its backend. Still, use read-only scope and rotate regularly.

**Q: Can multiple users share one token?**  
A: Yes (server-side `FIGMA_TOKEN`), but each user will have the same Figma file access. For user-specific access, use client-side tokens.

**Q: What if I accidentally commit a token to git?**  
A: Revoke it immediately in Figma settings, then create a new one. Never commit `.env.local` or hardcode tokens in source.

**Q: Does BluePainter write back to Figma?**  
A: No. v2 is **import-only**. Bidirectional sync is deferred to v3 (SPEC.md). Your token only needs `file_content:read`.

## Related docs

- [FIGMA_IMPORT.md](./FIGMA_IMPORT.md) — How Figma import works
- [SPEC.md](./SPEC.md) — Product roadmap and Figma import scope
- Figma API docs: [figma.com/developers/api](https://www.figma.com/developers/api)
