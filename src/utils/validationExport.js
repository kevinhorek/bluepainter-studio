import { getStoredFeedback, getFeedbackSummary } from './feedbackStorage';
import { getLearningEvents, getLearningSummary } from './learningLoop';
import { loadReceiptPolicy } from '../data/defaultReceiptPolicy';
import { buildSessionScorecard } from './sessionScorecard';

export { getFeedbackSummary };

export function downloadValidationExport() {
  try {
    const scorecard = buildSessionScorecard();
    const feedback = getFeedbackSummary();
    const learningEvents = getLearningEvents();
    
    const payload = {
      exportedAt: new Date().toISOString(),
      specVersion: '2026-07',
      scorecard,
      feedback: {
        summary: feedback,
        responses: getStoredFeedback()
      },
      learningLoop: {
        summary: getLearningSummary(),
        events: learningEvents
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
      },
      meta: {
        hasResponses: feedback.total > 0,
        hasLearningEvents: learningEvents.length > 0,
        isEmpty: feedback.total === 0 && learningEvents.length === 0
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bluepainter-validation-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      sessionCount: feedback.total,
      eventCount: learningEvents.length,
      isEmpty: payload.meta.isEmpty
    };
  } catch (error) {
    console.error('Failed to export validation data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export function downloadLearningLoopExport(learningLoop) {
  try {
    if (!learningLoop) {
      throw new Error('Learning loop instance not available');
    }
    
    const payload = learningLoop.exportJSON();
    const stats = payload.stats || {};
    
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bluepainter-learning-loop-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      eventCount: stats.total || 0,
      isEmpty: (stats.total || 0) === 0
    };
  } catch (error) {
    console.error('Failed to export learning loop:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export { downloadValidationExport as downloadFeedbackJSON };
