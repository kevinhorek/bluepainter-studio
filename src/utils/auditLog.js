/**
 * Team Audit Log Scaffolding (v1 → production)
 * 
 * SPEC.md §3 requirement: "Audit log: who changed what, via canvas or code, which receipt fired"
 * 
 * This module provides the foundation for team-level audit logging of learning loop events.
 * 
 * ## v0.2 (localStorage prototype)
 * - Events are logged to localStorage only
 * - No user/team context
 * - Used for validation sessions and local development
 * 
 * ## v1 (production)
 * - Events include user identity and team context
 * - Events are sent to a team backend (API endpoint TBD)
 * - Fallback to localStorage when offline
 * - Audit log UI for team admins
 * 
 * ## Event Schema (v1)
 * 
 * ```json
 * {
 *   "eventId": "uuid",
 *   "timestamp": 1693881234567,
 *   "type": "receipt_fix_applied",
 *   "data": { ... },
 *   "context": {
 *     "userId": "user@example.com",
 *     "userName": "Jane Developer",
 *     "teamId": "team-uuid",
 *     "repoUrl": "https://github.com/org/repo",
 *     "filePath": "src/components/PricingCard.tsx",
 *     "branch": "feature/pricing-update",
 *     "commitSha": "abc123...",
 *     "surface": "vscode-extension" | "web-app" | "electron-app"
 *   }
 * }
 * ```
 * 
 * ## Privacy & Security
 * 
 * - User identity is opt-in per team settings
 * - Anonymous mode available for sensitive repos
 * - No code content is logged, only metadata (file paths, receipt IDs, fix types)
 * - Audit retention period is configurable (default 90 days)
 */

// Placeholder for team context detection (v1)
function getTeamContext() {
  // TODO v1: Detect from:
  // - VS Code workspace settings (.vscode/bluepainter.json)
  // - Git remote URL parsing
  // - Environment variables (CI/CD context)
  // - User authentication state
  
  return {
    userId: null,      // Populated when user is authenticated
    userName: null,
    teamId: null,      // Derived from repo or workspace config
    repoUrl: null,     // Parsed from git remote
    surface: typeof window !== 'undefined' ? 'web-app' : 'vscode-extension'
  };
}

// Placeholder for file context detection (v1)
function getFileContext() {
  // TODO v1: Detect from:
  // - Active VS Code editor
  // - Active file in web app
  // - Git branch and commit SHA
  
  return {
    filePath: null,
    branch: null,
    commitSha: null
  };
}

/**
 * Enrich a learning loop event with team audit context (v1).
 * 
 * @param {Object} event - Base learning loop event (type, timestamp, data)
 * @returns {Object} Enriched event with context
 */
export function enrichEventWithContext(event) {
  // In v0.2, return event as-is (no context)
  // In v1, add full context
  
  const teamContext = getTeamContext();
  const fileContext = getFileContext();
  
  // Only add context if team/user info is available
  if (!teamContext.userId && !teamContext.teamId) {
    return event;
  }
  
  return {
    ...event,
    eventId: crypto.randomUUID?.() || `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    context: {
      ...teamContext,
      ...fileContext
    }
  };
}

const AUDIT_BUFFER_KEY = 'bluepainter-audit-log-buffer';
const MAX_BUFFER_SIZE = 500;
const BATCH_SIZE = 20; // v1: events per backend batch

/**
 * Send event to team audit log backend (v1).
 * 
 * @param {Object} enrichedEvent - Event with team context
 * @returns {Promise<void>}
 */
export async function sendToAuditLog(enrichedEvent) {
  // TODO v1: Implement backend integration
  // - POST to /api/audit-log or team backend endpoint
  // - Batch events for efficiency (buffer up to BATCH_SIZE events or 5 seconds)
  // - Retry with exponential backoff on failure
  // - Fallback to localStorage if backend is unreachable
  
  console.log('[AuditLog] Would send to backend:', enrichedEvent);
  
  // v0.2: Buffer to localStorage
  try {
    const buffer = getAuditBuffer();
    buffer.push({
      ...enrichedEvent,
      bufferedAt: Date.now()
    });
    
    // Trim to max size (FIFO)
    const trimmed = buffer.slice(-MAX_BUFFER_SIZE);
    
    localStorage.setItem(AUDIT_BUFFER_KEY, JSON.stringify(trimmed));
    
    // Log buffer size warnings
    if (trimmed.length > MAX_BUFFER_SIZE * 0.8) {
      console.warn(`[AuditLog] Buffer at ${trimmed.length}/${MAX_BUFFER_SIZE} events — consider flushing or reducing event volume`);
    }
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.error('[AuditLog] localStorage quota exceeded — attempting emergency flush');
      await emergencyFlush();
    } else {
      console.warn('[AuditLog] Failed to buffer event:', err);
    }
  }
}

/**
 * Get current audit buffer from localStorage.
 * 
 * @returns {Array} Buffered events
 */
export function getAuditBuffer() {
  try {
    const raw = localStorage.getItem(AUDIT_BUFFER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('[AuditLog] Failed to read buffer:', err);
    return [];
  }
}

/**
 * Get audit buffer statistics.
 * 
 * @returns {Object} Buffer stats
 */
export function getAuditBufferStats() {
  const buffer = getAuditBuffer();
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  return {
    totalEvents: buffer.length,
    eventsLastHour: buffer.filter(e => e.bufferedAt > oneHourAgo).length,
    eventsLastDay: buffer.filter(e => e.bufferedAt > oneDayAgo).length,
    oldestEvent: buffer[0]?.bufferedAt || null,
    newestEvent: buffer[buffer.length - 1]?.bufferedAt || null,
    bufferUsage: (buffer.length / MAX_BUFFER_SIZE * 100).toFixed(1) + '%',
    eventTypes: buffer.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {})
  };
}

/**
 * Clear audit buffer (use with caution).
 * 
 * @returns {number} Number of events cleared
 */
export function clearAuditBuffer() {
  const buffer = getAuditBuffer();
  const count = buffer.length;
  localStorage.removeItem(AUDIT_BUFFER_KEY);
  console.log(`[AuditLog] Cleared ${count} buffered events`);
  return count;
}

/**
 * Flush buffered events to backend (v1).
 * Called on:
 * - App close / extension deactivate
 * - Buffer reaches batch size
 * - Periodic interval (every 30 seconds)
 * 
 * @returns {Promise<{sent: number, failed: number}>}
 */
export async function flushAuditBuffer() {
  // TODO v1: Send all buffered events to backend
  const buffer = getAuditBuffer();
  const batchCount = Math.ceil(buffer.length / BATCH_SIZE);
  console.log(`[AuditLog] Flush buffer: ${buffer.length} events in ${batchCount} batches (not implemented in v0.2)`);
  
  // v1 implementation will:
  // 1. Batch events into chunks of BATCH_SIZE
  // 2. POST /api/audit-log/batch with each batch
  // 3. Remove successfully sent events from buffer
  // 4. Keep failed events for retry
  
  return { sent: 0, failed: buffer.length };
}

/**
 * Emergency flush when localStorage quota is exceeded.
 * Exports buffer to console and clears to free space.
 */
async function emergencyFlush() {
  const buffer = getAuditBuffer();
  console.error('[AuditLog] Emergency flush triggered — exporting buffer to console');
  console.log(JSON.stringify({ 
    timestamp: Date.now(),
    reason: 'localStorage quota exceeded',
    events: buffer 
  }));
  clearAuditBuffer();
}

/**
 * Query audit log for a team (v1 admin feature).
 * 
 * @param {Object} filters - Query filters (userId, repoUrl, dateRange, eventType)
 * @returns {Promise<Array>} Matching events
 */
// eslint-disable-next-line no-unused-vars
export async function queryAuditLog(filters) {
  // TODO v1: Implement backend query
  // - Support filters: date range, user, repo, event type, file path
  // - Pagination for large result sets
  // - Export to CSV/JSON for compliance
  
  throw new Error('queryAuditLog not implemented in v0.2 (team backend required)');
}

/**
 * Configure audit log retention policy (v1 admin feature).
 * 
 * @param {Object} policy - Retention policy (retentionDays, anonymize, includeFileContent)
 */
export function configureRetentionPolicy(policy) {
  // TODO v1: Save to team backend config
  console.log('[AuditLog] Configure retention:', policy);
}
