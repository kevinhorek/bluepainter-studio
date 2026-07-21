import { ensureGithubRepo, pushFilesToGithub } from './_lib/github.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { token, repoName, files, message, owner, isPrivate = true } = body || {};

    if (!token?.trim()) return res.status(400).json({ error: 'GitHub token is required' });
    if (!repoName?.trim()) return res.status(400).json({ error: 'Repository name is required' });
    if (!files || typeof files !== 'object' || !Object.keys(files).length) {
      return res.status(400).json({ error: 'No files to push' });
    }

    const safeName = repoName.trim().replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 100);
    const { owner: repoOwner, repoUrl } = await ensureGithubRepo(token.trim(), safeName, { private: isPrivate, owner });

    const result = await pushFilesToGithub(
      token.trim(),
      repoOwner,
      safeName,
      files,
      message || 'Deploy from BluePainter'
    );

    return res.status(200).json({
      repoUrl,
      owner: repoOwner,
      repo: safeName,
      branch: result.branch,
      commitSha: result.commitSha,
      fileCount: Object.keys(files).length
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'GitHub push failed' });
  }
}
