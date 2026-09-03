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
    const event = {
      type: eventType,
      timestamp: Date.now(),
      data
    };
    events.push(event);
    this._write(events);
    return event;
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
    if (e.type === 'fix_applied') {
      summary.fixesApplied += 1;
      if (e.ruleId) summary.fixByRule[e.ruleId] = (summary.fixByRule[e.ruleId] || 0) + 1;
    } else if (e.type === 'rule_dismissed') {
      summary.rulesDismissed += 1;
      if (e.ruleId) summary.dismissByRule[e.ruleId] = (summary.dismissByRule[e.ruleId] || 0) + 1;
    } else if (e.type === 'policy_updated') summary.policyUpdates += 1;
    else if (e.type === 'round_trip_canvas') summary.roundTripsCanvas += 1;
    else if (e.type === 'round_trip_code') summary.roundTripsCode += 1;
  });

  return summary;
}

export function clearLearningEvents() {
  localStorage.removeItem(STORAGE_KEY);
}
