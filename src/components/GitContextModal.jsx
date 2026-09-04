import { useState } from 'react';
import { getGitContext, updateGitContext, clearGitContext, hasGitContext, getGitContextSummary } from '../utils/gitContext';

export default function GitContextModal({ isOpen, onClose }) {
  // Initialize with current git context
  const initialContext = getGitContext();
  const [context, setContext] = useState({
    repoUrl: initialContext.repoUrl || '',
    branch: initialContext.branch || '',
    userName: initialContext.userName || '',
    userEmail: initialContext.userEmail || '',
    commitSha: initialContext.commitSha || ''
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setContext(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    updateGitContext(context);
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    if (confirm('Clear all git context? This will remove user, repo, and branch info from learning loop events.')) {
      clearGitContext();
      setContext({
        repoUrl: '',
        branch: '',
        userName: '',
        userEmail: '',
        commitSha: ''
      });
      setSaved(false);
    }
  };

  const handleClose = () => {
    setSaved(false);
    onClose();
  };

  if (!isOpen) return null;

  const isConfigured = hasGitContext();

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Git Context Settings</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Configure git context to enrich learning loop events with user, repo, and branch metadata.
            This enables better analytics for pilot validation and team audit logs.
          </p>

          {isConfigured && (
            <div className="git-context-status">
              <span className="git-context-status-icon">✓</span>
              <span className="git-context-status-text">{getGitContextSummary()}</span>
            </div>
          )}

          <div className="git-context-form">
            <div className="form-group">
              <label htmlFor="userName">Your Name</label>
              <input
                id="userName"
                type="text"
                className="form-input"
                placeholder="Jane Developer"
                value={context.userName}
                onChange={(e) => handleChange('userName', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="userEmail">Email</label>
              <input
                id="userEmail"
                type="email"
                className="form-input"
                placeholder="jane@example.com"
                value={context.userEmail}
                onChange={(e) => handleChange('userEmail', e.target.value)}
              />
              <p className="form-help">Used as user ID in learning loop events</p>
            </div>

            <div className="form-group">
              <label htmlFor="repoUrl">Repository URL</label>
              <input
                id="repoUrl"
                type="text"
                className="form-input"
                placeholder="https://github.com/org/repo"
                value={context.repoUrl}
                onChange={(e) => handleChange('repoUrl', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="branch">Branch</label>
              <input
                id="branch"
                type="text"
                className="form-input"
                placeholder="feature/pricing-update"
                value={context.branch}
                onChange={(e) => handleChange('branch', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="commitSha">Commit SHA (Optional)</label>
              <input
                id="commitSha"
                type="text"
                className="form-input"
                placeholder="abc123def456..."
                value={context.commitSha}
                onChange={(e) => handleChange('commitSha', e.target.value)}
              />
            </div>
          </div>

          <div className="git-context-tip">
            <strong>Tip:</strong> You can also set context via URL:
            <code style={{ display: 'block', marginTop: '8px', fontSize: '12px', padding: '8px', background: '#f5f5f5', borderRadius: '4px', overflowX: 'auto' }}>
              ?repo=https://github.com/org/repo&branch=main&userName=Jane&userEmail=jane@example.com
            </code>
          </div>
        </div>

        <div className="modal-footer">
          {isConfigured && (
            <button type="button" className="btn-danger" onClick={handleClear}>
              Clear
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saved}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
