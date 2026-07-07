import { getStoredFeedback, getFeedbackSummary } from './feedbackStorage';
import { getLearningEvents, getLearningSummary } from './learningLoop';
import { loadReceiptPolicy } from '../data/defaultReceiptPolicy';
import { buildSessionScorecard } from './sessionScorecard';

export { getFeedbackSummary };

export function downloadValidationExport() {
  const scorecard = buildSessionScorecard();
  const payload = {
    exportedAt: new Date().toISOString(),
    specVersion: '2026-07',
    scorecard,
    feedback: {
      summary: getFeedbackSummary(),
      responses: getStoredFeedback()
    },
    learningLoop: {
      summary: getLearningSummary(),
      events: getLearningEvents()
    },
    teamPolicy: loadReceiptPolicy(),
    syncEngine: {
      mode: 'ast-first',
      scopeDoc: 'AST_SCOPE.md'
    },
    decisionGate: {
      sessionsTarget: scorecard.sessions.target,
      targetVeryInterested: scorecard.interest.veryTarget,
      currentVeryInterested: scorecard.interest.very,
      pilotYes: scorecard.pilot.yes,
      totalResponses: scorecard.sessions.completed,
      activationComplete: scorecard.activation.complete,
      pilotReady: scorecard.pilotReady,
      recommendation: scorecard.recommendation,
      recommendationDetail: scorecard.recommendationDetail,
      note: 'See VALIDATION.md and SPEC.md §8 for full criteria'
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

export { downloadValidationExport as downloadFeedbackJSON };
