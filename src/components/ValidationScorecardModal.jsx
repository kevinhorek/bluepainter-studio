import { useMemo, useState } from 'react';
import { buildSessionScorecard, getScorecardChecks } from '../utils/sessionScorecard';
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
  const [shareStatus, setShareStatus] = useState('');

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
