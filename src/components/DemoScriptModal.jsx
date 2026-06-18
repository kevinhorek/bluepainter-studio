const DEMO_SCRIPT = {
  title: 'BluePainter Studio — Validation Demo Script',
  duration: '5–7 minutes',
  audience: 'Designers, frontend developers, founders/PMs',
  sections: [
    {
      heading: '1. Hook (30 sec)',
      items: [
        'Open the landing page. Ask: "How do you go from design to shippable React code today?"',
        'One-liner: "BluePainter is a visual canvas ↔ code workspace — edit either side, both stay in sync, with live design-quality receipts."'
      ]
    },
    {
      heading: '2. Mini playground (1 min)',
      items: [
        'Scroll to Interactive Sandbox on the landing page.',
        'Drag padding and radius sliders — point out the live TSX preview updating.',
        'Click "Fails Contrast" — note how a real product would catch this automatically.'
      ]
    },
    {
      heading: '3. Full workspace (2 min)',
      items: [
        'Click "Launch Free Sandbox" or use ▶ Present in the header for an auto walkthrough.',
        'Select the CTA button on the canvas — show Inspector on the right.',
        'Click "Break Design" — Receipts panel flags contrast, spacing, copy, feature count.',
        'Click "Fix All" — canvas and code editor both update. Emphasize bidirectional sync.',
        'Edit padding in the code editor — canvas reflects the change.'
      ]
    },
    {
      heading: '4. Multi-surface vision (1 min)',
      items: [
        'Phase 1 — VS Code / Cursor side-by-side layout.',
        'Phase 3 — Figma plugin concept (designers stay in Figma).',
        'Phase 4 — same component across mobile, tablet, desktop.'
      ]
    },
    {
      heading: '5. Validation questions (2 min)',
      items: [
        'Would you use this in your current workflow? Why or why not?',
        'What would make this a must-have vs. nice-to-have?',
        'Who on your team would pay for this — design, eng, or both?',
        "What's the one thing you'd need before trusting the generated code in production?"
      ]
    },
    {
      heading: '6. Close',
      items: [
        'Open Share Feedback — capture their interest level and role.',
        'After sessions: Export Feedback (JSON) from the header to review responses.',
        'Decision gate: 3+ "very interested" from target users → build narrow v1 (one surface + real AST sync).'
      ]
    }
  ],
  notes: [
    'Reset between sessions so each viewer starts fresh.',
    "Let them click — don't drive the whole demo from the keyboard.",
    'Write down exact quotes when they lean in or push back.'
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
