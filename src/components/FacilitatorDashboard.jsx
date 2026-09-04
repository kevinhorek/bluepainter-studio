import { useMemo } from 'react';
import { buildSessionScorecard } from '../utils/sessionScorecard';

export default function FacilitatorDashboard({ isOpen, onClose, learningLoop }) {
  const scorecard = useMemo(() => (isOpen ? buildSessionScorecard() : null), [isOpen]);
  const learningStats = useMemo(() => {
    if (!learningLoop || !isOpen) return null;
    return learningLoop.getStatistics();
  }, [learningLoop, isOpen]);

  if (!isOpen) return null;

  const repoUrl = 'https://github.com/kevinhorek/bluepainter-studio';
  const prListUrl = `${repoUrl}/pulls`;

  const killCriteriaStatus = scorecard ? {
    sessionsCompleted: scorecard.sessions.completed,
    sessionsTarget: scorecard.sessions.target,
    veryInterested: scorecard.interest.very,
    veryTarget: scorecard.interest.veryTarget,
    meetsTarget: scorecard.sessions.completed >= scorecard.sessions.target && scorecard.interest.very >= scorecard.interest.veryTarget,
    recommendation: scorecard.recommendation
  } : null;

  return (
    <div className="demo-script-overlay" onClick={onClose}>
      <div className="demo-script-modal" onClick={(e) => e.stopPropagation()}>
        <div className="demo-script-header">
          <h2>Facilitator Dashboard</h2>
          <button type="button" className="demo-script-close" onClick={onClose}>×</button>
        </div>

        <div className="demo-script-body">
          <section className="facilitator-section">
            <h3>Kill Criteria Status (SPEC §8)</h3>
            {killCriteriaStatus && (
              <div className="facilitator-status-grid">
                <div className="facilitator-stat">
                  <span className="facilitator-stat-label">Sessions</span>
                  <span className="facilitator-stat-value">
                    {killCriteriaStatus.sessionsCompleted}/{killCriteriaStatus.sessionsTarget}
                  </span>
                </div>
                <div className="facilitator-stat">
                  <span className="facilitator-stat-label">Very interested</span>
                  <span className="facilitator-stat-value">
                    {killCriteriaStatus.veryInterested}/{killCriteriaStatus.veryTarget}
                  </span>
                </div>
                <div className="facilitator-stat">
                  <span className="facilitator-stat-label">Recommendation</span>
                  <span className={`facilitator-stat-badge facilitator-stat-badge-${killCriteriaStatus.recommendation.toLowerCase()}`}>
                    {killCriteriaStatus.recommendation}
                  </span>
                </div>
              </div>
            )}
            {!killCriteriaStatus && (
              <p className="facilitator-empty">No validation sessions yet. Run sessions and collect feedback.</p>
            )}
          </section>

          <section className="facilitator-section">
            <h3>Learning Loop Stats</h3>
            {learningStats && learningStats.total > 0 ? (
              <>
                <div className="facilitator-stats-summary">
                  <div className="facilitator-stat-row">
                    <span className="facilitator-stat-key">Total events:</span>
                    <span className="facilitator-stat-val">{learningStats.total}</span>
                  </div>
                  <div className="facilitator-stat-row">
                    <span className="facilitator-stat-key">Round trips:</span>
                    <span className="facilitator-stat-val">{learningStats.roundTrips}</span>
                  </div>
                  <div className="facilitator-stat-row">
                    <span className="facilitator-stat-key">Policy changes:</span>
                    <span className="facilitator-stat-val">{learningStats.policyChanges}</span>
                  </div>
                </div>

                {Object.keys(learningStats.mostAppliedFixes).length > 0 && (
                  <div className="facilitator-subsection">
                    <h4>Most applied fixes:</h4>
                    <ul className="facilitator-list">
                      {Object.entries(learningStats.mostAppliedFixes)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([key, count]) => (
                          <li key={key}>
                            <code>{key}</code>: {count}x
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {Object.keys(learningStats.mostDismissedRules).length > 0 && (
                  <div className="facilitator-subsection">
                    <h4>Most dismissed rules:</h4>
                    <ul className="facilitator-list">
                      {Object.entries(learningStats.mostDismissedRules)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([key, count]) => (
                          <li key={key}>
                            <code>{key}</code>: {count}x
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {Object.keys(learningStats.byType).length > 0 && (
                  <div className="facilitator-subsection">
                    <h4>Events by type:</h4>
                    <ul className="facilitator-list">
                      {Object.entries(learningStats.byType)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => (
                          <li key={type}>
                            <code>{type}</code>: {count}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="facilitator-empty">No learning events yet. Interact with receipts to log events.</p>
            )}
          </section>

          <section className="facilitator-section">
            <h3>Open PRs</h3>
            <p className="facilitator-link-description">
              View all open pull requests for this repository:
            </p>
            <a 
              href={prListUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="facilitator-external-link"
            >
              {prListUrl} ↗
            </a>
          </section>
        </div>

        <div className="demo-script-actions">
          <button type="button" className="feedback-submit-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
