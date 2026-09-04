import { enrichEventWithContext, sendToAuditLog } from './auditLog.js';

const STORAGE_KEY = 'bluepainter-learning-loop';
const MAX_EVENTS = 1000;

// Class-based LearningLoop matching extension implementation (SPEC §3 requirement)
export class LearningLoop {
  _readAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  _write(events) {
    const trimmed = events.slice(-MAX_EVENTS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Ignore quota errors in demo
    }
  }

  log(eventType, data = {}) {
    const events = this._readAll();
    const baseEvent = {
      type: eventType,
      timestamp: Date.now(),
      data
    };
    
    // v1: Enrich event with git context (for localStorage and backend)
    const enrichedEvent = enrichEventWithContext(baseEvent);
    
    events.push(enrichedEvent);
    this._write(events);
    
    // v1: Send enriched event to team audit log
    // Enabled when VITE_AUDIT_API_URL is configured
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AUDIT_API_URL) {
      sendToAuditLog(enrichedEvent).catch(err => {
        console.warn('[LearningLoop] Failed to send to audit log:', err);
      });
    }
    
    return enrichedEvent;
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
      surface: 'web-studio',
      context: {
        userId: null,
        userName: null,
        teamId: null,
        repoUrl: null,
        branch: null,
        commitSha: null,
        filePath: null
      },
      stats,
      events
    };
  }

  /**
   * Get the most recent event timestamp
   * Returns null if no events exist
   */
  getLastActivityTimestamp() {
    const events = this._readAll();
    if (events.length === 0) return null;
    return events[events.length - 1].timestamp;
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

// Legacy function-based API for backward compatibility
export function logLearningEvent(type, payload = {}) {
  const entry = {
    type,
    ...payload,
    timestamp: new Date().toISOString()
  };
  try {
    const existing = getLearningEvents();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, entry].slice(-500)));
  } catch {
    // ignore quota errors in demo
  }
  return entry;
}

export function getLearningEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLearningSummary() {
  const events = getLearningEvents();
  const summary = {
    totalEvents: events.length,
    fixesApplied: 0,
    rulesDismissed: 0,
    policyUpdates: 0,
    roundTripsCanvas: 0,
    roundTripsCode: 0,
    fixByRule: {},
    dismissByRule: {}
  };

  events.forEach((e) => {
    if (e.type === 'receipt_fix_applied') {
      summary.fixesApplied += 1;
      if (e.data?.ruleId) summary.fixByRule[e.data.ruleId] = (summary.fixByRule[e.data.ruleId] || 0) + 1;
    } else if (e.type === 'receipt_dismissed') {
      summary.rulesDismissed += 1;
      if (e.data?.ruleId) summary.dismissByRule[e.data.ruleId] = (summary.dismissByRule[e.data.ruleId] || 0) + 1;
    } else if (e.type === 'policy_change') summary.policyUpdates += 1;
    else if (e.type === 'canvas_to_code_sync') summary.roundTripsCanvas += 1;
    else if (e.type === 'code_to_canvas_sync') summary.roundTripsCode += 1;
  });

  return summary;
}

export function clearLearningEvents() {
  localStorage.removeItem(STORAGE_KEY);
}
