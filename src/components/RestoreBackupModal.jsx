import { useState, useEffect } from 'react';
import { getBackupIndex, getBackup, deleteBackup, clearAllBackups, formatBackupTimestamp } from '../utils/autoSaveBackup';

export default function RestoreBackupModal({ isOpen, onClose, onRestore }) {
  const [backups, setBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBackups();
    }
  }, [isOpen]);

  const loadBackups = () => {
    const index = getBackupIndex();
    setBackups(index);
  };

  const handleSelectBackup = (backupId) => {
    const backup = getBackup(backupId);
    setSelectedBackup(backup);
  };

  const handleRestore = () => {
    if (!selectedBackup) return;
    onRestore(selectedBackup);
    setSelectedBackup(null);
    onClose();
  };

  const handleDelete = (backupId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this backup?')) {
      deleteBackup(backupId);
      loadBackups();
      if (selectedBackup?.id === backupId) {
        setSelectedBackup(null);
      }
    }
  };

  const handleClearAll = () => {
    setShowConfirm(true);
  };

  const handleConfirmClearAll = () => {
    clearAllBackups();
    setBackups([]);
    setSelectedBackup(null);
    setShowConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel restore-backup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Restore from Backup</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {showConfirm ? (
            <div className="confirm-clear">
              <p><strong>Delete all backups?</strong></p>
              <p>This action cannot be undone.</p>
              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleConfirmClearAll}
                >
                  Delete All
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : backups.length === 0 ? (
            <div className="no-backups">
              <p>No auto-save backups found.</p>
              <p className="help-text">
                Backups are automatically created every 30 seconds when editing a loaded file.
              </p>
            </div>
          ) : (
            <div className="backup-container">
              <div className="backup-list">
                <div className="backup-list-header">
                  <h3>Available Backups ({backups.length})</h3>
                  {backups.length > 0 && (
                    <button
                      type="button"
                      className="btn-text-danger"
                      onClick={handleClearAll}
                      title="Clear all backups"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                {backups.map(backup => (
                  <div
                    key={backup.id}
                    className={`backup-item ${selectedBackup?.id === backup.id ? 'selected' : ''}`}
                    onClick={() => handleSelectBackup(backup.id)}
                  >
                    <div className="backup-info">
                      <div className="backup-name">{backup.fileName || 'Untitled'}</div>
                      <div className="backup-meta">
                        {formatBackupTimestamp(backup.timestamp)} • {backup.nodeCount} nodes • {backup.codeLength} chars
                      </div>
                    </div>
                    <button
                      type="button"
                      className="backup-delete-btn"
                      onClick={(e) => handleDelete(backup.id, e)}
                      title="Delete backup"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              {selectedBackup && (
                <div className="backup-preview">
                  <h3>Preview</h3>
                  <div className="backup-preview-meta">
                    <strong>{selectedBackup.fileName}</strong>
                    <div className="backup-preview-stats">
                      {formatBackupTimestamp(selectedBackup.timestamp)}
                    </div>
                    <div className="backup-preview-stats">
                      {selectedBackup.nodeCount} nodes • {selectedBackup.codeLength} characters
                    </div>
                  </div>
                  <pre className="backup-code-preview">
                    {selectedBackup.code.slice(0, 500)}
                    {selectedBackup.code.length > 500 && '\n...\n(truncated)'}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-primary"
            onClick={handleRestore}
            disabled={!selectedBackup || showConfirm}
          >
            Restore Selected
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={showConfirm}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
