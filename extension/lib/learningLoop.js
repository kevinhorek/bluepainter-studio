const { getGitContext } = require('./gitContext');

const LEARNING_LOOP_KEY = 'bluepainter.learningLoop';
const MAX_EVENTS = 1000;

/**
 * Get workspace audit backend URL from settings
 * Extension: reads from .vscode/settings.json or workspace config
 */
function getAuditBackendUrl() {
  try {
    const vscode = require('vscode');
    const config = vscode.workspace.getConfiguration('bluepainter');
    return config.get('auditBackendUrl', null);
  } catch {
    return null;
  }
}

/**
 * Send event to audit backend (when configured)
 */
async function sendToAuditBackend(event, backendUrl) {
  if (!backendUrl) {
    return; // No backend configured, skip
  }
  
  try {
    const response = await fetch(`${backendUrl}/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events: [event] })
    });
    
    if (!response.ok) {
      console.warn('[LearningLoop] Backend sync failed:', await response.text());
    } else {
      console.log('[LearningLoop] Event synced to audit backend');
    }
  } catch (err) {
    console.warn('[LearningLoop] Failed to sync event to backend:', err);
  }
}

class LearningLoop {
  constructor(context) {
    this.context = context;
  }

  _readAll() {
    return this.context.globalState.get(LEARNING_LOOP_KEY, []);
  }

  _write(events) {
    const trimmed = events.slice(-MAX_EVENTS);
    return this.context.globalState.update(LEARNING_LOOP_KEY, trimmed);
  }

  log(eventType, data = {}) {
    const events = this._readAll();
    const event = {
      type: eventType,
      timestamp: Date.now(),
      data
    };
    events.push(event);
    this._write(events);
    
    // Optional: sync to audit backend if configured
    const backendUrl = getAuditBackendUrl();
    if (backendUrl) {
      // Enrich event with extension context
      const enrichedEvent = {
        ...event,
        eventId: this._generateEventId(),
        context: this._getFileContext()
      };
      sendToAuditBackend(enrichedEvent, backendUrl).catch(err => {
        console.warn('[LearningLoop] Backend sync error:', err);
      });
    }
    
    return event;
  }
  
  _generateEventId() {
    // Generate UUID-like event ID for idempotency
    return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
  
  _getFileContext() {
    try {
      const vscode = require('vscode');
      const editor = vscode.window.activeTextEditor;
      const filePath = editor?.document.uri.fsPath || null;
      
      const gitCtx = getGitContext(filePath);
      
      return {
        userId: gitCtx.userEmail,
        userName: gitCtx.userName,
        teamId: null,
        repoUrl: gitCtx.repoUrl,
        filePath,
        branch: gitCtx.branch,
        commitSha: gitCtx.commitSha,
        surface: 'vscode-extension'
      };
    } catch {
      return {
        surface: 'vscode-extension'
      };
    }
  }

  logReceiptFixApplied(fixKey, nodeId, fixMeta, ruleId) {
    return this.log('receipt_fix_applied', {
      fixKey,
      nodeId,
      fixMeta,
      ruleId
    });
  }

  logReceiptDismissed(ruleId, nodeId, fileName) {
    return this.log('receipt_dismissed', {
      ruleId,
      nodeId,
      fileName
    });
  }

  logPolicyChange(key, oldValue, newValue) {
    return this.log('policy_change', {
      key,
      oldValue,
      newValue
    });
  }

  logCanvasToCodeSync(nodeId, fileName, patchType) {
    return this.log('canvas_to_code_sync', {
      nodeId,
      fileName,
      patchType
    });
  }

  logCodeToCanvasSync(fileName, nodeCount) {
    return this.log('code_to_canvas_sync', {
      fileName,
      nodeCount
    });
  }

  getAll() {
    return this._readAll();
  }

  getByType(eventType) {
    return this._readAll().filter((e) => e.type === eventType);
  }

  getRecent(count = 50) {
    const all = this._readAll();
    return all.slice(-count);
  }

  getStatistics() {
    const events = this._readAll();
    const stats = {
      total: events.length,
      byType: {},
      mostAppliedFixes: {},
      mostDismissedRules: {},
      policyChanges: 0,
      roundTrips: 0
    };

    events.forEach((event) => {
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;

      if (event.type === 'receipt_fix_applied') {
        const key = event.data.fixKey;
        stats.mostAppliedFixes[key] = (stats.mostAppliedFixes[key] || 0) + 1;
      }

      if (event.type === 'receipt_dismissed') {
        const key = event.data.ruleId;
        stats.mostDismissedRules[key] = (stats.mostDismissedRules[key] || 0) + 1;
      }

      if (event.type === 'policy_change') {
        stats.policyChanges++;
      }

      if (event.type === 'canvas_to_code_sync' || event.type === 'code_to_canvas_sync') {
        stats.roundTrips++;
      }
    });

    return stats;
  }

  clear() {
    return this._write([]);
  }

  exportJSON() {
    const events = this._readAll();
    const stats = this.getStatistics();
    return {
      version: '1.0',
      exportedAt: Date.now(),
      stats,
      events
    };
  }

  /**
   * Generate weighted suggestions from logged events (SPEC §3)
   * Rules dismissed often → suggest downgrade severity or hide
   * Rules fixed often → suggest quick-fix preference
   * Deterministic, local, no LLM required
   */
  getSuggestions(options = {}) {
    const { minEvents = 3, dismissThreshold = 0.7 } = options;
    const events = this._readAll();
    const suggestions = [];

    if (events.length < minEvents) {
      return suggestions;
    }

    const stats = this.getStatistics();

    // Analyze dismissed rules
    Object.entries(stats.mostDismissedRules).forEach(([ruleId, dismissCount]) => {
      const ruleEvents = events.filter(
        (e) => (e.type === 'receipt_dismissed' || e.type === 'receipt_fix_applied') && 
               (e.data.ruleId === ruleId || e.data.ruleId === ruleId)
      );
      const fixCount = ruleEvents.filter((e) => e.type === 'receipt_fix_applied').length;
      const totalInteractions = dismissCount + fixCount;

      if (totalInteractions >= minEvents && dismissCount / totalInteractions >= dismissThreshold) {
        suggestions.push({
          type: 'downgrade_rule',
          ruleId,
          reason: `Dismissed ${dismissCount}/${totalInteractions} times`,
          weight: dismissCount / totalInteractions,
          action: 'Consider downgrading severity or hiding this rule',
          dismissCount,
          fixCount,
          timestamp: Date.now()
        });
      }
    });

    // Analyze frequently fixed rules
    Object.entries(stats.mostAppliedFixes).forEach(([fixKey, fixCount]) => {
      const fixEvents = events.filter((e) => e.type === 'receipt_fix_applied' && e.data.fixKey === fixKey);
      
      if (fixCount >= minEvents) {
        const ruleIds = [...new Set(fixEvents.map((e) => e.data.ruleId).filter(Boolean))];
        suggestions.push({
          type: 'prefer_quick_fix',
          fixKey,
          ruleIds,
          reason: `Applied ${fixCount} times`,
          weight: Math.min(fixCount / 10, 1.0),
          action: 'Consider making this fix more prominent or auto-applicable',
          fixCount,
          timestamp: Date.now()
        });
      }
    });

    // Sort by weight (highest first)
    return suggestions.sort((a, b) => b.weight - a.weight);
  }
}

module.exports = { LearningLoop };
