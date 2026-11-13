export default function PricingPage({ onBackToHome }) {
  return (
    <div className="pricing-page">
      <header className="pricing-header">
        <button 
          type="button" 
          className="pricing-back-btn"
          onClick={onBackToHome}
          aria-label="Back to home"
        >
          ← Back
        </button>
      </header>

      <section className="pricing-section">
        <p className="pricing-eyebrow">Pricing</p>
        <h1 className="pricing-title">Simple, transparent pricing</h1>
        <p className="pricing-lead">
          Start free. Upgrade when you need custom receipts and team policy. Enterprise for design systems at scale.
        </p>

        <div className="pricing-grid">
          <article className="pricing-card">
            <span className="pricing-badge">Always free</span>
            <h2 className="pricing-tier-name">Free</h2>
            <div className="pricing-price-block">
              <div className="pricing-price">$0</div>
              <div className="pricing-period">Forever</div>
            </div>
            <p className="pricing-description">For individual developers exploring BluePainter.</p>
            <ul className="pricing-features">
              <li>✓ Core receipts (contrast, spacing, CTA)</li>
              <li>✓ Canvas ↔ code sync</li>
              <li>✓ VS Code extension</li>
              <li>✓ Figma import</li>
              <li>✓ Export/deploy</li>
            </ul>
            <button 
              type="button"
              className="pricing-cta pricing-cta-primary" 
              onClick={onBackToHome}
            >
              Start free
            </button>
          </article>
          
          <article className="pricing-card pricing-card-popular">
            <span className="pricing-badge pricing-badge-popular">Most popular</span>
            <h2 className="pricing-tier-name">Pro</h2>
            <div className="pricing-price-block">
              <div className="pricing-price">$29</div>
              <div className="pricing-period">per user/month</div>
            </div>
            <p className="pricing-description">For teams that need custom receipt policies.</p>
            <ul className="pricing-features">
              <li>✓ Everything in Free</li>
              <li>✓ <strong>Custom receipts</strong></li>
              <li>✓ <strong>Team policy</strong> (<code>.bluepainter.json</code>)</li>
              <li>✓ Learning loop overrides</li>
              <li>✓ Priority support</li>
            </ul>
            <a 
              className="pricing-cta pricing-cta-primary" 
              href="mailto:kevinhorek@gmail.com?subject=BluePainter Pro inquiry"
            >
              Contact for Pro
            </a>
          </article>
          
          <article className="pricing-card">
            <span className="pricing-badge">Custom</span>
            <h2 className="pricing-tier-name">Enterprise</h2>
            <div className="pricing-price-block">
              <div className="pricing-price">Custom</div>
              <div className="pricing-period">Contact us</div>
            </div>
            <p className="pricing-description">For design systems orgs that ship at scale.</p>
            <ul className="pricing-features">
              <li>✓ Everything in Pro</li>
              <li>✓ <strong>CI gate</strong></li>
              <li>✓ Audit logs</li>
              <li>✓ Learning analytics</li>
              <li>✓ SSO</li>
              <li>✓ Custom policy engine</li>
              <li>✓ SLA</li>
            </ul>
            <a 
              className="pricing-cta pricing-cta-secondary" 
              href="mailto:kevinhorek@gmail.com?subject=BluePainter Enterprise inquiry"
            >
              Contact for Enterprise
            </a>
          </article>
        </div>

        <div className="pricing-details">
          <h2>Why open-core?</h2>
          <p>
            BluePainter&apos;s moat is the <strong>learning loop</strong> — receipts improve with team usage. Our pricing reflects this:
          </p>
          <ul>
            <li><strong>Free tier:</strong> Lowest friction for pilots. Core receipts are free forever.</li>
            <li><strong>Paid upgrade:</strong> Custom receipt policies and team governance unlock the learning loop&apos;s full value.</li>
            <li><strong>Defensible:</strong> Open-core model is harder for incumbents to copy than closed SaaS.</li>
          </ul>
          
          <h2>During pilot validation</h2>
          <p className="pricing-note">
            Pilot sessions are currently free while we validate product-market fit (SPEC §8). 
            Pricing may be refined based on pilot feedback, but this open-core structure is our recommended launch model.
          </p>
          
          <h2>Questions?</h2>
          <p>
            Have questions about pricing or need a custom plan?{' '}
            <a href="mailto:kevinhorek@gmail.com">Contact Kevin</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
