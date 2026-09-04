const STORAGE_KEY = 'bluepainter-demo-feedback';

export function getStoredFeedback() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFeedback(entry) {
  const existing = getStoredFeedback();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, entry]));
}

export function buildCurrentSessionMetrics() {
  const learning = getLearningSummaryForSession();
  const roundTripCanvas = learning.roundTripsCanvas > 0;
  const roundTripCode = learning.roundTripsCode > 0;
  const activationComplete = roundTripCanvas && roundTripCode;
  
  return {
    activation: {
      roundTripCanvas,
      roundTripCode,
      complete: activationComplete,
      canvasCount: learning.roundTripsCanvas,
      codeCount: learning.roundTripsCode
    },
    receiptActions: {
      fixesApplied: learning.fixesApplied,
      rulesDismissed: learning.rulesDismissed,
      total: learning.fixesApplied + learning.rulesDismissed
    }
  };
}

function getLearningSummaryForSession() {
  try {
    const raw = localStorage.getItem('bluepainter-learning-loop');
    const events = raw ? JSON.parse(raw) : [];
    const summary = {
      fixesApplied: 0,
      rulesDismissed: 0,
      roundTripsCanvas: 0,
      roundTripsCode: 0
    };
    
    events.forEach((e) => {
      if (e.type === 'receipt_fix_applied') summary.fixesApplied += 1;
      else if (e.type === 'receipt_dismissed') summary.rulesDismissed += 1;
      else if (e.type === 'canvas_to_code_sync') summary.roundTripsCanvas += 1;
      else if (e.type === 'code_to_canvas_sync') summary.roundTripsCode += 1;
    });
    
    return summary;
  } catch {
    return { fixesApplied: 0, rulesDismissed: 0, roundTripsCanvas: 0, roundTripsCode: 0 };
  }
}

export function getFeedbackSummary() {
  const responses = getStoredFeedback();
  const summary = {
    total: responses.length,
    very: 0,
    somewhat: 0,
    not: 0,
    pilotYes: 0,
    pilotMaybe: 0,
    pilotNo: 0,
    byRole: {},
    sessionsWithActivation: 0,
    totalReceiptActions: 0
  };
  responses.forEach((r) => {
    if (r.interest === 'very') summary.very += 1;
    else if (r.interest === 'somewhat') summary.somewhat += 1;
    else if (r.interest === 'not') summary.not += 1;
    if (r.pilot === 'yes') summary.pilotYes += 1;
    else if (r.pilot === 'maybe') summary.pilotMaybe += 1;
    else if (r.pilot === 'no') summary.pilotNo += 1;
    if (r.role) summary.byRole[r.role] = (summary.byRole[r.role] || 0) + 1;
    if (r.sessionMetrics?.activation?.complete) summary.sessionsWithActivation += 1;
    if (r.sessionMetrics?.receiptActions?.total) summary.totalReceiptActions += r.sessionMetrics.receiptActions.total;
  });
  return summary;
}

export function downloadFeedbackJSON() {
  const responses = getStoredFeedback();
  const payload = {
    exportedAt: new Date().toISOString(),
    summary: getFeedbackSummary(),
    responses
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `bluepainter-feedback-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function clearStoredFeedback() {
  localStorage.removeItem(STORAGE_KEY);
}
