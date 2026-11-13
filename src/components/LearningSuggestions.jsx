import { useMemo, useState } from 'react';

/**
 * Display learning loop suggestions (SPEC §3)
 * Shows weighted suggestions from fix/dismiss patterns
 * @param {Object} props
 * @param {import('../utils/learningLoop').LearningLoop} props.learningLoop
 * @param {boolean} props.lightMode
 * @param {Function} props.onApplySuggestion - Callback when suggestion is applied
 */
export default function LearningSuggestions({ learningLoop, lightMode = false, onApplySuggestion }) {
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());
  
  const suggestions = useMemo(() => {
    if (!learningLoop) return [];
    return learningLoop.getSuggestions();
  }, [learningLoop]);

  const handleApplySuggestion = (suggestion) => {
    const key = `${suggestion.type}-${suggestion.ruleId || suggestion.fixKey}`;
    
    if (appliedSuggestions.has(key)) {
      return;
    }
    
    const confirmMessage = suggestion.type === 'downgrade_rule'
      ? `Hide rule "${suggestion.ruleId}" from receipts? This will update your policy.`
      : `Remember to prefer quick-fix for "${suggestion.fixKey}"? This will make the fix more prominent.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setAppliedSuggestions(prev => new Set([...prev, key]));
    onApplySuggestion?.(suggestion);
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`learning-suggestions ${lightMode ? 'learning-suggestions-light' : ''}`}>
      <div className="learning-suggestions-header">
        <span className="learning-icon">💡</span>
        <span className="learning-title">Learning Suggestions</span>
      </div>
      
      <div className="suggestions-list">
        {suggestions.slice(0, 3).map((suggestion, index) => {
          const suggestionKey = `${suggestion.type}-${suggestion.ruleId || suggestion.fixKey}`;
          const isApplied = appliedSuggestions.has(suggestionKey);
          
          return (
            <div key={`${suggestion.type}-${suggestion.ruleId || suggestion.fixKey}-${index}`} className={`suggestion-card ${isApplied ? 'suggestion-applied' : ''}`}>
              <div className="suggestion-type-badge">
                {isApplied ? '✓' : suggestion.type === 'downgrade_rule' ? '📉' : '⚡'}
              </div>
              <div className="suggestion-content">
                <div className="suggestion-reason">{suggestion.reason}</div>
                <div className="suggestion-action">{suggestion.action}</div>
                {suggestion.type === 'downgrade_rule' && (
                  <div className="suggestion-meta">
                    Rule: <code>{suggestion.ruleId}</code>
                  </div>
                )}
                {suggestion.type === 'prefer_quick_fix' && (
                  <div className="suggestion-meta">
                    Fix: <code>{suggestion.fixKey}</code>
                  </div>
                )}
                {!isApplied && onApplySuggestion && (
                  <button
                    type="button"
                    className="suggestion-apply-btn"
                    onClick={() => handleApplySuggestion(suggestion)}
                  >
                    Apply
                  </button>
                )}
                {isApplied && (
                  <div className="suggestion-applied-label">Applied</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .learning-suggestions {
          margin: 12px;
          padding: 12px;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
        }

        .learning-suggestions-light {
          background: rgba(59, 130, 246, 0.03);
          border-color: rgba(59, 130, 246, 0.15);
        }

        .learning-suggestions-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #3b82f6;
        }

        .learning-icon {
          font-size: 1rem;
        }

        .learning-title {
          flex: 1;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .suggestion-card {
          display: flex;
          gap: 10px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          font-size: 0.8rem;
        }

        .learning-suggestions-light .suggestion-card {
          background: rgba(0, 0, 0, 0.02);
        }

        .suggestion-type-badge {
          font-size: 1.2rem;
          line-height: 1;
        }

        .suggestion-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .suggestion-reason {
          font-weight: 500;
          color: #e2e8f0;
        }

        .learning-suggestions-light .suggestion-reason {
          color: #1e293b;
        }

        .suggestion-action {
          color: #94a3b8;
          font-size: 0.75rem;
        }

        .learning-suggestions-light .suggestion-action {
          color: #64748b;
        }

        .suggestion-meta {
          margin-top: 4px;
          font-size: 0.7rem;
          color: #64748b;
        }

        .suggestion-meta code {
          padding: 2px 4px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.7rem;
        }

        .learning-suggestions-light .suggestion-meta code {
          background: rgba(0, 0, 0, 0.05);
          color: #475569;
        }

        .suggestion-apply-btn {
          margin-top: 8px;
          padding: 4px 12px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #fff;
          background: #3b82f6;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .suggestion-apply-btn:hover {
          background: #2563eb;
        }

        .suggestion-applied-label {
          margin-top: 8px;
          padding: 4px 12px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #10b981;
          border: 1px solid #10b981;
          border-radius: 4px;
          text-align: center;
        }

        .suggestion-card.suggestion-applied {
          opacity: 0.6;
          background: rgba(16, 185, 129, 0.05);
        }

        .learning-suggestions-light .suggestion-card.suggestion-applied {
          background: rgba(16, 185, 129, 0.03);
        }
      `}</style>
    </div>
  );
}
