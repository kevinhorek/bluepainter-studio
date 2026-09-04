import { useState, useMemo } from 'react';

export default function ConflictDialog({ 
  isOpen, 
  onResolve, 
  conflictContext = {} 
}) {
  const [showDiff, setShowDiff] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const { lastSyncedCode, currentCode, pendingUpdate, nodeId } = conflictContext;

  const diffInfo = useMemo(() => {
    if (!lastSyncedCode || !currentCode) return null;

    const baseLines = lastSyncedCode.split('\n');
    const currentLines = currentCode.split('\n');
    const changes = [];

    for (let i = 0; i < Math.max(baseLines.length, currentLines.length); i++) {
      const baseLine = baseLines[i] || '';
      const currentLine = currentLines[i] || '';
      
      if (baseLine !== currentLine) {
        changes.push({
          lineNum: i + 1,
          before: baseLine,
          after: currentLine,
          type: baseLine && currentLine ? 'modified' : baseLine ? 'removed' : 'added'
        });
      }
    }

    return {
      totalChanges: changes.length,
      changes: changes.slice(0, 10)
    };
  }, [lastSyncedCode, currentCode]);

  const canvasChangeSummary = useMemo(() => {
    if (!pendingUpdate) return null;
    
    const parts = [];
    if (pendingUpdate.text !== undefined) {
      parts.push(`text: "${pendingUpdate.text}"`);
    }
    if (pendingUpdate.style) {
      const styleKeys = Object.keys(pendingUpdate.style);
      parts.push(`style: ${styleKeys.join(', ')}`);
    }
    
    return parts.join(' | ');
  }, [pendingUpdate]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => onResolve('cancel')}>
      <div className="modal conflict-dialog conflict-v2" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚠️ Conflict Detected</h2>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '0.75rem' }}>
            The code has been modified externally while you made canvas changes.
          </p>
          
          <div style={{ 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Canvas changes:</strong> 
              <span style={{ color: '#2563eb', marginLeft: '8px' }}>
                {canvasChangeSummary || 'Node update'}
              </span>
            </div>
            {diffInfo && (
              <div>
                <strong>Code changes:</strong> 
                <span style={{ color: '#dc2626', marginLeft: '8px' }}>
                  {diffInfo.totalChanges} line{diffInfo.totalChanges !== 1 ? 's' : ''} modified
                </span>
                {!showDiff && (
                  <button 
                    onClick={() => setShowDiff(true)}
                    style={{ 
                      marginLeft: '8px', 
                      color: '#2563eb', 
                      background: 'none', 
                      border: 'none',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Show diff
                  </button>
                )}
              </div>
            )}
          </div>

          {showDiff && diffInfo && (
            <div style={{
              background: '#1e293b',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '1rem',
              maxHeight: '200px',
              overflowY: 'auto',
              fontSize: '0.75rem',
              fontFamily: 'monospace'
            }}>
              {diffInfo.changes.map((change, idx) => (
                <div key={idx} style={{ marginBottom: '4px' }}>
                  <div style={{ color: '#94a3b8' }}>Line {change.lineNum}:</div>
                  {change.before && (
                    <div style={{ color: '#ef4444', paddingLeft: '8px' }}>
                      - {change.before}
                    </div>
                  )}
                  {change.after && (
                    <div style={{ color: '#22c55e', paddingLeft: '8px' }}>
                      + {change.after}
                    </div>
                  )}
                </div>
              ))}
              {diffInfo.totalChanges > 10 && (
                <div style={{ color: '#94a3b8', marginTop: '8px' }}>
                  ... and {diffInfo.totalChanges - 10} more changes
                </div>
              )}
            </div>
          )}
          
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
            <strong>Choose resolution:</strong>
          </p>
        </div>
        <div className="modal-footer" style={{ gap: '8px', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => onResolve('overwrite_with_canvas')}
              style={{ flex: 1 }}
            >
              Keep Canvas Changes
            </button>
            <button 
              className="btn" 
              onClick={() => onResolve('discard_canvas')}
              style={{ flex: 1 }}
            >
              Keep Code Changes
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => onResolve('show_both')}
              style={{ flex: 1 }}
              title="Review both changes side-by-side without applying either"
            >
              Review Both (Manual Fix)
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => onResolve('cancel')}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
