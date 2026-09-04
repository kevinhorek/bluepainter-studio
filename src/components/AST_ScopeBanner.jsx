import { useState, useEffect } from 'react';
import { getASTMeta } from '../utils/syncEngine';

export default function ASTScopeBanner({ nodesMap, onDismiss }) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('bluepainter-ast-scope-banner-dismissed') === 'true';
  });

  const [astMeta, setAstMeta] = useState(null);

  useEffect(() => {
    if (nodesMap) {
      const meta = getASTMeta(nodesMap);
      setAstMeta(meta);
    }
  }, [nodesMap]);

  if (dismissed) return null;

  const nodeCount = Object.keys(nodesMap || {}).filter(k => !k.startsWith('_')).length;
  const hasNodes = nodeCount > 0;
  
  if (!hasNodes) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('bluepainter-ast-scope-banner-dismissed', 'true');
    onDismiss?.();
  };

  const issues = astMeta?.issues || {};
  const hasSpecificIssues = issues.hasComputedIds || issues.hasTailwindOnly || issues.missingIds;
  const foundIds = astMeta?.foundIds || 0;

  return (
    <div className={`ast-scope-banner ${hasSpecificIssues ? 'ast-scope-banner-warning' : ''}`}>
      <div className="ast-scope-banner-icon">{hasSpecificIssues ? '⚠️' : 'ℹ️'}</div>
      <div className="ast-scope-banner-content">
        <strong>AST Sync {hasSpecificIssues ? 'Limitations Detected' : 'Scope'} (v1)</strong>
        
        {hasSpecificIssues ? (
          <ul>
            {foundIds > 0 && (
              <li><strong>✅ {foundIds} element(s) with stable IDs found</strong></li>
            )}
            {issues.missingIds && (
              <li><strong>⚠️ Some elements lack id attributes</strong> — Add <code>id="..."</code> to make them canvas-editable</li>
            )}
            {issues.hasComputedIds && (
              <li><strong>❌ Computed IDs detected</strong> — Use string literals like <code>id="card-1"</code> instead of <code>id=&#123;`card-${'{i}'}`&#125;</code></li>
            )}
            {issues.hasTailwindOnly && (
              <li><strong>⚠️ Tailwind-only styling detected</strong> — Classes preserved but NOT editable. Add <code>style=&#123;&#123;...&#125;&#125;</code> for canvas editing</li>
            )}
          </ul>
        ) : (
          <ul>
            <li><strong>✅ {foundIds} syncable element(s) found</strong></li>
            <li><strong>✅ Inline styles:</strong> <code>style=&#123;&#123;...&#125;&#125;</code> editable on canvas</li>
            <li><strong>⚠️ Tailwind/CSS Modules:</strong> Classes preserved but NOT editable on canvas</li>
            <li><strong>✅ Text content:</strong> Reliably round-trips to TSX</li>
          </ul>
        )}
        
        <p className="ast-scope-banner-docs">
          See <a href="https://github.com/kevinhorek/bluepainter-studio/blob/main/AST_SCOPE.md" target="_blank" rel="noopener noreferrer">AST_SCOPE.md</a> for full details.
        </p>
      </div>
      <button
        type="button"
        className="ast-scope-banner-dismiss"
        onClick={handleDismiss}
        title="Dismiss (don't show again)"
      >
        ×
      </button>
    </div>
  );
}
