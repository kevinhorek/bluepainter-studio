import { useState } from 'react';
import { downloadProjectExport, getExportPreview } from '../utils/projectExport';
import {
  pushProjectToGithub,
  deployProjectToVercel,
  pushAndDeploy
} from '../utils/remoteDeploy';
import {
  loadGithubToken,
  saveGithubToken,
  loadVercelToken,
  saveVercelToken,
  maskToken
} from '../utils/deployCredentials';

const TABS = [
  { id: 'download', label: 'Download' },
  { id: 'github', label: 'GitHub' },
  { id: 'vercel', label: 'Vercel' },
  { id: 'both', label: 'Push & Deploy' }
];

function DeployResult({ result, onClose }) {
  return (
    <div className="export-modal-body">
      <div className="export-success-icon">✓</div>
      <h3>Deployed successfully</h3>
      {result.github && (
        <p className="export-modal-lead">
          GitHub:{' '}
          <a href={result.github.repoUrl} target="_blank" rel="noreferrer">{result.github.repoUrl}</a>
        </p>
      )}
      {result.vercel && (
        <p className="export-modal-lead">
          Vercel:{' '}
          {result.vercel.deploymentUrl ? (
            <a href={result.vercel.deploymentUrl} target="_blank" rel="noreferrer">{result.vercel.deploymentUrl}</a>
          ) : (
            <a href={result.vercel.inspectorUrl} target="_blank" rel="noreferrer">View deployment</a>
          )}
          {result.vercel.readyState && (
            <span className="deploy-status-badge"> · {result.vercel.readyState}</span>
          )}
        </p>
      )}
      {result.download && (
        <p className="export-modal-lead">{result.download.projectName}.zip downloaded</p>
      )}
      <button type="button" className="export-download-btn" onClick={onClose}>Done</button>
    </div>
  );
}

export default function ExportDeployModal({ isOpen, onClose, nodesByFile, onExported }) {
  const [tab, setTab] = useState('download');
  const [projectName, setProjectName] = useState('my-bluepainter-app');
  const [repoName, setRepoName] = useState('');
  const [githubToken, setGithubToken] = useState(() => loadGithubToken());
  const [vercelToken, setVercelToken] = useState(() => loadVercelToken());
  const [isPrivate, setIsPrivate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const preview = getExportPreview(nodesByFile);
  const effectiveRepo = repoName.trim() || projectName.trim();

  const resetAndClose = () => {
    setResult(null);
    setError('');
    onClose();
  };

  const persistTokens = () => {
    saveGithubToken(githubToken.trim());
    saveVercelToken(vercelToken.trim());
  };

  const handleDownload = async () => {
    setBusy(true);
    setError('');
    try {
      const dl = await downloadProjectExport(nodesByFile, projectName);
      setResult({ download: dl });
      onExported?.(dl);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleGithub = async () => {
    if (!githubToken.trim()) {
      setError('Add a GitHub personal access token (repo scope)');
      return;
    }
    setBusy(true);
    setError('');
    persistTokens();
    try {
      const github = await pushProjectToGithub({
        nodesByFile,
        projectName,
        githubToken: githubToken.trim(),
        repoName: effectiveRepo,
        isPrivate
      });
      setResult({ github });
      onExported?.(github);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleVercel = async () => {
    if (!vercelToken.trim()) {
      setError('Add a Vercel token (Account → Tokens)');
      return;
    }
    setBusy(true);
    setError('');
    persistTokens();
    try {
      const vercel = await deployProjectToVercel({
        nodesByFile,
        projectName: effectiveRepo,
        vercelToken: vercelToken.trim()
      });
      setResult({ vercel });
      onExported?.(vercel);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleBoth = async () => {
    if (!githubToken.trim() || !vercelToken.trim()) {
      setError('Both GitHub and Vercel tokens are required');
      return;
    }
    setBusy(true);
    setError('');
    persistTokens();
    try {
      const out = await pushAndDeploy({
        nodesByFile,
        projectName,
        githubToken: githubToken.trim(),
        vercelToken: vercelToken.trim(),
        repoName: effectiveRepo,
        isPrivate
      });
      setResult(out);
      onExported?.(out);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePrimary = () => {
    if (tab === 'download') return handleDownload();
    if (tab === 'github') return handleGithub();
    if (tab === 'vercel') return handleVercel();
    return handleBoth();
  };

  const primaryLabel = {
    download: busy ? 'Building zip…' : 'Download project (.zip)',
    github: busy ? 'Pushing to GitHub…' : 'Push to GitHub',
    vercel: busy ? 'Deploying to Vercel…' : 'Deploy to Vercel',
    both: busy ? 'Pushing & deploying…' : 'Push to GitHub & deploy to Vercel'
  }[tab];

  return (
    <div className="export-modal-overlay" onClick={resetAndClose}>
      <div className="export-modal export-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h2>Export & deploy your app</h2>
          <button type="button" className="detail-drawer-close" onClick={resetAndClose}>×</button>
        </div>

        {result ? (
          <DeployResult result={result} onClose={resetAndClose} />
        ) : (
          <>
            <div className="mk-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`mk-tab ${tab === t.id ? 'active' : ''}`}
                  onClick={() => { setTab(t.id); setError(''); }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="export-modal-body">
              <p className="export-modal-lead">
                {tab === 'download' && 'Download a Vite + React project from your current design.'}
                {tab === 'github' && 'Create or update a GitHub repo with your exported project files.'}
                {tab === 'vercel' && 'Deploy directly to Vercel — builds and hosts your app.'}
                {tab === 'both' && 'Push to GitHub, then deploy the same project to Vercel in one step.'}
              </p>

              <label className="export-label">
                Project name
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="my-bluepainter-app"
                />
              </label>

              {tab !== 'download' && (
                <label className="export-label">
                  GitHub repo name {tab === 'vercel' ? '(optional for Vercel-only)' : ''}
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder={projectName || 'my-bluepainter-app'}
                  />
                </label>
              )}

              {(tab === 'github' || tab === 'both') && (
                <>
                  <label className="export-label">
                    GitHub token
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_… (repo scope)"
                    />
                    {githubToken && <span className="token-hint">Saved locally · {maskToken(githubToken)}</span>}
                  </label>
                  <label className="mk-checkbox export-private-check">
                    <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                    Private repository
                  </label>
                  <p className="export-modal-note">
                    Create a token at{' '}
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">github.com/settings/tokens</a>
                    {' '}with <code>repo</code> scope. Stored in your browser only.
                  </p>
                </>
              )}

              {(tab === 'vercel' || tab === 'both') && (
                <>
                  <label className="export-label">
                    Vercel token
                    <input
                      type="password"
                      value={vercelToken}
                      onChange={(e) => setVercelToken(e.target.value)}
                      placeholder="vercel_…"
                    />
                    {vercelToken && <span className="token-hint">Saved locally · {maskToken(vercelToken)}</span>}
                  </label>
                  <p className="export-modal-note">
                    Create at{' '}
                    <a href="https://vercel.com/account/settings/tokens" target="_blank" rel="noreferrer">vercel.com/account/settings/tokens</a>
                    . Vercel runs <code>npm install && npm run build</code> on their servers.
                  </p>
                </>
              )}

              {tab === 'download' && (
                <div className="export-preview">
                  <span className="export-preview-label">Includes</span>
                  <ul>
                    {preview.map((f) => (
                      <li key={f.path}><code>{f.path}</code> · {f.lines} lines</li>
                    ))}
                    <li><code>package.json</code> · Vite + React</li>
                    <li><code>vercel.json</code> · deploy config</li>
                  </ul>
                </div>
              )}

              {error && <p className="export-error">{error}</p>}

              <button type="button" className="export-download-btn" onClick={handlePrimary} disabled={busy}>
                {primaryLabel}
              </button>

              <p className="export-modal-note deploy-api-note">
                Push &amp; deploy uses BluePainter API routes. On localhost, run <code>npx vercel dev</code> or use the live demo.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
