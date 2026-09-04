import { useState, useRef } from 'react';
import { parseTSX } from '../utils/syncEngine';
import { getEmptyFigmaImportNodes } from '../utils/figmaImport';
import { 
  validateFileExtension, 
  validateFileContent, 
  validateParsedNodes,
  detectUnsupportedPatterns,
  formatValidationError 
} from '../utils/fileValidation';

export default function RealFileLoader({ isOpen, onClose, onFileLoaded }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const parseFile = async (file) => {
    setLoading(true);
    setError(null);
    setWarnings([]);

    try {
      const fileName = file.name;
      
      // Step 1: Validate file extension
      const extValidation = validateFileExtension(fileName);
      if (!extValidation.valid) {
        throw new Error(formatValidationError(extValidation));
      }

      // Step 2: Read and validate content
      const text = await file.text();
      const contentValidation = validateFileContent(text);
      if (!contentValidation.valid) {
        throw new Error(formatValidationError(contentValidation));
      }

      // Step 3: Parse with AST engine
      const baseNodes = getEmptyFigmaImportNodes();
      const parsedNodes = parseTSX(text, baseNodes);

      // Step 4: Validate parsed nodes
      const nodesValidation = validateParsedNodes(parsedNodes);
      if (!nodesValidation.valid) {
        throw new Error(formatValidationError(nodesValidation));
      }

      // Step 5: Check for warnings (non-blocking)
      if (nodesValidation.warning) {
        setWarnings([{ message: nodesValidation.message, suggestion: nodesValidation.suggestion }]);
      }

      // Step 6: Detect unsupported patterns
      const patternWarnings = detectUnsupportedPatterns(text);
      if (patternWarnings.length > 0) {
        setWarnings(prev => [...prev, ...patternWarnings]);
      }

      // Find root node
      const rootId = Object.keys(parsedNodes)[0];
      
      onFileLoaded({
        fileName,
        code: text,
        nodes: parsedNodes,
        rootId,
        warnings: patternWarnings
      });

      // Don't close immediately if there are warnings - let user review
      if (warnings.length === 0 && patternWarnings.length === 0) {
        onClose();
      }
    } catch (err) {
      console.error('[RealFileLoader] Validation failed:', err);
      setError(err.message || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await parseFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await parseFile(e.target.files[0]);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Open Your .tsx File</h2>
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
          <p className="modal-description">
            Load a real .tsx or .jsx component from your project to edit on the canvas and in code. Or close this and try the demo first.
          </p>

          <div
            className={`file-drop-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".tsx,.jsx"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            
            {loading ? (
              <div className="file-drop-message">
                <span className="file-drop-icon">⏳</span>
                <p>Validating and parsing component...</p>
              </div>
            ) : error ? (
              <div className="file-drop-message error">
                <span className="file-drop-icon">⚠️</span>
                <pre className="error-details">{error}</pre>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setError(null)}
                >
                  Try Again
                </button>
              </div>
            ) : warnings.length > 0 ? (
              <div className="file-drop-message warning">
                <span className="file-drop-icon">✅</span>
                <div className="warnings-list">
                  <p><strong>File loaded successfully with limitations:</strong></p>
                  {warnings.map((warning, idx) => (
                    <div key={idx} className="warning-item">
                      <p>{warning.message}</p>
                      {warning.suggestion && <p className="warning-suggestion">💡 {warning.suggestion}</p>}
                      {warning.example && <pre className="warning-example">{warning.example}</pre>}
                    </div>
                  ))}
                  <p className="warning-note">Your component is loaded and working — these are just scope notes.</p>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onClose}
                >
                  Got it
                </button>
              </div>
            ) : (
              <div className="file-drop-message">
                <span className="file-drop-icon">📄</span>
                <p>Drag & drop a .tsx or .jsx file here</p>
                <p className="file-drop-or">or</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleChooseFile}
                >
                  Choose File
                </button>
              </div>
            )}
          </div>

          <div className="file-requirements">
            <h3>Requirements:</h3>
            <ul>
              <li>Component must have stable <code>id="..."</code> attributes on elements</li>
              <li>Use inline <code>style=&#123;&#123;...&#125;&#125;</code> for canvas-editable properties</li>
              <li>Tailwind classes are preserved but not editable on canvas</li>
            </ul>
            <p className="help-text">
              See <a href="https://github.com/kevinhorek/bluepainter-studio/blob/main/AST_SCOPE.md" target="_blank" rel="noopener noreferrer">AST_SCOPE.md</a> for full details.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
