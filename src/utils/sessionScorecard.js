import { getFeedbackSummary } from './feedbackStorage';
import { getLearningSummary } from './learningLoop';
import { loadReceiptPolicy } from '../data/defaultReceiptPolicy';

const SESSIONS_TARGET = 8;
const VERY_TARGET = 3;

export function buildSessionScorecard() {
  const feedback = getFeedbackSummary();
  const learning = getLearningSummary();

  const roundTripCanvas = learning.roundTripsCanvas > 0;
  const roundTripCode = learning.roundTripsCode > 0;
  const activationComplete = roundTripCanvas && roundTripCode;
  const receiptsEngaged = learning.fixesApplied > 0 || learning.rulesDismissed > 0;
  const policyConfigured = learning.policyUpdates > 0 || hasNonDefaultPolicy(loadReceiptPolicy());
  const pilotYes = feedback.pilotYes || 0;

  const sessionsProgress = Math.min(feedback.total, SESSIONS_TARGET);
  const veryProgress = Math.min(feedback.very, VERY_TARGET);

  let recommendation = 'CONTINUE';
  let recommendationDetail = `Run more sessions (${feedback.total}/${SESSIONS_TARGET}). Target ${VERY_TARGET} "very interested."`;

  if (feedback.very >= VERY_TARGET && pilotYes >= 1) {
    recommendation = 'GO';
    recommendationDetail = 'Build v1 extension — enough interest and pilot willingness.';
  } else if (feedback.very >= VERY_TARGET) {
    recommendation = 'GO';
    recommendationDetail = 'Build v1 extension — ask pilot teams to confirm repo fit.';
  } else if (feedback.total >= SESSIONS_TARGET) {
    recommendation = 'NO-GO';
    recommendationDetail = 'Review responses against kill criteria in VALIDATION.md.';
  }

  return {
    exportedAt: new Date().toISOString(),
    sessions: {
      target: SESSIONS_TARGET,
      completed: feedback.total,
      progress: sessionsProgress
    },
    interest: {
      very: feedback.very,
      somewhat: feedback.somewhat,
      not: feedback.not,
      veryTarget: VERY_TARGET,
      veryProgress
    },
    pilot: {
      yes: feedback.pilotYes || 0,
      maybe: feedback.pilotMaybe || 0,
      no: feedback.pilotNo || 0
    },
    activation: {
      roundTripCanvas,
      roundTripCode,
      complete: activationComplete,
      canvasCount: learning.roundTripsCanvas,
      codeCount: learning.roundTripsCode
    },
    receipts: {
      fixesApplied: learning.fixesApplied,
      rulesDismissed: learning.rulesDismissed,
      engaged: receiptsEngaged,
      policyConfigured
    },
    learning,
    recommendation,
    recommendationDetail,
    pilotReady: feedback.very >= VERY_TARGET
  };
}

function hasNonDefaultPolicy(policy) {
  if (!policy) return false;
  const d = { spacingGrid: 8, radiusGrid: 4, minContrastRatio: 4.5, maxFeatureCount: 5 };
  return policy.spacingGrid !== d.spacingGrid
    || policy.radiusGrid !== d.radiusGrid
    || policy.minContrastRatio !== d.minContrastRatio
    || policy.maxFeatureCount !== d.maxFeatureCount;
}

export function getScorecardChecks(scorecard) {
  return [
    { id: 'sessions', label: 'Sessions logged', done: scorecard.sessions.completed >= 1, detail: `${scorecard.sessions.completed}/${scorecard.sessions.target}` },
    { id: 'very', label: '"Very interested" responses', done: scorecard.interest.very >= scorecard.interest.veryTarget, detail: `${scorecard.interest.very}/${scorecard.interest.veryTarget}` },
    { id: 'canvas', label: 'Canvas → code round-trip', done: scorecard.activation.roundTripCanvas, detail: `${scorecard.activation.canvasCount} edits` },
    { id: 'code', label: 'Code → canvas round-trip', done: scorecard.activation.roundTripCode, detail: `${scorecard.activation.codeCount} edits` },
    { id: 'receipts', label: 'Receipts engaged', done: scorecard.receipts.engaged, detail: `${scorecard.receipts.fixesApplied} fixes` },
    { id: 'pilot', label: 'Pilot willingness', done: scorecard.pilot.yes >= 1, detail: `${scorecard.pilot.yes} yes` }
  ];
}
