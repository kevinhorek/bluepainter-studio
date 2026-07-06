import { buildProjectFileMap } from './projectExport';
import { buildMarketingStaticFileMap } from './marketingKit';

async function parseErrorResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (res.status === 404) {
    return 'Deploy API not found — use production (vercel.app) or run `npx vercel dev` locally.';
  }
  return data.error || `Request failed (${res.status})`;
}

export function getProjectFilesForDeploy(nodesByFile, projectName) {
  return buildProjectFileMap(nodesByFile, projectName);
}

export async function pushProjectToGithub({ nodesByFile, projectName, githubToken, repoName, isPrivate = true }) {
  const { files, projectName: safeName } = buildProjectFileMap(nodesByFile, repoName || projectName);

  const res = await fetch('/api/github-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: githubToken,
      repoName: repoName || safeName,
      files,
      isPrivate,
      message: `Deploy ${safeName} from BluePainter Studio`
    })
  });

  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function deployProjectToVercel({ nodesByFile, projectName, vercelToken, teamId }) {
  const { files, projectName: safeName } = buildProjectFileMap(nodesByFile, projectName);

  const res = await fetch('/api/vercel-deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: vercelToken,
      projectName: safeName,
      files,
      teamId: teamId || undefined
    })
  });

  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function pushAndDeploy({ nodesByFile, projectName, githubToken, vercelToken, repoName, isPrivate = true }) {
  const github = await pushProjectToGithub({
    nodesByFile,
    projectName,
    githubToken,
    repoName,
    isPrivate
  });

  const vercel = await deployProjectToVercel({
    nodesByFile,
    projectName: repoName || projectName,
    vercelToken
  });

  return { github, vercel };
}

export async function pushMarketingToGithub({ nodesByFile, githubToken, repoName, toneId = 'default', isPrivate = true }) {
  const { projectName, files } = buildMarketingStaticFileMap(nodesByFile, toneId);

  const res = await fetch('/api/github-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: githubToken,
      repoName: repoName || projectName,
      files,
      isPrivate,
      message: 'Deploy marketing landing from BluePainter Studio'
    })
  });

  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function deployMarketingToVercel({ nodesByFile, vercelToken, projectName, toneId = 'default' }) {
  const { projectName: safeName, files } = buildMarketingStaticFileMap(nodesByFile, toneId);
  const name = projectName || safeName;

  const res = await fetch('/api/vercel-deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: vercelToken,
      projectName: name,
      files,
      staticSite: true
    })
  });

  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}
