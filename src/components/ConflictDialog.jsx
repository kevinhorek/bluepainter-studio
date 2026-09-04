export default function ConflictDialog({ isOpen, onResolve }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => onResolve('cancel')}>
      <div className="modal conflict-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Conflict Detected</h2>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '1rem' }}>
            The code has been modified externally while you made canvas changes.
          </p>
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
            How do you want to proceed?
          </p>
        </div>
        <div className="modal-footer" style={{ gap: '8px' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => onResolve('overwrite_with_canvas')}
          >
            Overwrite with canvas
          </button>
          <button 
            className="btn" 
            onClick={() => onResolve('discard_canvas')}
          >
            Discard canvas changes
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => onResolve('cancel')}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
