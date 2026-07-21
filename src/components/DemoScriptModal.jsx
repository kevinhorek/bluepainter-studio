const DEMO_SCRIPT = {
  title: 'BluePainter — Validation Demo Script',
  duration: '5–7 minutes',
  audience: 'Designers, frontend developers, founders/PMs',
  sections: [
    {
      heading: '1. Hook (30 sec)',
      items: [
        'Ask: "How do you go from design to shippable React code in your repo today?"',
        'One-liner: "BluePainter is AST-preserving canvas ↔ code sync with team policy receipts — not an AI generator."',
        'Bear case: "If Cursor + Figma ship this in 90 days, we win on repo round-trip + learning loop, not UI."'
      ]
    },
    {
      heading: '2. Mini playground (1 min)',
      items: [
        'Scroll to Interactive Sandbox — sliders update live TSX.',
        'Click "Fails Contrast" — receipts catch this in the full workspace.',
        'Point to Strategy section: learning loop is the moat, not model intelligence.'
      ]
    },
    {
      heading: '3. Full workspace — v1 surface (2 min)',
      items: [
        'Launch Phase 1 (v1 target) — VS Code / Cursor layout.',
        'Open Team Policy in Receipts — change grid or contrast floor; note it persists.',
        '▶ Present or Break Design → show receipt warnings → Fix All or Dismiss.',
        'Edit code — canvas updates (round-trip logged to learning loop).',
        'Show learning loop strip: fixes + syncs compound over time.'
      ]
    },
    {
      heading: '4. Vision surfaces (30 sec — do not oversell)',
      items: [
        'Phase 2–4 are vision mocks deferred from v1 (see 📄 Spec).',
        'Only mention if time: Figma import in v2, not bidirectional v1.'
      ]
    },
    {
      heading: '5. Validation questions (2 min)',
      items: [
        'Would you pilot this in a real repo on your team?',
        'What would make this a must-have vs. nice-to-have?',
        'Who pays — design, eng, or both?',
        'What do you need before trusting generated code in production?',
        'Bear case: "Is Cursor/Figma good enough for your flow today?"'
      ]
    },
    {
      heading: '6. Close & decision gate',
      items: [
        'Share Feedback — capture interest + role.',
        '⬇ Export validation JSON (feedback + learning loop + policy + decision gate).',
        'Build v1 if: 3+ "very interested" willing to pilot in real repo.',
        'Kill if: after 10 sessions, <3 would pay or incumbents are "good enough".'
      ]
    }
  ],
  notes: [
    'Reset between sessions. Let them click.',
    'Capture exact quotes when they lean in or push back.',
    'Moat signal: they customize team policy or dismiss/fix receipts repeatedly.',
    'Full spec: SPEC.md or 📄 Spec in header.'
  ]
};

export default function DemoScriptModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handlePrint = () => window.print();

  return (
    <div className="feedback-modal-overlay demo-script-overlay" onClick={onClose}>
      <div className="demo-script-modal" onClick={(e) => e.stopPropagation()}>
        <div className="demo-script-header">
          <div>
            <h2>{DEMO_SCRIPT.title}</h2>
            <p className="feedback-subtitle">
              {DEMO_SCRIPT.duration} · {DEMO_SCRIPT.audience}
            </p>
          </div>
          <button type="button" className="demo-script-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="demo-script-body">
          {DEMO_SCRIPT.sections.map((section) => (
            <section key={section.heading} className="demo-script-section">
              <h3>{section.heading}</h3>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}

          <section className="demo-script-section demo-script-notes">
            <h3>Facilitator notes</h3>
            <ul>
              {DEMO_SCRIPT.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="feedback-modal-actions demo-script-actions">
          <button type="button" className="feedback-cancel-btn" onClick={handlePrint}>
            Print / Save PDF
          </button>
          <button type="button" className="feedback-submit-btn" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
