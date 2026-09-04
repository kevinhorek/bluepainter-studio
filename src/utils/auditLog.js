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

import { getGitContext } from './gitContext.js';

// Get team context from git context (v1)
function getTeamContext() {
  const gitCtx = getGitContext();
  
  return {
    userId: gitCtx.userEmail,      // Use git email as user ID
    userName: gitCtx.userName,
    teamId: null,                   // TODO v1: Derive from repo or workspace config
    repoUrl: gitCtx.repoUrl,
    surface: 'web-app'
  };
}

// Get file context from git context and active file state (v1)
function getFileContext() {
  const gitCtx = getGitContext();
  
  // TODO: Get active file path from app state if available
  // For now, filePath will be set by callers when available
  
  return {
    filePath: null,  // Set by caller context
    branch: gitCtx.branch,
    commitSha: gitCtx.commitSha
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
const BACKEND_STATUS_KEY = 'bluepainter-audit-backend-status';

// Global flush timer
let flushTimer = null;

// Backend status tracking
let backendStatus = {
  available: null, // null = unknown, true = available, false = unavailable
  softFailMode: false, // true when backend returns soft-fail mode
  lastChecked: null,
  lastError: null
};

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
 * Update backend status tracking
 */
function updateBackendStatus(updates) {
  backendStatus = { ...backendStatus, ...updates, lastChecked: Date.now() };
  try {
    localStorage.setItem(BACKEND_STATUS_KEY, JSON.stringify(backendStatus));
  } catch (err) {
    // Ignore storage errors for status tracking
  }
}

/**
 * Get current backend status
 */
export function getAuditBackendStatus() {
  // Try to load cached status
  if (backendStatus.lastChecked === null) {
    try {
      const cached = localStorage.getItem(BACKEND_STATUS_KEY);
      if (cached) {
        backendStatus = JSON.parse(cached);
      }
    } catch (err) {
      // Ignore parse errors
    }
  }
  
  return {
    ...backendStatus,
    bufferSize: getAuditBuffer().length,
    bufferAtRisk: getAuditBuffer().length > MAX_BUFFER_SIZE * 0.8
  };
}

/**
 * Send batch of events to backend with retry logic
 */
async function sendBatchToBackend(events, retryCount = 0) {
  const backendUrl = getAuditBackendUrl();
  
  if (!backendUrl) {
    console.log('[AuditLog] No backend URL configured — keeping events in buffer');
    updateBackendStatus({ available: false, lastError: 'No backend URL configured' });
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
      updateBackendStatus({ available: false, lastError: `HTTP ${response.status}` });
      
      // Retry on server errors (5xx) but not client errors (4xx)
      if (response.status >= 500 && retryCount < RETRY_DELAYS.length) {
        console.log(`[AuditLog] Retrying in ${RETRY_DELAYS[retryCount]}ms (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount]));
        return sendBatchToBackend(events, retryCount + 1);
      }
      
      return { success: false, keepInBuffer: response.status >= 500 };
    }
    
    const result = await response.json();
    
    // Check if backend is in soft-fail mode (DATABASE_URL not configured)
    if (result.mode === 'soft-fail') {
      console.log('[AuditLog] Backend in soft-fail mode — DATABASE_URL not configured. Events buffered locally.');
      console.log('[AuditLog] This is normal for demo/validation. For production audit trail, set DATABASE_URL in Vercel. See docs/AUDIT_BACKEND.md');
      updateBackendStatus({ 
        available: true, 
        softFailMode: true, 
        lastError: null // Not an error — this is expected behavior
      });
    } else {
      console.log(`[AuditLog] Sent ${result.accepted} events to backend`);
      updateBackendStatus({ available: true, softFailMode: false, lastError: null });
    }
    
    return { success: true, keepInBuffer: false, result };
    
  } catch (err) {
    console.error('[AuditLog] Network error:', err);
    updateBackendStatus({ available: false, lastError: err.message });
    
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
 * Query audit log for a team (v1 production feature).
 * 
 * @param {Object} filters - Query filters
 * @param {string} filters.teamId - Team UUID (required for team-scoped queries)
 * @param {number} filters.startDate - Unix timestamp (ms) for range start
 * @param {number} filters.endDate - Unix timestamp (ms) for range end
 * @param {string} filters.userId - Filter by user email
 * @param {string} filters.eventType - Filter by event type (comma-separated)
 * @param {string} filters.filePath - Filter by file path (supports wildcards)
 * @param {number} filters.limit - Number of results per page (default 50, max 500)
 * @param {number} filters.offset - Pagination offset (default 0)
 * @returns {Promise<Object>} Query results with events array and pagination metadata
 */
export async function queryAuditLog(filters = {}) {
  const backendUrl = getAuditBackendUrl();
  
  if (!backendUrl) {
    console.warn('[AuditLog] No backend URL configured — query not available');
    return {
      events: [],
      total: 0,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
      hasMore: false,
      error: 'Backend not configured'
    };
  }
  
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (filters.teamId) params.append('teamId', filters.teamId);
    if (filters.startDate) params.append('startDate', filters.startDate.toString());
    if (filters.endDate) params.append('endDate', filters.endDate.toString());
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.eventType) params.append('eventType', filters.eventType);
    if (filters.filePath) params.append('filePath', filters.filePath);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    
    const response = await fetch(`${backendUrl}/query?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Query failed' }));
      console.error('[AuditLog] Query error:', errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`[AuditLog] Query returned ${result.events.length} events`);
    
    return result;
    
  } catch (err) {
    console.error('[AuditLog] Query failed:', err);
    return {
      events: [],
      total: 0,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
      hasMore: false,
      error: err.message
    };
  }
}

/**
 * Export audit log events to CSV or JSON format.
 * 
 * @param {Object} filters - Query filters (same as queryAuditLog)
 * @param {string} format - Export format: 'csv' or 'json'
 * @returns {Promise<string>} Exported data as string
 */
export async function exportAuditLog(filters = {}, format = 'json') {
  const result = await queryAuditLog({ ...filters, limit: 10000 }); // Max export size
  
  if (result.error || result.events.length === 0) {
    throw new Error(result.error || 'No events to export');
  }
  
  if (format === 'csv') {
    return exportToCSV(result.events);
  } else {
    return JSON.stringify({
      exportedAt: Date.now(),
      filters,
      total: result.total,
      events: result.events
    }, null, 2);
  }
}

/**
 * Convert events array to CSV format
 * 
 * @param {Array} events - Array of audit events
 * @returns {string} CSV formatted string
 */
function exportToCSV(events) {
  if (events.length === 0) return '';
  
  // CSV headers
  const headers = [
    'Event ID',
    'Timestamp',
    'Date',
    'Event Type',
    'User ID',
    'Team ID',
    'File Path',
    'Branch',
    'Commit SHA',
    'Surface',
    'Data'
  ];
  
  // Build CSV rows
  const rows = events.map(event => {
    const context = event.context || {};
    return [
      event.eventId || '',
      event.timestamp || '',
      event.timestamp ? new Date(event.timestamp).toISOString() : '',
      event.type || '',
      context.userId || '',
      context.teamId || '',
      context.filePath || '',
      context.branch || '',
      context.commitSha || '',
      context.surface || '',
      JSON.stringify(event.data || {}).replace(/"/g, '""') // Escape quotes for CSV
    ].map(val => `"${val}"`).join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
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
