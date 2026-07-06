export default function MarketingPage({ onLaunchDemo, onShowFeedback }) {
  return (
    <div className="landing-page">
      <div className="landing-glow landing-glow-a" />
      <div className="landing-glow landing-glow-b" />

      <header className="landing-header">
        <div className="landing-logo">
          <div className="logo-icon"><div className="logo-dot" /></div>
          <span>BluePainter <span className="landing-logo-light">Studio</span></span>
        </div>
        <button type="button" className="landing-cta-sm" onClick={() => onLaunchDemo('phase1')}>
          Open Studio
        </button>
      </header>

      <section className="landing-hero">
        <p className="landing-eyebrow">Visual development for React teams</p>
        <h1>Design and code,<br />one surface.</h1>
        <p className="landing-lead">
          Edit on the canvas or in TSX — both stay in sync. Designer&apos;s Receipts catch contrast, spacing, and copy issues before you ship.
        </p>
        <div className="landing-actions">
          <button type="button" className="landing-cta-primary" onClick={() => onLaunchDemo('phase1')}>
            Open Studio
          </button>
          <button type="button" className="landing-cta-secondary" onClick={onShowFeedback}>
            Would you use this?
          </button>
        </div>
      </section>

      <section className="landing-features">
        {[
          {
            title: 'Bidirectional sync',
            desc: 'Canvas edits update code. Code edits update the canvas. One source of truth in your component file.'
          },
          {
            title: 'Designer\'s Receipts',
            desc: 'Live checks for contrast, grid alignment, and CTA quality — with one-click fixes that sync everywhere.'
          },
          {
            title: 'Repo-native',
            desc: 'Shippable React/TSX in your project — not a locked runtime or throwaway export.'
          }
        ].map((f) => (
          <div key={f.title} className="landing-feature-card">
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="landing-footer">
        <span>Prototype preview · Feedback helps us decide whether to build this</span>
        <button type="button" className="landing-footer-link" onClick={onShowFeedback}>
          Share feedback
        </button>
      </footer>
    </div>
  );
}
