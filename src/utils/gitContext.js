/**
 * Git Context Detection for Studio (Browser)
 * 
 * Extension equivalent: extension/lib/gitContext.js
 * 
 * Since the Studio runs in a browser without Node.js access, git context
 * must be provided via:
 * 1. URL parameters (one-time setup)
 * 2. localStorage (persistence)
 * 3. Manual settings UI (user input)
 */

const GIT_CONTEXT_KEY = 'bluepainter-git-context';

/**
 * Parse git context from URL parameters
 * Supports: ?repo=...&branch=...&userName=...&userEmail=...&commitSha=...
 * 
 * @returns {Object|null} Parsed git context or null if no params
 */
function parseGitContextFromURL() {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  const repo = params.get('repo');
  const branch = params.get('branch');
  const userName = params.get('userName');
  const userEmail = params.get('userEmail');
  const commitSha = params.get('commitSha');
  
  // Only return if at least one param is present
  if (!repo && !branch && !userName && !userEmail && !commitSha) {
    return null;
  }
  
  return {
    repoUrl: repo || null,
    branch: branch || null,
    userName: userName || null,
    userEmail: userEmail || null,
    commitSha: commitSha || null
  };
}

/**
 * Load git context from localStorage
 * 
 * @returns {Object|null} Stored git context or null
 */
function loadGitContextFromStorage() {
  try {
    const raw = localStorage.getItem(GIT_CONTEXT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Save git context to localStorage
 * 
 * @param {Object} context - Git context object
 */
function saveGitContextToStorage(context) {
  try {
    localStorage.setItem(GIT_CONTEXT_KEY, JSON.stringify(context));
  } catch (err) {
    console.warn('[GitContext] Failed to save to localStorage:', err);
  }
}

/**
 * Get current git context
 * Priority: URL params > localStorage > empty
 * 
 * @returns {Object} Git context with nullable fields
 */
export function getGitContext() {
  // Check URL first (allows one-time setup via link)
  const urlContext = parseGitContextFromURL();
  if (urlContext) {
    // Save to localStorage for future sessions
    saveGitContextToStorage(urlContext);
    return urlContext;
  }
  
  // Fall back to stored context
  const storedContext = loadGitContextFromStorage();
  if (storedContext) {
    return storedContext;
  }
  
  // No context available
  return {
    repoUrl: null,
    branch: null,
    userName: null,
    userEmail: null,
    commitSha: null
  };
}

/**
 * Update git context (partial update supported)
 * 
 * @param {Object} updates - Fields to update
 */
export function updateGitContext(updates) {
  const current = getGitContext();
  const updated = {
    ...current,
    ...updates
  };
  saveGitContextToStorage(updated);
  return updated;
}

/**
 * Clear git context
 */
export function clearGitContext() {
  try {
    localStorage.removeItem(GIT_CONTEXT_KEY);
  } catch (err) {
    console.warn('[GitContext] Failed to clear from localStorage:', err);
  }
}

/**
 * Check if git context is configured
 * 
 * @returns {boolean} True if any field is set
 */
export function hasGitContext() {
  const ctx = getGitContext();
  return !!(ctx.repoUrl || ctx.branch || ctx.userName || ctx.userEmail || ctx.commitSha);
}

/**
 * Get git context summary for display
 * 
 * @returns {string} Human-readable summary
 */
export function getGitContextSummary() {
  const ctx = getGitContext();
  
  if (!hasGitContext()) {
    return 'No git context configured';
  }
  
  const parts = [];
  if (ctx.userName) parts.push(ctx.userName);
  if (ctx.repoUrl) {
    // Extract org/repo from URL
    const match = ctx.repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    if (match) {
      parts.push(match[1]);
    } else {
      parts.push(ctx.repoUrl);
    }
  }
  if (ctx.branch) parts.push(ctx.branch);
  
  return parts.join(' • ') || 'Partial git context';
}
