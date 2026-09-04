# Testing Audit Backend (PR #44)

## Quick Verification

### 1. Code Structure ✅
```bash
# Verify API endpoints exist
ls -la api/audit-log/
# batch.js, query.js

# Verify syntax
node -c api/audit-log/batch.js
node -c api/audit-log/query.js

# Verify lint passes
npm run lint
```

### 2. Build Test ✅
```bash
npm run build
# Should complete with no errors
# Warning about >500kB chunk is expected (per AGENTS.md)
```

### 3. Local Development (Soft-Fail Mode)

**Without DATABASE_URL configured:**

```bash
# Start Vite dev server (frontend only)
npm run dev
# → http://localhost:5173

# Studio buffers to localStorage
# No backend persistence (graceful degradation)
```

**Testing with Vercel dev (requires Vercel CLI):**

```bash
# Install Vercel CLI (if not already)
npm install -g vercel

# Start full dev environment
npm run dev:full
# → Vite + API endpoints on http://localhost:3000

# Test batch endpoint
curl -X POST http://localhost:3000/api/audit-log/batch \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "eventId": "test-123",
      "timestamp": 1693881234567,
      "type": "receipt_fix_applied",
      "data": { "fixKey": "contrast", "nodeId": "test" },
      "context": { "teamId": "test-team", "surface": "web-app" }
    }]
  }'

# Expected: { "accepted": 1, "rejected": 0, "errors": [], "mode": "soft-fail" }
```

### 4. Production Testing (With DATABASE_URL)

**Prerequisites:**
1. Postgres database (Supabase, Vercel Postgres, or self-hosted)
2. Run migration: `psql $DATABASE_URL -f docs/migrations/001_audit_events.sql`
3. Set `DATABASE_URL` environment variable

**Deploy to Vercel:**
```bash
# Set environment variable
vercel env add DATABASE_URL
# Paste Postgres connection string

# Deploy
vercel --prod

# Test batch endpoint (production)
curl -X POST https://your-deployment.vercel.app/api/audit-log/batch \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "eventId": "prod-test-'"$(date +%s)"'",
      "timestamp": '"$(date +%s)000"',
      "type": "receipt_fix_applied",
      "data": { "fixKey": "contrast", "nodeId": "test" },
      "context": { "teamId": "test-team", "surface": "web-app" }
    }]
  }'

# Expected: { "accepted": 1, "rejected": 0, "errors": [] }
# (no "mode" field = database persistence active)

# Verify in database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM audit_events;"
```

## Manual Testing Checklist

### Studio Integration

- [ ] Start `npm run dev`
- [ ] Open browser console
- [ ] Perform any receipt action (fix, dismiss)
- [ ] Check console for `[AuditLog]` and `[LearningLoop]` logs
- [ ] Inspect localStorage buffer:
  ```js
  JSON.parse(localStorage.getItem('bluepainter-audit-log-buffer'))
  ```
- [ ] Verify events are buffered correctly

### Extension Integration

- [ ] Set `.vscode/settings.json`:
  ```json
  {
    "bluepainter.auditBackendUrl": "https://your-backend.vercel.app/api/audit-log"
  }
  ```
- [ ] Open VS Code extension host
- [ ] Trigger receipt action
- [ ] Check Output panel (BluePainter channel) for sync logs

### API Endpoints

**Batch Submission:**
- [ ] POST valid event → 200 OK, `{ accepted: 1 }`
- [ ] POST invalid event → 400 Bad Request with error details
- [ ] POST empty array → 400 Bad Request
- [ ] POST 101 events → 400 Bad Request (max 100)
- [ ] POST duplicate eventId → idempotent (no duplicates in DB)

**Query:**
- [ ] GET with teamId → returns events for team
- [ ] GET with date range → returns filtered events
- [ ] GET with pagination → respects limit/offset
- [ ] GET without DATABASE_URL → returns empty result

## Known Limitations (By Design)

1. **Vercel Dev Required for API Testing:**
   - `npm run dev` only runs Vite (frontend)
   - Use `npm run dev:full` or `vercel dev` to test API endpoints
   - Alternative: Deploy to Vercel and test remotely

2. **Soft-Fail Mode:**
   - Without DATABASE_URL, API accepts but doesn't persist
   - Studio continues to work (localStorage buffer)
   - No errors thrown (graceful degradation)

3. **Context Detection (TODO for v2):**
   - `userId`, `teamId` currently null (enrichment not implemented)
   - File context detection needs git integration
   - See TODOs in `src/utils/auditLog.js:50-62`

## Troubleshooting

### "fetch failed" when testing API locally
→ Use `npm run dev:full` instead of `npm run dev`

### Events not appearing in database
→ Check DATABASE_URL is set and migration ran successfully

### localStorage quota exceeded
→ Events will auto-flush to backend or emergency export to console

### Lint errors
→ Run `npm run lint` - should pass with 0 errors

## Success Criteria

✅ Code passes lint (`npm run lint`)  
✅ Build succeeds (`npm run build`)  
✅ API endpoints have correct structure (Vercel serverless)  
✅ Soft-fail mode works without DATABASE_URL  
✅ Documentation complete (AUDIT_BACKEND.md)  
✅ No fake credentials in code or docs  
✅ PR created and ready for review  

## Related Docs

- [docs/AUDIT_BACKEND.md](../docs/AUDIT_BACKEND.md) — Full setup guide
- [docs/AUDIT_LOG.md](../docs/AUDIT_LOG.md) — API contract
- [docs/migrations/001_audit_events.sql](../docs/migrations/001_audit_events.sql) — Schema
- [SPEC.md §3](../SPEC.md) — Learning loop requirements
