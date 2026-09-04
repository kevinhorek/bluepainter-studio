# Database Migrations

This directory contains SQL schema migrations for the BluePainter audit log backend.

## Overview

The audit log backend stores learning loop events (receipt fixes, dismissals, policy changes) for team analytics and compliance. The database is **optional** — the app works without it (soft-fail mode).

## Quick Start for Pilots

### Do I need this?

**No, if:**
- Using BluePainter Studio in demo/validation mode
- Using VS Code extension locally without team sync
- Not collecting team audit data

**Yes, if:**
- Deploying for a production team
- Want persistent audit trail across users
- Need compliance/analytics from learning loop data

### Setup Steps

#### 1. Choose a Database

**Option A: Supabase (Recommended for pilots)**
- Create free project at https://supabase.com
- Go to Project Settings → Database
- Copy connection string (format: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`)

**Option B: Vercel Postgres**
- Add Postgres in your Vercel project dashboard
- Connection string auto-injected as `POSTGRES_URL`

**Option C: Self-hosted**
- Postgres 12+ with `uuid-ossp` extension
- Create database: `createdb bluepainter_prod`

#### 2. Set Environment Variable

**Vercel deployment:**
```bash
vercel env add DATABASE_URL
# Paste your connection string when prompted
```

**Local development:**
```bash
# .env file (add to .gitignore)
DATABASE_URL=postgresql://localhost:5432/bluepainter_dev
```

**Vercel Dashboard:**
- Project Settings → Environment Variables
- Add `DATABASE_URL` (or `POSTGRES_URL`)
- Set for Production, Preview, and Development

#### 3. Run Migration

```bash
# Using psql (recommended)
psql $DATABASE_URL -f docs/migrations/001_audit_events.sql

# Or using Supabase SQL Editor
# 1. Open SQL Editor in Supabase dashboard
# 2. Copy/paste contents of 001_audit_events.sql
# 3. Run query
```

#### 4. Verify

```bash
# Check table exists
psql $DATABASE_URL -c "\dt audit_events"

# Check it's empty (new deployment)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM audit_events;"
```

#### 5. Deploy

```bash
# Redeploy to pick up DATABASE_URL
vercel --prod

# Or push to trigger automatic deployment
git push origin main
```

### Testing Soft-Fail Mode

**Without DATABASE_URL (demo/validation):**
- API accepts events but doesn't persist
- Returns `{ "mode": "soft-fail" }` in response
- Studio buffers to localStorage
- No team-wide audit data

**With DATABASE_URL (production):**
- Events persist to Postgres
- Query via `/api/audit-log/query`
- Team-wide audit trail
- 90-day retention (configurable)

## Migration Files

### `001_audit_events.sql` - Initial Schema

Creates:
- `audit_events` table (UUID primary key, JSONB data/context)
- Indexes for team-scoped queries, user/type filtering
- Retention cleanup function (`cleanup_old_audit_events`)

**Schema:**
```sql
CREATE TABLE audit_events (
  event_id UUID PRIMARY KEY,
  team_id UUID,
  user_id VARCHAR(255),
  timestamp BIGINT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  context JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Troubleshooting

### Events not persisting

**Check 1: DATABASE_URL set?**
```bash
# Vercel
vercel env ls

# Local
echo $DATABASE_URL
```

**Check 2: Migration ran successfully?**
```bash
psql $DATABASE_URL -c "\dt audit_events"
# Should show: public | audit_events | table | postgres
```

**Check 3: API logs**
```bash
# Vercel logs
vercel logs --follow

# Look for:
# ✓ "[AuditLog] Sent X events to backend"
# ✗ "[AuditLog] DATABASE_URL not configured — skipping persistence (soft-fail mode)"
```

### Connection errors

**SSL required?**
- Most hosted Postgres (Supabase, Vercel, AWS RDS) require SSL
- API auto-enables SSL in production (`NODE_ENV=production`)
- Add `?sslmode=require` to connection string if needed

**Network timeout?**
- Check firewall allows outbound connections to database
- Vercel Serverless Functions have 10s timeout (upgrade for longer)

### Permission denied

Grant required permissions:
```sql
GRANT CREATE, SELECT, INSERT, DELETE ON DATABASE bluepainter_prod TO your_user;
GRANT CREATE ON SCHEMA public TO your_user;
```

## Retention Policy

Default: 90 days (configurable)

**Manual cleanup:**
```sql
-- Delete events older than 90 days
SELECT cleanup_old_audit_events(90);

-- Custom retention (e.g., 30 days)
SELECT cleanup_old_audit_events(30);
```

**Automated cleanup (Supabase):**
1. Database → Cron Jobs
2. Create job: Daily at 2am UTC
3. SQL: `SELECT cleanup_old_audit_events(90);`

**Automated cleanup (self-hosted):**
```bash
# Add to crontab
0 2 * * * psql $DATABASE_URL -c "SELECT cleanup_old_audit_events(90);" > /dev/null 2>&1
```

## Related Documentation

- [docs/AUDIT_BACKEND.md](../AUDIT_BACKEND.md) - Full setup guide
- [docs/AUDIT_LOG.md](../AUDIT_LOG.md) - API contract & event schema
- [api/audit-log/batch.js](../../api/audit-log/batch.js) - Batch submission endpoint
- [api/audit-log/query.js](../../api/audit-log/query.js) - Query endpoint

## Support

- Audit backend is **optional** — app works without it
- Soft-fail mode is the graceful degradation path
- For production teams, DATABASE_URL is recommended but not required
- Questions: See docs/AUDIT_BACKEND.md or open an issue
