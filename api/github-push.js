import { ensureGithubRepo, pushFilesToGithub } from './_lib/github.js';
import { preflight, readJsonBody } from './_lib/http.js';

export default async function handler(req, res) {
  if (preflight(req, res, { blockDisallowedOrigin: true })) return;

  try {
    const parsed = readJsonBody(req);
    if (!parsed.ok) return res.status(400).json({ error: 'Invalid JSON body' });
    const { token, repoName, files, message, owner, isPrivate = true } = parsed.body;

    if (typeof token !== 'string' || !token.trim()) return res.status(400).json({ error: 'GitHub token is required' });
    if (typeof repoName !== 'string' || !repoName.trim()) return res.status(400).json({ error: 'Repository name is required' });
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
