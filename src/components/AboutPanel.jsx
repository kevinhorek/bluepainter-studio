export default function AboutPanel({ open, onClose, onFeedback }) {
  if (!open) return null;

  return (
    <>
      <button type="button" className="drawer-backdrop" onClick={onClose} aria-label="Close" />
      <aside className="about-panel">
        <div className="about-panel-header">
          <h2>BluePainter Studio</h2>
          <button type="button" className="detail-drawer-close" onClick={onClose}>×</button>
        </div>
        <div className="about-panel-body">
          <p className="about-lead">Design and code on one surface. Edit the canvas or TSX — both stay in sync.</p>
          <ul className="about-list">
            <li><strong>Bidirectional sync</strong> — canvas and code share one source of truth</li>
            <li><strong>Designer&apos;s Receipts</strong> — live contrast, spacing, and copy checks</li>
            <li><strong>Page + components</strong> — compose full screens from component files</li>
          </ul>
          <button type="button" className="about-feedback-btn" onClick={() => { onFeedback(); onClose(); }}>
            Would you use this?
          </button>
        </div>
      </aside>
    </>
  );
}
