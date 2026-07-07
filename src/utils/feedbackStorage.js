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
    byRole: {}
  };
  responses.forEach((r) => {
    if (r.interest === 'very') summary.very += 1;
    else if (r.interest === 'somewhat') summary.somewhat += 1;
    else if (r.interest === 'not') summary.not += 1;
    if (r.pilot === 'yes') summary.pilotYes += 1;
    else if (r.pilot === 'maybe') summary.pilotMaybe += 1;
    else if (r.pilot === 'no') summary.pilotNo += 1;
    if (r.role) summary.byRole[r.role] = (summary.byRole[r.role] || 0) + 1;
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
