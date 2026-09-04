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

/**
 * Send event to team audit log backend (v1).
 * 
 * @param {Object} enrichedEvent - Event with team context
 * @returns {Promise<void>}
 */
export async function sendToAuditLog(enrichedEvent) {
  // TODO v1: Implement backend integration
  // - POST to /api/audit-log or team backend endpoint
  // - Batch events for efficiency (buffer up to 10 events or 5 seconds)
  // - Retry with exponential backoff on failure
  // - Fallback to localStorage if backend is unreachable
  
  console.log('[AuditLog] Would send to backend:', enrichedEvent);
  
  // Placeholder: store in localStorage as fallback
  try {
    const key = 'bluepainter-audit-log-buffer';
    const buffer = JSON.parse(localStorage.getItem(key) || '[]');
    buffer.push(enrichedEvent);
    localStorage.setItem(key, JSON.stringify(buffer.slice(-100))); // Keep last 100 events
  } catch (err) {
    console.warn('[AuditLog] Failed to buffer event:', err);
  }
}

/**
 * Flush buffered events to backend (v1).
 * Called on:
 * - App close / extension deactivate
 * - Buffer reaches batch size
 * - Periodic interval (every 30 seconds)
 */
export async function flushAuditBuffer() {
  // TODO v1: Send all buffered events to backend
  console.log('[AuditLog] Flush buffer (not implemented in v0.2)');
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
