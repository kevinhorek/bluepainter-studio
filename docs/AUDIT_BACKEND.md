# Audit Backend Setup Guide

This guide explains how to configure the production team audit log backend for BluePainter.

## Overview

The audit backend implements SPEC §3 requirement: "Audit log: who changed what, via canvas or code, which receipt fired."

**Features:**
- Batch event submission (`POST /api/audit-log/batch`)
- Event queries with team-scoping (`GET /api/audit-log/query`)
- Graceful degradation when database is not configured
- Automatic retry with exponential backoff
- localStorage buffer fallback

## Architecture

```
┌─────────────────┐
│  Studio / Ext   │ ← Logs learning loop events
└────────┬────────┘
         │
         v
┌─────────────────┐
│  API Endpoints  │ ← Vercel serverless functions
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Postgres DB    │ ← Team audit events storage
└─────────────────┘
```

## Environment Variables

### Required for Production Backend

#### `DATABASE_URL` or `POSTGRES_URL`
PostgreSQL connection string for audit events storage.

**Format:**
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**Example:**
```bash
# Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Vercel Postgres
POSTGRES_URL=postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require

# Local development
DATABASE_URL=postgresql://localhost:5432/bluepainter_dev
```

**Where to set:**
- **Vercel:** Project Settings → Environment Variables
- **Supabase:** Project Settings → Database → Connection String
- **Local dev:** `.env` file (add to `.gitignore`)

**Required permissions:**
- `CREATE TABLE` (for schema migration)
- `INSERT` (for event submission)
- `SELECT` (for queries)
- `DELETE` (for retention cleanup)

### Optional - Studio Configuration

#### `VITE_AUDIT_API_URL`
Base URL for the audit backend API.

**Default:** `/api/audit-log` (uses Vercel dev server in development)

**When to set:**
- Custom backend deployment (non-Vercel)
- Separate audit service
- Cross-origin API

**Example:**
```bash
# Production deployment
VITE_AUDIT_API_URL=https://audit.example.com/api/audit-log

# Staging environment
VITE_AUDIT_API_URL=https://staging-api.example.com/audit-log

# Local development (default)
# VITE_AUDIT_API_URL=/api/audit-log  # (implicit default)
```

**Where to set:**
- **Vercel:** Project Settings → Environment Variables → Add `VITE_` prefix
- **Local dev:** `.env` file
- **Build time:** Injected during `vite build`

### Optional - VS Code Extension Configuration

#### `bluepainter.auditBackendUrl`
Workspace setting for extension audit event sync.

**Format:** Full URL to audit backend API (including `/api/audit-log` path)

**Example (.vscode/settings.json):**
```json
{
  "bluepainter.auditBackendUrl": "https://audit.example.com/api/audit-log"
}
```

**Behavior:**
- When **set:** Extension syncs learning loop events to backend
- When **unset:** Events stay local-only (VS Code globalState)

**Per-workspace or user-global:**
- Workspace: `.vscode/settings.json` (team default)
- User: VS Code Settings UI → Extensions → BluePainter

## Database Setup

### 1. Create Database

**Option A: Supabase (recommended)**
1. Create project at https://supabase.com
2. Copy connection string from Project Settings → Database
3. Set as `DATABASE_URL` environment variable

**Option B: Vercel Postgres**
1. Add Postgres in Vercel project dashboard
2. Copy `POSTGRES_URL` from Storage → Postgres → .env.local tab
3. Connection string auto-injected in Vercel deployments

**Option C: Self-hosted Postgres**
1. Install Postgres 12+ with `uuid-ossp` extension
2. Create database: `createdb bluepainter_prod`
3. Set `DATABASE_URL` to connection string

### 2. Run Schema Migration

```bash
# Using psql
psql $DATABASE_URL -f docs/migrations/001_audit_events.sql

# Or via Supabase SQL Editor
# Copy/paste contents of docs/migrations/001_audit_events.sql
```

**What this creates:**
- `audit_events` table with JSONB columns for flexible event schema
- Indexes for team-scoped queries, user filtering, event types
- Retention policy function (`cleanup_old_audit_events`)

**Verify migration:**
```sql
SELECT 'audit_events table created successfully' AS status,
       COUNT(*) AS existing_events
FROM audit_events;
```

### 3. Verify API Endpoints

**Test batch submission:**
```bash
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
```

**Expected response (soft-fail mode when DATABASE_URL missing):**
```json
{
  "accepted": 1,
  "rejected": 0,
  "errors": [],
  "mode": "soft-fail"
}
```

**Expected response (with DATABASE_URL):**
```json
{
  "accepted": 1,
  "rejected": 0,
  "errors": []
}
```

**Test query:**
```bash
curl "http://localhost:3000/api/audit-log/query?teamId=test-team&limit=10"
```

## Deployment Checklist

### Vercel Deployment

1. **Set environment variables:**
   ```bash
   vercel env add DATABASE_URL
   # Paste your Postgres connection string
   
   vercel env add VITE_AUDIT_API_URL
   # Optional: only if using custom backend URL
   ```

2. **Deploy:**
   ```bash
   npm run build
   vercel --prod
   ```

3. **Run migration:**
   ```bash
   # SSH into Vercel Postgres or use Supabase SQL Editor
   psql $DATABASE_URL -f docs/migrations/001_audit_events.sql
   ```

4. **Verify:**
   - Check Vercel logs for `[AuditLog]` entries
   - Test event submission via Studio
   - Query events via API endpoint

### Local Development

1. **Install Postgres locally:**
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14
   
   # Create database
   createdb bluepainter_dev
   ```

2. **Set environment variables:**
   ```bash
   # .env
   DATABASE_URL=postgresql://localhost:5432/bluepainter_dev
   VITE_AUDIT_API_URL=/api/audit-log
   ```

3. **Run migration:**
   ```bash
   psql $DATABASE_URL -f docs/migrations/001_audit_events.sql
   ```

4. **Start dev server:**
   ```bash
   # Terminal 1: Vite dev server
   npm run dev
   
   # Terminal 2: Vercel dev (includes API endpoints)
   npm run dev:full
   ```

5. **Test in Studio:**
   - Open http://localhost:5173
   - Perform any receipt action (fix, dismiss, etc.)
   - Check browser console for `[AuditLog]` logs
   - Query buffer: `localStorage.getItem('bluepainter-audit-log-buffer')`

## Monitoring & Maintenance

### Check Buffer Status

**In browser console:**
```js
import { getAuditBufferStats } from './utils/auditLog.js';
console.log(getAuditBufferStats());
```

**Example output:**
```json
{
  "totalEvents": 42,
  "eventsLastHour": 10,
  "eventsLastDay": 42,
  "oldestEvent": 1693881234567,
  "newestEvent": 1693895634567,
  "bufferUsage": "8.4%",
  "eventTypes": {
    "receipt_fix_applied": 20,
    "receipt_dismissed": 22
  }
}
```

### Manual Flush

**In browser console:**
```js
import { flushAuditBuffer } from './utils/auditLog.js';
await flushAuditBuffer();
// Returns: { sent: 42, failed: 0 }
```

### Database Retention

**Run cleanup periodically (e.g., daily cron):**
```sql
-- Delete events older than 90 days
SELECT cleanup_old_audit_events(90);

-- Custom retention (e.g., 30 days)
SELECT cleanup_old_audit_events(30);
```

**Set up automated cleanup (Supabase):**
1. Go to Database → Cron Jobs
2. Create new job: Daily at 2am UTC
3. SQL: `SELECT cleanup_old_audit_events(90);`

## Troubleshooting

### Events not reaching backend

**Check 1: Backend URL configured?**
```js
// Browser console
console.log(import.meta.env.VITE_AUDIT_API_URL);
// Should output: "/api/audit-log" or custom URL
```

**Check 2: Database connection**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM audit_events;"
```

**Check 3: Vercel logs**
```bash
vercel logs --follow
# Look for [AuditLog] entries
```

**Check 4: Buffer status**
```js
// Browser console
localStorage.getItem('bluepainter-audit-log-buffer');
// If events are piling up, backend may be unreachable
```

### Soft-fail mode (no DATABASE_URL)

**Symptom:** API returns `{ mode: "soft-fail" }`

**Behavior:**
- API accepts events but doesn't persist
- Studio continues buffering to localStorage
- No queries available

**Fix:**
1. Set `DATABASE_URL` environment variable
2. Redeploy Vercel project
3. Manually flush buffer after redeployment

### Extension not syncing

**Check 1: Workspace setting**
```json
// .vscode/settings.json
{
  "bluepainter.auditBackendUrl": "https://your-backend.com/api/audit-log"
}
```

**Check 2: Extension logs**
- Open VS Code Output panel
- Select "BluePainter" from dropdown
- Look for `[LearningLoop]` entries

## Security & Privacy

### Data Collected
- Event type (receipt_fix_applied, receipt_dismissed, etc.)
- Timestamp
- File path (no code content)
- Team/user IDs (when configured)
- Git branch/commit SHA (metadata only)

### Data NOT Collected
- Source code content
- Secrets or credentials
- User input text (except receipt actions)
- Design files (Figma tokens, assets)

### Access Control
- Queries require team-scoped filtering
- User/team context optional (anonymous mode supported)
- Database credentials never exposed to client
- CORS restricted to configured origins

### Compliance
- 90-day retention by default (configurable)
- Manual export to CSV/JSON for audits
- GDPR-compatible (personal data is optional)
- SOC2-ready audit trail

## Related Documentation

- [docs/AUDIT_LOG.md](./AUDIT_LOG.md) — Full API contract and schema
- [SPEC.md §3](../SPEC.md) — Learning loop requirements
- [docs/migrations/001_audit_events.sql](./migrations/001_audit_events.sql) — Database schema
- [src/utils/auditLog.js](../src/utils/auditLog.js) — Client implementation
