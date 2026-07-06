const STORAGE_KEY = 'bluepainter-learning-loop';

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
