# Team Audit Log

**Status:** Scaffolding only (v0.2) — backend integration required for production (v1)

## Purpose

Track "who changed what, via canvas or code, which receipt fired" per SPEC.md §3 requirement.

## Architecture

```
┌─────────────────┐
│  Learning Loop  │ ← Logs events (canvas/code changes, receipt actions)
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Audit Logger   │ ← Enriches events with team/user context
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Team Backend   │ ← Stores events for audit trail & analytics
└─────────────────┘
```

## Event Schema (v1)

```json
{
  "eventId": "uuid",
  "timestamp": 1693881234567,
  "type": "receipt_fix_applied",
  "data": {
    "fixKey": "contrast",
    "nodeId": "cta-button",
    "ruleId": "contrast"
  },
  "context": {
    "userId": "jane@example.com",
    "userName": "Jane Developer",
    "teamId": "team-uuid",
    "repoUrl": "https://github.com/org/repo",
    "filePath": "src/components/PricingCard.tsx",
    "branch": "feature/pricing-update",
    "commitSha": "abc123...",
    "surface": "vscode-extension"
  }
}
```

## Implementation Status

### v0.2 (Current — Prototype)
- ✅ Learning loop logs events to localStorage
- ✅ Scaffolding in `src/utils/auditLog.js`
- ⏸️ No team backend integration
- ⏸️ No user/team context enrichment
- ⏸️ No audit log UI

### v1 (Production)
- ⬜ Team backend API endpoint (`POST /api/audit-log`)
- ⬜ User authentication & team context detection
- ⬜ Event batching & retry logic
- ⬜ Offline fallback to localStorage
- ⬜ Admin UI for audit log queries
- ⬜ Retention policy configuration
- ⬜ CSV/JSON export for compliance

## Client Buffer Management (v0.2 → v1)

### Buffer Behavior

**v0.2 (current):**
- Events buffer to `localStorage` with key `bluepainter-audit-log-buffer`
- Max buffer size: 500 events (FIFO trimming)
- No automatic flushing to backend
- Emergency flush on localStorage quota exceeded

**v1 (production):**
- Buffer locally until batch size (20 events) or timeout (5 seconds)
- Flush to backend via `POST /api/audit-log/batch`
- Retry failed batches with exponential backoff (1s, 2s, 4s, 8s, 16s max)
- Fall back to localStorage if backend unreachable
- Flush on app close / extension deactivate
- Periodic flush every 30 seconds if events pending

### Integration Points

#### Learning Loop
`src/utils/learningLoop.js` calls `enrichEventWithContext()` and `sendToAuditLog()` in v1:

```js
log(eventType, data) {
  const event = { type: eventType, timestamp: Date.now(), data };
  
  // v0.2: localStorage only
  this._write([...events, event]);
  
  // v1: Team audit log
  const enriched = enrichEventWithContext(event);
  await sendToAuditLog(enriched);
}
```

#### Buffer Utilities (v0.2+)
```js
import { 
  getAuditBuffer, 
  getAuditBufferStats, 
  clearAuditBuffer,
  flushAuditBuffer 
} from './auditLog.js';

// Inspect buffer
const buffer = getAuditBuffer();
console.log(buffer); // Array of buffered events

// Get buffer statistics
const stats = getAuditBufferStats();
console.log(stats);
// {
//   totalEvents: 42,
//   eventsLastHour: 10,
//   eventsLastDay: 42,
//   oldestEvent: 1693881234567,
//   newestEvent: 1693895634567,
//   bufferUsage: "8.4%",
//   eventTypes: { receipt_fix_applied: 20, receipt_dismissed: 22 }
// }

// Clear buffer (use with caution)
const cleared = clearAuditBuffer();

// Flush buffer to backend (v1)
const result = await flushAuditBuffer();
// { sent: 42, failed: 0 }
```

### VS Code Extension
`extension/lib/learningLoop.js` would detect:
- User from `vscode.env.username` or git config
- Team from workspace `.vscode/bluepainter.json`
- File path from `activeTextEditor.document.uri`
- Git branch from workspace root

### Web App
`src/utils/learningLoop.js` would detect:
- User from authentication state (v1 when auth is added)
- Team from URL params or localStorage
- File from active canvas state
- Surface: `"web-app"`

## Privacy & Security

- **Opt-in**: Team admin enables audit logging in settings
- **Anonymous mode**: Events without user identity (team-level only)
- **No code content**: Only metadata (file paths, receipt IDs, fix types)
- **Retention**: Configurable period (default 90 days)
- **Export**: CSV/JSON for compliance audits

## Backend Requirements (v1)

### API Contract

The backend API must implement these endpoints for v1 production:

#### 1. Batch Event Submission

```
POST /api/audit-log/batch
Content-Type: application/json
Authorization: Bearer <team-token>

Request:
{
  "events": [
    {
      "eventId": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": 1693881234567,
      "type": "receipt_fix_applied",
      "data": {
        "fixKey": "contrast",
        "nodeId": "cta-button",
        "ruleId": "contrast"
      },
      "context": {
        "userId": "jane@example.com",
        "userName": "Jane Developer",
        "teamId": "team-uuid",
        "repoUrl": "https://github.com/org/repo",
        "filePath": "src/components/PricingCard.tsx",
        "branch": "feature/pricing-update",
        "commitSha": "abc123",
        "surface": "vscode-extension"
      }
    }
  ]
}

Response (200 OK):
{
  "accepted": 1,
  "rejected": 0,
  "errors": []
}

Response (400 Bad Request):
{
  "error": "Invalid event schema",
  "details": "events[0].timestamp must be a number"
}

Response (401 Unauthorized):
{
  "error": "Invalid or missing team token"
}

Response (429 Too Many Requests):
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

**Requirements:**
- Accept batches of up to 100 events
- Idempotent (same eventId should not create duplicates)
- Return partial success (accept valid events, reject invalid)
- Support team-level auth tokens (not user tokens)
- Rate limit: 1000 events/hour per team

#### 2. Query Events

```
GET /api/audit-log/query?teamId={teamId}&startDate={timestamp}&endDate={timestamp}&userId={userId}&eventType={type}&limit={limit}&offset={offset}
Authorization: Bearer <team-admin-token>

Query Parameters:
- teamId (required): Team UUID
- startDate (optional): Unix timestamp (ms) for range start
- endDate (optional): Unix timestamp (ms) for range end
- userId (optional): Filter by user email
- eventType (optional): Filter by event type (comma-separated for multiple)
- filePath (optional): Filter by file path (supports wildcards)
- limit (optional, default 50, max 500): Number of results per page
- offset (optional, default 0): Pagination offset

Response (200 OK):
{
  "events": [
    { "eventId": "...", "timestamp": ..., "type": "...", "data": {...}, "context": {...} }
  ],
  "total": 142,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}

Response (403 Forbidden):
{
  "error": "Insufficient permissions",
  "details": "Team admin role required"
}
```

**Requirements:**
- Only team admins can query
- Support pagination for large result sets
- Efficient indexing on timestamp, userId, eventType
- Return results in descending timestamp order

#### 3. Export Events

```
POST /api/audit-log/export
Content-Type: application/json
Authorization: Bearer <team-admin-token>

Request:
{
  "teamId": "team-uuid",
  "startDate": 1693881234567,
  "endDate": 1694000000000,
  "format": "csv",
  "filters": {
    "userId": "jane@example.com",
    "eventType": ["receipt_fix_applied", "receipt_dismissed"]
  }
}

Response (200 OK):
{
  "exportId": "export-uuid",
  "status": "pending",
  "estimatedSize": 1024000,
  "expiresAt": 1694000000000
}

Poll export status:
GET /api/audit-log/export/{exportId}

Response when ready (200 OK):
{
  "exportId": "export-uuid",
  "status": "ready",
  "downloadUrl": "https://cdn.example.com/exports/export-uuid.csv",
  "expiresAt": 1694000000000,
  "size": 1024000
}
```

**Requirements:**
- Support CSV and JSON export formats
- Asynchronous processing for large exports
- Time-limited download URLs (24 hour expiry)
- Max export size: 10 MB or 100k events

### Database Schema

```sql
CREATE TABLE audit_events (
  event_id UUID PRIMARY KEY,
  team_id UUID NOT NULL,
  user_id VARCHAR(255),
  timestamp BIGINT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  context JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_event_id UNIQUE (event_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_team_time ON audit_events(team_id, timestamp DESC);
CREATE INDEX idx_audit_user ON audit_events(user_id, timestamp DESC);
CREATE INDEX idx_audit_type ON audit_events(team_id, event_type, timestamp DESC);
CREATE INDEX idx_audit_file_path ON audit_events USING gin ((context->'filePath'));

-- Retention policy (optional - delete events older than 90 days)
CREATE INDEX idx_audit_created_at ON audit_events(created_at) WHERE created_at < NOW() - INTERVAL '90 days';
```

**Schema Notes:**
- `event_id`: UUID v4, client-generated (idempotency)
- `team_id`: References teams table
- `user_id`: User email or identifier (nullable for anonymous)
- `timestamp`: Event time in Unix milliseconds
- `data`: Event-specific payload (varies by type)
- `context`: Team/user/file context (see Event Schema)
- `created_at`: Server insertion time (for retention)

## Use Cases

### 1. Design System Compliance Audit
**Query**: Show all receipt violations by user in last 30 days
```js
queryAuditLog({
  teamId: 'team-uuid',
  eventType: ['receipt_fix_applied', 'receipt_dismissed'],
  dateRange: { start: Date.now() - 30 * 24 * 60 * 60 * 1000, end: Date.now() }
})
```

### 2. Activation Metric
**Query**: Count users who completed canvas ↔ code round-trip
```js
queryAuditLog({
  teamId: 'team-uuid',
  eventType: ['canvas_to_code_sync', 'code_to_canvas_sync'],
  groupBy: 'userId'
})
```

### 3. Policy Change History
**Query**: Show who changed which policy settings
```js
queryAuditLog({
  teamId: 'team-uuid',
  eventType: 'policy_change',
  orderBy: 'timestamp DESC'
})
```

## Testing

### Prototype Testing (v0.2)
```js
import { enrichEventWithContext, sendToAuditLog } from './auditLog.js';

const event = {
  type: 'receipt_fix_applied',
  timestamp: Date.now(),
  data: { fixKey: 'contrast', nodeId: 'cta-button' }
};

const enriched = enrichEventWithContext(event);
console.log(enriched); // Context is empty in v0.2 (no team backend)

await sendToAuditLog(enriched); // Buffers to localStorage
```

### v1 Testing
- Mock team backend endpoint
- Verify event enrichment with user/team context
- Test offline fallback to localStorage
- Test batch flushing on app close

## Related Docs
- [SPEC.md §3](../SPEC.md) — Learning loop requirements
- [src/utils/learningLoop.js](../src/utils/learningLoop.js) — Event logging
- [extension/lib/learningLoop.js](../extension/lib/learningLoop.js) — Extension implementation
