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
      exportType: 'validation-session',
      exportedAt: new Date().toISOString(),
      specVersion: '2026-07',
      surface: 'web-studio',
      context: {
        facilitatorMode: new URLSearchParams(window.location.search).get('facilitator') === '1',
        sessionUrl: window.location.href
      },
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

export function downloadPilotPackExport() {
  try {
    const scorecard = buildSessionScorecard();
    const feedback = getFeedbackSummary();
    const learningEvents = getLearningEvents();
    const learningSummary = getLearningSummary();
    const responses = getStoredFeedback();
    
    const killCriteriaStatus = {
      sessionsCompleted: scorecard.sessions.completed,
      sessionsTarget: scorecard.sessions.target,
      veryInterested: scorecard.interest.very,
      veryTarget: scorecard.interest.veryTarget,
      pilotYes: scorecard.pilot.yes,
      pilotMaybe: scorecard.pilot.maybe,
      meetsKillCriteria: scorecard.sessions.completed >= scorecard.sessions.target && scorecard.interest.very >= scorecard.interest.veryTarget,
      decision: scorecard.recommendation,
      decisionReason: scorecard.recommendationDetail
    };
    
    const activationMetrics = {
      sessionsWithActivation: responses.filter(r => r.sessionMetrics?.activation?.complete).length,
      totalSessions: responses.length,
      activationRate: responses.length > 0 ? 
        (responses.filter(r => r.sessionMetrics?.activation?.complete).length / responses.length * 100).toFixed(1) + '%' : 
        '0%',
      canvasToCodeRoundTrips: learningSummary.roundTripsCanvas,
      codeToCanvasRoundTrips: learningSummary.roundTripsCode,
      receiptActionsTotal: learningSummary.fixesApplied + learningSummary.rulesDismissed,
      receiptFixesApplied: learningSummary.fixesApplied,
      receiptsDismissed: learningSummary.rulesDismissed
    };
    
    const payload = {
      exportType: 'pilot-pack',
      exportedAt: new Date().toISOString(),
      specVersion: '2026-07-SPEC-§8',
      surface: 'web-studio',
      context: {
        facilitatorMode: new URLSearchParams(window.location.search).get('facilitator') === '1',
        sessionUrl: window.location.href,
        userAgent: navigator.userAgent
      },
      
      executiveSummary: {
        totalSessions: scorecard.sessions.completed,
        recommendation: scorecard.recommendation,
        reason: scorecard.recommendationDetail,
        toplineMetrics: {
          veryInterested: `${scorecard.interest.very}/${scorecard.interest.veryTarget} target`,
          pilotWilling: `${scorecard.pilot.yes} yes, ${scorecard.pilot.maybe} maybe`,
          activationRate: activationMetrics.activationRate,
          receiptActionsPerSession: responses.length > 0 ? 
            (activationMetrics.receiptActionsTotal / responses.length).toFixed(1) : 
            '0'
        }
      },
      
      killCriteria: killCriteriaStatus,
      activationMetrics,
      
      sessionDetails: responses.map((session, idx) => ({
        sessionNumber: idx + 1,
        timestamp: session.timestamp,
        interest: session.interest,
        pilot: session.pilot,
        role: session.role,
        comment: session.comment,
        activationComplete: session.sessionMetrics?.activation?.complete || false,
        receiptActions: session.sessionMetrics?.receiptActions?.total || 0,
        roundTrips: {
          canvas: session.sessionMetrics?.activation?.canvasCount || 0,
          code: session.sessionMetrics?.activation?.codeCount || 0
        }
      })),
      
      interestBreakdown: {
        very: scorecard.interest.very,
        somewhat: scorecard.interest.somewhat,
        not: scorecard.interest.not,
        byRole: feedback.byRole
      },
      
      pilotWillingness: {
        yes: scorecard.pilot.yes,
        maybe: scorecard.pilot.maybe,
        no: scorecard.pilot.no
      },
      
      learningLoop: {
        totalEvents: learningSummary.totalEvents,
        summary: learningSummary,
        top10Events: learningEvents.slice(0, 10),
        exportedAt: learningSummary.exportedAt || null
      },
      
      teamPolicy: loadReceiptPolicy(),
      
      nextSteps: generateNextSteps(scorecard, activationMetrics),
      
      references: {
        spec: 'SPEC.md §8 — Success metrics & kill criteria',
        validation: 'VALIDATION.md — Full validation checklist',
        pilot: 'PILOT.md — Pilot team quick-start guide',
        selfPilot: 'SELF_PILOT.md — 30-45 min self-guided pilot walkthrough',
        facilitatorChecklist: 'scripts/pilot-dry-run.md — Printable facilitator session checklist'
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bluepainter-pilot-pack-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      sessionCount: responses.length,
      recommendation: scorecard.recommendation,
      isEmpty: responses.length === 0
    };
  } catch (error) {
    console.error('Failed to export pilot pack:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function generateNextSteps(scorecard, activationMetrics) {
  const steps = [];
  
  if (scorecard.recommendation === 'GO') {
    steps.push('✓ Build v1 extension — enough interest and pilot willingness');
    steps.push('Set up pilot repo access for teams who said "yes"');
    steps.push('Schedule onboarding calls with pilot teams');
    steps.push('Instrument extension for production learning loop');
  } else if (scorecard.recommendation === 'NO-GO') {
    steps.push('Review feedback comments for pivot insights');
    steps.push('Identify if problem is wedge, UX, or market fit');
    steps.push('Consider: sharper demo, clearer value prop, different target user');
  } else {
    steps.push(`Run ${scorecard.sessions.target - scorecard.sessions.completed} more sessions`);
    steps.push(`Target ${scorecard.interest.veryTarget - scorecard.interest.very} more "very interested" responses`);
    if (activationMetrics.activationRate === '0%' || parseFloat(activationMetrics.activationRate) < 50) {
      steps.push('⚠ Low activation rate — improve demo script or onboarding flow');
    }
  }
  
  return steps;
}
