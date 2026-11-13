/**
 * Post-export confirmation modal with merge-ready guidance
 * Shows after TSX export with path guidance and workflow tips
 */
export default function ExportConfirmationModal({ isOpen, onClose, exportResult }) {
  if (!isOpen || !exportResult) return null;

  const { filename, componentName, linesOfCode } = exportResult;
  const suggestedPath = `src/components/${filename}`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel export-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="export-confirm-icon">✓</div>
          <h2>Component Exported</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="export-confirm-file-info">
            <div className="export-confirm-file-badge">
              <span className="export-confirm-filename">{filename}</span>
              <span className="export-confirm-meta">{linesOfCode} lines</span>
            </div>
            <p className="export-confirm-status">
              Downloaded to your browser's download folder
            </p>
          </div>

          <div className="export-confirm-section">
            <h3>📁 Next: Add to Your Repo</h3>
            <p>Copy <code>{filename}</code> into your project's component directory:</p>
            <div className="export-confirm-code-block">
              <code>{suggestedPath}</code>
            </div>
          </div>

          <div className="export-confirm-section">
            <h3>🔗 Import in Your App</h3>
            <p>Use the exported component in your pages or layouts:</p>
            <div className="export-confirm-code-block">
              <pre>{`import { ${componentName} } from './components/${componentName}';\n\nfunction App() {\n  return <${componentName} />;\n}`}</pre>
            </div>
          </div>

          <div className="export-confirm-section">
            <h3>✅ Recommended Workflow</h3>
            <ol className="export-confirm-checklist">
              <li>Move <code>{filename}</code> to <code>{suggestedPath}</code></li>
              <li>Test the component in your dev environment</li>
              <li>Run <code>npm run lint</code> to verify formatting</li>
              <li>Commit and push when ready</li>
            </ol>
          </div>

          <div className="export-confirm-note">
            <strong>Note:</strong> This file preserves your existing code structure and comments (AST-based sync).
            Inline styles are canvas-editable; Tailwind classes are preserved.
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>

      <style>{`
        .export-confirm-modal {
          max-width: 600px;
          width: 90%;
        }

        .export-confirm-icon {
          font-size: 3rem;
          line-height: 1;
          color: var(--success-color);
          margin-bottom: 8px;
        }

        .export-confirm-file-info {
          padding: 16px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .export-confirm-file-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .export-confirm-filename {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-color);
        }

        .export-confirm-meta {
          padding: 2px 8px;
          font-size: 0.75rem;
          color: #64748b;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }

        .export-confirm-status {
          margin: 0;
          font-size: 0.85rem;
          color: #64748b;
        }

        .export-confirm-section {
          margin-bottom: 24px;
        }

        .export-confirm-section h3 {
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: var(--text-color);
        }

        .export-confirm-section p {
          margin: 0 0 12px 0;
          font-size: 0.85rem;
          color: #94a3b8;
          line-height: 1.5;
        }

        .export-confirm-code-block {
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.8rem;
          overflow-x: auto;
        }

        .export-confirm-code-block code {
          color: #e2e8f0;
        }

        .export-confirm-code-block pre {
          margin: 0;
          color: #94a3b8;
          line-height: 1.6;
          white-space: pre;
        }

        .export-confirm-checklist {
          margin: 0;
          padding-left: 24px;
          font-size: 0.85rem;
          color: #94a3b8;
          line-height: 1.8;
        }

        .export-confirm-checklist li {
          margin-bottom: 6px;
        }

        .export-confirm-checklist code {
          padding: 2px 6px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.8rem;
          color: #e2e8f0;
        }

        .export-confirm-note {
          padding: 12px;
          font-size: 0.8rem;
          color: #64748b;
          background: rgba(59, 130, 246, 0.05);
          border-left: 3px solid rgba(59, 130, 246, 0.3);
          border-radius: 4px;
          line-height: 1.5;
        }

        .export-confirm-note strong {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
