import { useMemo, useState } from 'react';
import { buildSessionScorecard, getScorecardChecks } from '../utils/sessionScorecard';
import { getStoredFeedback } from '../utils/feedbackStorage';
import { downloadValidationExport } from '../utils/validationExport';
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
          </div>

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
                      <strong>Interest:</strong> {session.interest || 'not recorded'}
                    </div>
                    <div className="validation-session-field">
                      <strong>Pilot:</strong> {session.pilot || 'not recorded'}
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
            <p className="validation-script-intro">
              No validation sessions recorded yet. Run facilitator mode with users and collect feedback.
            </p>
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
