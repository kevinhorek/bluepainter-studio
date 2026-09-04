import { useState } from 'react';
import { importFromFigmaUrl, importFromFigmaJsonString, parseFigmaFileKey } from '../utils/figmaImportClient';
import { loadFigmaToken, saveFigmaToken, maskToken } from '../utils/figmaStorage';

const TARGETS = [
  { id: 'figma', label: 'New FigmaImport page', description: 'Dedicated import canvas' },
  { id: 'marketing', label: 'Replace MarketingPage', description: 'Use as marketing landing' },
  { id: 'dashboard', label: 'Replace DashboardPage', description: 'Use as app dashboard' }
];

export default function FigmaImportModal({ isOpen, onClose, onImported, onNotify }) {
  const [tab, setTab] = useState('url');
  const [fileUrl, setFileUrl] = useState('');
  const [nodeUrl, setNodeUrl] = useState('');
  const [jsonPaste, setJsonPaste] = useState('');
  const [token, setToken] = useState(() => loadFigmaToken());
  const [targetFile, setTargetFile] = useState('figma');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleImport = async () => {
    setError('');
    setImporting(true);
    try {
      saveFigmaToken(token.trim());
      let result;

      if (tab === 'url') {
        if (!token.trim()) {
          throw new Error('Figma personal access token is required. See FIGMA_TOKEN.md for setup instructions.');
        }
        if (!parseFigmaFileKey(fileUrl)) {
          throw new Error('Paste a valid Figma file URL (e.g. https://www.figma.com/design/ABC123/My-File)');
        }
        result = await importFromFigmaUrl({
          token: token.trim(),
          fileUrl: fileUrl.trim(),
          nodeUrl: nodeUrl.trim() || undefined
        });
      } else {
        if (!jsonPaste.trim()) {
          throw new Error('Paste Figma JSON from the API (GET /v1/files/:key) or plugin export');
        }
        result = importFromFigmaJsonString(jsonPaste);
      }

      if (!result.nodes || Object.keys(result.nodes).length === 0) {
        throw new Error('No content could be imported from this frame. Try a frame with text boxes, rectangles, or auto-layout containers.');
      }
      
      if (result.nodeCount < 2) {
        console.warn('Import resulted in only 1 node (root). Frame may be empty or have unsupported children.');
      }

      onImported?.({
        targetFile,
        nodes: result.nodes,
        rootId: result.rootId,
        viewport: result.viewport,
        frameName: result.frameName,
        nodeCount: result.nodeCount
      });
      onNotify?.(`Imported "${result.frameName || 'frame'}" — ${result.nodeCount} layers`);
      onClose();
    } catch (e) {
      setError(e.message);
      onNotify?.(e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal export-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <div>
            <h2>Import from Figma</h2>
            <p className="mk-subtitle">Pull frames into the canvas — edit and export as React</p>
          </div>
          <button type="button" className="detail-drawer-close" onClick={onClose}>×</button>
        </div>

        <div className="mk-tabs">
          <button type="button" className={`mk-tab ${tab === 'url' ? 'active' : ''}`} onClick={() => setTab('url')}>Figma URL</button>
          <button type="button" className={`mk-tab ${tab === 'json' ? 'active' : ''}`} onClick={() => setTab('json')}>Paste JSON</button>
        </div>

        <div className="export-modal-body">
          <label className="export-label">
            Import into
            <select value={targetFile} onChange={(e) => setTargetFile(e.target.value)}>
              {TARGETS.map((t) => (
                <option key={t.id} value={t.id}>{t.label} — {t.description}</option>
              ))}
            </select>
          </label>

          {tab === 'url' && (
            <>
              <label className="export-label">
                Figma file URL
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://www.figma.com/design/ABC123/My-File"
                />
              </label>
              <label className="export-label">
                Frame URL (optional — import specific frame)
                <input
                  type="url"
                  value={nodeUrl}
                  onChange={(e) => setNodeUrl(e.target.value)}
                  placeholder="Right-click frame → Copy link"
                />
              </label>
              <label className="export-label">
                Figma personal access token
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="figd_…"
                />
                {token && <span className="token-hint">Saved locally · {maskToken(token)}</span>}
              </label>
              <p className="export-modal-note">
                Create a token at{' '}
                <a href="https://www.figma.com/developers/api#access-tokens" target="_blank" rel="noreferrer">figma.com/developers</a>
                {' '}with <code>file_content:read</code> scope. Token stays in your browser (localStorage). See{' '}
                <a href="https://github.com/kevinhorek/bluepainter-studio/blob/main/FIGMA_TOKEN.md" target="_blank" rel="noreferrer">FIGMA_TOKEN.md</a>
                {' '}for detailed setup instructions.
              </p>
              <p className="export-modal-note">
                <strong>Team deployment:</strong> Set <code>FIGMA_TOKEN</code> env var on the API host to skip client-side token entry.
              </p>
            </>
          )}

          {tab === 'json' && (
            <>
              <label className="export-label">
                Figma API JSON
                <textarea
                  className="ai-prompt-input"
                  rows={8}
                  value={jsonPaste}
                  onChange={(e) => setJsonPaste(e.target.value)}
                  placeholder='Paste response from GET /v1/files/:key or plugin export…'
                />
              </label>
              <p className="export-modal-note">
                Use this tab without a token if you already have Figma JSON from Dev Mode, a plugin, or the REST API.
              </p>
            </>
          )}

          {error && <p className="export-error">{error}</p>}

          <button type="button" className="export-download-btn" onClick={handleImport} disabled={importing}>
            {importing ? 'Importing from Figma…' : 'Import to canvas'}
          </button>

          <p className="export-modal-note deploy-api-note">
            URL import requires <code>/api/figma-import</code>. On localhost run <code>npx vercel dev</code> or use the live demo. If API unavailable, use <strong>Paste JSON</strong> tab.
          </p>
          
          <p className="export-modal-note" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>
            <strong>Note:</strong> BluePainter v2 is <strong>import-only</strong>. Changes in BluePainter do NOT sync back to Figma (see SPEC.md for roadmap).
          </p>
        </div>
      </div>
    </div>
  );
}
