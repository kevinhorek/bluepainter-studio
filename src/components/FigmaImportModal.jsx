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
      let result;

      if (tab === 'url') {
        const trimmedToken = token.trim();
        const trimmedFileUrl = fileUrl.trim();
        const trimmedNodeUrl = nodeUrl.trim();
        
        if (!trimmedToken) {
          throw new Error('Figma personal access token is required. Get one at figma.com/developers/api#access-tokens with file_content:read scope. See FIGMA_TOKEN.md for detailed setup.');
        }
        if (!trimmedFileUrl) {
          throw new Error('Figma file URL is required. Paste a URL like https://www.figma.com/design/ABC123/My-File');
        }
        if (!parseFigmaFileKey(trimmedFileUrl)) {
          throw new Error('Invalid Figma file URL format. Expected: https://www.figma.com/design/ABC123/My-File (or /file/ or /proto/). Copy the URL from your browser address bar.');
        }
        
        saveFigmaToken(trimmedToken);
        
        result = await importFromFigmaUrl({
          token: trimmedToken,
          fileUrl: trimmedFileUrl,
          nodeUrl: trimmedNodeUrl || undefined
        });
      } else {
        const trimmedJson = jsonPaste.trim();
        
        if (!trimmedJson) {
          throw new Error('Figma JSON is required. Paste the response from GET /v1/files/:key API call or a Figma plugin export.');
        }
        if (trimmedJson.length < 100) {
          throw new Error('JSON is too short (expected at least 100 characters). Ensure you copied the complete API response, not just a fragment.');
        }
        
        result = importFromFigmaJsonString(trimmedJson);
      }

      if (!result.nodes || Object.keys(result.nodes).length === 0) {
        throw new Error('Import returned no nodes. The frame may be empty or contain only unsupported node types (images, gradients, vectors). See FIGMA_IMPORT.md for supported types.');
      }
      
      if (result.nodeCount === 1) {
        console.warn('Import resulted in only 1 node (root). Frame appears empty or contains only unsupported children.');
        onNotify?.(`⚠️ Imported "${result.frameName || 'frame'}" but it appears empty. Check that the frame contains text, shapes, or auto-layout containers.`);
      } else if (result.nodeCount > 1000) {
        console.warn(`Large import: ${result.nodeCount} nodes. Canvas may render slowly.`);
        onNotify?.(`Imported "${result.frameName || 'frame'}" — ${result.nodeCount} layers (large import, may be slow)`);
      } else {
        onNotify?.(`✓ Imported "${result.frameName || 'frame'}" — ${result.nodeCount} layers`);
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
      console.error('Figma import error:', e);
      const errorMsg = e.message || 'Import failed with unknown error';
      setError(errorMsg);
      
      if (errorMsg.includes('API not found') || errorMsg.includes('endpoint')) {
        onNotify?.('⚠️ API unavailable. Use "Paste JSON" tab or deploy API.');
      } else if (errorMsg.includes('timeout') || errorMsg.includes('rate limit')) {
        onNotify?.('⚠️ ' + errorMsg.split('.')[0]);
      } else {
        onNotify?.('❌ Import failed: ' + errorMsg.split('.')[0]);
      }
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

          {error && (
            <div className="export-error" style={{ 
              whiteSpace: 'pre-wrap', 
              maxHeight: '150px', 
              overflowY: 'auto',
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '4px'
            }}>
              <strong>Import failed:</strong>
              <div style={{ marginTop: '4px', fontSize: '0.9em' }}>{error}</div>
              {error.includes('token') && (
                <div style={{ marginTop: '8px', fontSize: '0.85em', color: '#dc2626' }}>
                  💡 Get a token at <a href="https://www.figma.com/developers/api#access-tokens" target="_blank" rel="noreferrer" style={{ color: '#dc2626', textDecoration: 'underline' }}>figma.com/developers</a>
                </div>
              )}
              {(error.includes('API not found') || error.includes('endpoint')) && (
                <div style={{ marginTop: '8px', fontSize: '0.85em', color: '#dc2626' }}>
                  💡 Use the "Paste JSON" tab to import without API access
                </div>
              )}
            </div>
          )}

          <button 
            type="button" 
            className="export-download-btn" 
            onClick={handleImport} 
            disabled={importing || (tab === 'url' && (!token.trim() || !fileUrl.trim()))}
            style={{ opacity: importing || (tab === 'url' && (!token.trim() || !fileUrl.trim())) ? 0.6 : 1 }}
          >
            {importing ? 'Importing from Figma…' : 'Import to canvas'}
          </button>

          <p className="export-modal-note deploy-api-note">
            <strong>URL import</strong> requires <code>/api/figma-import</code>. On localhost run <code>npx vercel dev</code> or use the live demo. If API unavailable, use <strong>Paste JSON</strong> tab (no API required).
          </p>
          
          <p className="export-modal-note" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>
            <strong>⚠️ Import-only:</strong> BluePainter v2 is <strong>one-way</strong>. Changes in BluePainter do NOT sync back to Figma. See <a href="https://github.com/kevinhorek/bluepainter-studio/blob/main/FIGMA_IMPORT.md" target="_blank" rel="noreferrer" style={{ color: '#64748b' }}>FIGMA_IMPORT.md</a> for limits and <a href="https://github.com/kevinhorek/bluepainter-studio/blob/main/SPEC.md" target="_blank" rel="noreferrer" style={{ color: '#64748b' }}>SPEC.md</a> for roadmap.
          </p>
        </div>
      </div>
    </div>
  );
}
