import { useState } from 'react';
import { pushMarketingToGithub, deployMarketingToVercel } from '../utils/remoteDeploy';
import {
  loadGithubToken,
  saveGithubToken,
  loadVercelToken,
  saveVercelToken,
  maskToken
} from '../utils/deployCredentials';

export default function MarketingDeployButtons({ nodesByFile, toneId, onNotify }) {
  const [githubToken, setGithubToken] = useState(() => loadGithubToken());
  const [vercelToken, setVercelToken] = useState(() => loadVercelToken());
  const [repoName, setRepoName] = useState('');
  const [busy, setBusy] = useState('');
  const [showTokens, setShowTokens] = useState(false);

  const persist = () => {
    saveGithubToken(githubToken.trim());
    saveVercelToken(vercelToken.trim());
  };

  const handleGithub = async () => {
    if (!githubToken.trim()) {
      onNotify?.('Add GitHub token first');
      setShowTokens(true);
      return;
    }
    setBusy('github');
    persist();
    try {
      const result = await pushMarketingToGithub({
        nodesByFile,
        githubToken: githubToken.trim(),
        repoName: repoName.trim() || undefined,
        toneId
      });
      onNotify?.(`Pushed to ${result.repoUrl}`);
      window.open(result.repoUrl, '_blank');
    } catch (e) {
      onNotify?.(e.message);
    } finally {
      setBusy('');
    }
  };

  const handleVercel = async () => {
    if (!vercelToken.trim()) {
      onNotify?.('Add Vercel token first');
      setShowTokens(true);
      return;
    }
    setBusy('vercel');
    persist();
    try {
      const result = await deployMarketingToVercel({
        nodesByFile,
        vercelToken: vercelToken.trim(),
        projectName: repoName.trim() || undefined,
        toneId
      });
      onNotify?.('Landing deployed to Vercel');
      if (result.deploymentUrl) window.open(result.deploymentUrl, '_blank');
    } catch (e) {
      onNotify?.(e.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="marketing-deploy-block">
      <span className="export-preview-label">Deploy static landing</span>
      <label className="export-label">
        Repo / project name
        <input
          type="text"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          placeholder="acme-landing"
        />
      </label>
      <button type="button" className="ai-settings-toggle" onClick={() => setShowTokens(!showTokens)}>
        {showTokens ? 'Hide tokens' : 'GitHub & Vercel tokens'}
        {(githubToken || vercelToken) && !showTokens && (
          <span className="token-hint">{maskToken(githubToken || vercelToken)}</span>
        )}
      </button>
      {showTokens && (
        <div className="marketing-deploy-tokens">
          <input type="password" placeholder="GitHub token (ghp_…)" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} />
          <input type="password" placeholder="Vercel token" value={vercelToken} onChange={(e) => setVercelToken(e.target.value)} />
        </div>
      )}
      <div className="marketing-deploy-btns">
        <button type="button" className="mk-copy-btn" onClick={handleGithub} disabled={!!busy}>
          {busy === 'github' ? 'Pushing…' : 'Push to GitHub'}
        </button>
        <button type="button" className="mk-copy-btn" onClick={handleVercel} disabled={!!busy}>
          {busy === 'vercel' ? 'Deploying…' : 'Deploy to Vercel'}
        </button>
      </div>
    </div>
  );
}
