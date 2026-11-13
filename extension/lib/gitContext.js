const { execSync } = require('child_process');
const path = require('path');

function execGit(args, cwd) {
  try {
    return execSync(`git ${args}`, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
  } catch {
    return null;
  }
}

function getUserName(workspacePath) {
  const name = execGit('config user.name', workspacePath);
  return name || null;
}

function getUserEmail(workspacePath) {
  const email = execGit('config user.email', workspacePath);
  return email || null;
}

function getRepoUrl(workspacePath) {
  const remote = execGit('config --get remote.origin.url', workspacePath);
  if (!remote) return null;

  if (remote.startsWith('git@')) {
    return remote.replace(/^git@([^:]+):(.+?)(\.git)?$/, 'https://$1/$2');
  }
  
  return remote.replace(/\.git$/, '');
}

function getCurrentBranch(workspacePath) {
  return execGit('rev-parse --abbrev-ref HEAD', workspacePath);
}

function getCommitSha(workspacePath) {
  return execGit('rev-parse HEAD', workspacePath);
}

function getWorkspaceRoot(filePath) {
  if (!filePath) return null;
  
  try {
    const dir = path.dirname(filePath);
    const gitRoot = execGit('rev-parse --show-toplevel', dir);
    return gitRoot || dir;
  } catch {
    return path.dirname(filePath);
  }
}

function getGitContext(filePath) {
  const workspaceRoot = getWorkspaceRoot(filePath);
  if (!workspaceRoot) {
    return {
      userName: null,
      userEmail: null,
      repoUrl: null,
      branch: null,
      commitSha: null
    };
  }

  return {
    userName: getUserName(workspaceRoot),
    userEmail: getUserEmail(workspaceRoot),
    repoUrl: getRepoUrl(workspaceRoot),
    branch: getCurrentBranch(workspaceRoot),
    commitSha: getCommitSha(workspaceRoot)
  };
}

module.exports = {
  getGitContext,
  getUserName,
  getUserEmail,
  getRepoUrl,
  getCurrentBranch,
  getCommitSha,
  getWorkspaceRoot
};
