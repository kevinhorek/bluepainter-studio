import { useState } from 'react';

export default function ASTScopeBanner({ nodesMap, onDismiss }) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('bluepainter-ast-scope-banner-dismissed') === 'true';
  });

  if (dismissed) return null;

  // Check for potential issues in the nodes
  const nodeCount = Object.keys(nodesMap || {}).length;
  const hasNodes = nodeCount > 0;
  
  // Only show if we have nodes loaded (means a real file was loaded)
  if (!hasNodes) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('bluepainter-ast-scope-banner-dismissed', 'true');
    onDismiss?.();
  };

  return (
    <div className="ast-scope-banner">
      <div className="ast-scope-banner-icon">ℹ️</div>
      <div className="ast-scope-banner-content">
        <strong>AST Sync Scope (v1)</strong>
        <ul>
          <li><strong>✅ Inline styles:</strong> <code>style=&#123;&#123;...&#125;&#125;</code> editable on canvas</li>
          <li><strong>⚠️ Tailwind/CSS Modules:</strong> Classes preserved but NOT editable on canvas</li>
          <li><strong>✅ Text content:</strong> Reliably round-trips to TSX</li>
          <li><strong>⚠️ Some style edits:</strong> May require manual verification (e.g., text color)</li>
        </ul>
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
