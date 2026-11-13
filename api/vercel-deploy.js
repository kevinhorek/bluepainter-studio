import { preflight, readJsonBody } from './_lib/http.js';

export default async function handler(req, res) {
  if (preflight(req, res, { blockDisallowedOrigin: true })) return;

  try {
    const parsed = readJsonBody(req);
    if (!parsed.ok) return res.status(400).json({ error: 'Invalid JSON body' });
    const { token, projectName, files, teamId, staticSite = false } = parsed.body;

    if (typeof token !== 'string' || !token.trim()) return res.status(400).json({ error: 'Vercel token is required' });
    if (typeof projectName !== 'string' || !projectName.trim()) return res.status(400).json({ error: 'Project name is required' });
    if (!files || typeof files !== 'object' || !Object.keys(files).length) {
      return res.status(400).json({ error: 'No files to deploy' });
    }

    const safeName = projectName.trim().replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 52).toLowerCase();
    const vercelFiles = Object.entries(files).map(([file, data]) => ({
      file,
      data: typeof data === 'string' ? data : String(data)
    }));

    const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
    const deployRes = await fetch(`https://api.vercel.com/v13/deployments${query}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: safeName,
        files: vercelFiles,
        projectSettings: staticSite
          ? {
              framework: null,
              buildCommand: null,
              outputDirectory: '.',
              installCommand: null
            }
          : {
              framework: 'vite',
              buildCommand: 'npm run build',
              outputDirectory: 'dist',
              installCommand: 'npm install',
              devCommand: 'npm run dev'
            },
        target: 'production'
      })
    });

    const deploy = await deployRes.json();
    if (!deployRes.ok) {
      throw new Error(deploy.error?.message || deploy.message || 'Vercel deployment failed');
    }

    const deploymentUrl = deploy.url
      ? `https://${deploy.url}`
      : deploy.alias?.[0]
        ? `https://${deploy.alias[0]}`
        : null;

    return res.status(200).json({
      deploymentId: deploy.id,
      deploymentUrl,
      inspectorUrl: deploy.inspectorUrl || `https://vercel.com/deployments/${deploy.id}`,
      projectName: safeName,
      readyState: deploy.readyState,
      fileCount: vercelFiles.length
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Vercel deploy failed' });
  }
}
