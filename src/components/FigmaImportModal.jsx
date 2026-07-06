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
        if (!token.trim()) throw new Error('Figma personal access token is required');
        if (!parseFigmaFileKey(fileUrl)) throw new Error('Paste a valid Figma file URL');
        result = await importFromFigmaUrl({
          token: token.trim(),
          fileUrl: fileUrl.trim(),
          nodeUrl: nodeUrl.trim() || undefined
        });
      } else {
        if (!jsonPaste.trim()) throw new Error('Paste Figma JSON from the API or plugin export');
        result = importFromFigmaJsonString(jsonPaste);
      }

      onImported?.({
        targetFile,
        nodes: result.nodes,
        rootId: result.rootId,
        viewport: result.viewport,
        frameName: result.frameName,
        nodeCount: result.nodeCount
      });
      onClose();
    } catch (e) {
      setError(e.message);
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
                {' '}with <code>file_content:read</code>. Token stays in your browser.
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
            URL import uses <code>/api/figma-import</code>. On localhost run <code>npx vercel dev</code> or use the live demo.
          </p>
        </div>
      </div>
    </div>
  );
}
