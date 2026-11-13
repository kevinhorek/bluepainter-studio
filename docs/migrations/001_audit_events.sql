-- Team Audit Log - Postgres Schema Migration
-- SPEC.md §3 requirement: "Audit log: who changed what, via canvas or code, which receipt fired"
-- 
-- This schema implements the v1 production backend for team audit logging.
-- Per docs/AUDIT_LOG.md §Database Schema
--
-- Prerequisites:
-- - Postgres 12+ (for JSONB and GIN indexes)
-- - UUID extension enabled: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- Environment variables required:
-- - DATABASE_URL or POSTGRES_URL: Postgres connection string
--   Example: postgresql://user:password@host:5432/database
--
-- Usage:
-- psql $DATABASE_URL -f docs/migrations/001_audit_events.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main audit events table
CREATE TABLE IF NOT EXISTS audit_events (
  -- Primary key: client-generated UUID for idempotency
  event_id UUID PRIMARY KEY,
  
  -- Team context (required for team-scoped queries)
  team_id UUID,
  
  -- User context (nullable for anonymous mode)
  user_id VARCHAR(255),
  
  -- Event timestamp from client (Unix milliseconds)
  timestamp BIGINT NOT NULL,
  
  -- Event type (receipt_fix_applied, receipt_dismissed, etc.)
  event_type VARCHAR(50) NOT NULL,
  
  -- Event-specific payload (varies by type)
  data JSONB NOT NULL,
  
  -- Team/user/file context (see docs/AUDIT_LOG.md §Event Schema)
  context JSONB NOT NULL,
  
  -- Server insertion timestamp (for retention policy)
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure idempotency (client-generated event_id must be unique)
  CONSTRAINT unique_event_id UNIQUE (event_id)
);

-- Indexes for efficient querying per docs/AUDIT_LOG.md §Backend Requirements

-- Primary query pattern: team + time range
CREATE INDEX IF NOT EXISTS idx_audit_team_time 
  ON audit_events(team_id, timestamp DESC);

-- User activity queries
CREATE INDEX IF NOT EXISTS idx_audit_user 
  ON audit_events(user_id, timestamp DESC);

-- Event type filtering
CREATE INDEX IF NOT EXISTS idx_audit_type 
  ON audit_events(team_id, event_type, timestamp DESC);

-- File path queries (GIN index for JSONB text search)
CREATE INDEX IF NOT EXISTS idx_audit_file_path 
  ON audit_events USING gin ((context->'filePath'));

-- Retention policy support (find old events to delete)
-- Creates partial index only for events older than 90 days
CREATE INDEX IF NOT EXISTS idx_audit_created_at 
  ON audit_events(created_at) 
  WHERE created_at < NOW() - INTERVAL '90 days';

-- Optional: Retention cleanup function
-- Run this periodically (e.g., daily cron job) to enforce retention policy
-- Default: 90 days, but configurable per team
CREATE OR REPLACE FUNCTION cleanup_old_audit_events(retention_days INT DEFAULT 90)
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM audit_events
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT cleanup_old_audit_events(90); -- Delete events older than 90 days

-- Optional: Teams table reference (if implementing team-scoped auth)
-- Uncomment if you want referential integrity for team_id
-- 
-- CREATE TABLE IF NOT EXISTS teams (
--   team_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT NOW()
-- );
-- 
-- ALTER TABLE audit_events
--   ADD CONSTRAINT fk_audit_team 
--   FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE;

-- Verify schema
SELECT 
  'audit_events table created successfully' AS status,
  COUNT(*) AS existing_events
FROM audit_events;
