import { PRODUCT_SPEC_SECTIONS } from '../data/productSpec';

export default function SpecModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="feedback-modal-overlay demo-script-overlay" onClick={onClose}>
      <div className="demo-script-modal spec-modal" onClick={(e) => e.stopPropagation()}>
        <div className="demo-script-header">
          <div>
            <h2>Product Spec</h2>
            <p className="feedback-subtitle">
              Strategy-aligned build plan · Full doc in <code>SPEC.md</code>
            </p>
          </div>
          <button type="button" className="demo-script-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="demo-script-body">
          {PRODUCT_SPEC_SECTIONS.map((section) => (
            <section key={section.id} className="demo-script-section">
              <h3>{section.title}</h3>
              {section.body && <p className="spec-section-body">{section.body}</p>}
              {section.bullets && (
                <ul>
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="feedback-modal-actions demo-script-actions">
          <a
            href="https://github.com/kevinhorek/bluepainter-studio/blob/main/SPEC.md"
            target="_blank"
            rel="noopener noreferrer"
            className="feedback-cancel-btn"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            View full SPEC.md on GitHub
          </a>
          <button type="button" className="feedback-submit-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
