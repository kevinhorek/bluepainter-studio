const FEATURES = [
  {
    id: 'sync',
    icon: '↔',
    tag: 'Core',
    title: 'AST canvas ↔ code sync',
    desc: 'Edit visually or in TSX — Recast patches your file in place so comments and formatting survive.',
    highlight: true
  },
  {
    id: 'receipts',
    icon: '✓',
    tag: 'Governance',
    title: "Designer's Receipts",
    desc: 'Live contrast, spacing, copy, and clutter checks with one-click fixes that sync to code.',
    highlight: true
  },
  {
    id: 'pages',
    icon: '◫',
    tag: 'Compose',
    title: 'Pages + components',
    desc: 'Build DashboardPage from PricingCard and HeroSection — same files you ship to production.'
  },
  {
    id: 'figma-import',
    icon: '⎘',
    tag: 'Import',
    title: 'Import from Figma',
    desc: 'Pull frames via URL or pasted JSON into the canvas — edit and export as React.'
  },
  {
    id: 'export',
    icon: '↑',
    tag: 'Ship',
    title: 'Export & deploy',
    desc: 'Download a Vite app, push to GitHub, or deploy to Vercel — straight from BluePainter.'
  },
  {
    id: 'marketing',
    icon: '◎',
    tag: 'Grow',
    title: 'Marketing kit',
    desc: 'Generate landing pages, SEO copy, social images, and static deploys from your canvas design.'
  },
  {
    id: 'ai',
    icon: '✦',
    tag: 'AI',
    title: 'AI Generate',
    desc: 'Prompt hero sections, pricing, feature cards, and full marketing copy — applied to canvas nodes.'
  },
  {
    id: 'tools',
    icon: '▣',
    tag: 'Design',
    title: 'Figma-style tools',
    desc: 'Full toolbar: frames, shapes, text, pen, comments, hand pan — with keyboard shortcuts.'
  },
  {
    id: 'focus',
    icon: '⊞',
    tag: 'Workflow',
    title: 'Focus design or code',
    desc: 'Expand either panel to ~90% with one click — restore split view instantly.'
  },
  {
    id: 'vscode',
    icon: '{ }',
    tag: 'v1',
    title: 'VS Code extension',
    desc: 'Repo-native scaffold: analyze TSX ids in your editor — path to read/write real src/ files.'
  },
  {
    id: 'policy',
    icon: '⚙',
    tag: 'Teams',
    title: 'Team policy engine',
    desc: 'Configurable receipt rules, learning loop, and session scorecard for validation.'
  },
  {
    id: 'library',
    icon: '◆',
    tag: 'Compose',
    title: 'Component library',
    desc: 'Drag PricingCard and HeroSection onto pages — linked to source component files.'
  }
];

const WORKFLOW = [
  {
    step: '01',
    title: 'Design or import',
    desc: 'Start on canvas, import from Figma, or generate UI with AI — all editable layers.'
  },
  {
    step: '02',
    title: 'Sync & govern',
    desc: 'Code stays in sync both ways. Receipts flag contrast, spacing, and weak CTAs before merge.'
  },
  {
    step: '03',
    title: 'Ship & market',
    desc: 'Export React, push to GitHub/Vercel, and generate landing pages plus social collateral.'
  }
];

const INTEGRATIONS = [
  { name: 'Figma', desc: 'Import frames' },
  { name: 'GitHub', desc: 'Push repos' },
  { name: 'Vercel', desc: 'One-click deploy' },
  { name: 'OpenAI', desc: 'AI generate' },
  { name: 'VS Code', desc: 'Extension v1' }
];

function ProductMock() {
  return (
    <div className="landing-mock" aria-hidden>
      <div className="landing-mock-titlebar">
        <span className="landing-mock-dot" />
        <span className="landing-mock-dot" />
        <span className="landing-mock-dot" />
        <span className="landing-mock-file">DashboardPage.tsx</span>
      </div>
      <div className="landing-mock-body">
        <div className="landing-mock-pane landing-mock-design">
          <div className="landing-mock-sidebar" />
          <div className="landing-mock-canvas">
            <div className="landing-mock-card landing-mock-card-a" />
            <div className="landing-mock-card landing-mock-card-b" />
            <div className="landing-mock-receipt">Contrast 4.5:1 ✓</div>
          </div>
        </div>
        <div className="landing-mock-pane landing-mock-code">
          <pre>{`export function DashboardPage() {
  return (
    <div id="dashboard-page">
      <PricingCard />
      <HeroSection />
    </div>
  );
}`}</pre>
        </div>
      </div>
    </div>
  );
}

export default function MarketingPage({ onLaunchDemo, onShowFeedback }) {
  const openFacilitator = () => {
    const base = window.location.pathname || '/';
    window.location.assign(`${base}?facilitator=1#/app`);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="landing-page landing-page-v2">
      <div className="landing-glow landing-glow-a" />
      <div className="landing-glow landing-glow-b" />

      <header className="landing-header-bar">
        <div className="landing-header">
          <div className="landing-logo">
            <div className="logo-icon"><div className="logo-dot" /></div>
            <span>BluePainter</span>
          </div>
          <nav className="landing-nav">
            <button type="button" onClick={() => scrollTo('features')}>Features</button>
            <button type="button" onClick={() => scrollTo('workflow')}>Workflow</button>
            <button type="button" onClick={() => scrollTo('integrations')}>Integrations</button>
          </nav>
          <div className="landing-header-actions">
            <button type="button" className="landing-cta-sm" onClick={onShowFeedback}>
              Feedback
            </button>
            <button type="button" className="landing-cta-sm landing-cta-sm-primary" onClick={() => onLaunchDemo('phase1')}>
              Open BluePainter
            </button>
          </div>
        </div>
      </header>

      <section className="landing-hero-v2">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">Repo-native visual development</p>
          <h1>
            Design, code, ship —<br />
            <span className="landing-gradient-text">one surface.</span>
          </h1>
          <p className="landing-lead">
            BluePainter is a validation prototype for React teams: canvas and TSX stay in sync,
            Designer&apos;s Receipts enforce policy, and you export real projects — not throwaway codegen.
          </p>
          <div className="landing-actions">
            <button type="button" className="landing-cta-primary" onClick={() => onLaunchDemo('phase1')}>
              Try the live demo
            </button>
            <button type="button" className="landing-cta-secondary" onClick={() => scrollTo('features')}>
              See all features
            </button>
          </div>
          <div className="landing-hero-stats">
            <div><strong>12+</strong><span>Features</span></div>
            <div><strong>AST</strong><span>Format-preserving sync</span></div>
            <div><strong>0</strong><span>Lock-in runtime</span></div>
          </div>
        </div>
        <ProductMock />
      </section>

      <section id="features" className="landing-section">
        <div className="landing-section-head">
          <p className="landing-section-eyebrow">Everything in the prototype</p>
          <h2>Built for the full product loop</h2>
          <p>From Figma import to GitHub push — every feature in BluePainter is live in this demo.</p>
        </div>
        <div className="landing-bento">
          {FEATURES.map((f) => (
            <article
              key={f.id}
              className={`landing-bento-card ${f.highlight ? 'landing-bento-card-highlight' : ''}`}
            >
              <div className="landing-bento-top">
                <span className="landing-bento-icon">{f.icon}</span>
                <span className="landing-bento-tag">{f.tag}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="landing-section landing-section-alt">
        <div className="landing-section-head">
          <p className="landing-section-eyebrow">How it works</p>
          <h2>Design → govern → ship</h2>
        </div>
        <div className="landing-workflow">
          {WORKFLOW.map((w) => (
            <div key={w.step} className="landing-workflow-step">
              <span className="landing-workflow-num">{w.step}</span>
              <h3>{w.title}</h3>
              <p>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="integrations" className="landing-section">
        <div className="landing-section-head">
          <p className="landing-section-eyebrow">Integrations</p>
          <h2>Works with your stack</h2>
        </div>
        <div className="landing-integrations">
          {INTEGRATIONS.map((i) => (
            <div key={i.name} className="landing-integration-pill">
              <span className="landing-integration-name">{i.name}</span>
              <span className="landing-integration-desc">{i.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-compare">
        <div className="landing-compare-grid">
          <div className="landing-compare-col">
            <h3>Not another AI app generator</h3>
            <ul>
              <li>Round-trip in <em>your</em> repo with formatting preserved</li>
              <li>Receipts as team policy — not generic lint</li>
              <li>Learning loop compounds with usage</li>
            </ul>
          </div>
          <div className="landing-compare-col landing-compare-col-muted">
            <h3>What v0 / Figma don&apos;t own</h3>
            <ul>
              <li>Merge-ready TSX in existing codebases</li>
              <li>Configurable governance before CI</li>
              <li>Marketing kit tied to canvas source</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="facilitator-section">
        <div className="facilitator-inner">
          <div>
            <p className="facilitator-label">For facilitators</p>
            <h2 className="facilitator-title">Running validation sessions?</h2>
            <p className="facilitator-desc">
              Auto-present, break/fix scenarios, session scorecard, and JSON export for go/no-go decisions.
            </p>
          </div>
          <div className="facilitator-actions">
            <button type="button" className="facilitator-btn facilitator-btn-primary" onClick={openFacilitator}>
              Open facilitator mode
            </button>
            <button type="button" className="facilitator-btn" onClick={() => onLaunchDemo('phase1')}>
              Standard demo
            </button>
          </div>
        </div>
      </section>

      <section className="landing-cta-banner">
        <h2>Ready to click around?</h2>
        <p>BluePainter is a fully interactive prototype — edit canvas, edit code, export, deploy.</p>
        <div className="landing-actions landing-actions-center">
          <button type="button" className="landing-cta-primary" onClick={() => onLaunchDemo('phase1')}>
            Try BluePainter free
          </button>
          <button type="button" className="landing-cta-secondary" onClick={onShowFeedback}>
            Share feedback
          </button>
        </div>
      </section>

      <footer className="landing-footer landing-footer-v2">
        <div className="landing-footer-brand">
          <div className="logo-icon"><div className="logo-dot" /></div>
          <span>BluePainter</span>
        </div>
        <span className="landing-footer-note">Validation prototype · July 2026</span>
        <div className="landing-footer-links">
          <button type="button" className="landing-footer-link" onClick={() => onLaunchDemo('phase1')}>
            Demo
          </button>
          <a className="landing-footer-link" href="https://bluepainter-launch.vercel.app/pricing">
            Pricing
          </a>
          <a className="landing-footer-link" href="https://bluepainter-launch.vercel.app/pilot">
            Request pilot
          </a>
          <a className="landing-footer-link" href="https://bluepainter-launch.vercel.app/tools">
            Free tools
          </a>
          <button type="button" className="landing-footer-link" onClick={openFacilitator}>
            Facilitator
          </button>
          <button type="button" className="landing-footer-link" onClick={onShowFeedback}>
            Feedback
          </button>
        </div>
      </footer>
    </div>
  );
}
