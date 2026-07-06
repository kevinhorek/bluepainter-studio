import TeamPolicyPanel from './TeamPolicyPanel';
import { evaluateReceipts, applyReceiptFix } from '../utils/receiptPolicy';

export default function ReceiptsPanel({
  component,
  nodesMap,
  onUpdateNode,
  lightMode = false,
  policy,
  onPolicyChange,
  dismissedRules = new Set(),
  onDismissRule,
  onFixApplied,
  learningSummary
}) {
  if (!component) {
    return (
      <div className={`receipts-pane ${lightMode ? 'receipts-light' : ''}`}>
        <div className="receipts-header">
          <div className="receipts-title">RECEIPTS</div>
        </div>
        <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
          Select a component to inspect team design policy
        </div>
      </div>
    );
  }

  const { rules, scores } = evaluateReceipts(nodesMap, component, policy, dismissedRules);

  const handleFix = (rule) => {
    applyReceiptFix(rule.fixKey, rule.fixMeta, nodesMap, onUpdateNode);
    onFixApplied?.(rule.id, rule.fixKey);
  };

  const handleDismiss = (ruleId) => {
    onDismissRule?.(ruleId);
  };

  return (
    <div className={`receipts-pane ${lightMode ? 'receipts-light' : ''}`} data-tour="receipts">
      <div className="receipts-header">
        <div className="receipts-title">
          <span>⚡ RECEIPTS</span>
          <span className="receipts-subtitle">Team policy engine</span>
        </div>
        <div className={`score-badge ${scores.total < 90 ? 'warning' : ''}`}>
          {scores.total}/100
        </div>
      </div>

      <div className="receipts-scroll">
        {onPolicyChange && (
          <TeamPolicyPanel policy={policy} onPolicyChange={onPolicyChange} />
        )}

        {learningSummary && learningSummary.totalEvents > 0 && (
          <div className="learning-loop-strip">
            <span>Learning loop</span>
            <span>{learningSummary.fixesApplied} fixes · {learningSummary.roundTripsCanvas + learningSummary.roundTripsCode} syncs</span>
          </div>
        )}

        <div className="score-metrics">
          {[
            { label: 'Design', score: scores.design },
            { label: 'Buildability', score: scores.buildability },
            { label: 'Accessibility', score: scores.accessibility }
          ].map(({ label, score }) => (
            <div className="metric-row" key={label}>
              <div className="metric-info">
                <span>{label}</span>
                <span>{score}</span>
              </div>
              <div className="metric-bar-bg">
                <div
                  className="metric-bar-fill"
                  style={{
                    width: `${score}%`,
                    background: score >= 90 ? 'var(--success-color)' : label === 'Accessibility' && score < 90 ? 'var(--danger-color)' : 'var(--warning-color)'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rules-list">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`rule-card ${rule.valid ? 'success' : rule.severity === 'error' ? 'warning error-rule' : 'warning'}`}
            >
              <span className="rule-icon">{rule.valid ? '✓' : rule.severity === 'error' ? '🚨' : '⚠️'}</span>
              <div className="rule-content">
                <div className="rule-title">{rule.title}</div>
                <div className="rule-desc">{rule.desc}</div>
                {rule.valid ? (
                  <span className="rule-tag">{rule.tag}</span>
                ) : (
                  <div className="rule-actions">
                    {rule.fixLabel && (
                      <button
                        type="button"
                        className="rule-action-btn"
                        style={rule.severity === 'error' ? { background: 'var(--danger-color)' } : undefined}
                        onClick={() => handleFix(rule)}
                      >
                        {rule.fixLabel}
                      </button>
                    )}
                    <button type="button" className="rule-dismiss-btn" onClick={() => handleDismiss(rule.id)}>
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="receipts-footer">
        <span>Team policy</span>
        <span>{policy.minContrastRatio}:1 contrast · {policy.spacingGrid}px grid</span>
      </div>
    </div>
  );
}
