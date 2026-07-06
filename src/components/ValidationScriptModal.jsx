const SECTIONS = [
  {
    title: 'Before (2 min)',
    items: [
      'Share: bluepainter-studio.vercel.app',
      'They open DashboardPage from the file menu — no guided tour unless stuck',
      'You: ?facilitator=1 for export + break/fix tools'
    ]
  },
  {
    title: 'Explore (5 min) — watch silently',
    items: [
      'Canvas edit → code updates?',
      'Code edit → canvas updates?',
      'Sidebar opens on select?',
      'Library tab → drag component onto page?',
      'Receipt pills at bottom when design fails?'
    ]
  },
  {
    title: 'Receipts (3 min)',
    items: [
      'Facilitator: Break design → PricingCard → select CTA',
      'They click a receipt message → sidebar opens',
      'Ask: "Would your team run this before merge?"'
    ]
  },
  {
    title: 'Close (5 min)',
    items: [
      '··· → Share feedback (very / somewhat / not)',
      'Ask: "Would you use this instead of Figma + IDE?"',
      'Ask: "What one thing would make you switch?"',
      'Facilitator: Export JSON after session'
    ]
  },
  {
    title: 'Go / no-go',
    items: [
      '≥3 "very interested" after 8 sessions → build v1 extension',
      '<3 willing to pilot after 10 → kill or pivot',
      'Full guide: VALIDATION.md in repo'
    ]
  }
];

export default function ValidationScriptModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="demo-script-overlay" onClick={onClose}>
      <div className="demo-script-modal validation-script-modal" onClick={(e) => e.stopPropagation()}>
        <div className="demo-script-header">
          <h2>Interview guide</h2>
          <button type="button" className="demo-script-close" onClick={onClose}>×</button>
        </div>
        <div className="demo-script-body">
          <p className="validation-script-intro">
            15–20 min per session. Let them drive. Full checklist in <strong>VALIDATION.md</strong>.
          </p>
          {SECTIONS.map((section) => (
            <div key={section.title} className="demo-script-section">
              <h3>{section.title}</h3>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="demo-script-actions">
          <button type="button" className="landing-cta-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
