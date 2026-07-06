import { getStoredFeedback, getFeedbackSummary } from './feedbackStorage';
import { getLearningEvents, getLearningSummary } from './learningLoop';
import { loadReceiptPolicy } from '../data/defaultReceiptPolicy';

export { getFeedbackSummary };

export function downloadValidationExport() {
  const payload = {
    exportedAt: new Date().toISOString(),
    specVersion: '2026-07',
    feedback: {
      summary: getFeedbackSummary(),
      responses: getStoredFeedback()
    },
    learningLoop: {
      summary: getLearningSummary(),
      events: getLearningEvents()
    },
    teamPolicy: loadReceiptPolicy(),
    decisionGate: {
      targetVeryInterested: 3,
      currentVeryInterested: getFeedbackSummary().very,
      pilotReady: getFeedbackSummary().very >= 3,
      note: 'See SPEC.md §8 for full validation criteria'
    }
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `bluepainter-validation-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

// Re-export for backward compatibility
export { downloadValidationExport as downloadFeedbackJSON };
