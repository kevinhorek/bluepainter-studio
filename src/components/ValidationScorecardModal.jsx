import { useMemo, useState } from 'react';
import { buildSessionScorecard, getScorecardChecks } from '../utils/sessionScorecard';
import { getStoredFeedback } from '../utils/feedbackStorage';
import { downloadValidationExport, downloadPilotPackExport } from '../utils/validationExport';
import { LearningLoop } from '../utils/learningLoop';
import {
  buildScorecardSharePayload,
  buildSyncWrappedPayload,
  copyShareLink,
  openNativeShare
} from '../utils/shareViral';

export default function ValidationScorecardModal({ isOpen, onClose }) {
  const scorecard = useMemo(() => (isOpen ? buildSessionScorecard() : null), [isOpen]);
  const checks = useMemo(() => (scorecard ? getScorecardChecks(scorecard) : []), [scorecard]);
  const sessions = useMemo(() => (isOpen ? getStoredFeedback() : []), [isOpen]);
  const [shareStatus, setShareStatus] = useState('');
  const [showSessions, setShowSessions] = useState(false);

  const learningSuggestions = useMemo(() => {
    if (!isOpen) return [];
    const loop = new LearningLoop();
    return loop.getSuggestions();
  }, [isOpen]);

  const conflictStats = useMemo(() => {
    if (!isOpen) return null;
    const loop = new LearningLoop();
    const allEvents = loop.getAll();
    const conflicts = allEvents.filter(e => e.type === 'conflict_resolved');
    
    const resolutions = {
      overwrite_with_canvas: 0,
      discard_canvas: 0,
      show_both_manual_fix: 0,
      cancel: 0
    };
    
    conflicts.forEach(c => {
      const resolution = c.data?.resolution;
      if (resolution && resolutions[resolution] !== undefined) {
        resolutions[resolution]++;
      }
    });
    
    return {
      total: conflicts.length,
      resolutions
    };
  }, [isOpen]);

  const receiptCompliance = useMemo(() => {
    if (!isOpen) return null;
    const loop = new LearningLoop();
    const stats = loop.getStatistics();
    
    const fixesApplied = Object.values(stats.mostAppliedFixes || {}).reduce((a, b) => a + b, 0);
    const rulesDismissed = Object.values(stats.mostDismissedRules || {}).reduce((a, b) => a + b, 0);
    const total = fixesApplied + rulesDismissed;
    
    return {
      fixesApplied,
      rulesDismissed,
      total,
      complianceRate: total > 0 ? (fixesApplied / total * 100).toFixed(0) : 0
    };
  }, [isOpen]);

  const interestLabels = {
    very: 'Very — I\'d pay for this',
    somewhat: 'Somewhat — I\'d try it',
    not: 'Not really — not for me'
  };

  const pilotLabels = {
    yes: 'Yes — would try on our codebase',
    maybe: 'Maybe — depends on setup',
    no: 'No — not for our team'
  };

  if (!isOpen || !scorecard) return null;

  const recClass = scorecard.recommendation === 'GO'
    ? 'scorecard-rec-go'
    : scorecard.recommendation === 'NO-GO'
      ? 'scorecard-rec-nogo'
      : 'scorecard-rec-continue';

  const handleShareScorecard = async () => {
    const payload = buildScorecardSharePayload(scorecard);
    const result = await copyShareLink(payload);
    setShareStatus(result.ok ? `Copied ${result.url}` : `Share: ${result.url}`);
  };

  const handleShareWrapped = async () => {
    const payload = buildSyncWrappedPayload(scorecard.learning);
    await openNativeShare(payload);
    setShareStatus('Opened share sheet');
  };

  return (
    <div className="demo-script-overlay" onClick={onClose}>
      <div className="demo-script-modal validation-scorecard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="demo-script-header">
          <h2>Session scorecard</h2>
          <button type="button" className="demo-script-close" onClick={onClose}>×</button>
        </div>

        <div className="demo-script-body">
          <div className={`validation-scorecard-rec ${recClass}`}>
            <span className="validation-scorecard-rec-label">{scorecard.recommendation}</span>
            <p>{scorecard.recommendationDetail}</p>
          </div>

          <div className="validation-scorecard-grid">
            <div className="validation-scorecard-stat">
              <span className="validation-scorecard-stat-value">{scorecard.sessions.completed}</span>
              <span className="validation-scorecard-stat-label">Sessions</span>
            </div>
            <div className="validation-scorecard-stat">
              <span className="validation-scorecard-stat-value">{scorecard.interest.very}</span>
              <span className="validation-scorecard-stat-label">Very interested</span>
            </div>
            <div className="validation-scorecard-stat">
              <span className="validation-scorecard-stat-value">{scorecard.pilot.yes}</span>
              <span className="validation-scorecard-stat-label">Would pilot</span>
            </div>
            <div className="validation-scorecard-stat">
              <span className="validation-scorecard-stat-value">{scorecard.learning.totalEvents}</span>
              <span className="validation-scorecard-stat-label">Learning events</span>
            </div>
            <div className={`validation-scorecard-stat ${learningSuggestions.length > 0 ? 'validation-scorecard-stat-highlight' : ''}`}>
              <span className="validation-scorecard-stat-value">{learningSuggestions.length}</span>
              <span className="validation-scorecard-stat-label">Policy suggestions</span>
            </div>
            <div className="validation-scorecard-stat">
              <span className="validation-scorecard-stat-value">{scorecard.learning.roundTripsCanvas + scorecard.learning.roundTripsCode}</span>
              <span className="validation-scorecard-stat-label">Round-trips</span>
            </div>
            {conflictStats && conflictStats.total > 0 && (
              <div className="validation-scorecard-stat">
                <span className="validation-scorecard-stat-value">{conflictStats.total}</span>
                <span className="validation-scorecard-stat-label">Conflicts resolved</span>
              </div>
            )}
            {receiptCompliance && receiptCompliance.total > 0 && (
              <div className={`validation-scorecard-stat ${receiptCompliance.complianceRate >= 70 ? 'validation-scorecard-stat-success' : ''}`}>
                <span className="validation-scorecard-stat-value">{receiptCompliance.complianceRate}%</span>
                <span className="validation-scorecard-stat-label">Receipt compliance</span>
              </div>
            )}
            <div className="validation-scorecard-stat" title={`${scorecard.receipts.fixesApplied} fixes, ${scorecard.receipts.rulesDismissed} dismissals`}>
              <span className="validation-scorecard-stat-value">{Math.round(scorecard.receipts.fixDismissRatio * 100)}%</span>
              <span className="validation-scorecard-stat-label">Fix ratio</span>
            </div>
          </div>

          {learningSuggestions.length > 0 && (
            <div className="validation-scorecard-suggestions-callout">
              <div className="validation-scorecard-suggestions-header">
                <span className="validation-scorecard-suggestions-icon">💡</span>
                <span className="validation-scorecard-suggestions-title">
                  {learningSuggestions.length} policy {learningSuggestions.length === 1 ? 'suggestion' : 'suggestions'} available
                </span>
              </div>
              <p className="validation-scorecard-suggestions-desc">
                Based on fix/dismiss patterns, the learning loop has suggestions to optimize your team policy. 
                View them in the Receipts panel during your next session.
              </p>
            </div>
          )}

          {conflictStats && conflictStats.total > 0 && (
            <div className="validation-scorecard-conflict-summary">
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 600 }}>Conflict Resolution (SPEC §10)</h4>
              <div className="conflict-resolution-grid">
                <div className="conflict-resolution-item">
                  <span className="conflict-resolution-count">{conflictStats.resolutions.overwrite_with_canvas}</span>
                  <span className="conflict-resolution-label">Keep Canvas</span>
                </div>
                <div className="conflict-resolution-item">
                  <span className="conflict-resolution-count">{conflictStats.resolutions.discard_canvas}</span>
                  <span className="conflict-resolution-label">Keep Code</span>
                </div>
                <div className="conflict-resolution-item">
                  <span className="conflict-resolution-count">{conflictStats.resolutions.show_both_manual_fix || 0}</span>
                  <span className="conflict-resolution-label">Manual Fix</span>
                </div>
              </div>
            </div>
          )}

          {receiptCompliance && receiptCompliance.total > 0 && (
            <div className="validation-scorecard-receipt-compliance">
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 600 }}>
                Receipt Compliance Badge
                <span style={{ 
                  marginLeft: '8px',
                  padding: '2px 8px',
                  background: receiptCompliance.complianceRate >= 70 ? '#10b981' : receiptCompliance.complianceRate >= 50 ? '#f59e0b' : '#ef4444',
                  color: '#fff',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {receiptCompliance.complianceRate}%
                </span>
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0' }}>
                {receiptCompliance.fixesApplied} fixes applied, {receiptCompliance.rulesDismissed} rules dismissed (total: {receiptCompliance.total})
              </p>
            </div>
          )}

          <h3 className="validation-scorecard-heading">Activation checklist</h3>
          <ul className="validation-scorecard-checks">
            {checks.map((check) => (
              <li key={check.id} className={check.done ? 'done' : ''}>
                <span className="validation-scorecard-check-icon">{check.done ? '✓' : '○'}</span>
                <span className="validation-scorecard-check-label">{check.label}</span>
                <span className="validation-scorecard-check-detail">{check.detail}</span>
              </li>
            ))}
          </ul>

          <h3 className="validation-scorecard-heading">
            Validation sessions ({sessions.length})
            {sessions.length > 0 && (
              <button 
                type="button" 
                className="validation-session-toggle"
                onClick={() => setShowSessions(!showSessions)}
                style={{ marginLeft: '10px', fontSize: '0.85rem', padding: '4px 8px' }}
              >
                {showSessions ? 'Hide' : 'Show'} sessions
              </button>
            )}
          </h3>

          {showSessions && sessions.length > 0 && (
            <div className="validation-sessions-list">
              {sessions.map((session, idx) => (
                <div key={idx} className="validation-session-card">
                  <div className="validation-session-header">
                    <span className="validation-session-number">Session {idx + 1}</span>
                    <span className="validation-session-date">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="validation-session-details">
                    <div className="validation-session-field">
                      <strong>Interest:</strong> {interestLabels[session.interest] || session.interest || 'not recorded'}
                    </div>
                    <div className="validation-session-field">
                      <strong>Pilot:</strong> {pilotLabels[session.pilot] || session.pilot || 'not recorded'}
                    </div>
                    {session.role && (
                      <div className="validation-session-field">
                        <strong>Role:</strong> {session.role}
                      </div>
                    )}
                    {session.sessionMetrics && (
                      <>
                        <div className="validation-session-field">
                          <strong>Activation:</strong>{' '}
                          {session.sessionMetrics.activation?.complete ? (
                            <span className="validation-session-success">✓ Complete</span>
                          ) : (
                            <span className="validation-session-incomplete">
                              Canvas: {session.sessionMetrics.activation?.roundTripCanvas ? '✓' : '○'}{' '}
                              Code: {session.sessionMetrics.activation?.roundTripCode ? '✓' : '○'}
                            </span>
                          )}
                        </div>
                        <div className="validation-session-field">
                          <strong>Receipt actions:</strong> {session.sessionMetrics.receiptActions?.total || 0}
                          {' '}({session.sessionMetrics.receiptActions?.fixesApplied || 0} fixed, {session.sessionMetrics.receiptActions?.rulesDismissed || 0} dismissed)
                        </div>
                      </>
                    )}
                    {session.comment && (
                      <div className="validation-session-field">
                        <strong>Notes:</strong> {session.comment}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {sessions.length === 0 && (
            <div className="validation-empty-state">
              <div className="validation-empty-state-icon">📊</div>
              <h4 className="validation-empty-state-title">No validation sessions yet</h4>
              <p className="validation-empty-state-text">
                Run facilitator mode (`?facilitator=1`) with users to collect feedback. 
                Target 8–10 sessions to reach kill criteria (SPEC §8).
              </p>
              <p className="validation-empty-state-hint">
                <strong>Quick start:</strong> Share bluepainter-studio.vercel.app → collect feedback (··· → Share feedback) → export results here
              </p>
            </div>
          )}

          <h3 className="validation-scorecard-heading">Kill criteria check (SPEC §8)</h3>
          <div className="validation-kill-criteria">
            <p>
              <strong>Target:</strong> After 10 sessions, need 3+ "very interested" + willingness to pilot
            </p>
            <p className="validation-kill-status">
              {scorecard.sessions.completed < 10 ? (
                <span>
                  ⏳ Continue testing ({scorecard.sessions.completed}/10 sessions, {scorecard.interest.very} very interested, {scorecard.pilot.yes} pilot yes)
                </span>
              ) : scorecard.interest.very >= 3 ? (
                <span style={{ color: 'var(--success-green, #10b981)' }}>
                  ✓ GO — {scorecard.interest.very} "very interested", {scorecard.pilot.yes} pilot yes
                </span>
              ) : (
                <span style={{ color: 'var(--error-red, #ef4444)' }}>
                  ✗ KILL — After {scorecard.sessions.completed} sessions, only {scorecard.interest.very} "very interested" (need 3+)
                </span>
              )}
            </p>
          </div>

          <p className="validation-script-intro">
            Export JSON after each session for go/no-go review. Share a viral scorecard card to X/LinkedIn.
          </p>
          {shareStatus && <p className="validation-script-intro">{shareStatus}</p>}
        </div>

        <div className="demo-script-actions">
          <button 
            type="button" 
            className="feedback-cancel-btn"
            onClick={() => {
              const result = downloadPilotPackExport();
              if (result.success) {
                setShareStatus(`✓ Exported pilot pack with ${result.sessionCount} session(s)`);
              } else {
                setShareStatus(`Error: ${result.error}`);
              }
            }}
            title="Export comprehensive pilot pack with all metrics and next steps"
          >
            📦 Export pilot pack
          </button>
          <button type="button" className="feedback-cancel-btn" onClick={() => downloadValidationExport()}>
            Export session JSON
          </button>
          <button type="button" className="feedback-cancel-btn" onClick={handleShareScorecard}>
            Copy share card
          </button>
          <button type="button" className="feedback-cancel-btn" onClick={handleShareWrapped}>
            Sync Wrapped
          </button>
          <button type="button" className="landing-cta-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
