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

## Integration Points

### Learning Loop
`src/utils/learningLoop.js` calls `enrichEventWithContext()` and `sendToAuditLog()` in v1:

```js
log(eventType, data) {
  const event = { type: eventType, timestamp: Date.now(), data };
  
  // v0.2: localStorage only
  this._write([...events, event]);
  
  // v1: Team audit log
  const enriched = enrichEventWithContext(event);
  sendToAuditLog(enriched);
}
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

### API Endpoint
```
POST /api/audit-log
Content-Type: application/json
Authorization: Bearer <team-token>

{
  "events": [
    { "eventId": "...", "timestamp": ..., "type": "...", "data": {...}, "context": {...} }
  ]
}
```

### Query Endpoint
```
GET /api/audit-log?teamId=...&startDate=...&endDate=...&userId=...&eventType=...
Authorization: Bearer <team-admin-token>

Response:
{
  "events": [...],
  "total": 42,
  "page": 1,
  "pageSize": 50
}
```

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
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_team_time ON audit_events(team_id, timestamp DESC);
CREATE INDEX idx_audit_user ON audit_events(user_id);
CREATE INDEX idx_audit_type ON audit_events(event_type);
```

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
