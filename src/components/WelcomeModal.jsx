export default function WelcomeModal({ onStart, onShowReceipts }) {
  return (
    <div className="welcome-overlay">
      <div className="welcome-modal">
        <div className="welcome-logo">
          <div className="logo-icon"><div className="logo-dot" /></div>
          <span>BluePainter</span>
        </div>
        <h1>Welcome to BluePainter Studio</h1>
        <p className="welcome-lead">
          This is a fully interactive prototype. Edit on canvas or in code — both stay in sync. 
          Designer&apos;s Receipts catch contrast, spacing, and UX issues before you ship.
        </p>
        <ol className="welcome-steps">
          <li><strong>Click any element</strong> on the canvas to select and edit it</li>
          <li><strong>Switch files</strong> with the top bar — try PricingCard or DashboardPage</li>
          <li><strong>Open the sidebar</strong> (right rail icons) — inspect, receipts, or drag components from Library</li>
          <li><strong>Edit code directly</strong> — changes sync back to the canvas instantly</li>
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
          <strong>Your feedback matters.</strong> After exploring, click <strong>··· → Share feedback</strong> in the top bar.
          It helps us decide whether to build this for real.
        </p>
      </div>
    </div>
  );
}
