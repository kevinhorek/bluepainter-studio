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
const FLUSH_INTERVAL_MS = 30000; // v1: flush every 30 seconds
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

// Global flush timer
let flushTimer = null;

/**
 * Get audit backend API URL from environment
 */
function getAuditBackendUrl() {
  // Check for configured backend URL
  // In production: set VITE_AUDIT_API_URL to your backend endpoint
  // In development: defaults to /api/audit-log (Vercel dev server)
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AUDIT_API_URL) {
    return import.meta.env.VITE_AUDIT_API_URL;
  }
  
  // Default to local API endpoint
  return '/api/audit-log';
}

/**
 * Send batch of events to backend with retry logic
 */
async function sendBatchToBackend(events, retryCount = 0) {
  const backendUrl = getAuditBackendUrl();
  
  if (!backendUrl) {
    console.log('[AuditLog] No backend URL configured — keeping events in buffer');
    return { success: false, keepInBuffer: true };
  }
  
  try {
    const response = await fetch(`${backendUrl}/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[AuditLog] Backend error:', errorData);
      
      // Retry on server errors (5xx) but not client errors (4xx)
      if (response.status >= 500 && retryCount < RETRY_DELAYS.length) {
        console.log(`[AuditLog] Retrying in ${RETRY_DELAYS[retryCount]}ms (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount]));
        return sendBatchToBackend(events, retryCount + 1);
      }
      
      return { success: false, keepInBuffer: response.status >= 500 };
    }
    
    const result = await response.json();
    console.log(`[AuditLog] Sent ${result.accepted} events to backend`);
    
    return { success: true, keepInBuffer: false, result };
    
  } catch (err) {
    console.error('[AuditLog] Network error:', err);
    
    // Retry on network errors
    if (retryCount < RETRY_DELAYS.length) {
      console.log(`[AuditLog] Retrying in ${RETRY_DELAYS[retryCount]}ms (attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount]));
      return sendBatchToBackend(events, retryCount + 1);
    }
    
    return { success: false, keepInBuffer: true };
  }
}

/**
 * Schedule periodic flush of buffer
 */
function scheduleFlush() {
  if (flushTimer) {
    return; // Already scheduled
  }
  
  flushTimer = setInterval(async () => {
    const buffer = getAuditBuffer();
    if (buffer.length >= BATCH_SIZE) {
      await flushAuditBuffer();
    }
  }, FLUSH_INTERVAL_MS);
  
  // Clear timer on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = null;
      }
      // Attempt synchronous flush (best effort)
      flushAuditBuffer();
    });
  }
}

/**
 * Send event to team audit log backend (v1).
 * 
 * @param {Object} enrichedEvent - Event with team context
 * @returns {Promise<void>}
 */
export async function sendToAuditLog(enrichedEvent) {
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
    
    // Auto-flush when batch size reached
    if (trimmed.length >= BATCH_SIZE) {
      console.log('[AuditLog] Batch size reached, flushing buffer');
      await flushAuditBuffer();
    }
    
    // Schedule periodic flush (v1)
    scheduleFlush();
    
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
  const buffer = getAuditBuffer();
  
  if (buffer.length === 0) {
    return { sent: 0, failed: 0 };
  }
  
  console.log(`[AuditLog] Flushing ${buffer.length} events to backend`);
  
  let sent = 0;
  let failed = 0;
  const remainingBuffer = [];
  
  // Process buffer in batches
  for (let i = 0; i < buffer.length; i += BATCH_SIZE) {
    const batch = buffer.slice(i, i + BATCH_SIZE);
    
    // Remove bufferedAt timestamp before sending (not part of schema)
    const cleanBatch = batch.map((event) => {
      // eslint-disable-next-line no-unused-vars
      const { bufferedAt: _removed, ...cleanEvent } = event;
      return cleanEvent;
    });
    
    const result = await sendBatchToBackend(cleanBatch);
    
    if (result.success) {
      sent += cleanBatch.length;
    } else {
      failed += cleanBatch.length;
      if (result.keepInBuffer) {
        // Keep failed events for retry
        remainingBuffer.push(...batch);
      }
    }
  }
  
  // Update buffer with only failed events (if any)
  if (remainingBuffer.length > 0) {
    localStorage.setItem(AUDIT_BUFFER_KEY, JSON.stringify(remainingBuffer));
    console.log(`[AuditLog] ${failed} events failed to send, kept in buffer for retry`);
  } else {
    localStorage.removeItem(AUDIT_BUFFER_KEY);
    console.log(`[AuditLog] Buffer flushed successfully: ${sent} events sent`);
  }
  
  return { sent, failed };
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
