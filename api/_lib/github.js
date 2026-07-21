/** Shared GitHub Git API push for serverless routes. */
export async function pushFilesToGithub(token, owner, repo, files, message = 'Update from BluePainter') {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };

  let parentSha = null;
  const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, { headers });
  if (refRes.ok) {
    const refData = await refRes.json();
    parentSha = refData.object.sha;
  }

  const treeItems = [];
  for (const [path, content] of Object.entries(files)) {
    const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content, encoding: 'utf-8' })
    });
    const blob = await blobRes.json();
    if (!blobRes.ok) {
      throw new Error(blob.message || `Failed to create blob for ${path}`);
    }
    treeItems.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const treeBody = { tree: treeItems };
  if (parentSha) {
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${parentSha}`, { headers });
    if (commitRes.ok) {
      const commitData = await commitRes.json();
      treeBody.base_tree = commitData.tree.sha;
    }
  }

  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify(treeBody)
  });
  const tree = await treeRes.json();
  if (!treeRes.ok) throw new Error(tree.message || 'Failed to create tree');

  const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      tree: tree.sha,
      ...(parentSha ? { parents: [parentSha] } : {})
    })
  });
  const commit = await commitRes.json();
  if (!commitRes.ok) throw new Error(commit.message || 'Failed to create commit');

  if (parentSha) {
    const updateRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: commit.sha, force: false })
    });
    if (!updateRes.ok) {
      const err = await updateRes.json();
      throw new Error(err.message || 'Failed to update main branch');
    }
  } else {
    const createRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ref: 'refs/heads/main', sha: commit.sha })
    });
    if (!createRefRes.ok) {
      const err = await createRefRes.json();
      throw new Error(err.message || 'Failed to create main branch');
    }
  }

  return { commitSha: commit.sha, branch: 'main' };
}

export async function ensureGithubRepo(token, name, { private: isPrivate = true, owner } = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };

  const userRes = await fetch('https://api.github.com/user', { headers });
  if (!userRes.ok) throw new Error('Invalid GitHub token');
  const user = await userRes.json();
  const repoOwner = owner || user.login;

  const createRes = await fetch(
    owner && owner !== user.login
      ? `https://api.github.com/orgs/${owner}/repos`
      : 'https://api.github.com/user/repos',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, private: isPrivate, auto_init: false })
    }
  );

  if (createRes.status !== 422 && !createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.message || 'Failed to create repository');
  }

  return { owner: repoOwner, repo: name, repoUrl: `https://github.com/${repoOwner}/${name}` };
}
