import { useState, useRef } from 'react';
import { parseTSX } from '../utils/syncEngine';
import { getEmptyFigmaImportNodes } from '../utils/figmaImport';

export default function RealFileLoader({ isOpen, onClose, onFileLoaded }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

    try {
      const text = await file.text();
      
      // Validate file extension
      const fileName = file.name;
      if (!fileName.endsWith('.tsx') && !fileName.endsWith('.jsx')) {
        throw new Error('Only .tsx and .jsx files are supported');
      }

      // Parse with AST engine
      const baseNodes = getEmptyFigmaImportNodes();
      const parsedNodes = parseTSX(text, baseNodes);

      if (!parsedNodes || Object.keys(parsedNodes).length === 0) {
        throw new Error('Failed to parse component. Ensure elements have stable id="..." attributes. See AST_SCOPE.md for requirements.');
      }

      // Check for common unsupported patterns
      const nodeCount = Object.keys(parsedNodes).length;
      if (nodeCount < 2) {
        console.warn('[RealFileLoader] Only 1 node found - component may not have sufficient id attributes');
      }

      // Find root node (typically the first or a page-level node)
      const rootId = Object.keys(parsedNodes)[0];
      
      onFileLoaded({
        fileName,
        code: text,
        nodes: parsedNodes,
        rootId
      });

      onClose();
    } catch (err) {
      console.error('[RealFileLoader] Parse error:', err);
      
      // Provide helpful error messages for common issues
      let errorMessage = err.message || 'Failed to parse file';
      
      if (err.message && err.message.includes('Unexpected token')) {
        errorMessage = 'Syntax error in file. Please ensure the component is valid TSX/JSX.';
      } else if (err.message && err.message.includes('Tailwind')) {
        errorMessage = 'Tailwind-only components are not fully supported. Add inline style={{}} attributes for canvas editing. See AST_SCOPE.md.';
      } else if (err.message && err.message.includes('CSS Modules')) {
        errorMessage = 'CSS Modules are not supported. Use inline style={{}} for canvas-editable properties. See AST_SCOPE.md.';
      }
      
      setError(errorMessage);
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
          <h2>Open Component File</h2>
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
            Load a .tsx or .jsx file from your project. BluePainter will parse it into the canvas for visual editing.
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
                <p>Parsing component...</p>
              </div>
            ) : error ? (
              <div className="file-drop-message error">
                <span className="file-drop-icon">⚠️</span>
                <p><strong>Error:</strong> {error}</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setError(null)}
                >
                  Try Again
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
