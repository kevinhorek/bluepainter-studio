import { useState } from 'react';
import { pushMarketingToGithub, deployMarketingToVercel } from '../utils/remoteDeploy';
import * as creds from '../utils/deployCredentials';
import OAuthSignInButton from './OAuthSignInButton';

const { loadGithubToken, saveGithubToken, loadVercelToken, saveVercelToken, maskToken } = creds;

/** "Remember" starts ticked only when a token is already persisted on this device. */
function tokensRemembered() {
  const checks = [creds.isGithubTokenRemembered, creds.isVercelTokenRemembered].filter((fn) => typeof fn === 'function');
  return checks.length ? checks.some((fn) => fn()) : Boolean(loadGithubToken() || loadVercelToken());
}

export default function MarketingDeployButtons({ nodesByFile, toneId, onNotify }) {
  const [githubToken, setGithubToken] = useState(() => loadGithubToken());
  const [vercelToken, setVercelToken] = useState(() => loadVercelToken());
  // Team an OAuth-issued Vercel token is tied to; empty for a pasted personal token.
  const [vercelTeamId, setVercelTeamId] = useState(() => creds.loadVercelTeamId());
  const [repoName, setRepoName] = useState('');
  const [busy, setBusy] = useState('');
  const [showTokens, setShowTokens] = useState(false);
  const [remember, setRemember] = useState(tokensRemembered);
  const [links, setLinks] = useState([]);

  // Only save filled-in tokens so an empty field can't wipe one saved elsewhere.
  // Unticked "Remember" keeps them for this tab only (sessionStorage).
  const persist = () => {
    if (githubToken.trim()) saveGithubToken(githubToken.trim(), { remember });
    if (vercelToken.trim()) {
      saveVercelToken(vercelToken.trim(), { remember });
      creds.saveVercelTeamId(vercelTeamId, { remember });
    }
  };

  // "Sign in with …" fills the same field a pasted token would, and is saved the same way.
  const handleOAuthToken = (provider) => ({ token, teamId }) => {
    if (provider === 'github') {
      setGithubToken(token);
      saveGithubToken(token, { remember });
    } else {
      setVercelToken(token);
      setVercelTeamId(teamId || '');
      saveVercelToken(token, { remember });
      creds.saveVercelTeamId(teamId || '', { remember });
    }
    onNotify?.(`Signed in with ${provider === 'github' ? 'GitHub' : 'Vercel'}`);
  };

  // window.open() after an await is popup-blocked, so the result is shown as a link instead.
  const addLink = (label, url) => {
    if (!/^https?:\/\//i.test(url || '')) return;
    setLinks((prev) => [{ label, url }, ...prev.filter((l) => l.label !== label)]);
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
      addLink('GitHub', result.repoUrl);
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
        teamId: vercelTeamId,
        projectName: repoName.trim() || undefined,
        toneId
      });
      const liveUrl = result.deploymentUrl || result.inspectorUrl;
      onNotify?.(liveUrl ? `Landing deployed to ${liveUrl}` : 'Landing deployed to Vercel');
      addLink('Vercel', liveUrl);
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
          <OAuthSignInButton provider="github" disabled={!!busy} onToken={handleOAuthToken('github')} onError={onNotify} />
          <input type="password" placeholder="Vercel token" value={vercelToken} onChange={(e) => { setVercelToken(e.target.value); setVercelTeamId(''); }} />
          <OAuthSignInButton provider="vercel" disabled={!!busy} onToken={handleOAuthToken('vercel')} onError={onNotify} />
          <label className="mk-checkbox">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember on this device
          </label>
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
      {links.map((link) => (
        <p key={link.label} className="export-modal-note" role="status">
          {link.label}:{' '}
          <a href={link.url} target="_blank" rel="noreferrer">{link.url}</a>
        </p>
      ))}
    </div>
  );
}
