import { isFacilitatorMode } from '../utils/facilitatorMode';

export default function WelcomeModal({ onStart, onShowReceipts }) {
  const facilitator = isFacilitatorMode();
  
  return (
    <div className="welcome-overlay">
      <div className="welcome-modal">
        <div className="welcome-logo">
          <div className="logo-icon"><div className="logo-dot" /></div>
          <span>BluePainter</span>
        </div>
        <h1>Welcome to BluePainter Studio</h1>
        {facilitator && (
          <div style={{ 
            background: '#fef3c7', 
            border: '1px solid #fbbf24', 
            borderRadius: '8px', 
            padding: '12px', 
            marginBottom: '16px',
            fontSize: '0.85rem',
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#d97706' }}>🎯 Facilitator mode active</strong>
            <p style={{ margin: '4px 0 0 0', color: '#92400e' }}>
              You're running a validation session. Participants see the regular demo. 
              Track metrics via <strong>··· → Session checklist</strong> and export results via <strong>··· → Session scorecard</strong>.
            </p>
          </div>
        )}
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
            Try the demo
          </button>
          <button type="button" className="welcome-secondary" onClick={onShowReceipts}>
            Show receipts in action
          </button>
        </div>
        <p className="welcome-footnote">
          <strong>Want to try your own .tsx file?</strong> Click <strong>📂 Open File</strong> in the top bar after entering the demo.
          Or use <strong>⏮️ Restore</strong> to recover an auto-saved backup.
        </p>
      </div>
    </div>
  );
}
