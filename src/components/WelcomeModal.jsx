export default function WelcomeModal({ onStart, onShowReceipts }) {
  return (
    <div className="welcome-overlay">
      <div className="welcome-modal">
        <div className="welcome-logo">
          <div className="logo-icon"><div className="logo-dot" /></div>
          <span>BluePainter</span>
        </div>
        <h1>Click around — it&apos;s a live prototype</h1>
        <p className="welcome-lead">
          Edit the design or the code. Both stay in sync. Designer&apos;s Receipts catch issues before you ship.
        </p>
        <ol className="welcome-steps">
          <li><strong>Click</strong> any element on the canvas</li>
          <li><strong>Switch files</strong> — try PricingCard or DashboardPage</li>
          <li><strong>Open the sidebar</strong> — inspect, receipts, or drag components from Library</li>
        </ol>
        <div className="welcome-actions">
          <button type="button" className="welcome-primary" onClick={onStart}>
            Start exploring
          </button>
          <button type="button" className="welcome-secondary" onClick={onShowReceipts}>
            Show me receipts
          </button>
        </div>
        <p className="welcome-footnote">
          When you&apos;re done, use <strong>··· → Share feedback</strong> — it helps us decide whether to build this.
        </p>
      </div>
    </div>
  );
}
