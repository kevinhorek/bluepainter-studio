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
    const enrichedEvent = enrichEventWithContext(event);
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
   * 
   * Enhanced in v1 with team pattern detection
   */
  getSuggestions(options = {}) {
    const { minEvents = 3, dismissThreshold = 0.7, fixThreshold = 5 } = options;
    const events = this._readAll();
    const suggestions = [];

    if (events.length < minEvents) {
      return suggestions;
    }

    const stats = this.getStatistics();

    // Analyze dismissed rules → suggest downgrade or hide
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

    // Analyze frequently fixed rules → suggest quick-fix or auto-apply
    Object.entries(stats.mostAppliedFixes).forEach(([fixKey, fixCount]) => {
      const fixEvents = events.filter((e) => e.type === 'receipt_fix_applied' && e.data.fixKey === fixKey);
      
      if (fixCount >= fixThreshold) {
        const ruleIds = [...new Set(fixEvents.map((e) => e.data.ruleId).filter(Boolean))];
        
        // Check if fixes are consistent (same fix applied repeatedly)
        const fixMetaValues = fixEvents
          .map((e) => JSON.stringify(e.data.fixMeta))
          .filter(Boolean);
        const uniqueFixMetas = [...new Set(fixMetaValues)];
        const isConsistent = uniqueFixMetas.length <= 3; // Low variety = consistent pattern
        
        suggestions.push({
          type: 'prefer_quick_fix',
          fixKey,
          ruleIds,
          reason: `Applied ${fixCount} times${isConsistent ? ' (consistent pattern)' : ''}`,
          weight: Math.min(fixCount / 10, 1.0),
          action: isConsistent 
            ? 'Consider making this fix auto-applicable or creating a custom rule'
            : 'Consider making this fix more prominent',
          fixCount,
          isConsistent,
          timestamp: Date.now()
        });
      }
    });

    // Detect file-specific patterns → suggest file-level overrides
    const filePatterns = this._analyzeFilePatterns(events);
    filePatterns.forEach(pattern => {
      suggestions.push({
        type: 'file_specific_rule',
        filePath: pattern.filePath,
        ruleId: pattern.ruleId,
        reason: `${pattern.action} ${pattern.count} times in this file`,
        weight: pattern.count / 10,
        action: `Consider creating file-specific rule override for ${pattern.filePath}`,
        count: pattern.count,
        timestamp: Date.now()
      });
    });

    // Detect team preference patterns → suggest policy updates
    const policyPatterns = this._analyzePolicyPatterns(events);
    policyPatterns.forEach(pattern => {
      suggestions.push({
        type: 'policy_update',
        setting: pattern.setting,
        suggestedValue: pattern.suggestedValue,
        reason: `Based on ${pattern.evidence} team interactions`,
        weight: pattern.confidence,
        action: `Update ${pattern.setting} to ${pattern.suggestedValue}`,
        timestamp: Date.now()
      });
    });

    // Sort by weight (highest first)
    return suggestions.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Analyze file-specific patterns in events
   * @private
   */
  _analyzeFilePatterns(events) {
    const fileActions = {};
    
    events.forEach(event => {
      const filePath = event.context?.filePath || event.data?.fileName;
      const ruleId = event.data?.ruleId;
      
      if (filePath && ruleId) {
        const key = `${filePath}:${ruleId}`;
        if (!fileActions[key]) {
          fileActions[key] = {
            filePath,
            ruleId,
            dismissed: 0,
            fixed: 0
          };
        }
        
        if (event.type === 'receipt_dismissed') {
          fileActions[key].dismissed++;
        } else if (event.type === 'receipt_fix_applied') {
          fileActions[key].fixed++;
        }
      }
    });
    
    // Find significant patterns (files with >5 interactions for same rule)
    return Object.values(fileActions)
      .filter(pattern => (pattern.dismissed + pattern.fixed) >= 5)
      .map(pattern => ({
        ...pattern,
        action: pattern.dismissed > pattern.fixed ? 'dismissed' : 'fixed',
        count: pattern.dismissed + pattern.fixed
      }));
  }

  /**
   * Analyze policy adjustment patterns from team behavior
   * @private
   */
  _analyzePolicyPatterns(events) {
    const patterns = [];
    
    // Analyze spacing violations → suggest grid size adjustment
    const spacingFixes = events.filter(e => 
      e.type === 'receipt_fix_applied' && 
      (e.data.fixKey === 'spacing' || e.data.ruleId === 'spacing')
    );
    
    if (spacingFixes.length >= 8) {
      // Extract common spacing values from fixes
      const spacingValues = spacingFixes
        .map(e => e.data.fixMeta?.value)
        .filter(Boolean);
      const commonValue = this._findMostCommon(spacingValues);
      
      if (commonValue) {
        patterns.push({
          setting: 'spacing.gridStep',
          suggestedValue: commonValue,
          evidence: spacingFixes.length,
          confidence: Math.min(spacingFixes.length / 20, 1.0)
        });
      }
    }
    
    // Analyze contrast threshold → suggest adjustment
    const contrastEvents = events.filter(e => 
      (e.type === 'receipt_fix_applied' || e.type === 'receipt_dismissed') &&
      (e.data.ruleId === 'contrast')
    );
    const contrastDismissals = contrastEvents.filter(e => e.type === 'receipt_dismissed').length;
    const contrastFixes = contrastEvents.filter(e => e.type === 'receipt_fix_applied').length;
    
    if (contrastDismissals >= 5 && contrastDismissals > contrastFixes * 2) {
      patterns.push({
        setting: 'contrast.minRatio',
        suggestedValue: '3.0 (lower threshold)',
        evidence: contrastDismissals,
        confidence: Math.min(contrastDismissals / 10, 0.8)
      });
    }
    
    return patterns;
  }

  /**
   * Find most common value in array
   * @private
   */
  _findMostCommon(arr) {
    if (arr.length === 0) return null;
    
    const counts = {};
    arr.forEach(val => {
      counts[val] = (counts[val] || 0) + 1;
    });
    
    let maxCount = 0;
    let mostCommon = null;
    Object.entries(counts).forEach(([val, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = val;
      }
    });
    
    return maxCount >= 3 ? mostCommon : null; // Require at least 3 occurrences
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
