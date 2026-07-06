import { useState, useEffect, useRef } from 'react';
import TeamPolicyPanel from './TeamPolicyPanel';
import { evaluateReceipts, applyReceiptFix } from '../utils/receiptPolicy';
import { isFacilitatorMode } from '../utils/facilitatorMode';

export default function ReceiptsPanel({
  component,
  nodesMap,
  onUpdateNode,
  lightMode = false,
  highlightRuleId = null,
  embedded = false,
  policy,
  onPolicyChange,
  dismissedRules = new Set(),
  onDismissRule,
  onFixApplied,
  learningSummary
}) {
  const [policyOpen, setPolicyOpen] = useState(false);
  const facilitator = isFacilitatorMode();
  const ruleRefs = useRef({});

  const receiptResult = component
    ? evaluateReceipts(nodesMap, component, policy, dismissedRules)
    : { rules: [], scores: { total: 0, design: 0, buildability: 0, accessibility: 0 } };
  const { rules, scores } = receiptResult;

  useEffect(() => {
    if (highlightRuleId && ruleRefs.current[highlightRuleId]) {
      ruleRefs.current[highlightRuleId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightRuleId, rules.length]);

  if (!component) {
    return (
      <div className={`receipts-pane ${lightMode ? 'receipts-light' : ''}`}>
        <div className="receipts-header">
          <div className="receipts-title">Receipts</div>
        </div>
        <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
          Select an element to view receipts
        </div>
      </div>
    );
  }

  const handleFix = (rule) => {
    applyReceiptFix(rule.fixKey, rule.fixMeta, nodesMap, onUpdateNode);
    onFixApplied?.(rule.id, rule.fixKey);
  };

  const handleDismiss = (ruleId) => {
    onDismissRule?.(ruleId);
  };

  return (
    <div className={`receipts-pane ${lightMode ? 'receipts-light' : ''} ${embedded ? 'receipts-pane-embedded' : ''}`} data-tour={embedded ? undefined : 'receipts'}>
      <div className="receipts-header">
        <div className="receipts-title">
          <span>Receipts</span>
        </div>
        <div className="receipts-header-actions">
          {onPolicyChange && (
            <button type="button" className="receipts-settings-btn" onClick={() => setPolicyOpen(!policyOpen)}>
              Rules
            </button>
          )}
          <div className={`score-badge ${scores.total < 90 ? 'warning' : ''}`}>
            {scores.total}
          </div>
        </div>
      </div>

      <div className="receipts-scroll">
        {policyOpen && onPolicyChange && (
          <TeamPolicyPanel policy={policy} onPolicyChange={onPolicyChange} compact={!facilitator} />
        )}

        {facilitator && learningSummary && learningSummary.totalEvents > 0 && (
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
              ref={(el) => { ruleRefs.current[rule.id] = el; }}
              className={`rule-card ${rule.valid ? 'success' : rule.severity === 'error' ? 'warning error-rule' : 'warning'} ${highlightRuleId === rule.id ? 'rule-card-highlight' : ''}`}
            >
              <span className="rule-icon">{rule.valid ? '✓' : rule.severity === 'error' ? '!' : '·'}</span>
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
        <span>Live checks</span>
        <span>{policy.minContrastRatio}:1 · {policy.spacingGrid}px grid</span>
      </div>
    </div>
  );
}
